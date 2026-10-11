import { useCallback, useEffect, useState } from "react";

import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/integrations/supabase/client";

export type BackendStatus = "checking" | "online" | "offline";

/**
 * Reachability probe for this project's backend.
 *
 * A paused instance never answers, so the probe fails at the network layer — the
 * same failure a sign-in attempt would hit, just surfaced before the user types
 * their credentials. Any HTTP response at all counts as reachable: even a 401
 * proves the service is up, so only a network failure or a 5xx is reported as
 * unavailable.
 */
export const useBackendStatus = (): { status: BackendStatus; recheck: () => void } => {
  const [status, setStatus] = useState<BackendStatus>("checking");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    const probe = async () => {
      setStatus("checking");
      try {
        const response = await fetch(`${SUPABASE_URL}/auth/v1/health`, {
          headers: { apikey: SUPABASE_PUBLISHABLE_KEY },
          signal: controller.signal,
        });
        if (!cancelled) setStatus(response.status < 500 ? "online" : "offline");
      } catch {
        if (!cancelled) setStatus("offline");
      }
    };

    void probe();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [attempt]);

  const recheck = useCallback(() => setAttempt((value) => value + 1), []);

  return { status, recheck };
};
