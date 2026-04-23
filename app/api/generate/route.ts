import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { generateLessonPlan } from "@/lib/lesson-plan";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
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
    } = body;

    if (!grade || !subject || !topic || !content || !mode) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (mode === "lesson-plan") {
      const { plan, validation } = await generateLessonPlan({
        grade,
        subject,
        topic,
        content,
        objectives,
        materials,
        references,
        options: {
          includePrayer,
          includeGreetings,
          includeAttendance,
          includeAssignment,
          includeAssessment,
        },
      });

      return NextResponse.json({ ...plan, _validation: validation });
    }

    if (mode === "slides") {
      const systemPrompt = getSlidesSystemPrompt();
      const userPrompt = `Grade: ${grade}\nSubject: ${subject}\nTopic: ${topic}\nContent: ${content}`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      });

      const result = completion.choices[0]?.message?.content;
      if (!result) {
        return NextResponse.json(
          { error: "No response from AI" },
          { status: 500 }
        );
      }
      return NextResponse.json(JSON.parse(result));
    }

    return NextResponse.json({ error: "Unknown mode" }, { status: 400 });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Failed to generate content";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function getSlidesSystemPrompt(): string {
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
