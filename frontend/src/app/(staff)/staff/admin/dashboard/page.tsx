"use client";

import React, { useEffect, useState } from "react";
import {
  Users,
  BookOpen,
  List,
  AlertTriangle,
  Trash2,
  ShieldCheck,
  CheckCircle,
} from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { AdminCommentOut, AdminStats } from "@/types";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [reportedComments, setReportedComments] = useState<AdminCommentOut[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [statsRes, commentsRes] = await Promise.all([
        apiClient<{ status: string; data: AdminStats }>("/api/admin/stats"),
        apiClient<{ status: string; data: AdminCommentOut[] }>("/api/admin/comments", {
          params: { reported_only: true },
        }),
      ]);
      setStats(statsRes.data);
      setReportedComments(commentsRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteComment(id: string) {
    if (!window.confirm("Hapus komentar yang dilaporkan ini?")) return;

    setDeletingId(id);
    try {
      await apiClient(`/api/admin/comments/${id}`, { method: "DELETE" });
      setReportedComments((prev) => prev.filter((c) => c.id !== id));
      if (stats) {
        setStats({ ...stats, reported_comments: Math.max(0, stats.reported_comments - 1) });
      }
    } catch (err: any) {
      alert(err.detail || "Gagal menghapus komentar.");
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 animate-pulse text-sm">
        Memuat data dashboard administrator...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-sans font-extrabold text-2xl text-slate-900 tracking-tight flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-primary" />
          Dashboard Administrator
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Pantau statistik platform, kelola pengguna, dan tangani laporan konten
        </p>
      </div>

      {/* Global Platform Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Total Pengguna
            </span>
            <div className="p-2 rounded-lg bg-indigo-50 text-primary">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="font-sans font-extrabold text-2xl text-slate-900">
            {stats?.total_users.toLocaleString("id-ID") || 0}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Total Novel
            </span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <p className="font-sans font-extrabold text-2xl text-slate-900">
            {stats?.total_novels || 0}
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
            {stats?.total_chapters || 0}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Laporan Komentar
            </span>
            <div className="p-2 rounded-lg bg-red-50 text-red-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="font-sans font-extrabold text-2xl text-slate-900">
            {stats?.reported_comments || 0}
          </p>
        </div>
      </div>

      {/* Reported Comments Moderation Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            Komentar Dilaporkan untuk Dimoderasi ({reportedComments.length})
          </h2>
        </div>

        {reportedComments.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            Tidak ada komentar yang dilaporkan saat ini. Semua diskusi bersih!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-6">Pengirim</th>
                  <th className="py-3 px-4">Isi Komentar</th>
                  <th className="py-3 px-4">Waktu</th>
                  <th className="py-3 px-6 text-right">Moderasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {reportedComments.map((comment) => (
                  <tr key={comment.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-4 px-6 font-bold text-slate-900">
                      {comment.user.display_name}
                      <span className="block text-[10px] text-slate-400 font-normal">
                        Role: {comment.user.role}
                      </span>
                    </td>
                    <td className="py-4 px-4 max-w-md">
                      <p className="line-clamp-2 text-slate-800 bg-red-50/50 p-2 rounded-lg border border-red-100">
                        {comment.content}
                      </p>
                    </td>
                    <td className="py-4 px-4 text-slate-400 whitespace-nowrap">
                      {new Date(comment.created_at).toLocaleDateString("id-ID")}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        disabled={deletingId === comment.id}
                        className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs flex items-center gap-1 ml-auto transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Hapus Komentar
                      </button>
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
