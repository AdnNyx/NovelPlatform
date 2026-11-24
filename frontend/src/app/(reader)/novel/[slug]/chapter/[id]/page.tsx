"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, List } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import {
  ChapterDetail,
  ChapterListItem,
  NovelUserState,
  User,
} from "@/types";
import {
  ReaderToolbar,
  ReaderPreferences,
} from "@/components/reader/ReaderToolbar";
import { ChapterListDrawer } from "@/components/reader/ChapterListDrawer";
import { ChapterComments } from "@/components/reader/ChapterComments";

export default function ReaderChapterPage() {
  const params = useParams();
  const router = useRouter();

  const slug = params.slug as string;
  const chapterId = params.id as string;

  const [chapter, setChapter] = useState<ChapterDetail | null>(null);
  const [allChapters, setAllChapters] = useState<ChapterListItem[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userState, setUserState] = useState<NovelUserState | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);

  // Typography preferences state
  const [preferences, setPreferences] = useState<ReaderPreferences>({
    theme: "Terang",
    fontSize: 18,
    fontFamily: "serif",
    lineHeight: 1.8,
  });

  const contentRef = useRef<HTMLDivElement>(null);
  const scrollDebounceTimer = useRef<NodeJS.Timeout | null>(null);
  const hasRestoredScroll = useRef<boolean>(false);

  // 1. Load Chapter & User Session
  useEffect(() => {
    let isMounted = true;
    hasRestoredScroll.current = false;

    async function loadData() {
      setLoading(true);
      try {
        // Fetch current user
        try {
          const userRes = await apiClient<{ status: string; data: User | null }>("/api/auth/me");
          if (isMounted) setCurrentUser(userRes.data);
        } catch {}

        // Fetch chapter detail, novel chapters, and user state
        const [chapterRes, chaptersListRes, stateRes] = await Promise.all([
          apiClient<{ status: string; data: ChapterDetail }>(`/api/chapters/${chapterId}`),
          apiClient<{ status: string; data: ChapterListItem[] }>(`/api/novels/${slug}/chapters`),
          apiClient<{ status: string; data: NovelUserState }>(`/api/novels/${slug}/user-state`),
        ]);

        if (isMounted) {
          setChapter(chapterRes.data);
          setAllChapters(chaptersListRes.data || []);
          setUserState(stateRes.data);
        }
      } catch (err) {
        console.error("Failed to load chapter:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (chapterId && slug) {
      loadData();
    }

    return () => {
      isMounted = false;
    };
  }, [chapterId, slug]);

  // 2. Auto-scroll to saved last_position if resuming
  useEffect(() => {
    if (!loading && chapter && userState?.last_history && !hasRestoredScroll.current) {
      const saved = userState.last_history;
      if (saved.chapter_id === chapter.id && Number(saved.last_position) > 0) {
        hasRestoredScroll.current = true;
        setTimeout(() => {
          const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
          if (totalHeight > 0) {
            const targetY = (Number(saved.last_position) / 100) * totalHeight;
            window.scrollTo({ top: targetY, behavior: "smooth" });
          }
        }, 300);
      }
    }
  }, [loading, chapter, userState]);

  // 3. Debounced Native Scroll Position Tracking for Authenticated Users
  useEffect(() => {
    if (!currentUser || !chapter) return;
    const activeChapter = chapter;

    function handleScroll() {
      if (scrollDebounceTimer.current) {
        clearTimeout(scrollDebounceTimer.current);
      }

      scrollDebounceTimer.current = setTimeout(async () => {
        const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
        if (totalHeight <= 0) return;

        const currentPos = (window.scrollY / totalHeight) * 100;
        const normalized = Math.min(100, Math.max(0, parseFloat(currentPos.toFixed(2))));

        try {
          await apiClient("/api/histories", {
            method: "POST",
            body: JSON.stringify({
              novel_id: activeChapter.novel_id,
              chapter_id: activeChapter.id,
              last_position: normalized,
            }),
          });
        } catch {
          // Ignore history save errors silently
        }
      }, 3000); // Debounced 3 seconds
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (scrollDebounceTimer.current) {
        clearTimeout(scrollDebounceTimer.current);
      }
    };
  }, [currentUser, chapter]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm opacity-60 animate-pulse">
        Menyiapkan lembar bacaan...
      </div>
    );
  }

  if (!chapter) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 space-y-4 text-center">
        <h2 className="text-xl font-bold">Chapter Tidak Ditemukan</h2>
        <Link
          href={`/novel/${slug}`}
          className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-semibold"
        >
          Kembali ke Detail Novel
        </Link>
      </div>
    );
  }

  // Map font family classes
  const fontFamilyClass =
    preferences.fontFamily === "serif"
      ? "font-reader-serif"
      : preferences.fontFamily === "mono"
      ? "font-mono"
      : "font-sans";

  return (
    <div className="min-h-screen flex flex-col">
      {/* 
        Native Reader Toolbar
        NO Lenis & NO GSAP loaded per AGENTS.md Section 2
      */}
      <ReaderToolbar
        novelTitle={chapter.novel_title}
        novelSlug={slug}
        chapterNumber={chapter.chapter_number}
        chapterTitle={chapter.title}
        prevChapterId={chapter.prev_chapter_id}
        nextChapterId={chapter.next_chapter_id}
        onOpenDrawer={() => setDrawerOpen(true)}
        onPreferencesChange={setPreferences}
      />

      {/* Main Distraction-Free Reading Canvas */}
      <main className="flex-1 py-12 px-4 sm:px-6">
        <div
          ref={contentRef}
          className="mx-auto max-w-[68ch] space-y-8"
          style={{
            fontSize: `${preferences.fontSize}px`,
            lineHeight: preferences.lineHeight,
          }}
        >
          {/* Chapter Header */}
          <div className="text-center pb-8 border-b border-border-subtle/50 space-y-2">
            <span className="text-xs uppercase font-bold tracking-widest opacity-60">
              Bab {chapter.chapter_number}
            </span>
            <h1 className="font-sans font-bold text-2xl sm:text-3xl lg:text-4xl leading-tight">
              {chapter.title}
            </h1>
          </div>

          {/* Sanitized Chapter Content */}
          <article
            className={`reader-story-content prose prose-lg max-w-none transition-all ${fontFamilyClass}`}
            dangerouslySetInnerHTML={{ __html: chapter.content_html }}
          />

          {/* Bottom Prev / Next Navigation Controls */}
          <nav className="pt-12 border-t border-border-subtle/60 flex items-center justify-between gap-4">
            {chapter.prev_chapter_id ? (
              <Link
                href={`/novel/${slug}/chapter/${chapter.prev_chapter_id}`}
                className="px-5 py-3 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 font-bold text-xs flex items-center gap-2 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
                Bab Sebelumnya
              </Link>
            ) : (
              <span className="px-5 py-3 rounded-xl opacity-20 text-xs font-bold cursor-not-allowed border border-border-subtle/20 flex items-center gap-2">
                <ChevronLeft className="w-4 h-4" />
                Awal Cerita
              </span>
            )}

            <button
              onClick={() => setDrawerOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-4 py-3 rounded-xl bg-black/5 dark:bg-white/10 text-xs font-bold"
            >
              <List className="w-4 h-4" />
              Daftar Bab
            </button>

            {chapter.next_chapter_id ? (
              <Link
                href={`/novel/${slug}/chapter/${chapter.next_chapter_id}`}
                className="px-5 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all"
              >
                Bab Selanjutnya
                <ChevronRight className="w-4 h-4" />
              </Link>
            ) : (
              <span className="px-5 py-3 rounded-xl opacity-20 text-xs font-bold cursor-not-allowed border border-border-subtle/20 flex items-center gap-2">
                Bab Terakhir
                <ChevronRight className="w-4 h-4" />
              </span>
            )}
          </nav>

          {/* Chapter Comments & Discussion */}
          <ChapterComments
            chapterId={chapter.id}
            novelId={chapter.novel_id}
            currentUser={currentUser}
          />
        </div>
      </main>

      {/* Chapter List Slide-Over Drawer */}
      <ChapterListDrawer
        isOpen={drawerOpen}
        novelTitle={chapter.novel_title}
        novelSlug={slug}
        currentChapterId={chapter.id}
        chapters={allChapters}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  );
}
