// Official Kenyan CBC subjects per grade band.
export type GradeBand = 'lower_primary' | 'upper_primary' | 'junior' | 'senior';

export const BAND_LABELS: Record<GradeBand, string> = {
  lower_primary: 'Lower Primary (Grade 1–3)',
  upper_primary: 'Upper Primary (Grade 4–6)',
  junior: 'Junior School (Grade 7–9)',
  senior: 'Senior School (Grade 10–12)',
};

export const CBC_SUBJECTS: Record<GradeBand, string[]> = {
  lower_primary: [
    'English',
    'Kiswahili',
    'Kenyan Sign Language',
    'Mathematics',
    'Environmental Activities',
    'Hygiene and Nutrition',
    'Religious Education',
    'Movement and Creative Activities',
  ],
  upper_primary: [
    'English',
    'Kiswahili',
    'Mathematics',
    'Science and Technology',
    'Agriculture',
    'Social Studies',
    'Religious Education',
    'Creative Arts',
    'Physical and Health Education',
    'Kenyan Sign Language',
    'Indigenous Languages',
    'Foreign Languages',
  ],
  junior: [
    'English',
    'Kiswahili',
    'Mathematics',
    'Integrated Science',
    'Social Studies',
    'Pre-Technical Studies',
    'Agriculture and Nutrition',
    'Creative Arts and Sports',
    'Religious Education',
    'Business Studies',
    'Life Skills Education',
    'Computer Science',
    'Foreign Languages',
    'Indigenous Languages',
    'Kenyan Sign Language',
  ],
  // Senior School is pathway-based — union of all pathway subjects.
  senior: [
    'Mathematics',
    'English',
    'Physics',
    'Chemistry',
    'Biology',
    'Computer Science',
    'Agriculture',
    'Geosciences',
    'Engineering Technology',
    'History',
    'Geography',
    'Literature in English',
    'Business Studies',
    'Religious Studies',
    'Community Service Learning',
    'Music',
    'Fine Arts',
    'Theatre Arts',
    'Sports Science',
    'Performing Arts',
  ],
};

export const GRADES = Array.from({ length: 12 }, (_, i) => `Grade ${i + 1}`);

export function bandForGrade(grade: string): GradeBand {
  const n = parseInt(grade.replace(/\D/g, ''), 10) || 1;
  if (n <= 3) return 'lower_primary';
  if (n <= 6) return 'upper_primary';
  if (n <= 9) return 'junior';
  return 'senior';
}

export function subjectsForGrade(grade: string): string[] {
  return CBC_SUBJECTS[bandForGrade(grade)];
}
