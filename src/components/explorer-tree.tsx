"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  title,
}: {
  nodes: ExplorerNode[];
  activeNoteId?: string;
  selectedFolderId?: string;
  collectionId: string;
  title?: string;
}) {
  const initialOpen = useMemo(() => collectFolderIds(nodes), [nodes]);
  const [openIds, setOpenIds] = useState(initialOpen);
  const [creatingFolderInline, setCreatingFolderInline] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [folderError, setFolderError] = useState<string | null>(null);
  const [folderLoading, setFolderLoading] = useState(false);
  const [creatingNoteInline, setCreatingNoteInline] = useState(false);
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
  const [folderInsertionParent, setFolderInsertionParent] = useState<string | undefined>(undefined);
  const [noteInsertionParent, setNoteInsertionParent] = useState<string | undefined>(undefined);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const folderInlineFormRef = useRef<HTMLDivElement | null>(null);
  const noteInlineFormRef = useRef<HTMLDivElement | null>(null);
  const beginFolderCreation = () => {
    if (folderLoading) return;
    const parentId = selectedFolderId ?? undefined;
    setFolderInsertionParent(parentId);
    if (parentId) {
      setOpenIds((prev) => {
        const next = new Set(prev);
        next.add(parentId);
        return next;
      });
    }
    setFolderError(null);
    setFolderName("");
    setCreatingFolderInline(true);
  };
  const cancelFolderCreation = useCallback(() => {
    if (folderLoading) return;
    setCreatingFolderInline(false);
    setFolderInsertionParent(undefined);
    setFolderName("");
    setFolderError(null);
  }, [folderLoading]);
  const beginNoteCreation = () => {
    if (noteLoading) return;
    const parentId = selectedFolderId ?? undefined;
    setNoteInsertionParent(parentId);
    if (parentId) {
      setOpenIds((prev) => {
        const next = new Set(prev);
        next.add(parentId);
        return next;
      });
    }
    setNoteError(null);
    setNoteTitle("");
    setNoteLanguage("");
    setNoteTags("");
    setNoteCode("");
    setNoteContent("");
    setCreatingNoteInline(true);
  };
  const cancelNoteCreation = useCallback(() => {
    if (noteLoading) return;
    setCreatingNoteInline(false);
    setNoteInsertionParent(undefined);
    setNoteTitle("");
    setNoteError(null);
  }, [noteLoading]);

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

  useEffect(() => {
    if (!creatingFolderInline && !creatingNoteInline) return;
    const handleClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (folderInlineFormRef.current && folderInlineFormRef.current.contains(target)) {
        return;
      }
      if (noteInlineFormRef.current && noteInlineFormRef.current.contains(target)) {
        return;
      }
      if (creatingFolderInline) {
        cancelFolderCreation();
      }
      if (creatingNoteInline) {
        cancelNoteCreation();
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => {
      document.removeEventListener("mousedown", handleClick);
    };
  }, [creatingFolderInline, creatingNoteInline, cancelFolderCreation, cancelNoteCreation]);

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
      setCreatingFolderInline(false);
      setFolderInsertionParent(undefined);
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
      setCreatingNoteInline(false);
      setNoteInsertionParent(undefined);
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

  const renderFolderInlineForm = () => (
    <div ref={folderInlineFormRef} className="space-y-1 rounded-md bg-muted/40 px-2 py-1 text-sm">
      <form
        onSubmit={handleCreateFolder}
        className="flex items-center gap-2"
      >
        <span aria-hidden>📁</span>
        <input
          autoFocus
          value={folderName}
          onChange={(event) => setFolderName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              cancelFolderCreation();
            }
          }}
          className="flex-1 rounded-sm border border-transparent bg-transparent px-1 text-foreground outline-none"
          placeholder="New folder name"
        />
        <div className="flex gap-1 text-[11px] uppercase tracking-widest">
          <button type="submit" disabled={folderLoading} className="text-foreground">
            Enter
          </button>
          <button type="button" onClick={cancelFolderCreation} className="text-muted-foreground">
            Esc
          </button>
        </div>
      </form>
      {folderError && <p className="px-1 text-xs text-destructive">{folderError}</p>}
    </div>
  );

  const renderNoteInlineForm = () => (
    <div ref={noteInlineFormRef} className="space-y-1 rounded-md bg-muted/40 px-2 py-1 text-sm">
      <form
        onSubmit={handleCreateNote}
        className="flex items-center gap-2"
      >
        <span aria-hidden>📄</span>
        <input
          autoFocus
          value={noteTitle}
          onChange={(event) => setNoteTitle(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              cancelNoteCreation();
            }
          }}
          className="flex-1 rounded-sm border border-transparent bg-transparent px-1 text-foreground outline-none"
          placeholder="New note title"
        />
        <div className="flex gap-1 text-[11px] uppercase tracking-widest">
          <button type="submit" disabled={noteLoading} className="text-foreground">
            Enter
          </button>
          <button type="button" onClick={cancelNoteCreation} className="text-muted-foreground">
            Esc
          </button>
        </div>
      </form>
      {noteError && <p className="px-1 text-xs text-destructive">{noteError}</p>}
    </div>
  );

  const renderNode = (node: ExplorerNode, depth = 0, isFirstSibling = false) => {
    const folderPadding = 10 + depth * 10;
    const notePadding = folderPadding + 6;
    const folderGuide = folderPadding - 6;
    const noteGuide = notePadding - 8;
    const dividerClass = isFirstSibling ? "relative" : "relative mt-0.5 border-t border-border/40 pt-0.5";

    if (node.type === "folder") {
      const isOpen = openIds.has(node.id);
      const isSelected = selectedFolderId === node.id;
      const isCollectionRoot = node.meta?.isRoot ?? false;
      return (
        <div key={node.id} className={dividerClass}>
          <div
            className={`group relative flex w-full items-center gap-1 rounded-md px-2 py-0.5 text-[0.8rem] transition ${
              isSelected ? "bg-muted/40 text-foreground" : "bg-white/70 text-muted-foreground hover:bg-muted/40"
            }`}
            style={{ paddingLeft: `${folderPadding}px` }}
          >
            {depth > 0 && (
              <span
                aria-hidden
                className="pointer-events-none absolute top-0.5 bottom-0.5 w-px bg-border/40"
                style={{ left: `${folderGuide}px` }}
              />
            )}
            <button
              type="button"
              onClick={() => toggleFolder(node.id)}
              className="flex h-4 w-4 items-center justify-center rounded-full border border-white/70 text-[9px] text-muted-foreground transition hover:border-foreground/40 hover:text-foreground"
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
                  className="rounded-full border border-transparent p-0.5 text-[11px] text-muted-foreground transition hover:border-border/60 hover:bg-white/80 hover:text-foreground"
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
                    className="absolute right-2 top-full z-20 mt-1.5 w-32 rounded-lg border border-border bg-white/95 p-1 shadow-xl"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setRenameTarget({ id: node.id, name: node.label, type: "folder" });
                        setRenameName(node.label);
                        setRenameError(null);
                        setOpenMenuNode(null);
                      }}
                      className="flex w-full items-center rounded-md px-3 py-2 text-left text-sm transition hover:bg-muted/50"
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
                      className="flex w-full items-center rounded-md px-3 py-2 text-left text-sm text-destructive transition hover:bg-muted/50"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
          {isOpen && (
            <div className="space-y-1 pl-1">
              {creatingFolderInline && folderInsertionParent === node.id && renderFolderInlineForm()}
              {creatingNoteInline && noteInsertionParent === node.id && renderNoteInlineForm()}
              {node.children?.map((child, index) => renderNode(child, depth + 1, index === 0))}
            </div>
          )}
        </div>
      );
    }

    const isActive = activeNoteId === node.id;

    return (
      <div key={node.id} className={dividerClass}>
        <div
          className={`group relative flex w-full items-center gap-1.5 rounded-md px-2 py-0.5 text-[0.8rem] transition ${
            isActive ? "bg-muted/40 text-foreground" : "bg-white/70 text-muted-foreground hover:bg-muted/40"
          }`}
          style={{ paddingLeft: `${notePadding}px` }}
        >
          {depth > 0 && (
            <span
              aria-hidden
              className="pointer-events-none absolute top-0.5 bottom-0.5 w-px bg-border/40"
              style={{ left: `${noteGuide}px` }}
            />
          )}
          <Link
            href={node.meta?.href ?? "#"}
            className="flex flex-1 items-center gap-2"
            scroll={false}
          >
            <FileIcon />
            <span className="flex-1 truncate text-sm font-medium text-foreground">{node.label}</span>
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
            className="rounded-full border border-transparent p-0.5 text-[10px] text-muted-foreground transition hover:border-border/60 hover:bg-white/80 hover:text-foreground"
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
              className="absolute right-2 top-full z-20 mt-1.5 w-32 rounded-lg border border-border bg-white/95 p-1 shadow-xl"
            >
              <button
                type="button"
                onClick={() => {
                  setRenameTarget({ id: node.id, name: node.label, type: "note" });
                  setRenameName(node.label);
                  setRenameError(null);
                  setOpenMenuNode(null);
                }}
                className="flex w-full items-center rounded-md px-3 py-2 text-left text-sm transition hover:bg-muted/50"
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
                className="flex w-full items-center rounded-md px-3 py-2 text-left text-sm text-destructive transition hover:bg-muted/50"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <aside className="rounded-[22px] border border-white/70 bg-white/85 shadow-[0_18px_40px_rgba(15,23,42,0.12)] backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-t-[22px] border-b border-border/40 bg-gradient-to-r from-white via-accent-soft/20 to-white px-3.5 py-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.35em] text-muted-foreground">Collection</p>
          <p className="text-sm font-semibold text-foreground">{title ?? "Folders"}</p>
        </div>
        <div className="flex gap-2 text-[11px] font-semibold uppercase tracking-widest">
          <button
            type="button"
            onClick={() => {
              if (folderLoading || creatingFolderInline) return;
              beginFolderCreation();
            }}
            className="rounded-full border border-border/60 bg-white/70 px-2.5 py-0.5 text-muted-foreground transition hover:border-accent/60 hover:text-foreground"
          >
            + Folder
          </button>
          <button
            type="button"
            onClick={() => {
              if (noteLoading || creatingNoteInline) return;
              beginNoteCreation();
            }}
            className="rounded-full border border-border/60 bg-white/70 px-2.5 py-0.5 text-muted-foreground transition hover:border-accent/60 hover:text-foreground"
          >
            + Note
          </button>
        </div>
      </div>
      <div className="max-h-[65vh] overflow-y-auto px-1.5 py-2 space-y-1">
        {creatingFolderInline && !folderInsertionParent && renderFolderInlineForm()}
        {creatingNoteInline && !noteInsertionParent && renderNoteInlineForm()}
        {nodes.map((node, index) => renderNode(node, 0, index === 0))}
      </div>
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
    </aside>
  );
}

function FolderIcon({ open }: { open: boolean }) {
  return (
    <span className="flex h-5 w-5 items-center justify-center text-[11px] text-accent">
      {open ? "📂" : "📁"}
    </span>
  );
}

function FileIcon() {
  return (
    <span className="flex h-5 w-5 items-center justify-center text-[11px] text-muted-foreground">
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
      <div className="w-full max-w-5xl rounded-2xl border border-border bg-background p-8 shadow-2xl">
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
