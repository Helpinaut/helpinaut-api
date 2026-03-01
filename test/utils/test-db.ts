import { execSync } from 'child_process';
import path from 'path';

export async function resetTestDatabase() {
  execSync('npx prisma migrate deploy', { stdio: 'inherit' });
  execSync(`npx prisma db seed`, { stdio: 'inherit' });
}
