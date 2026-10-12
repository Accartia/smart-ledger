import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import RoleSelection from '../../Components/auth/roleSelection';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('RoleSelection unit test', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('renders the role chooser and navigates to the admin login route', () => {
    render(
      <MemoryRouter>
        <RoleSelection />
      </MemoryRouter>
    );

    expect(screen.getByText('Smart Ledger')).toBeInTheDocument();
    expect(screen.getByText('Select your role to continue')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /shop owner/i }));

    expect(mockNavigate).toHaveBeenCalledWith('/login/admin');
  });
});
