import type { Tables } from "@/integrations/supabase/types";

export type Profile = Tables<"profiles">;
export type Project = Tables<"projects">;
export type ProjectQuestion = Tables<"project_questions">;
export type ProjectInputRow = Tables<"project_inputs">;
export type SimulationRun = Tables<"simulation_runs">;

export type UserType = "business" | "individual";
export type AiRunStatus = "not_requested" | "ok" | "unavailable" | "error";

export const USER_TYPES: UserType[] = ["business", "individual"];

export const DEFAULT_HORIZON_MONTHS = 36;

export const isUserType = (value: unknown): value is UserType =>
  value === "business" || value === "individual";

export const parseStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];

/**
 * DB check constraints are not reflected in the generated types, so a stored
 * status comes back as a plain string. Narrow it back to the known set.
 */
export const toAiStatus = (value: string): AiRunStatus =>
  value === "ok" || value === "unavailable" || value === "error" || value === "not_requested"
    ? value
    : "not_requested";
