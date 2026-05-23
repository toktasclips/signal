export type UserRole = "USER" | "ADMIN" | "SUPER_ADMIN";

export type CampaignType =
  | "Instagram Ad"
  | "Workshop"
  | "YouTube"
  | "Referral"
  | "Organic Content"
  | "Webinar"
  | "Email"
  | "Other";

export type TaskStatus = "todo" | "in_progress" | "completed";

export interface Task {
  id: string;
  user_id: string;
  lead_id: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: LeadPriority;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Campaign {
  id: string;
  user_id: string;
  name: string;
  type: CampaignType;
  source: string | null;
  budget: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

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
  closed_at: string | null;
  lost_reason: string | null;
  win_note: string | null;
  campaign_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface SalesEvent {
  id: string;
  user_id: string;
  lead_id: string | null;
  task_id: string | null;
  campaign_id: string | null;
  type: string;
  title: string;
  description: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface BusinessContext {
  id: string;
  user_id: string;
  business_name: string | null;
  niche: string | null;
  offer_type: string | null;
  sales_model: string | null;
  target_audience: string | null;
  acquisition_channel: string | null;
  average_offer_value: number | null;
  sales_cycle: string | null;
  primary_goal: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface RelationshipInsight {
  id: string;
  user_id: string;
  type: string;
  title: string;
  description: string;
  recommendation: string | null;
  severity: InsightSeverity;
  is_read: boolean;
  is_dismissed: boolean;
  related_lead_id: string | null;
  related_campaign_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export type LeadHealthStatus = "high_momentum" | "healthy" | "at_risk" | "stale";

export interface LeadHealthResult {
  lead: Lead;
  health: LeadHealthStatus;
  daysSinceActivity: number;
  factors: string[];
}

export interface PipelineVelocity {
  avgDays: number;
  totalWon: number;
  fastestLead: { name: string; days: number } | null;
  slowestLead: { name: string; days: number } | null;
}

export interface CampaignStat {
  id: string;
  name: string;
  type: string;
  totalLeads: number;
  wonCount: number;
  closeRate: number;
  wonRevenue: number;
  avgDealValue: number;
  avgVelocityDays: number | null;
}

export type InsightSeverity = "info" | "warning" | "critical" | "success";

export interface Insight {
  id: string;
  user_id: string;
  type: string;
  title: string;
  description: string;
  severity: InsightSeverity;
  is_read: boolean;
  is_dismissed: boolean;
  metadata: Record<string, unknown> | null;
  created_at: string;
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

export type SemanticTagName =
  | "price_objection"
  | "timing_objection"
  | "spouse_objection"
  | "trust_objection"
  | "decision_delay"
  | "high_intent"
  | "warm_interest"
  | "passive_interest"
  | "ghosting_risk"
  | "urgent_need"
  | "positive_sentiment"
  | "neutral_sentiment"
  | "negative_sentiment";

export interface SemanticTag {
  id: string;
  user_id: string;
  lead_id: string | null;
  source_type: string;
  source_id: string | null;
  tag: SemanticTagName;
  confidence: number | null;
  created_at: string;
}

export type ActionState<T = void> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data?: T; message?: string }
  | { status: "error"; error: string; fieldErrors?: Record<string, string[]> };
