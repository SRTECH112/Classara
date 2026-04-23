import OpenAI from "openai";
import { buildLessonPlanSystemPrompt } from "./systemPrompt";
import {
  DEFAULT_OPTIONS,
  LessonPlan,
  LessonPlanInput,
  LessonPlanOptions,
  ProcedureRow,
} from "./types";
import { validateLessonPlan, ValidationResult } from "./validator";

export interface GenerationResult {
  plan: LessonPlan;
  validation: ValidationResult;
}

export interface GenerationDeps {
  client?: OpenAI;
  model?: string;
}

const DEFAULT_MODEL = "gpt-4o-mini";

/**
 * Generates a MATATAG-aligned lesson plan from user input.
 *
 * Flow:
 *   1. Merge options with defaults
 *   2. Build the MATATAG system prompt (teacher input treated as sacred)
 *   3. Call OpenAI with strict JSON response formatting
 *   4. Parse + normalize output to the LessonPlan shape
 *   5. Run quality validation (errors + warnings)
 */
export async function generateLessonPlan(
  input: LessonPlanInput,
  deps: GenerationDeps = {}
): Promise<GenerationResult> {
  assertRequiredInput(input);

  const options: LessonPlanOptions = { ...DEFAULT_OPTIONS, ...(input.options ?? {}) };
  const client = deps.client ?? getDefaultClient();
  const model = deps.model ?? DEFAULT_MODEL;

  const systemPrompt = buildLessonPlanSystemPrompt(options, {
    objectives: input.objectives,
    materials: input.materials,
    references: input.references,
  });

  const userPrompt = [
    `Grade: ${input.grade}`,
    `Subject: ${input.subject}`,
    `Topic: ${input.topic}`,
    `Content: ${input.content}`,
  ].join("\n");

  const completion = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) {
    throw new Error("AI returned empty response.");
  }

  const plan = normalizeLessonPlan(JSON.parse(raw), input);
  const validation = validateLessonPlan(plan);
  return { plan, validation };
}

/* ------------------------------------------------------------------ */
/* Normalization — tolerate minor shape drift from the model.         */
/* ------------------------------------------------------------------ */

function normalizeLessonPlan(raw: unknown, input: LessonPlanInput): LessonPlan {
  const obj = (raw ?? {}) as Record<string, unknown>;
  const subjectMatter = (obj.subjectMatter ?? {}) as Record<string, unknown>;
  const procedures = (obj.procedures ?? {}) as Record<string, unknown>;
  const lessonProper = (procedures.lessonProper ?? {}) as Record<string, unknown>;

  return {
    title: asString(obj.title, `${input.subject}: ${input.topic}`),
    objectives: asStringArray(obj.objectives),
    subjectMatter: {
      topic: asString(subjectMatter.topic, input.topic),
      materials: asStringArray(subjectMatter.materials),
      references: asStringArray(subjectMatter.references),
    },
    procedures: {
      preliminary: asRowArray(procedures.preliminary),
      lessonProper: {
        introduction: asRowArray(lessonProper.introduction),
        discussion: asRowArray(lessonProper.discussion),
        guidedPractice: asRowArray(lessonProper.guidedPractice),
        independentPractice: asRowArray(lessonProper.independentPractice),
      },
      assessment: asRowArray(procedures.assessment),
      closing: asRowArray(procedures.closing),
    },
  };
}

function asString(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value.trim();
  if (value == null) return fallback;
  return String(value).trim() || fallback;
}

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((v) => (typeof v === "string" ? v.trim() : String(v).trim()))
      .filter(Boolean);
  }
  if (typeof value === "string" && value.trim()) {
    return value
      .split(/\r?\n|,\s*/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

function asRowArray(value: unknown): ProcedureRow[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      const row = (entry ?? {}) as Record<string, unknown>;
      return {
        step: asString(row.step),
        teacher: asString(row.teacher),
        students: asString(row.students),
      };
    })
    .filter((row) => row.step || row.teacher || row.students);
}

/* ------------------------------------------------------------------ */

function assertRequiredInput(input: LessonPlanInput): void {
  const missing: string[] = [];
  if (!input.grade?.trim()) missing.push("grade");
  if (!input.subject?.trim()) missing.push("subject");
  if (!input.topic?.trim()) missing.push("topic");
  if (!input.content?.trim()) missing.push("content");
  if (missing.length) {
    throw new Error(`Missing required input fields: ${missing.join(", ")}`);
  }
}

let cachedClient: OpenAI | null = null;

function getDefaultClient(): OpenAI {
  if (cachedClient) return cachedClient;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set.");
  }
  cachedClient = new OpenAI({ apiKey });
  return cachedClient;
}
