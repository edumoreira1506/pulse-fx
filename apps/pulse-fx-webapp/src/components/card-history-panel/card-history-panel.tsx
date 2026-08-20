import { useEffect, useId } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { CardType, HistoryItem, HistoryPeriod } from '../../services/cards.service';
import { formatReferenceDate } from '../../utils/dateUtils';
import type { HistoryPeriodOption } from '../../utils/history-periods';
import { formatPercentage, formatReais } from '../../utils/priceUtils';
import './card-history-panel.css';

export interface CardHistoryPanelProps {
  name: string;
  period: HistoryPeriod;
  periodOptions: HistoryPeriodOption[];
  items: HistoryItem[];
  loading: boolean;
  error: string | null;
  isMonthly: boolean;
  valueType: CardType;
  onPeriodChange: (period: HistoryPeriod) => void;
  onClose: () => void;
}

function formatChartValue(value: number, valueType: CardType): string {
  return valueType === 'price' ? formatReais(value) : formatPercentage(value);
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
      <path
        d="M3.2 3.2 12.8 12.8M12.8 3.2 3.2 12.8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function CardHistoryPanel({
  name,
  period,
  periodOptions,
  items,
  loading,
  error,
  isMonthly,
  valueType,
  onPeriodChange,
  onClose,
}: CardHistoryPanelProps) {
  const titleId = useId();
  const periodId = useId();
  const chartData = items.map((item) => ({
    ...item,
    label: formatReferenceDate(item.date, isMonthly),
  }));

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);

  return (
    <div className="card-history">
      <button
        type="button"
        className="card-history-backdrop"
        aria-label="Fechar histórico"
        onClick={onClose}
      />
      <aside
        className="card-history-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header className="card-history-header">
          <h2 id={titleId} className="card-history-title">
            Histórico de {name}:
          </h2>
          <button
            type="button"
            className="card-history-close"
            aria-label="Fechar"
            onClick={onClose}
          >
            <CloseIcon />
          </button>
        </header>

        <label className="card-history-period" htmlFor={periodId}>
          <span>Período</span>
          <select
            id={periodId}
            value={period}
            onChange={(event) =>
              onPeriodChange(event.target.value as HistoryPeriod)
            }
          >
            {periodOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <div className="card-history-chart" aria-busy={loading}>
          {loading && <p className="card-history-status">Carregando...</p>}
          {!loading && error && <p className="card-history-status">{error}</p>}
          {!loading && !error && chartData.length === 0 && (
            <p className="card-history-status">Sem dados para o período.</p>
          )}
          {!loading && !error && chartData.length > 0 && (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 8, right: 8, left: 0, bottom: 8 }}
              >
                <CartesianGrid stroke="#333" strokeDasharray="3 3" />
                <XAxis
                  dataKey="label"
                  stroke="#fff"
                  tick={{ fill: '#fff', fontSize: 12 }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  stroke="#fff"
                  tick={{ fill: '#fff', fontSize: 12 }}
                  tickFormatter={(value) => formatChartValue(Number(value), valueType)}
                  width={88}
                  domain={['auto', 'auto']}
                />
                <Tooltip
                  contentStyle={{
                    background: '#000',
                    border: '1px solid #fff',
                    color: '#fff',
                  }}
                  formatter={(value) => [
                    formatChartValue(Number(value ?? 0), valueType),
                    'Valor',
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#667eea"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#667eea' }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </aside>
    </div>
  );
}

export default CardHistoryPanel;
