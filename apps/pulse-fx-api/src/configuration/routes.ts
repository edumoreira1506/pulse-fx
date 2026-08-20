import { Router } from 'express';
import { getCards } from '../controllers/cards.controller';
import {
  postFavorite,
  removeFavorite,
} from '../controllers/favorites.controller';

export const routes = Router();

routes.get('/', (_req, res) => {
  res.send({ message: 'Hello API' });
});

routes.get('/cards', getCards);
routes.post('/favorites', postFavorite);
routes.delete('/favorites/:cardIndicatorId', removeFavorite);
