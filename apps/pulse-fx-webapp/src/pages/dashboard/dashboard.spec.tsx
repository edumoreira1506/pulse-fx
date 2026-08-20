import { render, waitFor } from '@testing-library/react';
import { getCards } from '../../services/cards.service';
import { DashboardPage } from './dashboard';

const cards = [
  {
    name: 'USD / BRL',
    type: 'price' as const,
    price: 542,
    percentage: null,
    indicator: 1.37,
    referenceDate: '2026-08-18',
    description: 'Comparando com 5 dias úteis anteriores',
  },
];

vi.mock('../../services/cards.service', () => ({
  getCards: vi.fn(),
}));

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.mocked(getCards).mockResolvedValue(cards);
  });

  it('should render the dashboard title', async () => {
    const { getByText, queryByText } = render(<DashboardPage />);
    expect(getByText('Dashboard - Pulse FX')).toBeInTheDocument();
    await waitFor(() => {
      expect(queryByText('Carregando...')).not.toBeInTheDocument();
    });
  });

  it('should render the dashboard description', async () => {
    const { getByText, queryByText } = render(<DashboardPage />);
    expect(
      getByText('Mercados e indicadores macroeconômicos'),
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(queryByText('Carregando...')).not.toBeInTheDocument();
    });
  });

  it('should render cards from the API', async () => {
    const { getByText } = render(<DashboardPage />);

    await waitFor(() => {
      expect(getByText('USD / BRL')).toBeInTheDocument();
    });
  });
});
