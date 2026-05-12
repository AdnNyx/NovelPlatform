"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const [isNovelOpen, setIsNovelOpen] = useState(() =>
    pathname.startsWith("/admin/novels"),
  );
  const [prevPath, setPrevPath] = useState(pathname);

  if (pathname !== prevPath) {
    setPrevPath(pathname);
    if (pathname.startsWith("/admin/novels")) {
      setIsNovelOpen(true);
    }
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar Admin */}
      <aside className="w-64 bg-slate-900 text-white shrink-0 flex flex-col shadow-xl z-20">
        <div className="h-16 flex items-center px-6 border-b border-slate-800 shrink-0">
          <Link href="/admin" className="text-xl font-black tracking-tighter">
            Light<span className="text-indigo-500">Admin</span>.
          </Link>
        </div>

        <nav
          className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar"
          data-lenis-prevent="true"
        >
          <Link
            href="/admin"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
              pathname === "/admin"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/20"
                : "text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <svg
              className={`w-5 h-5 ${pathname === "/admin" ? "text-white" : "text-slate-400 group-hover:text-white"}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
              />
            </svg>
            Ringkasan Dasbor
          </Link>

          <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 mt-6 px-3">
            Manajemen Konten
          </div>

          <div className="space-y-1">
            <button
              onClick={() => setIsNovelOpen(!isNovelOpen)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                pathname.startsWith("/admin/novels") && !isNovelOpen
                  ? "bg-slate-800 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <svg
                  className={`w-5 h-5 ${pathname.startsWith("/admin/novels") ? "text-indigo-400" : "text-slate-400 group-hover:text-white"}`}
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
                <span>Katalog Novel</span>
              </div>
              <svg
                className={`w-4 h-4 text-slate-500 transition-transform duration-300 ${isNovelOpen ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {isNovelOpen && (
              <div className="pl-11 pr-3 py-1 space-y-1 animate-fade-in">
                <Link
                  href="/admin/novels"
                  className={`block px-3 py-2 rounded-lg text-sm transition-all ${
                    pathname === "/admin/novels" ||
                    (pathname.startsWith("/admin/novels") &&
                      !pathname.includes("/create") &&
                      !pathname.includes("/edit") &&
                      pathname.split("/").length > 3)
                      ? "bg-indigo-600 text-white font-bold shadow-md shadow-indigo-900/20"
                      : "text-slate-400 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  Daftar Novel
                </Link>
                <Link
                  href="/admin/novels/create"
                  className={`block px-3 py-2 rounded-lg text-sm transition-all ${
                    pathname === "/admin/novels/create"
                      ? "bg-indigo-600 text-white font-bold shadow-md shadow-indigo-900/20"
                      : "text-slate-400 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  + Tambah Baru
                </Link>
              </div>
            )}
          </div>

          <Link
            href="/admin/genres"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group mt-1 ${
              pathname.startsWith("/admin/genres")
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/20"
                : "text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <svg
              className={`w-5 h-5 ${pathname.startsWith("/admin/genres") ? "text-white" : "text-slate-400 group-hover:text-white"}`}
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

      {/* Content Admin */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
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

        <div
          className="flex-1 overflow-y-auto scroll-smooth p-8 bg-slate-50/50"
          data-lenis-prevent="true"
        >
          <div className="max-w-6xl mx-auto animate-fade-in pb-10">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
