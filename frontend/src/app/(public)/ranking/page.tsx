"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Trophy, Star, Eye, BookOpen, Crown } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { Novel, PaginatedResponse } from "@/types";

export default function RankingPage() {
  const [activeTab, setActiveTab] = useState<"weekly" | "monthly" | "all_time">("weekly");
  const [novels, setNovels] = useState<Novel[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    async function loadRanking() {
      setLoading(true);
      try {
        const res = await apiClient<PaginatedResponse<Novel>>("/api/novels", {
          params: { ranking: activeTab, limit: 20 },
        });
        if (isMounted) {
          setNovels(res.data || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadRanking();
    return () => {
      isMounted = false;
    };
  }, [activeTab]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-sans font-extrabold text-2xl sm:text-3xl text-text-primary tracking-tight flex items-center gap-2">
            <Trophy className="w-7 h-7 text-secondary" />
            Papan Peringkat
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Koleksi novel paling populer berdasarkan total pembaca dan rating
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1.5 p-1 bg-white border border-border-subtle rounded-2xl shadow-sm">
          {[
            { label: "Mingguan", value: "weekly" as const },
            { label: "Bulanan", value: "monthly" as const },
            { label: "Sepanjang Masa", value: "all_time" as const },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === tab.value
                  ? "bg-primary text-white shadow-sm"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Leaderboard Ranking List */}
      <div className="bg-white rounded-2xl border border-border-subtle shadow-sm overflow-hidden divide-y divide-gray-100">
        {loading ? (
          <div className="p-12 text-center text-sm text-text-secondary animate-pulse">
            Memuat data peringkat novel...
          </div>
        ) : novels.length === 0 ? (
          <div className="p-12 text-center text-sm text-text-secondary">
            Belum ada data ranking untuk periode ini.
          </div>
        ) : (
          novels.map((novel, index) => {
            const rank = index + 1;
            const isTop3 = rank <= 3;
            const primaryGenre = novel.genres && novel.genres.length > 0 ? novel.genres[0] : "Umum";

            return (
              <div
                key={novel.id}
                className={`p-4 sm:p-5 flex items-center gap-4 sm:gap-6 hover:bg-gray-50 transition-colors ${
                  rank === 1 ? "bg-amber-50/30" : ""
                }`}
              >
                {/* Rank Badge */}
                <div className="flex items-center justify-center w-8 sm:w-10 text-center shrink-0">
                  {rank === 1 ? (
                    <Crown className="w-7 h-7 text-secondary fill-secondary" />
                  ) : (
                    <span
                      className={`font-sans font-extrabold text-base sm:text-lg ${
                        isTop3 ? "text-secondary" : "text-text-secondary"
                      }`}
                    >
                      {rank}
                    </span>
                  )}
                </div>

                {/* 2:3 Cover Thumbnail */}
                <Link
                  href={`/novel/${novel.slug}`}
                  className="w-14 sm:w-16 aspect-[2/3] rounded-lg overflow-hidden bg-gray-100 border border-border-subtle shrink-0 block"
                >
                  {novel.cover_url ? (
                    <img
                      src={novel.cover_url}
                      alt={novel.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-indigo-50 text-indigo-400">
                      <BookOpen className="w-5 h-5" />
                    </div>
                  )}
                </Link>

                {/* Novel Info */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-primary">
                      {primaryGenre}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        novel.status === "ongoing"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {novel.status === "ongoing" ? "Ongoing" : "Tamat"}
                    </span>
                  </div>

                  <Link
                    href={`/novel/${novel.slug}`}
                    className="font-sans font-bold text-sm sm:text-base text-text-primary hover:text-primary transition-colors line-clamp-1 block"
                  >
                    {novel.title}
                  </Link>

                  <p className="text-xs text-text-secondary truncate">
                    Oleh: {novel.author ? novel.author.display_name : "Penulis"}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-text-secondary pt-0.5">
                    <span className="flex items-center gap-1 text-secondary font-semibold">
                      <Star className="w-3.5 h-3.5 fill-secondary" />
                      {Number(novel.rating_avg).toFixed(1)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" />
                      {novel.total_views.toLocaleString("id-ID")}
                    </span>
                    <span className="hidden sm:inline">
                      {novel.total_chapters} Chapter
                    </span>
                  </div>
                </div>

                {/* Read Action CTA */}
                <div className="shrink-0">
                  <Link
                    href={`/novel/${novel.slug}`}
                    className="px-4 py-2 rounded-xl bg-primary/10 hover:bg-primary hover:text-white text-primary text-xs font-bold transition-all"
                  >
                    Baca
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
