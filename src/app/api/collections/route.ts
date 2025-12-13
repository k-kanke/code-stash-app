import { NextResponse } from "next/server";
import { getServerApiBase } from "@/lib/server-api";

export async function GET() {
  const base = getServerApiBase();
  const url = `${base}/collections`;

  try {
    const upstream = await fetch(url, { cache: "no-store" });
    const body = await upstream.text();
    return new NextResponse(body, {
      status: upstream.status,
      headers: {
        "content-type": upstream.headers.get("content-type") ?? "application/json",
      },
    });
  } catch (error) {
    console.error("Failed to fetch collections", error);
    return NextResponse.json({ error: "Upstream fetch failed" }, { status: 500 });
  }
}
