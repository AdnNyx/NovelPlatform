"use client";

import React, { useState, useRef } from "react";
import { FileUp, Loader2, CheckCircle, AlertCircle, BookOpen, ArrowRight } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { ExtractedChapter } from "@/types";

interface PdfUploadPanelProps {
  onLoadChapter: (title: string, html: string) => void;
}

export function PdfUploadPanel({ onLoadChapter }: PdfUploadPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<string | null>(null);
  const [extractedChapters, setExtractedChapters] = useState<ExtractedChapter[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>("");

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      setErrorMessage("Format file harus berupa dokumen PDF.");
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setErrorMessage("Ukuran file PDF maksimal 25 MB.");
      return;
    }

    setSelectedFile(file);
    setErrorMessage("");
  }

  async function handleStartConversion() {
    if (!selectedFile) return;

    setJobStatus("uploading");
    setErrorMessage("");
    setExtractedChapters([]);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const uploadRes = await apiClient<{
        status: string;
        data: { job_id: string; job_status: string };
      }>("/api/chapters/upload-pdf", {
        method: "POST",
        body: formData,
      });

      const newJobId = uploadRes.data.job_id;
      setJobId(newJobId);
      setJobStatus("processing");

      // Begin polling every 2 seconds
      pollJobStatus(newJobId);
    } catch (err: any) {
      setJobStatus(null);
      setErrorMessage(err.detail || "Gagal mengunggah file PDF.");
    }
  }

  function pollJobStatus(targetJobId: string) {
    const pollInterval = setInterval(async () => {
      try {
        const pollRes = await apiClient<{
          status: string;
          data: {
            job_id: string;
            job_status: string;
            chapters?: ExtractedChapter[];
            error?: string;
          };
        }>(`/api/chapters/pdf-jobs/${targetJobId}`);

        const data = pollRes.data;
        if (data.job_status === "completed") {
          clearInterval(pollInterval);
          setJobStatus("completed");
          setExtractedChapters(data.chapters || []);
        } else if (data.job_status === "failed") {
          clearInterval(pollInterval);
          setJobStatus("failed");
          setErrorMessage(data.error || "Gagal mengonversi file PDF.");
        }
      } catch (err: any) {
        clearInterval(pollInterval);
        setJobStatus("failed");
        setErrorMessage(err.detail || "Gagal memeriksa status konversi PDF.");
      }
    }, 2000);
  }

  return (
    <div className="p-6 rounded-2xl bg-white border border-border-subtle space-y-6 shadow-sm">
      <div className="space-y-1">
        <h3 className="font-sans font-bold text-base text-text-primary flex items-center gap-2">
          <FileUp className="w-5 h-5 text-primary" />
          Konversi Bab Otomatis dari Dokumen PDF
        </h3>
        <p className="text-xs text-text-secondary">
          Unggah naskah PDF bab novel Anda. Sistem akan mengekstrak teks, judul heading, dan gambar ilustrasi ke format HTML TipTap.
        </p>
      </div>

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Upload Drop Zone */}
      {!jobStatus && (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 hover:border-primary rounded-2xl p-8 text-center cursor-pointer transition-colors bg-surface-light group"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            onChange={handleFileSelect}
            className="hidden"
          />
          <FileUp className="w-10 h-10 text-gray-400 group-hover:text-primary mx-auto mb-2 transition-colors" />
          {selectedFile ? (
            <div>
              <p className="text-xs font-bold text-text-primary">{selectedFile.name}</p>
              <p className="text-[11px] text-text-secondary mt-0.5">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Klik untuk mengganti
              </p>
            </div>
          ) : (
            <div>
              <p className="text-xs font-semibold text-text-primary">
                Pilih atau seret dokumen PDF bab ke sini
              </p>
              <p className="text-[11px] text-text-secondary mt-1">Maksimal 25 MB</p>
            </div>
          )}
        </div>
      )}

      {selectedFile && !jobStatus && (
        <button
          onClick={handleStartConversion}
          className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-xs shadow-sm transition-all"
        >
          Mulai Ekstraksi PDF ke Editor
        </button>
      )}

      {/* Processing State */}
      {(jobStatus === "uploading" || jobStatus === "processing") && (
        <div className="p-8 rounded-2xl bg-indigo-50/50 border border-indigo-100 text-center space-y-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
          <div>
            <p className="text-xs font-bold text-primary">
              {jobStatus === "uploading"
                ? "Mengunggah dokumen PDF..."
                : "Mengekstrak teks & gambar ilustrasi via PyMuPDF..."}
            </p>
            <p className="text-[11px] text-text-secondary mt-0.5">
              Proses konversi berjalan di background. Mohon tunggu beberapa saat.
            </p>
          </div>
        </div>
      )}

      {/* Completed State: Chapters Selection */}
      {jobStatus === "completed" && (
        <div className="space-y-4">
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 text-xs flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-semibold">
              <CheckCircle className="w-4 h-4" />
              Ekstraksi selesai! Ditemukan {extractedChapters.length} bab.
            </span>
            <button
              onClick={() => {
                setJobStatus(null);
                setSelectedFile(null);
              }}
              className="text-[11px] underline hover:text-emerald-900"
            >
              Unggah PDF lain
            </button>
          </div>

          <div className="space-y-2">
            {extractedChapters.map((ch, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-border-subtle bg-surface-light flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <span className="text-xs font-bold text-text-primary block truncate">
                    {ch.suggested_title}
                  </span>
                  <span className="text-[11px] text-text-secondary block">
                    Panjang naskah: ~{ch.content_html.length} karakter
                  </span>
                </div>
                <button
                  onClick={() => onLoadChapter(ch.suggested_title, ch.content_html)}
                  className="px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-bold shrink-0 flex items-center gap-1 transition-all"
                >
                  Muat ke Editor
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
