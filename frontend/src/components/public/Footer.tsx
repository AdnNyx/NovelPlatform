import React from "react";
import Link from "next/link";
import { BookOpen, Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full bg-white border-t border-border-subtle mt-16 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white">
                <BookOpen className="w-4 h-4" />
              </div>
              <span className="font-sans font-extrabold text-base text-text-primary tracking-tight">
                Novel<span className="text-primary">Publik</span>
              </span>
            </Link>
            <p className="text-sm text-text-secondary max-w-sm leading-relaxed">
              Platform baca novel publik online modern yang sepenuhnya gratis untuk semua penikmat
              literatur. Baca ribuan cerita memikat kapan saja tanpa batasan.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-text-primary mb-3">
              Jelajah
            </h4>
            <ul className="space-y-2 text-sm text-text-secondary">
              <li>
                <Link href="/" className="hover:text-primary transition-colors">
                  Beranda
                </Link>
              </li>
              <li>
                <Link href="/katalog" className="hover:text-primary transition-colors">
                  Katalog Lengkap
                </Link>
              </li>
              <li>
                <Link href="/ranking" className="hover:text-primary transition-colors">
                  Peringkat Terpopuler
                </Link>
              </li>
            </ul>
          </div>

          {/* Reader Support */}
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-text-primary mb-3">
              Pembaca
            </h4>
            <ul className="space-y-2 text-sm text-text-secondary">
              <li>
                <Link href="/login" className="hover:text-primary transition-colors">
                  Masuk Akun
                </Link>
              </li>
              <li>
                <Link href="/profil" className="hover:text-primary transition-colors">
                  Rak Buku & Riwayat
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border-subtle flex flex-col sm:flex-row items-center justify-between text-xs text-text-secondary gap-4">
          <p>© {new Date().getFullYear()} Web Baca Novel Publik. Hak Cipta Dilindungi.</p>
          <p className="flex items-center gap-1">
            Dibuat dengan <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" /> untuk komunitas literasi Indonesia.
          </p>
        </div>
      </div>
    </footer>
  );
}
