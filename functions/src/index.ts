import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onDocumentCreated, onDocumentWritten } from 'firebase-functions/v2/firestore';
import { setGlobalOptions } from 'firebase-functions/v2';
import { defineSecret } from 'firebase-functions/params';
import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import Anthropic from '@anthropic-ai/sdk';

initializeApp();
const db = getFirestore();
const adminAuth = getAuth();

// Must match getFunctions(app, 'us-central1') on the client.
setGlobalOptions({ region: 'us-central1' });

// Set with: firebase functions:secrets:set ANTHROPIC_API_KEY
const ANTHROPIC_API_KEY = defineSecret('ANTHROPIC_API_KEY');

type StaffRole = 'admin' | 'support';

/* ────────────────────────────────────────────────────────────
 * createStaffUser — admin-only callable.
 * Creates a Firebase Auth account for a new Admin or Support agent,
 * sets their custom claims, and writes their staff/{uid} doc.
 * ──────────────────────────────────────────────────────────── */
export const createStaffUser = onCall(async request => {
  if (request.auth?.token.role !== 'admin') {
    throw new HttpsError('permission-denied', 'Only admins can create staff accounts.');
  }

  const { email, password, name, role } = (request.data ?? {}) as {
    email?: string;
    password?: string;
    name?: string;
    role?: StaffRole;
  };

  if (!email || !password || password.length < 6 || !name) {
    throw new HttpsError('invalid-argument', 'name, email and a 6+ char password are required.');
  }
  if (role !== 'admin' && role !== 'support') {
    throw new HttpsError('invalid-argument', 'role must be "admin" or "support".');
  }

  const user = await adminAuth.createUser({ email, password, displayName: name });
  await adminAuth.setCustomUserClaims(user.uid, { staff: true, role });
  await db.collection('staff').doc(user.uid).set({
    email,
    name,
    role,
    disabled: false,
    createdAt: FieldValue.serverTimestamp(),
  });

  return { uid: user.uid };
});

/* ────────────────────────────────────────────────────────────
 * claimFirstAdmin — bootstrap callable.
 * The signed-in caller becomes the first admin, but ONLY while the
 * staff collection is still empty. Used once to seed the first admin.
 * ──────────────────────────────────────────────────────────── */
export const claimFirstAdmin = onCall(async request => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'You must be signed in.');
  }
  const existing = await db.collection('staff').limit(1).get();
  if (!existing.empty) {
    throw new HttpsError('failed-precondition', 'An admin already exists.');
  }

  const { uid, token } = request.auth;
  await adminAuth.setCustomUserClaims(uid, { staff: true, role: 'admin' });
  await db.collection('staff').doc(uid).set({
    email: token.email ?? '',
    name: token.name ?? 'Admin',
    role: 'admin',
    disabled: false,
    createdAt: FieldValue.serverTimestamp(),
  });

  return { uid, role: 'admin' };
});

/* ────────────────────────────────────────────────────────────
 * setStaffClaims — keep custom claims in sync with staff/{uid}.
 * Fires whenever a staff doc is created/updated/deleted (e.g. an admin
 * changes a role or disables an account in Firestore).
 * ──────────────────────────────────────────────────────────── */
export const setStaffClaims = onDocumentWritten('staff/{uid}', async event => {
  const uid = event.params.uid;
  const after = event.data?.after;

  if (!after?.exists) {
    // Staff doc deleted — strip their staff claims.
    await adminAuth.setCustomUserClaims(uid, { staff: false, role: null }).catch(() => {});
    return;
  }

  const data = after.data() as { role?: StaffRole; disabled?: boolean };
  const disabled = data.disabled === true;
  await adminAuth.setCustomUserClaims(uid, {
    staff: !disabled,
    role: disabled ? null : data.role ?? 'support',
  });
});

/* ────────────────────────────────────────────────────────────
 * onMessageCreated — maintain conversation metadata.
 * Updates lastMessage / lastMessageAt / unread counters whenever a new
 * message is appended, so clients never write those fields directly.
 * ──────────────────────────────────────────────────────────── */
export const onMessageCreated = onDocumentCreated(
  'conversations/{cid}/messages/{mid}',
  async event => {
    const msg = event.data?.data() as
      | { senderType?: 'user' | 'support'; text?: string }
      | undefined;
    if (!msg) return;

    const fromUser = msg.senderType === 'user';
    await db
      .collection('conversations')
      .doc(event.params.cid)
      .set(
        {
          lastMessage: msg.text ?? '',
          lastSenderType: msg.senderType ?? 'user',
          lastMessageAt: FieldValue.serverTimestamp(),
          status: 'open',
          // Increment the unread counter for whoever should read next.
          unreadForSupport: FieldValue.increment(fromUser ? 1 : 0),
          unreadForUser: FieldValue.increment(fromUser ? 0 : 1),
        },
        { merge: true }
      );
  }
);

/* ────────────────────────────────────────────────────────────
 * generateContent — admin-only callable.
 * Uses the Anthropic (Claude) API to generate grade-appropriate CBC quiz
 * questions. The API key lives in a Functions secret and never reaches the
 * browser. Returns the questions for the admin to review before saving.
 * ──────────────────────────────────────────────────────────── */
interface QuestionDiagram {
  kind: 'svg';
  svg: string;
  alt: string;
}

interface GeneratedQuestion {
  text: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  diagram?: QuestionDiagram | null;
}

// Optional SVG figure attached to a question (null when the question is text-only).
const DIAGRAM_PROP = {
  anyOf: [
    { type: 'null' },
    {
      type: 'object',
      additionalProperties: false,
      properties: {
        kind: { type: 'string', enum: ['svg'] },
        svg: { type: 'string' },
        alt: { type: 'string' },
      },
      required: ['kind', 'svg', 'alt'],
    },
  ],
} as const;

// Shared instruction so every generator produces diagrams the same, safe way.
const DIAGRAM_GUIDE =
  'For questions that are clearer with a picture — geometry (shapes, angles), number lines, ' +
  'coordinate graphs, fractions/parts of a whole, bar charts, simple science diagrams, maps — ' +
  'attach a "diagram": { "kind": "svg", "svg": "<svg …>…</svg>", "alt": "<short description>" }. ' +
  'The SVG must be self-contained and safe: include a viewBox, use only basic shapes/lines/text, ' +
  'no <script>, no <foreignObject>, no external images, links, or fonts. Keep it small and clean. ' +
  'For purely text questions set "diagram" to null.';

// JSON schema constraining Claude's response (structured outputs).
const QUESTIONS_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    questions: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          text: { type: 'string' },
          options: { type: 'array', items: { type: 'string' } },
          correctIndex: { type: 'integer' },
          explanation: { type: 'string' },
          difficulty: { type: 'string', enum: ['Easy', 'Medium', 'Hard'] },
          diagram: DIAGRAM_PROP,
        },
        required: ['text', 'options', 'correctIndex', 'explanation', 'difficulty', 'diagram'],
      },
    },
  },
  required: ['questions'],
} as const;

/* CBC-alignment review (LLM-as-judge over the generated questions). */
interface CbcReview {
  aligned: boolean;
  score: number;
  summary: string;
  questions: { index: number; aligned: boolean; strand: string; feedback: string }[];
}

const CBC_REVIEW_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    aligned: { type: 'boolean' },
    score: { type: 'integer' },
    summary: { type: 'string' },
    questions: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          index: { type: 'integer' },
          aligned: { type: 'boolean' },
          strand: { type: 'string' },
          feedback: { type: 'string' },
        },
        required: ['index', 'aligned', 'strand', 'feedback'],
      },
    },
  },
  required: ['aligned', 'score', 'summary', 'questions'],
} as const;

/**
 * Second pass: a CBC curriculum reviewer verifies whether the generated
 * questions are actually aligned to the Kenyan CBC for the grade/subject.
 * Returns structured per-question + overall feedback, or null if it can't run
 * (this is advisory and must never block generation).
 */
async function reviewCbcAlignment(
  anthropic: Anthropic,
  model: string,
  grade: string,
  subject: string,
  topic: string,
  questions: GeneratedQuestion[],
): Promise<CbcReview | null> {
  const reviewSystem =
    'You are a Kenyan CBC (Competency-Based Curriculum) curriculum reviewer. You verify whether ' +
    'assessment questions are aligned to the official CBC for the stated grade and subject: each ' +
    'question must map to a real CBC strand/sub-strand, target an appropriate competency, be factually ' +
    'correct, and use grade-appropriate language. Be strict, specific, and fair.';

  const reviewPrompt =
    `Review these ${questions.length} questions for Kenyan CBC alignment.\n` +
    `Grade/level: ${grade}\nSubject: ${subject}\n` +
    (topic ? `Topic: ${topic}\n` : '') +
    `\nFor each question (by its 0-based index) report whether it is CBC-aligned, the CBC ` +
    `strand/sub-strand it maps to (or "none" if it maps to nothing in the CBC), and concise ` +
    `feedback noting any problem (off-curriculum, wrong grade level, factual error, weak distractors). ` +
    `Then give an overall "aligned" verdict, a 0-100 "score" for how CBC-aligned the set is, and a ` +
    `one-paragraph "summary".\n\nQuestions:\n` +
    JSON.stringify(
      questions.map((q, i) => ({
        index: i,
        text: q.text,
        options: q.options,
        correctIndex: q.correctIndex,
      })),
    );

  const message = await anthropic.messages.create({
    model,
    max_tokens: 8000,
    thinking: { type: 'adaptive' },
    output_config: { effort: 'medium', format: { type: 'json_schema', schema: CBC_REVIEW_SCHEMA } },
    system: reviewSystem,
    messages: [{ role: 'user', content: reviewPrompt }],
  });

  if (message.stop_reason === 'refusal') return null;

  const jsonText = message.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map(b => b.text)
    .join('');
  return JSON.parse(jsonText || 'null');
}

export const generateContent = onCall(
  { secrets: [ANTHROPIC_API_KEY], timeoutSeconds: 240 },
  async request => {
    if (request.auth?.token.role !== 'admin') {
      throw new HttpsError('permission-denied', 'Only admins can generate content.');
    }

    const {
      grade,
      subject,
      topic = '',
      count = 5,
      difficulty = 'Medium',
      model = 'claude-opus-4-8',
    } = (request.data ?? {}) as {
      grade?: string;
      subject?: string;
      topic?: string;
      count?: number;
      difficulty?: 'Easy' | 'Medium' | 'Hard';
      model?: string;
    };

    if (!grade || !subject) {
      throw new HttpsError('invalid-argument', 'grade and subject are required.');
    }
    const n = Math.min(Math.max(Number(count) || 5, 1), 50);

    const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY.value() });

    const system =
      'You are a Kenyan CBC (Competency-Based Curriculum) education expert who writes ' +
      'accurate, age-appropriate multiple-choice questions for learners.';

    const prompt =
      `Generate ${n} multiple-choice questions for the Kenyan CBC curriculum.\n` +
      `Grade/level: ${grade}\nSubject: ${subject}\n` +
      (topic ? `Topic: ${topic}\n` : '') +
      `Difficulty: ${difficulty}\n\n` +
      'Each question must have exactly 4 options, exactly one correct answer (correctIndex is ' +
      'the 0-based index of the correct option), and a short explanation. Make the language and ' +
      'difficulty appropriate for the stated grade.\n\n' + DIAGRAM_GUIDE;

    let parsed: { questions?: GeneratedQuestion[] };
    try {
      // Stream so large question batches don't hit the SDK's non-streaming timeout.
      const message = await anthropic.messages
        .stream({
          model,
          max_tokens: 32000,
          thinking: { type: 'adaptive' },
          system,
          output_config: { format: { type: 'json_schema', schema: QUESTIONS_SCHEMA } },
          messages: [{ role: 'user', content: prompt }],
        })
        .finalMessage();

      if (message.stop_reason === 'refusal') {
        throw new HttpsError('internal', 'The request was declined. Try a different topic.');
      }

      const jsonText = message.content
        .filter((b): b is Anthropic.TextBlock => b.type === 'text')
        .map(b => b.text)
        .join('');
      parsed = JSON.parse(jsonText || '{}');
    } catch (err) {
      if (err instanceof HttpsError) throw err;
      throw new HttpsError('internal', `Claude request failed: ${(err as Error).message}`);
    }

    const questions = (parsed.questions ?? []).filter(
      q => q?.text && Array.isArray(q.options) && q.options.length === 4
    );
    if (questions.length === 0) {
      throw new HttpsError('internal', 'No valid questions were generated. Try again.');
    }

    // Advisory CBC-alignment check — never blocks generation.
    let cbcReview: CbcReview | null = null;
    try {
      cbcReview = await reviewCbcAlignment(anthropic, model, grade, subject, topic, questions);
    } catch {
      cbcReview = null;
    }

    return { questions, cbcReview, meta: { grade, subject, topic, difficulty, model } };
  }
);

/* ────────────────────────────────────────────────────────────
 * extractQuestions — admin-only callable.
 * Scans an uploaded image or PDF and extracts the multiple-choice questions
 * it contains, normalising them to the same 4-option shape used everywhere.
 * Uses Claude's vision / PDF support; the file is sent inline as base64.
 * ──────────────────────────────────────────────────────────── */
const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'] as const;
type ImageMime = (typeof IMAGE_TYPES)[number];

export const extractQuestions = onCall(
  { secrets: [ANTHROPIC_API_KEY], timeoutSeconds: 240 },
  async request => {
    if (request.auth?.token.role !== 'admin') {
      throw new HttpsError('permission-denied', 'Only admins can scan documents.');
    }

    const {
      fileBase64,
      mimeType,
      grade = '',
      subject = '',
      model = 'claude-opus-4-8',
    } = (request.data ?? {}) as {
      fileBase64?: string;
      mimeType?: string;
      grade?: string;
      subject?: string;
      model?: string;
    };

    if (!fileBase64 || !mimeType) {
      throw new HttpsError('invalid-argument', 'A file and its type are required.');
    }
    const isPdf = mimeType === 'application/pdf';
    const isImage = (IMAGE_TYPES as readonly string[]).includes(mimeType);
    if (!isPdf && !isImage) {
      throw new HttpsError('invalid-argument', 'Upload a PDF or an image (PNG, JPG, WebP).');
    }
    // Callable payload cap is ~10MB; base64 inflates ~33%, so guard ~7MB of raw bytes.
    if (fileBase64.length > 9_500_000) {
      throw new HttpsError('invalid-argument', 'File is too large. Use a file under ~7MB.');
    }

    const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY.value() });

    const sourceBlock: Anthropic.ImageBlockParam | Anthropic.DocumentBlockParam = isPdf
      ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: fileBase64 } }
      : { type: 'image', source: { type: 'base64', media_type: mimeType as ImageMime, data: fileBase64 } };

    const system =
      'You are a Kenyan CBC (Competency-Based Curriculum) education expert. You extract ' +
      'multiple-choice questions from scanned exam papers, worksheets, and textbooks, ' +
      'transcribing them accurately and normalising each to exactly four options.';

    const instruction =
      `Extract every multiple-choice question from this ${isPdf ? 'document' : 'image'}` +
      (grade || subject ? ` (intended for ${[grade, subject].filter(Boolean).join(' · ')})` : '') +
      `.\nFor each question return: "text" (the question, transcribed faithfully), "options" ` +
      `(exactly 4 choices), "correctIndex" (0-based index of the correct option), "explanation" ` +
      `(one short sentence), and "difficulty" (Easy, Medium, or Hard).\n` +
      `Rules: transcribe wording as written; if a question has fewer or more than 4 options, ` +
      `adapt it to exactly 4 sensible options keeping the real answer; if the correct answer is not ` +
      `marked, infer the best one; skip anything that is not a question. Ignore page numbers, ` +
      `headers, and instructions.\n\n` +
      `If the original question includes or depends on a figure (a shape, graph, number line, ` +
      `diagram), recreate it as a clean SVG. ${DIAGRAM_GUIDE}`;

    let parsed: { questions?: GeneratedQuestion[] };
    try {
      const message = await anthropic.messages
        .stream({
          model,
          max_tokens: 32000,
          thinking: { type: 'adaptive' },
          system,
          output_config: { format: { type: 'json_schema', schema: QUESTIONS_SCHEMA } },
          messages: [{ role: 'user', content: [sourceBlock, { type: 'text', text: instruction }] }],
        })
        .finalMessage();

      if (message.stop_reason === 'refusal') {
        throw new HttpsError('internal', 'The document could not be processed.');
      }
      const jsonText = message.content
        .filter((b): b is Anthropic.TextBlock => b.type === 'text')
        .map(b => b.text)
        .join('');
      parsed = JSON.parse(jsonText || '{}');
    } catch (err) {
      if (err instanceof HttpsError) throw err;
      throw new HttpsError('internal', `Scan failed: ${(err as Error).message}`);
    }

    const questions = (parsed.questions ?? []).filter(
      q => q?.text && Array.isArray(q.options) && q.options.length === 4
    );
    if (questions.length === 0) {
      throw new HttpsError('internal', 'No multiple-choice questions were found in the upload.');
    }

    return { questions, meta: { grade, subject, model } };
  }
);

/* ────────────────────────────────────────────────────────────
 * generateSyllabus — admin-only. Proposes the ordered topic list
 * (the syllabus) for a Grade + Subject.
 * ──────────────────────────────────────────────────────────── */
const SYLLABUS_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    topics: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: { title: { type: 'string' }, objective: { type: 'string' } },
        required: ['title', 'objective'],
      },
    },
  },
  required: ['topics'],
} as const;

export const generateSyllabus = onCall(
  { secrets: [ANTHROPIC_API_KEY], timeoutSeconds: 120 },
  async request => {
    if (request.auth?.token.role !== 'admin') {
      throw new HttpsError('permission-denied', 'Only admins can generate content.');
    }
    const { grade, subject, count = 10, model = 'claude-opus-4-8' } = (request.data ?? {}) as {
      grade?: string; subject?: string; count?: number; model?: string;
    };
    if (!grade || !subject) {
      throw new HttpsError('invalid-argument', 'grade and subject are required.');
    }
    const n = Math.min(Math.max(Number(count) || 10, 4), 24);
    const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY.value() });

    let parsed: { topics?: { title: string; objective: string }[] };
    try {
      const message = await anthropic.messages.create({
        model,
        max_tokens: 8000,
        thinking: { type: 'adaptive' },
        system:
          'You are a Kenyan CBC (Competency-Based Curriculum) expert who designs ordered topic syllabi for a grade and subject.',
        output_config: { format: { type: 'json_schema', schema: SYLLABUS_SCHEMA } },
        messages: [{
          role: 'user',
          content:
            `List ${n} topics that make up the ${subject} syllabus for Kenyan CBC ${grade}, ` +
            'in the order they should be taught. For each topic give a short title and a ' +
            'one-sentence learning objective.',
        }],
      });
      if (message.stop_reason === 'refusal') throw new HttpsError('internal', 'Request declined.');
      const jsonText = message.content
        .filter((b): b is Anthropic.TextBlock => b.type === 'text').map(b => b.text).join('');
      parsed = JSON.parse(jsonText || '{}');
    } catch (err) {
      if (err instanceof HttpsError) throw err;
      throw new HttpsError('internal', `Claude request failed: ${(err as Error).message}`);
    }
    const topics = (parsed.topics ?? []).filter(t => t?.title);
    if (topics.length === 0) throw new HttpsError('internal', 'No topics were generated. Try again.');
    return { topics, meta: { grade, subject, model } };
  }
);

/* ────────────────────────────────────────────────────────────
 * generateTopicLesson — admin-only. For one topic, generates the
 * lesson (description), a short summary, and the topic test.
 * ──────────────────────────────────────────────────────────── */
const TOPIC_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    description: { type: 'string' },
    summary: { type: 'string' },
    questions: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          text: { type: 'string' },
          options: { type: 'array', items: { type: 'string' } },
          correctIndex: { type: 'integer' },
          explanation: { type: 'string' },
          difficulty: { type: 'string', enum: ['Easy', 'Medium', 'Hard'] },
          diagram: DIAGRAM_PROP,
        },
        required: ['text', 'options', 'correctIndex', 'explanation', 'difficulty', 'diagram'],
      },
    },
  },
  required: ['description', 'summary', 'questions'],
} as const;

export const generateTopicLesson = onCall(
  { secrets: [ANTHROPIC_API_KEY], timeoutSeconds: 180 },
  async request => {
    if (request.auth?.token.role !== 'admin') {
      throw new HttpsError('permission-denied', 'Only admins can generate content.');
    }
    const {
      grade, subject, topic, count = 5, difficulty = 'Medium', model = 'claude-opus-4-8',
    } = (request.data ?? {}) as {
      grade?: string; subject?: string; topic?: string;
      count?: number; difficulty?: 'Easy' | 'Medium' | 'Hard'; model?: string;
    };
    if (!grade || !subject || !topic) {
      throw new HttpsError('invalid-argument', 'grade, subject and topic are required.');
    }
    const n = Math.min(Math.max(Number(count) || 5, 3), 50);
    const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY.value() });

    let parsed: { description?: string; summary?: string; questions?: GeneratedQuestion[] };
    try {
      // Stream so a long lesson + large test batch stays under the SDK timeout.
      const message = await anthropic.messages.stream({
        model,
        max_tokens: 32000,
        thinking: { type: 'adaptive' },
        system: 'You are a Kenyan CBC teacher who writes clear, age-appropriate lessons and tests.',
        output_config: { format: { type: 'json_schema', schema: TOPIC_SCHEMA } },
        messages: [{
          role: 'user',
          content:
            `For Kenyan CBC ${grade}, subject "${subject}", topic "${topic}":\n` +
            '1) "description": a clear lesson the learner reads — 3 to 6 short paragraphs in ' +
            'simple, grade-appropriate language. You may use basic markdown (headings, lists).\n' +
            '2) "summary": a short recap of the key points (a few sentences or bullets).\n' +
            `3) "questions": ${n} multiple-choice questions testing this topic. Each has exactly ` +
            `4 options, correctIndex (0-based), an explanation, and difficulty ${difficulty}.\n\n` +
            DIAGRAM_GUIDE,
        }],
      }).finalMessage();
      if (message.stop_reason === 'refusal') throw new HttpsError('internal', 'Request declined.');
      const jsonText = message.content
        .filter((b): b is Anthropic.TextBlock => b.type === 'text').map(b => b.text).join('');
      parsed = JSON.parse(jsonText || '{}');
    } catch (err) {
      if (err instanceof HttpsError) throw err;
      throw new HttpsError('internal', `Claude request failed: ${(err as Error).message}`);
    }
    const questions = (parsed.questions ?? []).filter(
      q => q?.text && Array.isArray(q.options) && q.options.length === 4
    );
    if (!parsed.description || questions.length === 0) {
      throw new HttpsError('internal', 'Lesson generation incomplete. Try again.');
    }
    return {
      description: parsed.description,
      summary: parsed.summary ?? '',
      questions,
      meta: { grade, subject, topic, difficulty, model },
    };
  }
);

/* ────────────────────────────────────────────────────────────
 * Student auth — phone + PIN via Firebase custom tokens.
 * The account (with a hashed PIN) lives in Firestore; these
 * functions verify it and mint a token the client signs in with.
 * ──────────────────────────────────────────────────────────── */
const PACKAGES = ['solo', 'trio', 'quad', 'family'];

function hashPin(pin: string, salt: string): string {
  return scryptSync(pin, salt, 64).toString('hex');
}
function pinMatches(pin: string, salt: string, expected: string): boolean {
  const a = Buffer.from(hashPin(pin, salt), 'hex');
  const b = Buffer.from(expected, 'hex');
  return a.length === b.length && timingSafeEqual(a, b);
}
function cleanKenyanPhone(phone: string): string | null {
  const p = (phone || '').replace(/\s/g, '');
  return /^(\+254|0)[7][0-9]{8}$/.test(p) ? p : null;
}

export const studentSignup = onCall(async request => {
  const { phone, pin, package: pkg } = (request.data ?? {}) as {
    phone?: string; pin?: string; package?: string;
  };
  const cleanPhone = cleanKenyanPhone(phone ?? '');
  if (!cleanPhone) throw new HttpsError('invalid-argument', 'Enter a valid Kenyan phone number.');
  if (!/^\d{4}$/.test(pin ?? '')) throw new HttpsError('invalid-argument', 'PIN must be 4 digits.');
  if (!PACKAGES.includes(pkg ?? '')) throw new HttpsError('invalid-argument', 'Invalid package.');

  const existing = await db.collection('accounts').where('phone', '==', cleanPhone).limit(1).get();
  if (!existing.empty) throw new HttpsError('already-exists', 'This number is already registered.');

  const salt = randomBytes(16).toString('hex');
  const ref = await db.collection('accounts').add({
    phone: cleanPhone,
    pinSalt: salt,
    pinHash: hashPin(pin as string, salt),
    package: pkg,
    profiles: [],
    activeProfileId: null,
    failedAttempts: 0,
    lockoutUntil: null,
    createdAt: FieldValue.serverTimestamp(),
  });

  const token = await adminAuth.createCustomToken(ref.id, { student: true });
  return { token, accountId: ref.id };
});

export const studentLogin = onCall(async request => {
  const { phone, pin } = (request.data ?? {}) as { phone?: string; pin?: string };
  const cleanPhone = cleanKenyanPhone(phone ?? '');
  if (!cleanPhone) throw new HttpsError('invalid-argument', 'Enter a valid Kenyan phone number.');
  if (!/^\d{4}$/.test(pin ?? '')) throw new HttpsError('invalid-argument', 'Enter your 4-digit PIN.');

  const snap = await db.collection('accounts').where('phone', '==', cleanPhone).limit(1).get();
  if (snap.empty) throw new HttpsError('not-found', 'No account found for this number.');

  const docSnap = snap.docs[0];
  const a = docSnap.data();
  const now = Date.now();
  const lockoutUntil = a.lockoutUntil ?? null;
  if (lockoutUntil && lockoutUntil > now) {
    const mins = Math.ceil((lockoutUntil - now) / 60000);
    throw new HttpsError('resource-exhausted', `Too many attempts. Try again in ${mins} min.`);
  }

  if (!pinMatches(pin as string, a.pinSalt, a.pinHash)) {
    const attempts = (a.failedAttempts ?? 0) + 1;
    await docSnap.ref.update({
      failedAttempts: attempts,
      lockoutUntil: attempts >= 5 ? now + 5 * 60 * 1000 : null,
    });
    throw new HttpsError('permission-denied', 'Incorrect PIN.');
  }

  await docSnap.ref.update({ failedAttempts: 0, lockoutUntil: null });
  const token = await adminAuth.createCustomToken(docSnap.id, { student: true });
  return {
    token,
    accountId: docSnap.id,
    package: a.package,
    profiles: a.profiles ?? [],
  };
});
