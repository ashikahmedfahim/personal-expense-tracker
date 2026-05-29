import 'dotenv/config';
import { createApp } from './app.js';
import { SQLDatabase } from './database/index.js';

const app = createApp();
const port = Number(process.env.PORT) || 3000;

SQLDatabase.getInstance().$connect();

const server = app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

let isShuttingDown = false;

const shutdown = async (): Promise<void> => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  server.close(() => {
    void SQLDatabase.getInstance().$disconnect().finally(() => {
      process.exit(0);
    });
  });
};

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    void shutdown();
  });
}
