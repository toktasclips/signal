export type UserRole = "USER" | "ADMIN" | "SUPER_ADMIN";

export interface UserProfile {
  id: string;
  userId: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthUser {
  id: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
}

export type ActionState<T = void> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data?: T; message?: string }
  | { status: "error"; error: string; fieldErrors?: Record<string, string[]> };
