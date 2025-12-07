export type Collection = {
  id: string;
  name: string;
  description: string;
  noteCount: number;
  createdAt: string;
  updatedAt: string;
};

export type Folder = {
  id: string;
  collectionId: string;
  parentFolderId: string | null;
  name: string;
};

export type Note = {
  id: string;
  collectionId: string;
  folderId: string | null;
  title: string;
  language: string;
  tags: string[];
  code: string;
  note: string;
  createdAt: string;
  updatedAt: string;
};
