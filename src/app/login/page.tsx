"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Mode = "login" | "register";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isRegister = mode === "register";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (isRegister && !name.trim()) {
      setError("名前を入力してください");
      return;
    }
    if (!email.trim() || !password) {
      setError("メールアドレスとパスワードを入力してください");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode,
          name: name.trim(),
          email: email.trim(),
          password,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(
          data?.error ?? (isRegister ? "登録に失敗しました" : "ログインに失敗しました"),
        );
      }

      const nextParam = searchParams.get("next");
      const destination = sanitizeNext(nextParam);
      router.replace(destination);
      router.refresh();
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : isRegister
            ? "登録に失敗しました"
            : "ログインに失敗しました",
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(isRegister ? "login" : "register");
    setError(null);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-app px-4 py-12">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 shadow-lg">
        <div className="mb-8 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Welcome to</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">CodeStash</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {isRegister ? "新規登録してCode Reading Roomへ" : "Code Reading Room へようこそ"}
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          {isRegister && (
            <div className="space-y-2">
              <label
                htmlFor="name"
                className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
              >
                Name
              </label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
                value={name}
                onChange={(event) => setName(event.target.value)}
                disabled={loading}
                placeholder="Your name"
              />
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="email" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={loading}
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="password"
              className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete={isRegister ? "new-password" : "current-password"}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={loading}
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-foreground px-4 py-2 text-sm font-semibold text-background transition disabled:opacity-60"
          >
            {loading ? "Processing..." : isRegister ? "Sign up" : "Sign in"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          {isRegister ? "Already have an account?" : "Don’t have an account yet?"}
          <button
            type="button"
            onClick={toggleMode}
            className="ml-1 font-semibold text-blue-600 hover:underline"
            disabled={loading}
          >
            {isRegister ? "Sign in" : "Sign up"}
          </button>
        </div>
      </div>
    </div>
  );
}

function sanitizeNext(nextParam: string | null): string {
  if (!nextParam) {
    return "/";
  }
  if (!nextParam.startsWith("/")) {
    return "/";
  }
  return nextParam;
}
