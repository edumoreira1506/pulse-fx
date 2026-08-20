import { existsSync } from 'node:fs';
import express from 'express';
import { routes } from './configuration/routes';

if (existsSync('.env')) {
  process.loadEnvFile('.env');
}

const host = process.env.HOST ?? '0.0.0.0';
const port = process.env.PORT ? Number(process.env.PORT) : 3333;

const app = express();

app.use(express.json());

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept',
  );
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(routes);

app.listen(port, host, () => {
  console.log(`[ ready ] http://${host}:${port}`);
});
