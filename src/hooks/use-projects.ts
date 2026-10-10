import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/auth-provider";
import { createStartingInput } from "@/lib/simulation/defaults";
import type { CurrencyCode } from "@/lib/simulation/types";
import type { Project } from "@/lib/api/types";

export const projectsQueryKey = ["projects"] as const;

export const useProjects = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: projectsQueryKey,
    enabled: Boolean(user?.id),
    queryFn: async (): Promise<Project[]> => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
};

export type NewProjectValues = {
  name: string;
  idea: string;
  sectors: string[];
  scale: string | null;
  stage: string | null;
  currency: CurrencyCode;
  horizonMonths: number;
};

export const useCreateProject = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: NewProjectValues): Promise<Project> => {
      if (!user) throw new Error("Not signed in");

      const { data: project, error } = await supabase
        .from("projects")
        .insert({
          user_id: user.id,
          name: values.name,
          idea: values.idea,
          sectors: values.sectors,
          scale: values.scale,
          stage: values.stage,
          currency: values.currency,
          horizon_months: values.horizonMonths,
          status: "draft",
        })
        .select("*")
        .single();
      if (error) throw error;

      // A project always has an editable input row so the workspace never has
      // to distinguish "no inputs yet" from "empty inputs".
      const { error: inputError } = await supabase.from("project_inputs").insert({
        project_id: project.id,
        user_id: user.id,
        data: createStartingInput(values.currency, values.horizonMonths) as never,
        completed: false,
      });
      if (inputError) throw inputError;

      return project;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: projectsQueryKey });
    },
  });
};

export const useUpdateProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: string;
      patch: Partial<
        Pick<
          Project,
          | "name"
          | "idea"
          | "sectors"
          | "scale"
          | "stage"
          | "currency"
          | "horizon_months"
          | "status"
          | "scenario_overrides"
          | "ai_question_status"
        >
      >;
    }): Promise<Project> => {
      const { data, error } = await supabase
        .from("projects")
        .update(patch)
        .eq("id", id)
        .select("*")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (project) => {
      void queryClient.invalidateQueries({ queryKey: projectsQueryKey });
      void queryClient.invalidateQueries({ queryKey: ["project", project.id] });
    },
  });
};

export const useDeleteProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (projectId: string) => {
      const { error } = await supabase.from("projects").delete().eq("id", projectId);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: projectsQueryKey });
    },
  });
};

export const useDuplicateProject = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (projectId: string): Promise<Project> => {
      if (!user) throw new Error("Not signed in");

      const { data: source, error: sourceError } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();
      if (sourceError) throw sourceError;

      const { data: copy, error: copyError } = await supabase
        .from("projects")
        .insert({
          user_id: user.id,
          name: `${source.name} (2)`,
          idea: source.idea,
          sectors: source.sectors,
          scale: source.scale,
          stage: source.stage,
          currency: source.currency,
          horizon_months: source.horizon_months,
          status: "draft",
          scenario_overrides: source.scenario_overrides,
          ai_question_status: "not_requested",
        })
        .select("*")
        .single();
      if (copyError) throw copyError;

      const [{ data: questions }, { data: input }] = await Promise.all([
        supabase.from("project_questions").select("*").eq("project_id", projectId),
        supabase.from("project_inputs").select("*").eq("project_id", projectId).maybeSingle(),
      ]);

      if (questions && questions.length > 0) {
        await supabase.from("project_questions").insert(
          questions.map((question) => ({
            project_id: copy.id,
            user_id: user.id,
            question_key: question.question_key,
            label: question.label,
            help_text: question.help_text,
            input_type: question.input_type,
            unit: question.unit,
            options: question.options,
            required: question.required,
            sort_order: question.sort_order,
            maps_to: question.maps_to,
            source: question.source,
          })),
        );
      }

      await supabase.from("project_inputs").insert({
        project_id: copy.id,
        user_id: user.id,
        data: (input?.data ?? createStartingInput(source.currency as CurrencyCode)) as never,
        unknown_fields: input?.unknown_fields ?? [],
        completed: input?.completed ?? false,
      });

      return copy;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: projectsQueryKey });
    },
  });
};
