import { fireEvent, render } from '@testing-library/react';
import CardIndicator from './card-indicator';

const usdBrl = {
  name: 'USD / BRL',
  type: 'price' as const,
  price: 542,
  percentage: null,
  indicator: 1.37,
  referenceDate: '2026-08-18',
  description: 'Comparando com 5 dias úteis anteriores',
};

const fedFunds = {
  name: 'Fed Funds',
  type: 'percentage' as const,
  price: null,
  percentage: 5.25,
  indicator: 0,
  referenceDate: '2026-07-01',
  description: 'Comparando com mês anterior',
};

describe('CardIndicator', () => {
  it('should render a priced card', () => {
    const { getByText, getByRole } = render(<CardIndicator {...usdBrl} />);

    expect(getByText('USD / BRL')).toBeInTheDocument();
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

  it('should alert the card name when clicked', () => {
    const alertSpy = vi
      .spyOn(window, 'alert')
      .mockImplementation(() => undefined);
    const { getByRole } = render(<CardIndicator {...usdBrl} />);

    fireEvent.click(getByRole('button', { name: /USD \/ BRL/ }));

    expect(alertSpy).toHaveBeenCalledWith('USD / BRL');
    alertSpy.mockRestore();
  });

  it('should not alert when the date is clicked', () => {
    const alertSpy = vi
      .spyOn(window, 'alert')
      .mockImplementation(() => undefined);
    const { getByText } = render(<CardIndicator {...usdBrl} />);

    fireEvent.click(getByText('18 Ago 2026'));

    expect(alertSpy).not.toHaveBeenCalled();
    alertSpy.mockRestore();
  });

  it('should not alert when the variation is clicked', () => {
    const alertSpy = vi
      .spyOn(window, 'alert')
      .mockImplementation(() => undefined);
    const { getByText } = render(<CardIndicator {...usdBrl} />);

    fireEvent.click(getByText(/\+1,37%/));

    expect(alertSpy).not.toHaveBeenCalled();
    alertSpy.mockRestore();
  });
});
