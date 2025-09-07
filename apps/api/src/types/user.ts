export type AuthUser = {
  id: string;
  displayName: string;
  email?: string | null;
  photo?: string | null;
  role?: 'USER' | 'ADMIN';
};
