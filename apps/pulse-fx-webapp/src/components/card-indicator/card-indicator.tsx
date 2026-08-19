import { formatValue } from '../../utils/dashboardUtils';
import { formatReferenceDate } from '../../utils/dateUtils';
import { formatIndicator } from '../../utils/indicatorUtils';
import './card-indicator.css';

export interface CardIndicatorProps {
  name: string;
  price: number | null;
  percentage: number | null;
  indicator: number;
  referenceDate: string;
}

export function CardIndicator({
  name,
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
        {formatValue(price, percentage)}
      </span>
      <span className="card-indicator-variation">
        <span aria-hidden="true">{arrow}</span> {label}
      </span>
      <time className="card-indicator-date" dateTime={referenceDate}>
        {formatReferenceDate(referenceDate, Boolean(percentage))}
      </time>
    </button>
  );
}

export default CardIndicator;
