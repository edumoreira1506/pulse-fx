import { getEurBrlCard, getFedFundsCard, getUsdBrlCard, listCards } from './cards.model';
import { getCurrencyQuotes, getDollarQuotes } from '../services/olinda.service';
import { getSeriesObservations } from '../services/fred.service';

vi.mock('../services/olinda.service', () => ({
  getDollarQuotes: vi.fn(),
  getCurrencyQuotes: vi.fn(),
}));

vi.mock('../services/fred.service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../services/fred.service')>();
  return {
    ...actual,
    getSeriesObservations: vi.fn(),
  };
});

const usdQuotes = [
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

const eurQuotes = [
  {
    cotacaoCompra: 5.9186,
    cotacaoVenda: 5.9209,
    dataHoraCotacao: '2026-08-11 13:05:15.80831',
    tipoBoletim: 'Fechamento',
  },
  {
    cotacaoCompra: 5.9578,
    cotacaoVenda: 5.9597,
    dataHoraCotacao: '2026-08-12 13:09:28.609891',
    tipoBoletim: 'Fechamento',
  },
  {
    cotacaoCompra: 5.978,
    cotacaoVenda: 5.9799,
    dataHoraCotacao: '2026-08-13 13:09:15.558931',
    tipoBoletim: 'Fechamento',
  },
  {
    cotacaoCompra: 6.048,
    cotacaoVenda: 6.05,
    dataHoraCotacao: '2026-08-14 13:10:22.94166',
    tipoBoletim: 'Fechamento',
  },
  {
    cotacaoCompra: 6.027,
    cotacaoVenda: 6.0289,
    dataHoraCotacao: '2026-08-17 13:04:48.745527',
    tipoBoletim: 'Fechamento',
  },
  {
    cotacaoCompra: 6.025,
    cotacaoVenda: 6.0271,
    dataHoraCotacao: '2026-08-18 13:10:39.550019',
    tipoBoletim: 'Fechamento',
  },
  {
    cotacaoCompra: 6.031,
    cotacaoVenda: 6.0324,
    dataHoraCotacao: '2026-08-19 13:07:22.062208',
    tipoBoletim: 'Fechamento',
  },
];

describe('getUsdBrlCard', () => {
  it('should map the newest quote and 5-business-day change', async () => {
    vi.mocked(getDollarQuotes).mockResolvedValue(usdQuotes);

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
    vi.mocked(getDollarQuotes).mockResolvedValue(usdQuotes.slice(0, 5));

    await expect(getUsdBrlCard()).rejects.toThrow(
      'Not enough quotes to build USD / BRL card',
    );
  });
});

describe('getEurBrlCard', () => {
  it('should map the newest EUR fechamento quote and 5-business-day change', async () => {
    vi.mocked(getCurrencyQuotes).mockResolvedValue(eurQuotes);

    const card = await getEurBrlCard();

    expect(getCurrencyQuotes).toHaveBeenCalledWith(
      'EUR',
      expect.any(Date),
      expect.any(Date),
    );
    expect(card).toMatchObject({
      name: 'EUR / BRL',
      identifier: 'eur-brl',
      type: 'price',
      price: 603,
      percentage: null,
      indicator: 1.22,
      referenceDate: '2026-08-19',
      description: 'Comparando com 5 dias úteis anteriores',
    });
  });
});

describe('getFedFundsCard', () => {
  it('should map the latest rate and the month-over-month change', async () => {
    vi.mocked(getSeriesObservations).mockResolvedValue([
      { date: '2026-07-01', value: '4.33' },
      { date: '2026-06-01', value: '4.33' },
      { date: '2026-05-01', value: '4.33' },
    ]);

    const card = await getFedFundsCard();

    expect(card).toMatchObject({
      name: 'Fed Funds',
      identifier: 'fed-funds',
      type: 'percentage',
      price: null,
      percentage: 4.33,
      indicator: 0,
      referenceDate: '2026-07-01',
      description: 'Comparando com mês anterior',
    });
  });
});

describe('listCards', () => {
  it('should put the live FX cards first', async () => {
    vi.mocked(getDollarQuotes).mockResolvedValue(usdQuotes);
    vi.mocked(getCurrencyQuotes).mockResolvedValue(eurQuotes);
    vi.mocked(getSeriesObservations).mockResolvedValue([
      { date: '2026-07-01', value: '4.33' },
      { date: '2026-06-01', value: '4.33' },
    ]);

    const cards = await listCards();

    expect(cards.map((card) => card.identifier)).toEqual([
      'usd-brl',
      'eur-brl',
      'fed-funds',
      'us-cpi',
    ]);
  });
});
