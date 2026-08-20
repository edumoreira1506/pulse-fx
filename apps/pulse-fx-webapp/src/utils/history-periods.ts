import type { HistoryPeriod } from '../services/cards.service';

export interface HistoryPeriodOption {
  value: HistoryPeriod;
  label: string;
}

const FX_CARD_IDS = new Set(['usd-brl', 'eur-brl']);
const MONTHLY_CARD_IDS = new Set(['fed-funds', 'us-cpi']);

const FX_PERIODS: HistoryPeriodOption[] = [
  { value: 'LAST_5_BUSINESS_DAY', label: 'Últimos 5 dias úteis' },
  { value: 'LAST_30_DAYS', label: 'Últimos 30 dias' },
  { value: 'LAST_90_DAYS', label: 'Últimos 90 dias' },
  { value: 'LAST_ONE_YEAR', label: 'Último ano' },
];

const MONTHLY_PERIODS: HistoryPeriodOption[] = [
  { value: 'LAST_ONE_YEAR', label: 'Último ano' },
  { value: 'LAST_TWO_YEARS', label: 'Últimos 2 anos' },
  { value: 'LAST_FIVE_YEARS', label: 'Últimos 5 anos' },
];

export function isFxCardIdentifier(identifier: string): boolean {
  return FX_CARD_IDS.has(identifier);
}

export function getHistoryPeriodOptions(
  identifier: string,
): HistoryPeriodOption[] {
  return isFxCardIdentifier(identifier) ? FX_PERIODS : MONTHLY_PERIODS;
}

export function getDefaultHistoryPeriod(identifier: string): HistoryPeriod {
  return isFxCardIdentifier(identifier)
    ? 'LAST_5_BUSINESS_DAY'
    : 'LAST_ONE_YEAR';
}

export function resolveHistoryPeriod(
  identifier: string,
  period: string | null,
): HistoryPeriod {
  const options = getHistoryPeriodOptions(identifier);
  const match = options.find((option) => option.value === period);
  return match?.value ?? getDefaultHistoryPeriod(identifier);
}

export function isMonthlyCardIdentifier(identifier: string): boolean {
  return MONTHLY_CARD_IDS.has(identifier);
}
