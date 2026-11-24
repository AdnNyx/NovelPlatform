"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  BookOpen,
  Star,
  Eye,
  Bookmark,
  Bell,
  Heart,
  Play,
  List,
  CheckCircle,
  MessageSquare,
} from "lucide-react";
import { apiClient } from "@/lib/api-client";
import {
  Novel,
  ChapterListItem,
  NovelUserState,
  RatingItem,
  User,
  BookmarkCategory,
} from "@/types";

export default function NovelDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [novel, setNovel] = useState<Novel | null>(null);
  const [chapters, setChapters] = useState<ChapterListItem[]>([]);
  const [userState, setUserState] = useState<NovelUserState | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [ratings, setRatings] = useState<RatingItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Review submission state
  const [userScore, setUserScore] = useState<number>(5);
  const [userReview, setUserReview] = useState<string>("");
  const [submittingReview, setSubmittingReview] = useState<boolean>(false);
  const [reviewMessage, setReviewMessage] = useState<string>("");

  useEffect(() => {
    let isMounted = true;
    async function loadNovelData() {
      setLoading(true);
      try {
        // Fetch current user session
        try {
          const userRes = await apiClient<{ status: string; data: User | null }>("/api/auth/me");
          if (isMounted) setCurrentUser(userRes.data);
        } catch {}

        // Fetch novel details, chapters, user interaction state, and ratings
        const [novelRes, chaptersRes, userStateRes, ratingsRes] = await Promise.all([
          apiClient<{ status: string; data: Novel }>(`/api/novels/${slug}`),
          apiClient<{ status: string; data: ChapterListItem[] }>(`/api/novels/${slug}/chapters`),
          apiClient<{ status: string; data: NovelUserState }>(`/api/novels/${slug}/user-state`),
          apiClient<{ status: string; data: RatingItem[] }>(`/api/novels/${slug}/ratings`),
        ]);

        if (isMounted) {
          setNovel(novelRes.data);
          setChapters(chaptersRes.data || []);
          setUserState(userStateRes.data);
          setRatings(ratingsRes.data || []);

          if (userStateRes.data?.user_rating) {
            setUserScore(userStateRes.data.user_rating);
          }
          if (userStateRes.data?.user_review) {
            setUserReview(userStateRes.data.user_review);
          }
        }
      } catch (err) {
        console.error("Failed to load novel details:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (slug) loadNovelData();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  function requireAuth(): boolean {
    if (!currentUser) {
      router.push("/login");
      return false;
    }
    return true;
  }

  async function handleToggleFollow() {
    if (!requireAuth() || !novel) return;
    try {
      if (userState?.is_following) {
        await apiClient(`/api/follows/${novel.id}`, { method: "DELETE" });
        setUserState((prev) => (prev ? { ...prev, is_following: false } : null));
      } else {
        await apiClient(`/api/follows/${novel.id}`, { method: "POST" });
        setUserState((prev) => (prev ? { ...prev, is_following: true } : null));
      }
    } catch (err) {
      console.error("Failed to toggle follow:", err);
    }
  }

  async function handleBookmarkChange(category: BookmarkCategory) {
    if (!requireAuth() || !novel) return;
    try {
      if (userState?.bookmark_category === category) {
        await apiClient(`/api/bookmarks/${novel.id}`, { method: "DELETE" });
        setUserState((prev) => (prev ? { ...prev, bookmark_category: null } : null));
      } else {
        await apiClient("/api/bookmarks", {
          method: "POST",
          body: JSON.stringify({ novel_id: novel.id, category }),
        });
        setUserState((prev) => (prev ? { ...prev, bookmark_category: category } : null));
      }
    } catch (err) {
      console.error("Failed to update bookmark:", err);
    }
  }

  async function handleSubmitReview(e: React.FormEvent) {
    e.preventDefault();
    if (!requireAuth() || !novel) return;

    setSubmittingReview(true);
    setReviewMessage("");
    try {
      const res = await apiClient<{ status: string; data: RatingItem }>(
        `/api/novels/${novel.slug}/ratings`,
        {
          method: "POST",
          body: JSON.stringify({
            score: userScore,
            review: userReview.trim() || undefined,
          }),
        }
      );
      setReviewMessage("Ulasan Anda berhasil disimpan!");
      // Update local ratings list
      setRatings((prev) => [res.data, ...prev.filter((r) => r.user_id !== currentUser?.id)]);
      // Update userState
      setUserState((prev) =>
        prev ? { ...prev, user_rating: userScore, user_review: userReview } : null
      );
    } catch (err: any) {
      setReviewMessage(err.detail || "Gagal menyimpan ulasan.");
    } finally {
      setSubmittingReview(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-text-secondary animate-pulse">
        Memuat informasi novel...
      </div>
    );
  }

  if (!novel) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-text-primary">Novel Tidak Ditemukan</h2>
        <p className="text-sm text-text-secondary">
          Novel yang Anda cari mungkin telah dihapus atau tidak tersedia untuk publik.
        </p>
        <Link
          href="/katalog"
          className="inline-block px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold"
        >
          Kembali ke Katalog
        </Link>
      </div>
    );
  }

  // Resume vs Start Reading target
  const firstChapter = chapters.length > 0 ? chapters[0] : null;
  const resumeChapterId = userState?.last_history?.chapter_id || (firstChapter ? firstChapter.id : null);
  const isResuming = Boolean(userState?.last_history && userState.last_history.chapter_id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* Novel Header Hero */}
      <section className="bg-white rounded-3xl border border-border-subtle p-6 sm:p-8 md:p-10 shadow-sm flex flex-col md:flex-row gap-8 lg:gap-12">
        {/* Cover Image in Strict 2:3 Aspect Ratio */}
        <div className="w-full sm:w-64 md:w-72 aspect-[2/3] rounded-2xl overflow-hidden bg-gray-100 border border-border-subtle shrink-0 shadow-md">
          {novel.cover_url ? (
            <img
              src={novel.cover_url}
              alt={novel.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-indigo-50 text-indigo-400 p-4">
              <BookOpen className="w-16 h-16 mb-2 opacity-60" />
              <span className="text-xs font-semibold text-gray-500 text-center">{novel.title}</span>
            </div>
          )}
        </div>

        {/* Novel Info & Action Buttons */}
        <div className="flex-1 space-y-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  novel.status === "ongoing"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-amber-50 text-amber-700 border border-amber-200"
                }`}
              >
                {novel.status === "ongoing" ? "Ongoing" : "Tamat"}
              </span>
              {novel.genres.map((g) => (
                <span
                  key={g}
                  className="px-3 py-1 rounded-full text-xs font-semibold bg-surface-light text-text-secondary border border-border-subtle"
                >
                  {g}
                </span>
              ))}
            </div>

            <h1 className="font-sans font-extrabold text-2xl sm:text-3xl lg:text-4xl text-text-primary tracking-tight">
              {novel.title}
            </h1>

            <p className="text-sm text-text-secondary">
              Penulis: <span className="font-semibold text-text-primary">{novel.author?.display_name || "Penulis"}</span>
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex items-center gap-6 py-3 border-y border-border-subtle text-sm">
            <div className="flex items-center gap-1.5 text-secondary font-bold">
              <Star className="w-5 h-5 fill-secondary" />
              <span>{Number(novel.rating_avg).toFixed(1)}</span>
              <span className="text-xs text-text-secondary font-normal">
                ({novel.rating_count} ulasan)
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-text-secondary">
              <Eye className="w-4 h-4" />
              <span>{novel.total_views.toLocaleString("id-ID")} kali dibaca</span>
            </div>
            <div className="flex items-center gap-1.5 text-text-secondary">
              <List className="w-4 h-4" />
              <span>{novel.total_chapters} Chapter</span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Read CTA Button */}
            {resumeChapterId ? (
              <Link
                href={`/novel/${novel.slug}/chapter/${resumeChapterId}`}
                className="px-6 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-sm shadow-md shadow-primary/20 flex items-center gap-2 transition-all"
              >
                <Play className="w-4 h-4 fill-white" />
                {isResuming
                  ? `Lanjut Baca (Bab ${userState?.last_history?.chapter_number})`
                  : "Mulai Baca"}
              </Link>
            ) : (
              <button
                disabled
                className="px-6 py-3 rounded-xl bg-gray-200 text-gray-500 font-bold text-sm cursor-not-allowed"
              >
                Belum Ada Chapter
              </button>
            )}

            {/* Follow Novel Toggle Button */}
            <button
              onClick={handleToggleFollow}
              className={`px-4 py-3 rounded-xl text-sm font-semibold border flex items-center gap-2 transition-colors ${
                userState?.is_following
                  ? "bg-amber-50 text-secondary border-amber-300"
                  : "bg-surface-light hover:bg-gray-100 text-text-primary border-border-subtle"
              }`}
            >
              <Bell className={`w-4 h-4 ${userState?.is_following ? "fill-secondary text-secondary" : ""}`} />
              {userState?.is_following ? "Mengikuti" : "Ikuti Novel"}
            </button>
          </div>

          {/* Bookshelf Category Selector */}
          <div className="space-y-2 pt-2">
            <span className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
              <Bookmark className="w-3.5 h-3.5" />
              Simpan ke Rak Buku:
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {[
                { label: "Sedang Dibaca", value: "sedang_dibaca" as const },
                { label: "Ingin Dibaca", value: "ingin_dibaca" as const },
                { label: "Favorit", value: "favorit" as const },
                { label: "Selesai", value: "selesai" as const },
              ].map((b) => (
                <button
                  key={b.value}
                  onClick={() => handleBookmarkChange(b.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    userState?.bookmark_category === b.value
                      ? "bg-primary text-white border-primary shadow-sm"
                      : "bg-surface-light text-text-secondary border-border-subtle hover:text-text-primary hover:bg-gray-100"
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Synopsis Section */}
      <section className="bg-white rounded-3xl border border-border-subtle p-6 sm:p-8 space-y-4 shadow-sm">
        <h2 className="font-sans font-bold text-lg text-text-primary">Sinopsis</h2>
        <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-line">
          {novel.synopsis}
        </p>

        {novel.tags && novel.tags.length > 0 && (
          <div className="pt-4 border-t border-border-subtle flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-text-secondary font-medium mr-2">Tags:</span>
            {novel.tags.map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-1 rounded-md text-xs bg-gray-100 text-gray-600 font-medium"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </section>

      {/* Chapters List */}
      <section className="bg-white rounded-3xl border border-border-subtle p-6 sm:p-8 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="font-sans font-bold text-lg text-text-primary flex items-center gap-2">
            <List className="w-5 h-5 text-primary" />
            Daftar Chapter ({chapters.length})
          </h2>
        </div>

        {chapters.length === 0 ? (
          <p className="text-sm text-text-secondary py-6 text-center">
            Belum ada chapter yang dipublikasikan pada novel ini.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {chapters.map((ch) => (
              <Link
                key={ch.id}
                href={`/novel/${novel.slug}/chapter/${ch.id}`}
                className="p-3.5 rounded-xl border border-border-subtle hover:border-primary hover:bg-indigo-50/30 transition-all flex items-center justify-between group"
              >
                <div className="min-w-0 pr-2">
                  <span className="text-xs font-bold text-primary block">
                    Bab {ch.chapter_number}
                  </span>
                  <span className="text-xs font-medium text-text-primary group-hover:text-primary transition-colors truncate block">
                    {ch.title}
                  </span>
                </div>
                <span className="text-[10px] text-gray-400 shrink-0">
                  {new Date(ch.created_at).toLocaleDateString("id-ID")}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Ratings & Reviews Section */}
      <section className="bg-white rounded-3xl border border-border-subtle p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="font-sans font-bold text-lg text-text-primary flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-secondary" />
            Ulasan & Penilaian Pembaca ({ratings.length})
          </h2>
        </div>

        {/* Submit Review Box */}
        <form onSubmit={handleSubmitReview} className="p-4 rounded-2xl bg-surface-light border border-border-subtle space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-primary">
              {currentUser ? "Beri Nilai Novel Ini:" : "Masuk untuk Memberikan Rating & Ulasan"}
            </span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => setUserScore(s)}
                  className="p-1 focus:outline-none"
                >
                  <Star
                    className={`w-5 h-5 transition-colors ${
                      s <= userScore
                        ? "text-secondary fill-secondary"
                        : "text-gray-300 hover:text-amber-200"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <textarea
            value={userReview}
            onChange={(e) => setUserReview(e.target.value)}
            placeholder="Tulis ulasan Anda mengenai alur cerita, karakter, atau gaya penulisan novel ini..."
            rows={3}
            className="w-full p-3 rounded-xl border border-border-subtle bg-white text-xs focus:outline-none focus:ring-2 focus:ring-primary"
          />

          <div className="flex items-center justify-between">
            {reviewMessage && (
              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                {reviewMessage}
              </span>
            )}
            <div className="ml-auto">
              <button
                type="submit"
                disabled={submittingReview}
                className="px-5 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-xs shadow-sm transition-all disabled:opacity-50"
              >
                {submittingReview ? "Menyimpan..." : "Kirim Ulasan"}
              </button>
            </div>
          </div>
        </form>

        {/* Reviews List */}
        <div className="space-y-4 divide-y divide-gray-100">
          {ratings.length === 0 ? (
            <p className="text-xs text-text-secondary py-4 text-center">
              Belum ada ulasan untuk novel ini. Jadilah yang pertama memberikan penilaian!
            </p>
          ) : (
            ratings.map((r) => (
              <div key={r.id} className="pt-4 first:pt-0 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
                      {r.user.display_name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs font-bold text-text-primary">
                      {r.user.display_name}
                    </span>
                  </div>
                  <div className="flex items-center gap-0.5 text-secondary">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < r.score ? "fill-secondary text-secondary" : "text-gray-200"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                {r.review && (
                  <p className="text-xs text-text-secondary leading-relaxed pl-9">
                    {r.review}
                  </p>
                )}
                <span className="text-[10px] text-gray-400 pl-9 block">
                  {new Date(r.created_at).toLocaleDateString("id-ID")}
                </span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
