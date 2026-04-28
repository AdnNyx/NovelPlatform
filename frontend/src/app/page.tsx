import NovelCard, { Novel } from "@/components/novel/NovelCard";
import Link from "next/link";

// Data Structure
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

// Fetch Parameter
async function getLatestNovels(
  page: number,
  search?: string,
): Promise<PaginatedResponse> {
  try {
    // URL Produksi diubah (menyertakan search jika ada)
    let url = `http://127.0.0.1:8000/api/v1/novels/latest?page=${page}&limit=12`;
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }

    const res = await fetch(url, { cache: "no-store" });

    if (!res.ok) throw new Error("Gagal mengambil data");
    return res.json();
  } catch (error) {
    console.error("Error fetching novels:", error);
    return {
      data: [],
      meta: { current_page: 1, total_pages: 1, total_items: 0, limit: 12 },
    };
  }
}

// Main Component
export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;

  const pageParam =
    typeof resolvedParams.page === "string" ? parseInt(resolvedParams.page) : 1;
  const currentPage = isNaN(pageParam) ? 1 : pageParam;

  const searchQuery =
    typeof resolvedParams.search === "string"
      ? resolvedParams.search
      : undefined;

  const { data: novels, meta } = await getLatestNovels(
    currentPage,
    searchQuery,
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col min-h-[80vh]">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">
          Rilis Terbaru
        </h1>
        <p className="text-gray-500">
          Temukan kisah-kisah seru yang baru saja diperbarui hari ini.
        </p>
      </div>

      {/* Grid Rendering */}
      {novels.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 mb-10">
          {novels.map((novel) => (
            <NovelCard key={novel.id} novel={novel} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
          <p className="text-gray-500">Belum ada novel di halaman ini.</p>
        </div>
      )}

      {/* Button */}
      {meta.total_pages > 1 && (
        <div className="mt-auto flex justify-center items-center gap-4 py-4">
          {/* Previus Button */}
          {meta.current_page > 1 ? (
            <Link
              href={`/?page=${meta.current_page - 1}`}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              &larr; Sebelumnya
            </Link>
          ) : (
            <button
              disabled
              className="px-4 py-2 text-sm font-medium text-gray-400 bg-gray-100 border border-gray-200 rounded-md cursor-not-allowed"
            >
              &larr; Sebelumnya
            </button>
          )}

          {/* Index Page */}
          <span className="text-sm font-medium text-gray-600">
            Halaman {meta.current_page} dari {meta.total_pages}
          </span>

          {/* Next Button */}
          {meta.current_page < meta.total_pages ? (
            <Link
              href={`/?page=${meta.current_page + 1}`}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Selanjutnya &rarr;
            </Link>
          ) : (
            <button
              disabled
              className="px-4 py-2 text-sm font-medium text-gray-400 bg-gray-100 border border-gray-200 rounded-md cursor-not-allowed"
            >
              Selanjutnya &rarr;
            </button>
          )}
        </div>
      )}
    </div>
  );
}
