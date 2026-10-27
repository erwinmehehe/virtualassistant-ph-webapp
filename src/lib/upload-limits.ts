// Vercel Functions cap the entire request body at 4.5 MB (including multipart
// fields). Reserve headroom for metadata instead of accepting an unuploadable
// 5 MB resume. A future browser-direct storage flow can lift this restriction.
export const MAX_SERVER_ACTION_RESUME_BYTES = 4 * 1024 * 1024;
export const SERVER_ACTION_RESUME_SIZE_LABEL = "4 MB";
