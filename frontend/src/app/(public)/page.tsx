import React from "react";
import Link from "next/link";
import { Sparkles, ArrowRight, TrendingUp, Clock, Trophy } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { Novel, PaginatedResponse } from "@/types";
import { NovelCard } from "@/components/public/NovelCard";

// Dynamic SSR fetch with caching
async function getHomeNovels(): Promise<{
  trending: Novel[];
  latest: Novel[];
}> {
  try {
    const [trendingRes, latestRes] = await Promise.all([
      apiClient<PaginatedResponse<Novel>>("/api/novels", {
        params: { sort: "popular", limit: 6 },
        next: { revalidate: 60 } as any,
      }),
      apiClient<PaginatedResponse<Novel>>("/api/novels", {
        params: { sort: "latest", limit: 6 },
        next: { revalidate: 60 } as any,
      }),
    ]);

    return {
      trending: trendingRes.data || [],
      latest: latestRes.data || [],
    };
  } catch (error) {
    console.error("Failed to fetch home novels:", error);
    return { trending: [], latest: [] };
  }
}

export default async function HomePage() {
  const { trending, latest } = await getHomeNovels();
  const featured = trending.length > 0 ? trending[0] : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-16">
      {/* Editorial Hero Section */}
      <section className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-indigo-900 via-indigo-800 to-primary text-white p-8 sm:p-12 md:p-16 shadow-2xl gsap-fade-in">
        <div className="relative z-10 max-w-2xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold uppercase tracking-wider text-indigo-200 border border-white/10">
            <Sparkles className="w-4 h-4 text-secondary" />
            Platform Membaca Terbuka
          </div>

          <h1 className="font-sans font-extrabold text-3xl sm:text-5xl lg:text-6xl tracking-tight leading-tight">
            Dunia Cerita Tanpa Batas.
          </h1>

          <p className="text-base sm:text-lg text-indigo-100 font-normal leading-relaxed">
            Nikmati ribuan novel karya penulis berbakat secara bebas, gratis tanpa perlu mendaftar.
            Mulai petualangan membacamu hari ini dengan tampilan nyaman dan bersih.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              href="/katalog"
              className="px-6 py-3.5 rounded-xl bg-white text-primary font-bold text-sm shadow-lg hover:bg-indigo-50 transition-all flex items-center gap-2 group"
            >
              Mulai Membaca
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/ranking"
              className="px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm backdrop-blur-md transition-all border border-white/20"
            >
              Lihat Ranking
            </Link>
          </div>
        </div>

        {/* Floating Featured Novel Visual */}
        {featured && (
          <div className="hidden lg:block absolute right-12 top-1/2 -translate-y-1/2 w-64 aspect-[2/3] rounded-2xl shadow-2xl overflow-hidden border-2 border-white/20 rotate-3 hover:rotate-0 transition-transform duration-500">
            {featured.cover_url && (
              <img
                src={featured.cover_url}
                alt={featured.title}
                className="w-full h-full object-cover"
              />
            )}
          </div>
        )}
      </section>

      {/* Trending Novels Section */}
      <section className="space-y-6 gsap-fade-in">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 text-primary">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-sans font-extrabold text-xl sm:text-2xl text-text-primary tracking-tight">
                Sedang Hangat
              </h2>
              <p className="text-xs text-text-secondary">Novel paling ramai dibaca minggu ini</p>
            </div>
          </div>
          <Link
            href="/katalog?sort=popular"
            className="text-xs font-semibold text-primary hover:text-primary-hover flex items-center gap-1 group"
          >
            Lihat Semua
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
          {trending.map((novel) => (
            <NovelCard key={novel.id} novel={novel} />
          ))}
        </div>
      </section>

      {/* Latest Updates Section */}
      <section className="space-y-6 gsap-fade-in">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-50 text-secondary">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-sans font-extrabold text-xl sm:text-2xl text-text-primary tracking-tight">
                Pembaruan Terbaru
              </h2>
              <p className="text-xs text-text-secondary">Rilisan chapter dan novel paling segar</p>
            </div>
          </div>
          <Link
            href="/katalog?sort=latest"
            className="text-xs font-semibold text-primary hover:text-primary-hover flex items-center gap-1 group"
          >
            Lihat Semua
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
          {latest.map((novel) => (
            <NovelCard key={novel.id} novel={novel} />
          ))}
        </div>
      </section>

      {/* Quick Ranking CTA Banner */}
      <section className="rounded-2xl bg-surface-light border border-border-subtle p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm gsap-fade-in">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
            <Trophy className="w-7 h-7" />
          </div>
          <div>
            <h3 className="font-sans font-bold text-lg text-text-primary">
              Penasaran novel dengan rating tertinggi?
            </h3>
            <p className="text-sm text-text-secondary">
              Pantau peringkat mingguan, bulanan, dan novel terbaik sepanjang masa di papan leaderboard kami.
            </p>
          </div>
        </div>
        <Link
          href="/ranking"
          className="px-6 py-3 rounded-xl bg-secondary hover:bg-secondary/90 text-white font-semibold text-sm whitespace-nowrap shadow-md shadow-secondary/20 transition-all"
        >
          Lihat Papan Peringkat
        </Link>
      </section>
    </div>
  );
}
