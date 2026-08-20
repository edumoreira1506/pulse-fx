import type { CardType } from '../../services/cards.service';
import { formatValue } from '../../utils/dashboardUtils';
import { formatReferenceDate } from '../../utils/dateUtils';
import { formatIndicator } from '../../utils/indicatorUtils';
import './card-indicator.css';

export interface CardIndicatorProps {
  name: string;
  type: CardType;
  price: number | null;
  percentage: number | null;
  indicator: number;
  referenceDate: string;
}

export function CardIndicator({
  name,
  type,
  price,
  percentage,
  indicator,
  referenceDate,
}: CardIndicatorProps) {
  const { arrow, label } = formatIndicator(indicator);

  return (
    <button
      type="button"
      className="card-indicator"
      onClick={() => alert(name)}
    >
      <span className="card-indicator-name">{name}</span>
      <span className="card-indicator-value">
        {formatValue(type, price, percentage)}
      </span>
      <span className="card-indicator-variation">
        <span aria-hidden="true">{arrow}</span> {label}
      </span>
      <time className="card-indicator-date" dateTime={referenceDate}>
        {formatReferenceDate(referenceDate, type === 'percentage')}
      </time>
    </button>
  );
}

export default CardIndicator;
