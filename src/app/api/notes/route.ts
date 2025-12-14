import { NextResponse } from "next/server";
import { getServerApiBase } from "@/lib/server-api";
import { getRequestUserId } from "@/lib/request-user";

type IncomingTags = string[] | string | undefined;

function normalizeTags(tags: IncomingTags): string[] {
  if (Array.isArray(tags)) {
    return tags
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);
  }

  if (typeof tags === "string") {
    return tags
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);
  }

  return [];
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const collectionId =
      typeof body?.collectionId === "string" ? body.collectionId.trim() : "";
    const folderId =
      typeof body?.folderId === "string" && body.folderId.length > 0
        ? body.folderId
        : undefined;
    const title = typeof body?.title === "string" ? body.title.trim() : "";
    const language = typeof body?.language === "string" ? body.language.trim() : "";
    const code = typeof body?.code === "string" ? body.code : "";
    const note = typeof body?.note === "string" ? body.note : "";
    const tags = normalizeTags(body?.tags);

    if (!collectionId) {
      return NextResponse.json({ error: "collectionId is required" }, { status: 400 });
    }
    if (!title) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }
    if (!language) {
      return NextResponse.json({ error: "language is required" }, { status: 400 });
    }
    if (!code) {
      return NextResponse.json({ error: "code is required" }, { status: 400 });
    }

    const url = new URL(`${getServerApiBase()}/api/collections/${collectionId}/notes`);
    url.searchParams.set("user_id", getRequestUserId());

    const upstream = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        folder_id: folderId ?? null,
        title,
        language,
        tags,
        code,
        note,
      }),
    });

    if (!upstream.ok) {
      const message = await upstream.text();
      return NextResponse.json(
        { error: message || "Failed to create note" },
        { status: upstream.status },
      );
    }

    const text = await upstream.text();
    if (!text) {
      return NextResponse.json({ status: "created" }, { status: 201 });
    }

    try {
      const data = JSON.parse(text);
      return NextResponse.json(data, { status: upstream.status });
    } catch (parseError) {
      console.warn("Failed to parse note response", parseError);
      return NextResponse.json({ status: "created" }, { status: 201 });
    }
  } catch (error) {
    console.error("Failed to create note", error);
    return NextResponse.json({ error: "Failed to create note" }, { status: 500 });
  }
}
