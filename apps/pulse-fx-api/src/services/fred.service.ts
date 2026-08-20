import axios from 'axios';

const FRED_OBSERVATIONS_URL =
  'https://api.stlouisfed.org/fred/series/observations';

export const FED_FUNDS_SERIES_ID = 'FEDFUNDS';
export const US_CPI_SERIES_ID = 'CPIAUCSL';

export interface FredObservation {
  date: string;
  value: string;
}

export async function getSeriesObservations(
  seriesId: string,
  limit = 12,
): Promise<FredObservation[]> {
  const apiKey = process.env.FRED_API_KEY;

  if (!apiKey) {
    throw new Error('FRED_API_KEY is not configured');
  }

  const { data } = await axios.get<{ observations?: FredObservation[] }>(
    FRED_OBSERVATIONS_URL,
    {
      params: {
        series_id: seriesId,
        api_key: apiKey,
        file_type: 'json',
        sort_order: 'desc',
        limit,
      },
      timeout: 10_000,
    },
  );

  return data.observations ?? [];
}

export function parseFredValue(value: string): number | null {
  if (value === '.' || value.trim() === '') {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
