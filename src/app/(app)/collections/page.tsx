import Link from "next/link";
import { getCollections } from "@/lib/mock-data";

const filters = ["All", "Pinned", "Recently updated", "Shared"];

export default async function CollectionsPage() {
  const allCollections = await getCollections();

  return (
    <div className="flex flex-col gap-8 lg:flex-row">
      <aside className="w-full rounded-lg border border-border bg-card/70 p-4 shadow-sm lg:w-64">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Filters
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          {filters.map((filter) => (
            <button
              key={filter}
              className="rounded-full border border-border px-3 py-1 text-muted-foreground transition hover:border-foreground/50"
            >
              {filter}
            </button>
          ))}
        </div>
        <div className="mt-6 space-y-2 text-sm">
          <label className="block text-xs uppercase tracking-wide text-muted-foreground">
            Sort by
          </label>
          <select className="w-full rounded-md border border-border bg-transparent p-2 text-foreground">
            <option>Recently updated</option>
            <option>Alphabetical</option>
          </select>
        </div>
      </aside>

      <section className="flex-1">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              Collections
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">
              あなたの CodeStash
            </h1>
          </div>
          <button className="rounded-md border border-border px-4 py-2 text-sm font-medium">
            新しいコレクション
          </button>
        </header>

        <div className="mt-6 rounded-lg border border-border bg-card shadow-sm">
          <div className="grid grid-cols-[2fr,1fr,120px] border-b border-border px-6 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <span>Collection</span>
            <span>Description</span>
            <span className="text-right">Notes</span>
          </div>
          <div>
            {allCollections.map((collection) => (
              <Link
                key={collection.id}
                href={`/collections/${collection.id}`}
                className="grid grid-cols-[2fr,1fr,120px] items-center px-6 py-4 text-sm transition hover:bg-muted/60"
              >
                <div>
                  <p className="font-medium text-foreground">{collection.name}</p>
                  <p className="text-xs text-muted-foreground">
                    更新: {new Date(collection.updatedAt).toLocaleDateString("ja-JP")}
                  </p>
                </div>
                <p className="text-muted-foreground">{collection.description}</p>
                <p className="text-right text-xs text-muted-foreground">
                  {collection.noteCount} files
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
