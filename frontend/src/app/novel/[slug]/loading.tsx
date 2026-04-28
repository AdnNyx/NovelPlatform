// src/app/novel/[slug]/loading.tsx
export default function Loading() {
  return (
    <div className="animate-pulse flex flex-col min-h-screen animate-fade-in">
      {/* Hero Section Skeleton (Dark) */}
      <div className="w-full bg-slate-900 py-12 md:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row gap-8 items-center md:items-start">
          <div className="shrink-0 w-48 sm:w-64 aspect-2/3 bg-slate-800 rounded-xl shadow-2xl"></div>
          <div className="flex flex-col items-center md:items-start w-full md:w-1/2 gap-4 mt-4 md:mt-0">
            <div className="h-10 bg-slate-800 rounded w-3/4"></div>
            <div className="flex gap-2">
              <div className="h-6 bg-slate-800 rounded-full w-20"></div>
              <div className="h-6 bg-slate-800 rounded-full w-24"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section Skeleton (Light) */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col md:flex-row gap-12 w-full">
        {/* Sinopsis Skeleton */}
        <div className="md:w-2/3 flex flex-col gap-4">
          <div className="h-8 bg-slate-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-slate-200 rounded w-full"></div>
          <div className="h-4 bg-slate-200 rounded w-full"></div>
          <div className="h-4 bg-slate-200 rounded w-5/6"></div>
          <div className="h-4 bg-slate-200 rounded w-full"></div>
        </div>
        {/* Chapter List Skeleton */}
        <div className="md:w-1/3 flex flex-col gap-3">
          <div className="h-8 bg-slate-200 rounded w-1/2 mb-4"></div>
          <div className="h-16 bg-white border border-slate-200 rounded-lg w-full"></div>
          <div className="h-16 bg-white border border-slate-200 rounded-lg w-full"></div>
          <div className="h-16 bg-white border border-slate-200 rounded-lg w-full"></div>
        </div>
      </div>
    </div>
  );
}
