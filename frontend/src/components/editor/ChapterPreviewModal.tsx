"use client";

import React, { useState } from "react";
import { X, Sun, Coffee, Moon } from "lucide-react";
import { ReaderTheme } from "@/components/reader/ReaderToolbar";

interface ChapterPreviewModalProps {
  isOpen: boolean;
  title: string;
  chapterNumber: number;
  contentHtml: string;
  onClose: () => void;
}

export function ChapterPreviewModal({
  isOpen,
  title,
  chapterNumber,
  contentHtml,
  onClose,
}: ChapterPreviewModalProps) {
  const [theme, setTheme] = useState<ReaderTheme>("Terang");

  if (!isOpen) return null;

  const themeStyles = {
    Terang: { bg: "#FFFFFF", text: "#1F2937" },
    Sepia: { bg: "#F4ECD8", text: "#433422" },
    Gelap: { bg: "#121214", text: "#D4D4D8" },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-border-subtle">
        {/* Modal Top Bar */}
        <div className="px-6 py-4 bg-gray-50 border-b border-border-subtle flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-bold text-sm text-text-primary">
              Pratinjau Mode Pembaca (WYSIWYG)
            </span>
            <div className="flex items-center gap-1 p-0.5 bg-gray-200 rounded-lg">
              {(["Terang", "Sepia", "Gelap"] as ReaderTheme[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                    theme === t ? "bg-white text-primary shadow-sm" : "text-gray-600"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Canvas Styled Identical to Reader Mode */}
        <div
          className="flex-1 overflow-y-auto p-8 sm:p-12 transition-colors duration-150"
          style={{
            backgroundColor: themeStyles[theme].bg,
            color: themeStyles[theme].text,
          }}
        >
          <div className="max-w-[68ch] mx-auto space-y-6">
            <div className="text-center pb-6 border-b border-gray-200/50 space-y-1">
              <span className="text-xs font-bold uppercase tracking-widest opacity-60">
                Bab {chapterNumber}
              </span>
              <h1 className="font-sans font-bold text-2xl sm:text-3xl">{title}</h1>
            </div>

            <article
              className="prose prose-lg max-w-none font-reader-serif leading-relaxed"
              dangerouslySetInnerHTML={{ __html: contentHtml }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
