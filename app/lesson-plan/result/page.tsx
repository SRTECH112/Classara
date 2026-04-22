"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
} from "docx";
import { saveAs } from "file-saver";

interface ProcedureRow {
  step: string;
  teacher: string;
  students: string;
}

interface Procedure {
  phase: string;
  rows: ProcedureRow[];
}

interface LessonPlanResult {
  title: string;
  objectives: string[];
  subjectMatter: {
    topic: string;
    materials: string;
    references: string;
  };
  procedures: Procedure[];
}

export default function LessonPlanResultPage() {
  const router = useRouter();
  const [result, setResult] = useState<LessonPlanResult | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("lessonPlanResult");
    if (stored) {
      setResult(JSON.parse(stored));
    } else {
      router.push("/lesson-plan");
    }
  }, [router]);

  const normalize = (value: unknown): string => {
    if (!value) return "";
    if (Array.isArray(value)) {
      return value.join("");
    }
    return String(value);
  };

  const handleDownload = async () => {
    if (!result) return;

    const tableBorder = {
      style: BorderStyle.SINGLE,
      size: 4,
      color: "000000",
    };

    const procedureSections = result.procedures.flatMap((proc) => [
      new Paragraph({ text: "" }),
      new Paragraph({
        children: [new TextRun({ text: proc.phase, font: "Times New Roman", bold: true, size: 28 })],
      }),
      new Paragraph({ text: "" }),
      new Table({
        width: { size: 9000, type: WidthType.DXA },
        columnWidths: [2000, 3500, 3500],
        borders: {
          top: tableBorder,
          bottom: tableBorder,
          left: tableBorder,
          right: tableBorder,
          insideHorizontal: tableBorder,
          insideVertical: tableBorder,
        },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                width: { size: 2000, type: WidthType.DXA },
                shading: { fill: "E7E6E6" },
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: "Step", font: "Times New Roman", bold: true, size: 24 })],
                    alignment: AlignmentType.CENTER,
                  }),
                ],
              }),
              new TableCell({
                width: { size: 3500, type: WidthType.DXA },
                shading: { fill: "E7E6E6" },
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: "Teacher's Activity", font: "Times New Roman", bold: true, size: 24 })],
                    alignment: AlignmentType.CENTER,
                  }),
                ],
              }),
              new TableCell({
                width: { size: 3500, type: WidthType.DXA },
                shading: { fill: "E7E6E6" },
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: "Students' Activity", font: "Times New Roman", bold: true, size: 24 })],
                    alignment: AlignmentType.CENTER,
                  }),
                ],
              }),
            ],
          }),
          ...proc.rows.map((row) => {
            const step = normalize(row.step);
            const teacher = normalize(row.teacher);
            const students = normalize(row.students);
            return new TableRow({
              children: [
                new TableCell({
                  width: { size: 2000, type: WidthType.DXA },
                  children: [
                    new Paragraph({
                      children: [new TextRun({ text: step, font: "Times New Roman", size: 24 })],
                    }),
                  ],
                }),
                new TableCell({
                  width: { size: 3500, type: WidthType.DXA },
                  children: [
                    new Paragraph({
                      children: [new TextRun({ text: teacher, font: "Times New Roman", size: 24 })],
                    }),
                  ],
                }),
                new TableCell({
                  width: { size: 3500, type: WidthType.DXA },
                  children: [
                    new Paragraph({
                      children: [new TextRun({ text: students, font: "Times New Roman", size: 24 })],
                    }),
                  ],
                }),
              ],
            });
          }),
        ],
      }),
    ]);

    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: result.title,
                  font: "Times New Roman",
                  bold: true,
                  size: 32,
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 200 },
            }),
            new Paragraph({
              children: [new TextRun({ text: "I. Objectives", font: "Times New Roman", bold: true, size: 28 })],
              spacing: { after: 200 },
            }),
            ...result.objectives.map(
              (obj) =>
                new Paragraph({
                  children: [new TextRun({ text: `• ${obj}`, font: "Times New Roman", size: 24 })],
                  indent: { left: 360 },
                })
            ),
            new Paragraph({
              children: [new TextRun({ text: "II. Subject Matter", font: "Times New Roman", bold: true, size: 28 })],
              spacing: { before: 200, after: 200 },
            }),
            new Paragraph({
              children: [new TextRun({ text: "Topic: ", font: "Times New Roman", bold: true, size: 24 }), new TextRun({ text: result.subjectMatter.topic, font: "Times New Roman", size: 24 })],
              indent: { left: 360 },
            }),
            new Paragraph({
              children: [new TextRun({ text: "Materials: ", font: "Times New Roman", bold: true, size: 24 }), new TextRun({ text: result.subjectMatter.materials, font: "Times New Roman", size: 24 })],
              indent: { left: 360 },
            }),
            new Paragraph({
              children: [new TextRun({ text: "References: ", font: "Times New Roman", bold: true, size: 24 }), new TextRun({ text: result.subjectMatter.references, font: "Times New Roman", size: 24 })],
              indent: { left: 360 },
            }),
            new Paragraph({
              children: [new TextRun({ text: "III. Procedures", font: "Times New Roman", bold: true, size: 28 })],
              spacing: { before: 200, after: 200 },
            }),
            ...procedureSections,
          ],
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${result.title}.docx`);
  };

  if (!result) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{result.title}</h1>
        <button
          onClick={handleDownload}
          className="rounded-lg bg-blue-600 px-4 py-2 text-white font-medium hover:bg-blue-700"
        >
          Download DOCX
        </button>
      </div>

      <div className="space-y-6">
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Objectives</h2>
          <ul className="space-y-1">
            {result.objectives.map((obj, index) => (
              <li key={index} className="text-gray-600 flex">
                <span className="mr-2">•</span>
                <span>{obj}</span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Subject Matter</h2>
          <div className="space-y-1 text-gray-600">
            <p><span className="font-medium">Topic:</span> {result.subjectMatter.topic}</p>
            <p><span className="font-medium">Materials:</span> {result.subjectMatter.materials}</p>
            <p><span className="font-medium">References:</span> {result.subjectMatter.references}</p>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Procedures</h2>
          <div className="space-y-6">
            {result.procedures.map((proc, index) => (
              <div key={index}>
                <h3 className="font-medium text-gray-800 mb-2">{proc.phase}</h3>
                <table className="w-full border-collapse border border-gray-300 text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 px-3 py-2 text-left font-medium">Step</th>
                      <th className="border border-gray-300 px-3 py-2 text-left font-medium">Teacher&apos;s Activity</th>
                      <th className="border border-gray-300 px-3 py-2 text-left font-medium">Students&apos; Activity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {proc.rows.map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        <td className="border border-gray-300 px-3 py-2 text-gray-700">{row.step}</td>
                        <td className="border border-gray-300 px-3 py-2 text-gray-600">{row.teacher}</td>
                        <td className="border border-gray-300 px-3 py-2 text-gray-600">{row.students}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
