import { api } from './api';
import { getCards } from './cards.service';

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

vi.mock('./api', () => ({
  api: {
    get: vi.fn(),
  },
}));

describe('getCards', () => {
  it('should request /cards and return the payload', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [usdBrl] });

    await expect(getCards()).resolves.toEqual([usdBrl]);
    expect(api.get).toHaveBeenCalledWith('/cards');
  });

  it('should throw when the request fails', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('network'));

    await expect(getCards()).rejects.toThrow('Failed to load cards');
  });
});
