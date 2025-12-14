import { cookies } from "next/headers";

export const AUTH_COOKIE = "codestash_token";
export const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24; // 1 day

const isProduction = process.env.NODE_ENV === "production";

export async function getAuthTokenFromCookies(): Promise<string | null> {
  const store = await cookies();
  return store.get(AUTH_COOKIE)?.value ?? null;
}

export async function setAuthCookie(token: string) {
  const store = await cookies();
  store.set({
    name: AUTH_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
    maxAge: AUTH_COOKIE_MAX_AGE,
    path: "/",
  });
}

export async function clearAuthCookie() {
  const store = await cookies();
  store.delete(AUTH_COOKIE);
}
