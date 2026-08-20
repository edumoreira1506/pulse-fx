import { act, renderHook, waitFor } from '@testing-library/react';
import { getCards } from '../services/cards.service';
import { addFavorite, removeFavorite } from '../services/favorites.service';
import { useCards } from './use-cards';

const usdBrl = {
  name: 'USD / BRL',
  identifier: 'usd-brl',
  type: 'price' as const,
  price: 542,
  percentage: null,
  indicator: 1.37,
  referenceDate: '2026-08-18',
  description: 'Comparando com 5 dias úteis anteriores',
  tooltip:
    'Cotação de venda do dólar americano em reais pela PTAX do Banco Central do Brasil. A variação compara a cotação mais recente com a 5ª observação útil anterior disponível, ignorando dias sem cotação.',
  isFavorite: false,
};

vi.mock('../services/cards.service', () => ({
  getCards: vi.fn(),
}));

vi.mock('../services/favorites.service', () => ({
  addFavorite: vi.fn(),
  removeFavorite: vi.fn(),
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

  it('should add a favorite and update the card after the API succeeds', async () => {
    vi.mocked(getCards).mockResolvedValue([usdBrl]);
    vi.mocked(addFavorite).mockResolvedValue(undefined);

    const { result } = renderHook(() => useCards());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.toggleFavorite('usd-brl', false);
    });

    expect(addFavorite).toHaveBeenCalledWith('usd-brl');
    expect(result.current.cards[0].isFavorite).toBe(true);
  });

  it('should remove a favorite and update the card after the API succeeds', async () => {
    vi.mocked(getCards).mockResolvedValue([{ ...usdBrl, isFavorite: true }]);
    vi.mocked(removeFavorite).mockResolvedValue(undefined);

    const { result } = renderHook(() => useCards());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.toggleFavorite('usd-brl', true);
    });

    expect(removeFavorite).toHaveBeenCalledWith('usd-brl');
    expect(result.current.cards[0].isFavorite).toBe(false);
  });

  it('should keep the current favorite state when the API fails', async () => {
    vi.mocked(getCards).mockResolvedValue([usdBrl]);
    vi.mocked(addFavorite).mockRejectedValue(new Error('Failed to add favorite'));

    const { result } = renderHook(() => useCards());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await expect(
      result.current.toggleFavorite('usd-brl', false),
    ).rejects.toThrow('Failed to add favorite');
    expect(result.current.cards[0].isFavorite).toBe(false);
  });
});
