import { render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import App from './app';
import { getCards } from './services/cards.service';

const routerFuture = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
};

vi.mock('./services/cards.service', () => ({
  getCards: vi.fn(),
}));

async function renderApp(initialEntries?: string[]) {
  const view = render(
    <MemoryRouter initialEntries={initialEntries} future={routerFuture}>
      <App />
    </MemoryRouter>,
  );

  await waitFor(() => {
    expect(view.queryByText('Carregando...')).not.toBeInTheDocument();
  });

  return view;
}

describe('App', () => {
  beforeEach(() => {
    vi.mocked(getCards).mockResolvedValue([]);
  });

  it('should render successfully', async () => {
    const { baseElement } = await renderApp();
    expect(baseElement).toBeTruthy();
  });

  it('should render the dashboard on the home route', async () => {
    const { getByText } = await renderApp();
    expect(getByText('Dashboard - Pulse FX')).toBeInTheDocument();
  });

  it('should redirect unknown routes to the dashboard', async () => {
    const { getByText } = await renderApp(['/unknown']);
    expect(getByText('Dashboard - Pulse FX')).toBeInTheDocument();
  });
});
