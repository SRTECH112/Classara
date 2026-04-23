/**
 * Core type definitions for the MATATAG-aligned lesson plan system.
 *
 * These types form the contract between the generator, validator,
 * formatter, and UI layers.
 */

export interface LessonPlanOptions {
  includePrayer: boolean;
  includeGreetings: boolean;
  includeAttendance: boolean;
  includeAssignment: boolean;
  includeAssessment: boolean;
}

export interface LessonPlanTeacherInput {
  objectives?: string;
  materials?: string;
  references?: string;
}

export interface LessonPlanInput {
  grade: string;
  subject: string;
  topic: string;
  content: string;
  objectives?: string;
  materials?: string;
  references?: string;
  options?: Partial<LessonPlanOptions>;
}

export interface ProcedureRow {
  step: string;
  teacher: string;
  students: string;
}

export interface LessonProper {
  introduction: ProcedureRow[];
  discussion: ProcedureRow[];
  guidedPractice: ProcedureRow[];
  independentPractice: ProcedureRow[];
}

export interface LessonProcedures {
  preliminary: ProcedureRow[];
  lessonProper: LessonProper;
  assessment: ProcedureRow[];
  closing: ProcedureRow[];
}

export interface LessonSubjectMatter {
  topic: string;
  materials: string[];
  references: string[];
}

export interface LessonPlan {
  title: string;
  objectives: string[];
  subjectMatter: LessonSubjectMatter;
  procedures: LessonProcedures;
}

/**
 * Flat display-friendly shape used by the UI and DOCX formatters.
 */
export interface DisplayPhase {
  phase: string;
  rows: ProcedureRow[];
}

/**
 * Empty template matching the structure contract.
 * Useful for defaults, tests, and schema documentation.
 */
export const LESSON_PLAN_TEMPLATE: LessonPlan = {
  title: "",
  objectives: [],
  subjectMatter: {
    topic: "",
    materials: [],
    references: [],
  },
  procedures: {
    preliminary: [],
    lessonProper: {
      introduction: [],
      discussion: [],
      guidedPractice: [],
      independentPractice: [],
    },
    assessment: [],
    closing: [],
  },
};

export const DEFAULT_OPTIONS: LessonPlanOptions = {
  includePrayer: true,
  includeGreetings: true,
  includeAttendance: true,
  includeAssignment: true,
  includeAssessment: true,
};
