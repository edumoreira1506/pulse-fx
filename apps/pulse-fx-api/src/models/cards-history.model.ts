import {
  getCurrencyQuotes,
  getDollarQuotes,
  type PtaxQuote,
} from '../services/olinda.service';
import {
  FED_FUNDS_SERIES_ID,
  US_CPI_SERIES_ID,
  getSeriesObservations,
  parseFredValue,
  type FredObservation,
} from '../services/fred.service';
import {
  findLatestObservations,
  findObservationsByIndicatorAndPeriod,
  saveObservations,
  type CachedObservation,
} from './observations.model';

export interface HistoryItem {
  date: string;
  value: number;
}

export const FX_HISTORY_PERIODS = [
  'LAST_5_BUSINESS_DAY',
  'LAST_30_DAYS',
  'LAST_90_DAYS',
  'LAST_ONE_YEAR',
] as const;

export const MONTHLY_HISTORY_PERIODS = [
  'LAST_ONE_YEAR',
  'LAST_TWO_YEARS',
  'LAST_FIVE_YEARS',
] as const;

export type FxHistoryPeriod = (typeof FX_HISTORY_PERIODS)[number];
export type MonthlyHistoryPeriod = (typeof MONTHLY_HISTORY_PERIODS)[number];
export type HistoryPeriod = FxHistoryPeriod | MonthlyHistoryPeriod;

const FX_CARD_IDS = new Set(['usd-brl', 'eur-brl']);
const MONTHLY_CARD_IDS = new Set(['fed-funds', 'us-cpi']);

const FX_QUOTE_DAYS = 1 + 5;
const FX_BUSINESS_DAY_LOOKBACK = 14;
const FX_PERIOD_BUFFER_DAYS = 7;

const MONTHLY_PERIOD_LIMITS: Record<MonthlyHistoryPeriod, number> = {
  LAST_ONE_YEAR: 12,
  LAST_TWO_YEARS: 24,
  LAST_FIVE_YEARS: 60,
};

export class UnknownCardIndicatorError extends Error {
  constructor(cardIndicatorId: string) {
    super(`Card indicator ${cardIndicatorId} was not found`);
    this.name = 'UnknownCardIndicatorError';
  }
}

export class InvalidHistoryPeriodError extends Error {
  constructor(cardIndicatorId: string, period: string) {
    super(`Period ${period} is not valid for indicator ${cardIndicatorId}`);
    this.name = 'InvalidHistoryPeriodError';
  }
}

export async function listCardHistory(
  cardIndicatorId: string,
  period?: string,
): Promise<HistoryItem[]> {
  if (FX_CARD_IDS.has(cardIndicatorId)) {
    return getFxHistory(
      cardIndicatorId,
      resolveFxPeriod(cardIndicatorId, period),
    );
  }

  if (MONTHLY_CARD_IDS.has(cardIndicatorId)) {
    return getMonthlyHistory(
      cardIndicatorId,
      resolveMonthlyPeriod(cardIndicatorId, period),
    );
  }

  throw new UnknownCardIndicatorError(cardIndicatorId);
}

function resolveFxPeriod(
  cardIndicatorId: string,
  period?: string,
): FxHistoryPeriod {
  const resolved = period || 'LAST_5_BUSINESS_DAY';

  if (isFxHistoryPeriod(resolved)) {
    return resolved;
  }

  throw new InvalidHistoryPeriodError(cardIndicatorId, resolved);
}

function resolveMonthlyPeriod(
  cardIndicatorId: string,
  period?: string,
): MonthlyHistoryPeriod {
  const resolved = period || 'LAST_ONE_YEAR';

  if (isMonthlyHistoryPeriod(resolved)) {
    return resolved;
  }

  throw new InvalidHistoryPeriodError(cardIndicatorId, resolved);
}

function isFxHistoryPeriod(period: string): period is FxHistoryPeriod {
  return (FX_HISTORY_PERIODS as readonly string[]).includes(period);
}

function isMonthlyHistoryPeriod(
  period: string,
): period is MonthlyHistoryPeriod {
  return (MONTHLY_HISTORY_PERIODS as readonly string[]).includes(period);
}

async function getFxHistory(
  identifier: string,
  period: FxHistoryPeriod,
): Promise<HistoryItem[]> {
  // FX é diário (PTAX). LAST_5_BUSINESS_DAY usa a mesma janela do card:
  // cotação mais recente + 5 dias úteis anteriores.
  const { lookbackStart, periodStart, endDate } = getFxHistoryWindow(period);
  const quotes = await getFxQuotesFromCacheOrApi({
    identifier,
    lookbackStart,
    periodStart,
    endDate,
    period,
    fetchQuotes: () =>
      identifier === 'usd-brl'
        ? getDollarQuotes(lookbackStart, endDate)
        : getCurrencyQuotes('EUR', lookbackStart, endDate),
  });

  const dailyQuotes = latestQuotePerDay(quotes);
  const historyQuotes =
    period === 'LAST_5_BUSINESS_DAY'
      ? dailyQuotes.slice(-FX_QUOTE_DAYS)
      : dailyQuotes.filter(
          (quote) => toIsoDate(quote.dataHoraCotacao) >= formatIsoDate(periodStart),
        );

  if (period === 'LAST_5_BUSINESS_DAY' && historyQuotes.length < FX_QUOTE_DAYS) {
    throw new Error(`Not enough quotes to build ${identifier} history`);
  }

  if (historyQuotes.length === 0) {
    throw new Error(`Not enough quotes to build ${identifier} history`);
  }

  return historyQuotes.map((quote) => ({
    date: toIsoDate(quote.dataHoraCotacao),
    value: quote.cotacaoVenda,
  }));
}

async function getMonthlyHistory(
  identifier: string,
  period: MonthlyHistoryPeriod,
): Promise<HistoryItem[]> {
  // FRED é mensal: 12, 24 ou 60 observações conforme o período.
  const limit = MONTHLY_PERIOD_LIMITS[period];
  const seriesId =
    identifier === 'fed-funds' ? FED_FUNDS_SERIES_ID : US_CPI_SERIES_ID;

  // Cache local primeiro: as últimas N observações mensais do indicador.
  const cached = await findLatestObservations(identifier, limit);

  if (hasRequiredMonthlyHistoryCache(cached, limit)) {
    return cached.map((observation) => ({
      date: observation.referenceDate,
      value: observation.value,
    }));
  }

  const monthlyValues = toMonthlyFredValues(
    await getSeriesObservations(seriesId, limit),
  );

  if (monthlyValues.length === 0) {
    throw new Error(`Not enough observations to build ${identifier} history`);
  }

  await saveObservations(identifier, monthlyValues);
  return monthlyValues;
}

async function getFxQuotesFromCacheOrApi({
  identifier,
  lookbackStart,
  periodStart,
  endDate,
  period,
  fetchQuotes,
}: {
  identifier: string;
  lookbackStart: Date;
  periodStart: Date;
  endDate: Date;
  period: FxHistoryPeriod;
  fetchQuotes: () => Promise<PtaxQuote[]>;
}): Promise<PtaxQuote[]> {
  const requestedDate = formatIsoDate(endDate);

  // Cache local primeiro: observations.indicator = identifier do card.
  const cached = await findObservationsByIndicatorAndPeriod(
    identifier,
    formatIsoDate(lookbackStart),
    requestedDate,
  );

  if (hasRequiredFxHistoryCache(cached, period, periodStart, requestedDate)) {
    return observationsToQuotes(cached);
  }

  // Cache incompleto para o período: busca a Olinda e persiste as cotações diárias.
  const quotes = await fetchQuotes();
  await saveObservations(
    identifier,
    latestQuotePerDay(quotes).map((quote) => ({
      date: toIsoDate(quote.dataHoraCotacao),
      value: quote.cotacaoVenda,
    })),
  );
  return quotes;
}

function getFxHistoryWindow(period: FxHistoryPeriod): {
  lookbackStart: Date;
  periodStart: Date;
  endDate: Date;
} {
  const endDate = getBrazilCalendarDate();
  const calendarDays = fxCalendarDays(period);
  const periodStart = addCalendarDays(endDate, -calendarDays);
  const lookbackStart =
    period === 'LAST_5_BUSINESS_DAY'
      ? addCalendarDays(endDate, -FX_BUSINESS_DAY_LOOKBACK)
      : addCalendarDays(periodStart, -FX_PERIOD_BUFFER_DAYS);

  return { lookbackStart, periodStart, endDate };
}

function fxCalendarDays(period: FxHistoryPeriod): number {
  switch (period) {
    case 'LAST_5_BUSINESS_DAY':
      return FX_BUSINESS_DAY_LOOKBACK;
    case 'LAST_30_DAYS':
      return 30;
    case 'LAST_90_DAYS':
      return 90;
    case 'LAST_ONE_YEAR':
      return 365;
  }
}

function hasRequiredFxHistoryCache(
  cached: CachedObservation[],
  period: FxHistoryPeriod,
  periodStart: Date,
  requestedDate: string,
): boolean {
  if (!cached.some((observation) => observation.referenceDate === requestedDate)) {
    return false;
  }

  if (period === 'LAST_5_BUSINESS_DAY') {
    return cached.length >= FX_QUOTE_DAYS;
  }

  const coverageDeadline = formatIsoDate(
    addCalendarDays(periodStart, FX_PERIOD_BUFFER_DAYS),
  );
  return cached[0].referenceDate <= coverageDeadline;
}

function hasRequiredMonthlyHistoryCache(
  cached: CachedObservation[],
  limit: number,
): boolean {
  if (cached.length < limit) {
    return false;
  }

  const latest = cached[cached.length - 1];
  return (
    isUpdatedToday(latest.updatedAt) ||
    isLatestMonthRecentEnough(latest.referenceDate)
  );
}

function isUpdatedToday(updatedAt: Date): boolean {
  const today = new Date();
  return (
    updatedAt.getUTCFullYear() === today.getUTCFullYear() &&
    updatedAt.getUTCMonth() === today.getUTCMonth() &&
    updatedAt.getUTCDate() === today.getUTCDate()
  );
}

function isLatestMonthRecentEnough(referenceDate: string): boolean {
  const today = new Date();
  const previousMonthStart = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 1, 1),
  );
  const [year, month, day] = referenceDate.split('-').map(Number);
  const latest = new Date(Date.UTC(year, month - 1, day));
  return latest >= previousMonthStart;
}

function toMonthlyFredValues(
  observations: FredObservation[],
): HistoryItem[] {
  return observations
    .map((observation) => ({
      date: observation.date,
      value: parseFredValue(observation.value),
    }))
    .filter(
      (observation): observation is HistoryItem => observation.value != null,
    )
    .sort((left, right) => left.date.localeCompare(right.date));
}

function observationsToQuotes(cached: CachedObservation[]): PtaxQuote[] {
  return cached.map((observation) => ({
    cotacaoCompra: observation.value,
    cotacaoVenda: observation.value,
    dataHoraCotacao: `${observation.referenceDate} 13:00:00`,
  }));
}

function latestQuotePerDay(quotes: PtaxQuote[]): PtaxQuote[] {
  const quotesByDay = new Map<string, PtaxQuote>();

  for (const quote of quotes) {
    const day = toIsoDate(quote.dataHoraCotacao);
    const existing = quotesByDay.get(day);

    if (!existing || quote.dataHoraCotacao > existing.dataHoraCotacao) {
      quotesByDay.set(day, quote);
    }
  }

  return [...quotesByDay.values()].sort((left, right) =>
    left.dataHoraCotacao.localeCompare(right.dataHoraCotacao),
  );
}

function toIsoDate(dataHoraCotacao: string): string {
  return dataHoraCotacao.slice(0, 10);
}

function formatIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addCalendarDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function getBrazilCalendarDate(now = new Date()): Date {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);

  const year = Number(parts.find((part) => part.type === 'year')?.value);
  const month = Number(parts.find((part) => part.type === 'month')?.value);
  const day = Number(parts.find((part) => part.type === 'day')?.value);

  return new Date(year, month - 1, day);
}
