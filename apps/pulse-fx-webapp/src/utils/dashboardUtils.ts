import type { CardType } from '../services/cards.service';
import { formatPercentage, formatPrice } from './priceUtils';

export function formatValue(
  type: CardType,
  price: number | null,
  percentage: number | null,
): string {
  if (type === 'price' && price != null) {
    return formatPrice(price);
  }

  if (type === 'percentage' && percentage != null) {
    return formatPercentage(percentage);
  }

  return '—';
}
