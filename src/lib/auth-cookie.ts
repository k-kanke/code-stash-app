import { cookies } from "next/headers";

export const AUTH_COOKIE = "codestash_token";
export const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24; // 1 day

export async function getAuthTokenFromCookies(): Promise<string | null> {
  const store = await cookies();
  return store.get(AUTH_COOKIE)?.value ?? null;
}
