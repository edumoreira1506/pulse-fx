import axios from 'axios';
import { getSeriesObservations, parseFredValue } from './fred.service';

vi.mock('axios');

describe('parseFredValue', () => {
  it('should parse numeric strings and ignore missing FRED values', () => {
    expect(parseFredValue('4.33')).toBe(4.33);
    expect(parseFredValue('.')).toBeNull();
    expect(parseFredValue('')).toBeNull();
  });
});

describe('getSeriesObservations', () => {
  const originalApiKey = process.env.FRED_API_KEY;

  afterEach(() => {
    process.env.FRED_API_KEY = originalApiKey;
  });

  it('should throw when the API key is missing', async () => {
    delete process.env.FRED_API_KEY;

    await expect(getSeriesObservations('FEDFUNDS')).rejects.toThrow(
      'FRED_API_KEY is not configured',
    );
  });

  it('should request FRED observations for the series', async () => {
    process.env.FRED_API_KEY = 'test-key';
    const observations = [
      { date: '2026-07-01', value: '4.33' },
      { date: '2026-06-01', value: '4.33' },
    ];

    vi.mocked(axios.get).mockResolvedValue({ data: { observations } });

    const result = await getSeriesObservations('FEDFUNDS', 3);

    expect(result).toEqual(observations);
    expect(axios.get).toHaveBeenCalledWith(
      'https://api.stlouisfed.org/fred/series/observations',
      expect.objectContaining({
        params: {
          series_id: 'FEDFUNDS',
          api_key: 'test-key',
          file_type: 'json',
          sort_order: 'desc',
          limit: 3,
        },
      }),
    );
  });
});
