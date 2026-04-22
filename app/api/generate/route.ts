import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { 
      grade, 
      subject, 
      topic, 
      content, 
      mode,
      objectives = "",
      materials = "",
      references = "",
      includePrayer = true,
      includeGreetings = true,
      includeAttendance = true,
      includeAssignment = true,
      includeAssessment = true,
    } = await request.json();

    if (!grade || !subject || !topic || !content || !mode) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const options = {
      includePrayer,
      includeGreetings,
      includeAttendance,
      includeAssignment,
      includeAssessment,
    };

    const teacherInput = {
      objectives,
      materials,
      references,
    };

    const systemPrompt = getSystemPrompt(mode, options, teacherInput);
    const userPrompt = `Grade: ${grade}\nSubject: ${subject}\nTopic: ${topic}\nContent: ${content}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
    });

    const result = completion.choices[0].message.content;

    if (!result) {
      return NextResponse.json(
        { error: "No response from AI" },
        { status: 500 }
      );
    }

    return NextResponse.json(JSON.parse(result));
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to generate content" },
      { status: 500 }
    );
  }
}

interface LessonPlanOptions {
  includePrayer: boolean;
  includeGreetings: boolean;
  includeAttendance: boolean;
  includeAssignment: boolean;
  includeAssessment: boolean;
}

interface TeacherInput {
  objectives: string;
  materials: string;
  references: string;
}

function getSystemPrompt(mode: string, options?: LessonPlanOptions, teacherInput?: TeacherInput): string {
  if (mode === "slides") {
    return `You are an AI assistant that creates PowerPoint slide structures.

---

INPUT:
- topic
- grade
- subject
- content (optional)

---

TASK:

Generate a structured slide deck.

---

RULES:

1. If content is PROVIDED:
- Base slides on the content
- Extract key points

2. If content is EMPTY:
- Generate slides from topic

---

3. Structure:

- Title Slide
- Objectives
- Content slides (main concepts)
- Examples
- Activity
- Summary

---

4. Keep slides concise:
- Title
- 3–5 bullet points max

---

OUTPUT FORMAT (JSON):

{
  "slides": [
    {
      "title": "",
      "bullets": []
    }
  ]
}`;
  }

  const preliminaryRows: string[] = [];
  if (options?.includePrayer) {
    preliminaryRows.push('{ "step": "Opening Prayer", "teacher": "Lead the prayer", "students": "Stand and pray" }');
  }
  if (options?.includeGreetings) {
    preliminaryRows.push('{ "step": "Greetings", "teacher": "Greet the class", "students": "Respond to greeting" }');
  }
  if (options?.includeAttendance) {
    preliminaryRows.push('{ "step": "Attendance", "teacher": "Check attendance", "students": "Say present when called" }');
  }
  preliminaryRows.push('{ "step": "Review", "teacher": "Ask about previous lesson", "students": "Answer questions" }');

  const closingRows: string[] = [];
  closingRows.push('{ "step": "Summary", "teacher": "Summarize key points", "students": "Listen and take notes" }');
  if (options?.includeAssignment) {
    closingRows.push('{ "step": "Assignment", "teacher": "Give homework", "students": "Write down assignment" }');
  }
  if (options?.includePrayer) {
    closingRows.push('{ "step": "Closing Prayer", "teacher": "Lead closing prayer", "students": "Stand and pray" }');
  }

  const includeAssessmentPhase = options?.includeAssessment !== false;

  const assessmentPhase = includeAssessmentPhase ? `{
      "phase": "Assessment",
      "rows": []
    },` : '';

  const assessmentRule = includeAssessmentPhase ? '- 2-3 steps in Assessment (quiz, oral recitation, written test)' : '';

  const hasObjectives = teacherInput?.objectives?.trim();
  const hasMaterials = teacherInput?.materials?.trim();
  const hasReferences = teacherInput?.references?.trim();

  const teacherProvidedSection = `
TEACHER-PROVIDED INPUT (if any):
${hasObjectives ? `Objectives: ${hasObjectives}` : 'Objectives: (not provided - generate appropriate objectives)'}
${hasMaterials ? `Materials: ${hasMaterials}` : 'Materials: (not provided - generate appropriate materials)'}
${hasReferences ? `References: ${hasReferences}` : 'References: (not provided - generate appropriate references)'}
`;

  return `You are an AI assistant helping teachers create lesson plans.

Your role is to ASSIST the teacher, not replace them.

Return ONLY JSON.

---

GOAL:
Generate a REAL, COMPLETE lesson plan based on the topic and content.
DO NOT generate generic placeholders.

---

INPUT HANDLING RULES:

1. If a field is PROVIDED by the teacher:
- Improve clarity
- Expand slightly if needed
- Keep the teacher's intent
- DO NOT overwrite or ignore their input

2. If a field is EMPTY:
- Generate a complete, appropriate version based on the lesson topic

3. ALWAYS return all fields (objectives, materials, references)

4. Maintain a formal academic tone suitable for school lesson plans.

5. Keep outputs practical and usable in real classrooms.

6. Do NOT mention whether something was generated or provided.
${teacherProvidedSection}
---

OUTPUT FORMAT:

{
  "title": "",
  "objectives": [],
  "subjectMatter": {
    "topic": "",
    "materials": "",
    "references": ""
  },
  "procedures": [
    {
      "phase": "Preliminary Activities",
      "rows": [
        ${preliminaryRows.join(',\n        ')}
      ]
    },
    {
      "phase": "Lesson Proper",
      "rows": []
    },
    {
      "phase": "Practice / Activity",
      "rows": []
    },
    ${assessmentPhase}
    {
      "phase": "Closing",
      "rows": [
        ${closingRows.join(',\n        ')}
      ]
    }
  ]
}

---

RULES:

1. Generate at least:
- 5-8 steps in Lesson Proper (introduce topic, explain concepts, give examples, discuss)
- 3-5 steps in Practice / Activity (group work, exercises, hands-on tasks)
${assessmentRule}

2. Each row MUST include:
- step: name of the activity
- teacher: what the teacher does
- students: what students do

3. Use the provided CONTENT to build:
- explanations
- examples
- activities

4. DO NOT:
- Generate sections that are not in the format above
- Stop after greetings
- Generate generic filler
- Use placeholder text like "..."

5. Make it realistic and usable in class.

---

IMPORTANT:
Return ONLY valid JSON.
No explanations.`;
}
