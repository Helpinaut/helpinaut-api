import { execSync } from 'child_process';

async function resetTestDatabase() {
  execSync('npx prisma migrate deploy', { stdio: 'inherit' });
  execSync('npx prisma db seed', { stdio: 'inherit' });
}

export default async () => {
  await resetTestDatabase();
};
