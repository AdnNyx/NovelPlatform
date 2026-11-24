"use client";

import React, { useEffect, useState } from "react";
import { Search, Filter, SlidersHorizontal, ChevronLeft, ChevronRight } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { Novel, GenreItem, PaginatedResponse } from "@/types";
import { NovelCard } from "@/components/public/NovelCard";
import { NovelCardSkeleton } from "@/components/public/NovelCardSkeleton";

export default function CatalogPage() {
  const [novels, setNovels] = useState<Novel[]>([]);
  const [genres, setGenres] = useState<GenreItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters state
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedGenre, setSelectedGenre] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedSort, setSelectedSort] = useState<string>("popular");
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalNovels, setTotalNovels] = useState<number>(0);

  // Load master genres on mount
  useEffect(() => {
    async function loadGenres() {
      try {
        const res = await apiClient<{ status: string; data: GenreItem[] }>("/api/genres");
        setGenres(res.data || []);
      } catch (err) {
        console.error(err);
      }
    }
    loadGenres();
  }, []);

  // Fetch novels with current filters
  useEffect(() => {
    let isMounted = true;
    async function loadNovels() {
      setLoading(true);
      try {
        const res = await apiClient<PaginatedResponse<Novel>>("/api/novels", {
          params: {
            q: searchQuery || undefined,
            genre: selectedGenre || undefined,
            status: selectedStatus || undefined,
            sort: selectedSort,
            page,
            limit: 18,
          },
        });
        if (isMounted) {
          setNovels(res.data || []);
          if (res.meta) {
            setTotalPages(Math.max(1, Math.ceil(res.meta.total / res.meta.limit)));
            setTotalNovels(res.meta.total);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    const timer = setTimeout(() => {
      loadNovels();
    }, 250);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [searchQuery, selectedGenre, selectedStatus, selectedSort, page]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header & Search Bar */}
      <div className="space-y-4">
        <div>
          <h1 className="font-sans font-extrabold text-2xl sm:text-3xl text-text-primary tracking-tight">
            Katalog Novel
          </h1>
          <p className="text-sm text-text-secondary">
            Temukan cerita favoritmu dari ribuan koleksi novel gratis
          </p>
        </div>

        {/* Search Input */}
        <div className="relative max-w-xl">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Cari judul novel, penulis, atau tag..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border-subtle bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
          />
        </div>
      </div>

      {/* Filter & Sort Bar */}
      <div className="p-4 rounded-2xl bg-white border border-border-subtle shadow-sm space-y-4">
        {/* Status & Sort Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-surface-light rounded-xl border border-border-subtle">
            {[
              { label: "Semua Status", value: "" },
              { label: "Ongoing", value: "ongoing" },
              { label: "Tamat", value: "tamat" },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => {
                  setSelectedStatus(tab.value);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedStatus === tab.value
                    ? "bg-white text-primary shadow-sm"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-text-secondary" />
            <select
              value={selectedSort}
              onChange={(e) => {
                setSelectedSort(e.target.value);
                setPage(1);
              }}
              className="text-xs font-semibold text-text-primary bg-surface-light border border-border-subtle rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="popular">Terpopuler</option>
              <option value="latest">Terbaru</option>
              <option value="rating">Rating Tertinggi</option>
            </select>
          </div>
        </div>

        {/* Genres Pill Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => {
              setSelectedGenre("");
              setPage(1);
            }}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedGenre === ""
                ? "bg-primary text-white shadow-sm"
                : "bg-surface-light text-text-secondary hover:bg-gray-200 border border-border-subtle"
            }`}
          >
            Semua Genre
          </button>
          {genres.map((g) => (
            <button
              key={g.id}
              onClick={() => {
                setSelectedGenre(g.name);
                setPage(1);
              }}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedGenre === g.name
                  ? "bg-primary text-white shadow-sm"
                  : "bg-surface-light text-text-secondary hover:bg-gray-200 border border-border-subtle"
              }`}
            >
              {g.name}
            </button>
          ))}
        </div>
      </div>

      {/* Novel Results Grid */}
      <div>
        <div className="mb-4 flex items-center justify-between text-xs text-text-secondary font-medium">
          <span>Menampilkan {totalNovels} novel</span>
          <span>Halaman {page} dari {totalPages}</span>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <NovelCardSkeleton key={i} />
            ))}
          </div>
        ) : novels.length === 0 ? (
          <div className="p-16 text-center rounded-2xl bg-white border border-border-subtle">
            <p className="text-text-primary font-bold text-base">Tidak ada novel yang ditemukan</p>
            <p className="text-xs text-text-secondary mt-1">
              Coba sesuaikan kata kunci pencarian atau filter genre Anda.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
            {novels.map((novel) => (
              <NovelCard key={novel.id} novel={novel} />
            ))}
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-8">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 rounded-xl border border-border-subtle bg-white text-text-secondary hover:text-text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-bold px-3 py-1.5 rounded-lg bg-surface-light text-text-primary">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-2 rounded-xl border border-border-subtle bg-white text-text-secondary hover:text-text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
