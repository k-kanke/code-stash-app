export function getAppBaseUrl() {
  const fromEnv =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null);

  const base = fromEnv ?? "http://localhost:3000";
  return base.replace(/\/$/, "");
}
