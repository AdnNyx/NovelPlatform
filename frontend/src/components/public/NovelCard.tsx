import React from "react";
import Link from "next/link";
import { Star, BookOpen } from "lucide-react";
import { Novel } from "@/types";

interface NovelCardProps {
  novel: Novel;
}

export function NovelCard({ novel }: NovelCardProps) {
  const primaryGenre = novel.genres && novel.genres.length > 0 ? novel.genres[0] : "Umum";
  const rating = Number(novel.rating_avg) || 0;
  const isOngoing = novel.status === "ongoing";

  return (
    <Link
      href={`/novel/${novel.slug}`}
      className="group block flex flex-col focus:outline-none focus:ring-2 focus:ring-primary rounded-xl"
    >
      {/* 1. Cover Image (Strict 2:3 aspect ratio per DESIGN.md) */}
      <div className="relative w-full aspect-[2/3] rounded-xl overflow-hidden bg-gray-100 shadow-sm border border-border-subtle group-hover:shadow-md transition-shadow">
        {novel.cover_url ? (
          <img
            src={novel.cover_url}
            alt={novel.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-indigo-50/50 text-indigo-400 p-4 text-center">
            <BookOpen className="w-10 h-10 mb-2 opacity-60" />
            <span className="text-xs font-medium text-gray-500 line-clamp-2">{novel.title}</span>
          </div>
        )}

        {/* 4. Status Badge */}
        <div className="absolute top-2.5 right-2.5">
          <span
            className={`px-2 py-0.5 text-xs font-semibold rounded-full shadow-sm backdrop-blur-md ${
              isOngoing
                ? "bg-badge-ongoing-bg/95 text-badge-ongoing-text border border-emerald-200/50"
                : "bg-badge-tamat-bg/95 text-badge-tamat-text border border-amber-200/50"
            }`}
          >
            {isOngoing ? "Ongoing" : "Tamat"}
          </span>
        </div>
      </div>

      {/* Card Details: 4 Data Points Only per DESIGN.md */}
      <div className="pt-2.5 flex flex-col flex-1 justify-between">
        {/* 2. Title (Clamped to 2 lines) */}
        <h3 className="font-sans font-bold text-sm text-text-primary group-hover:text-primary transition-colors line-clamp-2 leading-snug">
          {novel.title}
        </h3>

        {/* 3. Primary Genre + Star Rating Score */}
        <div className="mt-1.5 flex items-center justify-between text-xs text-text-secondary">
          <span className="font-medium truncate max-w-[100px] text-gray-500">
            {primaryGenre}
          </span>
          <div className="flex items-center gap-1 text-secondary font-semibold shrink-0">
            <Star className="w-3.5 h-3.5 fill-secondary text-secondary" />
            <span>{rating.toFixed(1)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
