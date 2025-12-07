import Link from "next/link";
import { notFound } from "next/navigation";
import { CodeViewer } from "@/components/code-viewer";
import { getCollectionById, getNoteById } from "@/lib/mock-data";

export default async function NoteDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const note = await getNoteById(id);

  if (!note) {
    notFound();
  }

  const collection = await getCollectionById(note.collectionId);

  return (
    <article className="space-y-6">
      <header className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link href="/collections" className="hover:underline">
            Collections
          </Link>
          <span>/</span>
          {collection ? (
            <Link
              href={`/collections/${collection.id}`}
              className="hover:underline"
            >
              {collection.name}
            </Link>
          ) : (
            <span>Unknown</span>
          )}
          <span>/</span>
          <span>{note.title}</span>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold leading-tight">{note.title}</h1>
            <p className="text-sm text-muted-foreground">
              Updated {new Date(note.updatedAt).toLocaleString("ja-JP")}
            </p>
          </div>
          <div className="flex gap-3 text-sm text-muted-foreground">
            <div>
              <p className="text-xs uppercase tracking-wide">Language</p>
              <p className="font-medium text-foreground">{note.language}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide">Created</p>
              <p>{new Date(note.createdAt).toLocaleDateString("ja-JP")}</p>
            </div>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {note.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
      </header>

      <CodeViewer code={note.code} language={note.language} />

      <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <header className="mb-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Memo
          </p>
          <h2 className="text-lg font-semibold">コードノート</h2>
        </header>
        <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
          <p className="whitespace-pre-line text-foreground">{note.note}</p>
        </div>
      </section>
    </article>
  );
}
