"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Settings,
  Sun,
  Moon,
  Coffee,
  List,
  Type,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export type ReaderTheme = "Terang" | "Sepia" | "Gelap";
export type ReaderFontFamily = "serif" | "sans" | "mono";

export interface ReaderPreferences {
  theme: ReaderTheme;
  fontSize: number; // 14 to 24
  fontFamily: ReaderFontFamily;
  lineHeight: number; // 1.5, 1.8, 2.1
}

interface ReaderToolbarProps {
  novelTitle: string;
  novelSlug: string;
  chapterNumber: number;
  chapterTitle: string;
  prevChapterId: string | null;
  nextChapterId: string | null;
  onOpenDrawer: () => void;
  onPreferencesChange: (prefs: ReaderPreferences) => void;
}

export function ReaderToolbar({
  novelTitle,
  novelSlug,
  chapterNumber,
  chapterTitle,
  prevChapterId,
  nextChapterId,
  onOpenDrawer,
  onPreferencesChange,
}: ReaderToolbarProps) {
  const [preferences, setPreferences] = useState<ReaderPreferences>({
    theme: "Terang",
    fontSize: 18,
    fontFamily: "serif",
    lineHeight: 1.8,
  });
  const [showSettings, setShowSettings] = useState<boolean>(false);

  // Load preferences from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("novel_reader_preferences");
      if (saved) {
        const parsed = JSON.parse(saved);
        setPreferences(parsed);
        onPreferencesChange(parsed);
        applyTheme(parsed.theme);
      } else {
        applyTheme("Terang");
      }
    } catch {}
  }, []);

  function applyTheme(theme: ReaderTheme) {
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-reader-theme", theme);
    }
  }

  function updatePreferences(partial: Partial<ReaderPreferences>) {
    const updated = { ...preferences, ...partial };
    setPreferences(updated);
    onPreferencesChange(updated);
    if (partial.theme) {
      applyTheme(partial.theme);
    }
    try {
      localStorage.setItem("novel_reader_preferences", JSON.stringify(updated));
    } catch {}
  }

  return (
    <header className="sticky top-0 z-30 w-full border-b border-border-subtle/50 bg-inherit backdrop-blur-md transition-colors">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Left: Back Link & Chapter Title */}
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href={`/novel/${novelSlug}`}
            className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-inherit transition-colors"
            title="Kembali ke Detail Novel"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="min-w-0">
            <p className="text-xs font-bold truncate opacity-80">{novelTitle}</p>
            <p className="text-[11px] truncate opacity-60">
              Bab {chapterNumber}: {chapterTitle}
            </p>
          </div>
        </div>

        {/* Center: Prev & Next Quick Navigation */}
        <div className="hidden sm:flex items-center gap-1.5">
          {prevChapterId ? (
            <Link
              href={`/novel/${novelSlug}/chapter/${prevChapterId}`}
              className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              title="Bab Sebelumnya"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
          ) : (
            <span className="p-1.5 opacity-20 cursor-not-allowed">
              <ChevronLeft className="w-5 h-5" />
            </span>
          )}

          <button
            onClick={onOpenDrawer}
            className="px-3 py-1 text-xs font-bold rounded-lg hover:bg-black/5 dark:hover:bg-white/10 flex items-center gap-1.5 transition-colors"
          >
            <List className="w-4 h-4" />
            <span>Daftar Bab</span>
          </button>

          {nextChapterId ? (
            <Link
              href={`/novel/${novelSlug}/chapter/${nextChapterId}`}
              className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              title="Bab Selanjutnya"
            >
              <ChevronRight className="w-5 h-5" />
            </Link>
          ) : (
            <span className="p-1.5 opacity-20 cursor-not-allowed">
              <ChevronRight className="w-5 h-5" />
            </span>
          )}
        </div>

        {/* Right: Settings & Drawer Toggle */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onOpenDrawer}
            className="sm:hidden p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-inherit transition-colors"
            title="Daftar Bab"
          >
            <List className="w-5 h-5" />
          </button>

          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-inherit transition-colors"
            title="Pengaturan Tampilan Baca"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Floating Reader Settings Panel */}
      {showSettings && (
        <div className="absolute right-4 top-16 w-80 p-5 rounded-2xl bg-white dark:bg-[#1C1C1E] text-gray-900 dark:text-gray-100 border border-border-subtle shadow-2xl space-y-5 z-40">
          {/* Theme Switcher */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Warna Tema
            </span>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Terang", value: "Terang" as const, icon: Sun, bg: "#FFFFFF", text: "#1F2937" },
                { label: "Sepia", value: "Sepia" as const, icon: Coffee, bg: "#F4ECD8", text: "#433422" },
                { label: "Gelap", value: "Gelap" as const, icon: Moon, bg: "#121214", text: "#D4D4D8" },
              ].map((t) => {
                const Icon = t.icon;
                const isSelected = preferences.theme === t.value;
                return (
                  <button
                    key={t.value}
                    onClick={() => updatePreferences({ theme: t.value })}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                      isSelected
                        ? "border-primary ring-2 ring-primary/20 shadow-sm"
                        : "border-gray-200 dark:border-gray-700"
                    }`}
                    style={{ backgroundColor: t.bg, color: t.text }}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Font Family Selector */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Jenis Huruf
            </span>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Serif", value: "serif" as const, fontClass: "font-reader-serif" },
                { label: "Sans", value: "sans" as const, fontClass: "font-sans" },
                { label: "Mono", value: "mono" as const, fontClass: "font-mono" },
              ].map((f) => (
                <button
                  key={f.value}
                  onClick={() => updatePreferences({ fontFamily: f.value })}
                  className={`py-1.5 px-3 rounded-xl text-xs font-semibold border transition-all ${f.fontClass} ${
                    preferences.fontFamily === f.value
                      ? "bg-primary text-white border-primary"
                      : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Font Size Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-500 font-bold uppercase tracking-wider">
              <span>Ukuran Teks</span>
              <span className="text-primary">{preferences.fontSize}px</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() =>
                  updatePreferences({ fontSize: Math.max(14, preferences.fontSize - 1) })
                }
                className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 font-bold text-sm"
              >
                A-
              </button>
              <input
                type="range"
                min="14"
                max="24"
                value={preferences.fontSize}
                onChange={(e) => updatePreferences({ fontSize: Number(e.target.value) })}
                className="flex-1 accent-primary cursor-pointer"
              />
              <button
                onClick={() =>
                  updatePreferences({ fontSize: Math.min(24, preferences.fontSize + 1) })
                }
                className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 font-bold text-base"
              >
                A+
              </button>
            </div>
          </div>

          {/* Line Height Selector */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Jarak Baris
            </span>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Rapat", value: 1.5 },
                { label: "Normal", value: 1.8 },
                { label: "Lebar", value: 2.1 },
              ].map((l) => (
                <button
                  key={l.value}
                  onClick={() => updatePreferences({ lineHeight: l.value })}
                  className={`py-1.5 px-3 rounded-xl text-xs font-semibold border transition-all ${
                    preferences.lineHeight === l.value
                      ? "bg-primary text-white border-primary"
                      : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
