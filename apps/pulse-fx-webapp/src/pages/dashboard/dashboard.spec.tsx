import { fireEvent, render, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { getCardHistory, getCards } from '../../services/cards.service';
import { DashboardPage } from './dashboard';

const routerFuture = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
};

const cards = [
  {
    name: 'USD / BRL',
    identifier: 'usd-brl',
    type: 'price' as const,
    price: 542,
    percentage: null,
    indicator: 1.37,
    referenceDate: '2026-08-18',
    description: 'Comparando com 5 dias úteis anteriores',
    tooltip:
      'Cotação de venda do dólar americano em reais pela PTAX do Banco Central do Brasil. A variação compara a cotação mais recente com a 5ª observação útil anterior disponível, ignorando dias sem cotação.',
    isFavorite: false,
  },
  {
    name: 'Juros dos EUA',
    identifier: 'fed-funds',
    type: 'percentage' as const,
    price: null,
    percentage: 4.33,
    indicator: 0,
    referenceDate: '2026-07-01',
    description: 'Comparando com mês anterior',
    tooltip: 'Taxa efetiva média dos fed funds.',
    isFavorite: false,
  },
];

vi.mock('../../services/cards.service', () => ({
  getCards: vi.fn(),
  getCardHistory: vi.fn(),
}));

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
  LineChart: () => <div data-testid="line-chart" />,
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  CartesianGrid: () => null,
}));

function renderDashboard(initialEntries = ['/']) {
  return render(
    <MemoryRouter initialEntries={initialEntries} future={routerFuture}>
      <DashboardPage />
    </MemoryRouter>,
  );
}

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCards).mockResolvedValue(cards);
    vi.mocked(getCardHistory).mockResolvedValue([
      { date: '2026-08-18', value: 5.1714 },
      { date: '2026-08-19', value: 5.2043 },
    ]);
  });

  it('should render the dashboard title', async () => {
    const { getByText, queryByText } = renderDashboard();
    expect(getByText('Dashboard - Pulse FX')).toBeInTheDocument();
    await waitFor(() => {
      expect(queryByText('Carregando...')).not.toBeInTheDocument();
    });
  });

  it('should render the dashboard description', async () => {
    const { getByText, queryByText } = renderDashboard();
    expect(
      getByText('Mercados e indicadores macroeconômicos'),
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(queryByText('Carregando...')).not.toBeInTheDocument();
    });
  });

  it('should render cards from the API', async () => {
    const { getByText } = renderDashboard();

    await waitFor(() => {
      expect(getByText('USD / BRL')).toBeInTheDocument();
    });
  });

  it('should open FX history with the default period in the URL', async () => {
    const { getByRole, getByText, getByLabelText } = renderDashboard();

    await waitFor(() => {
      expect(getByText('USD / BRL')).toBeInTheDocument();
    });

    fireEvent.click(getByRole('button', { name: 'USD / BRL' }));

    expect(getByText('Histórico de USD / BRL:')).toBeInTheDocument();
    expect(getByLabelText('Período')).toHaveValue('LAST_5_BUSINESS_DAY');
    await waitFor(() => {
      expect(getCardHistory).toHaveBeenCalledWith(
        'usd-brl',
        'LAST_5_BUSINESS_DAY',
      );
    });
  });

  it('should request a new period when the select changes', async () => {
    const { getByLabelText, getByText } = renderDashboard([
      '/?card=usd-brl&period=LAST_5_BUSINESS_DAY',
    ]);

    await waitFor(() => {
      expect(getByText('Histórico de USD / BRL:')).toBeInTheDocument();
    });

    fireEvent.change(getByLabelText('Período'), {
      target: { value: 'LAST_90_DAYS' },
    });

    await waitFor(() => {
      expect(getCardHistory).toHaveBeenCalledWith('usd-brl', 'LAST_90_DAYS');
    });
  });

  it('should show monthly period options for fed funds', async () => {
    const { getByLabelText, getByText } = renderDashboard([
      '/?card=fed-funds&period=LAST_ONE_YEAR',
    ]);

    await waitFor(() => {
      expect(getByText('Histórico de Juros dos EUA:')).toBeInTheDocument();
    });

    const periodSelect = getByLabelText('Período');
    expect(periodSelect).toHaveValue('LAST_ONE_YEAR');
    expect(periodSelect).toHaveTextContent('Últimos 2 anos');
    expect(periodSelect).not.toHaveTextContent('Últimos 5 dias úteis');
  });

  it('should close history and remove the query params', async () => {
    const { getByLabelText, getByText, queryByText } = renderDashboard([
      '/?card=usd-brl&period=LAST_5_BUSINESS_DAY',
    ]);

    await waitFor(() => {
      expect(getByText('Histórico de USD / BRL:')).toBeInTheDocument();
    });

    fireEvent.click(getByLabelText('Fechar'));

    await waitFor(() => {
      expect(queryByText('Histórico de USD / BRL:')).not.toBeInTheDocument();
    });
  });
});
