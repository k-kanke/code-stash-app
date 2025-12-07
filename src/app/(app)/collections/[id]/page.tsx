import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getCollectionById,
  getFoldersByCollection,
  getNotesByCollection,
} from "@/lib/mock-data";
import type { Folder } from "@/lib/types";

export default async function CollectionDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const collection = await getCollectionById(id);

  if (!collection) {
    notFound();
  }

  const [collectionFolders, collectionNotes] = await Promise.all([
    getFoldersByCollection(id),
    getNotesByCollection(id),
  ]);

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
        <FolderTree folders={collectionFolders} />
        <NoteList notes={collectionNotes} />
      </div>
    </div>
  );
}

type FolderNode = Folder & { children: FolderNode[] };

function buildFolderTree(folders: Folder[]): FolderNode[] {
  const nodes: Record<string, FolderNode> = {};
  const roots: FolderNode[] = [];

  folders.forEach((folder) => {
    nodes[folder.id] = { ...folder, children: [] };
  });

  Object.values(nodes).forEach((node) => {
    if (node.parentFolderId && nodes[node.parentFolderId]) {
      nodes[node.parentFolderId].children.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

function FolderTree({ folders }: { folders: Folder[] }) {
  const tree = buildFolderTree(folders);

  return (
    <aside className="w-full rounded-lg border border-border bg-card p-4 shadow-sm lg:w-72">
      <header className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <span>Folders</span>
        <span className="text-[10px]">Explorer</span>
      </header>
      <div className="mt-4 space-y-1 text-sm">
        <button className="flex w-full items-center rounded-md px-2 py-1 text-left font-medium text-foreground transition hover:bg-muted">
          / (root)
        </button>
        {tree.map((node) => (
          <FolderTreeItem key={node.id} node={node} depth={0} />
        ))}
      </div>
    </aside>
  );
}

function FolderTreeItem({ node, depth }: { node: FolderNode; depth: number }) {
  return (
    <div>
      <button
        className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-muted-foreground transition hover:bg-muted"
        style={{ paddingLeft: `${depth * 12 + 16}px` }}
      >
        <span className="text-xs text-muted-foreground/70">▸</span>
        {node.name}
      </button>
      {node.children.length > 0 && (
        <div>
          {node.children.map((child) => (
            <FolderTreeItem key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

function NoteList({
  notes,
}: {
  notes: Awaited<ReturnType<typeof getNotesByCollection>>;
}) {
  if (notes.length === 0) {
    return (
      <section className="flex-1 rounded-lg border border-dashed border-border/60 p-6 text-sm text-muted-foreground">
        ノートがまだありません。
      </section>
    );
  }

  return (
    <section className="flex-1 rounded-lg border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b border-border px-6 py-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Explorer
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
            className="grid grid-cols-[1fr,120px,100px] items-center gap-4 px-6 py-3 text-sm transition hover:bg-muted/40"
          >
            <div>
              <p className="font-medium text-foreground">{note.title}</p>
              <p className="text-xs text-muted-foreground">{note.tags.join(", ")}</p>
            </div>
            <p className="text-xs text-muted-foreground">{note.language}</p>
            <p className="text-right text-xs text-muted-foreground">
              {new Date(note.updatedAt).toLocaleDateString("ja-JP")}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
