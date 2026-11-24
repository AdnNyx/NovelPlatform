"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Eye,
  BookOpen,
  List,
  Bookmark,
  Plus,
  Edit,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { Novel, NovelisDashboardData } from "@/types";

export default function NovelisDashboardPage() {
  const [data, setData] = useState<NovelisDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    try {
      const res = await apiClient<{ status: string; data: NovelisDashboardData }>(
        "/api/novelis/dashboard"
      );
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteNovel(id: string, title: string) {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus novel "${title}" beserta seluruh chapternya?`)) {
      return;
    }

    setDeletingId(id);
    try {
      await apiClient(`/api/novels/${id}`, { method: "DELETE" });
      loadDashboard();
    } catch (err: any) {
      alert(err.detail || "Gagal menghapus novel.");
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 animate-pulse text-sm">
        Memuat dashboard penulis...
      </div>
    );
  }

  const stats = data?.stats || {
    total_views: 0,
    total_novels: 0,
    total_chapters: 0,
    total_bookmarks: 0,
  };
  const novels = data?.novels || [];

  return (
    <div className="space-y-8">
      {/* Page Title & Create Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-sans font-extrabold text-2xl text-slate-900 tracking-tight">
            Dashboard Penulis
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola karya novel Anda, tinjau metrik pembaca, dan publikasikan bab baru
          </p>
        </div>
        <Link
          href="/staff/novelis/novel/create"
          className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-md shadow-primary/20 flex items-center gap-1.5 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Tulis Novel Baru
        </Link>
      </div>

      {/* 4 Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Total Pembaca
            </span>
            <div className="p-2 rounded-lg bg-indigo-50 text-primary">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <p className="font-sans font-extrabold text-2xl text-slate-900">
            {stats.total_views.toLocaleString("id-ID")}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Karya Novel
            </span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <p className="font-sans font-extrabold text-2xl text-slate-900">
            {stats.total_novels}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Total Chapter
            </span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <List className="w-4 h-4" />
            </div>
          </div>
          <p className="font-sans font-extrabold text-2xl text-slate-900">
            {stats.total_chapters}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Disimpan di Rak
            </span>
            <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
              <Bookmark className="w-4 h-4" />
            </div>
          </div>
          <p className="font-sans font-extrabold text-2xl text-slate-900">
            {stats.total_bookmarks}
          </p>
        </div>
      </div>

      {/* Owned Novels Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-sm text-slate-800">Daftar Novel Saya ({novels.length})</h2>
        </div>

        {novels.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            Anda belum memiliki karya novel. Klik &quot;Tulis Novel Baru&quot; untuk memulai.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-6">Karya Novel</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Total Bab</th>
                  <th className="py-3 px-4">Pembaca</th>
                  <th className="py-3 px-4">Rating</th>
                  <th className="py-3 px-6 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {novels.map((novel) => (
                  <tr key={novel.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-4 px-6 flex items-center gap-3">
                      <div className="w-10 aspect-[2/3] rounded-md bg-slate-100 overflow-hidden border border-slate-200 shrink-0">
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
                      <div className="min-w-0">
                        <Link
                          href={`/staff/novelis/novel/${novel.id}/edit`}
                          className="font-bold text-slate-900 hover:text-primary transition-colors truncate block"
                        >
                          {novel.title}
                        </Link>
                        <span className="text-[10px] text-slate-400">
                          {novel.genres.slice(0, 2).join(", ")}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          novel.status === "ongoing"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {novel.status === "ongoing" ? "Ongoing" : "Tamat"}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-semibold">{novel.total_chapters} Bab</td>
                    <td className="py-4 px-4">{novel.total_views.toLocaleString("id-ID")}</td>
                    <td className="py-4 px-4 font-semibold text-secondary">
                      ★ {Number(novel.rating_avg).toFixed(1)}
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
                        <Link
                          href={`/staff/novelis/novel/${novel.id}/edit`}
                          className="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-primary font-bold text-[11px] flex items-center gap-1 transition-colors"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          Kelola
                        </Link>
                        <button
                          onClick={() => handleDeleteNovel(novel.id, novel.title)}
                          disabled={deletingId === novel.id}
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
        )}
      </div>
    </div>
  );
}
