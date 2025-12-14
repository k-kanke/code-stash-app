import { NextResponse } from "next/server";
import { getServerApiBase } from "@/lib/server-api";
import { getAuthTokenFromCookies } from "@/lib/auth-cookie";

export async function POST(request: Request) {
  const requestUrl = new URL(request.url);
  const resource = requestUrl.searchParams.get("resource");

  if (resource === "folder") {
    return handleFolderCreation(request);
  }

  return handleCollectionCreation(request);
}

export async function DELETE(request: Request) {
  const requestUrl = new URL(request.url);
  const resource = requestUrl.searchParams.get("resource");

  if (resource !== "folder") {
    return NextResponse.json(
      { error: "Unsupported delete operation" },
      { status: 400 },
    );
  }

  return handleFolderDeletion(request);
}

export async function PATCH(request: Request) {
  const requestUrl = new URL(request.url);
  const resource = requestUrl.searchParams.get("resource");

  if (resource !== "folder") {
    return NextResponse.json(
      { error: "Unsupported update operation" },
      { status: 400 },
    );
  }

  return handleFolderRename(request);
}

async function handleCollectionCreation(request: Request) {
  try {
    const token = await getAuthTokenFromCookies();
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const descriptionInput =
      typeof body?.description === "string" ? body.description.trim() : undefined;
    const description = descriptionInput ? descriptionInput : undefined;

    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    const url = new URL(`${getServerApiBase()}/api/collections`);

    const upstream = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name, description }),
    });

    return formatUpstreamResponse(upstream, "Failed to create collection");
  } catch (error) {
    console.error("Failed to create collection", error);
    return NextResponse.json(
      { error: "Failed to create collection" },
      { status: 500 },
    );
  }
}

async function handleFolderCreation(request: Request) {
  try {
    const token = await getAuthTokenFromCookies();
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const collectionId =
      typeof body?.collectionId === "string" ? body.collectionId.trim() : "";
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const parentFolderId =
      typeof body?.parentFolderId === "string" && body.parentFolderId.length > 0
        ? body.parentFolderId
        : undefined;

    if (!collectionId) {
      return NextResponse.json({ error: "collectionId is required" }, { status: 400 });
    }

    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    const url = new URL(`${getServerApiBase()}/api/collections/${collectionId}/folders`);

    const upstream = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name,
        parent_folder_id: parentFolderId ?? null,
      }),
    });

    return formatUpstreamResponse(upstream, "Failed to create folder");
  } catch (error) {
    console.error("Failed to create folder", error);
    return NextResponse.json({ error: "Failed to create folder" }, { status: 500 });
  }
}

async function handleFolderDeletion(request: Request) {
  try {
    const token = await getAuthTokenFromCookies();
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const collectionId =
      typeof body?.collectionId === "string" ? body.collectionId.trim() : "";
    const folderId =
      typeof body?.folderId === "string" ? body.folderId.trim() : "";

    if (!collectionId) {
      return NextResponse.json(
        { error: "collectionId is required" },
        { status: 400 },
      );
    }

    if (!folderId) {
      return NextResponse.json(
        { error: "folderId is required" },
        { status: 400 },
      );
    }

    const url = new URL(
      `${getServerApiBase()}/api/collections/${collectionId}/folders/${folderId}`,
    );

    const upstream = await fetch(url, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!upstream.ok) {
      const message = await upstream.text();
      return NextResponse.json(
        { error: message || "Failed to delete folder" },
        { status: upstream.status },
      );
    }

    return new NextResponse(null, { status: upstream.status });
  } catch (error) {
    console.error("Failed to delete folder", error);
    return NextResponse.json(
      { error: "Failed to delete folder" },
      { status: 500 },
    );
  }
}

async function handleFolderRename(request: Request) {
  try {
    const token = await getAuthTokenFromCookies();
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const collectionId =
      typeof body?.collectionId === "string" ? body.collectionId.trim() : "";
    const folderId =
      typeof body?.folderId === "string" ? body.folderId.trim() : "";
    const name = typeof body?.name === "string" ? body.name.trim() : "";

    if (!collectionId) {
      return NextResponse.json(
        { error: "collectionId is required" },
        { status: 400 },
      );
    }

    if (!folderId) {
      return NextResponse.json(
        { error: "folderId is required" },
        { status: 400 },
      );
    }

    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    const url = new URL(
      `${getServerApiBase()}/api/collections/${collectionId}/folders/${folderId}`,
    );

    const upstream = await fetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name }),
    });

    if (!upstream.ok) {
      const message = await upstream.text();
      return NextResponse.json(
        { error: message || "Failed to rename folder" },
        { status: upstream.status },
      );
    }

    return new NextResponse(null, { status: upstream.status });
  } catch (error) {
    console.error("Failed to rename folder", error);
    return NextResponse.json(
      { error: "Failed to rename folder" },
      { status: 500 },
    );
  }
}

async function formatUpstreamResponse(upstream: Response, fallback: string) {
  if (!upstream.ok) {
    const message = await upstream.text();
    return NextResponse.json(
      { error: message || fallback },
      { status: upstream.status },
    );
  }

  const text = await upstream.text();
  if (!text) {
    return NextResponse.json({ status: "created" }, { status: upstream.status });
  }

  try {
    const data = JSON.parse(text);
    return NextResponse.json(data, { status: upstream.status });
  } catch (error) {
    console.warn("Failed to parse upstream response", error);
    return NextResponse.json({ status: "created" }, { status: upstream.status });
  }
}
