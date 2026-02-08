export const UploadConfig = {
  MAX_SIZE: Number(process.env.UPLOAD_MAX_FILE_SIZE ?? 5),
  DIR: process.env.UPLOAD_DIR ?? 'uploads',
};
