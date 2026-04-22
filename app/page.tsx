import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center text-center">
      <h1 className="text-4xl font-bold text-gray-900">Classara</h1>
      <p className="mt-3 text-lg text-gray-500">
        Save time on lesson prep and classroom tasks
      </p>

      <div className="mt-10 flex flex-col gap-4 sm:flex-row">
        <Link
          href="/slides"
          className="rounded-lg bg-blue-600 px-8 py-3 text-lg font-medium text-white hover:bg-blue-700"
        >
          Create Slides
        </Link>
        <Link
          href="/lesson-plan"
          className="rounded-lg bg-gray-900 px-8 py-3 text-lg font-medium text-white hover:bg-gray-800"
        >
          Create Lesson Plan
        </Link>
      </div>
    </div>
  );
}
