import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import {
  DisplayPhase,
  LessonPlan,
  LessonProcedures,
  ProcedureRow,
} from "./types";

/**
 * Flattens the nested procedures structure into an ordered list of
 * { phase, rows } suitable for UI tables and DOCX rendering.
 */
export function toDisplayPhases(procedures: LessonProcedures): DisplayPhase[] {
  const phases: DisplayPhase[] = [];

  if (procedures.preliminary.length) {
    phases.push({ phase: "Preliminary Activities", rows: procedures.preliminary });
  }

  const lp = procedures.lessonProper;
  const lpSubPhases: Array<[string, ProcedureRow[]]> = [
    ["Lesson Proper: Introduction", lp.introduction],
    ["Lesson Proper: Discussion", lp.discussion],
    ["Lesson Proper: Guided Practice", lp.guidedPractice],
    ["Lesson Proper: Independent Practice", lp.independentPractice],
  ];
  lpSubPhases.forEach(([label, rows]) => {
    if (rows.length) phases.push({ phase: label, rows });
  });

  if (procedures.assessment.length) {
    phases.push({ phase: "Assessment", rows: procedures.assessment });
  }
  if (procedures.closing.length) {
    phases.push({ phase: "Closing", rows: procedures.closing });
  }

  return phases;
}

/* ------------------------------------------------------------------ */
/* DOCX formatter                                                      */
/* ------------------------------------------------------------------ */

const TIMES = "Times New Roman";
const TABLE_BORDER = {
  style: BorderStyle.SINGLE,
  size: 4,
  color: "000000",
};

/**
 * Builds a classroom-ready DOCX Document from a lesson plan.
 */
export function toDocxDocument(plan: LessonPlan): Document {
  const phases = toDisplayPhases(plan.procedures);

  return new Document({
    sections: [
      {
        children: [
          titleParagraph(plan.title),
          sectionHeading("I. Objectives"),
          ...plan.objectives.map(bulletParagraph),
          sectionHeading("II. Subject Matter"),
          labeledParagraph("Topic: ", plan.subjectMatter.topic),
          subHeading("Materials:"),
          ...plan.subjectMatter.materials.map(bulletParagraph),
          subHeading("References:"),
          ...plan.subjectMatter.references.map(bulletParagraph),
          sectionHeading("III. Procedures"),
          ...phases.flatMap(phaseToDocxBlocks),
        ],
      },
    ],
  });
}

/**
 * Packs the Document into a Blob with the correct DOCX MIME type.
 * Safe to call in a browser context.
 */
export async function toDocxBlob(plan: LessonPlan): Promise<Blob> {
  const doc = toDocxDocument(plan);
  const blob = await Packer.toBlob(doc);
  return new Blob([blob], {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
}

/* ----- DOCX building blocks ---------------------------------------- */

function titleParagraph(title: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text: title, font: TIMES, bold: true, size: 32 })],
    alignment: AlignmentType.CENTER,
    heading: HeadingLevel.TITLE,
    spacing: { after: 200 },
  });
}

function sectionHeading(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, font: TIMES, bold: true, size: 28 })],
    spacing: { before: 200, after: 200 },
  });
}

function subHeading(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, font: TIMES, bold: true, size: 24 })],
    indent: { left: 360 },
  });
}

function bulletParagraph(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text: `• ${text}`, font: TIMES, size: 24 })],
    indent: { left: 720 },
  });
}

function labeledParagraph(label: string, value: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({ text: label, font: TIMES, bold: true, size: 24 }),
      new TextRun({ text: value, font: TIMES, size: 24 }),
    ],
    indent: { left: 360 },
  });
}

function phaseToDocxBlocks(phase: DisplayPhase): Paragraph[] | (Paragraph | Table)[] {
  return [
    new Paragraph({ text: "" }),
    new Paragraph({
      children: [new TextRun({ text: phase.phase, font: TIMES, bold: true, size: 28 })],
    }),
    new Paragraph({ text: "" }),
    buildProcedureTable(phase.rows),
  ];
}

function buildProcedureTable(rows: ProcedureRow[]): Table {
  return new Table({
    width: { size: 9000, type: WidthType.DXA },
    columnWidths: [2000, 3500, 3500],
    borders: {
      top: TABLE_BORDER,
      bottom: TABLE_BORDER,
      left: TABLE_BORDER,
      right: TABLE_BORDER,
      insideHorizontal: TABLE_BORDER,
      insideVertical: TABLE_BORDER,
    },
    rows: [headerRow(), ...rows.map(dataRow)],
  });
}

function headerRow(): TableRow {
  return new TableRow({
    children: [
      headerCell("Step", 2000),
      headerCell("Teacher's Activity", 3500),
      headerCell("Students' Activity", 3500),
    ],
  });
}

function headerCell(text: string, width: number): TableCell {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    shading: { fill: "E7E6E6" },
    children: [
      new Paragraph({
        children: [new TextRun({ text, font: TIMES, bold: true, size: 24 })],
        alignment: AlignmentType.CENTER,
      }),
    ],
  });
}

function dataRow(row: ProcedureRow): TableRow {
  return new TableRow({
    children: [
      dataCell(row.step, 2000),
      dataCell(row.teacher, 3500),
      dataCell(row.students, 3500),
    ],
  });
}

function dataCell(text: string, width: number): TableCell {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    children: [
      new Paragraph({
        children: [new TextRun({ text: text || "", font: TIMES, size: 24 })],
      }),
    ],
  });
}
