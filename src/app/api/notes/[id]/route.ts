import { NextRequest, NextResponse } from "next/server";
import { getServerApiBase } from "@/lib/server-api";

async function proxyRequest(path: string, init?: RequestInit) {
  const response = await fetch(path, {
    cache: "no-store",
    ...init,
  });

  const body = await response.text();
  const headers = new Headers({
    "content-type": response.headers.get("content-type") ?? "application/json",
  });

  return new NextResponse(body, {
    status: response.status,
    headers,
  });
}

function buildUpstreamUrl(id: string) {
  const base = getServerApiBase();
  return `${base}/notes/${id}`;
}

function forwardHeaders(request: NextRequest) {
  const headers: Record<string, string> = {
    accept: "application/json",
    "content-type": "application/json",
  };

  const auth = request.headers.get("authorization");
  if (auth) {
    headers.authorization = auth;
  }

  return headers;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const url = buildUpstreamUrl(params.id);
  try {
    return await proxyRequest(url);
  } catch (error) {
    console.error("Failed to fetch note", error);
    return NextResponse.json({ error: "Upstream fetch failed" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const url = buildUpstreamUrl(params.id);
  const body = await request.text();

  try {
    return await proxyRequest(url, {
      method: "PATCH",
      headers: forwardHeaders(request),
      body,
    });
  } catch (error) {
    console.error("Failed to patch note", error);
    return NextResponse.json({ error: "Upstream update failed" }, { status: 500 });
  }
}
