export type AiQuestionInputType =
  | "number"
  | "currency"
  | "percent"
  | "text"
  | "select"
  | "list";

export type AiQuestion = {
  key: string;
  label: string;
  help: string;
  inputType: AiQuestionInputType;
  unit: string;
  options: string[];
  required: boolean;
  mapsTo: string;
  sortOrder: number;
};

/** `unavailable` means the capability is off or out of credits; `error` is a real failure. */
export type AiFailureStatus = "unavailable" | "error";

export type ScopingResult =
  | { status: "ok"; model: string; questions: AiQuestion[] }
  | { status: AiFailureStatus; message: string };

export type AiLevel = "high" | "medium" | "low";

export type AiRisk = {
  title: string;
  category: string;
  likelihood: AiLevel;
  impact: AiLevel;
  description: string;
  mitigation: string;
};

export type AiImprovement = {
  title: string;
  description: string;
  expectedEffect: string;
};

export type AiStatedAssumption = {
  statement: string;
  impactIfWrong: AiLevel;
};

export type AiInsights = {
  feasibility: {
    score: number;
    verdict: string;
    summary: string;
  };
  risks: AiRisk[];
  improvements: AiImprovement[];
  assumptions: AiStatedAssumption[];
  uncertainties: string[];
};

export type InsightsResult =
  | { status: "ok"; model: string; insights: AiInsights }
  | { status: AiFailureStatus; message: string };
