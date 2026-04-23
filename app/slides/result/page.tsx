"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PptxGenJS from "pptxgenjs";

interface Slide {
  title: string;
  bullets: string[];
}

interface SlidesResult {
  title: string;
  slides: Slide[];
}

export default function SlidesResultPage() {
  const router = useRouter();
  const [result, setResult] = useState<SlidesResult | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("slidesResult");
    if (stored) {
      setResult(JSON.parse(stored));
    } else {
      router.push("/slides");
    }
  }, [router]);

  const handleDownload = () => {
    if (!result) return;

    const pptx = new PptxGenJS();
    pptx.title = result.title;

    result.slides.forEach((slide) => {
      const pptSlide = pptx.addSlide();
      
      pptSlide.addText(slide.title, {
        x: 0.5,
        y: 0.5,
        w: "90%",
        fontSize: 24,
        bold: true,
        color: "363636",
      });

      const bulletText = slide.bullets.map((bullet) => ({
        text: bullet,
        options: { bullet: true, fontSize: 18, color: "666666" },
      }));

      pptSlide.addText(bulletText, {
        x: 0.5,
        y: 1.5,
        w: "90%",
        h: 4,
      });
    });

    pptx.write({ outputType: "blob" }).then((data) => {
      const blob = new Blob([data as BlobPart], {
        type: "application/vnd.openxmlformats-officedocument.presentationml.presentation"
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${result.title}.pptx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    });
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
          Download PPT
        </button>
      </div>

      <div className="space-y-4">
        {result.slides.map((slide, index) => (
          <div
            key={index}
            className="rounded-lg border border-gray-200 bg-white p-5"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              {slide.title}
            </h2>
            <ul className="space-y-2">
              {slide.bullets.map((bullet, bulletIndex) => (
                <li key={bulletIndex} className="text-gray-600 flex">
                  <span className="mr-2">•</span>
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
