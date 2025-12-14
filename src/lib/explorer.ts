import type { ExplorerNode } from "@/components/explorer-tree";
import type { Folder, Note } from "./types";

type BuildExplorerOptions = {
  getNoteHref?: (note: Note) => string;
};

export function buildExplorerTree(
  collectionId: string,
  collectionName: string,
  folders: Folder[],
  notes: Note[],
  options?: BuildExplorerOptions,
): ExplorerNode[] {
  const resolveNoteHref =
    options?.getNoteHref ??
    ((note: Note) => `/notes/${note.id}`);
  type FolderNode = ExplorerNode & { type: "folder"; children: ExplorerNode[] };

  const folderNodes = new Map<string, FolderNode>();

  folders.forEach((folder) => {
    folderNodes.set(folder.id, {
      id: folder.id,
      label: folder.name,
      type: "folder",
      children: [],
    });
  });

  const roots: ExplorerNode[] = [];

  folders.forEach((folder) => {
    const node = folderNodes.get(folder.id)!;
    if (folder.parentFolderId && folderNodes.has(folder.parentFolderId)) {
      folderNodes.get(folder.parentFolderId)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  notes.forEach((note) => {
    const noteNode: ExplorerNode = {
      id: note.id,
      label: note.title,
      type: "note",
      meta: {
        href: resolveNoteHref(note),
        language: note.language,
      },
    };

    if (note.folderId && folderNodes.has(note.folderId)) {
      folderNodes.get(note.folderId)!.children.push(noteNode);
    } else {
      roots.push(noteNode);
    }
  });

  const explorerRoot: FolderNode = {
    id: `collection-${collectionId}`,
    label: collectionName,
    type: "folder",
    children: roots,
    meta: {
      badge: `${notes.length} notes`,
      isRoot: true,
    },
  };

  annotateFolderCounts(explorerRoot);

  return [explorerRoot];
}

function annotateFolderCounts(node: ExplorerNode): number {
  if (node.type === "note") {
    return 1;
  }

  const total =
    node.children?.reduce((sum, child) => sum + annotateFolderCounts(child), 0) ?? 0;

  node.meta = {
    ...node.meta,
    badge: total === 1 ? "1 note" : `${total} notes`,
  };

  return total;
}
