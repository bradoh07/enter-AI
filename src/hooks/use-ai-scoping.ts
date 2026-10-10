import { useMutation } from "@tanstack/react-query";

import { requestScopingQuestions } from "@/lib/ai/client";
import { buildScopingPayload } from "@/lib/ai/payload";
import type { ScopingResult } from "@/lib/ai/types";
import type { Profile, Project, ProjectQuestion } from "@/lib/api/types";

export type ScopingArgs = {
  project: Pick<
    Project,
    "name" | "idea" | "sectors" | "scale" | "stage" | "currency"
  >;
  profile: Pick<
    Profile,
    "user_type" | "business_models" | "company_size" | "business_stage"
  > | null;
  locale: string;
  existingQuestions?: ProjectQuestion[];
};

/**
 * Asks the backend for project-specific follow-up questions. The result is a
 * discriminated union, so the caller can tell "AI is switched off" apart from
 * "the call failed" and present the right state instead of an empty form.
 */
export const useGenerateScopingQuestions = () =>
  useMutation<ScopingResult, Error, ScopingArgs>({
    mutationFn: async (args: ScopingArgs) => {
      const payload = buildScopingPayload(
        args.project,
        args.profile,
        args.existingQuestions ?? [],
      );
      return requestScopingQuestions(payload, args.locale, crypto.randomUUID());
    },
  });
