"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);

  const pathname = usePathname();
  const router = useRouter();

  // Daftar Menu untuk memudahkan mapping dan penentuan status aktif
  const navLinks = [
    { name: "Beranda", href: "/" },
    { name: "Eksplorasi", href: "/explore" },
  ];

  // Efek untuk mendeteksi scroll (membuat navbar lebih transparan saat di atas)
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Hiden Logic (Sembunyikan di Mode Baca)
  const isReadMode = /^\/novel\/[^\/]+\/\d+$/.test(pathname);
  const isAdminMode = pathname.startsWith("/admin");
  if (isReadMode || isAdminMode) return null;

  // Search Execute
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
    <nav
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/70 backdrop-blur-lg shadow-sm border-b border-slate-200/50"
          : "bg-white/90 backdrop-blur-sm border-b border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <div className="shrink-0 flex items-center">
            <Link
              href="/"
              className="text-2xl font-black text-indigo-600 tracking-tighter hover:opacity-80 transition-opacity"
            >
              Light<span className="text-slate-800">Novel</span>.
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2 lg:space-x-8">
            <div className="flex space-x-1 lg:space-x-2">
              {navLinks.map((link) => {
                // Logika Aktif: Cocokkan URL persis untuk Beranda, atau awalan untuk halaman lain
                const isActive =
                  pathname === link.href ||
                  (link.href !== "/" && pathname.startsWith(link.href));

                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className="relative px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 group"
                  >
                    <span
                      className={`relative z-10 transition-colors duration-300 ${
                        isActive
                          ? "text-indigo-600"
                          : "text-slate-500 group-hover:text-slate-900"
                      }`}
                    >
                      {link.name}
                    </span>

                    {/* Background Pill Hover (Inactive) */}
                    <span className="absolute inset-0 rounded-full bg-slate-100 opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 transition-all duration-300"></span>

                    {/* Indikator Aktif (Dot Kecil di bawah teks) */}
                    {isActive && (
                      <span className="absolute left-1/2 -bottom-1 -translate-x-1/2 w-1.5 h-1.5 bg-indigo-600 rounded-full animate-fade-in shadow-sm"></span>
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Search Bar Desktop (Expandable) */}
            <form onSubmit={handleSearch} className="relative group ml-4">
              <input
                type="text"
                placeholder="Cari novel..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-56 focus:w-72 lg:w-64 lg:focus:w-80 bg-slate-100 text-sm text-slate-800 rounded-full pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white border border-transparent focus:border-indigo-200 transition-all duration-300 shadow-inner focus:shadow-md"
              />
              <div className="absolute left-3 top-2.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                  />
                </svg>
              </div>
            </form>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="relative w-10 h-10 flex items-center justify-center text-slate-500 hover:text-indigo-600 focus:outline-none rounded-full hover:bg-slate-100 transition-colors"
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

      {/* Mobile Dropdown Menu (Animated Smooth Reveal) */}
      <div
        className={`md:hidden absolute w-full bg-white/95 backdrop-blur-xl border-b border-slate-100 shadow-xl overflow-hidden transition-all duration-300 ease-in-out ${
          isMobileMenuOpen
            ? "max-h-75 opacity-100 py-4"
            : "max-h-0 opacity-0 py-0"
        }`}
      >
        <div className="px-4 space-y-4">
          <form onSubmit={handleSearch} className="relative w-full">
            <input
              type="text"
              placeholder="Cari judul..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-100 text-sm text-slate-800 rounded-full pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 border border-transparent focus:bg-white"
            />
            <div className="absolute left-4 top-3 text-slate-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                />
              </svg>
            </div>
          </form>

          <div className="flex flex-col space-y-1">
            {navLinks.map((link) => {
              const isActive =
                pathname === link.href ||
                (link.href !== "/" && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`px-4 py-3 rounded-xl text-base font-semibold transition-all ${
                    isActive
                      ? "bg-indigo-50 text-indigo-600"
                      : "text-slate-600 hover:bg-slate-50 hover:text-indigo-600"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
