"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Lock, User, AlertCircle, KeyRound, CheckCircle, X } from "lucide-react";
import { apiClient } from "@/lib/api-client";

export default function StaffLoginPage() {
  const router = useRouter();

  const [identifier, setIdentifier] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState<boolean>(false);
  const [forgotEmail, setForgotEmail] = useState<string>("");
  const [forgotOtp, setForgotOtp] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [forgotStep, setForgotStep] = useState<"email" | "reset">("email");
  const [forgotLoading, setForgotLoading] = useState<boolean>(false);
  const [forgotMessage, setForgotMessage] = useState<string>("");
  const [forgotError, setForgotError] = useState<string>("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!identifier.trim() || !password) return;

    setLoading(true);
    setErrorMessage("");

    try {
      const res = await apiClient<{
        status: string;
        data: { message: string; email: string; expires_in_seconds: number };
      }>("/api/auth/staff/login", {
        method: "POST",
        body: JSON.stringify({
          identifier: identifier.trim(),
          password,
        }),
      });

      if (res.data) {
        // Store identifier temporarily in sessionStorage for Step 2
        sessionStorage.setItem("staff_identifier", identifier.trim());
        router.push("/staff/verify-otp");
      }
    } catch (err: any) {
      setErrorMessage(err.detail || "Kredensial staff tidak valid.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSendForgotOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!forgotEmail.trim()) return;

    setForgotLoading(true);
    setForgotError("");
    try {
      await apiClient("/api/auth/staff/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: forgotEmail.trim() }),
      });
      setForgotMessage("Kode OTP telah dikirimkan jika email terdaftar.");
      setForgotStep("reset");
    } catch (err: any) {
      setForgotError(err.detail || "Gagal mengirimkan kode OTP.");
    } finally {
      setForgotLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!forgotOtp.trim() || !newPassword) return;

    setForgotLoading(true);
    setForgotError("");
    try {
      await apiClient("/api/auth/staff/reset-password", {
        method: "POST",
        body: JSON.stringify({
          email: forgotEmail.trim(),
          otp_code: forgotOtp.trim(),
          new_password: newPassword,
        }),
      });
      setForgotMessage("Kata sandi berhasil direset! Silakan masuk dengan kata sandi baru.");
      setTimeout(() => {
        setShowForgotModal(false);
        setForgotStep("email");
      }, 1500);
    } catch (err: any) {
      setForgotError(err.detail || "Gagal mereset kata sandi.");
    } finally {
      setForgotLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md p-8 sm:p-10 rounded-3xl bg-slate-800/90 border border-slate-700 shadow-2xl space-y-6">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center mx-auto shadow-lg shadow-primary/25">
          <ShieldCheck className="w-7 h-7" />
        </div>
        <h1 className="font-sans font-extrabold text-2xl text-white tracking-tight">
          Portal Internal Staff
        </h1>
        <p className="text-xs text-slate-400">
          Akses khusus untuk Novelis dan Administrator sistem
        </p>
      </div>

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-red-950/50 border border-red-800 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleLogin} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Username atau Email
          </label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="novelis_pro atau staff@domain.com"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Kata Sandi
            </label>
            <button
              type="button"
              onClick={() => {
                setShowForgotModal(true);
                setForgotMessage("");
                setForgotError("");
              }}
              className="text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Lupa Password?
            </button>
          </div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !identifier.trim() || !password}
          className="w-full py-3 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-xs shadow-md shadow-primary/20 transition-all disabled:opacity-50 mt-2"
        >
          {loading ? "Memverifikasi..." : "Lanjut ke Verifikasi OTP"}
        </button>
      </form>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm p-6 rounded-2xl bg-slate-800 border border-slate-700 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-primary" />
                Reset Kata Sandi Staff
              </h3>
              <button
                onClick={() => setShowForgotModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {forgotMessage && (
              <div className="p-3 rounded-xl bg-emerald-950/50 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{forgotMessage}</span>
              </div>
            )}
            {forgotError && (
              <div className="p-3 rounded-xl bg-red-950/50 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{forgotError}</span>
              </div>
            )}

            {forgotStep === "email" ? (
              <form onSubmit={handleSendForgotOtp} className="space-y-3">
                <p className="text-xs text-slate-300">
                  Masukkan email akun staff Anda untuk menerima kode OTP reset password.
                </p>
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="staff@domain.com"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  type="submit"
                  disabled={forgotLoading || !forgotEmail.trim()}
                  className="w-full py-2.5 rounded-xl bg-primary text-white font-bold text-xs"
                >
                  {forgotLoading ? "Mengirim..." : "Kirim Kode OTP"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-3">
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={forgotOtp}
                  onChange={(e) => setForgotOtp(e.target.value)}
                  placeholder="6 digit kode OTP"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs text-center font-mono tracking-widest text-lg"
                />
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Kata sandi baru (min 8 karakter)"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
                />
                <button
                  type="submit"
                  disabled={forgotLoading || !forgotOtp.trim() || !newPassword}
                  className="w-full py-2.5 rounded-xl bg-primary text-white font-bold text-xs"
                >
                  {forgotLoading ? "Mereset..." : "Simpan Kata Sandi Baru"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
