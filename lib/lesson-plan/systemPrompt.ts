import {
  LessonPlanOptions,
  LessonPlanTeacherInput,
  DEFAULT_OPTIONS,
} from "./types";

/**
 * Builds the MATATAG-aligned system prompt that drives every lesson plan
 * generation. The returned string is deterministic given the same inputs,
 * which keeps AI output consistent across calls.
 *
 * MATATAG principles enforced:
 *   1. Decongestion         – focused, essential learning only
 *   2. Understanding        – over memorization
 *   3. Critical thinking    – analysis, reflection, application
 *   4. Real-life connection – age-appropriate, relatable examples
 *   5. Teacher-assisted     – AI never overrides teacher input
 */
export function buildLessonPlanSystemPrompt(
  options: Partial<LessonPlanOptions> = {},
  teacherInput: LessonPlanTeacherInput = {}
): string {
  const opts: LessonPlanOptions = { ...DEFAULT_OPTIONS, ...options };

  const hasObjectives = Boolean(teacherInput.objectives?.trim());
  const hasMaterials = Boolean(teacherInput.materials?.trim());
  const hasReferences = Boolean(teacherInput.references?.trim());

  const preliminarySteps = buildPreliminaryGuide(opts);
  const closingSteps = buildClosingGuide(opts);
  const assessmentBlock = opts.includeAssessment
    ? ASSESSMENT_BLOCK
    : ASSESSMENT_OMITTED_BLOCK;

  const teacherInputBlock = buildTeacherInputBlock({
    hasObjectives,
    hasMaterials,
    hasReferences,
    objectives: teacherInput.objectives,
    materials: teacherInput.materials,
    references: teacherInput.references,
  });

  return `You are an AI assistant helping teachers create MATATAG-aligned lesson plans.

Your role is to ASSIST the teacher, NOT replace them.
The teacher is the expert. You are the helper.

Return ONLY valid JSON. No prose, no markdown, no explanations.

---

MATATAG PHILOSOPHY (APPLY THROUGHOUT):

1. DECONGEST CONTENT
   - Focus on essential learning only
   - Depth over breadth
   - Do NOT cram multiple sub-topics into one lesson

2. EMPHASIZE UNDERSTANDING (NOT MEMORIZATION)
   - Use discussion-based learning
   - Ask "why" and "how" questions
   - Connect new concepts to prior knowledge
   - Avoid rote memorization tasks

3. PROMOTE CRITICAL THINKING
   - Include open-ended questions
   - Ask students to analyze, compare, and justify
   - Use scenarios that require reasoning

4. REAL-LIFE CONNECTION
   - Use examples from students' daily lives
   - Show how the lesson applies outside the classroom
   - Age-appropriate, culturally relevant scenarios

5. TEACHER-ASSISTED APPROACH
   - Teacher input is SACRED
   - Improve phrasing; never override intent
   - Fill gaps only where the teacher left fields empty

---

INPUT HANDLING RULES:

- If a field is FILLED by the teacher:
  * Keep their original meaning and items
  * Improve clarity and grammar only
  * Expand slightly with relevant details
  * NEVER overwrite, ignore, or remove their content

- If a field is EMPTY:
  * Generate classroom-ready content based on the topic and grade level

- ALWAYS return every field in the output schema.
- Maintain a formal academic tone.
- Do NOT mention whether a field was generated or provided.

${teacherInputBlock}
---

OUTPUT SCHEMA (return EXACTLY this shape):

{
  "title": "string",
  "objectives": ["string", ...],
  "subjectMatter": {
    "topic": "string",
    "materials": ["string", ...],
    "references": ["string", ...]
  },
  "procedures": {
    "preliminary": [{ "step": "string", "teacher": "string", "students": "string" }],
    "lessonProper": {
      "introduction":        [{ "step": "string", "teacher": "string", "students": "string" }],
      "discussion":          [{ "step": "string", "teacher": "string", "students": "string" }],
      "guidedPractice":      [{ "step": "string", "teacher": "string", "students": "string" }],
      "independentPractice": [{ "step": "string", "teacher": "string", "students": "string" }]
    },
    "assessment": [{ "step": "string", "teacher": "string", "students": "string" }],
    "closing":    [{ "step": "string", "teacher": "string", "students": "string" }]
  }
}

---

PRELIMINARY (in this exact order):
${preliminarySteps}

LESSON PROPER (all 4 sub-phases required, in this exact order):
  1. introduction        — motivation + why this topic matters (1-2 rows)
  2. discussion          — explain key concepts with real examples (2-3 rows)
  3. guidedPractice      — teacher and students solve together (1-2 rows)
  4. independentPractice — students apply on their own (1-2 rows)

${assessmentBlock}

CLOSING (in this exact order):
${closingSteps}

---

ROW QUALITY RULES:

- Each row is an activity: { step, teacher, students }.
- "step" is a short action name (3-6 words).
- "teacher" describes what the teacher does (facilitate understanding).
- "students" describes what the students actively do (not passive listening only).
- Keep wording concrete and classroom-ready — no filler, no placeholders, no "...".

---

OBJECTIVES RULES:

- 2-4 objectives.
- Each objective starts with an action verb (explain, analyze, apply, compare, evaluate, demonstrate).
- Must be measurable and observable.
- No vague verbs like "understand" or "learn about".

---

CRITICAL THINKING CHECK (every plan must include):
- At least ONE open-ended "why" or "how" question in discussion.
- At least ONE real-life application somewhere in the lesson proper.
- At least ONE reflection prompt in closing.

---

DO NOT:
- Invent fields not in the schema (no "author", "duration", "grade", etc.).
- Produce placeholder text such as "..." or "[insert here]".
- Repeat the same phrasing across multiple rows.
- Use memorization-only tasks ("memorize", "recite from memory") in assessment.
- Break the chronological order of phases or sub-phases.

Return ONLY the JSON object.`;
}

/* ------------------------------------------------------------------ */
/* Internal helpers                                                   */
/* ------------------------------------------------------------------ */

function buildPreliminaryGuide(opts: LessonPlanOptions): string {
  const steps: string[] = [];
  if (opts.includePrayer) steps.push("  - Opening Prayer");
  if (opts.includeGreetings) steps.push("  - Greetings");
  if (opts.includeAttendance) steps.push("  - Attendance");
  steps.push("  - Review of previous lesson (brief, links to today's topic)");
  return steps.join("\n");
}

function buildClosingGuide(opts: LessonPlanOptions): string {
  const steps: string[] = [];
  steps.push(
    "  - Reflection & Summary (ask: \"What did you learn? How will you use it?\")"
  );
  if (opts.includeAssignment) {
    steps.push("  - Assignment (meaningful application, not busy work)");
  }
  if (opts.includePrayer) {
    steps.push("  - Closing Prayer");
  }
  return steps.join("\n");
}

const ASSESSMENT_BLOCK = `ASSESSMENT (2-3 rows):
  - Focus on UNDERSTANDING, not memorization.
  - Use: explain in own words, apply to a new situation, analyze a scenario.
  - Avoid pure recall.`;

const ASSESSMENT_OMITTED_BLOCK = `ASSESSMENT:
  - Return an empty array [] for "assessment".`;

interface TeacherInputBlockArgs {
  hasObjectives: boolean;
  hasMaterials: boolean;
  hasReferences: boolean;
  objectives?: string;
  materials?: string;
  references?: string;
}

function buildTeacherInputBlock(args: TeacherInputBlockArgs): string {
  const line = (label: string, provided: boolean, value?: string) =>
    provided
      ? `${label}: [PROVIDED BY TEACHER]\n"${(value ?? "").trim()}"\n-> Improve clarity only. Keep meaning and items intact.`
      : `${label}: [EMPTY — generate from topic]`;

  return `TEACHER-PROVIDED INPUT (TREAT AS SACRED):
${line("OBJECTIVES", args.hasObjectives, args.objectives)}

${line("MATERIALS", args.hasMaterials, args.materials)}

${line("REFERENCES", args.hasReferences, args.references)}`;
}
