import { renderHook, waitFor } from '@testing-library/react';
import { getCardHistory } from '../services/cards.service';
import { useCardHistory } from './use-card-history';

vi.mock('../services/cards.service', () => ({
  getCardHistory: vi.fn(),
}));

const history = [
  { date: '2026-08-18', value: 5.1714 },
  { date: '2026-08-19', value: 5.2043 },
];

describe('useCardHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should load history for the selected card and period', async () => {
    vi.mocked(getCardHistory).mockResolvedValue(history);

    const { result } = renderHook(() =>
      useCardHistory('usd-brl', 'LAST_5_BUSINESS_DAY'),
    );

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.items).toEqual(history);
    expect(result.current.error).toBeNull();
    expect(getCardHistory).toHaveBeenCalledWith(
      'usd-brl',
      'LAST_5_BUSINESS_DAY',
    );
  });

  it('should expose an error when history fails to load', async () => {
    vi.mocked(getCardHistory).mockRejectedValue(
      new Error('Failed to load card history'),
    );

    const { result } = renderHook(() =>
      useCardHistory('usd-brl', 'LAST_30_DAYS'),
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.items).toEqual([]);
    expect(result.current.error).toBe('Failed to load card history');
  });

  it('should not fetch when a card is not selected', async () => {
    const { result } = renderHook(() => useCardHistory(null, null));

    expect(result.current.loading).toBe(false);
    expect(result.current.items).toEqual([]);
    expect(getCardHistory).not.toHaveBeenCalled();
  });
});
