// src/app/admin/layout.tsx
import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* --- SIDEBAR ADMIN --- */}
      <aside className="w-64 bg-slate-900 text-white shrink-0 flex flex-col shadow-xl z-20">
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <Link href="/admin" className="text-xl font-black tracking-tighter">
            Light<span className="text-indigo-500">Admin</span>.
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 mt-4 px-3">
            Manajemen Konten
          </div>

          <Link
            href="/admin/novels"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-indigo-600 hover:text-white transition-all group"
          >
            <svg
              className="w-5 h-5 text-slate-400 group-hover:text-white"
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
            Kelola Novel
          </Link>

          <Link
            href="/admin/genres"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-indigo-600 hover:text-white transition-all group"
          >
            <svg
              className="w-5 h-5 text-slate-400 group-hover:text-white"
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
            Kelola Genre
          </Link>

          <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 mt-8 px-3">
            Sistem
          </div>
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 transition-all"
          >
            <svg
              className="w-5 h-5 text-slate-400"
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
            Kembali ke Web
          </Link>
        </nav>
      </aside>

      {/* --- AREA KONTEN ADMIN --- */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Topbar Admin Khusus */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <h2 className="text-lg font-bold text-slate-800">Dasbor Admin</h2>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-500">
              Halo, Admin
            </span>
            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
              A
            </div>
          </div>
        </header>

        {/* Tempat Konten Utama Masuk */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
          <div className="max-w-6xl mx-auto animate-fade-in">{children}</div>
        </div>
      </main>
    </div>
  );
}
