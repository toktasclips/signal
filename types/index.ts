export type UserRole = "USER" | "ADMIN" | "SUPER_ADMIN";

export type LeadStatus = "new" | "contacted" | "qualified" | "offer_sent" | "won" | "lost";
export type LeadTemperature = "cold" | "warm" | "hot" | "ready";
export type LeadPriority = "low" | "medium" | "high" | "urgent";

export interface Lead {
  id: string;
  user_id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  source: string | null;
  status: LeadStatus;
  temperature: LeadTemperature;
  value: number | null;
  notes: string | null;
  last_contacted_at: string | null;
  is_hot: boolean;
  priority: LeadPriority;
  follow_up_date: string | null;
  quick_note: string | null;
  created_at: string;
  updated_at: string;
}

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
