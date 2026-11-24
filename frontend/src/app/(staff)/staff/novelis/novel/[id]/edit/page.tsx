"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Edit3,
  List,
  Plus,
  Trash2,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  FileUp,
  FileText,
  Eye,
} from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { ChapterListItem, GenreItem, Novel } from "@/types";
import { TipTapEditor } from "@/components/editor/TipTapEditor";
import { PdfUploadPanel } from "@/components/editor/PdfUploadPanel";

export default function EditNovelPage() {
  const params = useParams();
  const novelId = params.id as string;

  const [novel, setNovel] = useState<Novel | null>(null);
  const [chapters, setChapters] = useState<ChapterListItem[]>([]);
  const [availableGenres, setAvailableGenres] = useState<GenreItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Edit Metadata State
  const [title, setTitle] = useState<string>("");
  const [synopsis, setSynopsis] = useState<string>("");
  const [status, setStatus] = useState<"ongoing" | "tamat">("ongoing");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [tagsInput, setTagsInput] = useState<string>("");
  const [updatingMetadata, setUpdatingMetadata] = useState<boolean>(false);
  const [metadataFeedback, setMetadataFeedback] = useState<string>("");

  // Chapters Editor State
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [showChapterEditor, setShowChapterEditor] = useState<boolean>(false);
  const [chapterMode, setChapterMode] = useState<"manual" | "pdf">("manual");
  const [editorTitle, setEditorTitle] = useState<string>("");
  const [editorChapterNumber, setEditorChapterNumber] = useState<number>(1);
  const [editorHtml, setEditorHtml] = useState<string>("");
  const [savingChapter, setSavingChapter] = useState<boolean>(false);

  useEffect(() => {
    loadNovelAndChapters();
  }, [novelId]);

  async function loadNovelAndChapters() {
    setLoading(true);
    try {
      // Load novel metadata (by ID from list or direct)
      const resNovels = await apiClient<{ status: string; data: Novel[] }>("/api/admin/novels");
      const currentNovel = resNovels.data?.find((n) => n.id === novelId);

      if (currentNovel) {
        setNovel(currentNovel);
        setTitle(currentNovel.title);
        setSynopsis(currentNovel.synopsis);
        setStatus(currentNovel.status);
        setSelectedGenres(currentNovel.genres || []);
        setTagsInput((currentNovel.tags || []).join(", "));

        // Load chapters for this novel
        const chapRes = await apiClient<{ status: string; data: ChapterListItem[] }>(
          `/api/novels/${currentNovel.slug}/chapters`
        );
        setChapters(chapRes.data || []);
      }

      // Load genres
      const genRes = await apiClient<{ status: string; data: GenreItem[] }>("/api/genres");
      setAvailableGenres(genRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateMetadata(e: React.FormEvent) {
    e.preventDefault();
    if (!novel) return;

    setUpdatingMetadata(true);
    setMetadataFeedback("");

    const tagsArray = tagsInput
      .split(",")
      .map((t) => t.trim().replace(/^#/, ""))
      .filter(Boolean);

    try {
      const res = await apiClient<{ status: string; data: Novel }>(`/api/novels/${novel.id}`, {
        method: "PUT",
        body: JSON.stringify({
          title: title.trim(),
          synopsis: synopsis.trim(),
          status,
          genres: selectedGenres,
          tags: tagsArray,
        }),
      });
      setNovel(res.data);
      setMetadataFeedback("Metadata novel berhasil diperbarui!");
    } catch (err: any) {
      setMetadataFeedback(err.detail || "Gagal memperbarui metadata.");
    } finally {
      setUpdatingMetadata(false);
    }
  }

  function handleStartNewChapter() {
    setEditingChapterId(null);
    setEditorTitle(`Bab ${chapters.length + 1}: `);
    setEditorChapterNumber(chapters.length + 1);
    setEditorHtml("<p>Tulis bab baru di sini...</p>");
    setShowChapterEditor(true);
  }

  async function handleEditChapter(ch: ChapterListItem) {
    try {
      const res = await apiClient<{
        status: string;
        data: { title: string; chapter_number: number; content_html: string };
      }>(`/api/chapters/${ch.id}`);

      setEditingChapterId(ch.id);
      setEditorTitle(res.data.title);
      setEditorChapterNumber(res.data.chapter_number);
      setEditorHtml(res.data.content_html);
      setShowChapterEditor(true);
    } catch (err: any) {
      alert(err.detail || "Gagal memuat isi chapter.");
    }
  }

  async function handleDeleteChapter(id: string, chapterTitle: string) {
    if (!window.confirm(`Hapus "${chapterTitle}"? Tindakan ini tidak dapat dibatalkan.`)) {
      return;
    }
    try {
      await apiClient(`/api/chapters/${id}`, { method: "DELETE" });
      loadNovelAndChapters();
    } catch (err: any) {
      alert(err.detail || "Gagal menghapus chapter.");
    }
  }

  async function handleSaveChapter(chapterData: {
    title: string;
    chapter_number: number;
    content_html: string;
    is_draft: boolean;
    is_published: boolean;
    published_at: string | null;
  }) {
    if (!novel) return;

    setSavingChapter(true);
    try {
      if (editingChapterId) {
        // Update Chapter
        await apiClient(`/api/chapters/${editingChapterId}`, {
          method: "PUT",
          body: JSON.stringify(chapterData),
        });
      } else {
        // Create Chapter
        await apiClient("/api/chapters", {
          method: "POST",
          body: JSON.stringify({
            novel_id: novel.id,
            ...chapterData,
          }),
        });
      }
      setShowChapterEditor(false);
      loadNovelAndChapters();
    } catch (err: any) {
      alert(err.detail || "Gagal menyimpan chapter.");
    } finally {
      setSavingChapter(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 animate-pulse text-sm">
        Memuat data novel...
      </div>
    );
  }

  if (!novel) {
    return (
      <div className="p-8 text-center text-slate-500 text-sm">
        Novel tidak ditemukan.
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-sans font-extrabold text-2xl text-slate-900 tracking-tight flex items-center gap-2">
            <Edit3 className="w-6 h-6 text-primary" />
            Kelola Novel: {novel.title}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Perbarui naskah bab, ubah informasi novel, atau pantau ulasan pembaca
          </p>
        </div>
        <Link
          href={`/novel/${novel.slug}`}
          target="_blank"
          className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all self-start sm:self-auto"
        >
          <ExternalLink className="w-4 h-4 text-slate-500" />
          Lihat di Web Publik
        </Link>
      </div>

      {/* Part 1: Edit Metadata */}
      <form onSubmit={handleUpdateMetadata} className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="font-bold text-sm text-slate-900 uppercase tracking-wider">
            Metadata & Pengaturan Novel
          </h2>
          {metadataFeedback && (
            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
              <CheckCircle className="w-4 h-4" />
              {metadataFeedback}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Judul Novel</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Status Karya</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="ongoing">Ongoing (Sedang Berjalan)</option>
              <option value="tamat">Tamat (Selesai)</option>
            </select>
          </div>

          <div className="md:col-span-2 space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Sinopsis</label>
            <textarea
              required
              rows={3}
              value={synopsis}
              onChange={(e) => setSynopsis(e.target.value)}
              className="w-full p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:ring-2 focus:ring-primary leading-relaxed"
            />
          </div>

          <div className="md:col-span-2 space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Tags (Pisahkan koma)</label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={updatingMetadata}
            className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-md shadow-primary/20 transition-all disabled:opacity-50"
          >
            {updatingMetadata ? "Menyimpan..." : "Simpan Perubahan Metadata"}
          </button>
        </div>
      </form>

      {/* Part 2: Chapters Management & Editor */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="font-bold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <List className="w-5 h-5 text-primary" />
              Kelola Bab ({chapters.length})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Tulis bab baru secara manual atau konversi naskah dari dokumen PDF
            </p>
          </div>
          <button
            onClick={handleStartNewChapter}
            className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-sm flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Tulis Bab Baru
          </button>
        </div>

        {/* Chapter Editor Drawer / Inline Workspace */}
        {showChapterEditor && (
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900">
                {editingChapterId ? "Edit Bab" : "Tulis Bab Baru"}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setChapterMode("manual")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 ${
                    chapterMode === "manual" ? "bg-primary text-white" : "bg-white text-slate-700"
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  Ketik Manual
                </button>
                <button
                  type="button"
                  onClick={() => setChapterMode("pdf")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 ${
                    chapterMode === "pdf" ? "bg-primary text-white" : "bg-white text-slate-700"
                  }`}
                >
                  <FileUp className="w-3.5 h-3.5" />
                  Upload PDF
                </button>
                <button
                  onClick={() => setShowChapterEditor(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-slate-500 hover:text-slate-800"
                >
                  Tutup
                </button>
              </div>
            </div>

            {chapterMode === "pdf" && (
              <PdfUploadPanel
                onLoadChapter={(pdfTitle, pdfHtml) => {
                  setEditorTitle(pdfTitle);
                  setEditorHtml(pdfHtml);
                  setChapterMode("manual");
                }}
              />
            )}

            <TipTapEditor
              initialTitle={editorTitle}
              initialChapterNumber={editorChapterNumber}
              initialContentHtml={editorHtml}
              isSaving={savingChapter}
              onSaveChapter={handleSaveChapter}
            />
          </div>
        )}

        {/* Existing Chapters List */}
        <div className="divide-y divide-slate-100">
          {chapters.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">
              Belum ada chapter pada novel ini. Klik &quot;Tulis Bab Baru&quot; di atas untuk menambahkan.
            </p>
          ) : (
            chapters.map((ch) => (
              <div
                key={ch.id}
                className="py-3.5 flex items-center justify-between gap-4 hover:bg-slate-50/70 px-2 rounded-xl transition-colors"
              >
                <div className="min-w-0">
                  <span className="font-bold text-xs text-slate-900 block truncate">
                    Bab {ch.chapter_number}: {ch.title}
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        ch.is_published && !ch.is_draft
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {ch.is_published && !ch.is_draft ? "Published" : "Draft"}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(ch.created_at).toLocaleDateString("id-ID")}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleEditChapter(ch)}
                    className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-primary text-xs font-bold transition-colors"
                  >
                    Edit Bab
                  </button>
                  <button
                    onClick={() => handleDeleteChapter(ch.id, ch.title)}
                    className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                    title="Hapus Bab"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
