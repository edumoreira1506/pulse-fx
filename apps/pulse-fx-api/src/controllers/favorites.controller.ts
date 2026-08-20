import { Request, Response } from 'express';
import {
  FavoriteAlreadyExistsError,
  FavoriteNotFoundError,
  createFavorite,
  deleteFavorite,
} from '../models/favorites.model';

export async function postFavorite(req: Request, res: Response) {
  const indicatorId =
    typeof req.body?.indicatorId === 'string' ? req.body.indicatorId.trim() : '';

  if (!indicatorId) {
    res.status(400).json({ message: 'indicatorId is required' });
    return;
  }

  try {
    const favorite = await createFavorite(indicatorId);
    res.status(201).json(favorite);
  } catch (error) {
    if (error instanceof FavoriteAlreadyExistsError) {
      res.status(409).json({ message: error.message });
      return;
    }

    res.status(500).json({ message: 'Failed to create favorite' });
  }
}

export async function removeFavorite(req: Request, res: Response) {
  const indicatorId = req.params.cardIndicatorId?.trim() ?? '';

  if (!indicatorId) {
    res.status(400).json({ message: 'cardIndicatorId is required' });
    return;
  }

  try {
    await deleteFavorite(indicatorId);
    res.status(204).send();
  } catch (error) {
    if (error instanceof FavoriteNotFoundError) {
      res.status(404).json({ message: error.message });
      return;
    }

    res.status(500).json({ message: 'Failed to delete favorite' });
  }
}
