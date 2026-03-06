export const UploadConfig = {
  MAX_SIZE: Number(process.env.UPLOAD_MAX_FILE_SIZE ?? 5),
  DIR: process.env.UPLOAD_DIR || 'uploads',
};

/**
 * Returns the directory where uploaded files should be stored.
 * Reads the value of `process.env.UPLOAD_DIR` at runtime, ensuring that the
 * upload path reflects the active environment and avoid static config objects
 * evaluated before env variables are loaded issue.
 * @returns Current image upload directory (e.g. "uploads" or "test/uploads")
 */
export function getUploadDir() {
  return process.env.UPLOAD_DIR || 'uploads';
}
