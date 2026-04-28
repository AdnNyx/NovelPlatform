import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

// Interface
interface Genre {
  id: string;
  name: string;
}

interface ChapterList {
  id: string;
  chapter_number: number;
  title: string | null;
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

// Fetching Function
async function getNovelDetail(slug: string): Promise<NovelDetail | null> {
  try {
    const res = await fetch(`http://127.0.0.1:8000/api/v1/novels/${slug}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    console.error("Error fetching novel detail:", error);
    return null;
  }
}

// Main Components
export default async function NovelDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await params;
  const novel = await getNovelDetail(resolvedParams.slug);

  if (!novel) notFound();

  return (
    <div className="animate-fade-in flex flex-col min-h-screen bg-slate-50">
      <div className="relative w-full bg-slate-900 py-12 md:py-20 overflow-hidden shadow-inner">
        {novel.cover_image_url && (
          <div className="absolute inset-0 opacity-30 blur-3xl scale-110 pointer-events-none">
            <Image
              src={novel.cover_image_url}
              alt="Background"
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        )}

        <div className="absolute inset-0 bg-to-t from-slate-900 via-slate-900/60 to-transparent pointer-events-none"></div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row gap-8 items-center md:items-start z-10">
          {/* Cover */}
          <div className="shrink-0 w-48 sm:w-64 overflow-hidden rounded-xl shadow-2xl border border-white/10 ring-4 ring-black/20">
            <div className="relative aspect-2/3 w-full bg-slate-800">
              {novel.cover_image_url ? (
                <Image
                  src={novel.cover_image_url}
                  alt={novel.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 300px"
                  className="object-cover"
                  priority
                  unoptimized
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full text-slate-500 font-medium">
                  No Cover
                </div>
              )}
            </div>
          </div>

          {/* Title */}
          <div className="flex flex-col text-center md:text-left text-white md:mt-4">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-4 drop-shadow-md">
              {novel.title}
            </h1>

            {/* Tag Genre */}
            {novel.genres && novel.genres.length > 0 && (
              <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-6">
                {novel.genres.map((g) => (
                  <span
                    key={g.id}
                    className="px-3 py-1 bg-indigo-500/20 text-indigo-200 border border-indigo-500/30 rounded-full text-sm font-medium backdrop-blur-sm"
                  >
                    {g.name}
                  </span>
                ))}
              </div>
            )}

            <div className="text-slate-300 font-medium">
              Ditulis oleh:{" "}
              <span className="text-white">{novel.author || "Anonim"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col md:flex-row gap-12 w-full">
        {/* Left */}
        <div className="md:w-2/3">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <svg
              className="w-6 h-6 text-indigo-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Sinopsis
          </h2>
          <div className="prose prose-lg prose-slate max-w-none text-slate-700 leading-loose text-justify whitespace-pre-line bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            {novel.synopsis || "Belum ada sinopsis untuk novel ini."}
          </div>
        </div>

        {/* Chapter/Volume List */}
        <div className="md:w-1/3">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <svg
              className="w-6 h-6 text-indigo-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 10h16M4 14h16M4 18h16"
              />
            </svg>
            Daftar Chapter
          </h2>

          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
            {novel.chapters && novel.chapters.length > 0 ? (
              <div className="flex flex-col gap-3 max-h-150 overflow-y-auto pr-2 custom-scrollbar">
                {novel.chapters.map((ch) => (
                  <Link
                    key={ch.id}
                    href={`/novel/${novel.slug}/${ch.chapter_number}`}
                    className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl hover:border-indigo-500 hover:shadow-md hover:bg-white transition-all group"
                  >
                    <div>
                      <div className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                        Chapter {ch.chapter_number}
                      </div>
                      {ch.title && (
                        <div className="text-sm text-slate-500 truncate max-w-45 mt-0.5">
                          {ch.title}
                        </div>
                      )}
                    </div>
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                      &rarr;
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="py-10 flex flex-col items-center justify-center text-center text-slate-500 border-2 border-dashed border-slate-200 rounded-xl">
                <svg
                  className="w-12 h-12 mb-3 text-slate-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                <span>Belum ada chapter yang dirilis.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
