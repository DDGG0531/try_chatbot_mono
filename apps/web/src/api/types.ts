export type User = {
  id: string;
  displayName: string;
  email?: string;
  photo?: string;
};

export type Conversation = {
  id: string;
  userId: string;
  title?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
};

export type Message = {
  id: string;
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  reference: string;
  createdAt: string | Date;
};

export type KnowledgeBase = {
  id: string;
  userId: string;
  name: string;
  description?: string | null;
  isPublic: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
};
