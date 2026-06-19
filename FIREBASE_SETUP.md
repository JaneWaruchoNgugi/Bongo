# Bongo — Firebase backend setup

This adds **staff roles (Admin / Support)** to the admin panel and a **live support chat**
between students (frontend widget) and Support staff (admin panel).

## 1. Fill in `.env`
Copy values from Firebase Console → Project settings → Your apps → SDK config into `.env`
(see `.env.example`). All keys are `VITE_FIREBASE_*`.

> If your project ID isn't literally `highscores`, update `.firebaserc` to match.

## 2. Enable Auth providers
Firebase Console → Authentication → Sign-in method, enable:
- **Email/Password** — used by Admin & Support staff to log in at `/admin`.
- **Anonymous** — used by the frontend chat widget so student messages are securable.

## 3. Deploy rules, indexes & functions
```bash
npm install -g firebase-tools     # if not installed
firebase login
firebase deploy --only firestore:rules,firestore:indexes,storage,functions
```
Functions deployed (region `us-central1`, must match `src/lib/firebase.ts`):
- `createStaffUser` — admin-only callable; creates a staff Auth account + role.
- `claimFirstAdmin` — one-time bootstrap; promotes the caller to admin while no admin exists.
- `setStaffClaims` — syncs custom claims whenever a `staff/{uid}` doc changes.
- `onMessageCreated` — maintains conversation metadata + unread counters.

## 4. Create the first admin (one time)
1. Console → Authentication → Users → **Add user** (email + password).
2. Go to `/admin`, sign in with that account.
3. You'll see **"No staff role"** → click **Claim first admin**. You're now an admin.
4. From the **Staff** section, create more Admin/Support accounts (no console needed again).

## Roles
| Section        | Admin | Support |
|----------------|:-----:|:-------:|
| Dashboard      |  ✅   |   ✅    |
| Support Chat   |  ✅   |   ✅    |
| Students       |  ✅   |   ✅    |
| Questions      |  ✅   |   —     |
| Leaderboard    |  ✅   |   —     |
| Staff          |  ✅   |   —     |

## Data model (Firestore)
```
staff/{uid}                       { email, name, role: 'admin'|'support', disabled }
conversations/{cid}               { userUid, accountPhone, profileName, status,
                                    assignedTo, lastMessage, lastMessageAt,
                                    unreadForSupport, unreadForUser }
conversations/{cid}/messages/{id} { senderType: 'user'|'support', senderId,
                                    senderName, text, createdAt }
```

## Local development (optional)
```bash
firebase emulators:start          # auth + firestore + functions + storage
npm run dev                       # Vite frontend
```

## Notes / next steps
- The Dashboard / Students / Questions / Leaderboard sections still render demo data —
  they are role-gated and ready to be wired to Firestore reads/writes next.
- Student accounts still live in `localStorage`; the chat uses Anonymous Auth and tags each
  conversation with the logged-in account phone + active profile name.
