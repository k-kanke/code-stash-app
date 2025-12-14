"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
    isRoot?: boolean;
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
}: {
  nodes: ExplorerNode[];
  activeNoteId?: string;
  selectedFolderId?: string;
  collectionId: string;
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
  const [openMenuNode, setOpenMenuNode] = useState<{ id: string; type: "folder" | "note" } | null>(
    null,
  );
  const [pendingDelete, setPendingDelete] = useState<{
    id: string;
    name: string;
    type: "folder" | "note";
  } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [renameTarget, setRenameTarget] = useState<{
    id: string;
    name: string;
    type: "folder" | "note";
  } | null>(null);
  const [renameName, setRenameName] = useState("");
  const [renameLoading, setRenameLoading] = useState(false);
  const [renameError, setRenameError] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!openMenuNode) {
      menuRef.current = null;
      return;
    }
    const handleClick = (event: MouseEvent) => {
      if (
        menuRef.current &&
        event.target instanceof Node &&
        menuRef.current.contains(event.target)
      ) {
        return;
      }
      setOpenMenuNode(null);
    };
    document.addEventListener("mousedown", handleClick);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      menuRef.current = null;
    };
  }, [openMenuNode]);

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

  const handleDelete = async () => {
    if (!pendingDelete) return;
    try {
      setDeleteLoading(true);
      let response: Response;
      if (pendingDelete.type === "folder") {
        response = await fetch("/api/collections?resource=folder", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            collectionId,
            folderId: pendingDelete.id,
          }),
        });
      } else {
        response = await fetch("/api/notes?resource=note", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            noteId: pendingDelete.id,
          }),
        });
      }

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(
          data?.error ??
            (pendingDelete.type === "folder"
              ? "フォルダの削除に失敗しました"
              : "ノートの削除に失敗しました"),
        );
      }

      if (pendingDelete.type === "note" && searchParams?.get("note") === pendingDelete.id) {
        const params = new URLSearchParams(searchParams.toString());
        params.delete("note");
        const query = params.toString();
        if (pathname) {
          router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
        }
      }

      setPendingDelete(null);
      setDeleteError(null);
      router.refresh();
    } catch (error) {
      console.error(error);
      setDeleteError(
        error instanceof Error
          ? error.message
          : pendingDelete.type === "folder"
            ? "フォルダの削除に失敗しました"
            : "ノートの削除に失敗しました",
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleRename = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!renameTarget) return;
    const target = renameTarget;
    const nextName = renameName.trim();
    if (!nextName) {
      setRenameError("名前を入力してください");
      return;
    }
    try {
      setRenameLoading(true);
      let response: Response;
      if (target.type === "folder") {
        response = await fetch("/api/collections?resource=folder", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            collectionId,
            folderId: target.id,
            name: nextName,
          }),
        });
      } else {
        response = await fetch("/api/notes", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            noteId: target.id,
            title: nextName,
          }),
        });
      }

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(
          data?.error ??
            (target.type === "folder"
              ? "フォルダ名の変更に失敗しました"
              : "ノート名の変更に失敗しました"),
        );
      }

      setRenameTarget(null);
      setRenameName("");
      setRenameError(null);
      router.refresh();
    } catch (error) {
      console.error(error);
      setRenameError(
        error instanceof Error
          ? error.message
          : target.type === "folder"
            ? "フォルダ名の変更に失敗しました"
            : "ノート名の変更に失敗しました",
      );
    } finally {
      setRenameLoading(false);
    }
  };

  const renderNode = (node: ExplorerNode, depth = 0) => {
    const padding = depth === 0 ? 4 : depth * 12 + 4;

    if (node.type === "folder") {
      const isOpen = openIds.has(node.id);
      const isSelected = selectedFolderId === node.id;
      const isCollectionRoot = node.meta?.isRoot ?? false;
      return (
        <div key={node.id}>
          <div
            className={`relative flex items-center gap-2 rounded-md px-2 py-1 text-sm transition ${
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
            {!isCollectionRoot && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setDeleteError(null);
                    setOpenMenuNode((prev) =>
                      prev && prev.id === node.id && prev.type === "folder"
                        ? null
                        : { id: node.id, type: "folder" },
                    );
                  }}
                  className="rounded p-1 text-xs text-muted-foreground transition hover:bg-muted hover:text-foreground"
                  aria-label="folder menu"
                >
                  ⋯
                </button>
                {openMenuNode?.type === "folder" && openMenuNode.id === node.id && (
                  <div
                    ref={(element) => {
                      if (openMenuNode?.type === "folder" && openMenuNode.id === node.id) {
                        menuRef.current = element;
                      }
                    }}
                    className="absolute right-2 top-full z-20 mt-1 w-32 rounded-md border border-border bg-card py-1 shadow-lg"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setRenameTarget({ id: node.id, name: node.label, type: "folder" });
                        setRenameName(node.label);
                        setRenameError(null);
                        setOpenMenuNode(null);
                      }}
                      className="flex w-full items-center px-3 py-2 text-left text-sm hover:bg-muted"
                    >
                      Rename
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPendingDelete({ id: node.id, name: node.label, type: "folder" });
                        setOpenMenuNode(null);
                        setDeleteError(null);
                      }}
                      className="flex w-full items-center px-3 py-2 text-left text-sm text-destructive hover:bg-muted"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
          {isOpen && node.children && (
            <div className="space-y-1">{node.children.map((child) => renderNode(child, depth + 1))}</div>
          )}
        </div>
      );
    }

    const isActive = activeNoteId === node.id;

    return (
      <div
        key={node.id}
        className={`relative flex w-full items-center gap-2 rounded-md px-2 py-1 text-sm transition ${
          isActive ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted"
        }`}
        style={{ paddingLeft: `${padding + 12}px` }}
      >
        <Link
          href={node.meta?.href ?? "#"}
          className="flex flex-1 items-center gap-2"
          scroll={false}
        >
          <FileIcon />
          <span className="flex-1 truncate text-foreground">{node.label}</span>
        </Link>
        <button
          type="button"
          onClick={() => {
            setDeleteError(null);
            setOpenMenuNode((prev) =>
              prev && prev.id === node.id && prev.type === "note"
                ? null
                : { id: node.id, type: "note" },
            );
          }}
          className="rounded p-1 text-xs text-muted-foreground transition hover:bg-muted hover:text-foreground"
          aria-label="note menu"
        >
          ⋯
        </button>
        {openMenuNode?.type === "note" && openMenuNode.id === node.id && (
          <div
            ref={(element) => {
              if (openMenuNode?.type === "note" && openMenuNode.id === node.id) {
                menuRef.current = element;
              }
            }}
            className="absolute right-2 top-full z-20 mt-1 w-32 rounded-md border border-border bg-card py-1 shadow-lg"
          >
            <button
              type="button"
              onClick={() => {
                setRenameTarget({ id: node.id, name: node.label, type: "note" });
                setRenameName(node.label);
                setRenameError(null);
                setOpenMenuNode(null);
              }}
              className="flex w-full items-center px-3 py-2 text-left text-sm hover:bg-muted"
            >
              Rename
            </button>
            <button
              type="button"
              onClick={() => {
                setPendingDelete({ id: node.id, name: node.label, type: "note" });
                setOpenMenuNode(null);
                setDeleteError(null);
              }}
              className="flex w-full items-center px-3 py-2 text-left text-sm text-destructive hover:bg-muted"
            >
              Delete
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <aside className="rounded-lg border border-border bg-card shadow-sm">
      <div className="flex flex-wrap items-center justify-end gap-2 border-b border-border px-4 py-3">
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
          title="New Folder"
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
                placeholder="Folder Name"
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
      {pendingDelete && (
        <Dialog
          title={pendingDelete.type === "folder" ? "Delete Folder" : "Delete Note"}
          description={
            pendingDelete.type === "folder"
              ? "This will remove the folder and everything inside."
              : "This will remove the note and its discussion."
          }
          onClose={() => {
            if (deleteLoading) return;
            setPendingDelete(null);
            setDeleteError(null);
          }}
        >
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-foreground">{pendingDelete.name}</span>?
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {pendingDelete.type === "folder"
              ? "Nested folders, notes, and comments will also be removed."
              : "Comments linked to this note will be removed as well."}
          </p>
          {deleteError && <p className="text-sm text-destructive">{deleteError}</p>}
          <div className="mt-6 flex justify-end gap-2 text-sm">
            <button
              type="button"
              onClick={() => {
                if (deleteLoading) return;
                setPendingDelete(null);
                setDeleteError(null);
              }}
              className="rounded-md border border-border px-4 py-2 text-muted-foreground"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleteLoading}
              className="rounded-md bg-destructive px-4 py-2 font-medium text-background disabled:opacity-60"
            >
              {deleteLoading ? "Deleting..." : "Delete"}
            </button>
          </div>
        </Dialog>
      )}
      {renameTarget && (
        <Dialog
          title={renameTarget.type === "folder" ? "Rename Folder" : "Rename Note"}
          onClose={() => {
            if (renameLoading) return;
            setRenameTarget(null);
            setRenameName("");
            setRenameError(null);
          }}
        >
          <form onSubmit={handleRename} className="space-y-4">
            <div>
              <label className="text-xs uppercase tracking-wide text-muted-foreground">
                New Name
              </label>
              <input
                value={renameName}
                onChange={(event) => setRenameName(event.target.value)}
                className="mt-2 w-full rounded-md border border-border bg-background p-2 text-sm outline-none focus:border-foreground"
                placeholder="Enter a new name"
                autoFocus
              />
            </div>
            {renameError && <p className="text-sm text-destructive">{renameError}</p>}
            <div className="flex justify-end gap-2 text-sm">
              <button
                type="button"
                onClick={() => {
                  if (renameLoading) return;
                  setRenameTarget(null);
                  setRenameName("");
                  setRenameError(null);
                }}
                className="rounded-md border border-border px-4 py-2 text-muted-foreground"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={renameLoading}
                className="rounded-md bg-foreground px-4 py-2 font-medium text-background disabled:opacity-60"
              >
                {renameLoading ? "Renaming..." : "Rename"}
              </button>
            </div>
          </form>
        </Dialog>
      )}
      {isNoteDialogOpen && (
        <Dialog
          title="New Note"
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
                placeholder="Note Name"
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
                placeholder="write code"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-muted-foreground">Memo</label>
              <textarea
                value={noteContent}
                onChange={(event) => setNoteContent(event.target.value)}
                className="mt-2 h-24 w-full rounded-md border border-border bg-background p-2 text-sm outline-none focus:border-foreground"
                placeholder="leave a memo"
              />
            </div>
            {noteError && (
              <div
                role="alert"
                className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-600"
              >
                {noteError}
              </div>
            )}
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
