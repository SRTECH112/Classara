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
    return `You are an AI assistant that creates PowerPoint slide decks for teachers.

YOUR PURPOSE: SAVE TEACHER TIME.
Every slide must be CLASSROOM-READY with no further editing needed.

---

INPUT:
- topic (required)
- grade
- subject
- content (optional)

---

TASK:

Generate a structured, teach-ready slide deck that a teacher can present immediately.

---

RULES:

1. If content is PROVIDED:
   ✓ Extract ONLY key points from the content
   ✓ Summarize long text into short bullets
   ✓ Preserve the teacher's intent and facts
   ✗ DO NOT invent facts not in the content

2. If content is EMPTY:
   ✓ Generate slides from the topic
   ✓ Use accurate, age-appropriate information for the grade level
   ✓ Match the subject's style (formal for Science, engaging for Literature, etc.)

---

3. REQUIRED STRUCTURE (in this exact order):

   Slide 1: Title Slide (lesson title + subject/grade)
   Slide 2: Objectives (what students will learn)
   Slide 3-5: Content Slides (main concepts, one concept per slide)
   Slide 6: Examples (concrete, relatable examples)
   Slide 7: Activity (classroom task or discussion question)
   Slide 8: Summary (key takeaways)

---

4. CONCISENESS RULES (CRITICAL):
   ✓ Each slide title: max 8 words
   ✓ Each bullet: max 12 words (teacher expands verbally)
   ✓ 3-5 bullets per slide maximum
   ✗ NO full sentences
   ✗ NO paragraphs
   ✗ NO generic filler text
   ✗ NO placeholders like "..."

---

5. TIME-SAVING PRINCIPLES:
   - Write bullets that are ready to project
   - Use clear, simple language students understand
   - Focus on what the teacher needs, not what sounds smart
   - Make the deck immediately presentable

---

OUTPUT FORMAT (JSON):

{
  "title": "",
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
  closingRows.push('{ "step": "Reflection & Summary", "teacher": "Ask reflective questions and summarize key insights", "students": "Share reflections and note key takeaways" }');
  if (options?.includeAssignment) {
    closingRows.push('{ "step": "Assignment", "teacher": "Give a meaningful task that applies the lesson", "students": "Write down the assignment" }');
  }
  if (options?.includePrayer) {
    closingRows.push('{ "step": "Closing Prayer", "teacher": "Lead closing prayer", "students": "Stand and pray" }');
  }

  const includeAssessmentPhase = options?.includeAssessment !== false;

  const assessmentPhase = includeAssessmentPhase ? `{
      "phase": "Assessment",
      "rows": []
    },` : '';

  const assessmentRule = includeAssessmentPhase ? '- 2-3 steps in Assessment (focus on UNDERSTANDING, not memorization - e.g., explain in own words, apply concept to new situation, analyze a scenario)' : '';

  const hasObjectives = teacherInput?.objectives?.trim();
  const hasMaterials = teacherInput?.materials?.trim();
  const hasReferences = teacherInput?.references?.trim();

  const teacherProvidedSection = `
═══════════════════════════════════════════════
TEACHER-PROVIDED INPUT (TREAT AS SACRED):
═══════════════════════════════════════════════

OBJECTIVES: ${hasObjectives ? `[PROVIDED BY TEACHER]\n"${hasObjectives}"\n→ IMPROVE & EXPAND SLIGHTLY. KEEP ORIGINAL MEANING.` : '[EMPTY - GENERATE FROM TOPIC]'}

MATERIALS: ${hasMaterials ? `[PROVIDED BY TEACHER]\n"${hasMaterials}"\n→ IMPROVE & EXPAND SLIGHTLY. KEEP ORIGINAL ITEMS.` : '[EMPTY - GENERATE FROM TOPIC]'}

REFERENCES: ${hasReferences ? `[PROVIDED BY TEACHER]\n"${hasReferences}"\n→ IMPROVE & EXPAND SLIGHTLY. KEEP ORIGINAL SOURCES.` : '[EMPTY - GENERATE FROM TOPIC]'}
═══════════════════════════════════════════════
`;

  return `You are an AI assistant helping teachers create MATATAG-aligned lesson plans.

Your role is to ASSIST the teacher, NOT replace them.
The teacher is the expert. You are the helper.

Return ONLY JSON.

---

MATATAG PHILOSOPHY (APPLY THROUGHOUT):

1. DECONGEST CONTENT:
   ✓ Focus on essential learning only
   ✓ Avoid overloading with too many activities
   ✓ Prioritize depth over breadth
   ✗ Do NOT cram multiple sub-topics into one lesson

2. EMPHASIZE UNDERSTANDING (NOT MEMORIZATION):
   ✓ Use discussion-based learning
   ✓ Ask "why" and "how" questions
   ✓ Connect concepts to what students already know
   ✗ Avoid rote memorization tasks

3. PROMOTE CRITICAL THINKING:
   ✓ Include open-ended questions
   ✓ Add real-life applications
   ✓ Encourage reflection and self-assessment
   ✓ Use scenarios that require analysis

4. KEEP IT SIMPLE & PRACTICAL:
   ✓ Follow natural classroom flow
   ✓ No unnecessary sections
   ✓ Realistic time allocation
   ✗ No filler or redundant activities

---

GOAL:
Generate a REAL, FOCUSED lesson plan aligned with MATATAG principles.
DO NOT generate generic placeholders or overloaded activities.

---

INPUT HANDLING RULES (CRITICAL):

1. If a field is FILLED by the teacher:
   ✓ Keep their original meaning and intent
   ✓ Improve clarity and grammar only
   ✓ Expand slightly with relevant details
   ✗ NEVER overwrite their input
   ✗ NEVER ignore their input
   ✗ NEVER replace their ideas with your own
   ✗ NEVER remove items they provided

2. If a field is EMPTY:
   ✓ Generate complete, appropriate content based on the lesson topic
   ✓ Make it practical and classroom-ready

3. ALWAYS return all fields (objectives, materials, references)

4. Maintain a formal academic tone suitable for school lesson plans.

5. Objectives MUST be clear, measurable, and focused (use action verbs: explain, analyze, apply, compare).

6. Do NOT mention whether something was generated or provided.

7. Teacher input is SACRED. Assist, don't replace.
${teacherProvidedSection}
---

OUTPUT FORMAT:

{
  "title": "",
  "objectives": [],
  "subjectMatter": {
    "topic": "",
    "materials": [],
    "references": []
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

MATATAG LESSON STRUCTURE:
This lesson plan MUST follow a FOCUSED, DECONGESTED classroom flow:

A. PRELIMINARY ACTIVITIES (in this exact order):
   a. Opening Prayer (if enabled)
   b. Greetings (if enabled)
   c. Attendance (if enabled)
   d. Review of previous lesson (brief, connects to today's topic)

B. LESSON PROPER (MUST include these 4 sub-phases in this exact order):
   1. INTRODUCTION
      - Motivation/engagement (relate to students' lives)
      - State the topic and why it matters
   2. DISCUSSION
      - Explain key concepts (NOT memorization)
      - Use examples students can relate to
      - Ask open-ended questions to check understanding
   3. GUIDED PRACTICE
      - Teacher and students solve problems/scenarios together
      - Teacher models thinking process
      - Students answer with support
   4. INDEPENDENT PRACTICE
      - Students apply the concept on their own
      - Short, focused task (avoid overloading)
      - Real-life application preferred

C. ASSESSMENT:
   - Focus on UNDERSTANDING, not memorization
   - Use: explain in own words, apply to new situation, analyze a scenario
   - Avoid pure recall questions

D. CLOSING (in this exact order):
   a. Reflection & Summary (ask: "What did you learn? How will you use it?")
   b. Assignment (if enabled - meaningful, not busy work)
   c. Closing Prayer (if enabled)

---

CRITICAL FLOW RULES:
- Follow the order above EXACTLY
- Within Lesson Proper, use step names that clearly indicate sub-phase:
  * "Introduction: [specific name]"
  * "Discussion: [specific name]"
  * "Guided Practice: [specific name]"
  * "Independent Practice: [specific name]"
- Each step must logically flow from the previous one
- Do NOT place discussion before introduction
- Do NOT place independent practice before guided practice

---

RULES:

1. Lesson Proper must contain 6-10 focused steps total, distributed across the 4 sub-phases:
   - 1-2 steps for Introduction
   - 2-3 steps for Discussion
   - 1-2 steps for Guided Practice
   - 1-2 steps for Independent Practice
${assessmentRule}

2. Each row MUST include:
   - step: name of the activity (prefix with sub-phase for Lesson Proper)
   - teacher: what the teacher does (focus on facilitating understanding)
   - students: what students do (active engagement, not passive)

3. Use the provided CONTENT to build:
   - explanations rooted in the topic
   - relatable, real-life examples
   - practice tasks that build understanding

4. DO NOT:
   - Generate sections not in the format above
   - Overload the lesson with too many activities (MATATAG = decongestion)
   - Use pure memorization or rote tasks
   - Generate generic filler
   - Use placeholder text like "..."
   - Concatenate words without proper spacing
   - Add "author" field or invent author names
   - Include fields not specified in the output format
   - Break the chronological flow

5. Make it realistic, focused, and usable in a real classroom.

6. CRITICAL THINKING CHECK: Each lesson MUST include at least:
   - 1 open-ended question (why/how)
   - 1 real-life application
   - 1 reflection prompt in Closing

7. FORMATTING:
   - objectives: array of complete sentences (clear, measurable, use action verbs)
   - materials: array of items (e.g., ["Whiteboard and markers", "Graphic organizers", "Projector"])
   - references: array of sources (e.g., ["Science Textbook pp. 45-50", "DepEd Module 3"])
   - Ensure proper spacing between words in all text

---

IMPORTANT:
Return ONLY valid JSON.
No explanations.`;
}
