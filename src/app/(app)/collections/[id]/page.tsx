import Link from "next/link";
import { notFound } from "next/navigation";
import { ExplorerTree, type ExplorerNode } from "@/components/explorer-tree";
import {
  getCollectionById,
  getFoldersByCollection,
  getNotesByCollection,
} from "@/lib/mock-data";
import type { Folder, Note } from "@/lib/types";

export default async function CollectionDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const [{ id }, currentSearchParams] = await Promise.all([params, searchParams]);
  const collection = await getCollectionById(id);

  if (!collection) {
    notFound();
  }

  const [collectionFolders, collectionNotes] = await Promise.all([
    getFoldersByCollection(id),
    getNotesByCollection(id),
  ]);
  const folderMap = new Map(collectionFolders.map((folder) => [folder.id, folder]));
  const requestedFolderId =
    typeof currentSearchParams.folder === "string" ? currentSearchParams.folder : undefined;
  const fallbackFolderId = requestedFolderId ?? collectionFolders[0]?.id ?? undefined;
  const selectedFolder = fallbackFolderId ? folderMap.get(fallbackFolderId) : undefined;
  const filteredNotes = fallbackFolderId
    ? collectionNotes.filter((note) => note.folderId === fallbackFolderId)
    : collectionNotes;
  const explorerNodes = buildExplorerTree(
    collection.id,
    collection.name,
    collectionFolders,
    collectionNotes,
  );

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          Collection
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">{collection.name}</h1>
            <p className="text-muted-foreground">{collection.description}</p>
          </div>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <div>
              <p className="text-xs uppercase tracking-wide">Notes</p>
              <p className="text-lg font-semibold text-foreground">
                {collection.noteCount}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide">Updated</p>
              <p>{new Date(collection.updatedAt).toLocaleDateString("ja-JP")}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="lg:w-80 xl:w-96">
          <ExplorerTree nodes={explorerNodes} selectedFolderId={fallbackFolderId} />
        </div>
        <div className="flex-1">
          <NoteList notes={filteredNotes} folder={selectedFolder} />
        </div>
      </div>
    </div>
  );
}

function NoteList({ notes, folder }: { notes: Note[]; folder?: Folder }) {
  if (notes.length === 0) {
    return (
      <section className="flex-1 rounded-lg border border-dashed border-border/60 p-6 text-sm text-muted-foreground">
        選択中フォルダにはまだノートがありません。
      </section>
    );
  }

  return (
    <section className="flex-1 rounded-lg border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b border-border px-6 py-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {folder ? folder.name : "Notes"}
          </p>
          <p className="text-sm text-muted-foreground">
            {notes.length} files
          </p>
        </div>
        <button className="rounded-md border border-border px-3 py-1 text-xs">
          新しいノート
        </button>
      </div>
      <div className="divide-y divide-border/60">
        {notes.map((note) => (
          <Link
            key={note.id}
            href={`/notes/${note.id}`}
            className="block px-6 py-4 transition hover:bg-muted/40"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-foreground">{note.title}</p>
                <p className="text-xs text-muted-foreground">
                  {note.tags.join(", ")}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1 text-xs text-muted-foreground">
                <span className="rounded-full border border-border px-2 py-0.5 uppercase tracking-wide">
                  {note.language}
                </span>
                <span>
                  更新: {new Date(note.updatedAt).toLocaleDateString("ja-JP")}
                </span>
              </div>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              {note.note}
            </p>
            <pre className="mt-3 overflow-x-auto rounded-md bg-muted/50 p-3 text-[12px] text-muted-foreground">
              {note.code.split("\n").slice(0, 5).join("\n")}
            </pre>
          </Link>
        ))}
      </div>
    </section>
  );
}

function buildExplorerTree(
  collectionId: string,
  collectionName: string,
  folders: Folder[],
  notes: Note[],
): ExplorerNode[] {
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
        href: `/notes/${note.id}`,
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
