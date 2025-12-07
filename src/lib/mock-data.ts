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
