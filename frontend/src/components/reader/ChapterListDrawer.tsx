"use client";

import React from "react";
import Link from "next/link";
import { X, Check } from "lucide-react";
import { ChapterListItem } from "@/types";

interface ChapterListDrawerProps {
  isOpen: boolean;
  novelTitle: string;
  novelSlug: string;
  currentChapterId: string;
  chapters: ChapterListItem[];
  onClose: () => void;
}

export function ChapterListDrawer({
  isOpen,
  novelTitle,
  novelSlug,
  currentChapterId,
  chapters,
  onClose,
}: ChapterListDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Body */}
      <div className="relative ml-auto w-full max-w-sm bg-white dark:bg-[#1C1C1E] text-text-primary dark:text-gray-100 h-full shadow-2xl flex flex-col z-10">
        <div className="p-4 border-b border-border-subtle flex items-center justify-between">
          <div className="min-w-0 pr-2">
            <h3 className="font-bold text-sm truncate">{novelTitle}</h3>
            <span className="text-xs text-text-secondary">Daftar Chapter ({chapters.length})</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chapters Scroll Area */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
          {chapters.map((ch) => {
            const isCurrent = ch.id === currentChapterId;
            return (
              <Link
                key={ch.id}
                href={`/novel/${novelSlug}/chapter/${ch.id}`}
                onClick={onClose}
                className={`p-3.5 flex items-center justify-between gap-3 text-xs transition-colors ${
                  isCurrent
                    ? "bg-primary/10 text-primary font-bold dark:bg-primary/20"
                    : "hover:bg-gray-50 dark:hover:bg-gray-800/50 text-text-primary dark:text-gray-200"
                }`}
              >
                <div className="min-w-0 truncate">
                  <span>Bab {ch.chapter_number}: {ch.title}</span>
                </div>
                {isCurrent && <Check className="w-4 h-4 text-primary shrink-0" />}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
