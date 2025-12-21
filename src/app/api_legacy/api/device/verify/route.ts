import { NextResponse } from "next/server";
import { getServerApiBase } from "@/lib/server-api";
import { getAuthTokenFromCookies } from "@/lib/auth-cookie";

async function forwardRequest(
  path: string,
  options: RequestInit,
  token: string,
): Promise<NextResponse> {
  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${getServerApiBase()}${path}`, {
    ...options,
    headers,
  });

  const text = await response.text();
  let payload: unknown = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    return NextResponse.json(payload ?? { error: "verification_failed" }, { status: response.status });
  }

  return NextResponse.json(payload ?? {}, { status: response.status });
}

export async function GET(request: Request) {
  const token = await getAuthTokenFromCookies();
  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const userCode = url.searchParams.get("user_code")?.trim();
  if (!userCode) {
    return NextResponse.json({ error: "user_code_required" }, { status: 400 });
  }

  return forwardRequest(`/oauth/device/verify?user_code=${encodeURIComponent(userCode)}`, { method: "GET" }, token);
}

export async function POST(request: Request) {
  const token = await getAuthTokenFromCookies();
  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const userCode =
    typeof body?.user_code === "string"
      ? body.user_code.trim()
      : "";

  if (!userCode) {
    return NextResponse.json({ error: "user_code_required" }, { status: 400 });
  }

  return forwardRequest(
    "/oauth/device/verify",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ user_code: userCode }),
    },
    token,
  );
}
