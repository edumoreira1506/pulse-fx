import { Router } from 'express';
import { getCards } from '../controllers/cards.controller';

export const routes = Router();

routes.get('/', (_req, res) => {
  res.send({ message: 'Hello API' });
});

routes.get('/cards', getCards);
