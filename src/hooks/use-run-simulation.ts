import { useMutation, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/auth-provider";
import { buildInsightsPayload } from "@/lib/ai/payload";
import { requestSimulationInsights } from "@/lib/ai/client";
import { buildEngineAssumptions } from "@/lib/simulation/assumptions";
import { computeSimulation } from "@/lib/simulation/engine";
import { parseAssumptions, parseSimulationResult } from "@/lib/simulation/run";
import { parseSimulationInput } from "@/lib/simulation/validate";
import type { Profile, SimulationRun } from "@/lib/api/types";
import type {
  CurrencyCode,
  ScenarioAdjustment,
  ScenarioKey,
  SimulationInput,
} from "@/lib/simulation/types";

/** The subset of a project both AI payloads and the run row need. */
export type SimulationProjectRef = {
  id: string;
  name: string;
  idea: string;
  sectors: string[];
  scale: string | null;
  stage: string | null;
  currency: CurrencyCode;
};

export type RunSimulationArgs = {
  project: SimulationProjectRef;
  profile: Profile | null;
  input: SimulationInput;
  adjustments: Record<ScenarioKey, ScenarioAdjustment>;
  unknownFields: string[];
  locale: string;
  withAi: boolean;
};

/** Run rows keep the undecided slots inside the assumption list. */
const undecidedFieldsOf = (run: SimulationRun): string[] =>
  parseAssumptions(run.assumptions)
    .filter((note) => note.id.startsWith("unknown."))
    .map((note) => note.id.slice("unknown.".length));

/**
 * Computes the deterministic simulation, stores it as a new run, and — when AI
 * is available — attaches the model's interpretation to that same run.
 *
 * The computed result is persisted before the AI call, so an AI failure never
 * loses the user's numbers and never fabricates an analysis: the run records
 * `ai_status` unavailable/error together with the upstream message.
 */
export const useRunSimulation = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (args: RunSimulationArgs): Promise<SimulationRun> => {
      if (!user) throw new Error("Not signed in");

      const result = computeSimulation(args.input, args.adjustments);
      const assumptions = buildEngineAssumptions(
        args.input,
        args.adjustments,
        args.unknownFields,
      );

      const { data: previous } = await supabase
        .from("simulation_runs")
        .select("run_number")
        .eq("project_id", args.project.id)
        .order("run_number", { ascending: false })
        .limit(1)
        .maybeSingle();
      const runNumber = (previous?.run_number ?? 0) + 1;

      const { data: run, error } = await supabase
        .from("simulation_runs")
        .insert({
          project_id: args.project.id,
          user_id: user.id,
          run_number: runNumber,
          engine_version: result.engineVersion,
          input_snapshot: args.input as never,
          results: result as never,
          assumptions: assumptions as never,
          ai_status: "not_requested",
        })
        .select("*")
        .single();
      if (error) throw error;

      await supabase.from("project_inputs").upsert(
        {
          project_id: args.project.id,
          user_id: user.id,
          data: args.input as never,
          unknown_fields: args.unknownFields,
          completed: true,
        },
        { onConflict: "project_id" },
      );

      await supabase
        .from("projects")
        .update({
          status: "simulated",
          horizon_months: args.input.horizonMonths,
          currency: args.input.currency,
        })
        .eq("id", args.project.id);

      if (!args.withAi) return run;

      const payload = buildInsightsPayload({
        project: args.project,
        profile: args.profile,
        input: args.input,
        result,
        adjustments: args.adjustments,
        unknownFields: args.unknownFields,
      });

      const ai = await requestSimulationInsights(payload, args.locale, crypto.randomUUID());

      const { data: updated } = await supabase
        .from("simulation_runs")
        .update({
          ai_status: ai.status === "ok" ? "ok" : ai.status,
          ai_error: ai.status === "ok" ? null : ai.message,
          ai_model: ai.status === "ok" ? ai.model : null,
          ai_insights: ai.status === "ok" ? (ai.insights as never) : null,
        })
        .eq("id", run.id)
        .select("*")
        .single();

      return updated ?? run;
    },
    onSuccess: (run, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["project-runs", variables.project.id] });
      void queryClient.invalidateQueries({ queryKey: ["project", variables.project.id] });
      void queryClient.invalidateQueries({ queryKey: ["project-input", variables.project.id] });
      void queryClient.invalidateQueries({ queryKey: ["run", run.id] });
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
      void queryClient.invalidateQueries({ queryKey: ["analysis-history"] });
    },
  });
};

/** Runs (or re-runs) the AI interpretation for an already computed run. */
export const useRetryInsights = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (args: {
      run: SimulationRun;
      project: SimulationProjectRef;
      profile: Profile | null;
      locale: string;
    }): Promise<SimulationRun> => {
      const input = parseSimulationInput(args.run.input_snapshot);
      const result = parseSimulationResult(args.run.results);
      if (!result) throw new Error("This run has no stored result to analyse.");

      const adjustments = result.scenarios.optimistic
        ? ({
            optimistic: result.scenarios.optimistic.adjustment,
            base: result.scenarios.base.adjustment,
            pessimistic: result.scenarios.pessimistic.adjustment,
          } as Record<ScenarioKey, ScenarioAdjustment>)
        : undefined;

      const payload = buildInsightsPayload({
        project: args.project,
        profile: args.profile,
        input,
        result,
        adjustments:
          adjustments ?? ({} as Record<ScenarioKey, ScenarioAdjustment>),
        unknownFields: undecidedFieldsOf(args.run),
      });

      const ai = await requestSimulationInsights(payload, args.locale, crypto.randomUUID());

      const { data, error } = await supabase
        .from("simulation_runs")
        .update({
          ai_status: ai.status === "ok" ? "ok" : ai.status,
          ai_error: ai.status === "ok" ? null : ai.message,
          ai_model: ai.status === "ok" ? ai.model : null,
          ai_insights: ai.status === "ok" ? (ai.insights as never) : null,
        })
        .eq("id", args.run.id)
        .select("*")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (run, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["run", run.id] });
      void queryClient.invalidateQueries({ queryKey: ["project-runs", variables.run.project_id] });
      void queryClient.invalidateQueries({ queryKey: ["analysis-history"] });
    },
  });
};
