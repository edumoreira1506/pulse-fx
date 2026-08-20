import { fireEvent, render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { CardHistoryPanel } from './card-history-panel';
import { getHistoryPeriodOptions } from '../../utils/history-periods';

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
  LineChart: ({
    children,
    data,
  }: {
    children: ReactNode;
    data: Array<{ date: string; value: number }>;
  }) => (
    <div data-testid="line-chart">
      {data.map((item) => (
        <span key={item.date}>{item.date}</span>
      ))}
      {children}
    </div>
  ),
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  CartesianGrid: () => null,
}));

const fxOptions = getHistoryPeriodOptions('usd-brl');

const panelProps = {
  name: 'Dólar / Real',
  period: 'LAST_5_BUSINESS_DAY' as const,
  periodOptions: fxOptions,
  items: [] as Array<{ date: string; value: number }>,
  loading: false,
  error: null as string | null,
  isMonthly: false,
  valueType: 'price' as const,
  price: 517,
  percentage: null,
  indicator: 0.15,
  referenceDate: '2026-08-19',
  description: 'Comparando com 5 dias úteis anteriores',
  limitations:
    'A PTAX não é publicada em fins de semana e feriados. Não interpolamos lacunas.',
  onPeriodChange: vi.fn(),
  onClose: vi.fn(),
};

describe('CardHistoryPanel', () => {
  it('should render the title, period options and loading state', () => {
    const { getByText, getByLabelText } = render(
      <CardHistoryPanel {...panelProps} loading items={[]} />,
    );

    expect(getByText('Histórico de Dólar / Real:')).toBeInTheDocument();
    expect(getByText('Carregando...')).toBeInTheDocument();
    expect(getByLabelText('Período')).toHaveValue('LAST_5_BUSINESS_DAY');
    expect(getByLabelText('Período')).toHaveTextContent('Últimos 30 dias');
  });

  it('should render chart points when history is loaded', () => {
    const { getByTestId, queryByText, getByText } = render(
      <CardHistoryPanel
        {...panelProps}
        items={[
          { date: '2026-08-18', value: 5.1714 },
          { date: '2026-08-19', value: 5.2043 },
        ]}
      />,
    );

    expect(queryByText('Carregando...')).not.toBeInTheDocument();
    expect(getByText('Último valor')).toBeInTheDocument();
    expect(getByText('Limitações dos dados')).toBeInTheDocument();
    expect(getByText(panelProps.limitations)).toBeInTheDocument();
    expect(getByTestId('line-chart')).toHaveTextContent('2026-08-18');
    expect(getByTestId('line-chart')).toHaveTextContent('2026-08-19');
  });

  it('should notify when the period changes', () => {
    const onPeriodChange = vi.fn();
    const { getByLabelText } = render(
      <CardHistoryPanel
        {...panelProps}
        onPeriodChange={onPeriodChange}
      />,
    );

    fireEvent.change(getByLabelText('Período'), {
      target: { value: 'LAST_ONE_YEAR' },
    });

    expect(onPeriodChange).toHaveBeenCalledWith('LAST_ONE_YEAR');
  });

  it('should close from the header button', () => {
    const onClose = vi.fn();
    const { getByLabelText } = render(
      <CardHistoryPanel {...panelProps} onClose={onClose} />,
    );

    fireEvent.click(getByLabelText('Fechar'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
