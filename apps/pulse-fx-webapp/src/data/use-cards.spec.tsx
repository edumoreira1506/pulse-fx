import { renderHook, waitFor } from '@testing-library/react';
import { getCards } from '../services/cards.service';
import { useCards } from './use-cards';

const usdBrl = {
  name: 'USD / BRL',
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
