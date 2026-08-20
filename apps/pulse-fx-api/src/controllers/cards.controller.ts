import { Request, Response } from 'express';
import { listCards } from '../models/cards.model';
import {
  InvalidHistoryPeriodError,
  UnknownCardIndicatorError,
  listCardHistory,
} from '../models/cards-history.model';

export async function getCards(_req: Request, res: Response) {
  try {
    const cards = await listCards();
    res.json(cards);
  } catch {
    res.status(502).json({ message: 'Failed to load cards' });
  }
}

export async function getCardHistory(req: Request, res: Response) {
  const cardIndicatorId = req.params.cardIndicatorId?.trim() ?? '';
  const period =
    typeof req.query.period === 'string' ? req.query.period.trim() : undefined;

  if (!cardIndicatorId) {
    res.status(400).json({ message: 'cardIndicatorId is required' });
    return;
  }

  try {
    const history = await listCardHistory(cardIndicatorId, period);
    res.json(history);
  } catch (error) {
    if (error instanceof UnknownCardIndicatorError) {
      res.status(404).json({ message: error.message });
      return;
    }

    if (error instanceof InvalidHistoryPeriodError) {
      res.status(400).json({ message: error.message });
      return;
    }

    res.status(502).json({ message: 'Failed to load card history' });
  }
}
