import { render } from '@testing-library/react';
import { DashboardPage } from './dashboard';

describe('DashboardPage', () => {
  it('should render the dashboard title', () => {
    const { getByText } = render(<DashboardPage />);
    expect(getByText('Dashboard')).toBeInTheDocument();
  });

  it('should render the dashboard copy', () => {
    const { getByText } = render(<DashboardPage />);
    expect(getByText(/Lorem ipsum dolor sit amet/i)).toBeInTheDocument();
  });
});
