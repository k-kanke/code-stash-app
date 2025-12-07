import type { ReactNode } from "react";
import Link from "next/link";

const mainNav = [
  { name: "ダッシュボード", href: "/" },
  { name: "コレクション", href: "/collections" },
  { name: "ノート", href: "/notes/alpha" },
];

const sidebarNav = [
  { section: "Workspace", items: ["Overview", "Insights", "Activity"] },
  {
    section: "Collections",
    items: ["Pinned", "Archive", "Shared"],
  },
];

function AppHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-card/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-6">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-semibold tracking-tight">
            CodeStash
          </Link>
          <nav className="hidden items-center gap-4 text-sm text-muted-foreground md:flex">
            {mainNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-2 py-1 transition hover:bg-muted"
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-end gap-4">
          <div className="flex w-full max-w-xs items-center rounded-md border border-border bg-card px-3 py-1 text-sm shadow-sm">
            <input
              type="search"
              placeholder="Jump to collection"
              className="w-full bg-transparent outline-none"
            />
          </div>
          <div className="hidden items-center gap-4 text-sm md:flex">
            <button className="rounded-md border border-border px-3 py-1">
              作成
            </button>
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-xs font-semibold">
              KK
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function Sidebar() {
  return (
    <aside className="hidden w-64 border-r border-border bg-muted/40 px-4 py-6 text-sm text-muted-foreground lg:block">
      {sidebarNav.map((section) => (
        <div key={section.section} className="mb-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground/80">
            {section.section}
          </p>
          <div className="space-y-1">
            {section.items.map((item) => (
              <button
                key={item}
                className="flex w-full items-center justify-between rounded-md px-2 py-1 text-left transition hover:bg-muted"
              >
                {item}
                <span className="text-[10px] text-muted-foreground/70">···</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </aside>
  );
}

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-app text-foreground">
      <AppHeader />
      <div className="mx-auto flex w-full max-w-6xl gap-6 px-6 py-10">
        <Sidebar />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
