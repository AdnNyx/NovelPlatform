import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Lora, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-reader-serif",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Web Baca Novel Publik — Baca Novel Online Gratis",
  description: "Platform baca web novel online publik modern, gratis tanpa login, dengan koleksi novel terlengkap dan terpopuler.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      className={`${plusJakartaSans.variable} ${lora.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-screen antialiased bg-surface-light text-text-primary">
        {/* Note: Root layout is strictly free of Lenis and GSAP per architecture */}
        {children}
      </body>
    </html>
  );
}
