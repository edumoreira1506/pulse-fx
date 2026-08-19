import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

import App from './app';

describe('App', () => {
  it('should render successfully', () => {
    const { baseElement } = render(
      <BrowserRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <App />
      </BrowserRouter>,
    );
    expect(baseElement).toBeTruthy();
  });

  it('should render the dashboard title', () => {
    const { getByText } = render(
      <BrowserRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <App />
      </BrowserRouter>,
    );
    expect(getByText('Dashboard')).toBeInTheDocument();
  });

  it('should render the dashboard copy', () => {
    const { getByText } = render(
      <BrowserRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <App />
      </BrowserRouter>,
    );
    expect(getByText(/Lorem ipsum dolor sit amet/i)).toBeInTheDocument();
  });
});
