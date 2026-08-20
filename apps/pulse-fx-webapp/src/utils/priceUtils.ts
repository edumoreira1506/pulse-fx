export function formatPrice(price: number): string {
  return formatCents(Math.trunc(price));
}

export function formatReais(value: number): string {
  return formatCents(truncateToCents(value));
}

export function formatPercentage(percentage: number): string {
  return `${formatDecimal(percentage)}%`;
}

export function formatDecimal(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function truncateToTwoDecimals(value: number): number {
  return truncateToCents(value) / 100;
}

export function truncateToCents(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  const sign = value < 0 ? -1 : 1;
  const [whole, fraction = ''] = Math.abs(value).toFixed(8).split('.');
  return (
    sign *
    Number.parseInt(`${whole}${fraction.slice(0, 2).padEnd(2, '0')}`, 10)
  );
}

function formatCents(cents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}
