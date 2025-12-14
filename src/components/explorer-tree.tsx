"use client";

import { useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export type ExplorerNode = {
  id: string;
  label: string;
  type: "folder" | "note";
  children?: ExplorerNode[];
  meta?: {
    href?: string;
    language?: string;
    badge?: string;
  };
};

function collectFolderIds(nodes: ExplorerNode[]): Set<string> {
  const open = new Set<string>();
  const visit = (items: ExplorerNode[]) => {
    items.forEach((item) => {
      if (item.type === "folder") {
        open.add(item.id);
        if (item.children) {
          visit(item.children);
        }
      }
    });
  };
  visit(nodes);
  return open;
}

export function ExplorerTree({
  nodes,
  activeNoteId,
  selectedFolderId,
  collectionId,
  selectedFolderName,
}: {
  nodes: ExplorerNode[];
  activeNoteId?: string;
  selectedFolderId?: string;
  collectionId: string;
  selectedFolderName?: string;
}) {
  const initialOpen = useMemo(() => collectFolderIds(nodes), [nodes]);
  const [openIds, setOpenIds] = useState(initialOpen);
  const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [folderError, setFolderError] = useState<string | null>(null);
  const [folderLoading, setFolderLoading] = useState(false);
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteLanguage, setNoteLanguage] = useState("typescript");
  const [noteTags, setNoteTags] = useState("");
  const [noteCode, setNoteCode] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [noteError, setNoteError] = useState<string | null>(null);
  const [noteLoading, setNoteLoading] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const targetFolderLabel = selectedFolderName ?? "Collection root";

  const toggleFolder = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleFolderSelect = (folderId: string) => {
    if (!router || !pathname) return;
    const params = new URLSearchParams(searchParams?.toString());
    if (folderId) {
      params.set("folder", folderId);
    } else {
      params.delete("folder");
    }
    params.delete("note");
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const handleCreateFolder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!folderName.trim()) {
      setFolderError("フォルダ名を入力してください");
      return;
    }
    try {
      setFolderLoading(true);
      const response = await fetch("/api/collections?resource=folder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          collectionId,
          parentFolderId: selectedFolderId ?? null,
          name: folderName.trim(),
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? "フォルダの作成に失敗しました");
      }
      setIsFolderDialogOpen(false);
      setFolderName("");
      setFolderError(null);
      router.refresh();
    } catch (error) {
      console.error(error);
      setFolderError(error instanceof Error ? error.message : "フォルダの作成に失敗しました");
    } finally {
      setFolderLoading(false);
    }
  };

  const handleCreateNote = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!noteTitle.trim()) {
      setNoteError("タイトルを入力してください");
      return;
    }
    if (!noteCode.trim()) {
      setNoteError("コードを入力してください");
      return;
    }
    try {
      setNoteLoading(true);
      const response = await fetch("/api/notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          collectionId,
          folderId: selectedFolderId ?? null,
          title: noteTitle.trim(),
          language: noteLanguage.trim() || "plaintext",
          tags: noteTags,
          code: noteCode,
          note: noteContent,
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? "ノートの作成に失敗しました");
      }
      setIsNoteDialogOpen(false);
      setNoteTitle("");
      setNoteLanguage("typescript");
      setNoteTags("");
      setNoteCode("");
      setNoteContent("");
      setNoteError(null);
      router.refresh();
    } catch (error) {
      console.error(error);
      setNoteError(error instanceof Error ? error.message : "ノートの作成に失敗しました");
    } finally {
      setNoteLoading(false);
    }
  };

  const renderNode = (node: ExplorerNode, depth = 0) => {
    const padding = depth === 0 ? 4 : depth * 12 + 4;

    if (node.type === "folder") {
      const isOpen = openIds.has(node.id);
      const isSelected = selectedFolderId === node.id;
      return (
        <div key={node.id}>
          <div
            className={`flex items-center gap-2 rounded-md px-2 py-1 text-sm transition ${
              isSelected ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted"
            }`}
            style={{ paddingLeft: `${padding}px` }}
          >
            <button
              type="button"
              onClick={() => toggleFolder(node.id)}
              className="text-base text-muted-foreground transition hover:text-foreground"
              aria-label={isOpen ? "collapse folder" : "expand folder"}
            >
              {isOpen ? "⌄" : "›"}
            </button>
            <FolderIcon open={isOpen} />
            <button
              type="button"
              onClick={() => handleFolderSelect(node.id)}
              className="flex-1 text-left font-medium text-foreground"
            >
              {node.label}
            </button>
          </div>
          {isOpen && node.children && (
            <div className="space-y-1">{node.children.map((child) => renderNode(child, depth + 1))}</div>
          )}
        </div>
      );
    }

    const isActive = activeNoteId === node.id;

    return (
      <Link
        key={node.id}
        href={node.meta?.href ?? "#"}
        className={`flex w-full items-center gap-2 rounded-md px-2 py-1 text-sm transition hover:bg-muted ${
          isActive ? "bg-muted text-foreground" : "text-muted-foreground"
        }`}
        style={{ paddingLeft: `${padding + 12}px` }}
      >
        <FileIcon />
        <span className="flex-1 truncate text-foreground">{node.label}</span>
      </Link>
    );
  };

  return (
    <aside className="rounded-lg border border-border bg-card shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Explorer</p>
          <p className="text-[11px] text-muted-foreground/80">
            {targetFolderLabel}
          </p>
        </div>
        <div className="flex gap-2 text-[11px]">
          <button
            type="button"
            onClick={() => {
              setFolderError(null);
              setFolderName("");
              setIsFolderDialogOpen(true);
            }}
            className="rounded border border-border px-2 py-1 uppercase tracking-wide text-muted-foreground hover:border-foreground/40"
          >
            + Folder
          </button>
          <button
            type="button"
            onClick={() => {
              setNoteError(null);
              setNoteTitle("");
              setNoteLanguage("typescript");
              setNoteTags("");
              setNoteCode("");
              setNoteContent("");
              setIsNoteDialogOpen(true);
            }}
            className="rounded border border-border px-2 py-1 uppercase tracking-wide text-muted-foreground hover:border-foreground/40"
          >
            + Note
          </button>
        </div>
      </div>
      <div className="space-y-1 p-2">{nodes.map((node) => renderNode(node))}</div>
      {isFolderDialogOpen && (
        <Dialog
          title="新規フォルダ"
          description={`${targetFolderLabel} に追加`}
          onClose={() => {
            if (folderLoading) return;
            setIsFolderDialogOpen(false);
            setFolderError(null);
          }}
        >
          <form onSubmit={handleCreateFolder} className="space-y-4">
            <div>
              <label className="text-xs uppercase tracking-wide text-muted-foreground">
                Name
              </label>
              <input
                value={folderName}
                onChange={(event) => setFolderName(event.target.value)}
                className="mt-2 w-full rounded-md border border-border bg-background p-2 text-sm outline-none focus:border-foreground"
                placeholder="フォルダ名"
                maxLength={80}
              />
            </div>
            {folderError && <p className="text-sm text-destructive">{folderError}</p>}
            <div className="flex justify-end gap-2 text-sm">
              <button
                type="button"
                onClick={() => {
                  if (folderLoading) return;
                  setIsFolderDialogOpen(false);
                  setFolderError(null);
                }}
                className="rounded-md border border-border px-4 py-2 text-muted-foreground"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={folderLoading}
                className="rounded-md bg-foreground px-4 py-2 font-medium text-background disabled:opacity-60"
              >
                {folderLoading ? "Creating..." : "Create"}
              </button>
            </div>
          </form>
        </Dialog>
      )}
      {isNoteDialogOpen && (
        <Dialog
          title="新規ノート"
          description={`${targetFolderLabel} に追加`}
          onClose={() => {
            if (noteLoading) return;
            setIsNoteDialogOpen(false);
            setNoteError(null);
          }}
        >
          <form onSubmit={handleCreateNote} className="space-y-4">
            <div>
              <label className="text-xs uppercase tracking-wide text-muted-foreground">Title</label>
              <input
                value={noteTitle}
                onChange={(event) => setNoteTitle(event.target.value)}
                className="mt-2 w-full rounded-md border border-border bg-background p-2 text-sm outline-none focus:border-foreground"
                placeholder="ノート名"
              />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="text-xs uppercase tracking-wide text-muted-foreground">Language</label>
                <input
                  value={noteLanguage}
                  onChange={(event) => setNoteLanguage(event.target.value)}
                  className="mt-2 w-full rounded-md border border-border bg-background p-2 text-sm outline-none focus:border-foreground"
                  placeholder="typescript"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-muted-foreground">Tags</label>
                <input
                  value={noteTags}
                  onChange={(event) => setNoteTags(event.target.value)}
                  className="mt-2 w-full rounded-md border border-border bg-background p-2 text-sm outline-none focus:border-foreground"
                  placeholder="tag1, tag2"
                />
              </div>
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-muted-foreground">Code</label>
              <textarea
                value={noteCode}
                onChange={(event) => setNoteCode(event.target.value)}
                className="mt-2 h-32 w-full rounded-md border border-border bg-background p-2 font-mono text-sm outline-none focus:border-foreground"
                placeholder="コードを入力"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-muted-foreground">Notes</label>
              <textarea
                value={noteContent}
                onChange={(event) => setNoteContent(event.target.value)}
                className="mt-2 h-24 w-full rounded-md border border-border bg-background p-2 text-sm outline-none focus:border-foreground"
                placeholder="補足メモ (任意)"
              />
            </div>
            {noteError && <p className="text-sm text-destructive">{noteError}</p>}
            <div className="flex justify-end gap-2 text-sm">
              <button
                type="button"
                onClick={() => {
                  if (noteLoading) return;
                  setIsNoteDialogOpen(false);
                  setNoteError(null);
                }}
                className="rounded-md border border-border px-4 py-2 text-muted-foreground"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={noteLoading}
                className="rounded-md bg-foreground px-4 py-2 font-medium text-background disabled:opacity-60"
              >
                {noteLoading ? "Creating..." : "Create"}
              </button>
            </div>
          </form>
        </Dialog>
      )}
    </aside>
  );
}

function FolderIcon({ open }: { open: boolean }) {
  return (
    <span className="flex h-4 w-4 items-center justify-center text-muted-foreground">
      {open ? "📂" : "📁"}
    </span>
  );
}

function FileIcon() {
  return (
    <span className="flex h-4 w-4 items-center justify-center text-muted-foreground">
      📄
    </span>
  );
}

function Dialog({
  title,
  description,
  onClose,
  children,
}: {
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg border border-border bg-background p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">{title}</p>
            {description && <h2 className="text-lg font-semibold">{description}</h2>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-muted-foreground transition hover:text-foreground"
          >
            ✕
          </button>
        </div>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
