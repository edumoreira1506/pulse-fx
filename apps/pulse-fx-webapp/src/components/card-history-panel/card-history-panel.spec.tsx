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

describe('CardHistoryPanel', () => {
  it('should render the title, period options and loading state', () => {
    const { getByText, getByLabelText } = render(
      <CardHistoryPanel
        name="Dólar / Real"
        period="LAST_5_BUSINESS_DAY"
        periodOptions={fxOptions}
        items={[]}
        loading
        error={null}
        isMonthly={false}
        valueType="price"
        onPeriodChange={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(getByText('Histórico de Dólar / Real:')).toBeInTheDocument();
    expect(getByText('Carregando...')).toBeInTheDocument();
    expect(getByLabelText('Período')).toHaveValue('LAST_5_BUSINESS_DAY');
    expect(getByLabelText('Período')).toHaveTextContent('Últimos 30 dias');
  });

  it('should render chart points when history is loaded', () => {
    const { getByTestId, queryByText } = render(
      <CardHistoryPanel
        name="Dólar / Real"
        period="LAST_5_BUSINESS_DAY"
        periodOptions={fxOptions}
        items={[
          { date: '2026-08-18', value: 5.1714 },
          { date: '2026-08-19', value: 5.2043 },
        ]}
        loading={false}
        error={null}
        isMonthly={false}
        valueType="price"
        onPeriodChange={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(queryByText('Carregando...')).not.toBeInTheDocument();
    expect(getByTestId('line-chart')).toHaveTextContent('2026-08-18');
    expect(getByTestId('line-chart')).toHaveTextContent('2026-08-19');
  });

  it('should notify when the period changes', () => {
    const onPeriodChange = vi.fn();
    const { getByLabelText } = render(
      <CardHistoryPanel
        name="Dólar / Real"
        period="LAST_5_BUSINESS_DAY"
        periodOptions={fxOptions}
        items={[]}
        loading={false}
        error={null}
        isMonthly={false}
        valueType="price"
        onPeriodChange={onPeriodChange}
        onClose={vi.fn()}
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
      <CardHistoryPanel
        name="Dólar / Real"
        period="LAST_5_BUSINESS_DAY"
        periodOptions={fxOptions}
        items={[]}
        loading={false}
        error={null}
        isMonthly={false}
        valueType="price"
        onPeriodChange={vi.fn()}
        onClose={onClose}
      />,
    );

    fireEvent.click(getByLabelText('Fechar'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
