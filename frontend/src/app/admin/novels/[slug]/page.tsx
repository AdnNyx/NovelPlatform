import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  DeleteNovelButton,
  DeleteChapterButton,
} from "../../components/DeleteButtons";

// Interface
interface Genre {
  id: number;
  name: string;
}

interface Chapter {
  id: string;
  title: string;
  chapter_number: number;
  created_at: string;
}

interface NovelDetail {
  id: string;
  title: string;
  slug: string;
  author: string;
  synopsis: string;
  status: string;
  cover_image_url: string | null;
  genres: Genre[];
  chapters: Chapter[];
}

// -Fetching function
async function getNovelDetail(slug: string): Promise<NovelDetail | null> {
  try {
    const res = await fetch(`http://127.0.0.1:8000/api/v1/novels/${slug}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

// Main Component
export default async function AdminNovelDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await params;
  const novel = await getNovelDetail(resolvedParams.slug);

  if (!novel) {
    notFound();
  }

  // Mengurutkan chapter dari yang terbaru ke terlama (berdasarkan nomor)
  const sortedChapters = [...novel.chapters].sort(
    (a, b) => b.chapter_number - a.chapter_number,
  );

  return (
    <div className="max-w-6xl mx-auto pb-20 space-y-8">
      {/* Breadcrumbs */}
      <div>
        <Link
          href="/admin/novels"
          className="text-sm font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-2"
        >
          &larr; Kembali ke Daftar Novel
        </Link>
      </div>

      {/* Header */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-8 items-start">
        {/* Cover */}
        <div className="w-40 md:w-56 shrink-0 aspect-2/3 relative rounded-2xl overflow-hidden shadow-md border border-slate-100">
          {novel.cover_image_url ? (
            <Image
              src={novel.cover_image_url}
              alt={novel.title}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400 font-medium text-sm">
              No Cover
            </div>
          )}
        </div>

        {/* Detail Info */}
        <div className="flex-1 space-y-4 w-full">
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-2">
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
              <div className="flex gap-1">
                {novel.genres.map((g) => (
                  <span
                    key={g.id}
                    className="text-[10px] px-2 py-1 bg-slate-100 text-slate-600 rounded-md font-bold"
                  >
                    {g.name}
                  </span>
                ))}
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight">
              {novel.title}
            </h1>
            <p className="text-slate-500 font-medium mt-1">
              Oleh{" "}
              <span className="text-slate-700 font-bold">{novel.author}</span>
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
              Sinopsis Singkat
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">
              {novel.synopsis}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Link
              href={`/admin/novels/${novel.slug}/edit`}
              className="px-5 py-2 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors"
            >
              Edit Info Novel
            </Link>

            <DeleteNovelButton novelId={novel.id} novelTitle={novel.title} />
          </div>
        </div>
      </div>

      {/* SECTION: Chapter Management */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Header Chapter */}
        <div className="p-6 md:p-8 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
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
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
              Daftar Volume
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Total {novel.chapters.length} volume telah diterbitkan.
            </p>
          </div>

          <Link
            href={`/admin/novels/${novel.slug}/chapters/create`}
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            Tambah Volume
          </Link>
        </div>

        {/* Tabel List Chapter/Volume */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-widest">
                <th className="p-4 pl-8 w-24">No.</th>
                <th className="p-4">Judul Volume</th>
                <th className="p-4">Tanggal Rilis</th>
                <th className="p-4 text-right pr-8">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedChapters.length > 0 ? (
                sortedChapters.map((chapter) => {
                  const date = new Date(chapter.created_at).toLocaleDateString(
                    "id-ID",
                    {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    },
                  );

                  return (
                    <tr
                      key={chapter.id}
                      className="hover:bg-slate-50/50 transition-colors group"
                    >
                      <td className="p-4 pl-8">
                        <span className="font-black text-slate-400 group-hover:text-indigo-500 transition-colors">
                          CH {chapter.chapter_number}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">
                          {chapter.title}
                        </span>
                      </td>
                      <td className="p-4 text-sm font-medium text-slate-500">
                        {date}
                      </td>
                      <td className="p-4 text-right pr-8">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/novels/${novel.slug}/chapters/${chapter.chapter_number}/edit`}
                            className="inline-block px-3 py-1.5 text-xs font-bold text-slate-500 bg-white border border-slate-200 rounded-lg hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 transition-all shadow-sm"
                          >
                            Edit
                          </Link>

                          <DeleteChapterButton
                            chapterId={chapter.id}
                            chapterTitle={chapter.title}
                            chapterNumber={chapter.chapter_number}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="p-12 text-center bg-slate-50/30">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 border border-slate-200 shadow-sm">
                      <svg
                        className="w-6 h-6 text-slate-300"
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
                    </div>
                    <p className="text-slate-500 font-medium">
                      Belum ada chapter untuk novel ini.
                    </p>
                    <p className="text-sm text-slate-400 mt-1">
                      Klik tombol &quot;Tambah Chapter&quot; untuk mengunggah
                      volume pertama.
                    </p>
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
