import Link from "next/link";
import { fetchCollections } from "@/lib/api";
import { CreateCollectionDialog } from "@/components/create-collection-dialog";

const filters = ["All", "Pinned", "Recently updated", "Shared"];

export default async function CollectionsPage() {
  const allCollections = await fetchCollections();

  return (
    <div className="flex flex-col gap-8 lg:flex-row">
      <aside className="w-full rounded-[32px] border border-white/70 bg-white/80 p-5 shadow-[0_25px_70px_rgba(15,23,42,0.12)] lg:w-64">
        <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-muted-foreground">
          Filters
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          {filters.map((filter) => (
            <button
              key={filter}
              className="rounded-full border border-border/70 bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground transition hover:border-accent/60 hover:text-foreground"
            >
              {filter}
            </button>
          ))}
        </div>
        <div className="mt-6 space-y-2 text-sm">
          <label className="block text-[11px] uppercase tracking-widest text-muted-foreground">
            Sort by
          </label>
          <select className="w-full rounded-2xl border border-border/70 bg-white/70 p-2 text-sm text-foreground">
            <option>Recently updated</option>
            <option>Alphabetical</option>
          </select>
        </div>
      </aside>

      <section className="flex-1">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.35em] text-muted-foreground">
              Collections
            </p>
          </div>
          <CreateCollectionDialog />
        </header>

        <div className="mt-6 overflow-hidden rounded-[28px] border border-white/70 bg-white/90 shadow-[0_24px_60px_rgba(15,23,42,0.12)]">
          <div className="grid grid-cols-[1.3fr,2.7fr] border-b border-border/70 bg-gradient-to-r from-white via-muted/40 to-white px-5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            <span>Title</span>
            <span>Details</span>
          </div>
          <div className="divide-y divide-border/60">
            {allCollections.map((collection) => (
              <Link
                key={collection.id}
                href={`/collections/${collection.id}`}
                className="grid grid-cols-[1.3fr,2.7fr] items-center gap-4 px-5 py-1.5 text-[0.88rem] transition hover:bg-white"
              >
                <p className="text-base font-semibold text-foreground">{collection.name}</p>
                <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
                  <span className="flex-1 min-w-[200px] leading-tight">{collection.description}</span>
                  <span className="text-[11px] uppercase tracking-wide">
                    更新 {new Date(collection.updatedAt).toLocaleDateString("ja-JP")} · {collection.noteCount} files
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
