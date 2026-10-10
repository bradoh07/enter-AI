import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/auth-provider";
import type { Profile, UserType } from "@/lib/api/types";

export const profileQueryKey = (userId: string | undefined) => ["profile", userId] as const;

export const useProfile = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: profileQueryKey(user?.id),
    enabled: Boolean(user?.id),
    queryFn: async (): Promise<Profile | null> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
};

export type ProfilePatch = {
  user_type?: UserType;
  display_name?: string;
  currency?: string;
  company_name?: string | null;
  company_size?: string | null;
  business_stage?: string | null;
  business_models?: string[];
  interest_sectors?: string[];
  founding_experience?: string | null;
  planned_investment?: number | null;
  default_assumptions?: Record<string, number>;
  onboarding_completed?: boolean;
};

export const useUpdateProfile = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (patch: ProfilePatch): Promise<Profile> => {
      if (!user) throw new Error("Not signed in");
      const { data, error } = await supabase
        .from("profiles")
        .upsert({ id: user.id, ...patch }, { onConflict: "id" })
        .select("*")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (profile) => {
      queryClient.setQueryData(profileQueryKey(user?.id), profile);
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
};
