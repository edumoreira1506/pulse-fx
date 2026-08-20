import { api } from './api';
import { getCards } from './cards.service';

const usdBrl = {
  name: 'USD / BRL',
  type: 'price' as const,
  price: 542,
  percentage: null,
  indicator: 1.37,
  referenceDate: '2026-08-18',
  description: 'Comparando com 5 dias úteis anteriores',
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
