"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  BookPlus,
  Image as ImageIcon,
  CheckCircle,
  AlertCircle,
  FileText,
  FileUp,
} from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { GenreItem, Novel } from "@/types";
import { TipTapEditor } from "@/components/editor/TipTapEditor";
import { PdfUploadPanel } from "@/components/editor/PdfUploadPanel";

export default function CreateNovelPage() {
  const router = useRouter();

  // Novel Metadata State
  const [title, setTitle] = useState<string>("");
  const [synopsis, setSynopsis] = useState<string>("");
  const [status, setStatus] = useState<"ongoing" | "tamat">("ongoing");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [tagsInput, setTagsInput] = useState<string>("");

  const [availableGenres, setAvailableGenres] = useState<GenreItem[]>([]);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  // Dual Chapter Input Mode State
  const [inputMode, setInputMode] = useState<"manual" | "pdf">("manual");
  const [initialChapterTitle, setInitialChapterTitle] = useState<string>("Bab 1: Permulaan");
  const [initialChapterNumber, setInitialChapterNumber] = useState<number>(1);
  const [initialContentHtml, setInitialContentHtml] = useState<string>(
    "<p>Tuliskan naskah bab pertama novel Anda di sini...</p>"
  );

  const [saving, setSaving] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadGenres() {
      try {
        const res = await apiClient<{ status: string; data: GenreItem[] }>("/api/genres");
        setAvailableGenres(res.data || []);
      } catch (err) {
        console.error(err);
      }
    }
    loadGenres();
  }, []);

  function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage("Ukuran cover maksimal 5 MB.");
      return;
    }

    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  }

  function toggleGenre(genreName: string) {
    setSelectedGenres((prev) =>
      prev.includes(genreName)
        ? prev.filter((g) => g !== genreName)
        : [...prev, genreName]
    );
  }

  async function handleCreateNovelAndChapter(chapterData: {
    title: string;
    chapter_number: number;
    content_html: string;
    is_draft: boolean;
    is_published: boolean;
    published_at: string | null;
  }) {
    if (!title.trim() || !synopsis.trim()) {
      setErrorMessage("Judul novel dan sinopsis wajib diisi.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setSaving(true);
    setErrorMessage("");

    try {
      // 1. Create Novel via multipart/form-data
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("synopsis", synopsis.trim());
      formData.append("status_novel", status);
      formData.append("genres", JSON.stringify(selectedGenres));

      const tagsArray = tagsInput
        .split(",")
        .map((t) => t.trim().replace(/^#/, ""))
        .filter(Boolean);
      formData.append("tags", JSON.stringify(tagsArray));

      if (coverFile) {
        formData.append("cover", coverFile);
      }

      const novelRes = await apiClient<{ status: string; data: Novel }>("/api/novels", {
        method: "POST",
        body: formData,
      });

      const newNovel = novelRes.data;

      // 2. Create Initial Chapter
      await apiClient("/api/chapters", {
        method: "POST",
        body: JSON.stringify({
          novel_id: newNovel.id,
          chapter_number: chapterData.chapter_number,
          title: chapterData.title,
          content_html: chapterData.content_html,
          is_draft: chapterData.is_draft,
          is_published: chapterData.is_published,
          published_at: chapterData.published_at,
        }),
      });

      router.push(`/staff/novelis/novel/${newNovel.id}/edit`);
    } catch (err: any) {
      setErrorMessage(err.detail || "Gagal membuat novel baru.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="font-sans font-extrabold text-2xl text-slate-900 tracking-tight flex items-center gap-2">
          <BookPlus className="w-6 h-6 text-primary" />
          Tulis Karya Novel Baru
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Isi metadata novel dan tulis bab pertama menggunakan editor manual atau unggah PDF
        </p>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Part 1: Novel Metadata Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 space-y-6 shadow-sm">
        <h2 className="font-bold text-sm text-slate-900 uppercase tracking-wider">
          1. Informasi & Metadata Novel
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Cover Upload (2:3 Aspect Ratio) */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700">Cover Novel (2:3)</label>
            <div
              onClick={() => coverInputRef.current?.click()}
              className="w-full aspect-[2/3] rounded-2xl border-2 border-dashed border-slate-300 hover:border-primary overflow-hidden flex flex-col items-center justify-center p-3 cursor-pointer bg-slate-50 group transition-colors"
            >
              <input
                ref={coverInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleCoverChange}
                className="hidden"
              />
              {coverPreview ? (
                <img
                  src={coverPreview}
                  alt="Cover Preview"
                  className="w-full h-full object-cover rounded-xl"
                />
              ) : (
                <div className="text-center space-y-2">
                  <ImageIcon className="w-8 h-8 text-slate-400 group-hover:text-primary mx-auto transition-colors" />
                  <span className="text-[11px] font-semibold text-slate-500 block">
                    Pilih Sampul (Maks 5MB)
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Title, Synopsis & Status */}
          <div className="md:col-span-2 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Judul Novel</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Pendekar Pedang Langit"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Sinopsis Lengkap</label>
              <textarea
                required
                rows={4}
                value={synopsis}
                onChange={(e) => setSynopsis(e.target.value)}
                placeholder="Tuliskan gambaran ringkas alur cerita dan latar belakang novel..."
                className="w-full p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:ring-2 focus:ring-primary leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
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

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Tags (Pisahkan koma)</label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="fantasi, sihir, petualangan"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Genres Selection */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <label className="text-xs font-bold text-slate-700">Pilih Genre Novel (Multi-select)</label>
          <div className="flex flex-wrap items-center gap-2">
            {availableGenres.map((g) => {
              const isSelected = selectedGenres.includes(g.name);
              return (
                <button
                  type="button"
                  key={g.id}
                  onClick={() => toggleGenre(g.name)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    isSelected
                      ? "bg-primary text-white border-primary shadow-sm"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {g.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Part 2: Dual Chapter Input Mode Selector */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-sm text-slate-900 uppercase tracking-wider">
            2. Bab Pertama Novel
          </h2>
          {/* Mode Switcher */}
          <div className="flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-xl shadow-sm">
            <button
              type="button"
              onClick={() => setInputMode("manual")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                inputMode === "manual"
                  ? "bg-primary text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Ketik Manual
            </button>
            <button
              type="button"
              onClick={() => setInputMode("pdf")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                inputMode === "pdf"
                  ? "bg-primary text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <FileUp className="w-3.5 h-3.5" />
              Upload PDF
            </button>
          </div>
        </div>

        {/* PDF Upload Workflow Panel */}
        {inputMode === "pdf" && (
          <PdfUploadPanel
            onLoadChapter={(titleExtracted, htmlExtracted) => {
              setInitialChapterTitle(titleExtracted);
              setInitialContentHtml(htmlExtracted);
              setInputMode("manual"); // Switch back to editor for review
            }}
          />
        )}

        {/* TipTap Rich Text Editor */}
        <TipTapEditor
          initialTitle={initialChapterTitle}
          initialChapterNumber={initialChapterNumber}
          initialContentHtml={initialContentHtml}
          isSaving={saving}
          onSaveChapter={handleCreateNovelAndChapter}
        />
      </div>
    </div>
  );
}
