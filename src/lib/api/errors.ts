/**
 * Network-level failure detection.
 *
 * A paused backend never answers at all, so the request dies in the browser
 * before any HTTP status exists: `status` is 0 and the message is the browser's
 * own wording ("Failed to fetch", "Load failed", …). Recognising that lets the
 * interface say what actually happened instead of echoing a raw fetch error,
 * which reads like a bug in the app.
 */
export const isBackendUnavailable = (error: unknown): boolean => {
  if (!error) return false;

  const status = (error as { status?: number }).status;
  const name = (error as { name?: string }).name;
  const message = (error as { message?: string }).message ?? "";

  return (
    status === 0 ||
    name === "AuthRetryableFetchError" ||
    /failed to fetch|networkerror|network error|load failed|fetch failed/i.test(message)
  );
};
