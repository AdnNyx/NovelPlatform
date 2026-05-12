"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function EditChapterPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const currentChapterNumber = params.chapter_number as string;

  // State Chapter Data
  const [chapterId, setChapterId] = useState<string | null>(null);
  const [novelTitle, setNovelTitle] = useState<string>("Loading...");
  const [existingPdfUrl, setExistingPdfUrl] = useState<string | null>(null);

  // State Form
  const [title, setTitle] = useState("");
  const [chapterNumber, setChapterNumber] = useState<number | "">("");

  // State New File
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  // State UI
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // GET Data
  useEffect(() => {
    const fetchChapterData = async () => {
      try {
        const res = await fetch(
          `http://127.0.0.1:8000/api/v1/chapters/${slug}/${currentChapterNumber}`,
        );
        if (!res.ok) throw new Error("Data chapter tidak ditemukan");

        const data = await res.json();

        // Populasi state dengan data dari backend
        setChapterId(data.id);
        setTitle(data.title || "");
        setChapterNumber(data.chapter_number);
        setExistingPdfUrl(data.pdf_url || null);

        if (data.cover_image_url) {
          setCoverPreview(data.cover_image_url);
        }

        if (data.novel && data.novel.title) {
          setNovelTitle(data.novel.title);
        } else {
          setNovelTitle(`Novel: ${slug}`);
        }
      } catch (error) {
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError("Terjadi kesalahan saat memuat data.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (slug && currentChapterNumber) {
      fetchChapterData();
    }
  }, [slug, currentChapterNumber]);

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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!chapterId) return setError("ID Chapter tidak valid.");
    if (chapterNumber === "") return setError("Nomor chapter wajib diisi.");

    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("chapter_number", String(chapterNumber));

      if (title.trim()) {
        formData.append("title", title.trim());
      }

      if (pdfFile) {
        formData.append("file", pdfFile);
      }
      if (coverFile) {
        formData.append("cover_file", coverFile);
      }

      const res = await fetch(
        `http://127.0.0.1:8000/api/v1/chapters/${chapterId}`,
        {
          method: "PATCH",
          body: formData,
        },
      );

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Gagal menyimpan perubahan");
      }

      router.push(`/admin/novels/${slug}`);
      router.refresh();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Terjadi kesalahan sistem saat menyimpan.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></span>
      </div>
    );
  }

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
          Edit Volume {currentChapterNumber}
        </h1>
        <p className="text-slate-500 mt-1">
          Memperbarui chapter untuk:{" "}
          <span className="font-bold text-slate-700">{novelTitle}</span>
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-3 gap-8"
      >
        {/* KOLOM KIRI (Lebar 2/3) */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
              <div className="sm:col-span-1">
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  No. Volume *
                </label>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
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

          <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm">
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-4">
              <svg
                className="w-5 h-5 text-red-500"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
              </svg>
              Ganti File PDF (Opsional)
            </label>

            {existingPdfUrl && !pdfFile && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <svg
                    className="w-6 h-6 text-blue-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <div>
                    <p className="text-sm font-bold text-blue-800">
                      File PDF saat ini tersedia
                    </p>
                    <p className="text-xs text-blue-600">
                      Abaikan bagian ini jika tidak ingin mengganti file.
                    </p>
                  </div>
                </div>
              </div>
            )}

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
                    Akan menimpa file PDF lama
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
                  <p className="text-slate-600 font-bold">
                    Pilih file PDF baru
                  </p>
                  <p className="text-sm text-slate-400 mt-1">Maksimal 20 MB</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <label className="block text-sm font-bold text-slate-700 mb-4 text-center">
              Ganti Cover (Opsional)
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

          {error && (
            <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-3"
          >
            {isSubmitting ? (
              <>
                <span className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></span>
                Menyimpan...
              </>
            ) : (
              "Simpan Perubahan"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
