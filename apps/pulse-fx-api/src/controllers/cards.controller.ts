import { Request, Response } from 'express';
import { listCards } from '../models/cards.model';

export async function getCards(_req: Request, res: Response) {
  try {
    const cards = await listCards();
    res.json(cards);
  } catch {
    res.status(502).json({ message: 'Failed to load cards' });
  }
}
