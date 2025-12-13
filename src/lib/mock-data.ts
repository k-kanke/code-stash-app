import type { Collection, Folder, Note } from "./types";

export const collections: Collection[] = [
  {
    id: "collection-gateway",
    name: "Gateway API",
    description: "Edge proxy + auth pipeline for all microservices.",
    noteCount: 18,
    createdAt: "2024-04-11T10:00:00Z",
    updatedAt: "2025-01-18T07:00:00Z",
  },
  {
    id: "collection-mobile",
    name: "Mobile UI Kit",
    description: "Shared React Native snippets and telemetry hooks.",
    noteCount: 26,
    createdAt: "2024-07-02T10:00:00Z",
    updatedAt: "2025-01-07T07:00:00Z",
  },
  {
    id: "collection-ml",
    name: "ML Toolkit",
    description: "Prompt templates, evaluation harnesses, and scripts.",
    noteCount: 33,
    createdAt: "2024-01-14T10:00:00Z",
    updatedAt: "2024-12-20T07:00:00Z",
  },
];

export const folders: Folder[] = [
  {
    id: "folder-root-gateway",
    collectionId: "collection-gateway",
    parentFolderId: null,
    name: "src",
  },
  {
    id: "folder-auth",
    collectionId: "collection-gateway",
    parentFolderId: "folder-root-gateway",
    name: "auth",
  },
  {
    id: "folder-hooks",
    collectionId: "collection-mobile",
    parentFolderId: null,
    name: "hooks",
  },
  {
    id: "folder-shaders",
    collectionId: "collection-ml",
    parentFolderId: null,
    name: "evaluation",
  },
];

export const notes: Note[] = [
  {
    id: "note-1",
    collectionId: "collection-gateway",
    folderId: "folder-auth",
    title: "JWT exchange handler",
    language: "TypeScript",
    tags: ["auth", "edge"],
    code: `export async function exchangeToken(input: ExchangeInput) {\n  const payload = await verify(input.accessToken);\n  return issue({\n    sub: payload.sub,\n    aud: "internal",\n    scope: payload.scope,\n  });\n}`,
    note: "Handles the service-to-service token exchange for short lived sessions.",
    createdAt: "2024-05-01T07:00:00Z",
    updatedAt: "2024-11-19T07:00:00Z",
  },
  {
    id: "note-1a",
    collectionId: "collection-gateway",
    folderId: "folder-auth",
    title: "Refresh token rotator",
    language: "TypeScript",
    tags: ["auth", "rotation"],
    code: `export function rotate(refresh: string) {\n  const decoded = decode(refresh);\n  if (!decoded?.sub) throw new Error("invalid");\n  return issueRefresh(decoded.sub, decoded.scope);\n}`,
    note: "Rotates long lived refresh tokens and invalidates the previous record.",
    createdAt: "2024-05-13T07:00:00Z",
    updatedAt: "2024-10-12T07:00:00Z",
  },
  {
    id: "note-1b",
    collectionId: "collection-gateway",
    folderId: "folder-auth",
    title: "mTLS enforcement middleware",
    language: "Go",
    tags: ["mutual-tls", "security"],
    code: `func EnforceMTLS(next http.Handler) http.Handler {\n  return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {\n    if r.TLS == nil || len(r.TLS.PeerCertificates) == 0 {\n      w.WriteHeader(http.StatusUnauthorized)\n      return\n    }\n    next.ServeHTTP(w, r)\n  })\n}`,
    note: "Rejects requests missing peer certificates before hitting the auth pipeline.",
    createdAt: "2024-03-28T07:00:00Z",
    updatedAt: "2024-08-19T07:00:00Z",
  },
  {
    id: "note-1c",
    collectionId: "collection-gateway",
    folderId: "folder-auth",
    title: "Role hydration hook",
    language: "TypeScript",
    tags: ["rbac"],
    code: `export function withRoles(req: Request, roles: string[]) {\n  const claims = req.headers.get("x-claims");\n  if (!claims) return false;\n  return roles.every((role) => claims.includes(role));\n}`,
    note: "Ensures downstream handlers have the correct RBAC context.",
    createdAt: "2024-09-05T07:00:00Z",
    updatedAt: "2024-12-01T07:00:00Z",
  },
  {
    id: "note-1d",
    collectionId: "collection-gateway",
    folderId: "folder-auth",
    title: "Blacklisted token cache",
    language: "TypeScript",
    tags: ["edge", "redis"],
    code: `const cache = new LRU<string, number>({ max: 10_000 });\n\nexport function isRevoked(jti: string) {\n  return cache.get(jti) ?? false;\n}\n\nexport function addRevocation(jti: string) {\n  cache.set(jti, Date.now());\n}`,
    note: "Keeps revoked JWT IDs in memory to short-circuit repeated checks.",
    createdAt: "2024-05-30T07:00:00Z",
    updatedAt: "2024-12-11T07:00:00Z",
  },
  {
    id: "note-4",
    collectionId: "collection-gateway",
    folderId: "folder-root-gateway",
    title: "Edge middleware registry",
    language: "TypeScript",
    tags: ["edge", "router"],
    code: `export const middleware = {\n  auth: () => import("./auth"),\n  cache: () => import("./cache"),\n  metrics: () => import("./metrics"),\n};`,
    note: "Dynamic import map that lets us lazy load edge middleware per route.",
    createdAt: "2024-04-21T07:00:00Z",
    updatedAt: "2024-09-17T07:00:00Z",
  },
  {
    id: "note-5",
    collectionId: "collection-gateway",
    folderId: "folder-root-gateway",
    title: "Request timeline tracer",
    language: "TypeScript",
    tags: ["observability"],
    code: `export function trace(request: Request, span: Span) {\n  span.setAttribute("route", request.url);\n  span.setAttribute("method", request.method);\n  span.end();\n}`,
    note: "Minimal timeline tracer used to feed the reading room activity panel.",
    createdAt: "2024-05-09T07:00:00Z",
    updatedAt: "2024-11-01T07:00:00Z",
  },
  {
    id: "note-2",
    collectionId: "collection-mobile",
    folderId: "folder-hooks",
    title: "useTimelineSync",
    language: "TypeScript",
    tags: ["hooks", "sync"],
    code: `export const useTimelineSync = (id: string) => {\n  const query = useQuery({\n    queryKey: ["timeline", id],\n    queryFn: () => fetchTimeline(id),\n  });\n  useEffect(() => {\n    const sub = socket.channel(id).on("event", query.refetch);\n    return () => sub.unsubscribe();\n  }, [id]);\n  return query;\n};`,
    note: "Keeps the playback timeline synced with collaborative edits.",
    createdAt: "2024-06-18T07:00:00Z",
    updatedAt: "2024-12-04T07:00:00Z",
  },
  {
    id: "note-3",
    collectionId: "collection-ml",
    folderId: "folder-shaders",
    title: "Evaluate prompts",
    language: "Python",
    tags: ["evaluation", "cli"],
    code: `def evaluate_prompt(prompt: str, suite: list[str]):\n    for case in suite:\n        yield llm.run(prompt.format(case=case)).grade()`,
    note: "Quick script to run regression tests on prompts.",
    createdAt: "2024-02-10T07:00:00Z",
    updatedAt: "2024-12-29T07:00:00Z",
  },
];

export async function getCollections() {
  return collections;
}

export async function getCollectionById(id: string) {
  return collections.find((c) => c.id === id) ?? null;
}

export async function getFoldersByCollection(collectionId: string) {
  return folders.filter((folder) => folder.collectionId === collectionId);
}

export async function getNotesByCollection(collectionId: string) {
  return notes.filter((note) => note.collectionId === collectionId);
}

export async function getNoteById(id: string) {
  return notes.find((note) => note.id === id) ?? null;
}
