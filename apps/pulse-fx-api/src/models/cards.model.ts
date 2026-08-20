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
}

// Janela em dias corridos enviada à Olinda. Precisa ser maior que
// “hoje + 5 dias úteis” para cobrir fins de semana e feriados.
const CALENDAR_LOOKBACK_DAYS = 14;
// Cotações usadas no card: o dia mais recente + 5 dias úteis anteriores.
const FX_QUOTE_DAYS = 1 + 5;

export async function listCards(): Promise<Card[]> {
  const [usdBrl, eurBrl, fedFunds, usCpi] = await Promise.all([
    getUsdBrlCard(),
    getEurBrlCard(),
    getFedFundsCard(),
    getUsCpiCard(),
  ]);
  return [usdBrl, eurBrl, fedFunds, usCpi];
}

export async function getUsdBrlCard(): Promise<Card> {
  const { startDate, endDate } = getPtaxPeriod();
  const quotes = await getDollarQuotes(startDate, endDate);
  return buildFxPriceCard({
    name: 'USD / BRL',
    identifier: 'usd-brl',
    quotes,
  });
}

export async function getEurBrlCard(): Promise<Card> {
  const { startDate, endDate } = getPtaxPeriod();
  const quotes = await getCurrencyQuotes('EUR', startDate, endDate);
  return buildFxPriceCard({
    name: 'EUR / BRL',
    identifier: 'eur-brl',
    quotes,
  });
}

export async function getFedFundsCard(): Promise<Card> {
  // Série mensal FEDFUNDS: taxa efetiva dos fed funds.
  const monthlyValues = await getMonthlyFredValues(FED_FUNDS_SERIES_ID);
  const { current, previous } = latestFredPair(monthlyValues, 'Fed Funds');
  // Variação em pontos percentuais em relação ao mês anterior (4,33 → 4,33 = 0).
  const indicator = roundToTwo(current.value - previous.value);

  return {
    name: 'Fed Funds',
    identifier: 'fed-funds',
    type: 'percentage',
    price: null,
    percentage: current.value,
    indicator,
    referenceDate: current.date,
    description: 'Comparando com mês anterior',
  };
}

export async function getUsCpiCard(): Promise<Card> {
  // CPIAUCSL é o nível do índice, não a inflação. A inflação mensal é
  // ((atual - anterior) / anterior) * 100.
  const monthlyValues = await getMonthlyFredValues(US_CPI_SERIES_ID);
  const { current, previous } = latestFredPair(monthlyValues, 'US CPI');
  const monthlyInflation =
    previous.value === 0
      ? 0
      : ((current.value - previous.value) / previous.value) * 100;
  const inflation = roundToTwo(monthlyInflation);

  return {
    name: 'US CPI',
    identifier: 'us-cpi',
    type: 'percentage',
    price: null,
    percentage: inflation,
    indicator: inflation,
    referenceDate: current.date,
    description: 'Comparando com mês anterior',
  };
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
  name,
  identifier,
  quotes,
}: {
  name: string;
  identifier: string;
  quotes: PtaxQuote[];
}): Card {
  // Uma cotação por dia útil, da mais antiga para a mais recente.
  const dailyQuotes = latestQuotePerDay(quotes);
  // Fica só com hoje (ou o último dia com PTAX) e os 5 dias úteis anteriores.
  const recentQuotes = dailyQuotes.slice(-FX_QUOTE_DAYS);

  if (recentQuotes.length < FX_QUOTE_DAYS) {
    throw new Error(`Not enough quotes to build ${name} card`);
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
    name,
    identifier,
    type: 'price',
    // Front-end espera o preço em centavos (5,17 → 517).
    price: Math.round(current.cotacaoVenda * 100),
    percentage: null,
    indicator: roundToTwo(indicator),
    // Data da cotação mais recente retornada pela Olinda.
    referenceDate: toIsoDate(current.dataHoraCotacao),
    description: 'Comparando com 5 dias úteis anteriores',
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
