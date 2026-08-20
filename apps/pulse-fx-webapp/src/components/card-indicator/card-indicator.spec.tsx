import { fireEvent, render, waitFor } from '@testing-library/react';
import CardIndicator from './card-indicator';

const usdBrlTooltip =
  'Cotação de venda do dólar americano em reais pela PTAX do Banco Central do Brasil. A variação compara a cotação mais recente com a 5ª observação útil anterior disponível, ignorando dias sem cotação.';

const usdBrl = {
  name: 'USD / BRL',
  type: 'price' as const,
  price: 542,
  percentage: null,
  indicator: 1.37,
  referenceDate: '2026-08-18',
  description: 'Comparando com 5 dias úteis anteriores',
  tooltip: usdBrlTooltip,
  isFavorite: false,
  onOpen: vi.fn(),
  onFavoriteToggle: vi.fn(),
};

const fedFunds = {
  name: 'Fed Funds',
  type: 'percentage' as const,
  price: null,
  percentage: 5.25,
  indicator: 0,
  referenceDate: '2026-07-01',
  description: 'Comparando com mês anterior',
  tooltip:
    'Taxa efetiva média dos empréstimos de curtíssimo prazo entre instituições financeiras dos EUA. A variação compara percentualmente a observação mensal mais recente com a do mês anterior.',
  isFavorite: true,
  onOpen: vi.fn(),
  onFavoriteToggle: vi.fn(),
};

describe('CardIndicator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render a priced card', () => {
    const { getByText, getByRole, getByLabelText } = render(
      <CardIndicator {...usdBrl} />,
    );

    expect(getByText('USD / BRL')).toBeInTheDocument();
    expect(getByLabelText('Sobre USD / BRL')).toBeInTheDocument();
    expect(getByText(/R\$\s*5,42/)).toBeInTheDocument();
    expect(getByText(/\+1,37%/)).toBeInTheDocument();
    expect(getByText('18 Ago 2026')).toBeInTheDocument();
    expect(
      getByRole('tooltip', { name: 'Data de referência' }),
    ).toBeInTheDocument();
    expect(
      getByRole('tooltip', {
        name: 'Comparando com 5 dias úteis anteriores',
      }),
    ).toBeInTheDocument();
    expect(getByRole('tooltip', { name: usdBrlTooltip })).toBeInTheDocument();
  });

  it('should render a percentage card with a monthly date', () => {
    const { getByText, getByRole } = render(<CardIndicator {...fedFunds} />);

    expect(getByText('Fed Funds')).toBeInTheDocument();
    expect(getByText('5,25%')).toBeInTheDocument();
    expect(getByText('0,00%')).toBeInTheDocument();
    expect(getByText('Jul 2026')).toBeInTheDocument();
    expect(getByRole('tooltip', { name: 'Referência' })).toBeInTheDocument();
    expect(
      getByRole('tooltip', { name: 'Comparando com mês anterior' }),
    ).toBeInTheDocument();
  });

  it('should open the card details when clicked', () => {
    const onOpen = vi.fn();
    const { getByRole } = render(
      <CardIndicator {...usdBrl} onOpen={onOpen} />,
    );

    fireEvent.click(getByRole('button', { name: 'USD / BRL' }));

    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('should not open details when the date is clicked', () => {
    const onOpen = vi.fn();
    const { getByText } = render(
      <CardIndicator {...usdBrl} onOpen={onOpen} />,
    );

    fireEvent.click(getByText('18 Ago 2026'));

    expect(onOpen).not.toHaveBeenCalled();
  });

  it('should not open details when the variation is clicked', () => {
    const onOpen = vi.fn();
    const { getByText } = render(
      <CardIndicator {...usdBrl} onOpen={onOpen} />,
    );

    fireEvent.click(getByText(/\+1,37%/));

    expect(onOpen).not.toHaveBeenCalled();
  });

  it('should not open details when the info icon is clicked', () => {
    const onOpen = vi.fn();
    const { getByLabelText } = render(
      <CardIndicator {...usdBrl} onOpen={onOpen} />,
    );

    fireEvent.click(getByLabelText('Sobre USD / BRL'));

    expect(onOpen).not.toHaveBeenCalled();
  });

  it('should render an empty heart when the card is not a favorite', () => {
    const { getByLabelText } = render(<CardIndicator {...usdBrl} />);

    expect(getByLabelText('Adicionar aos favoritos')).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('should render a filled heart when the card is a favorite', () => {
    const { getByLabelText } = render(<CardIndicator {...fedFunds} />);

    expect(getByLabelText('Remover dos favoritos')).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('should toggle favorite without opening details', async () => {
    const onFavoriteToggle = vi.fn().mockResolvedValue(undefined);
    const onOpen = vi.fn();
    const { getByLabelText } = render(
      <CardIndicator
        {...usdBrl}
        onOpen={onOpen}
        onFavoriteToggle={onFavoriteToggle}
      />,
    );

    fireEvent.click(getByLabelText('Adicionar aos favoritos'));

    await waitFor(() => {
      expect(onFavoriteToggle).toHaveBeenCalledTimes(1);
    });
    expect(onOpen).not.toHaveBeenCalled();
  });
});
