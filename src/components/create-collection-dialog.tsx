"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/client-api";

export function CreateCollectionDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    setOpen(false);
    setError(null);
    setName("");
    setDescription("");
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      setError("名前を入力してください");
      return;
    }
    try {
      setLoading(true);
      const response = await apiFetch("/api/collections", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
        }),
      });
      if (!response.ok) {
        throw new Error("failed");
      }
      close();
      router.refresh();
    } catch (err) {
      console.error(err);
      setError("コレクションの作成に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md border border-border px-4 py-2 text-sm font-medium"
      >
        New
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg border border-border bg-background p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">New Collection</p>
              </div>
              <button
                type="button"
                onClick={close}
                className="text-sm text-muted-foreground transition hover:text-foreground"
              >
                ✕
              </button>
            </div>

            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="text-xs uppercase tracking-wide text-muted-foreground">Name</label>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="mt-2 w-full rounded-md border border-border bg-transparent p-2 text-sm outline-none focus:border-foreground"
                  placeholder="eg. Gateway API"
                  maxLength={80}
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-muted-foreground">Description</label>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  className="mt-2 w-full rounded-md border border-border bg-transparent p-2 text-sm outline-none focus:border-foreground"
                  rows={3}
                  placeholder="eg. Edge proxy and authentication pipeline"
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <div className="flex justify-end gap-2 text-sm">
                <button
                  type="button"
                  onClick={close}
                  className="rounded-md border border-border px-4 py-2 text-muted-foreground"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-md bg-foreground px-4 py-2 font-medium text-background disabled:opacity-60"
                >
                  {loading ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
