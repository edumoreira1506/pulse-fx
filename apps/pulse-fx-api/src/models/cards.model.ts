import { getDollarQuotes, type DollarQuote } from '../services/olinda.service';

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

const HARDCODED_CARDS: Card[] = [
  {
    name: 'EUR / BRL',
    identifier: 'eur-brl',
    type: 'price',
    price: 631,
    percentage: null,
    indicator: -0.82,
    referenceDate: '2026-08-18',
    description: 'Comparando com 5 dias úteis anteriores',
  },
  {
    name: 'Fed Funds',
    identifier: 'fed-funds',
    type: 'percentage',
    price: null,
    percentage: 5.25,
    indicator: 0,
    referenceDate: '2026-07-01',
    description: 'Comparando com mês anterior',
  },
  {
    name: 'US CPI',
    identifier: 'us-cpi',
    type: 'percentage',
    price: null,
    percentage: 2.7,
    indicator: 0.1,
    referenceDate: '2026-07-01',
    description: 'Comparando com mês anterior',
  },
];

// Janela em dias corridos enviada à Olinda. Precisa ser maior que
// “hoje + 5 dias úteis” para cobrir fins de semana e feriados.
const CALENDAR_LOOKBACK_DAYS = 14;
// Cotações usadas no card: o dia mais recente + 5 dias úteis anteriores.
const USD_BRL_QUOTE_DAYS = 1 + 5;

export async function listCards(): Promise<Card[]> {
  const usdBrl = await getUsdBrlCard();
  return [usdBrl, ...HARDCODED_CARDS];
}

export async function getUsdBrlCard(): Promise<Card> {
  // Datas no fuso de Brasília, que é o calendário da PTAX.
  const endDate = getBrazilCalendarDate();
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - CALENDAR_LOOKBACK_DAYS);

  const quotes = await getDollarQuotes(startDate, endDate);
  // Uma cotação por dia útil, da mais antiga para a mais recente.
  const dailyQuotes = latestQuotePerDay(quotes);
  // Fica só com hoje (ou o último dia com PTAX) e os 5 dias úteis anteriores.
  const recentQuotes = dailyQuotes.slice(-USD_BRL_QUOTE_DAYS);

  if (recentQuotes.length < USD_BRL_QUOTE_DAYS) {
    throw new Error('Not enough dollar quotes to build USD / BRL card');
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
    name: 'USD / BRL',
    identifier: 'usd-brl',
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

function latestQuotePerDay(quotes: DollarQuote[]): DollarQuote[] {
  const quotesByDay = new Map<string, DollarQuote>();

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
