import { createApp } from '@/app';
import { prisma } from '@/prisma';
import { config } from '@/config';

const app = createApp();
const server = app.listen(config.port, () => {
  console.log(`API listening on http://localhost:${config.port}`);
});

async function shutdown() {
  console.log('Shutting down...');
  await prisma.$disconnect();
  server.close(() => process.exit(0));
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

