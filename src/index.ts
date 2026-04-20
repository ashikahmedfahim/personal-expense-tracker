import express from "express";
import bodyParser from "body-parser";
import 'dotenv/config';
import { SQLDatabase } from "./database/index.js";
import { userRoute } from './routes/userRoute.js';

const app = express();
const port = 3000;
app.use(express.json());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/v1/users', userRoute);

SQLDatabase.getInstance().$connect();

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

process.on('SIGINT', async () => {
  await SQLDatabase.getInstance().$disconnect();
  process.exit(0);
});