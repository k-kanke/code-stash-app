"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type AccountMenuProps = {
  initials?: string;
};

export function AccountMenu({ initials = "KK" }: AccountMenuProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const toggle = () => {
    setError(null);
    setOpen((prev) => !prev);
  };

  const handleLogout = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/auth/login", {
        method: "DELETE",
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? "Failed to logout");
      }
      setOpen(false);
      router.replace("/login");
      router.refresh();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to logout");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-xs font-semibold transition hover:bg-muted"
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {initials}
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-2 w-48 rounded-md border border-border bg-card p-2 text-sm shadow-lg">
          <button
            type="button"
            onClick={handleLogout}
            disabled={loading}
            className="flex w-full items-center justify-between rounded px-3 py-2 text-left text-foreground transition hover:bg-muted disabled:opacity-60"
          >
            Logout
            {loading && <span className="text-xs text-muted-foreground">…</span>}
          </button>
          {error && <p className="px-3 pt-1 text-xs text-destructive">{error}</p>}
        </div>
      )}
    </div>
  );
}
