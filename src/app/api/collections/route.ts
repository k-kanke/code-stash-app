import { NextResponse } from "next/server";
import { getServerApiBase } from "@/lib/server-api";

function resolveUserId() {
  const userId =
    process.env.NEXT_PUBLIC_MOCK_USER_ID;
  if (!userId) {
    throw new Error("NEXT_PUBLIC_MOCK_USER_ID is not set");
  }
  return userId;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const descriptionInput =
      typeof body?.description === "string" ? body.description.trim() : undefined;
    const description = descriptionInput ? descriptionInput : undefined;

    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    const url = new URL(`${getServerApiBase()}/api/collections`);
    url.searchParams.set("user_id", resolveUserId());

    const upstream = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, description }),
    });

    if (!upstream.ok) {
      const errorMessage = await upstream.text();
      return NextResponse.json(
        { error: errorMessage || "Failed to create collection" },
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
      console.warn("Failed to parse upstream response", parseError);
      return NextResponse.json({ status: "created" }, { status: 201 });
    }
  } catch (error) {
    console.error("Failed to create collection", error);
    return NextResponse.json(
      { error: "Failed to create collection" },
      { status: 500 },
    );
  }
}
