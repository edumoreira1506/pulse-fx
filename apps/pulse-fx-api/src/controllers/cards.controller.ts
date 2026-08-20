import { Request, Response } from 'express';

const cards = [
  {
    name: 'USD / BRL',
    identifier: 'usd-brl',
    type: 'price',
    price: 542,
    percentage: null,
    indicator: 1.37,
    referenceDate: '2026-08-18',
    description: 'Comparando com 5 dias úteis anteriores',
  },
  {
    name: 'EUR / BRL',
    identifier: 'eur-brl',
    type: 'price',
    price: 631,
    percentage: null,
    indicator: -0.82,
    referenceDate: '2026-08-18',
    description: 'Comparando com 5 dias úteis anteriores',
  },
  {
    name: 'Fed Funds',
    identifier: 'fed-funds',
    type: 'percentage',
    price: null,
    percentage: 5.25,
    indicator: 0,
    referenceDate: '2026-07-01',
    description: 'Comparando com mês anterior',
  },
  {
    name: 'US CPI',
    identifier: 'us-cpi',
    type: 'percentage',
    price: null,
    percentage: 2.7,
    indicator: 0.10,
    referenceDate: '2026-07-01',
    description: 'Comparando com mês anterior',
  },
];

export function getCards(_req: Request, res: Response) {
  res.json(cards);
}
