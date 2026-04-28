"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const pathname = usePathname();
  const router = useRouter();

  // Hiden Logic
  const isReadMode = /^\/novel\/[^\/]+\/\d+$/.test(pathname);
  if (isReadMode) return null;

  // Search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/?search=${encodeURIComponent(searchQuery)}`);
      setIsMobileMenuOpen(false);
    } else {
      router.push(`/`);
    }
  };

  return (
    <nav className="bg-white/80 backdrop-blur-md shadow-sm border-b sticky top-0 z-50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <div className="shrink-0 flex items-center">
            <Link
              href="/"
              className="text-2xl font-bold text-indigo-600 tracking-tighter"
            >
              Light<span className="text-slate-800">Novel</span>.
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <div className="flex space-x-6">
              <Link
                href="/"
                className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
              >
                Beranda
              </Link>
              <Link
                href="/explore"
                className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
              >
                Eksplorasi
              </Link>
            </div>

            {/* Search Bar Desktop */}
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="Cari novel..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 bg-slate-100 text-sm text-slate-800 rounded-full pl-4 pr-10 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
              <button
                type="submit"
                className="absolute right-3 top-2.5 text-slate-400 hover:text-indigo-600"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-4 h-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                  />
                </svg>
              </button>
            </form>
          </div>

          {/* Mobile Navigation */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-slate-500 hover:text-indigo-600 focus:outline-none p-2"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isMobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-slate-100 px-4 pt-2 pb-4 space-y-4 shadow-lg absolute w-full">
          <form onSubmit={handleSearch} className="relative w-full">
            <input
              type="text"
              placeholder="Cari novel..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-100 text-sm text-slate-800 rounded-full pl-4 pr-10 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </form>
          <div className="flex flex-col space-y-2">
            <Link
              href="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-indigo-600 hover:bg-slate-50"
            >
              Beranda
            </Link>
            <Link
              href="/explore"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-indigo-600 hover:bg-slate-50"
            >
              Eksplorasi
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
