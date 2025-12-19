import type { ReactNode } from "react";
import Link from "next/link";
import { AccountMenu } from "@/components/account-menu";

const mainNav = [
  { name: "Dashboard", href: "/" },
  { name: "Collection", href: "/collections" },
];

function AppHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-white/60 bg-white/80 shadow-[0_10px_35px_rgba(15,23,42,0.08)] backdrop-blur-xl">
      <div className="mx-auto flex h-20 w-full max-w-6xl items-center justify-between gap-6 px-6">
        <div className="flex items-center gap-6">
          <span className="select-none text-xl font-semibold uppercase tracking-[0.15em] text-muted-foreground">
            CodeStash
          </span>
          <nav className="hidden items-center gap-1 text-sm text-muted-foreground md:flex">
            {mainNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full px-3 py-1 transition hover:bg-muted/70"
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-end gap-4">
          <div className="flex w-full max-w-xs items-center gap-2 rounded-full border border-white/70 bg-white/70 px-4 py-2 text-sm text-muted-foreground shadow-inner shadow-white">
            <span className="text-xs font-semibold text-muted-foreground/70">⌘K</span>
            <input
              type="search"
              placeholder="Jump to collection"
              className="w-full bg-transparent text-foreground placeholder:text-muted-foreground outline-none"
            />
          </div>
          <div className="hidden items-center gap-4 text-sm md:flex">
            <AccountMenu initials="KK" />
          </div>
        </div>
      </div>
    </header>
  );
}

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-app text-foreground">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -right-40 top-[-10%] h-96 w-96 rounded-full bg-[radial-gradient(circle,_rgba(99,102,241,0.18),_transparent_60%)] blur-3xl" />
        <div className="absolute -left-32 top-40 h-72 w-72 rounded-full bg-[radial-gradient(circle,_rgba(14,165,233,0.18),_transparent_55%)] blur-3xl" />
        <div className="absolute inset-x-0 bottom-[-30%] h-[300px] bg-gradient-to-t from-white/80 via-white/30 to-transparent" />
      </div>
      <AppHeader />
      <main className="relative z-10 mx-auto w-full max-w-[1750px] px-6 py-6 lg:px-12">
        <div className="rounded-[28px] border border-white/60 bg-white/75 p-5 shadow-[0_40px_110px_rgba(15,23,42,0.14)] backdrop-blur-xl">
          {children}
        </div>
      </main>
    </div>
  );
}
