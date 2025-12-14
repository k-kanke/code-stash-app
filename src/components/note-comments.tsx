"use client";

import { useMemo, useState } from "react";
import type { ReactElement } from "react";
import type { NoteComment } from "@/lib/types";

const ROOT_BUCKET = "__root__";

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
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [replyError, setReplyError] = useState<string | null>(null);
  const [replySubmitting, setReplySubmitting] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const orderedComments = useMemo(() => {
    return [...comments].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  }, [comments]);

  const commentsByParent = useMemo(() => {
    const buckets = new Map<string, NoteComment[]>();
    orderedComments.forEach((comment) => {
      const key = comment.parentCommentId ?? ROOT_BUCKET;
      const existing = buckets.get(key);
      if (existing) {
        existing.push(comment);
      } else {
        buckets.set(key, [comment]);
      }
    });
    return buckets;
  }, [orderedComments]);

  const rootComments = commentsByParent.get(ROOT_BUCKET) ?? [];

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

  function openReply(target: NoteComment) {
    if (target.parentCommentId) return;
    setReplyingToId(target.id);
    setReplyBody("");
    setReplyError(null);
  }

  function cancelReply() {
    setReplyingToId(null);
    setReplyBody("");
    setReplyError(null);
  }

  function removeWithDescendants(targetId: string, source: NoteComment[]) {
    const idsToRemove = new Set<string>([targetId]);
    let expanded = true;
    while (expanded) {
      expanded = false;
      for (const comment of source) {
        if (
          comment.parentCommentId &&
          idsToRemove.has(comment.parentCommentId) &&
          !idsToRemove.has(comment.id)
        ) {
          idsToRemove.add(comment.id);
          expanded = true;
        }
      }
    }
    return source.filter((comment) => !idsToRemove.has(comment.id));
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
      closeForm();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "コメントの作成に失敗しました");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReplySubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!replyingToId) return;
    if (!replyBody.trim()) {
      setReplyError("返信を入力してください");
      return;
    }
    try {
      setReplySubmitting(true);
      const response = await fetch(`/api/notes?resource=comment&noteId=${noteId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: replyBody,
          parentCommentId: replyingToId,
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error ?? "返信の作成に失敗しました");
      }
      setComments((prev) => [...prev, data as NoteComment]);
      cancelReply();
    } catch (err) {
      console.error(err);
      setReplyError(err instanceof Error ? err.message : "返信の作成に失敗しました");
    } finally {
      setReplySubmitting(false);
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

  function toggleResolved(comment: NoteComment) {
    setEditingId(comment.id);
    setEditDraft({
      body: comment.body,
      lineStart: comment.lineStart ? String(comment.lineStart) : "",
      lineEnd: comment.lineEnd ? String(comment.lineEnd) : "",
    });
    setEditResolved(!comment.resolved);
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
      setComments((prev) => removeWithDescendants(commentId, prev));
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "コメントの削除に失敗しました");
    }
  }

  const renderComment = (comment: NoteComment, depth = 0): ReactElement => {
    const isEditing = editingId === comment.id;
    const childComments = commentsByParent.get(comment.id) ?? [];
    const isReplyingHere = replyingToId === comment.id;
    const isMenuOpen = menuOpenId === comment.id;
    const lineLabel = comment.lineStart
      ? comment.lineEnd && comment.lineEnd !== comment.lineStart
        ? `Lines ${comment.lineStart}-${comment.lineEnd}`
        : `Line ${comment.lineStart}`
      : "Line not specified";
    const containerClass =
      depth > 0 ? "pl-4 ml-4 border-l border-border/40 space-y-3" : "space-y-3";

    return (
      <div key={comment.id} className={containerClass}>
        <article className="relative rounded-md border border-border/70 bg-card/70 p-3 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>{lineLabel}</span>
            <div className="flex items-center gap-2">
              {comment.resolved && (
                <span className="rounded-full border border-green-500/60 px-2 py-0.5 text-[10px] text-green-700">
                  resolved
                </span>
              )}
              <span>{new Date(comment.updatedAt).toLocaleString("ja-JP")}</span>
              <button
                type="button"
                className="rounded-full border border-border px-2 py-1 text-[10px] text-muted-foreground"
                onClick={() => setMenuOpenId(isMenuOpen ? null : comment.id)}
              >
                …
              </button>
            </div>
          </div>

          {isMenuOpen && (
            <div className="absolute right-3 top-10 z-10 w-32 rounded-md border border-border bg-card shadow-lg">
              {!comment.parentCommentId && (
                <button
                  type="button"
                  className="block w-full px-3 py-2 text-left text-xs hover:bg-muted/40"
                  onClick={() => {
                    openReply(comment);
                    setMenuOpenId(null);
                  }}
                >
                  Reply
                </button>
              )}
              <button
                type="button"
                className="block w-full px-3 py-2 text-left text-xs hover:bg-muted/40"
                onClick={() => {
                  startEdit(comment);
                  setMenuOpenId(null);
                }}
              >
                Edit
              </button>
              <button
                type="button"
                className="block w-full px-3 py-2 text-left text-xs hover:bg-muted/40"
                onClick={() => {
                  toggleResolved(comment);
                  setMenuOpenId(null);
                }}
              >
                {comment.resolved ? "Mark unresolved" : "Mark resolved"}
              </button>
              <button
                type="button"
                className="block w-full px-3 py-2 text-left text-xs text-destructive hover:bg-destructive/10"
                onClick={() => {
                  setMenuOpenId(null);
                  handleDelete(comment.id);
                }}
              >
                Delete
              </button>
            </div>
          )}

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
            <p className="mt-3 text-sm text-foreground">{comment.body}</p>
          )}
        </article>

        {isReplyingHere && (
          <form
            onSubmit={handleReplySubmit}
            className="rounded-md border border-border/60 bg-card/40 p-3 text-sm"
          >
            <textarea
              value={replyBody}
              onChange={(event) => setReplyBody(event.target.value)}
              className="w-full rounded-md border border-border bg-background/40 p-2 outline-none"
              rows={3}
              placeholder="返信を入力"
            />
            {replyError && <p className="mt-2 text-xs text-destructive">{replyError}</p>}
            <div className="mt-2 flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={cancelReply}
                className="rounded-md border border-border px-3 py-1 text-muted-foreground"
                disabled={replySubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-md bg-foreground px-4 py-1 text-background disabled:opacity-60"
                disabled={replySubmitting}
              >
                {replySubmitting ? "Posting..." : "Reply"}
              </button>
            </div>
          </form>
        )}

        {childComments.length > 0 && (
          <div className="mt-3 space-y-3">
            {childComments.map((child) => renderComment(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

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
        {rootComments.length === 0 && (
          <p className="text-sm text-muted-foreground">まだコメントはありません。</p>
        )}
        {rootComments.map((comment) => renderComment(comment))}
      </div>
    </section>
  );
}
