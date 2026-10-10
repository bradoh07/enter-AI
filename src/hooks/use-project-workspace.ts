import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/auth-provider";
import { parseSimulationInput } from "@/lib/simulation/validate";
import type { SimulationInput } from "@/lib/simulation/types";
import type { Project, ProjectInputRow, ProjectQuestion, SimulationRun } from "@/lib/api/types";
import { projectsQueryKey } from "./use-projects";

export const useProject = (projectId: string | undefined) =>
  useQuery({
    queryKey: ["project", projectId],
    enabled: Boolean(projectId),
    queryFn: async (): Promise<Project | null> => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

export const useProjectQuestions = (projectId: string | undefined) =>
  useQuery({
    queryKey: ["project-questions", projectId],
    enabled: Boolean(projectId),
    queryFn: async (): Promise<ProjectQuestion[]> => {
      const { data, error } = await supabase
        .from("project_questions")
        .select("*")
        .eq("project_id", projectId!)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

export const useProjectInput = (projectId: string | undefined) =>
  useQuery({
    queryKey: ["project-input", projectId],
    enabled: Boolean(projectId),
    queryFn: async (): Promise<{ row: ProjectInputRow | null; input: SimulationInput | null }> => {
      const { data, error } = await supabase
        .from("project_inputs")
        .select("*")
        .eq("project_id", projectId!)
        .maybeSingle();
      if (error) throw error;
      if (!data) return { row: null, input: null };
      return { row: data, input: parseSimulationInput(data.data) };
    },
  });

export const useProjectRuns = (projectId: string | undefined) =>
  useQuery({
    queryKey: ["project-runs", projectId],
    enabled: Boolean(projectId),
    queryFn: async (): Promise<SimulationRun[]> => {
      const { data, error } = await supabase
        .from("simulation_runs")
        .select("*")
        .eq("project_id", projectId!)
        .order("run_number", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

export const useRun = (runId: string | undefined) =>
  useQuery({
    queryKey: ["run", runId],
    enabled: Boolean(runId),
    queryFn: async (): Promise<SimulationRun | null> => {
      const { data, error } = await supabase
        .from("simulation_runs")
        .select("*")
        .eq("id", runId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

/** Every run across the account, newest first — the analysis history page. */
export const useAnalysisHistory = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["analysis-history", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async (): Promise<Array<SimulationRun & { projectName: string }>> => {
      const { data, error } = await supabase
        .from("simulation_runs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;

      const runs = data ?? [];
      const projectIds = [...new Set(runs.map((run) => run.project_id))];
      if (projectIds.length === 0) return [];

      const { data: projects } = await supabase
        .from("projects")
        .select("id, name")
        .in("id", projectIds);
      const nameById = new Map((projects ?? []).map((project) => [project.id, project.name]));

      return runs.map((run) => ({
        ...run,
        projectName: nameById.get(run.project_id) ?? "",
      }));
    },
  });
};

export const useSaveProjectInput = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      input,
      unknownFields,
    }: {
      projectId: string;
      input: SimulationInput;
      unknownFields: string[];
    }) => {
      if (!user) throw new Error("Not signed in");
      const { error } = await supabase.from("project_inputs").upsert(
        {
          project_id: projectId,
          user_id: user.id,
          data: input as never,
          unknown_fields: unknownFields,
          completed: true,
        },
        { onConflict: "project_id" },
      );
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["project-input", variables.projectId] });
    },
  });
};

export const useReplaceQuestions = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      questions,
    }: {
      projectId: string;
      questions: Array<{
        question_key: string;
        label: string;
        help_text: string | null;
        input_type: string;
        unit: string | null;
        options: string[];
        required: boolean;
        maps_to: string | null;
      }>;
    }) => {
      if (!user) throw new Error("Not signed in");

      const { error: deleteError } = await supabase
        .from("project_questions")
        .delete()
        .eq("project_id", projectId);
      if (deleteError) throw deleteError;

      if (questions.length === 0) return;

      const { error: insertError } = await supabase.from("project_questions").insert(
        questions.map((question, index) => ({
          project_id: projectId,
          user_id: user.id,
          question_key: question.question_key,
          label: question.label,
          help_text: question.help_text,
          input_type: question.input_type,
          unit: question.unit,
          options: question.options,
          required: question.required,
          sort_order: index,
          maps_to: question.maps_to,
          source: "ai",
        })),
      );
      if (insertError) throw insertError;
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["project-questions", variables.projectId] });
    },
  });
};

export const invalidateProjects = (queryClient: ReturnType<typeof useQueryClient>) => {
  void queryClient.invalidateQueries({ queryKey: projectsQueryKey });
};
