/**
 * Limit one Supabase HTTP request without losing either caller cancellation
 * signal. Network stalls must never consume an entire Vercel Function lifetime.
 *
 * Each invocation has its own timer; no retries are performed (particularly
 * important for writes whose outcome may be uncertain after a timeout).
 */
export function createBoundedSupabaseFetch(timeoutMs: number): typeof fetch {
  if (!Number.isFinite(timeoutMs) || timeoutMs < 1) {
    throw new RangeError("Supabase fetch timeout must be a positive number");
  }

  return (input, init) => {
    const signals: AbortSignal[] = [AbortSignal.timeout(timeoutMs)];
    if (input instanceof Request) signals.push(input.signal);
    if (init?.signal) signals.push(init.signal);

    return fetch(input, {
      ...init,
      signal: AbortSignal.any(signals),
    });
  };
}
