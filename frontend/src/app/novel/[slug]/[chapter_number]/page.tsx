import Link from "next/link";
import { notFound } from "next/navigation";

// 1. Interface sesuai dengan ChapterReadResponse dari Backend
interface ChapterRead {
  id: string;
  novel_title: string;
  novel_slug: string;
  chapter_number: number;
  title: string | null;
  content: string;
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
      {
        cache: "no-store",
      },
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
  // Await params untuk Next.js 15
  const resolvedParams = await params;
  const chapter = await getChapterData(
    resolvedParams.slug,
    resolvedParams.chapter_number,
  );

  if (!chapter) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] py-8">
      {" "}
      {/* Warna latar kertas krem yang nyaman untuk mata */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* --- NAVIGASI ATAS --- */}
        <div className="mb-8 flex flex-col items-center justify-center text-center">
          <Link
            href={`/novel/${chapter.novel_slug}`}
            className="text-indigo-600 hover:text-indigo-800 text-sm font-semibold mb-2 transition-colors"
          >
            &larr; Kembali ke Daftar Isi
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
            {chapter.novel_title}
          </h1>
          <h2 className="text-lg text-gray-600">
            Chapter {chapter.chapter_number}{" "}
            {chapter.title ? `- ${chapter.title}` : ""}
          </h2>
        </div>

        {/* --- KONTEN NOVEL (HTML dari Backend) --- */}
        <div
          className="
            text-lg text-gray-800 leading-relaxed text-justify 
            [&>p]:mb-6 
            [&>h2]:text-2xl [&>h2]:font-bold [&>h2]:text-gray-900 [&>h2]:mt-12 [&>h2]:mb-4 [&>h2]:border-b [&>h2]:pb-2
            [&>img]:mx-auto [&>img]:rounded-xl [&>img]:shadow-lg [&>img]:my-8
          "
          dangerouslySetInnerHTML={{ __html: chapter.content }}
        />

        {/* --- NAVIGASI BAWAH (Prev / Next) --- */}
        <div className="mt-16 pt-8 border-t border-gray-200 flex flex-wrap justify-between items-center gap-4">
          {/* Tombol Previous */}
          {chapter.prev_chapter !== null ? (
            <Link
              href={`/novel/${chapter.novel_slug}/${chapter.prev_chapter}`}
              className="px-6 py-3 bg-white border border-gray-300 rounded-full text-gray-700 hover:bg-gray-50 hover:text-indigo-600 font-medium transition-all shadow-sm"
            >
              &larr; Chapter {chapter.prev_chapter}
            </Link>
          ) : (
            <div className="px-6 py-3 border border-transparent"></div> /* Placeholder agar layout tidak rusak */
          )}

          {/* Tombol Daftar Isi */}
          <Link
            href={`/novel/${chapter.novel_slug}`}
            className="px-6 py-3 bg-indigo-600 text-white rounded-full font-medium hover:bg-indigo-700 transition-all shadow-sm"
          >
            Daftar Isi
          </Link>

          {/* Tombol Next */}
          {chapter.next_chapter !== null ? (
            <Link
              href={`/novel/${chapter.novel_slug}/${chapter.next_chapter}`}
              className="px-6 py-3 bg-white border border-gray-300 rounded-full text-gray-700 hover:bg-gray-50 hover:text-indigo-600 font-medium transition-all shadow-sm"
            >
              Chapter {chapter.next_chapter} &rarr;
            </Link>
          ) : (
            <div className="px-6 py-3 border border-transparent text-gray-400 text-sm">
              Mentok (Terbaru)
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
