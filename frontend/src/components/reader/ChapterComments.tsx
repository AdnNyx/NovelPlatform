"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, Reply, Flag, CheckCircle, Send } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { CommentItem, User } from "@/types";

interface ChapterCommentsProps {
  chapterId: string;
  novelId: string;
  currentUser: User | null;
}

export function ChapterComments({
  chapterId,
  novelId,
  currentUser,
}: ChapterCommentsProps) {
  const router = useRouter();

  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [newComment, setNewComment] = useState<string>("");
  const [replyingTo, setReplyingTo] = useState<CommentItem | null>(null);
  const [replyContent, setReplyContent] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string>("");

  useEffect(() => {
    loadComments();
  }, [chapterId]);

  async function loadComments() {
    setLoading(true);
    try {
      const res = await apiClient<{ status: string; data: CommentItem[] }>(
        `/api/chapters/${chapterId}/comments`
      );
      setComments(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function requireAuth(): boolean {
    if (!currentUser) {
      router.push("/login");
      return false;
    }
    return true;
  }

  async function handlePostComment(parentId: string | null = null, content: string) {
    if (!requireAuth() || !content.trim()) return;

    setSubmitting(true);
    setFeedback("");
    try {
      await apiClient(`/api/chapters/${chapterId}/comments`, {
        method: "POST",
        body: JSON.stringify({
          novel_id: novelId,
          chapter_id: chapterId,
          parent_id: parentId,
          content: content.trim(),
        }),
      });

      if (parentId) {
        setReplyContent("");
        setReplyingTo(null);
      } else {
        setNewComment("");
      }
      setFeedback("Komentar Anda berhasil dikirim!");
      loadComments();
    } catch (err: any) {
      setFeedback(err.detail || "Gagal mengirim komentar.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReport(commentId: string) {
    if (!requireAuth()) return;
    try {
      await apiClient(`/api/comments/${commentId}/report`, { method: "POST" });
      setFeedback("Komentar telah dilaporkan untuk ditinjau oleh moderator.");
    } catch (err: any) {
      setFeedback(err.detail || "Gagal melaporkan komentar.");
    }
  }

  return (
    <section className="mt-16 pt-12 border-t border-border-subtle/70 space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="font-sans font-bold text-lg flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          Diskusi Bab ({comments.length})
        </h3>
      </div>

      {feedback && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Main Comment Box */}
      <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-border-subtle/50 space-y-3">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder={
            currentUser
              ? "Tulis pendapat atau tanggapan Anda mengenai bab ini..."
              : "Masuk dengan Google untuk menulis komentar..."
          }
          rows={3}
          className="w-full p-3 rounded-xl bg-white dark:bg-[#1A1A1C] border border-border-subtle text-xs focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <div className="flex justify-end">
          <button
            onClick={() => handlePostComment(null, newComment)}
            disabled={submitting || !newComment.trim()}
            className="px-5 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            {submitting ? "Mengirim..." : "Kirim Komentar"}
          </button>
        </div>
      </div>

      {/* Comments Tree */}
      <div className="space-y-6">
        {loading ? (
          <p className="text-xs text-center opacity-60">Memuat komentar...</p>
        ) : comments.length === 0 ? (
          <p className="text-xs text-center opacity-60 py-6">
            Belum ada komentar untuk bab ini. Jadilah yang pertama memberikan tanggapan!
          </p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="space-y-3">
              {/* Parent Comment Card */}
              <div className="p-4 rounded-2xl bg-white dark:bg-[#1A1A1C] border border-border-subtle/60 space-y-2 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    {comment.user.avatar_url ? (
                      <img
                        src={comment.user.avatar_url}
                        alt={comment.user.display_name}
                        className="w-7 h-7 rounded-full object-cover border border-border-subtle"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
                        {comment.user.display_name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <span className="text-xs font-bold text-inherit block">
                        {comment.user.display_name}
                      </span>
                      <span className="text-[10px] opacity-50 block">
                        {new Date(comment.created_at).toLocaleDateString("id-ID")}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleReport(comment.id)}
                    className="text-[11px] opacity-40 hover:opacity-100 hover:text-red-500 transition-opacity flex items-center gap-1"
                    title="Laporkan komentar tidak pantas"
                  >
                    <Flag className="w-3 h-3" />
                  </button>
                </div>

                <p className="text-xs leading-relaxed opacity-90 pl-9.5">
                  {comment.content}
                </p>

                <div className="pl-9.5 pt-1">
                  <button
                    onClick={() =>
                      setReplyingTo(replyingTo?.id === comment.id ? null : comment)
                    }
                    className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                  >
                    <Reply className="w-3.5 h-3.5" />
                    Balas
                  </button>
                </div>
              </div>

              {/* Reply Box if Active */}
              {replyingTo?.id === comment.id && (
                <div className="ml-8 p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-border-subtle space-y-2">
                  <p className="text-[11px] font-semibold opacity-70">
                    Membalas {comment.user.display_name}:
                  </p>
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Tulis balasan Anda..."
                    rows={2}
                    className="w-full p-2.5 rounded-lg bg-white dark:bg-[#1A1A1C] border border-border-subtle text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setReplyingTo(null)}
                      className="px-3 py-1 rounded-lg text-xs opacity-60 hover:opacity-100"
                    >
                      Batal
                    </button>
                    <button
                      onClick={() => handlePostComment(comment.id, replyContent)}
                      disabled={submitting || !replyContent.trim()}
                      className="px-4 py-1.5 rounded-lg bg-primary text-white text-xs font-bold"
                    >
                      Kirim Balasan
                    </button>
                  </div>
                </div>
              )}

              {/* Nested Replies */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="ml-8 space-y-2.5 border-l-2 border-border-subtle/50 pl-4">
                  {comment.replies.map((reply) => (
                    <div
                      key={reply.id}
                      className="p-3.5 rounded-xl bg-white/70 dark:bg-[#161618] border border-border-subtle/40 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-inherit">
                          {reply.user.display_name}
                        </span>
                        <span className="text-[10px] opacity-50">
                          {new Date(reply.created_at).toLocaleDateString("id-ID")}
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed opacity-90">{reply.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
