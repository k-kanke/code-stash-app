import type { Collection } from "./types";
import { getServerApiBase } from "./server-api";

function getUserId() {
  const userId =
    process.env.NEXT_PUBLIC_USER_ID ??
    process.env.USER_ID ??
    "11111111-1111-1111-1111-111111111111";
  return userId;
}

export async function fetchCollections(): Promise<Collection[]> {
  const url = new URL(`${getServerApiBase()}/api/collections`);
  url.searchParams.set("user_id", getUserId());

  const response = await fetch(url, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error("Failed to fetch collections");
  }
  return response.json();
}
