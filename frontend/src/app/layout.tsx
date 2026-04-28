import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Platform Light Novel",
  description: "Baca light novel favoritmu dengan ilustrasi memukau.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body
        className={`${inter.className} bg-gray-50 text-gray-900 min-h-screen flex flex-col`}
      >
        {/* Navbar */}
        <Navbar />

        {/* Main Content */}
        <main className="grow animate-fade-in">{children}</main>

        {/* Footer */}
      </body>
    </html>
  );
}
