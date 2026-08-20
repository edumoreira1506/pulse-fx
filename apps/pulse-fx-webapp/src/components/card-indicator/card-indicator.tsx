import { useId, useState, type ReactNode } from 'react';
import type { CardType } from '../../services/cards.service';
import { formatValue } from '../../utils/dashboardUtils';
import {
  formatReferenceDate,
  getReferenceDateTooltip,
} from '../../utils/dateUtils';
import { formatIndicator } from '../../utils/indicatorUtils';
import './card-indicator.css';

export interface CardIndicatorProps {
  name: string;
  type: CardType;
  price: number | null;
  percentage: number | null;
  indicator: number;
  referenceDate: string;
  description: string;
  tooltip: string;
  isFavorite: boolean;
  onOpen: () => void;
  onFavoriteToggle: () => Promise<void> | void;
}

function CardHoverTooltip({
  text,
  className,
  children,
}: {
  text: string;
  className?: string;
  children: ReactNode;
}) {
  const tooltipId = useId();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <span
      className={`card-indicator-tooltip-wrap${isOpen ? ' is-open' : ''}${
        className ? ` ${className}` : ''
      }`}
      onMouseLeave={() => setIsOpen(false)}
    >
      <span
        className="card-indicator-tooltip-trigger"
        aria-describedby={tooltipId}
        onClick={(event) => {
          event.stopPropagation();
          setIsOpen((open) => !open);
        }}
      >
        {children}
      </span>
      <span id={tooltipId} role="tooltip" className="card-indicator-tooltip">
        {text}
      </span>
    </span>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      className="card-indicator-favorite-icon"
      viewBox="0 0 16 16"
      width="16"
      height="16"
      aria-hidden="true"
    >
      <path
        d="M8 13.6s-5.8-3.5-5.8-7.1A3.2 3.2 0 0 1 8 3.9 3.2 3.2 0 0 1 13.8 6.5C13.8 10.1 8 13.6 8 13.6z"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg
      className="card-indicator-info-icon"
      viewBox="0 0 16 16"
      width="16"
      height="16"
      aria-hidden="true"
    >
      <circle
        cx="8"
        cy="8"
        r="6.25"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="8" cy="5" r="1" fill="currentColor" />
      <path
        d="M8 7.25v4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function CardIndicator({
  name,
  type,
  price,
  percentage,
  indicator,
  referenceDate,
  description,
  tooltip,
  isFavorite,
  onOpen,
  onFavoriteToggle,
}: CardIndicatorProps) {
  const { arrow, label } = formatIndicator(indicator);
  const [isFavoritePending, setIsFavoritePending] = useState(false);

  return (
    <button
      type="button"
      className="card-indicator"
      aria-label={name}
      onClick={onOpen}
    >
      <span className="card-indicator-header">
        <span className="card-indicator-name">{name}</span>
        <span className="card-indicator-actions">
          <span
            className={`card-indicator-favorite${
              isFavoritePending ? ' is-pending' : ''
            }`}
            aria-label={
              isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'
            }
            aria-pressed={isFavorite}
            onClick={async (event) => {
              event.stopPropagation();
              if (isFavoritePending) {
                return;
              }

              setIsFavoritePending(true);
              try {
                await onFavoriteToggle();
              } finally {
                setIsFavoritePending(false);
              }
            }}
          >
            <HeartIcon filled={isFavorite} />
          </span>
          <CardHoverTooltip className="card-indicator-info-wrap" text={tooltip}>
            <span className="card-indicator-info" aria-label={`Sobre ${name}`}>
              <InfoIcon />
            </span>
          </CardHoverTooltip>
        </span>
      </span>
      <span className="card-indicator-value">
        {formatValue(type, price, percentage)}
      </span>
      <CardHoverTooltip
        className="card-indicator-variation-wrap"
        text={description}
      >
        <span className="card-indicator-variation">
          <span aria-hidden="true">{arrow}</span> {label}
        </span>
      </CardHoverTooltip>
      <CardHoverTooltip
        className="card-indicator-date-wrap"
        text={getReferenceDateTooltip(type)}
      >
        <time className="card-indicator-date" dateTime={referenceDate}>
          {formatReferenceDate(referenceDate, type === 'percentage')}
        </time>
      </CardHoverTooltip>
    </button>
  );
}

export default CardIndicator;
