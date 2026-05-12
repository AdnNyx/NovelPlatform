import Link from "next/link";
import Image from "next/image";

// Interface
interface Genre {
  id: number;
  name: string;
}

interface Novel {
  id: string;
  title: string;
  slug: string;
  author: string;
  status: string;
  cover_image_url: string | null;
  genres: Genre[];
}

// Fetching Server-Side
async function getAdminNovels(): Promise<Novel[]> {
  try {
    const res = await fetch(
      "http://127.0.0.1:8000/api/v1/novels/latest?limit=50",
      {
        cache: "no-store",
      },
    );
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch (error) {
    console.error("Gagal mengambil daftar novel:", error);
    return [];
  }
}

export default async function ManageNovelsPage() {
  const novels = await getAdminNovels();

  return (
    <div className="space-y-6">
      {/* Header & Aksi */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Manajemen Novel
          </h1>
          <p className="text-slate-500 mt-1">
            Kelola data novel, edit informasi, atau tambahkan koleksi baru.
          </p>
        </div>
        <Link
          href="/admin/novels/create"
          className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 hover:shadow-lg transition-all flex items-center gap-2"
        >
          <svg
            className="w-5 h-5"
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
          Tambah Novel
        </Link>
      </div>

      {/* Novel Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-widest">
                <th className="p-4 pl-6">Info Novel</th>
                <th className="p-4">Penulis</th>
                <th className="p-4">Genre</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right pr-6">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {novels.length > 0 ? (
                novels.map((novel) => (
                  <tr
                    key={novel.id}
                    className="hover:bg-slate-50/50 transition-colors group"
                  >
                    <td className="p-4 pl-6 flex items-center gap-4">
                      <div className="relative w-12 h-16 rounded-md overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                        {novel.cover_image_url ? (
                          <Image
                            src={novel.cover_image_url}
                            alt={novel.title}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-[10px] text-slate-400">
                            No Cover
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                          {novel.title}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          /{novel.slug}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm font-medium text-slate-600">
                      {novel.author || "-"}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                        {novel.genres.slice(0, 2).map((g) => (
                          <span
                            key={g.id}
                            className="text-[10px] px-2 py-1 bg-slate-100 text-slate-600 rounded-md font-bold"
                          >
                            {g.name}
                          </span>
                        ))}
                        {novel.genres.length > 2 && (
                          <span className="text-[10px] px-2 py-1 bg-slate-100 text-slate-600 rounded-md font-bold">
                            +{novel.genres.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`text-[10px] px-2.5 py-1 rounded-full font-black uppercase tracking-wider ${
                          novel.status === "ongoing"
                            ? "bg-emerald-50 text-emerald-600"
                            : novel.status === "completed"
                              ? "bg-indigo-50 text-indigo-600"
                              : "bg-orange-50 text-orange-600"
                        }`}
                      >
                        {novel.status}
                      </span>
                    </td>
                    <td className="p-4 text-right pr-6">
                      <Link
                        href={`/admin/novels/${novel.slug}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 transition-all shadow-sm"
                      >
                        Kelola
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <svg
                        className="w-12 h-12 text-slate-300 mb-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                      <p className="text-slate-500 font-medium">
                        Belum ada novel di database.
                      </p>
                      <p className="text-sm text-slate-400">
                        Klik tombol $quot;Tambah Novel$quot; untuk memulai.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
