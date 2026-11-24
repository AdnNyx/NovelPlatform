"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  CheckCircle,
  XCircle,
  Trash2,
  Plus,
  Tags,
  Layers,
  Search,
  ExternalLink,
} from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { GenreItem, Novel, PaginatedResponse, TagItem } from "@/types";

export default function AdminNovelsPage() {
  const [novels, setNovels] = useState<Novel[]>([]);
  const [genres, setGenres] = useState<GenreItem[]>([]);
  const [tags, setTags] = useState<TagItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // New genre/tag input states
  const [newGenreName, setNewGenreName] = useState<string>("");
  const [newTagName, setNewTagName] = useState<string>("");
  const [addingGenre, setAddingGenre] = useState<boolean>(false);
  const [addingTag, setAddingTag] = useState<boolean>(false);

  useEffect(() => {
    loadAllData();
  }, []);

  async function loadAllData() {
    setLoading(true);
    try {
      const [novelsRes, genresRes, tagsRes] = await Promise.all([
        apiClient<PaginatedResponse<Novel>>("/api/admin/novels", { params: { limit: 50 } }),
        apiClient<{ status: string; data: GenreItem[] }>("/api/admin/genres"),
        apiClient<{ status: string; data: TagItem[] }>("/api/admin/tags"),
      ]);
      setNovels(novelsRes.data || []);
      setGenres(genresRes.data || []);
      setTags(tagsRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleApprove(novelId: string, currentStatus: boolean) {
    try {
      const res = await apiClient<{ status: string; data: Novel }>(
        `/api/admin/novels/${novelId}/approve`,
        {
          method: "PUT",
          body: JSON.stringify({ is_approved: !currentStatus }),
        }
      );
      setNovels((prev) =>
        prev.map((n) => (n.id === novelId ? { ...n, is_approved: !currentStatus } : n))
      );
    } catch (err: any) {
      alert(err.detail || "Gagal mengubah status persetujuan novel.");
    }
  }

  async function handleDeleteNovel(novelId: string, title: string) {
    if (!window.confirm(`Hapus permanen novel "${title}"? Seluruh chapter akan ikut terhapus.`)) {
      return;
    }
    try {
      await apiClient(`/api/admin/novels/${novelId}`, { method: "DELETE" });
      setNovels((prev) => prev.filter((n) => n.id !== novelId));
    } catch (err: any) {
      alert(err.detail || "Gagal menghapus novel.");
    }
  }

  async function handleCreateGenre(e: React.FormEvent) {
    e.preventDefault();
    if (!newGenreName.trim()) return;

    setAddingGenre(true);
    try {
      const res = await apiClient<{ status: string; data: GenreItem }>("/api/admin/genres", {
        method: "POST",
        body: JSON.stringify({ name: newGenreName.trim() }),
      });
      setGenres((prev) => [...prev, res.data]);
      setNewGenreName("");
    } catch (err: any) {
      alert(err.detail || "Gagal menambahkan genre.");
    } finally {
      setAddingGenre(false);
    }
  }

  async function handleDeleteGenre(id: string) {
    if (!window.confirm("Hapus genre ini?")) return;
    try {
      await apiClient(`/api/admin/genres/${id}`, { method: "DELETE" });
      setGenres((prev) => prev.filter((g) => g.id !== id));
    } catch (err: any) {
      alert(err.detail || "Gagal menghapus genre.");
    }
  }

  async function handleCreateTag(e: React.FormEvent) {
    e.preventDefault();
    if (!newTagName.trim()) return;

    setAddingTag(true);
    try {
      const res = await apiClient<{ status: string; data: TagItem }>("/api/admin/tags", {
        method: "POST",
        body: JSON.stringify({ name: newTagName.trim() }),
      });
      setTags((prev) => [...prev, res.data]);
      setNewTagName("");
    } catch (err: any) {
      alert(err.detail || "Gagal menambahkan tag.");
    } finally {
      setAddingTag(false);
    }
  }

  async function handleDeleteTag(id: string) {
    if (!window.confirm("Hapus tag ini?")) return;
    try {
      await apiClient(`/api/admin/tags/${id}`, { method: "DELETE" });
      setTags((prev) => prev.filter((t) => t.id !== id));
    } catch (err: any) {
      alert(err.detail || "Gagal menghapus tag.");
    }
  }

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 animate-pulse text-sm">
        Memuat data novel dan kategori...
      </div>
    );
  }

  return (
    <div className="space-y-10 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="font-sans font-extrabold text-2xl text-slate-900 tracking-tight flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-primary" />
          Kelola Novel & Master Kategori
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Tinjau publikasi novel platform dan kelola master daftar genre serta tag pencarian
        </p>
      </div>

      {/* Part 1: Novel Moderation Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-sm text-slate-900">
            Daftar Seluruh Novel Platform ({novels.length})
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-6">Karya Novel</th>
                <th className="py-3 px-4">Penulis</th>
                <th className="py-3 px-4">Status Rilis</th>
                <th className="py-3 px-4">Persetujuan</th>
                <th className="py-3 px-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {novels.map((novel) => (
                <tr key={novel.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-4 px-6 flex items-center gap-3">
                    <div className="w-10 aspect-[2/3] rounded bg-slate-100 overflow-hidden border border-slate-200 shrink-0">
                      {novel.cover_url ? (
                        <img
                          src={novel.cover_url}
                          alt={novel.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-indigo-400 bg-indigo-50">
                          <BookOpen className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                    <span className="font-bold text-slate-900 line-clamp-1">
                      {novel.title}
                    </span>
                  </td>
                  <td className="py-4 px-4 font-semibold text-slate-600">
                    {novel.author?.display_name || "Penulis"}
                  </td>
                  <td className="py-4 px-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        novel.status === "ongoing"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {novel.status === "ongoing" ? "Ongoing" : "Tamat"}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <button
                      onClick={() => handleToggleApprove(novel.id, novel.is_approved)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 transition-colors ${
                        novel.is_approved
                          ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                          : "bg-amber-100 text-amber-800 hover:bg-amber-200"
                      }`}
                    >
                      {novel.is_approved ? (
                        <>
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                          Disetujui
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3 text-amber-600" />
                          Ditahan
                        </>
                      )}
                    </button>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/novel/${novel.slug}`}
                        target="_blank"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                        title="Lihat Halaman Publik"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDeleteNovel(novel.id, novel.title)}
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                        title="Hapus Novel"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Part 2: Master Genres & Tags Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Genres Panel */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              Master Genre ({genres.length})
            </h3>
          </div>

          <form onSubmit={handleCreateGenre} className="flex gap-2">
            <input
              type="text"
              required
              value={newGenreName}
              onChange={(e) => setNewGenreName(e.target.value)}
              placeholder="Nama genre baru..."
              className="flex-1 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              type="submit"
              disabled={addingGenre || !newGenreName.trim()}
              className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold shrink-0 disabled:opacity-50"
            >
              Tambah
            </button>
          </form>

          <div className="flex flex-wrap gap-2 pt-2 max-h-56 overflow-y-auto">
            {genres.map((g) => (
              <span
                key={g.id}
                className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-2"
              >
                {g.name}
                <button
                  onClick={() => handleDeleteGenre(g.id)}
                  className="text-slate-400 hover:text-red-500 transition-colors"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Tags Panel */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Tags className="w-4 h-4 text-secondary" />
              Master Tag ({tags.length})
            </h3>
          </div>

          <form onSubmit={handleCreateTag} className="flex gap-2">
            <input
              type="text"
              required
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="Nama tag baru..."
              className="flex-1 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              type="submit"
              disabled={addingTag || !newTagName.trim()}
              className="px-4 py-2 rounded-xl bg-secondary text-white text-xs font-bold shrink-0 disabled:opacity-50"
            >
              Tambah
            </button>
          </form>

          <div className="flex flex-wrap gap-2 pt-2 max-h-56 overflow-y-auto">
            {tags.map((t) => (
              <span
                key={t.id}
                className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-2"
              >
                #{t.name}
                <button
                  onClick={() => handleDeleteTag(t.id)}
                  className="text-slate-400 hover:text-red-500 transition-colors"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
