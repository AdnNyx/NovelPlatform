import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

// Interfaces
interface Genre {
  id: string;
  name: string;
}

interface ChapterList {
  id: string;
  chapter_number: number;
  title: string | null;
  cover_image_url: string | null;
  published_at: string;
}

interface NovelDetail {
  id: string;
  title: string;
  slug: string;
  synopsis: string | null;
  cover_image_url: string | null;
  author: string | null;
  genres: Genre[];
  chapters: ChapterList[];
}

async function getNovelDetail(slug: string): Promise<NovelDetail | null> {
  try {
    const res = await fetch(`http://127.0.0.1:8000/api/v1/novels/${slug}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    console.error(`Gagal mengambil detail novel ${slug}:`, error);
    return null;
  }
}

export default async function NovelDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await params;
  const novel = await getNovelDetail(resolvedParams.slug);

  if (!novel) notFound();

  return (
    <div className="animate-fade-in min-h-screen bg-slate-50 pb-20">
      {/* ========================================================
        POIN 1 & 2: COVER DI KIRI, INFORMASI DI KANAN
        ========================================================
      */}
      <div className="bg-slate-900 pt-12 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-center md:items-start">
            {/* 1. Cover Kiri */}
            <div className="shrink-0 w-56 sm:w-64 aspect-2/3 relative rounded-lg overflow-hidden shadow-2xl border border-slate-700">
              {novel.cover_image_url ? (
                <Image
                  src={novel.cover_image_url}
                  alt={`Cover ${novel.title}`}
                  fill
                  className="object-cover"
                  priority
                  unoptimized
                />
              ) : (
                <div className="flex items-center justify-center h-full bg-slate-800 text-slate-500">
                  No Cover
                </div>
              )}
            </div>

            {/* 2. Informasi Kanan */}
            <div className="flex flex-col text-center md:text-left text-white mt-4 md:mt-0 w-full">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
                {novel.title}
              </h1>

              <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-6">
                {novel.genres.map((g) => (
                  <span
                    key={g.id}
                    className="px-3 py-1 bg-slate-800 border border-slate-700 rounded-full text-xs font-semibold text-slate-300"
                  >
                    {g.name}
                  </span>
                ))}
              </div>

              <div className="space-y-2 text-slate-300">
                <p>
                  <span className="text-slate-500 mr-2">Penulis:</span>
                  <span className="font-medium text-slate-200">
                    {novel.author || "Anonim"}
                  </span>
                </p>
                <p>
                  <span className="text-slate-500 mr-2">Total Volume:</span>
                  <span className="font-medium text-slate-200">
                    {novel.chapters?.length || 0}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
        POIN 3: SINOPSIS DI BAGIAN BAWAH FULL
        ========================================================
      */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-10">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:p-8">
          <h2 className="text-xl font-bold text-slate-900 mb-4 border-b border-slate-100 pb-2">
            Sinopsis
          </h2>
          <div className="text-slate-700 leading-relaxed text-justify whitespace-pre-line">
            {novel.synopsis ||
              "Belum ada sinopsis yang ditambahkan untuk novel ini."}
          </div>
        </div>
      </div>

      {/* ========================================================
        POIN 4: DAFTAR CHAPTER / VOLUME DENGAN TATA LETAK POTRET (PORTRAIT)
        ========================================================
      */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <h2 className="text-xl font-bold text-slate-900 mb-6">
          Daftar Volume Terbit
        </h2>

        {novel.chapters && novel.chapters.length > 0 ? (
          /* Grid diubah untuk menampung kartu vertikal: 2 kolom (HP), 3 (Tablet), 4-5 (Desktop) */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
            {novel.chapters.map((ch) => (
              <Link
                key={ch.id}
                href={`/novel/${novel.slug}/${ch.chapter_number}`}
                /* Diubah menjadi flex-col agar gambar di atas, teks di bawah */
                className="flex flex-col bg-white rounded-xl border border-slate-200 overflow-hidden hover:border-indigo-500 hover:shadow-xl transition-all group"
              >
                {/* Thumbnail Cover Volume - Dikunci dengan aspect-[2/3] */}
                <div className="relative w-full aspect-2/3 bg-slate-100 border-b border-slate-100 overflow-hidden">
                  {ch.cover_image_url ? (
                    <Image
                      src={ch.cover_image_url}
                      alt={`Volume ${ch.chapter_number}`}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      unoptimized
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 p-2 text-center bg-slate-50">
                      <svg
                        className="w-8 h-8 text-slate-300 mb-2"
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
                      <span className="text-[10px] font-bold uppercase tracking-wider">
                        Tanpa Cover
                      </span>
                    </div>
                  )}
                </div>

                {/* Detail Volume di bawah gambar */}
                <div className="p-4 flex flex-col grow">
                  <span className="text-xs font-bold text-indigo-600 mb-1 tracking-wider">
                    VOLUME {ch.chapter_number}
                  </span>
                  <h3 className="font-bold text-slate-900 text-sm line-clamp-2 group-hover:text-indigo-600 transition-colors">
                    {ch.title || `Chapter ${ch.chapter_number}`}
                  </h3>
                  <div className="mt-auto pt-3">
                    <p className="text-xs text-slate-500 font-medium">
                      {new Date(ch.published_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl p-12 border-2 border-dashed border-slate-200 text-center">
            <p className="text-slate-500 font-medium">
              Novel ini belum memiliki volume yang diunggah.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
