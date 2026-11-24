"use client";

import React, { useEffect, useState } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { BookOpen, ShieldCheck, AlertCircle } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { User } from "@/types";

declare global {
  interface Window {
    google?: any;
  }
}

export default function LoginPage() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

  // Callback from Google Identity Services
  async function handleGoogleCredentialResponse(response: any) {
    if (!response || !response.credential) {
      setErrorMessage("Gagal menerima ID token dari Google.");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const res = await apiClient<{ status: string; data: User }>("/api/auth/google", {
        method: "POST",
        body: JSON.stringify({ id_token: response.credential }),
      });

      if (res.data) {
        router.push("/profil");
        router.refresh();
      }
    } catch (err: any) {
      setErrorMessage(err.detail || "Terjadi kesalahan saat masuk dengan Google.");
    } finally {
      setLoading(false);
    }
  }

  // Initialize Google One Tap / Button when script loads
  function initializeGoogleSignIn() {
    if (typeof window !== "undefined" && window.google && googleClientId) {
      try {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleGoogleCredentialResponse,
        });

        const btnDiv = document.getElementById("google-signin-btn");
        if (btnDiv) {
          window.google.accounts.id.renderButton(btnDiv, {
            theme: "outline",
            size: "large",
            width: "320",
            text: "signin_with",
            shape: "rectangular",
            logo_alignment: "left",
          });
        }
      } catch (e) {
        console.error("Google Init Error:", e);
      }
    }
  }

  useEffect(() => {
    initializeGoogleSignIn();
  }, [googleClientId]);

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={initializeGoogleSignIn}
      />

      <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md p-8 sm:p-10 rounded-3xl bg-white border border-border-subtle shadow-xl space-y-8 text-center">
          {/* Brand Icon */}
          <div className="w-16 h-16 rounded-2xl bg-primary text-white flex items-center justify-center mx-auto shadow-lg shadow-primary/25">
            <BookOpen className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h1 className="font-sans font-extrabold text-2xl text-text-primary tracking-tight">
              Masuk ke NovelPublik
            </h1>
            <p className="text-xs text-text-secondary leading-relaxed max-w-xs mx-auto">
              Simpan novel favoritmu, tandai bab terakhir dibaca, dan ikuti rilis bab baru dengan satu klik.
            </p>
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 text-left">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Google Button Container */}
          <div className="flex flex-col items-center justify-center space-y-4 pt-2">
            <div id="google-signin-btn" className="min-h-[44px]"></div>

            {loading && (
              <p className="text-xs text-primary font-semibold animate-pulse">
                Menghubungkan akun Google Anda...
              </p>
            )}

            {!googleClientId && (
              <p className="text-[11px] text-amber-600 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                Peringatan: NEXT_PUBLIC_GOOGLE_CLIENT_ID belum diisi di konfigurasi environment frontend.
              </p>
            )}
          </div>

          {/* Dual-Track Auth Notice */}
          <div className="pt-6 border-t border-border-subtle flex items-center justify-center gap-2 text-[11px] text-text-secondary">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Membaca publik gratis tanpa login. Autentikasi hanya untuk personalisasi pembaca.</span>
          </div>
        </div>
      </div>
    </>
  );
}
