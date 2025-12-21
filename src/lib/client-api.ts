import { AUTH_COOKIE } from "./auth-constants";

function getBrowserAuthToken(): string | null {
  if (typeof document === "undefined") {
    return null;
  }
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${AUTH_COOKIE.replace(/[-[\]/{}()*+?.\\^$|]/g, "\\$&")}=([^;]*)`),
  );
  return match ? decodeURIComponent(match[1]) : null;
}

export function getPublicApiBase(): string {
  const base = process.env.NEXT_PUBLIC_CODE_STASH_SERVER_URL;
  if (!base) {
    throw new Error("NEXT_PUBLIC_CODE_STASH_SERVER_URL is not set");
  }
  return base.replace(/\/$/, "");
}

function buildHeaders(init?: HeadersInit): Headers {
  const headers = new Headers(init);
  const token = getBrowserAuthToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  return headers;
}

export async function apiFetch(path: string, init?: RequestInit) {
  const url = `${getPublicApiBase()}${path}`;
  const headers = buildHeaders(init?.headers);
  return fetch(url, {
    credentials: "include",
    ...init,
    headers,
  });
}
