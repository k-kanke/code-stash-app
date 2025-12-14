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
  const [{ id }, currentSearchParams] = await Promise.all([params, searchParams]);

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
      <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">{collection.name}</h1>
            <p className="text-muted-foreground">{collection.description}</p>
          </div>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <div>
              <p className="text-xs uppercase tracking-wide">Notes</p>
              <p className="text-lg font-semibold text-foreground">{collection.noteCount}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide">Updated</p>
              <p>{new Date(collection.updatedAt).toLocaleDateString("ja-JP")}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-3 xl:col-span-2">
          <ExplorerTree
            nodes={explorerNodes}
            selectedFolderId={selectedFolderForTree?.id}
            activeNoteId={activeNote?.id}
            collectionId={collection.id}
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
    <div className="space-y-4">
      <header className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="text-[11px] text-muted-foreground">
          {breadcrumb.concat(note.title).join(" / ")}
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold leading-tight">{note.title}</h2>
          </div>
          <div className="flex gap-6 text-[10px] uppercase tracking-wide text-muted-foreground">
            <p>
              <span className="text-[9px]">Created</span>{" "}
              <span className="text-foreground">{formatDate(note.createdAt)}</span>
            </p>
            <p>
              <span className="text-[9px]">Updated</span>{" "}
              <span className="text-foreground">{formatDate(note.updatedAt)}</span>
            </p>
          </div>
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          {note.tags.length > 0 ? (
            note.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground"
              >
                {tag}
              </span>
            ))
          ) : (
            <span className="text-[11px] text-muted-foreground">タグはまだありません</span>
          )}
        </div>
      </header>

      <div className="grid gap-4 xl:grid-cols-12">
        <section className="space-y-4 xl:col-span-8">
          <CodeViewer code={note.code} language={note.language} noteId={note.id} />
        </section>

        <aside className="xl:col-span-4">
          <NoteComments noteId={note.id} initialComments={comments} />
        </aside>
      </div>
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

function formatDate(value?: string) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("ja-JP");
}
