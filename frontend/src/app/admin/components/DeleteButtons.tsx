"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Delete Novel
export function DeleteNovelButton({
  novelId,
  novelTitle,
}: {
  novelId: string;
  novelTitle: string;
}) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showModal, setShowModal] = useState(false); // State untuk mengontrol Modal

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(
        `http://127.0.0.1:8000/api/v1/novels/${novelId}`,
        {
          method: "DELETE",
        },
      );

      if (!res.ok) throw new Error("Gagal menghapus novel.");

      router.push("/admin/novels");
      router.refresh();
    } catch (error) {
      alert(
        error instanceof Error ? error.message : "Terjadi kesalahan server",
      );
      setIsDeleting(false);
      setShowModal(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="px-5 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-bold hover:bg-red-100 hover:text-red-700 transition-colors flex items-center gap-2"
      >
        Hapus Novel
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={() => !isDeleting && setShowModal(false)}
          ></div>
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 md:p-8 animate-fade-in border border-slate-100">
            <div className="flex items-start gap-5 mb-6">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <svg
                  className="w-6 h-6 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900">
                  Hapus Novel Ini?
                </h3>
                <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                  Tindakan ini bersifat permanen dan{" "}
                  <span className="font-bold text-red-500">TIDAK BISA</span>{" "}
                  dibatalkan.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-8">
              <p className="text-sm text-slate-600">
                Seluruh data untuk novel{" "}
                <span className="font-bold text-slate-800">
                  &quot;{novelTitle}&quot;
                </span>{" "}
                beserta seluruh volume/chapter di dalamnya akan dimusnahkan.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                disabled={isDeleting}
                className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-5 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 hover:shadow-lg hover:shadow-red-200 rounded-xl transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {isDeleting ? "Menghapus..." : "Ya, Musnahkan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Delete Chapter
export function DeleteChapterButton({
  chapterId,
  chapterTitle,
  chapterNumber,
}: {
  chapterId: string;
  chapterTitle: string;
  chapterNumber: number;
}) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showModal, setShowModal] = useState(false); // State untuk mengontrol Modal

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(
        `http://127.0.0.1:8000/api/v1/chapters/${chapterId}`,
        {
          method: "DELETE",
        },
      );

      if (!res.ok) throw new Error("Gagal menghapus chapter.");

      setShowModal(false);
      router.refresh();
    } catch (error) {
      alert(
        error instanceof Error ? error.message : "Terjadi kesalahan server",
      );
      setIsDeleting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="px-3 py-1.5 text-xs font-bold text-red-500 bg-white border border-red-200 rounded-lg hover:text-red-700 hover:border-red-300 hover:bg-red-50 transition-all shadow-sm"
      >
        Hapus
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={() => !isDeleting && setShowModal(false)}
          ></div>
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 animate-fade-in border border-slate-100">
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4 border border-red-100">
                <svg
                  className="w-6 h-6 text-red-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-black text-slate-900">
                Hapus Volume {chapterNumber}?
              </h3>
              <p className="text-sm text-slate-500 mt-2">
                Anda akan menghapus{" "}
                <span className="font-bold text-slate-700">
                  &quot;{chapterTitle}&quot;
                </span>
                . File PDF yang tertaut mungkin juga akan dihapus dari server.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="w-full py-3 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all disabled:opacity-50"
              >
                {isDeleting ? "Menghapus..." : "Ya, Hapus Volume"}
              </button>
              <button
                onClick={() => setShowModal(false)}
                disabled={isDeleting}
                className="w-full py-3 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
