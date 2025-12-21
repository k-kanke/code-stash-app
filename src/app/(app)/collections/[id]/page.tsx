import Link from "next/link";
import { notFound } from "next/navigation";
import { ExplorerTree } from "@/components/explorer-tree";
import { CodeViewer } from "@/components/code-viewer";
import { NoteComments } from "@/components/note-comments";
import {
  fetchCollectionById,
  fetchFoldersByCollection,
  fetchNotesByCollection,
  fetchNoteById,
  fetchNoteComments,
} from "@/lib/api";
import type { Folder, Note, NoteComment } from "@/lib/types";
import { buildExplorerTree } from "@/lib/explorer";

export default async function CollectionDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { id } = await params;
  const currentSearchParams = await searchParams;

  const requestedFolderId =
    typeof currentSearchParams.folder === "string" ? currentSearchParams.folder : undefined;
  const requestedNoteId =
    typeof currentSearchParams.note === "string" ? currentSearchParams.note : undefined;

  const notePromise: Promise<Note | null> = requestedNoteId
    ? fetchNoteById(requestedNoteId).catch(() => null)
    : Promise.resolve<Note | null>(null);

  const [collection, collectionFolders, collectionNotes, fetchedNote] = await Promise.all([
    fetchCollectionById(id),
    fetchFoldersByCollection(id),
    fetchNotesByCollection(id),
    notePromise,
  ]);

  if (!collection) {
    notFound();
  }

  const folderMap = new Map(collectionFolders.map((folder) => [folder.id, folder]));
  const basePath = `/collections/${collection.id}`;
  const activeNote =
    fetchedNote && fetchedNote.collectionId === collection.id ? fetchedNote : null;
  let noteComments: NoteComment[] = [];
  if (activeNote) {
    noteComments = await fetchNoteComments(activeNote.id);
  }

  const selectedFolderFromQuery =
    requestedFolderId && folderMap.has(requestedFolderId)
      ? folderMap.get(requestedFolderId)
      : undefined;
  const selectedFolderForTree =
    selectedFolderFromQuery ?? (activeNote?.folderId ? folderMap.get(activeNote.folderId) : undefined);
  const explorerNodes = buildExplorerTree(
    collection.id,
    collection.name,
    collectionFolders,
    collectionNotes,
    {
      getNoteHref: (note) => buildNoteHref(basePath, note),
    },
  );

  const childFolders = getChildFolders(collectionFolders, selectedFolderFromQuery?.id);
  const folderNotes = getFolderNotes(collectionNotes, selectedFolderFromQuery?.id);

  const listingBreadcrumb = buildBreadcrumb(selectedFolderFromQuery, folderMap, collection.name);
  const noteBreadcrumb = buildBreadcrumb(
    activeNote?.folderId ? folderMap.get(activeNote.folderId) : undefined,
    folderMap,
    collection.name,
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-3 xl:col-span-2">
          <ExplorerTree
            nodes={explorerNodes}
            selectedFolderId={selectedFolderForTree?.id}
            activeNoteId={activeNote?.id}
            collectionId={collection.id}
            title={collection.name}
          />
        </div>
        <div className="lg:col-span-9 xl:col-span-10">
          {activeNote ? (
            <NoteDetailPanel note={activeNote} breadcrumb={noteBreadcrumb} comments={noteComments} />
          ) : (
            <FolderOverview
              basePath={basePath}
              breadcrumbs={listingBreadcrumb}
              folder={selectedFolderFromQuery}
              folders={childFolders}
              notes={folderNotes}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function FolderOverview({
  basePath,
  breadcrumbs,
  folder,
  folders,
  notes,
}: {
  basePath: string;
  breadcrumbs: string[];
  folder?: Folder;
  folders: Folder[];
  notes: Note[];
}) {
  const hasItems = folders.length > 0 || notes.length > 0;
  return (
    <section className="rounded-lg border border-border bg-card shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-4">
        <p className="text-sm text-muted-foreground">{breadcrumbs.join(" / ")}</p>
        <div className="text-xs text-muted-foreground">
          {folders.length} folders · {notes.length} notes
        </div>
      </div>
      {hasItems ? (
        <ul className="divide-y divide-border/60">
          {folders.map((item) => (
            <li key={`folder-${item.id}`}>
              <Link
                href={buildFolderHref(basePath, item.id)}
                className="flex items-center gap-3 px-6 py-4 text-sm text-foreground transition hover:bg-muted/40"
              >
                <span className="text-lg" aria-hidden>
                  📁
                </span>
                <p className="flex-1 font-medium leading-tight">{item.name}</p>
              </Link>
            </li>
          ))}
          {notes.map((note) => (
            <li key={`note-${note.id}`}>
              <Link
                href={buildNoteHref(basePath, note)}
                className="flex items-center gap-3 px-6 py-4 text-sm text-foreground transition hover:bg-muted/40"
              >
                <span className="text-lg" aria-hidden>
                  📄
                </span>
                <p className="flex-1 font-medium leading-tight">{note.title}</p>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="p-6 text-sm text-muted-foreground">
          {folder ? "このフォルダにはまだコンテンツがありません。" : "フォルダを作成してノートを整理しましょう。"}
        </div>
      )}
    </section>
  );
}

function NoteDetailPanel({
  note,
  breadcrumb,
  comments,
}: {
  note: Note;
  breadcrumb: string[];
  comments: NoteComment[];
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-12">
      <section className="space-y-4 rounded-lg border border-border bg-card p-4 shadow-sm xl:col-span-8">
        <CodeViewer code={note.code} language={note.language} noteId={note.id} />
      </section>

      <aside className="rounded-lg border border-border bg-card p-4 shadow-sm xl:col-span-4">
        <div className="mb-3 text-[11px] uppercase tracking-widest text-muted-foreground">
          {breadcrumb.concat(note.title).join(" / ")}
        </div>
        <NoteComments noteId={note.id} initialComments={comments} />
      </aside>
    </div>
  );
}

function getChildFolders(folders: Folder[], parentId?: string) {
  return folders
    .filter((folder) =>
      parentId ? folder.parentFolderId === parentId : !folder.parentFolderId,
    )
    .sort((a, b) => a.name.localeCompare(b.name));
}

function getFolderNotes(notes: Note[], folderId?: string) {
  return notes
    .filter((note) => {
      if (folderId) {
        return note.folderId === folderId;
      }
      return !note.folderId;
    })
    .sort((a, b) => a.title.localeCompare(b.title));
}

function buildFolderHref(basePath: string, folderId?: string) {
  if (!folderId) return basePath;
  const params = new URLSearchParams();
  params.set("folder", folderId);
  return `${basePath}?${params.toString()}`;
}

function buildNoteHref(basePath: string, note: Note) {
  const params = new URLSearchParams();
  params.set("note", note.id);
  if (note.folderId) {
    params.set("folder", note.folderId);
  }
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

function buildBreadcrumb(
  folder: Folder | undefined,
  folderMap: Map<string, Folder>,
  rootLabel: string,
) {
  const segments: string[] = [];
  let current = folder;
  while (current) {
    segments.push(current.name);
    current = current.parentFolderId ? folderMap.get(current.parentFolderId) : undefined;
  }
  segments.push(rootLabel);
  return segments.reverse();
}
