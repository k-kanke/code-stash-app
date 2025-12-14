"use client";

import { useMemo, useState } from "react";
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
}: {
  nodes: ExplorerNode[];
  activeNoteId?: string;
  selectedFolderId?: string;
}) {
  const initialOpen = useMemo(() => collectFolderIds(nodes), [nodes]);
  const [openIds, setOpenIds] = useState(initialOpen);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

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
      <div className="flex items-center justify-between border-b border-border px-4 py-3 text-xs uppercase tracking-wide text-muted-foreground">
        <span>Explorer</span>
        <span className="text-[10px] text-muted-foreground/80">GitHub view</span>
      </div>
      <div className="space-y-1 p-2">{nodes.map((node) => renderNode(node))}</div>
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
