"use client";

import { FormEvent, useMemo, useState } from "react";

type DeviceCodeStatus = {
  client_name: string;
  client_id: string;
  scope: string[];
  status: string;
  expires_at: string;
};

type Props = {
  initialUserCode?: string;
};

type FetchMode = "GET" | "POST";

export function DeviceVerificationForm({ initialUserCode = "" }: Props) {
  const [userCode, setUserCode] = useState(initialUserCode);
  const [status, setStatus] = useState<DeviceCodeStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [approved, setApproved] = useState(false);

  const normalizedCode = useMemo(() => userCode.trim(), [userCode]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await handleRequest("POST");
  };

  const handleCheckStatus = async () => {
    await handleRequest("GET");
  };

  const handleRequest = async (mode: FetchMode) => {
    if (!normalizedCode) {
      setError("ユーザーコードを入力してください");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setApproved(false);

      const endpoint =
        mode === "GET"
          ? `/api/device/verify?user_code=${encodeURIComponent(normalizedCode)}`
          : "/api/device/verify";

      const response = await fetch(endpoint, {
        method: mode,
        headers:
          mode === "POST"
            ? {
                "Content-Type": "application/json",
              }
            : undefined,
        body: mode === "POST" ? JSON.stringify({ user_code: normalizedCode }) : undefined,
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const message = resolveErrorMessage(data?.error);
        throw new Error(message);
      }

      setStatus(data as DeviceCodeStatus);
      setApproved(mode === "POST");
    } catch (err) {
      console.error("Failed to verify device code", err);
      setStatus(null);
      setError(err instanceof Error ? err.message : "デバイスの認証に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label htmlFor="user-code" className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          ユーザーコード
        </label>
        <input
          id="user-code"
          value={userCode}
          onChange={(event) => setUserCode(event.target.value)}
          className="w-full rounded-md border border-border bg-background px-4 py-3 text-lg font-mono tracking-widest outline-none focus:border-foreground"
          placeholder="123456"
          autoComplete="one-time-code"
          maxLength={32}
          disabled={loading}
        />
        <p className="text-xs text-muted-foreground">CLI に表示された 6 桁のコードを入力してください。</p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {status && (
        <div className="rounded-lg border border-border bg-card/60 p-4 text-sm text-muted-foreground">
          <p>
            クライアント: <span className="font-medium text-foreground">{status.client_name}</span>
          </p>
          <p className="mt-1">状態: {translateStatus(status.status, approved)}</p>
          <p className="mt-1">
            期限: {new Date(status.expires_at).toLocaleString("ja-JP")}
          </p>
          {approved && (
            <p className="mt-2 text-foreground">承認が完了しました。CLI に戻って処理を続けてください。</p>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleCheckStatus}
          disabled={loading}
          className="flex-1 rounded-md border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:border-foreground disabled:opacity-50"
        >
          コード状況を確認
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 rounded-md bg-foreground px-4 py-2 text-sm font-semibold text-background transition disabled:opacity-60"
        >
          デバイスを許可
        </button>
      </div>
    </form>
  );
}

function resolveErrorMessage(code?: string) {
  switch (code) {
    case "user_code_required":
      return "ユーザーコードを入力してください。";
    case "invalid_user_code":
      return "ユーザーコードが正しくありません。";
    case "expired_token":
      return "このコードの有効期限が切れています。CLI で再度コードを発行してください。";
    case "already_processed":
      return "このコードはすでに使用されています。CLI で新しいコードを発行してください。";
    default:
      return "デバイスの確認に失敗しました。";
  }
}

function translateStatus(status: string, approved: boolean) {
  if (approved || status === "approved") {
    return "承認済み";
  }
  switch (status) {
    case "pending":
      return "未承認";
    case "expired":
      return "期限切れ";
    case "denied":
      return "拒否済み";
    default:
      return "不明";
  }
}
