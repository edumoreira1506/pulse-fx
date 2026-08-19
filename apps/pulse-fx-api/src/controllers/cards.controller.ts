import { Request, Response } from 'express';

const cards = [
  {
    name: 'USD / BRL',
    price: 542,
    percentage: null,
    indicator: 1.37,
    referenceDate: '2026-08-18',
  },
  {
    name: 'EUR / BRL',
    price: 631,
    percentage: null,
    indicator: -0.82,
    referenceDate: '2026-08-18',
  },
  {
    name: 'Fed Funds',
    price: null,
    percentage: 5.25,
    indicator: 0,
    referenceDate: '2026-07-01',
  },
  {
    name: 'US CPI',
    price: null,
    percentage: 2.7,
    indicator: 0.10,
    referenceDate: '2026-07-01',
  },
];

export function getCards(_req: Request, res: Response) {
  res.json(cards);
}
