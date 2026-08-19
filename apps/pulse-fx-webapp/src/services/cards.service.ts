import { api } from './api';

export interface Card {
  name: string;
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
