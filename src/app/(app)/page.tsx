import Link from "next/link";
import { fetchCollections, fetchNotesByCollection } from "@/lib/api";

export default async function DashboardPage() {
  const collections = await fetchCollections();
  const notesByCollection = await Promise.all(
    collections.map(async (collection) => {
      try {
        return await fetchNotesByCollection(collection.id);
      } catch {
        return [];
      }
    }),
  );
  const allNotes = notesByCollection.flat();

  const latestCollections = [...collections]
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )
    .slice(0, 4);
  const recentNotes = [...allNotes]
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )
    .slice(0, 3);

  return (
    <div className="space-y-8">
      <section className="rounded-4xl border border-white/70 bg-white/85 p-6 shadow-[0_30px_80px_rgba(15,23,42,0.12)]">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.35em] text-muted-foreground">
              Code Collections
            </p>
            <p className="text-2xl font-semibold text-foreground">お気に入りの断片</p>
          </div>
          <Link
            href="/collections"
            className="rounded-full border border-border/70 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground transition hover:border-accent/60 hover:text-foreground"
          >
            View all
          </Link>
        </header>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {latestCollections.map((collection) => (
            <Link
              key={collection.id}
              href={`/collections/${collection.id}`}
              className="group rounded-2xl border border-white/70 bg-linear-to-br from-white via-accent-soft/40 to-white p-5 text-left shadow-[0_15px_45px_rgba(15,23,42,0.1)] transition hover:-translate-y-0.5 hover:border-accent/40"
            >
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                {new Date(collection.updatedAt).toLocaleDateString("ja-JP")}
              </p>
              <h2 className="mt-2 text-xl font-semibold group-hover:text-foreground">
                {collection.name}
              </h2>
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

      <section className="rounded-4xl border border-white/70 bg-white/85 p-5 shadow-[0_30px_80px_rgba(15,23,42,0.12)]">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.35em] text-muted-foreground">
              Drafts
            </p>
            <h2 className="text-lg font-semibold">最近のノート</h2>
          </div>
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
              <span className="rounded-full border border-border/70 bg-white/70 px-3 py-1 text-xs text-muted-foreground">
                {new Date(note.updatedAt).toLocaleDateString("ja-JP")}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
