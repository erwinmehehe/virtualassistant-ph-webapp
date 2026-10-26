import "server-only";

/**
 * @deprecated Event tracking has been retired. This compatibility helper is
 * inert so training, onboarding and hiring flows can call it without creating
 * extra Supabase writes. Their actual state is saved in dedicated tables.
 */
export async function recordProductEvent(
  _eventName: string,
  _args: { userId?: string | null; path: string; metadata?: Record<string, unknown> },
): Promise<void> {
  return;
}
