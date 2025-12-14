import type { Collection, Folder, Note, NoteComment } from "./types";
import { getServerApiBase } from "./server-api";

type RawCollection = {
  id: string;
  name: string;
  description?: string;
  note_count: number;
  created_at: string;
  updated_at: string;
};

type RawFolder = {
  id: string;
  collection_id: string;
  parent_folder_id: string | null;
  name: string;
};

type RawNoteSummary = {
  id: string;
  collection_id?: string;
  folder_id?: string | null;
  title: string;
  language: string;
  tags: string[];
  snippet?: string;
  updated_at?: string;
};

type RawNoteDetail = {
  id: string;
  collection_id: string;
  folder_id: string | null;
  title: string;
  language: string;
  tags: string[];
  code: string;
  note: string;
  created_at: string;
  updated_at: string;
};

type RawNoteComment = {
  id: string;
  noteId: string;
  authorId: string;
  body: string;
  lineStart?: number | null;
  lineEnd?: number | null;
  parentCommentId?: string | null;
  resolved: boolean;
  createdAt: string;
  updatedAt: string;
};

function getUserId() {
  return (
    process.env.NEXT_PUBLIC_MOCK_USER_ID ??
    process.env.NEXT_PUBLIC_USER_ID ??
    process.env.USER_ID ??
    "11111111-1111-1111-1111-111111111111"
  );
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const url = new URL(`${getServerApiBase()}${path}`);
  url.searchParams.set("user_id", getUserId());

  const response = await fetch(url, {
    cache: "no-store",
    ...init,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${path}`);
  }

  return (await response.json()) as T;
}

function mapCollection(data: RawCollection): Collection {
  return {
    id: data.id,
    name: data.name,
    description: data.description ?? "",
    noteCount: data.note_count ?? 0,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

function mapFolder(data: RawFolder): Folder {
  return {
    id: data.id,
    collectionId: data.collection_id,
    parentFolderId: data.parent_folder_id,
    name: data.name,
  };
}

function mapNoteSummary(data: RawNoteSummary, collectionId?: string): Note {
  return {
    id: data.id,
    collectionId: data.collection_id ?? collectionId ?? "",
    folderId: data.folder_id ?? null,
    title: data.title,
    language: data.language,
    tags: data.tags ?? [],
    code: "",
    note: data.snippet ?? "",
    createdAt: data.updated_at ?? "",
    updatedAt: data.updated_at ?? "",
  };
}

function mapNoteDetail(data: RawNoteDetail): Note {
  return {
    id: data.id,
    collectionId: data.collection_id,
    folderId: data.folder_id,
    title: data.title,
    language: data.language,
    tags: data.tags ?? [],
    code: data.code,
    note: data.note,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

function mapNoteComment(data: RawNoteComment): NoteComment {
  return {
    id: data.id,
    noteId: data.noteId,
    authorId: data.authorId,
    body: data.body,
    lineStart: data.lineStart ?? undefined,
    lineEnd: data.lineEnd ?? undefined,
    parentCommentId: data.parentCommentId ?? undefined,
    resolved: data.resolved,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

export async function fetchCollections(): Promise<Collection[]> {
  const data = await request<RawCollection[]>("/api/collections");
  return data.map(mapCollection);
}

export async function fetchCollectionById(id: string): Promise<Collection> {
  const data = await request<RawCollection>(`/api/collections/${id}`);
  return mapCollection(data);
}

export async function fetchFoldersByCollection(id: string): Promise<Folder[]> {
  const data = await request<RawFolder[]>(`/api/collections/${id}/folders`);
  return data.map(mapFolder);
}

export async function fetchNotesByCollection(id: string): Promise<Note[]> {
  const data = await request<RawNoteSummary[]>(`/api/collections/${id}/notes`);
  return data.map((note) => mapNoteSummary(note, id));
}

export async function fetchNoteById(id: string): Promise<Note> {
  const data = await request<RawNoteDetail>(`/api/note/${id}`);
  return mapNoteDetail(data);
}

export async function fetchNoteComments(noteId: string): Promise<NoteComment[]> {
  const data = await request<RawNoteComment[]>(`/api/note/${noteId}/comments`);
  return data.map(mapNoteComment);
}

export async function createCollection(input: { name: string; description?: string }) {
  const data = await request<RawCollection>("/api/collections", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
  return mapCollection(data);
}
