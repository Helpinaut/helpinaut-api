import path from 'path';
import fs from 'fs';

export function resetUploads() {
  const dir = path.join(process.cwd(), 'test/uploads');

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  for (const file of fs.readdirSync(dir)) {
    fs.unlinkSync(path.join(dir, file));
  }
}
