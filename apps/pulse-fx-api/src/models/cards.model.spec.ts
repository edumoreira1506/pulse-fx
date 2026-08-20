import {
  EUR_BRL_COPY,
  FED_FUNDS_COPY,
  US_CPI_COPY,
  USD_BRL_COPY,
  getEurBrlCard,
  getFedFundsCard,
  getUsCpiCard,
  getUsdBrlCard,
  listCards,
} from './cards.model';
import { getCurrencyQuotes, getDollarQuotes } from '../services/olinda.service';
import { getSeriesObservations } from '../services/fred.service';
import {
  findLatestObservations,
  findObservationsByIndicatorAndPeriod,
  saveObservations,
} from './observations.model';
import { findFavoriteIndicatorIds } from './favorites.model';

const observationMocks = vi.hoisted(() => ({
  findObservationsByIndicatorAndPeriod: vi.fn(),
  findLatestObservations: vi.fn(),
  saveObservations: vi.fn(),
}));

const favoriteMocks = vi.hoisted(() => ({
  findFavoriteIndicatorIds: vi.fn(),
}));

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

vi.mock('./observations.model', () => observationMocks);
vi.mock('./favorites.model', () => favoriteMocks);

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

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(findObservationsByIndicatorAndPeriod).mockResolvedValue([]);
  vi.mocked(findLatestObservations).mockResolvedValue([]);
  vi.mocked(saveObservations).mockResolvedValue(undefined);
  vi.mocked(findFavoriteIndicatorIds).mockResolvedValue(new Set());
});

describe('getUsdBrlCard', () => {
  it('should map the newest quote and 5-business-day change', async () => {
    vi.mocked(getDollarQuotes).mockResolvedValue(usdQuotes);

    const card = await getUsdBrlCard();

    expect(saveObservations).toHaveBeenCalledWith(
      'usd-brl',
      expect.arrayContaining([
        { date: '2026-08-19', value: 5.1714 },
      ]),
    );
    expect(card).toMatchObject({
      ...USD_BRL_COPY,
      identifier: 'usd-brl',
      type: 'price',
      price: 517,
      percentage: null,
      indicator: 0.15,
      referenceDate: '2026-08-19',
    });
  });

  it('should use cached FX observations instead of the API', async () => {
    const today = brazilTodayDate();
    const cached = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(today);
      date.setDate(date.getDate() - (5 - index));
      return {
        indicator: 'usd-brl',
        value: 5.1 + index * 0.01,
        referenceDate: formatIso(date),
        updatedAt: new Date(),
      };
    });

    vi.mocked(findObservationsByIndicatorAndPeriod).mockResolvedValue(cached);

    const card = await getUsdBrlCard();

    expect(getDollarQuotes).not.toHaveBeenCalled();
    expect(saveObservations).not.toHaveBeenCalled();
    expect(card.identifier).toBe('usd-brl');
    expect(card.referenceDate).toBe(formatIso(today));
  });

  it('should throw when there are not enough quotes', async () => {
    vi.mocked(getDollarQuotes).mockResolvedValue(usdQuotes.slice(0, 5));

    await expect(getUsdBrlCard()).rejects.toThrow(
      `Not enough quotes to build ${USD_BRL_COPY.name} card`,
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
      ...EUR_BRL_COPY,
      identifier: 'eur-brl',
      type: 'price',
      price: 603,
      percentage: null,
      indicator: 1.22,
      referenceDate: '2026-08-19',
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

    expect(saveObservations).toHaveBeenCalledWith('fed-funds', [
      { date: '2026-05-01', value: 4.33 },
      { date: '2026-06-01', value: 4.33 },
      { date: '2026-07-01', value: 4.33 },
    ]);
    expect(card).toMatchObject({
      ...FED_FUNDS_COPY,
      identifier: 'fed-funds',
      type: 'percentage',
      price: null,
      percentage: 4.33,
      indicator: 0,
      referenceDate: '2026-07-01',
    });
  });

  it('should use cached monthly observations instead of the API', async () => {
    vi.mocked(findLatestObservations).mockResolvedValue([
      {
        indicator: 'fed-funds',
        value: 4.33,
        referenceDate: '2026-06-01',
        updatedAt: new Date(),
      },
      {
        indicator: 'fed-funds',
        value: 4.33,
        referenceDate: '2026-07-01',
        updatedAt: new Date(),
      },
    ]);

    const card = await getFedFundsCard();

    expect(getSeriesObservations).not.toHaveBeenCalled();
    expect(saveObservations).not.toHaveBeenCalled();
    expect(card).toMatchObject({
      identifier: 'fed-funds',
      percentage: 4.33,
      indicator: 0,
      referenceDate: '2026-07-01',
    });
  });
});

describe('getUsCpiCard', () => {
  it('should map monthly inflation from the CPI index', async () => {
    vi.mocked(getSeriesObservations).mockResolvedValue([
      { date: '2026-07-01', value: '322.40' },
      { date: '2026-06-01', value: '321.50' },
      { date: '2026-05-01', value: '320.10' },
    ]);

    const card = await getUsCpiCard();

    expect(getSeriesObservations).toHaveBeenCalledWith('CPIAUCSL', 6);
    expect(card).toMatchObject({
      ...US_CPI_COPY,
      identifier: 'us-cpi',
      type: 'percentage',
      price: null,
      percentage: 0.28,
      indicator: 0.28,
      referenceDate: '2026-07-01',
    });
  });

  it('should throw when there are not enough observations', async () => {
    vi.mocked(getSeriesObservations).mockResolvedValue([
      { date: '2026-07-01', value: '322.40' },
    ]);

    await expect(getUsCpiCard()).rejects.toThrow(
      `Not enough observations to build ${US_CPI_COPY.name} card`,
    );
  });
});

describe('listCards', () => {
  it('should put the live FX and FRED cards first', async () => {
    vi.mocked(getDollarQuotes).mockResolvedValue(usdQuotes);
    vi.mocked(getCurrencyQuotes).mockResolvedValue(eurQuotes);
    vi.mocked(getSeriesObservations).mockImplementation(async (seriesId) => {
      if (seriesId === 'CPIAUCSL') {
        return [
          { date: '2026-07-01', value: '322.40' },
          { date: '2026-06-01', value: '321.50' },
        ];
      }

      return [
        { date: '2026-07-01', value: '4.33' },
        { date: '2026-06-01', value: '4.33' },
      ];
    });

    const cards = await listCards();

    expect(cards.map((card) => card.identifier)).toEqual([
      'usd-brl',
      'eur-brl',
      'fed-funds',
      'us-cpi',
    ]);
    expect(cards.map((card) => card.isFavorite)).toEqual([
      false,
      false,
      false,
      false,
    ]);
  });

  it('should mark favorited indicators', async () => {
    vi.mocked(getDollarQuotes).mockResolvedValue(usdQuotes);
    vi.mocked(getCurrencyQuotes).mockResolvedValue(eurQuotes);
    vi.mocked(getSeriesObservations).mockResolvedValue([
      { date: '2026-07-01', value: '4.33' },
      { date: '2026-06-01', value: '4.33' },
    ]);
    vi.mocked(findFavoriteIndicatorIds).mockResolvedValue(
      new Set(['eur-brl', 'us-cpi']),
    );

    const cards = await listCards();

    expect(
      cards.map((card) => ({
        identifier: card.identifier,
        isFavorite: card.isFavorite,
      })),
    ).toEqual([
      { identifier: 'usd-brl', isFavorite: false },
      { identifier: 'eur-brl', isFavorite: true },
      { identifier: 'fed-funds', isFavorite: false },
      { identifier: 'us-cpi', isFavorite: true },
    ]);
  });
});

function brazilTodayDate(): Date {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const year = Number(parts.find((part) => part.type === 'year')?.value);
  const month = Number(parts.find((part) => part.type === 'month')?.value);
  const day = Number(parts.find((part) => part.type === 'day')?.value);
  return new Date(year, month - 1, day);
}

function formatIso(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
