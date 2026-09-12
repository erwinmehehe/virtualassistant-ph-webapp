import "server-only";

/**
 * Logs slow server-side operations in production while keeping full timing
 * visibility during local development. PERF_SLOW_MS can override the default.
 */
export async function withServerTiming<T>(label: string, work: () => PromiseLike<T>): Promise<T> {
  const started = performance.now();
  try {
    return await work();
  } finally {
    const elapsed = Math.round((performance.now() - started) * 10) / 10;
    const configured = Number(process.env.PERF_SLOW_MS || 100);
    const threshold = Number.isFinite(configured) && configured >= 0 ? configured : 100;
    if (process.env.NODE_ENV !== "production" || elapsed >= threshold) {
      console.info(`[perf] ${label} ${elapsed}ms`);
    }
  }
}
