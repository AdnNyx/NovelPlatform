"use client";

import Image from "next/image";
import { useState, useEffect, FormEvent } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

export default function CreateChapterPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  // State Data Novel
  const [novelId, setNovelId] = useState<string | null>(null);
  const [novelTitle, setNovelTitle] = useState<string>("Loading...");

  // State Form
  const [title, setTitle] = useState("");
  const [chapterNumber, setChapterNumber] = useState<number | "">("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  // State Cover Volume (Opsional sesuai API)
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  // State UI
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Ambil ID Novel berdasarkan Slug
  useEffect(() => {
    const fetchNovel = async () => {
      try {
        const res = await fetch(`http://127.0.0.1:8000/api/v1/novels/${slug}`);
        if (!res.ok) throw new Error("Novel tidak ditemukan");
        const data = await res.json();
        setNovelId(data.id);
        setNovelTitle(data.title);

        // Auto-increment nomor chapter
        setChapterNumber(data.chapters ? data.chapters.length + 1 : 1);
      } catch {
        setError("Gagal memuat data novel. Pastikan URL benar.");
      }
    };
    if (slug) fetchNovel();
  }, [slug]);

  // 2. Handle File PDF
  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        setError("Format dokumen wajib PDF!");
        setPdfFile(null);
        return;
      }
      if (file.size > 20 * 1024 * 1024) {
        setError("Ukuran PDF maksimal 20MB!");
        setPdfFile(null);
        return;
      }
      setError(null);
      setPdfFile(file);
    }
  };

  // 3. Handle File Cover Volume (Opsional)
  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setError("Cover volume harus berupa gambar (JPG/PNG)");
        return;
      }
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  // 4. Submit Data via Multipart/Form-Data (Sesuai API Backend)
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!novelId) return setError("ID Novel belum dimuat.");
    if (!pdfFile) return setError("File PDF wajib diunggah.");
    if (chapterNumber === "") return setError("Nomor chapter wajib diisi.");

    setIsSubmitting(true);
    setError(null);

    try {
      // Menggunakan FormData karena kita mengirim file (Multipart)
      const formData = new FormData();
      formData.append("novel_id", novelId);
      formData.append("chapter_number", String(chapterNumber));
      formData.append("file", pdfFile); // File PDF wajib

      // Field opsional
      if (title.trim()) {
        formData.append("title", title.trim());
      }
      if (coverFile) {
        formData.append("cover_file", coverFile);
      }

      // Hit endpoint yang benar sesuai spesifikasi
      const res = await fetch("http://127.0.0.1:8000/api/v1/chapters/upload", {
        method: "POST",
        // PENTING: Jangan set header "Content-Type" secara manual jika menggunakan FormData.
        // Browser akan otomatis menyetelnya ke "multipart/form-data" beserta kode boundary-nya.
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Gagal mengunggah chapter");
      }

      // Berhasil!
      router.push(`/admin/novels/${slug}`);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat mengunggah file.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="mb-6">
        <Link
          href={`/admin/novels/${slug}`}
          className="text-sm font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-2"
        >
          &larr; Kembali ke Detail Novel
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          Upload Volume Baru
        </h1>
        <p className="text-slate-500 mt-1">
          Menambahkan chapter untuk:{" "}
          <span className="font-bold text-slate-700">{novelTitle}</span>
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-3 gap-8"
      >
        {/* KOLOM KIRI (Lebar 2/3) - Data Utama & Upload PDF */}
        <div className="md:col-span-2 space-y-6">
          {/* Metadata Chapter */}
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
              <div className="sm:col-span-1">
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  No. Volume *
                </label>
                <input
                  type="number"
                  min="0.1"
                  step="0.1" // Mendukung input desimal seperti 1.5 sesuai deskripsi API
                  required
                  value={chapterNumber}
                  onChange={(e) =>
                    setChapterNumber(
                      e.target.value ? Number(e.target.value) : "",
                    )
                  }
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-black text-slate-700"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Judul Spesifik (Opsional)
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Cth: Arc Pemberontakan..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* Upload PDF */}
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm">
            <label className="flex text-sm font-bold text-slate-700 mb-4 items-center gap-2">
              <svg
                className="w-5 h-5 text-red-500"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
              </svg>
              File Dokumen (PDF) *
            </label>

            <div
              className={`relative w-full rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-10 transition-all ${
                pdfFile
                  ? "border-emerald-500 bg-emerald-50/50"
                  : "border-slate-300 hover:border-indigo-400 hover:bg-slate-50"
              }`}
            >
              <input
                type="file"
                accept=".pdf,application/pdf"
                onChange={handlePdfChange}
                required
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />

              {pdfFile ? (
                <div className="text-center">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                    <svg
                      className="w-8 h-8"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <p className="text-emerald-700 font-bold">{pdfFile.name}</p>
                  <p className="text-xs text-emerald-600/70 mt-1 font-medium">
                    {(pdfFile.size / (1024 * 1024)).toFixed(2)} MB siap diunggah
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg
                      className="w-8 h-8"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                      />
                    </svg>
                  </div>
                  <p className="text-slate-600 font-bold">Pilih file PDF</p>
                  <p className="text-sm text-slate-400 mt-1">Maksimal 20 MB</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* KOLOM KANAN (Lebar 1/3) - Cover Volume & Submit */}
        <div className="space-y-6">
          {/* Upload Cover Volume (Opsional) */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <label className="block text-sm font-bold text-slate-700 mb-4 text-center">
              Cover Volume (Opsional)
            </label>

            <div
              className={`relative aspect-2/3 w-full max-w-50 mx-auto rounded-xl border-2 border-dashed flex flex-col items-center justify-center overflow-hidden transition-all ${
                coverPreview
                  ? "border-indigo-500"
                  : "border-slate-200 hover:border-indigo-300 hover:bg-slate-50"
              }`}
            >
              <input
                type="file"
                accept="image/*"
                onChange={handleCoverChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              {coverPreview ? (
                <Image
                  src={coverPreview}
                  alt="Cover Preview"
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="text-center p-4">
                  <svg
                    className="w-10 h-10 text-slate-300 mx-auto mb-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="text-[10px] text-slate-400 font-medium">
                    Klik untuk upload (JPG/PNG)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !pdfFile}
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-3"
          >
            {isSubmitting ? (
              <>
                <span className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></span>
                Mengunggah...
              </>
            ) : (
              "Terbitkan Volume"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
