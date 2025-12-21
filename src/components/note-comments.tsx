"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactElement } from "react";
import type { NoteComment } from "@/lib/types";
import { apiFetch } from "@/lib/client-api";

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
  const [replyDraft, setReplyDraft] = useState<Record<string, string>>({});
  const [replyErrors, setReplyErrors] = useState<Record<string, string>>({});
  const [replySubmitting, setReplySubmitting] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const replyRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});

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

  function autoResizeReply(id: string) {
    const textarea = replyRefs.current[id];
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.max(textarea.scrollHeight, 32)}px`;
    }
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!menuOpenId) return;
      const target = event.target as Node;
      if (
        (menuRef.current && menuRef.current.contains(target)) ||
        (menuAnchor && menuAnchor.contains(target as Node))
      ) {
        return;
      }
      setMenuOpenId(null);
      setMenuAnchor(null);
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpenId, menuAnchor]);

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

  useEffect(() => {
    Object.keys(replyDraft).forEach(autoResizeReply);
  }, [replyDraft]);

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
      setError("Please enter a comment");
      return;
    }
    try {
      setSubmitting(true);
      const response = await apiFetch(`/api/notes?resource=comment&noteId=${noteId}`, {
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
        throw new Error(data?.error ?? "Failed to create comment");
      }
      setComments((prev) => [...prev, data as NoteComment]);
      closeForm();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to create comment");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReplySubmit(
    event: React.FormEvent<HTMLFormElement>,
    parentId: string,
  ) {
    event.preventDefault();
    const body = replyDraft[parentId]?.trim();
    if (!body) {
      setReplyErrors((prev) => ({ ...prev, [parentId]: "Please enter a reply" }));
      return;
    }
    try {
      setReplySubmitting(true);
      const response = await apiFetch(`/api/notes?resource=comment&noteId=${noteId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body,
          parentCommentId: parentId,
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error ?? "Failed to create reply");
      }
      setComments((prev) => [...prev, data as NoteComment]);
      setReplyDraft((prev) => {
        const next = { ...prev };
        delete next[parentId];
        return next;
      });
      setReplyErrors((prev) => {
        const next = { ...prev };
        delete next[parentId];
        return next;
      });
    } catch (err) {
      console.error(err);
      setReplyErrors((prev) => ({
        ...prev,
        [parentId]: err instanceof Error ? err.message : "Failed to create reply",
      }));
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

  function cancelEdit() {
    setEditingId(null);
    setEditError(null);
  }

  async function handleUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingId) return;
    if (!editDraft.body.trim()) {
      setEditError("Please enter a comment");
      return;
    }

    try {
      const response = await apiFetch(`/api/notes?resource=comment&commentId=${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: editDraft.body,
          lineStart: parseLine(editDraft.lineStart) ?? null,
          lineEnd: parseLine(editDraft.lineEnd) ?? null,
          resolved: editResolved,
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error ?? "Failed to update comment");
      }
      setComments((prev) =>
        prev.map((comment) => (comment.id === editingId ? (data as NoteComment) : comment)),
      );
      cancelEdit();
    } catch (err) {
      console.error(err);
      setEditError(err instanceof Error ? err.message : "Failed to update comment");
    }
  }

  async function handleToggleResolved(comment: NoteComment) {
    try {
      const response = await apiFetch(`/api/notes?resource=comment&commentId=${comment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resolved: !comment.resolved }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error ?? "更新に失敗しました");
      }
      setComments((prev) =>
        prev.map((item) => (item.id === comment.id ? (data as NoteComment) : item)),
      );
      setMenuOpenId(null);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "更新に失敗しました");
    }
  }

  async function handleDelete(commentId: string) {
    if (!confirm("このコメントを削除しますか？")) return;
    try {
      const response = await apiFetch(`/api/notes?resource=comment&commentId=${commentId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? "Failed to delete comment");
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
    const isMenuOpen = menuOpenId === comment.id;
    const lineLabel = comment.lineStart
      ? comment.lineEnd && comment.lineEnd !== comment.lineStart
        ? `Lines ${comment.lineStart}-${comment.lineEnd}`
        : `Line ${comment.lineStart}`
      : "Line not specified";
    const isNested = depth > 0;
    const cardClass = isNested
      ? "relative rounded-md border border-border bg-white p-3 shadow-sm"
      : "relative rounded-lg border border-border bg-white p-4 shadow-sm";

    return (
      <div className={isNested ? "pl-4" : ""}>
        <article className={cardClass}>
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
                className="px-2 py-0 text-lg text-muted-foreground hover:text-foreground"
                onClick={(event) => {
                  setMenuOpenId(isMenuOpen ? null : comment.id);
                  setMenuAnchor(event.currentTarget);
                }}
              >
                …
              </button>
            </div>
          </div>

          {isMenuOpen && (
            <div
              ref={isMenuOpen ? menuRef : undefined}
              className="absolute right-3 top-10 z-10 w-32 rounded-md border border-border bg-card shadow-lg"
            >
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
              {!comment.parentCommentId && (
                <button
                  type="button"
                  className="block w-full px-3 py-2 text-left text-xs hover:bg-muted/40"
                  onClick={() => {
                    handleToggleResolved(comment);
                  }}
                >
                  {comment.resolved ? "Mark unresolved" : "Mark resolved"}
                </button>
              )}
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
        Mark as resolved
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
            <p className="mt-3 whitespace-pre-wrap wrap-break-word text-sm text-foreground">
              {comment.body}
            </p>
          )}

          {!comment.parentCommentId && (
            <div className="mt-4 space-y-3 border-t border-border/60 pt-4">
              {childComments.map((child) => (
                <div key={child.id}>{renderComment(child, depth + 1)}</div>
              ))}
              <form
                onSubmit={(event) => handleReplySubmit(event, comment.id)}
                className="flex items-center gap-2"
              >
                <textarea
                  ref={(element) => {
                    replyRefs.current[comment.id] = element;
                    if (element) {
                      autoResizeReply(comment.id);
                    }
                  }}
                  value={replyDraft[comment.id] ?? ""}
                  onChange={(event) => {
                    const value = event.target.value;
                    setReplyDraft((prev) => ({
                      ...prev,
                      [comment.id]: value,
                    }));
                    setTimeout(() => autoResizeReply(comment.id), 0);
                  }}
                  rows={1}
                  className="w-full resize-none rounded-md bg-background/40 p-2 text-sm outline-none"
                  placeholder="Leave a reply"
                />
                <button
                  type="submit"
                  className="rounded-md border border-border px-3 py-1 text-xs text-muted-foreground disabled:opacity-60"
                  disabled={replySubmitting}
                >
                  {replySubmitting ? "Posting..." : "Reply"}
                </button>
              </form>
              {replyErrors[comment.id] && (
                <p className="text-xs text-destructive">{replyErrors[comment.id]}</p>
              )}
            </div>
          )}
        </article>
      </div>
    );
  };

  return (
    <section className="space-y-4">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Comments</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{comments.length} comments</span>
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
              ＋ Comment
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
            placeholder="leave a comment"
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

      <div className="mt-5 space-y-4">
        {rootComments.length === 0 && (
          <p className="text-sm text-muted-foreground">No comments yet.</p>
        )}
        {rootComments.map((comment) => (
          <div key={comment.id}>{renderComment(comment)}</div>
        ))}
      </div>
    </section>
  );
}
