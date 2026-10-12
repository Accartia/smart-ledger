import { render, screen } from '@testing-library/react';
import App from '../../App';

describe('App integration routing', () => {
  afterEach(() => {
    window.history.pushState({}, '', '/');
  });

  it('renders the home role selection screen on the root route', () => {
    window.history.pushState({}, '', '/');

    render(<App />);

    expect(screen.getByText('Smart Ledger')).toBeInTheDocument();
    expect(screen.getByText('Select your role to continue')).toBeInTheDocument();
  });

  it('renders the admin login page for the admin login route', () => {
    window.history.pushState({}, '', '/login/admin');

    render(<App />);

    expect(screen.getByRole('heading', { name: /shop owner login/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });
});
