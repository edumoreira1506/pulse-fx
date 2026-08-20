import { Router } from 'express';
import { getCardHistory, getCards } from '../controllers/cards.controller';
import {
  postFavorite,
  removeFavorite,
} from '../controllers/favorites.controller';

export const routes = Router();

routes.get('/', (_req, res) => {
  res.send({ message: 'Hello API' });
});

routes.get('/cards', getCards);
routes.get('/cards/:cardIndicatorId/history', getCardHistory);
routes.post('/favorites', postFavorite);
routes.delete('/favorites/:cardIndicatorId', removeFavorite);
