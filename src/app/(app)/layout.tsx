import type { ReactNode } from "react";
import Link from "next/link";

const mainNav = [
  { name: "Dashboard", href: "/" },
  { name: "Collection", href: "/collections" },
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
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-xs font-semibold">
              KK
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-app text-foreground">
      <AppHeader />
      <main className="mx-auto w-full max-w-[1920px] px-6 py-10 lg:px-14">{children}</main>
    </div>
  );
}
