import {
  LessonPlan,
  LessonProcedures,
  LessonProper,
  ProcedureRow,
} from "./types";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/* Tunable limits — kept conservative to enforce MATATAG decongestion. */
const LIMITS = {
  objectives: { min: 2, max: 4 },
  subPhaseRows: { max: 4 },
  assessmentRows: { max: 3 },
  closingRows: { max: 4 },
  preliminaryRows: { max: 5 },
  stepWords: { max: 10 },
  cellChars: { max: 400 },
};

const ACTION_VERBS = [
  "explain",
  "analyze",
  "apply",
  "compare",
  "evaluate",
  "demonstrate",
  "describe",
  "identify",
  "classify",
  "create",
  "solve",
  "justify",
  "predict",
  "interpret",
  "summarize",
  "differentiate",
];

const MEMORIZATION_FLAGS = [
  "memorize",
  "memorization",
  "recite from memory",
  "rote",
  "copy the definition",
];

const THINKING_SIGNALS = [
  "discuss",
  "explain",
  "analyze",
  "apply",
  "reflect",
  "compare",
  "justify",
  "evaluate",
  "connect",
  "why",
  "how",
];

/**
 * Runs all MATATAG quality rules against a generated lesson plan.
 * Errors block acceptance; warnings are informational.
 */
export function validateLessonPlan(plan: LessonPlan): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  validateShape(plan, errors);
  if (errors.length) {
    return { valid: false, errors, warnings };
  }

  validateObjectives(plan.objectives, errors, warnings);
  validateSubjectMatter(plan.subjectMatter, warnings);
  validateProcedures(plan.procedures, errors, warnings);

  return { valid: errors.length === 0, errors, warnings };
}

/* ------------------------------------------------------------------ */

function validateShape(plan: LessonPlan, errors: string[]): void {
  if (!plan || typeof plan !== "object") {
    errors.push("Lesson plan must be an object.");
    return;
  }
  if (typeof plan.title !== "string" || !plan.title.trim()) {
    errors.push("Missing or empty 'title'.");
  }
  if (!Array.isArray(plan.objectives)) {
    errors.push("'objectives' must be an array.");
  }
  if (!plan.subjectMatter || typeof plan.subjectMatter !== "object") {
    errors.push("'subjectMatter' must be an object.");
  }
  if (!plan.procedures || typeof plan.procedures !== "object") {
    errors.push("'procedures' must be an object.");
    return;
  }
  const p = plan.procedures;
  if (!Array.isArray(p.preliminary)) errors.push("'procedures.preliminary' must be an array.");
  if (!Array.isArray(p.assessment)) errors.push("'procedures.assessment' must be an array.");
  if (!Array.isArray(p.closing)) errors.push("'procedures.closing' must be an array.");

  const lp = p.lessonProper;
  if (!lp || typeof lp !== "object") {
    errors.push("'procedures.lessonProper' must be an object.");
    return;
  }
  (["introduction", "discussion", "guidedPractice", "independentPractice"] as const).forEach(
    (key) => {
      if (!Array.isArray(lp[key])) {
        errors.push(`'procedures.lessonProper.${key}' must be an array.`);
      }
    }
  );
}

function validateObjectives(
  objectives: string[],
  errors: string[],
  warnings: string[]
): void {
  if (objectives.length < LIMITS.objectives.min) {
    errors.push(
      `Too few objectives (${objectives.length}). Minimum is ${LIMITS.objectives.min}.`
    );
  }
  if (objectives.length > LIMITS.objectives.max) {
    warnings.push(
      `Too many objectives (${objectives.length}). MATATAG favors ${LIMITS.objectives.max} or fewer.`
    );
  }
  objectives.forEach((obj, i) => {
    if (!obj || !obj.trim()) {
      errors.push(`Objective #${i + 1} is empty.`);
      return;
    }
    const firstWord = obj.trim().toLowerCase().split(/\s+/)[0];
    if (!ACTION_VERBS.includes(firstWord)) {
      warnings.push(
        `Objective #${i + 1} does not start with a recognized action verb ("${firstWord}").`
      );
    }
    if (/\b(understand|learn about|know about)\b/i.test(obj)) {
      warnings.push(`Objective #${i + 1} uses a vague verb ("understand"/"learn about").`);
    }
  });
}

function validateSubjectMatter(
  sm: LessonPlan["subjectMatter"],
  warnings: string[]
): void {
  if (!sm.topic?.trim()) warnings.push("Subject matter topic is empty.");
  if (!Array.isArray(sm.materials) || sm.materials.length === 0) {
    warnings.push("No materials provided.");
  }
  if (!Array.isArray(sm.references) || sm.references.length === 0) {
    warnings.push("No references provided.");
  }
}

function validateProcedures(
  procedures: LessonProcedures,
  errors: string[],
  warnings: string[]
): void {
  capRows(procedures.preliminary, "preliminary", LIMITS.preliminaryRows.max, warnings);
  capRows(procedures.assessment, "assessment", LIMITS.assessmentRows.max, warnings);
  capRows(procedures.closing, "closing", LIMITS.closingRows.max, warnings);

  validateLessonProper(procedures.lessonProper, errors, warnings);
  validateRowQuality(procedures, errors, warnings);
  validateAssessmentIntegrity(procedures.assessment, warnings);
  validateCriticalThinking(procedures, warnings);
}

function capRows(
  rows: ProcedureRow[],
  label: string,
  max: number,
  warnings: string[]
): void {
  if (rows.length > max) {
    warnings.push(`'${label}' has ${rows.length} rows — keep it under ${max}.`);
  }
}

function validateLessonProper(
  lp: LessonProper,
  errors: string[],
  warnings: string[]
): void {
  (Object.keys(lp) as Array<keyof LessonProper>).forEach((key) => {
    const rows = lp[key];
    if (rows.length === 0) {
      errors.push(`Lesson proper sub-phase '${key}' must have at least one row.`);
    }
    if (rows.length > LIMITS.subPhaseRows.max) {
      warnings.push(
        `Sub-phase '${key}' has ${rows.length} rows — MATATAG favors ≤ ${LIMITS.subPhaseRows.max}.`
      );
    }
  });
}

function validateRowQuality(
  procedures: LessonProcedures,
  errors: string[],
  warnings: string[]
): void {
  const allRows = collectRows(procedures);
  allRows.forEach(({ row, location }, index) => {
    if (!row.step?.trim()) {
      errors.push(`Row ${index + 1} (${location}) has empty 'step'.`);
    }
    if (!row.teacher?.trim()) {
      errors.push(`Row ${index + 1} (${location}) has empty 'teacher'.`);
    }
    if (!row.students?.trim()) {
      errors.push(`Row ${index + 1} (${location}) has empty 'students'.`);
    }
    if (row.step && row.step.split(/\s+/).length > LIMITS.stepWords.max) {
      warnings.push(
        `Row ${index + 1} (${location}): 'step' is too long — keep it under ${LIMITS.stepWords.max} words.`
      );
    }
    ["teacher", "students"].forEach((field) => {
      const value = (row as unknown as Record<string, string>)[field] ?? "";
      if (value.length > LIMITS.cellChars.max) {
        warnings.push(
          `Row ${index + 1} (${location}): '${field}' exceeds ${LIMITS.cellChars.max} chars.`
        );
      }
      if (/\.\.\.|\[insert|\[placeholder/i.test(value)) {
        errors.push(`Row ${index + 1} (${location}): '${field}' contains placeholder text.`);
      }
    });
  });
}

function validateAssessmentIntegrity(
  rows: ProcedureRow[],
  warnings: string[]
): void {
  rows.forEach((row, i) => {
    const combined = `${row.step} ${row.teacher} ${row.students}`.toLowerCase();
    if (MEMORIZATION_FLAGS.some((flag) => combined.includes(flag))) {
      warnings.push(
        `Assessment row ${i + 1} appears memorization-based. MATATAG assessment should measure understanding.`
      );
    }
  });
}

function validateCriticalThinking(
  procedures: LessonProcedures,
  warnings: string[]
): void {
  const proper = procedures.lessonProper;
  const discussionText = proper.discussion
    .map((r) => `${r.teacher} ${r.students}`)
    .join(" ")
    .toLowerCase();
  if (!/\bwhy\b|\bhow\b|\?/.test(discussionText)) {
    warnings.push("Discussion lacks an explicit open-ended (why/how) question.");
  }

  const studentsText = collectRows(procedures)
    .map(({ row }) => row.students.toLowerCase())
    .join(" ");
  if (!THINKING_SIGNALS.some((signal) => studentsText.includes(signal))) {
    warnings.push("Students' activities lack critical-thinking verbs (discuss, analyze, apply, reflect).");
  }
}

/* ------------------------------------------------------------------ */

function collectRows(
  procedures: LessonProcedures
): Array<{ row: ProcedureRow; location: string }> {
  const list: Array<{ row: ProcedureRow; location: string }> = [];
  procedures.preliminary.forEach((row) =>
    list.push({ row, location: "preliminary" })
  );
  (["introduction", "discussion", "guidedPractice", "independentPractice"] as const).forEach(
    (key) => {
      procedures.lessonProper[key].forEach((row) =>
        list.push({ row, location: `lessonProper.${key}` })
      );
    }
  );
  procedures.assessment.forEach((row) =>
    list.push({ row, location: "assessment" })
  );
  procedures.closing.forEach((row) =>
    list.push({ row, location: "closing" })
  );
  return list;
}
