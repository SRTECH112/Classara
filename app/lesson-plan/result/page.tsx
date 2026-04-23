"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { saveAs } from "file-saver";
import {
  LessonPlan,
  toDisplayPhases,
  toDocxBlob,
} from "@/lib/lesson-plan";

function readStoredLessonPlan(): LessonPlan | null {
  if (typeof window === "undefined") return null;
  const stored = sessionStorage.getItem("lessonPlanResult");
  if (!stored) return null;
  try {
    return JSON.parse(stored) as LessonPlan;
  } catch {
    return null;
  }
}

export default function LessonPlanResultPage() {
  const router = useRouter();
  const [result] = useState<LessonPlan | null>(readStoredLessonPlan);

  useEffect(() => {
    if (!result) router.push("/lesson-plan");
  }, [result, router]);

  const phases = useMemo(
    () => (result ? toDisplayPhases(result.procedures) : []),
    [result]
  );

  const handleDownload = async () => {
    if (!result) return;
    const blob = await toDocxBlob(result);
    saveAs(blob, `${result.title || "lesson-plan"}.docx`);
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
      <div className="rounded-xl border-2 border-green-200 bg-green-50 p-8 mb-8 text-center">
        <div className="flex justify-center mb-4">
          <svg className="w-14 h-14 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-green-800 mb-6">Lesson Plan Ready</h2>
        <button
          onClick={handleDownload}
          className="rounded-lg bg-green-600 px-10 py-4 text-white font-semibold text-lg hover:bg-green-700 shadow-lg hover:shadow-xl transition-all"
        >
          Download DOCX
        </button>
        <div className="mt-6 text-sm text-gray-600 text-left max-w-xs mx-auto">
          <p className="font-medium text-gray-700 mb-2">How to open in Google Docs:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Download the file</li>
            <li>Go to Google Docs</li>
            <li>Create a new document</li>
            <li>Go to File → Open → Upload</li>
            <li>Select the downloaded file</li>
          </ol>
        </div>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">{result.title}</h1>

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
          <div className="space-y-3 text-gray-600">
            <p><span className="font-medium">Topic:</span> {result.subjectMatter.topic}</p>
            <div>
              <span className="font-medium">Materials:</span>
              <ul className="mt-1 ml-4 space-y-1">
                {result.subjectMatter.materials.map((item, index) => (
                  <li key={index} className="flex">
                    <span className="mr-2">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <span className="font-medium">References:</span>
              <ul className="mt-1 ml-4 space-y-1">
                {result.subjectMatter.references.map((item, index) => (
                  <li key={index} className="flex">
                    <span className="mr-2">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Procedures</h2>
          <div className="space-y-6">
            {phases.map((proc, index) => (
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
