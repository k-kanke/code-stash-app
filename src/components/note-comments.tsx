"use client";

import { useMemo, useState } from "react";
import type { NoteComment } from "@/lib/types";

type Props = {
  noteId: string;
  initialComments: NoteComment[];
};

type CommentDraft = {
  body: string;
  lineStart: string;
  lineEnd: string;
};

export function NoteComments({ noteId, initialComments }: Props) {
  const [comments, setComments] = useState<NoteComment[]>(initialComments);
  const [form, setForm] = useState<CommentDraft>({ body: "", lineStart: "", lineEnd: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<CommentDraft>({ body: "", lineStart: "", lineEnd: "" });
  const [editResolved, setEditResolved] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const sortedComments = useMemo(() => {
    return [...comments].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  }, [comments]);

  function parseLine(value: string): number | undefined {
    if (!value) return undefined;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  }

  function resetForm() {
    setForm({ body: "", lineStart: "", lineEnd: "" });
    setError(null);
  }

  function closeForm() {
    resetForm();
    setIsFormOpen(false);
  }

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.body.trim()) {
      setError("コメントを入力してください");
      return;
    }
    try {
      setSubmitting(true);
      const response = await fetch(`/api/notes?resource=comment&noteId=${noteId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: form.body,
          lineStart: parseLine(form.lineStart) ?? null,
          lineEnd: parseLine(form.lineEnd) ?? null,
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error ?? "コメントの作成に失敗しました");
      }
      setComments((prev) => [...prev, data as NoteComment]);
      resetForm();
      setIsFormOpen(false);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "コメントの作成に失敗しました");
    } finally {
      setSubmitting(false);
    }
  }

  function startEdit(comment: NoteComment) {
    setEditingId(comment.id);
    setEditDraft({
      body: comment.body,
      lineStart: comment.lineStart ? String(comment.lineStart) : "",
      lineEnd: comment.lineEnd ? String(comment.lineEnd) : "",
    });
    setEditResolved(comment.resolved);
    setEditError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditError(null);
  }

  async function handleUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingId) return;
    if (!editDraft.body.trim()) {
      setEditError("コメントを入力してください");
      return;
    }

    try {
      const response = await fetch(
        `/api/notes?resource=comment&commentId=${editingId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            body: editDraft.body,
            lineStart: parseLine(editDraft.lineStart) ?? null,
            lineEnd: parseLine(editDraft.lineEnd) ?? null,
            resolved: editResolved,
          }),
        },
      );
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error ?? "コメントの更新に失敗しました");
      }
      setComments((prev) =>
        prev.map((comment) => (comment.id === editingId ? (data as NoteComment) : comment)),
      );
      cancelEdit();
    } catch (err) {
      console.error(err);
      setEditError(err instanceof Error ? err.message : "コメントの更新に失敗しました");
    }
  }

  async function handleDelete(commentId: string) {
    if (!confirm("このコメントを削除しますか？")) return;
    try {
      const response = await fetch(
        `/api/notes?resource=comment&commentId=${commentId}`,
        { method: "DELETE" },
      );
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? "コメントの削除に失敗しました");
      }
      setComments((prev) => prev.filter((comment) => comment.id !== commentId));
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "コメントの削除に失敗しました");
    }
  }

  return (
    <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Comments</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{comments.length} 件</span>
          {isFormOpen ? (
            <button
              type="button"
              className="rounded-md border border-border px-3 py-1 text-[11px] text-muted-foreground"
              onClick={closeForm}
            >
              Cancel
            </button>
          ) : (
            <button
              type="button"
              className="rounded-md bg-foreground px-3 py-1 text-[11px] font-semibold text-background"
              onClick={() => setIsFormOpen(true)}
            >
              Comment
            </button>
          )}
        </div>
      </header>

      {isFormOpen && (
        <form
          onSubmit={handleCreate}
          className="mb-4 space-y-3 rounded-md border border-border/60 p-3"
        >
          <textarea
            value={form.body}
            onChange={(event) => setForm((prev) => ({ ...prev, body: event.target.value }))}
            className="w-full rounded-md border border-border bg-background/50 p-2 text-sm outline-none"
            rows={3}
            placeholder="例: ここはエラーハンドリングが必要かも？"
          />
          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            <label className="flex flex-col gap-1">
              Line start
              <input
                type="number"
                min={1}
                value={form.lineStart}
                onChange={(event) => setForm((prev) => ({ ...prev, lineStart: event.target.value }))}
                className="rounded-md border border-border bg-background/50 p-2 text-sm outline-none"
              />
            </label>
            <label className="flex flex-col gap-1">
              Line end
              <input
                type="number"
                min={1}
                value={form.lineEnd}
                onChange={(event) => setForm((prev) => ({ ...prev, lineEnd: event.target.value }))}
                className="rounded-md border border-border bg-background/50 p-2 text-sm outline-none"
              />
            </label>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={resetForm}
              className="rounded-md border border-border px-3 py-1 text-xs text-muted-foreground"
              disabled={submitting}
            >
              Clear
            </button>
            <button
              type="submit"
              className="rounded-md bg-foreground px-4 py-1 text-xs font-semibold text-background disabled:opacity-60"
              disabled={submitting}
            >
              {submitting ? "Posting..." : "Add comment"}
            </button>
          </div>
        </form>
      )}

      <div className="mt-5 space-y-3">
        {sortedComments.length === 0 && (
          <p className="text-sm text-muted-foreground">まだコメントはありません。</p>
        )}
        {sortedComments.map((comment) => {
          const isEditing = editingId === comment.id;
          return (
            <article
              key={comment.id}
              className="rounded-md border border-border/70 bg-card/70 p-3 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                <span>
                  {comment.lineStart
                    ? comment.lineEnd && comment.lineEnd !== comment.lineStart
                      ? `Lines ${comment.lineStart}-${comment.lineEnd}`
                      : `Line ${comment.lineStart}`
                    : "Line not specified"}
                </span>
                <div className="flex items-center gap-2">
                  {comment.resolved && (
                    <span className="rounded-full border border-green-500/60 px-2 py-0.5 text-[10px] text-green-700">
                      resolved
                    </span>
                  )}
                  <span>{new Date(comment.updatedAt).toLocaleString("ja-JP")}</span>
                </div>
              </div>

              {isEditing ? (
                <form onSubmit={handleUpdate} className="mt-3 space-y-3">
                  <textarea
                    value={editDraft.body}
                    onChange={(event) =>
                      setEditDraft((prev) => ({ ...prev, body: event.target.value }))
                    }
                    className="w-full rounded-md border border-border bg-background/40 p-2 text-sm outline-none"
                    rows={3}
                  />
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <label className="flex flex-col gap-1">
                      Line start
                      <input
                        type="number"
                        min={1}
                        value={editDraft.lineStart}
                        onChange={(event) =>
                          setEditDraft((prev) => ({ ...prev, lineStart: event.target.value }))
                        }
                        className="rounded-md border border-border bg-background/40 p-2 text-sm outline-none"
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      Line end
                      <input
                        type="number"
                        min={1}
                        value={editDraft.lineEnd}
                        onChange={(event) =>
                          setEditDraft((prev) => ({ ...prev, lineEnd: event.target.value }))
                        }
                        className="rounded-md border border-border bg-background/40 p-2 text-sm outline-none"
                      />
                    </label>
                  </div>
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={editResolved}
                      onChange={(event) => setEditResolved(event.target.checked)}
                    />
                    解決済みにする
                  </label>
                  {editError && <p className="text-sm text-destructive">{editError}</p>}
                  <div className="flex justify-end gap-2 text-xs">
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="rounded-md border border-border px-3 py-1 text-muted-foreground"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="rounded-md bg-foreground px-4 py-1 text-background"
                    >
                      Save
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <p className="mt-3 text-sm text-foreground">{comment.body}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => startEdit(comment)}
                      className="rounded-md border border-border px-3 py-1 text-muted-foreground"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(comment.id)}
                      className="rounded-md border border-destructive px-3 py-1 text-destructive"
                    >
                      Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(comment.id);
                        setEditDraft({
                          body: comment.body,
                          lineStart: comment.lineStart ? String(comment.lineStart) : "",
                          lineEnd: comment.lineEnd ? String(comment.lineEnd) : "",
                        });
                        setEditResolved(!comment.resolved);
                        setEditError(null);
                      }}
                      className="rounded-md border border-border px-3 py-1 text-muted-foreground"
                    >
                      {comment.resolved ? "Mark unresolved" : "Mark resolved"}
                    </button>
                  </div>
                </>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
