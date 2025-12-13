export function getServerApiBase() {
  const base = process.env.CODE_STASH_SERVER_URL;
  console.log("debug", base)
  if (!base) {
    throw new Error("CODE_STASH_SERVER_URL is not set. Configure it in your environment.");
  }
  return base.replace(/\/$/, "");
}
