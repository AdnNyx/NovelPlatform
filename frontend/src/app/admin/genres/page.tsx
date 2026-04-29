"use client";

import { useState, useEffect, FormEvent } from "react";

interface Genre {
  id: number;
  name: string;
  slug: string;
}

export default function ManageGenresPage() {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [newGenreName, setNewGenreName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/api/v1/genres/");
        if (!res.ok) throw new Error("Gagal mengambil data genre");
        const data = await res.json();
        setGenres(data);
      } catch (error) {
        console.error(error);
        setMessage({
          type: "error",
          text: "Koneksi ke server gagal. Pastikan backend aktif.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchGenres();
  }, []);

  // Send Genre
  const handleAddGenre = async (e: FormEvent) => {
    e.preventDefault();
    if (!newGenreName.trim()) return;

    setIsSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch("http://127.0.0.1:8000/api/v1/genres/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newGenreName.trim() }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Gagal menambahkan genre");
      }

      const newGenre: Genre = await res.json();

      // Tambahkan genre baru ke daftar tanpa perlu refresh halaman
      setGenres((prev) => [...prev, newGenre]);
      setNewGenreName(""); // Kosongkan form input
      setMessage({
        type: "success",
        text: `Genre "${newGenre.name}" berhasil ditambahkan!`,
      });

      // Hilangkan pesan sukses setelah 3 detik
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      // TypeScript Best Practice untuk Catch Error
      if (error instanceof Error) {
        setMessage({ type: "error", text: error.message });
      } else {
        setMessage({
          type: "error",
          text: "Terjadi kesalahan yang tidak diketahui.",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Manajemen Genre
        </h1>
        <p className="text-slate-500 mt-1">
          Tambahkan dan kelola kategori genre untuk light novel Anda.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* KOLOM KIRI: Form Tambah Genre */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm sticky top-8">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <svg
                className="w-5 h-5 text-indigo-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Tambah Baru
            </h2>

            <form onSubmit={handleAddGenre} className="space-y-4">
              <div>
                <label
                  htmlFor="genreName"
                  className="block text-sm font-medium text-slate-700 mb-1"
                >
                  Nama Genre
                </label>
                <input
                  id="genreName"
                  type="text"
                  value={newGenreName}
                  onChange={(e) => setNewGenreName(e.target.value)}
                  placeholder="Cth: Action, Fantasy, Isekai..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm"
                  disabled={isSubmitting}
                  required
                />
              </div>

              {/* Notifikasi Pesan (Sukses/Error) */}
              {message && (
                <div
                  className={`p-3 rounded-lg text-sm font-medium ${message.type === "success" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-red-50 text-red-600 border border-red-100"}`}
                >
                  {message.text}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || !newGenreName.trim()}
                className="w-full py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-indigo-600 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                ) : (
                  "Simpan Genre"
                )}
              </button>
            </form>
          </div>
        </div>

        {/* KOLOM KANAN: Daftar Genre Terdaftar */}
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm min-h-100">
            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <svg
                className="w-5 h-5 text-indigo-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 10h16M4 14h16M4 18h16"
                />
              </svg>
              Daftar Genre Terdaftar
            </h2>

            {isLoading ? (
              // Skeleton Loading State
              <div className="flex flex-wrap gap-3 animate-pulse">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="w-24 h-10 bg-slate-100 rounded-xl"
                  ></div>
                ))}
              </div>
            ) : genres.length > 0 ? (
              // Grid Daftar Genre
              <div className="flex flex-wrap gap-3">
                {genres.map((genre) => (
                  <div
                    key={genre.id}
                    className="group px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3 hover:border-indigo-300 hover:shadow-sm transition-all"
                  >
                    <span className="text-sm font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">
                      {genre.name}
                    </span>
                    <span className="text-[10px] font-medium text-slate-400 bg-white px-2 py-0.5 rounded-full border border-slate-100">
                      /{genre.slug}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              // Empty State
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                  <svg
                    className="w-8 h-8 text-slate-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                    />
                  </svg>
                </div>
                <p className="text-slate-500 font-medium">
                  Belum ada genre yang ditambahkan.
                </p>
                <p className="text-sm text-slate-400 mt-1">
                  Gunakan form di sebelah kiri untuk menambah genre pertama
                  Anda.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
