import Image from "next/image";
import Link from "next/link";

export interface Genre {
  id: number;
  name: string;
  slug: string;
}

export interface Novel {
  id: string;
  title: string;
  slug: string;
  author: string;
  cover_image_url: string | null;
  status: string;
  genres: Genre[];
}

export default function NovelCard({ novel }: { novel: Novel }) {
  return (
    <Link
      href={`/novel/${novel.slug}`}
      className="group flex flex-col bg-slate-800 overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
    >
      <div className="relative aspect-2/3 w-full overflow-hidden bg-gray-200 border-b-2 border-slate-700">
        {novel.cover_image_url ? (
          <Image
            src={novel.cover_image_url}
            alt={`Cover ${novel.title}`}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
            className="object-cover group-hover:scale-110 transition-transform duration-500"
            unoptimized
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full text-gray-500 text-xs font-medium">
            Tanpa Cover
          </div>
        )}
      </div>

      <div className="p-2 sm:p-3 flex grow items-center justify-center">
        <h3 className="font-bold text-white text-[11px] sm:text-xs md:text-sm text-center leading-snug line-clamp-2">
          {novel.title}
        </h3>
      </div>
    </Link>
  );
}
