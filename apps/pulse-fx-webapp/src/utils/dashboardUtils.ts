import { formatPercentage, formatPrice } from './priceUtils';

export function formatValue(
  price: number | null,
  percentage: number | null,
): string {
  if (price != null) {
    return formatPrice(price);
  }

  if (percentage != null) {
    return formatPercentage(percentage);
  }

  return '—';
}
