import "server-only";

/**
 * Retained as a compatibility shim for older imports.
 *
 * VAPH no longer derives or auto-saves a VA's home address from private resume
 * content. Home-address collection is deferred until a confirmed placement or
 * another documented compliance requirement actually needs it.
 */
export async function runVaAddressResumeBackfill(_limit = 0) {
  return {
    checked: 0,
    saved: 0,
    review: 0,
    noMatch: 0,
    unsupported: 0,
    errors: 0,
    remaining: 0,
    disabled: true,
  };
}
