"use client";

import React, { useState, useRef, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Quote,
  Minus,
  Undo,
  Redo,
  ImageIcon,
  Link2,
  Eye,
  Save,
  Send,
  Calendar,
} from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { ChapterPreviewModal } from "./ChapterPreviewModal";

interface TipTapEditorProps {
  initialTitle?: string;
  initialChapterNumber?: number;
  initialContentHtml?: string;
  isSaving?: boolean;
  onSaveChapter: (data: {
    title: string;
    chapter_number: number;
    content_html: string;
    is_draft: boolean;
    is_published: boolean;
    published_at: string | null;
  }) => Promise<void>;
}

export function TipTapEditor({
  initialTitle = "",
  initialChapterNumber = 1,
  initialContentHtml = "<p>Mulai menulis bab novel Anda di sini...</p>",
  isSaving = false,
  onSaveChapter,
}: TipTapEditorProps) {
  const [title, setTitle] = useState<string>(initialTitle);
  const [chapterNumber, setChapterNumber] = useState<number>(initialChapterNumber);
  const [showScheduleInput, setShowScheduleInput] = useState<boolean>(false);
  const [scheduledAt, setScheduledAt] = useState<string>("");
  const [previewOpen, setPreviewOpen] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState<boolean>(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Image.configure({
        allowBase64: false,
        inline: false,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          rel: "noopener noreferrer",
          target: "_blank",
        },
      }),
    ],
    content: initialContentHtml,
    editorProps: {
      attributes: {
        class:
          "prose prose-lg max-w-none font-reader-serif min-h-[480px] p-6 sm:p-10 focus:outline-none focus:ring-0 leading-relaxed text-gray-900",
      },
    },
  });

  // Sync external changes (e.g. from PDF panel)
  useEffect(() => {
    if (initialTitle) setTitle(initialTitle);
  }, [initialTitle]);

  useEffect(() => {
    if (initialChapterNumber) setChapterNumber(initialChapterNumber);
  }, [initialChapterNumber]);

  useEffect(() => {
    if (editor && initialContentHtml && editor.getHTML() !== initialContentHtml) {
      editor.commands.setContent(initialContentHtml);
    }
  }, [initialContentHtml, editor]);

  if (!editor) return null;

  // Inline Image Upload Handler (uploads to chapter-images bucket)
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Ukuran gambar maksimal 5 MB.");
      return;
    }

    setUploadingImage(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await apiClient<{ status: string; data: { url: string } }>(
        "/api/chapters/upload-image",
        {
          method: "POST",
          body: formData,
        }
      );
      if (res.data?.url) {
        editor?.chain().focus().setImage({ src: res.data.url, alt: "Ilustrasi Bab" }).run();
      }
    } catch (err: any) {
      alert(err.detail || "Gagal mengunggah gambar.");
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleSetLink() {
    const previousUrl = editor?.getAttributes("link").href;
    const url = window.prompt("Masukkan URL tautan:", previousUrl);

    if (url === null) return;
    if (url === "") {
      editor?.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor?.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  // Action handlers
  async function handleSaveDraft() {
    if (!title.trim()) {
      alert("Judul bab tidak boleh kosong.");
      return;
    }
    await onSaveChapter({
      title: title.trim(),
      chapter_number: chapterNumber,
      content_html: editor?.getHTML() || "",
      is_draft: true,
      is_published: false,
      published_at: null,
    });
  }

  async function handlePublishImmediately() {
    if (!title.trim()) {
      alert("Judul bab tidak boleh kosong.");
      return;
    }
    await onSaveChapter({
      title: title.trim(),
      chapter_number: chapterNumber,
      content_html: editor?.getHTML() || "",
      is_draft: false,
      is_published: true,
      published_at: new Date().toISOString(),
    });
  }

  async function handleSchedulePublish() {
    if (!title.trim() || !scheduledAt) {
      alert("Pilih tanggal & jam publikasi terlebih dahulu.");
      return;
    }
    await onSaveChapter({
      title: title.trim(),
      chapter_number: chapterNumber,
      content_html: editor?.getHTML() || "",
      is_draft: false,
      is_published: true,
      published_at: new Date(scheduledAt).toISOString(),
    });
  }

  return (
    <div className="bg-white rounded-3xl border border-border-subtle shadow-sm overflow-hidden flex flex-col">
      {/* Chapter Title & Number Inputs */}
      <div className="p-6 border-b border-border-subtle bg-surface-light flex flex-col sm:flex-row items-center gap-4">
        <div className="w-full sm:w-28 shrink-0">
          <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary block mb-1">
            Nomor Bab
          </label>
          <input
            type="number"
            min={1}
            value={chapterNumber}
            onChange={(e) => setChapterNumber(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-full px-3 py-2 rounded-xl border border-border-subtle bg-white text-xs font-bold text-center focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="flex-1 w-full">
          <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary block mb-1">
            Judul Bab
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Contoh: Awal Petualangan Baru"
            className="w-full px-3.5 py-2 rounded-xl border border-border-subtle bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Sticky MS Word-Style Formatting Toolbar per DESIGN.md Section 4 */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md px-4 py-2 border-b border-border-subtle flex flex-wrap items-center gap-1">
        {/* Undo / Redo */}
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="p-1.5 rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-30"
          title="Urungkan (Ctrl+Z)"
        >
          <Undo className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="p-1.5 rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-30"
          title="Ulangi (Ctrl+Y)"
        >
          <Redo className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-gray-200 mx-1" />

        {/* Text Formats */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded-lg ${
            editor.isActive("bold") ? "bg-primary text-white" : "text-gray-600 hover:bg-gray-100"
          }`}
          title="Tebal (Ctrl+B)"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded-lg ${
            editor.isActive("italic") ? "bg-primary text-white" : "text-gray-600 hover:bg-gray-100"
          }`}
          title="Miring (Ctrl+I)"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-1.5 rounded-lg ${
            editor.isActive("underline") ? "bg-primary text-white" : "text-gray-600 hover:bg-gray-100"
          }`}
          title="Garis Bawah (Ctrl+U)"
        >
          <UnderlineIcon className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`p-1.5 rounded-lg ${
            editor.isActive("strike") ? "bg-primary text-white" : "text-gray-600 hover:bg-gray-100"
          }`}
          title="Coret"
        >
          <Strikethrough className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-gray-200 mx-1" />

        {/* Headings */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`p-1.5 rounded-lg ${
            editor.isActive("heading", { level: 1 })
              ? "bg-primary text-white"
              : "text-gray-600 hover:bg-gray-100"
          }`}
          title="Heading 1"
        >
          <Heading1 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-1.5 rounded-lg ${
            editor.isActive("heading", { level: 2 })
              ? "bg-primary text-white"
              : "text-gray-600 hover:bg-gray-100"
          }`}
          title="Heading 2"
        >
          <Heading2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`p-1.5 rounded-lg ${
            editor.isActive("heading", { level: 3 })
              ? "bg-primary text-white"
              : "text-gray-600 hover:bg-gray-100"
          }`}
          title="Heading 3"
        >
          <Heading3 className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-gray-200 mx-1" />

        {/* Alignments */}
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          className={`p-1.5 rounded-lg ${
            editor.isActive({ textAlign: "left" })
              ? "bg-primary text-white"
              : "text-gray-600 hover:bg-gray-100"
          }`}
          title="Rata Kiri"
        >
          <AlignLeft className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          className={`p-1.5 rounded-lg ${
            editor.isActive({ textAlign: "center" })
              ? "bg-primary text-white"
              : "text-gray-600 hover:bg-gray-100"
          }`}
          title="Rata Tengah"
        >
          <AlignCenter className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          className={`p-1.5 rounded-lg ${
            editor.isActive({ textAlign: "right" })
              ? "bg-primary text-white"
              : "text-gray-600 hover:bg-gray-100"
          }`}
          title="Rata Kanan"
        >
          <AlignRight className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("justify").run()}
          className={`p-1.5 rounded-lg ${
            editor.isActive({ textAlign: "justify" })
              ? "bg-primary text-white"
              : "text-gray-600 hover:bg-gray-100"
          }`}
          title="Rata Kanan Kiri"
        >
          <AlignJustify className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-gray-200 mx-1" />

        {/* Lists & Quotes */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1.5 rounded-lg ${
            editor.isActive("bulletList")
              ? "bg-primary text-white"
              : "text-gray-600 hover:bg-gray-100"
          }`}
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-1.5 rounded-lg ${
            editor.isActive("orderedList")
              ? "bg-primary text-white"
              : "text-gray-600 hover:bg-gray-100"
          }`}
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-1.5 rounded-lg ${
            editor.isActive("blockquote")
              ? "bg-primary text-white"
              : "text-gray-600 hover:bg-gray-100"
          }`}
          title="Kutipan"
        >
          <Quote className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className="p-1.5 rounded-lg text-gray-600 hover:bg-gray-100"
          title="Garis Pemisah"
        >
          <Minus className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-gray-200 mx-1" />

        {/* Link & Inline Image */}
        <button
          type="button"
          onClick={handleSetLink}
          className={`p-1.5 rounded-lg ${
            editor.isActive("link") ? "bg-primary text-white" : "text-gray-600 hover:bg-gray-100"
          }`}
          title="Sisipkan Tautan"
        >
          <Link2 className="w-4 h-4" />
        </button>

        <label
          className="p-1.5 rounded-lg text-gray-600 hover:bg-gray-100 cursor-pointer"
          title="Unggah Gambar Ilustrasi Bab"
        >
          <ImageIcon className="w-4 h-4" />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleImageUpload}
            disabled={uploadingImage}
            className="hidden"
          />
        </label>
        {uploadingImage && <span className="text-[10px] text-primary animate-pulse">Mengunggah...</span>}
      </div>

      {/* Editor Canvas: Centered column max-w-[720px] mirroring Reader Mode per DESIGN.md Section 4 */}
      <div className="flex-1 bg-surface-light p-4 sm:p-8 overflow-y-auto min-h-[500px]">
        <div className="max-w-[720px] mx-auto bg-white rounded-2xl border border-border-subtle shadow-sm overflow-hidden">
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* Bottom Sticky Action Bar */}
      <div className="p-4 bg-white border-t border-border-subtle flex flex-wrap items-center justify-between gap-4">
        {/* Left: Preview Mode CTA */}
        <button
          type="button"
          onClick={() => setPreviewOpen(true)}
          className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-text-primary text-xs font-semibold flex items-center gap-1.5 transition-colors"
        >
          <Eye className="w-4 h-4" />
          Pratinjau Pembaca
        </button>

        {/* Right Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Save Draft */}
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={isSaving}
            className="px-4 py-2 rounded-xl border border-border-subtle bg-white hover:bg-gray-50 text-text-primary text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4 text-gray-500" />
            Simpan Draft
          </button>

          {/* Schedule Toggle */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowScheduleInput(!showScheduleInput)}
              className="px-4 py-2 rounded-xl border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100 text-primary text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <Calendar className="w-4 h-4" />
              Jadwalkan
            </button>

            {showScheduleInput && (
              <div className="absolute right-0 bottom-12 p-3 bg-white border border-border-subtle rounded-2xl shadow-xl w-64 space-y-2 z-30">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                  Waktu Publikasi
                </label>
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="w-full p-2 border border-border-subtle rounded-xl text-xs"
                />
                <button
                  type="button"
                  onClick={handleSchedulePublish}
                  disabled={isSaving || !scheduledAt}
                  className="w-full py-1.5 rounded-lg bg-primary text-white text-xs font-bold disabled:opacity-50"
                >
                  Konfirmasi Jadwal
                </button>
              </div>
            )}
          </div>

          {/* Immediate Publish */}
          <button
            type="button"
            onClick={handlePublishImmediately}
            disabled={isSaving}
            className="px-5 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-md shadow-primary/20 flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            {isSaving ? "Menyimpan..." : "Publikasikan Sekarang"}
          </button>
        </div>
      </div>

      {/* Reader Mode Preview Modal */}
      <ChapterPreviewModal
        isOpen={previewOpen}
        title={title}
        chapterNumber={chapterNumber}
        contentHtml={editor.getHTML()}
        onClose={() => setPreviewOpen(false)}
      />
    </div>
  );
}
