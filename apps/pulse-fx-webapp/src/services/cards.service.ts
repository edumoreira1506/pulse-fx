import { api } from './api';

export type CardType = 'price' | 'percentage';

export interface Card {
  name: string;
  identifier: string;
  type: CardType;
  price: number | null;
  percentage: number | null;
  indicator: number;
  referenceDate: string;
  description: string;
  tooltip: string;
  limitations: string;
  isFavorite: boolean;
}

export type HistoryPeriod =
  | 'LAST_5_BUSINESS_DAY'
  | 'LAST_30_DAYS'
  | 'LAST_90_DAYS'
  | 'LAST_ONE_YEAR'
  | 'LAST_TWO_YEARS'
  | 'LAST_FIVE_YEARS';

export interface HistoryItem {
  date: string;
  value: number;
}

export async function getCards(): Promise<Card[]> {
  try {
    const { data } = await api.get<Card[]>('/cards');
    return data;
  } catch {
    throw new Error('Failed to load cards');
  }
}

export async function getCardHistory(
  cardIndicatorId: string,
  period: HistoryPeriod,
): Promise<HistoryItem[]> {
  try {
    const { data } = await api.get<HistoryItem[]>(
      `/cards/${cardIndicatorId}/history`,
      { params: { period } },
    );
    return data;
  } catch {
    throw new Error('Failed to load card history');
  }
}
