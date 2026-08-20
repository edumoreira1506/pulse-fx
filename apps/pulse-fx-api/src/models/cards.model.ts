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
import { findFavoriteIndicatorIds } from './favorites.model';

export type CardType = 'price' | 'percentage';

export interface Card {
  name: string;
  identifier: string;
  type: CardType;
  price: number | null;
  percentage: number | null;
  indicator: number;
  referenceDate: string;
  description: string;
  tooltip: string;
  isFavorite: boolean;
}

type CardBody = Omit<Card, 'isFavorite'>;

interface CardCopy {
  name: string;
  description: string;
  tooltip: string;
}

export const USD_BRL_COPY: CardCopy = {
  name: 'Dólar / Real',
  description: 'Comparando com 5 dias úteis anteriores',
  tooltip:
    'Cotação de venda do dólar americano em reais pela PTAX do Banco Central do Brasil. A variação compara a cotação mais recente com a 5ª observação útil anterior disponível, ignorando dias sem cotação.',
};

export const EUR_BRL_COPY: CardCopy = {
  name: 'Euro / Real',
  description: 'Comparando com 5 dias úteis anteriores',
  tooltip:
    'Cotação de venda do euro em reais divulgada pelo Banco Central do Brasil. A variação compara a cotação mais recente com a 5ª observação útil anterior disponível, ignorando dias sem cotação.',
};

export const FED_FUNDS_COPY: CardCopy = {
  name: 'Juros dos EUA',
  description: 'Comparando com mês anterior',
  tooltip:
    'Taxa efetiva média dos empréstimos de curtíssimo prazo entre instituições financeiras dos EUA. A variação compara percentualmente a observação mensal mais recente com a do mês anterior.',
};

export const US_CPI_COPY: CardCopy = {
  name: 'Índice de Preços dos EUA',
  description: 'Comparando com mês anterior',
  tooltip:
    'Índice que acompanha a evolução dos preços de bens e serviços consumidos nos EUA. A variação mostra a mudança percentual do índice no mês, comparando a observação mais recente com a do mês anterior.',
};

// Janela em dias corridos enviada à Olinda. Precisa ser maior que
// “hoje + 5 dias úteis” para cobrir fins de semana e feriados.
const CALENDAR_LOOKBACK_DAYS = 14;
// Cotações usadas no card: o dia mais recente + 5 dias úteis anteriores.
const FX_QUOTE_DAYS = 1 + 5;

export async function listCards(): Promise<Card[]> {
  const [usdBrl, eurBrl, fedFunds, usCpi, favoriteIds] = await Promise.all([
    getUsdBrlCard(),
    getEurBrlCard(),
    getFedFundsCard(),
    getUsCpiCard(),
    findFavoriteIndicatorIds(['usd-brl', 'eur-brl', 'fed-funds', 'us-cpi']),
  ]);

  return [usdBrl, eurBrl, fedFunds, usCpi].map((card) => ({
    ...card,
    isFavorite: favoriteIds.has(card.identifier),
  }));
}

export async function getUsdBrlCard(): Promise<CardBody> {
  const { startDate, endDate } = getPtaxPeriod();
  const quotes = await getFxQuotesFromCacheOrApi({
    identifier: 'usd-brl',
    startDate,
    endDate,
    fetchQuotes: () => getDollarQuotes(startDate, endDate),
  });
  return buildFxPriceCard({
    copy: USD_BRL_COPY,
    identifier: 'usd-brl',
    quotes,
  });
}

export async function getEurBrlCard(): Promise<CardBody> {
  const { startDate, endDate } = getPtaxPeriod();
  const quotes = await getFxQuotesFromCacheOrApi({
    identifier: 'eur-brl',
    startDate,
    endDate,
    fetchQuotes: () => getCurrencyQuotes('EUR', startDate, endDate),
  });
  return buildFxPriceCard({
    copy: EUR_BRL_COPY,
    identifier: 'eur-brl',
    quotes,
  });
}

export async function getFedFundsCard(): Promise<CardBody> {
  // Série mensal FEDFUNDS: taxa efetiva dos fed funds.
  const monthlyValues = await getMonthlyValuesFromCacheOrApi(
    'fed-funds',
    FED_FUNDS_SERIES_ID,
  );
  const { current, previous } = latestFredPair(
    monthlyValues,
    FED_FUNDS_COPY.name,
  );
  // Variação em pontos percentuais em relação ao mês anterior (4,33 → 4,33 = 0).
  const indicator = roundToTwo(current.value - previous.value);

  return {
    ...FED_FUNDS_COPY,
    identifier: 'fed-funds',
    type: 'percentage',
    price: null,
    percentage: current.value,
    indicator,
    referenceDate: current.date,
  };
}

export async function getUsCpiCard(): Promise<CardBody> {
  // CPIAUCSL é o nível do índice, não a inflação. A inflação mensal é
  // ((atual - anterior) / anterior) * 100.
  const monthlyValues = await getMonthlyValuesFromCacheOrApi(
    'us-cpi',
    US_CPI_SERIES_ID,
  );
  const { current, previous } = latestFredPair(monthlyValues, US_CPI_COPY.name);
  const monthlyInflation =
    previous.value === 0
      ? 0
      : ((current.value - previous.value) / previous.value) * 100;
  const inflation = roundToTwo(monthlyInflation);

  return {
    ...US_CPI_COPY,
    identifier: 'us-cpi',
    type: 'percentage',
    price: null,
    percentage: inflation,
    indicator: inflation,
    referenceDate: current.date,
  };
}

async function getFxQuotesFromCacheOrApi({
  identifier,
  startDate,
  endDate,
  fetchQuotes,
}: {
  identifier: string;
  startDate: Date;
  endDate: Date;
  fetchQuotes: () => Promise<PtaxQuote[]>;
}): Promise<PtaxQuote[]> {
  const requestedDate = formatIsoDate(endDate);

  // Cache local primeiro: observations.indicator = identifier do card, na data pedida
  // (hoje no calendário de Brasília) e nas observações úteis anteriores.
  const cached = await findObservationsByIndicatorAndPeriod(
    identifier,
    formatIsoDate(startDate),
    requestedDate,
  );

  if (hasRequiredFxCache(cached, requestedDate)) {
    return observationsToQuotes(cached);
  }

  // Primeira vez (ou cache incompleto): busca a API e grava para a próxima request.
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

async function getMonthlyValuesFromCacheOrApi(
  identifier: string,
  seriesId: string,
): Promise<Array<{ date: string; value: number }>> {
  // Cache local primeiro: observations.indicator = identifier do card.
  const cached = await findLatestObservations(identifier, 6);

  if (hasRequiredMonthlyCache(cached)) {
    return cached.map((observation) => ({
      date: observation.referenceDate,
      value: observation.value,
    }));
  }

  // Primeira vez (ou mês novo ainda não gravado): busca a FRED e persiste.
  const monthlyValues = await getMonthlyFredValues(seriesId);
  await saveObservations(
    identifier,
    monthlyValues.map((observation) => ({
      date: observation.date,
      value: observation.value,
    })),
  );
  return monthlyValues;
}

function hasRequiredFxCache(
  cached: CachedObservation[],
  requestedDate: string,
): boolean {
  return (
    cached.length >= FX_QUOTE_DAYS &&
    cached.some((observation) => observation.referenceDate === requestedDate)
  );
}

function hasRequiredMonthlyCache(cached: CachedObservation[]): boolean {
  if (cached.length < 2) {
    return false;
  }

  const latest = cached[cached.length - 1];
  return isUpdatedToday(latest.updatedAt) || isLatestMonthRecentEnough(latest.referenceDate);
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

function observationsToQuotes(cached: CachedObservation[]): PtaxQuote[] {
  return cached.map((observation) => ({
    cotacaoCompra: observation.value,
    cotacaoVenda: observation.value,
    dataHoraCotacao: `${observation.referenceDate} 13:00:00`,
  }));
}

function formatIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function getMonthlyFredValues(
  seriesId: string,
): Promise<Array<{ date: string; value: number }>> {
  const observations = await getSeriesObservations(seriesId, 6);
  return toMonthlyFredValues(observations);
}

function toMonthlyFredValues(
  observations: FredObservation[],
): Array<{ date: string; value: number }> {
  return observations
    .map((observation) => ({
      date: observation.date,
      value: parseFredValue(observation.value),
    }))
    .filter(
      (observation): observation is { date: string; value: number } =>
        observation.value != null,
    )
    .sort((left, right) => left.date.localeCompare(right.date));
}

function latestFredPair(
  monthlyValues: Array<{ date: string; value: number }>,
  cardName: string,
): {
  current: { date: string; value: number };
  previous: { date: string; value: number };
} {
  if (monthlyValues.length < 2) {
    throw new Error(`Not enough observations to build ${cardName} card`);
  }

  return {
    current: monthlyValues[monthlyValues.length - 1],
    previous: monthlyValues[monthlyValues.length - 2],
  };
}

function getPtaxPeriod(): { startDate: Date; endDate: Date } {
  // Datas no fuso de Brasília, que é o calendário da PTAX.
  const endDate = getBrazilCalendarDate();
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - CALENDAR_LOOKBACK_DAYS);
  return { startDate, endDate };
}

function buildFxPriceCard({
  copy,
  identifier,
  quotes,
}: {
  copy: CardCopy;
  identifier: string;
  quotes: PtaxQuote[];
}): CardBody {
  // Uma cotação por dia útil, da mais antiga para a mais recente.
  const dailyQuotes = latestQuotePerDay(quotes);
  // Fica só com hoje (ou o último dia com PTAX) e os 5 dias úteis anteriores.
  const recentQuotes = dailyQuotes.slice(-FX_QUOTE_DAYS);

  if (recentQuotes.length < FX_QUOTE_DAYS) {
    throw new Error(`Not enough quotes to build ${copy.name} card`);
  }

  const current = recentQuotes[recentQuotes.length - 1];
  const previous = recentQuotes[0];
  // Variação percentual da cotação de venda: hoje vs 5 dias úteis atrás.
  const indicator =
    previous.cotacaoVenda === 0
      ? 0
      : ((current.cotacaoVenda - previous.cotacaoVenda) / previous.cotacaoVenda) *
        100;

  return {
    ...copy,
    identifier,
    type: 'price',
    // Front-end espera o preço em centavos (5,17 → 517).
    price: Math.round(current.cotacaoVenda * 100),
    percentage: null,
    indicator: roundToTwo(indicator),
    // Data da cotação mais recente retornada pela Olinda.
    referenceDate: toIsoDate(current.dataHoraCotacao),
  };
}

function latestQuotePerDay(quotes: PtaxQuote[]): PtaxQuote[] {
  const quotesByDay = new Map<string, PtaxQuote>();

  for (const quote of quotes) {
    const day = toIsoDate(quote.dataHoraCotacao);
    const existing = quotesByDay.get(day);

    // Se o dia tiver mais de um boletim, fica o de dataHoraCotacao mais tarde.
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

function roundToTwo(value: number): number {
  return Math.round(value * 100) / 100;
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
