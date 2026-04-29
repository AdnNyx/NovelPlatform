"use client";

import { ReactLenis } from "lenis/react";
import { ReactNode } from "react";

export default function SmoothScrollProvider({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ReactLenis
      root
      options={{
        lerp: 0.1, // Tingkat kelembutan (0-1). 0.1 cukup smooth tanpa terasa lambat
        duration: 1.2, // Durasi efek scroll (detik)
        smoothWheel: true, // Aktifkan untuk mouse di PC/Laptop
        syncTouch: false, // PENTING: Biarkan false agar sentuhan di layar sentuh tetap native
        touchMultiplier: 2, // Kecepatan native scroll di layar sentuh
      }}
    >
      {children}
    </ReactLenis>
  );
}
