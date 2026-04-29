import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import SupportCard from "@/components/ui/SupportCard";

// Interface
interface ChapterRead {
  id: string;
  novel_title: string;
  novel_slug: string;
  chapter_number: number;
  title: string | null;
  content: string;
  cover_image_url: string | null;
  published_at: string;
  prev_chapter: number | null;
  next_chapter: number | null;
}

// 2. Fungsi Fetching Data
async function getChapterData(
  slug: string,
  chapterNumber: string,
): Promise<ChapterRead | null> {
  try {
    const res = await fetch(
      `http://127.0.0.1:8000/api/v1/chapters/${slug}/${chapterNumber}`,
      { cache: "no-store" },
    );

    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    console.error("Error fetching chapter:", error);
    return null;
  }
}

// 3. Komponen Utama
export default async function ChapterReadPage({
  params,
}: {
  params: Promise<{ slug: string; chapter_number: string }>;
}) {
  const resolvedParams = await params;
  const chapter = await getChapterData(
    resolvedParams.slug,
    resolvedParams.chapter_number,
  );

  if (!chapter) {
    notFound();
  }

  return (
    // Warna latar #FAFAF9 (Stone 50) - Sangat nyaman di mata untuk membaca lama
    <div className="min-h-screen bg-[#FAFAF9] pb-24 relative selection:bg-indigo-200 selection:text-indigo-900">
      {/* --- GLASSMORPHISM TOP NAVIGATION --- */}
      <div className="sticky top-0 z-50 bg-[#FAFAF9]/80 backdrop-blur-md border-b border-slate-200/50 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <Link
            href={`/novel/${chapter.novel_slug}`}
            className="flex items-center text-sm font-semibold text-slate-500 hover:text-indigo-600 transition-colors group"
          >
            <svg
              className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Daftar Isi
          </Link>
          <span className="text-sm font-bold text-slate-800 truncate max-w-[50%]">
            {chapter.novel_title}
          </span>
        </div>
      </div>

      {/* --- HERO BANNER (Jika Cover Volume Tersedia) --- */}
      {chapter.cover_image_url && (
        <div className="relative w-full h-[40vh] md:h-[50vh] overflow-hidden select-none">
          <Image
            src={chapter.cover_image_url}
            alt="Chapter Cover"
            fill
            className="object-cover object-top opacity-80"
            priority
            unoptimized
          />
          {/* Efek Gradien Peleburan Gambar ke Latar Belakang Teks */}
          <div className="absolute inset-0 bg-linear-to-t from-[#FAFAF9] via-[#FAFAF9]/60 to-transparent"></div>
        </div>
      )}

      {/* Kontainer Utama Membaca */}
      <div
        className={`max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 ${chapter.cover_image_url ? "-mt-32 relative z-10" : "pt-16"}`}
      >
        {/* --- HEADER JUDUL CHAPTER --- */}
        <div className="mb-14 text-center">
          <span className="inline-block py-1 px-3 rounded-full bg-indigo-100 text-indigo-700 text-xs font-black tracking-widest uppercase mb-4 shadow-sm">
            Volume {chapter.chapter_number}
          </span>
          <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight mb-4 drop-shadow-sm">
            {chapter.title || `Chapter ${chapter.chapter_number}`}
          </h1>
          <div className="w-16 h-1 bg-indigo-600 mx-auto rounded-full opacity-50"></div>
        </div>

        {/* --- KONTEN NOVEL (Super Typography) --- */}
        <div
          className="
            font-serif text-[1.15rem] md:text-xl text-slate-800 leading-[2.2] text-justify
            [&>p]:mb-8 [&>p]:tracking-wide
            [&>h2]:text-2xl [&>h2]:font-sans [&>h2]:font-bold [&>h2]:text-slate-900 [&>h2]:mt-16 [&>h2]:mb-6 [&>h2]:text-center
            [&>img]:mx-auto [&>img]:rounded-2xl [&>img]:shadow-xl [&>img]:my-12 [&>img]:w-full [&>img]:max-w-2xl
            [&>hr]:my-12 [&>hr]:border-slate-300 [&>hr]:border-dashed
          "
          dangerouslySetInnerHTML={{ __html: chapter.content }}
        />

        <div className="mt-16 max-w-md mx-auto">
          <SupportCard />
        </div>

        {/* --- NAVIGASI BAWAH (Pill Style) --- */}
        <div className="mt-20 pt-10 border-t-2 border-slate-200/50 flex flex-col sm:flex-row justify-between items-center gap-6 select-none">
          {/* Tombol Previous */}
          {chapter.prev_chapter !== null ? (
            <Link
              href={`/novel/${chapter.novel_slug}/${chapter.prev_chapter}`}
              className="w-full sm:w-auto px-8 py-3.5 bg-white border border-slate-200 rounded-full text-slate-700 hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-300 hover:shadow-md font-semibold transition-all flex items-center justify-center group"
            >
              <svg
                className="w-5 h-5 mr-2 text-slate-400 group-hover:text-indigo-500 transition-colors"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Vol. {chapter.prev_chapter}
            </Link>
          ) : (
            <div className="w-full sm:w-auto px-8 py-3.5 border border-transparent"></div>
          )}

          {/* Tombol Daftar Isi (Tengah) */}
          <Link
            href={`/novel/${chapter.novel_slug}`}
            className="w-full sm:w-auto px-8 py-3.5 bg-slate-900 text-white rounded-full font-semibold hover:bg-indigo-600 hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center"
          >
            <svg
              className="w-5 h-5 mr-2"
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
            Daftar Isi
          </Link>

          {/* Tombol Next */}
          {chapter.next_chapter !== null ? (
            <Link
              href={`/novel/${chapter.novel_slug}/${chapter.next_chapter}`}
              className="w-full sm:w-auto px-8 py-3.5 bg-white border border-slate-200 rounded-full text-slate-700 hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-300 hover:shadow-md font-semibold transition-all flex items-center justify-center group"
            >
              Vol. {chapter.next_chapter}
              <svg
                className="w-5 h-5 ml-2 text-slate-400 group-hover:text-indigo-500 transition-colors"
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
          ) : (
            <div className="w-full sm:w-auto px-8 py-3.5 bg-slate-100 border border-slate-200 rounded-full text-slate-400 font-semibold flex items-center justify-center cursor-not-allowed text-sm">
              Mentok (Terbaru)
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
