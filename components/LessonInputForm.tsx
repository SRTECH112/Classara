"use client";

import { useState, FormEvent } from "react";

export interface LessonFormData {
  grade: string;
  subject: string;
  topic: string;
  content: string;
  objectives: string;
  materials: string;
  references: string;
  includePrayer: boolean;
  includeGreetings: boolean;
  includeAttendance: boolean;
  includeAssignment: boolean;
  includeAssessment: boolean;
}

interface LessonInputFormProps {
  onSubmit: (data: LessonFormData) => void;
  loading?: boolean;
}

export default function LessonInputForm({
  onSubmit,
  loading = false,
}: LessonInputFormProps) {
  const [grade, setGrade] = useState("");
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [content, setContent] = useState("");
  const [objectives, setObjectives] = useState("");
  const [materials, setMaterials] = useState("");
  const [references, setReferences] = useState("");
  const [includePrayer, setIncludePrayer] = useState(true);
  const [includeGreetings, setIncludeGreetings] = useState(true);
  const [includeAttendance, setIncludeAttendance] = useState(true);
  const [includeAssignment, setIncludeAssignment] = useState(true);
  const [includeAssessment, setIncludeAssessment] = useState(true);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit({ 
      grade, 
      subject, 
      topic, 
      content,
      objectives,
      materials,
      references,
      includePrayer,
      includeGreetings,
      includeAttendance,
      includeAssignment,
      includeAssessment,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="grade" className="block text-sm font-medium text-gray-700">
          Grade
        </label>
        <input
          type="text"
          id="grade"
          value={grade}
          onChange={(e) => setGrade(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="e.g. Grade 8"
        />
      </div>

      <div>
        <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
          Subject
        </label>
        <input
          type="text"
          id="subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="e.g. Science"
        />
      </div>

      <div>
        <label htmlFor="topic" className="block text-sm font-medium text-gray-700">
          Topic
        </label>
        <input
          type="text"
          id="topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="e.g. Photosynthesis"
        />
      </div>

      <div>
        <label htmlFor="content" className="block text-sm font-medium text-gray-700">
          Content
        </label>
        <textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          rows={4}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Describe what you want to cover..."
        />
      </div>

      <div>
        <label htmlFor="objectives" className="block text-sm font-medium text-gray-700">
          Objectives <span className="text-gray-400 font-normal">(optional - leave blank to auto-generate)</span>
        </label>
        <textarea
          id="objectives"
          value={objectives}
          onChange={(e) => setObjectives(e.target.value)}
          rows={3}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="e.g. Define photosynthesis, Identify the parts of a plant..."
        />
      </div>

      <div>
        <label htmlFor="materials" className="block text-sm font-medium text-gray-700">
          Materials <span className="text-gray-400 font-normal">(optional - leave blank to auto-generate)</span>
        </label>
        <textarea
          id="materials"
          value={materials}
          onChange={(e) => setMaterials(e.target.value)}
          rows={2}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="e.g. Whiteboard, markers, handouts..."
        />
      </div>

      <div>
        <label htmlFor="references" className="block text-sm font-medium text-gray-700">
          References <span className="text-gray-400 font-normal">(optional - leave blank to auto-generate)</span>
        </label>
        <textarea
          id="references"
          value={references}
          onChange={(e) => setReferences(e.target.value)}
          rows={2}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="e.g. Science textbook pp. 45-50, online resources..."
        />
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700">Optional Sections</p>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={includePrayer}
              onChange={(e) => setIncludePrayer(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-600">Include Prayer</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={includeGreetings}
              onChange={(e) => setIncludeGreetings(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-600">Include Greetings</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={includeAttendance}
              onChange={(e) => setIncludeAttendance(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-600">Include Attendance</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={includeAssignment}
              onChange={(e) => setIncludeAssignment(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-600">Include Assignment</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={includeAssessment}
              onChange={(e) => setIncludeAssessment(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-600">Include Assessment</span>
          </label>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-white font-medium hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed"
      >
        {loading ? "Generating..." : "Generate"}
      </button>
    </form>
  );
}
