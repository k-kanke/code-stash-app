import Link from "next/link";
import { notFound } from "next/navigation";
import { ExplorerTree } from "@/components/explorer-tree";
import { CodeViewer } from "@/components/code-viewer";
import { NoteComments } from "@/components/note-comments";
import {
  fetchCollectionById,
  fetchFoldersByCollection,
  fetchNoteById,
  fetchNotesByCollection,
  fetchNoteComments,
} from "@/lib/api";
import { buildExplorerTree } from "@/lib/explorer";

export default async function NoteDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const [{ id }, currentSearchParams] = await Promise.all([params, searchParams]);
  const note = await fetchNoteById(id);

  if (!note) {
    notFound();
  }

  const [collection, folders, collectionNotes, noteComments] = await Promise.all([
    fetchCollectionById(note.collectionId),
    fetchFoldersByCollection(note.collectionId),
    fetchNotesByCollection(note.collectionId),
    fetchNoteComments(note.id),
  ]);

  const explorerNodes = buildExplorerTree(
    note.collectionId,
    collection?.name ?? "Collection",
    folders,
    collectionNotes,
  );

  const selectedFolderId =
    typeof currentSearchParams.folder === "string"
      ? currentSearchParams.folder
      : note.folderId ?? undefined;

  return (
    <article className="space-y-6">
      <header className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <Link href="/collections" className="hover:underline">
            Collections
          </Link>
          <span>/</span>
          {collection ? (
            <Link href={`/collections/${collection.id}`} className="hover:underline">
              {collection.name}
            </Link>
          ) : (
            <span>Unknown</span>
          )}
          <span>/</span>
          <span>{note.title}</span>
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold leading-tight">{note.title}</h1>
          </div>
          <div className="flex gap-6 text-[10px] uppercase tracking-wide text-muted-foreground">
            <p>
              <span className="text-[9px]">Created</span>{" "}
              <span className="text-foreground">
                {new Date(note.createdAt).toLocaleDateString("ja-JP")}
              </span>
            </p>
            <p>
              <span className="text-[9px]">Updated</span>{" "}
              <span className="text-foreground">
                {new Date(note.updatedAt).toLocaleDateString("ja-JP")}
              </span>
            </p>
          </div>
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          {note.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-12 xl:grid-cols-12">
        <div className="lg:col-span-2">
          <ExplorerTree
            nodes={explorerNodes}
            activeNoteId={note.id}
            selectedFolderId={selectedFolderId}
            collectionId={collection?.id ?? note.collectionId}
          />
        </div>

        <section className="space-y-4 lg:col-span-7 xl:col-span-7">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            <span>Code</span>
            <span className="text-muted-foreground/70">Read only</span>
          </div>
          <CodeViewer code={note.code} language={note.language} noteId={note.id} />
        </section>

        <aside className="lg:col-span-3 xl:col-span-3">
          <NoteComments noteId={note.id} initialComments={noteComments} />
        </aside>
      </div>
    </article>
  );
}
