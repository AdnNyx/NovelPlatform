// src/app/admin/page.tsx

interface AdminStats {
  total_novels: number;
  total_chapters: number;
  total_genres: number;
}

async function getStats(): Promise<AdminStats> {
  try {
    const res = await fetch(
      "http://127.0.0.1:8000/api/v1/novels/stats/summary",
      {
        cache: "no-store", // Pastikan data selalu segar saat refresh
      },
    );
    if (!res.ok) throw new Error("Gagal mengambil statistik");
    return res.json();
  } catch (error) {
    console.error(error);
    return { total_novels: 0, total_chapters: 0, total_genres: 0 };
  }
}

export default async function AdminDashboard() {
  const stats = await getStats();

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Ringkasan Dasbor
        </h1>
        <p className="text-slate-500 mt-1">
          Status terkini platform Light Novel Anda.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card Total Novel */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 border-l-4 border-l-indigo-500 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5s3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Novel</p>
            <h3 className="text-2xl font-black text-slate-900">
              {stats.total_novels}
            </h3>
          </div>
        </div>

        {/* Card Total Volume */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 border-l-4 border-l-emerald-500 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
            <svg
              className="w-6 h-6"
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
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Volume</p>
            <h3 className="text-2xl font-black text-slate-900">
              {stats.total_chapters}
            </h3>
          </div>
        </div>

        {/* Card Total Genre */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 border-l-4 border-l-orange-500 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center text-orange-600">
            <svg
              className="w-6 h-6"
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
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Genre</p>
            <h3 className="text-2xl font-black text-slate-900">
              {stats.total_genres}
            </h3>
          </div>
        </div>
      </div>

      {/* Visual Indicator Aktifitas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4">Aksi Cepat</h3>
          <div className="grid grid-cols-2 gap-4">
            <button className="p-4 bg-slate-50 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition-all text-sm font-bold text-slate-600">
              + Tambah Novel
            </button>
            <button className="p-4 bg-slate-50 rounded-xl hover:bg-emerald-50 hover:text-emerald-600 transition-all text-sm font-bold text-slate-600">
              + Upload Volume
            </button>
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center items-center text-center">
          <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-2">
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
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p className="text-sm text-slate-500">
            Sistem terhubung ke Database Lokal via FastAPI
          </p>
        </div>
      </div>
    </div>
  );
}
