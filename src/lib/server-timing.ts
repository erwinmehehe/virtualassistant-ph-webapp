import "server-only";

/**
 * Logs server-side timings in a compact, grep-friendly format so production
 * latency can be measured from Vercel logs without adding browser JS.
 */
export async function withServerTiming<T>(label: string, work: () => Promise<T>): Promise<T> {
  const started = performance.now();
  try {
    return await work();
  } finally {
    const elapsed = Math.round((performance.now() - started) * 10) / 10;
    console.info(`[perf] ${label} ${elapsed}ms`);
  }
}
