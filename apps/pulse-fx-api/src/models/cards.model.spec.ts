import { getUsdBrlCard, listCards } from './cards.model';
import { getDollarQuotes } from '../services/olinda.service';

vi.mock('../services/olinda.service', () => ({
  getDollarQuotes: vi.fn(),
}));

const quotes = [
  {
    cotacaoCompra: 5.1279,
    cotacaoVenda: 5.1285,
    dataHoraCotacao: '2026-08-11 13:05:15.80831',
  },
  {
    cotacaoCompra: 5.1632,
    cotacaoVenda: 5.1639,
    dataHoraCotacao: '2026-08-12 13:09:28.609891',
  },
  {
    cotacaoCompra: 5.1853,
    cotacaoVenda: 5.1859,
    dataHoraCotacao: '2026-08-13 13:09:15.558931',
  },
  {
    cotacaoCompra: 5.223,
    cotacaoVenda: 5.2236,
    dataHoraCotacao: '2026-08-14 13:10:22.94166',
  },
  {
    cotacaoCompra: 5.2008,
    cotacaoVenda: 5.2014,
    dataHoraCotacao: '2026-08-17 13:04:48.745527',
  },
  {
    cotacaoCompra: 5.2037,
    cotacaoVenda: 5.2043,
    dataHoraCotacao: '2026-08-18 13:10:39.550019',
  },
  {
    cotacaoCompra: 5.1708,
    cotacaoVenda: 5.1714,
    dataHoraCotacao: '2026-08-19 13:07:22.062208',
  },
];

describe('getUsdBrlCard', () => {
  it('should map the newest quote and 5-business-day change', async () => {
    vi.mocked(getDollarQuotes).mockResolvedValue(quotes);

    const card = await getUsdBrlCard();

    expect(card).toMatchObject({
      name: 'USD / BRL',
      identifier: 'usd-brl',
      type: 'price',
      price: 517,
      percentage: null,
      indicator: 0.15,
      referenceDate: '2026-08-19',
      description: 'Comparando com 5 dias úteis anteriores',
    });
  });

  it('should throw when there are not enough quotes', async () => {
    vi.mocked(getDollarQuotes).mockResolvedValue(quotes.slice(0, 5));

    await expect(getUsdBrlCard()).rejects.toThrow(
      'Not enough dollar quotes to build USD / BRL card',
    );
  });
});

describe('listCards', () => {
  it('should put the live USD / BRL card first', async () => {
    vi.mocked(getDollarQuotes).mockResolvedValue(quotes);

    const cards = await listCards();

    expect(cards[0]?.identifier).toBe('usd-brl');
    expect(cards.map((card) => card.identifier)).toEqual([
      'usd-brl',
      'eur-brl',
      'fed-funds',
      'us-cpi',
    ]);
  });
});
