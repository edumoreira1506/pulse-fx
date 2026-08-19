import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import App from './app';

const routerFuture = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
};

describe('App', () => {
  it('should render successfully', () => {
    const { baseElement } = render(
      <MemoryRouter future={routerFuture}>
        <App />
      </MemoryRouter>,
    );
    expect(baseElement).toBeTruthy();
  });

  it('should render the dashboard on the home route', () => {
    const { getByText } = render(
      <MemoryRouter future={routerFuture}>
        <App />
      </MemoryRouter>,
    );
    expect(getByText('Dashboard')).toBeInTheDocument();
  });

  it('should redirect unknown routes to the dashboard', () => {
    const { getByText } = render(
      <MemoryRouter initialEntries={['/unknown']} future={routerFuture}>
        <App />
      </MemoryRouter>,
    );
    expect(getByText('Dashboard')).toBeInTheDocument();
  });
});
