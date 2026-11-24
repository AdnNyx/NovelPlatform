import React from "react";

export function NovelCardSkeleton() {
  return (
    <div className="flex flex-col animate-pulse">
      {/* 2:3 Cover Skeleton */}
      <div className="w-full aspect-[2/3] rounded-xl bg-gray-200 border border-border-subtle" />
      {/* Title Skeleton */}
      <div className="mt-2.5 h-4 bg-gray-200 rounded w-5/6" />
      <div className="mt-1 h-3.5 bg-gray-200 rounded w-2/3" />
      {/* Genre & Rating Skeleton */}
      <div className="mt-2 flex justify-between items-center">
        <div className="h-3 bg-gray-200 rounded w-1/3" />
        <div className="h-3 bg-gray-200 rounded w-1/4" />
      </div>
    </div>
  );
}
