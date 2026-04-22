"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import LessonInputForm, { LessonFormData } from "@/components/LessonInputForm";

export default function LessonPlanPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (data: LessonFormData) => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          mode: "lesson-plan",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate");
      }

      const result = await response.json();
      sessionStorage.setItem("lessonPlanResult", JSON.stringify(result));
      router.push("/lesson-plan/result");
    } catch (err) {
      console.error(err);
      setError("Failed to generate lesson plan. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Create Lesson Plan</h1>
      {error && (
        <p className="mb-4 text-red-600 text-sm">{error}</p>
      )}
      <LessonInputForm onSubmit={handleSubmit} loading={loading} />
    </div>
  );
}
