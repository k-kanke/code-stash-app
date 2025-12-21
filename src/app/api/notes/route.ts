import { NextResponse } from "next/server";
import { getServerApiBase } from "@/lib/server-api";
import { getAuthTokenFromCookies } from "@/lib/auth-cookie";

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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  if (searchParams.get("resource") !== "comments") {
    return NextResponse.json({ error: "Unsupported operation" }, { status: 400 });
  }

  const noteId = searchParams.get("noteId")?.trim();
  if (!noteId) {
    return NextResponse.json({ error: "noteId is required" }, { status: 400 });
  }

  try {
    const token = await getAuthTokenFromCookies();
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(`${getServerApiBase()}/api/note/${noteId}/comments`);
    const upstream = await fetch(url, {
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const text = await upstream.text();

    if (!upstream.ok) {
      return NextResponse.json(
        { error: text || "Failed to fetch comments" },
        { status: upstream.status },
      );
    }

    return new NextResponse(text || "[]", {
      status: upstream.status,
      headers: {
        "content-type": upstream.headers.get("content-type") ?? "application/json",
      },
    });
  } catch (error) {
    console.error("Failed to fetch comments", error);
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const resource = searchParams.get("resource");

  if (resource === "comment") {
    const noteId = searchParams.get("noteId")?.trim();
    if (!noteId) {
      return NextResponse.json({ error: "noteId is required" }, { status: 400 });
    }

    try {
      const token = await getAuthTokenFromCookies();
      if (!token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const body = await request.json();
      const parentCommentId =
        typeof body?.parentCommentId === "string" && body.parentCommentId.trim().length > 0
          ? body.parentCommentId.trim()
          : undefined;
      const url = new URL(`${getServerApiBase()}/api/note/${noteId}/comments`);
      const upstream = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          body: body?.body ?? "",
          lineStart: body?.lineStart ?? null,
          lineEnd: body?.lineEnd ?? null,
          parentCommentId,
        }),
      });
      const text = await upstream.text();
      if (!upstream.ok) {
        return NextResponse.json(
          { error: text || "Failed to create comment" },
          { status: upstream.status },
        );
      }
      return new NextResponse(text, {
        status: upstream.status,
        headers: {
          "content-type": upstream.headers.get("content-type") ?? "application/json",
        },
      });
    } catch (error) {
      console.error("Failed to create comment", error);
      return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
    }
  }

  try {
    const token = await getAuthTokenFromCookies();
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    const upstream = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
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
      let errorMessage = message || "Failed to create note";
      try {
        const parsed = JSON.parse(message);
        if (typeof parsed?.error === "string" && parsed.error.trim().length > 0) {
          errorMessage = parsed.error;
        }
      } catch {
        // ignore JSON parse errors and fall back to raw text
      }
      return NextResponse.json(
        { error: errorMessage },
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

export async function PATCH(request: Request) {
  const { searchParams } = new URL(request.url);
  const resource = searchParams.get("resource");

  if (resource === "comment") {
    const commentId = searchParams.get("commentId")?.trim();
    if (!commentId) {
      return NextResponse.json({ error: "commentId is required" }, { status: 400 });
    }

    try {
      const body = await request.json();
      const payload: Record<string, unknown> = {};
      if (typeof body?.body === "string") {
        payload.body = body.body;
      }
      if (typeof body?.lineStart === "number" || body?.lineStart === null) {
        payload.lineStart = body.lineStart;
      }
      if (typeof body?.lineEnd === "number" || body?.lineEnd === null) {
        payload.lineEnd = body.lineEnd;
      }
      if (typeof body?.resolved === "boolean") {
        payload.resolved = body.resolved;
      }

      if (Object.keys(payload).length === 0) {
        return NextResponse.json({ error: "update payload is empty" }, { status: 400 });
      }

      const token = await getAuthTokenFromCookies();
      if (!token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const url = new URL(`${getServerApiBase()}/api/comments/${commentId}`);

      const upstream = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      const text = await upstream.text();
      if (!upstream.ok) {
        return NextResponse.json(
          { error: text || "Failed to update comment" },
          { status: upstream.status },
        );
      }

      return new NextResponse(text, {
        status: upstream.status,
        headers: {
          "content-type": upstream.headers.get("content-type") ?? "application/json",
        },
      });
    } catch (error) {
      console.error("Failed to update comment", error);
      return NextResponse.json({ error: "Failed to update comment" }, { status: 500 });
    }
  }

  try {
    const token = await getAuthTokenFromCookies();
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const noteId = typeof body?.noteId === "string" ? body.noteId.trim() : "";
    if (!noteId) {
      return NextResponse.json({ error: "noteId is required" }, { status: 400 });
    }

    const payload: Record<string, unknown> = {};
    if (typeof body?.code === "string") {
      payload.code = body.code;
    }
    if (typeof body?.title === "string") {
      payload.title = body.title;
    }
    if (typeof body?.language === "string") {
      payload.language = body.language;
    }
    if (typeof body?.note === "string") {
      payload.note = body.note;
    }
    if (Array.isArray(body?.tags)) {
      payload.tags = body.tags;
    }

    if (Object.keys(payload).length === 0) {
      return NextResponse.json({ error: "update payload is empty" }, { status: 400 });
    }

    const url = new URL(`${getServerApiBase()}/api/note/${noteId}`);
    const upstream = await fetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!upstream.ok) {
      const message = await upstream.text();
      return NextResponse.json(
        { error: message || "Failed to update note" },
        { status: upstream.status },
      );
    }

    return NextResponse.json({ status: "updated" }, { status: 200 });
  } catch (error) {
    console.error("Failed to update note", error);
    return NextResponse.json({ error: "Failed to update note" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const resource = searchParams.get("resource");

  if (resource === "comment") {
    const commentId = searchParams.get("commentId")?.trim();
    if (!commentId) {
      return NextResponse.json({ error: "commentId is required" }, { status: 400 });
    }

    try {
      const token = await getAuthTokenFromCookies();
      if (!token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const url = new URL(`${getServerApiBase()}/api/comments/${commentId}`);
      const upstream = await fetch(url, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!upstream.ok) {
        const text = await upstream.text();
        return NextResponse.json(
          { error: text || "Failed to delete comment" },
          { status: upstream.status },
        );
      }
      return NextResponse.json({ status: "deleted" }, { status: 200 });
    } catch (error) {
      console.error("Failed to delete comment", error);
      return NextResponse.json({ error: "Failed to delete comment" }, { status: 500 });
    }
  }

  if (resource === "note") {
    try {
      const token = await getAuthTokenFromCookies();
      if (!token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const body = await request.json().catch(() => null);
      const noteId = typeof body?.noteId === "string" ? body.noteId.trim() : "";
      if (!noteId) {
        return NextResponse.json({ error: "noteId is required" }, { status: 400 });
      }

      const url = new URL(`${getServerApiBase()}/api/note/${noteId}`);
      const upstream = await fetch(url, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!upstream.ok) {
        const text = await upstream.text();
        return NextResponse.json(
          { error: text || "Failed to delete note" },
          { status: upstream.status },
        );
      }
      return NextResponse.json({ status: "deleted" }, { status: 200 });
    } catch (error) {
      console.error("Failed to delete note", error);
      return NextResponse.json({ error: "Failed to delete note" }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Unsupported operation" }, { status: 400 });
}
