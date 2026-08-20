import {
  InvalidHistoryPeriodError,
  UnknownCardIndicatorError,
  listCardHistory,
} from './cards-history.model';
import { getCurrencyQuotes, getDollarQuotes } from '../services/olinda.service';
import { getSeriesObservations } from '../services/fred.service';
import {
  findLatestObservations,
  findObservationsByIndicatorAndPeriod,
  saveObservations,
} from './observations.model';

const observationMocks = vi.hoisted(() => ({
  findObservationsByIndicatorAndPeriod: vi.fn(),
  findLatestObservations: vi.fn(),
  saveObservations: vi.fn(),
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
});

describe('listCardHistory', () => {
  describe('usd-brl and eur-brl', () => {
    it('should default to the last 6 business-day quotes, oldest first', async () => {
      vi.mocked(getDollarQuotes).mockResolvedValue(usdQuotes);

      const history = await listCardHistory('usd-brl');

      expect(getDollarQuotes).toHaveBeenCalled();
      expect(history).toEqual([
        { date: '2026-08-12', value: 5.1639 },
        { date: '2026-08-13', value: 5.1859 },
        { date: '2026-08-14', value: 5.2236 },
        { date: '2026-08-17', value: 5.2014 },
        { date: '2026-08-18', value: 5.2043 },
        { date: '2026-08-19', value: 5.1714 },
      ]);
    });

    it('should fetch EUR fechamento quotes for eur-brl', async () => {
      vi.mocked(getCurrencyQuotes).mockResolvedValue(eurQuotes);

      const history = await listCardHistory('eur-brl', 'LAST_5_BUSINESS_DAY');

      expect(getCurrencyQuotes).toHaveBeenCalledWith(
        'EUR',
        expect.any(Date),
        expect.any(Date),
      );
      expect(history[0]).toEqual({ date: '2026-08-12', value: 5.9597 });
      expect(history[history.length - 1]).toEqual({
        date: '2026-08-19',
        value: 6.0324,
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

      const history = await listCardHistory('usd-brl', 'LAST_5_BUSINESS_DAY');

      expect(getDollarQuotes).not.toHaveBeenCalled();
      expect(saveObservations).not.toHaveBeenCalled();
      expect(history).toHaveLength(6);
      expect(history[0].date).toBe(cached[0].referenceDate);
      expect(history[history.length - 1].date).toBe(formatIso(today));
    });

    it('should persist quotes after an API fetch', async () => {
      vi.mocked(getDollarQuotes).mockResolvedValue(usdQuotes);

      await listCardHistory('usd-brl', 'LAST_30_DAYS');

      expect(saveObservations).toHaveBeenCalledWith(
        'usd-brl',
        expect.arrayContaining([{ date: '2026-08-19', value: 5.1714 }]),
      );
    });

    it('should refetch when cached FX history does not cover the period', async () => {
      const today = brazilTodayDate();
      const recentOnly = Array.from({ length: 6 }, (_, index) => {
        const date = new Date(today);
        date.setDate(date.getDate() - (5 - index));
        return {
          indicator: 'usd-brl',
          value: 5.1 + index * 0.01,
          referenceDate: formatIso(date),
          updatedAt: new Date(),
        };
      });

      vi.mocked(findObservationsByIndicatorAndPeriod).mockResolvedValue(recentOnly);
      vi.mocked(getDollarQuotes).mockResolvedValue(usdQuotes);

      await listCardHistory('usd-brl', 'LAST_90_DAYS');

      expect(getDollarQuotes).toHaveBeenCalled();
    });

    it('should reject an FX period that is only valid for monthly cards', async () => {
      await expect(listCardHistory('usd-brl', 'LAST_TWO_YEARS')).rejects.toThrow(
        InvalidHistoryPeriodError,
      );
    });
  });

  describe('fed-funds and us-cpi', () => {
    it('should default to the last 12 monthly observations, oldest first', async () => {
      const observations = Array.from({ length: 12 }, (_, index) => ({
        date: `2025-${String(index + 1).padStart(2, '0')}-01`,
        value: String(4 + index * 0.01),
      }));
      vi.mocked(getSeriesObservations).mockResolvedValue(observations);

      const history = await listCardHistory('fed-funds');

      expect(getSeriesObservations).toHaveBeenCalledWith('FEDFUNDS', 12);
      expect(history).toHaveLength(12);
      expect(history[0]).toEqual({ date: '2025-01-01', value: 4 });
      expect(history[history.length - 1]).toEqual({
        date: '2025-12-01',
        value: 4.11,
      });
    });

    it('should fetch two years of CPI observations', async () => {
      vi.mocked(getSeriesObservations).mockResolvedValue([
        { date: '2026-07-01', value: '322.40' },
        { date: '2026-06-01', value: '321.50' },
      ]);

      const history = await listCardHistory('us-cpi', 'LAST_TWO_YEARS');

      expect(getSeriesObservations).toHaveBeenCalledWith('CPIAUCSL', 24);
      expect(history).toEqual([
        { date: '2026-06-01', value: 321.5 },
        { date: '2026-07-01', value: 322.4 },
      ]);
    });

    it('should use cached monthly observations instead of the API', async () => {
      const cached = Array.from({ length: 12 }, (_, index) => ({
        indicator: 'fed-funds',
        value: 4.33,
        referenceDate: `2025-${String(index + 1).padStart(2, '0')}-01`,
        updatedAt: new Date(),
      }));
      vi.mocked(findLatestObservations).mockResolvedValue(cached);

      const history = await listCardHistory('fed-funds', 'LAST_ONE_YEAR');

      expect(getSeriesObservations).not.toHaveBeenCalled();
      expect(saveObservations).not.toHaveBeenCalled();
      expect(history).toHaveLength(12);
      expect(history[0].date).toBe('2025-01-01');
      expect(history[history.length - 1].date).toBe('2025-12-01');
    });

    it('should refetch when the cache has fewer months than the period', async () => {
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
      vi.mocked(getSeriesObservations).mockResolvedValue(
        Array.from({ length: 60 }, (_, index) => ({
          date: `2021-${String((index % 12) + 1).padStart(2, '0')}-01`,
          value: '4.33',
        })),
      );

      await listCardHistory('fed-funds', 'LAST_FIVE_YEARS');

      expect(getSeriesObservations).toHaveBeenCalledWith('FEDFUNDS', 60);
    });

    it('should reject a daily period on monthly cards', async () => {
      await expect(
        listCardHistory('us-cpi', 'LAST_5_BUSINESS_DAY'),
      ).rejects.toThrow(InvalidHistoryPeriodError);
    });
  });

  it('should reject an unknown card indicator', async () => {
    await expect(listCardHistory('unknown')).rejects.toThrow(
      UnknownCardIndicatorError,
    );
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
