// src/components/ui/SupportCard.tsx
export default function SupportCard() {
  return (
    <div className="bg-white border border-indigo-100 rounded-2xl p-6 shadow-sm overflow-hidden relative group">
      {/* Dekorasi Background */}
      <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-50 rounded-full group-hover:scale-110 transition-transform duration-500"></div>

      <div className="relative z-10 flex flex-col items-center text-center">
        <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white mb-4 shadow-indigo-200 shadow-lg">
          <svg
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        </div>

        <h3 className="text-lg font-bold text-slate-900 mb-2">
          Dukung Website Ini
        </h3>
        <p className="text-sm text-slate-500 mb-6 max-w-62.5">
          Suka dengan platform ini? Bantu kami tetap aktif dengan memberikan
          dukungan kecil.
        </p>

        <a
          href="https://saweria.co/username-anda"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-3 bg-indigo-600 text-white rounded-full font-bold text-sm hover:bg-indigo-700 hover:shadow-lg transition-all active:scale-95"
        >
          Beli Kopi via Saweria
        </a>

        <p className="mt-4 text-[10px] text-slate-400 uppercase tracking-widest font-black">
          Terima kasih atas dukungannya!
        </p>
      </div>
    </div>
  );
}
