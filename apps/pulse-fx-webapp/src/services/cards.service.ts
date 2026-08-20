import { api } from './api';

export type CardType = 'price' | 'percentage';

export interface Card {
  name: string;
  type: CardType;
  price: number | null;
  percentage: number | null;
  indicator: number;
  referenceDate: string;
}

export async function getCards(): Promise<Card[]> {
  try {
    const { data } = await api.get<Card[]>('/cards');
    return data;
  } catch {
    throw new Error('Failed to load cards');
  }
}
