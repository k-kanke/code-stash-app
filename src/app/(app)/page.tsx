import Link from "next/link";
import { getCollections, notes } from "@/lib/mock-data";

export default async function DashboardPage() {
  const [allCollections, allNotes] = await Promise.all([
    getCollections(),
    Promise.resolve(notes),
  ]);

  const recentNotes = allNotes.slice(0, 3);

  return (
    <div className="space-y-8">
      <section>
        <header className="flex items-center justify-between">
          <div>
            <p className="text-2xl uppercase tracking-widest text-muted-foreground">
              Code Collections
            </p>
          </div>
          <Link
            href="/collections"
            className="text-sm text-blue-600 hover:underline"
          >
            すべて見る
          </Link>
        </header>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {allCollections.map((collection) => (
            <Link
              key={collection.id}
              href={`/collections/${collection.id}`}
              className="rounded-lg border border-border bg-card p-4 text-left shadow-sm transition hover:border-foreground/30"
            >
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {new Date(collection.updatedAt).toLocaleDateString("ja-JP")}
              </p>
              <h2 className="mt-1 text-lg font-semibold">{collection.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {collection.description}
              </p>
              <p className="mt-4 text-xs text-muted-foreground">
                {collection.noteCount} notes
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              Drafts
            </p>
            <h2 className="text-lg font-semibold">最近のノート</h2>
          </div>
          <Link href="/notes/note-1" className="text-sm text-blue-600 hover:underline">
            ノート一覧
          </Link>
        </header>
        <div className="mt-4 divide-y divide-border/60">
          {recentNotes.map((note) => (
            <Link
              key={note.id}
              href={`/notes/${note.id}`}
              className="flex items-center justify-between gap-4 py-4 text-sm transition hover:text-foreground"
            >
              <div>
                <p className="font-medium">{note.title}</p>
                <p className="text-muted-foreground">
                  {note.language} · {note.tags.join(", ")}
                </p>
              </div>
              <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
                {new Date(note.updatedAt).toLocaleDateString("ja-JP")}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
