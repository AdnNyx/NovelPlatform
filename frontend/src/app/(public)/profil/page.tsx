"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User as UserIcon,
  Bookmark,
  History,
  Camera,
  Play,
  CheckCircle,
  AlertCircle,
  BookOpen,
} from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { User, Bookmark as BookmarkType, HistoryItem, BookmarkCategory } from "@/types";
import { NovelCard } from "@/components/public/NovelCard";

export default function ProfilePage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Edit display name state
  const [displayName, setDisplayName] = useState<string>("");
  const [updatingName, setUpdatingName] = useState<boolean>(false);
  const [avatarUploading, setAvatarUploading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Tabs state
  const [activeTab, setActiveTab] = useState<"bookshelf" | "history">("bookshelf");
  const [bookmarkCategory, setBookmarkCategory] = useState<BookmarkCategory>("sedang_dibaca");

  const [bookmarks, setBookmarks] = useState<BookmarkType[]>([]);
  const [histories, setHistories] = useState<HistoryItem[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      setLoading(true);
      try {
        const userRes = await apiClient<{ status: string; data: User | null }>("/api/auth/me");
        if (!userRes.data) {
          router.push("/login");
          return;
        }

        if (isMounted) {
          setUser(userRes.data);
          setDisplayName(userRes.data.display_name);
        }

        // Fetch bookmarks & histories
        const [bookmarksRes, historiesRes] = await Promise.all([
          apiClient<{ status: string; data: BookmarkType[] }>("/api/bookmarks"),
          apiClient<{ status: string; data: HistoryItem[] }>("/api/histories"),
        ]);

        if (isMounted) {
          setBookmarks(bookmarksRes.data || []);
          setHistories(historiesRes.data || []);
        }
      } catch (err) {
        console.error(err);
        router.push("/login");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [router]);

  async function handleUpdateName(e: React.FormEvent) {
    e.preventDefault();
    if (!displayName.trim()) return;

    setUpdatingName(true);
    setStatusMessage("");
    setErrorMessage("");

    try {
      const res = await apiClient<{ status: string; data: User }>("/api/profile", {
        method: "PUT",
        body: JSON.stringify({ display_name: displayName.trim() }),
      });
      setUser(res.data);
      setStatusMessage("Nama tampilan berhasil diperbarui.");
    } catch (err: any) {
      setErrorMessage(err.detail || "Gagal memperbarui nama.");
    } finally {
      setUpdatingName(false);
    }
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setErrorMessage("Ukuran gambar maksimal 2 MB.");
      return;
    }

    setAvatarUploading(true);
    setStatusMessage("");
    setErrorMessage("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await apiClient<{ status: string; data: { avatar_url: string } }>(
        "/api/profile/avatar",
        {
          method: "POST",
          body: formData,
        }
      );
      setUser((prev) => (prev ? { ...prev, avatar_url: res.data.avatar_url } : null));
      setStatusMessage("Foto profil berhasil diperbarui.");
    } catch (err: any) {
      setErrorMessage(err.detail || "Gagal mengunggah avatar.");
    } finally {
      setAvatarUploading(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-text-secondary animate-pulse">
        Memuat profil pembaca...
      </div>
    );
  }

  if (!user) return null;

  // Filter bookmarks by active category
  const filteredBookmarks = bookmarks.filter((b) => b.category === bookmarkCategory);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Profile Header Box */}
      <section className="bg-white rounded-3xl border border-border-subtle p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-center md:items-start gap-6">
        {/* Avatar with Upload Badge */}
        <div className="relative group shrink-0">
          <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-border-subtle bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold shadow-md">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.display_name}
                className="w-full h-full object-cover"
              />
            ) : (
              user.display_name.charAt(0).toUpperCase()
            )}
          </div>

          <label
            htmlFor="avatar-upload"
            className="absolute bottom-0 right-0 p-2 rounded-full bg-primary hover:bg-primary-hover text-white shadow-md cursor-pointer transition-colors"
            title="Ubah Foto Profil"
          >
            <Camera className="w-4 h-4" />
            <input
              id="avatar-upload"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleAvatarChange}
              disabled={avatarUploading}
              className="hidden"
            />
          </label>
        </div>

        {/* Profile Details & Form */}
        <div className="flex-1 w-full space-y-4">
          <div className="text-center md:text-left">
            <h1 className="font-sans font-extrabold text-2xl text-text-primary">
              {user.display_name}
            </h1>
            <p className="text-xs text-text-secondary">{user.email}</p>
            <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-primary border border-indigo-100">
              Peran: {user.role}
            </span>
          </div>

          {/* Messages */}
          {statusMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Edit Display Name Form */}
          <form onSubmit={handleUpdateName} className="flex flex-wrap items-center gap-2 max-w-md">
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Nama tampilan baru"
              className="flex-1 px-3.5 py-2 rounded-xl border border-border-subtle bg-surface-light text-xs focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              type="submit"
              disabled={updatingName || !displayName.trim()}
              className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-xs shadow-sm transition-all disabled:opacity-50"
            >
              {updatingName ? "Menyimpan..." : "Simpan Nama"}
            </button>
          </form>
        </div>
      </section>

      {/* Main Tabs: Rak Buku vs Riwayat Baca */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b border-border-subtle pb-4">
          <button
            onClick={() => setActiveTab("bookshelf")}
            className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${
              activeTab === "bookshelf"
                ? "bg-primary text-white shadow-sm"
                : "text-text-secondary hover:text-text-primary bg-white border border-border-subtle"
            }`}
          >
            <Bookmark className="w-4 h-4" />
            Rak Buku Saya ({bookmarks.length})
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${
              activeTab === "history"
                ? "bg-primary text-white shadow-sm"
                : "text-text-secondary hover:text-text-primary bg-white border border-border-subtle"
            }`}
          >
            <History className="w-4 h-4" />
            Riwayat Membaca ({histories.length})
          </button>
        </div>

        {/* Tab 1: Bookshelf */}
        {activeTab === "bookshelf" && (
          <div className="space-y-6">
            {/* Shelf Category Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {[
                { label: "Sedang Dibaca", value: "sedang_dibaca" as const },
                { label: "Ingin Dibaca", value: "ingin_dibaca" as const },
                { label: "Favorit", value: "favorit" as const },
                { label: "Selesai", value: "selesai" as const },
              ].map((c) => (
                <button
                  key={c.value}
                  onClick={() => setBookmarkCategory(c.value)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    bookmarkCategory === c.value
                      ? "bg-text-primary text-white shadow-sm"
                      : "bg-white text-text-secondary border border-border-subtle hover:text-text-primary"
                  }`}
                >
                  {c.label} ({bookmarks.filter((b) => b.category === c.value).length})
                </button>
              ))}
            </div>

            {/* Bookshelf Novel Cards Grid */}
            {filteredBookmarks.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-white border border-border-subtle">
                <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-text-primary font-bold text-sm">Belum ada novel di rak ini</p>
                <p className="text-xs text-text-secondary mt-1">
                  Kunjungi katalog untuk menemukan dan menyimpan cerita menarik.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
                {filteredBookmarks.map((b) => (
                  <NovelCard key={b.id} novel={b.novel} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Reading History */}
        {activeTab === "history" && (
          <div className="bg-white rounded-2xl border border-border-subtle shadow-sm overflow-hidden divide-y divide-gray-100">
            {histories.length === 0 ? (
              <div className="p-12 text-center text-sm text-text-secondary">
                Belum ada riwayat bacaan. Mulai membaca novel untuk merekam progres bab Anda.
              </div>
            ) : (
              histories.map((h) => (
                <div
                  key={h.id}
                  className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-12 aspect-[2/3] rounded-lg overflow-hidden bg-gray-100 border border-border-subtle shrink-0">
                      {h.cover_url ? (
                        <img
                          src={h.cover_url}
                          alt={h.novel_title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-indigo-50 text-indigo-400">
                          <BookOpen className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <Link
                        href={`/novel/${h.novel_slug}`}
                        className="font-bold text-sm text-text-primary hover:text-primary transition-colors truncate block"
                      >
                        {h.novel_title}
                      </Link>
                      <p className="text-xs text-text-secondary mt-0.5">
                        Terakhir dibaca: Bab {h.chapter_number} — {h.chapter_title}
                      </p>
                      <span className="text-[10px] text-gray-400">
                        Progres: {Number(h.last_position).toFixed(0)}% • {new Date(h.updated_at).toLocaleDateString("id-ID")}
                      </span>
                    </div>
                  </div>

                  <Link
                    href={`/novel/${h.novel_slug}/chapter/${h.chapter_id}`}
                    className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-sm transition-all"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    Lanjut Baca
                  </Link>
                </div>
              ))
            )}
          </div>
        )}
      </section>
    </div>
  );
}
