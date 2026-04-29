import NovelCard, { Novel } from "@/components/novel/NovelCard";
import Link from "next/link";

// --- INTERFACES ---
interface Genre {
  id: number;
  name: string;
  slug: string;
}

interface PaginationMeta {
  current_page: number;
  total_pages: number;
  total_items: number;
  limit: number;
}

interface PaginatedResponse {
  data: Novel[];
  meta: PaginationMeta;
}

// --- FETCHING FUNCTIONS ---
async function getGenres(): Promise<Genre[]> {
  try {
    const res = await fetch("http://127.0.0.1:8000/api/v1/genres/", {
      cache: "no-store",
    });
    if (!res.ok) return [];
    return res.json();
  } catch (error) {
    console.error("Error fetching genres:", error);
    return [];
  }
}

async function getFilteredNovels(
  page: number,
  genreId?: string,
  status?: string,
  search?: string,
): Promise<PaginatedResponse> {
  try {
    let url = `http://127.0.0.1:8000/api/v1/novels/latest?page=${page}&limit=15`;
    if (genreId) url += `&genre_id=${genreId}`;
    if (status) url += `&status=${status}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;

    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
  } catch (error) {
    console.error("Error fetching novels:", error);
    return {
      data: [],
      meta: { current_page: 1, total_pages: 1, total_items: 0, limit: 15 },
    };
  }
}

// --- MAIN COMPONENT ---
export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // 1. Await searchParams (Next.js 15 requirement)
  const resolvedParams = await searchParams;

  // 2. Ekstrak Parameter URL
  const currentGenreId =
    typeof resolvedParams.genre === "string" ? resolvedParams.genre : undefined;
  const currentStatus =
    typeof resolvedParams.status === "string"
      ? resolvedParams.status
      : undefined;
  const searchQuery =
    typeof resolvedParams.search === "string"
      ? resolvedParams.search
      : undefined;

  const pageParam =
    typeof resolvedParams.page === "string" ? parseInt(resolvedParams.page) : 1;
  const currentPage = isNaN(pageParam) ? 1 : pageParam;

  // 3. Tarik Data Paralel
  const [genres, { data: novels, meta }] = await Promise.all([
    getGenres(),
    getFilteredNovels(currentPage, currentGenreId, currentStatus, searchQuery),
  ]);

  // Cari nama genre aktif untuk header
  const activeGenreName = currentGenreId
    ? genres.find((g) => String(g.id) === currentGenreId)?.name
    : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in min-h-[80vh]">
      {/* HEADER EKSPLORASI */}
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">
          Eksplorasi Novel
        </h1>
        <p className="text-gray-500">
          Temukan kisah favorit Anda selanjutnya berdasarkan genre atau status
          perilisan.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-10">
        {/* =========================================
            SIDEBAR: FILTER PANEL (Kiri di Desktop, Atas di Mobile)
            ========================================= */}
        <aside className="w-full lg:w-64 shrink-0">
          <div className="sticky top-24 space-y-10 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            {/* Filter Genre */}
            <div>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
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
                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                  />
                </svg>
                Kategori Genre
              </h3>
              <div className="flex flex-wrap lg:flex-col gap-2">
                {/* Tombol "Semua Genre" (Reset Filter Genre) */}
                <Link
                  href={`/explore${currentStatus ? `?status=${currentStatus}` : ""}`}
                  className={`px-4 py-2 lg:py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                    !currentGenreId
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-200 translate-x-1"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  Semua Genre
                </Link>

                {/* Looping Genre dari Database */}
                {genres.map((g) => {
                  const isActive = currentGenreId === String(g.id);
                  // Bikin URL dinamis, pertahankan status jika sedang memfilter status
                  const targetUrl = `/explore?genre=${g.id}${currentStatus ? `&status=${currentStatus}` : ""}`;

                  return (
                    <Link
                      key={g.id}
                      href={targetUrl}
                      className={`px-4 py-2 lg:py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                        isActive
                          ? "bg-indigo-600 text-white shadow-md shadow-indigo-200 translate-x-1"
                          : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      }`}
                    >
                      {g.name}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Filter Status */}
            <div>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
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
                    d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                  />
                </svg>
                Status Perilisan
              </h3>
              <div className="flex flex-wrap lg:flex-col gap-2">
                {/* Tombol Reset Status */}
                <Link
                  href={`/explore${currentGenreId ? `?genre=${currentGenreId}` : ""}`}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${
                    !currentStatus
                      ? "bg-slate-800 text-white shadow-md translate-x-1"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  Semua Status
                </Link>

                {["ongoing", "completed", "hiatus"].map((s) => {
                  const isActive = currentStatus === s;
                  const targetUrl = `/explore?status=${s}${currentGenreId ? `&genre=${currentGenreId}` : ""}`;

                  return (
                    <Link
                      key={s}
                      href={targetUrl}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-all duration-300 ${
                        isActive
                          ? "bg-slate-800 text-white shadow-md translate-x-1"
                          : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      }`}
                    >
                      {s}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </aside>

        {/* =========================================
            MAIN CONTENT: GRID NOVEL
            ========================================= */}
        <main className="flex-1">
          {/* Top Bar Info */}
          <div className="flex flex-wrap items-center justify-between mb-8 gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <h2 className="text-xl font-bold text-slate-800">
              {searchQuery
                ? `Hasil: "${searchQuery}"`
                : activeGenreName
                  ? `Novel ${activeGenreName}`
                  : "Semua Koleksi"}
              {currentStatus && (
                <span className="ml-2 text-sm font-normal text-slate-500 capitalize">
                  ({currentStatus})
                </span>
              )}
            </h2>
            <div className="text-sm font-medium text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg">
              Menemukan{" "}
              <span className="text-indigo-600 font-bold">
                {meta.total_items}
              </span>{" "}
              novel
            </div>
          </div>

          {/* Grid Render */}
          {novels.length > 0 ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 mb-12">
                {novels.map((novel) => (
                  <NovelCard key={novel.id} novel={novel} />
                ))}
              </div>

              {/* Pagination Minimalis (Jika lebih dari 1 halaman) */}
              {meta.total_pages > 1 && (
                <div className="flex justify-center items-center gap-2">
                  {meta.current_page > 1 && (
                    <Link
                      href={`/explore?page=${meta.current_page - 1}${currentGenreId ? `&genre=${currentGenreId}` : ""}${currentStatus ? `&status=${currentStatus}` : ""}`}
                      className="px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-indigo-300 transition-all"
                    >
                      &larr; Prev
                    </Link>
                  )}

                  <span className="px-4 py-2 text-sm font-bold text-indigo-600 bg-indigo-50 rounded-xl">
                    {meta.current_page} / {meta.total_pages}
                  </span>

                  {meta.current_page < meta.total_pages && (
                    <Link
                      href={`/explore?page=${meta.current_page + 1}${currentGenreId ? `&genre=${currentGenreId}` : ""}${currentStatus ? `&status=${currentStatus}` : ""}`}
                      className="px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-indigo-300 transition-all"
                    >
                      Next &rarr;
                    </Link>
                  )}
                </div>
              )}
            </>
          ) : (
            /* Empty State */
            <div className="bg-white rounded-3xl p-16 border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                <svg
                  className="w-10 h-10 text-slate-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">
                Novel Tidak Ditemukan
              </h3>
              <p className="text-slate-500 mb-6 max-w-md">
                Maaf, sepertinya belum ada novel yang cocok dengan kombinasi
                filter yang Anda pilih.
              </p>
              <Link
                href="/explore"
                className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-full hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200"
              >
                Reset Semua Filter
              </Link>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
