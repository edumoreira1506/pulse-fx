import { renderHook, waitFor } from '@testing-library/react';
import { getCards } from '../services/cards.service';
import { useCards } from './use-cards';

const usdBrl = {
  name: 'USD / BRL',
  price: 542,
  percentage: null,
  indicator: 1.37,
  referenceDate: '2026-08-18',
};

vi.mock('../services/cards.service', () => ({
  getCards: vi.fn(),
}));

describe('useCards', () => {
  it('should load cards from the service', async () => {
    vi.mocked(getCards).mockResolvedValue([usdBrl]);

    const { result } = renderHook(() => useCards());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.cards).toEqual([usdBrl]);
    expect(result.current.error).toBeNull();
    expect(getCards).toHaveBeenCalledTimes(1);
  });

  it('should expose an error when the service fails', async () => {
    vi.mocked(getCards).mockRejectedValue(new Error('Failed to load cards'));

    const { result } = renderHook(() => useCards());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.cards).toEqual([]);
    expect(result.current.error).toBe('Failed to load cards');
  });
});
