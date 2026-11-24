"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, AlertCircle, ArrowLeft, RefreshCw } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { User } from "@/types";

export default function StaffVerifyOtpPage() {
  const router = useRouter();

  const [identifier, setIdentifier] = useState<string>("");
  const [otpCode, setOtpCode] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  // 60-second resend cooldown timer
  const [cooldown, setCooldown] = useState<number>(60);
  const [resending, setResending] = useState<boolean>(false);

  useEffect(() => {
    const saved = sessionStorage.getItem("staff_identifier");
    if (!saved) {
      router.push("/staff/login");
    } else {
      setIdentifier(saved);
    }
  }, [router]);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setInterval(() => setCooldown((c) => c - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [cooldown]);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!otpCode.trim() || otpCode.length !== 6) return;

    setLoading(true);
    setErrorMessage("");

    try {
      const res = await apiClient<{
        status: string;
        data: { user: User; redirect_url: string };
      }>("/api/auth/staff/verify-otp", {
        method: "POST",
        body: JSON.stringify({
          identifier,
          otp_code: otpCode.trim(),
        }),
      });

      if (res.data) {
        sessionStorage.removeItem("staff_identifier");
        router.push(res.data.redirect_url);
        router.refresh();
      }
    } catch (err: any) {
      setErrorMessage(err.detail || "Kode OTP tidak valid atau telah kedaluwarsa.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md p-8 sm:p-10 rounded-3xl bg-slate-800/90 border border-slate-700 shadow-2xl space-y-6">
      <div className="text-center space-y-2">
        <div className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center mx-auto shadow-lg shadow-primary/25">
          <KeyRound className="w-7 h-7" />
        </div>
        <h1 className="font-sans font-extrabold text-2xl text-white tracking-tight">
          Verifikasi OTP 6-Digit
        </h1>
        <p className="text-xs text-slate-400">
          Masukkan 6-digit kode OTP yang telah dikirimkan ke email terdaftar Anda
        </p>
      </div>

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-red-950/50 border border-red-800 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleVerify} className="space-y-5">
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block text-center">
            Kode Verifikasi
          </label>
          <input
            type="text"
            required
            maxLength={6}
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
            placeholder="000000"
            className="w-full py-3 px-4 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-center text-3xl font-extrabold tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-primary shadow-inner"
            autoFocus
          />
        </div>

        <button
          type="submit"
          disabled={loading || otpCode.length !== 6}
          className="w-full py-3 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-xs shadow-md shadow-primary/20 transition-all disabled:opacity-50"
        >
          {loading ? "Memvalidasi OTP..." : "Masuk ke Dashboard"}
        </button>
      </form>

      <div className="flex items-center justify-between pt-2 border-t border-slate-700 text-xs text-slate-400">
        <button
          onClick={() => router.push("/staff/login")}
          className="hover:text-white flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Ganti Akun
        </button>

        <span className="text-[11px]">
          {cooldown > 0 ? (
            `Kirim ulang dlm ${cooldown}s`
          ) : (
            <button
              onClick={() => {
                setCooldown(60);
                router.push("/staff/login");
              }}
              className="text-indigo-400 hover:text-indigo-300 font-semibold"
            >
              Minta OTP Baru
            </button>
          )}
        </span>
      </div>
    </div>
  );
}
