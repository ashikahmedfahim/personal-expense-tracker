import 'dotenv/config';
import { createApp } from './app.js';
import { SQLDatabase } from './database/index.js';

const app = createApp();
const port = 3000;

SQLDatabase.getInstance().$connect();

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

process.on('SIGINT', async () => {
  await SQLDatabase.getInstance().$disconnect();
  process.exit(0);
});
