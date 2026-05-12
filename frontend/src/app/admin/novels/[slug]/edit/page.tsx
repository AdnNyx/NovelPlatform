"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

interface Genre {
  id: number;
  name: string;
}

export default function EditNovelPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  // Original Data State
  const [novelId, setNovelId] = useState<string | null>(null);
  const [existingCoverUrl, setExistingCoverUrl] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [synopsis, setSynopsis] = useState("");
  const [status, setStatus] = useState("ongoing");
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);

  // Upload State
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Support State
  const [genres, setGenres] = useState<Genre[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const resGenres = await fetch("http://127.0.0.1:8000/api/v1/genres/");
        if (resGenres.ok) {
          setGenres(await resGenres.json());
        }

        const resNovel = await fetch(
          `http://127.0.0.1:8000/api/v1/novels/${slug}`,
        );
        if (!resNovel.ok) throw new Error("Data novel tidak ditemukan");

        const novelData = await resNovel.json();

        setNovelId(novelData.id);
        setTitle(novelData.title);
        setAuthor(novelData.author || "");
        setSynopsis(novelData.synopsis || "");
        setStatus(novelData.status || "ongoing");
        setExistingCoverUrl(novelData.cover_image_url || null);
        if (novelData.genres) {
          setSelectedGenres(novelData.genres.map((g: Genre) => g.id));
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Terjadi kesalahan memuat data",
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (slug) fetchData();
  }, [slug]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const toggleGenre = (genreId: number) => {
    setSelectedGenres((prev) =>
      prev.includes(genreId)
        ? prev.filter((id) => id !== genreId)
        : [...prev, genreId],
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!novelId) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const novelData = {
        title,
        author,
        synopsis,
        status,
        genre_ids: selectedGenres,
      };

      const res = await fetch(
        `http://127.0.0.1:8000/api/v1/novels/${novelId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(novelData),
        },
      );

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Gagal memperbarui info novel");
      }

      const updatedNovel = await res.json();
      const newSlug = updatedNovel.slug || slug;

      if (coverFile) {
        const formData = new FormData();
        formData.append("file", coverFile);

        const uploadRes = await fetch(
          `http://127.0.0.1:8000/api/v1/novels/${novelId}/cover`,
          {
            method: "PATCH",
            body: formData,
          },
        );

        if (!uploadRes.ok) {
          console.error("Info terupdate, tapi gagal mengubah sampul.");
        }
      }

      router.push(`/admin/novels/${newSlug}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
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

  const displayCover = previewUrl || existingCoverUrl;

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
          Edit Info Novel
        </h1>
        <p className="text-slate-500 mt-1">Perbarui detail untuk novel ini.</p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-3 gap-8"
      >
        {/* Left */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Judul Novel
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Penulis
                </label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                  <option value="hiatus">Hiatus</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Sinopsis
              </label>
              <textarea
                rows={6}
                value={synopsis}
                onChange={(e) => setSynopsis(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all resize-none"
              />
            </div>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
            <label className="block text-sm font-bold text-slate-700 mb-4">
              Genre Terpilih
            </label>
            <div className="flex flex-wrap gap-2">
              {genres.map((genre) => (
                <button
                  key={genre.id}
                  type="button"
                  onClick={() => toggleGenre(genre.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                    selectedGenres.includes(genre.id)
                      ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100"
                      : "bg-white border-slate-200 text-slate-500 hover:border-indigo-300"
                  }`}
                >
                  {genre.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="space-y-6">
          {/* Upload Cover */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <label className="block text-sm font-bold text-slate-700 mb-4">
              Ganti Sampul (Opsional)
            </label>

            <div
              className={`relative aspect-2/3 w-full rounded-xl border-2 border-dashed flex flex-col items-center justify-center overflow-hidden transition-all ${
                coverFile
                  ? "border-indigo-500"
                  : "border-slate-200 hover:border-indigo-300"
              }`}
            >
              {displayCover ? (
                <>
                  <Image
                    src={displayCover}
                    alt="Cover Preview"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex flex-col items-center justify-center">
                    <p className="text-white text-xs font-bold mb-1">
                      Ganti Gambar
                    </p>
                    {coverFile && (
                      <p className="text-emerald-300 text-[10px]">
                        Siap diunggah
                      </p>
                    )}
                  </div>
                </>
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
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium">
              Error: {error}
            </div>
          )}

          {/* Submit Action */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        </div>
      </form>
    </div>
  );
}
