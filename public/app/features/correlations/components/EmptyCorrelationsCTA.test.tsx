import { render, screen } from '@testing-library/react';

import { EmptyCorrelationsCTA } from './EmptyCorrelationsCTA';

describe('EmptyCorrelationsCTA', () => {
  it('links to add a data source when none are configured', () => {
    render(<EmptyCorrelationsCTA canWriteCorrelations hasDataSources={false} onClick={jest.fn()} />);

    const addDataSource = screen.getByRole('link', { name: /add data source/i });
    expect(addDataSource).toHaveAttribute('href', '/connections/datasources/new');
    expect(screen.queryByRole('button', { name: /add correlation/i })).not.toBeInTheDocument();
  });

  it('shows the add correlation button when data sources exist', () => {
    const onClick = jest.fn();
    render(<EmptyCorrelationsCTA canWriteCorrelations hasDataSources onClick={onClick} />);

    expect(screen.getByRole('button', { name: /add correlation/i })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /add data source/i })).not.toBeInTheDocument();
  });

  it('shows the administrator card when the user cannot write', () => {
    render(<EmptyCorrelationsCTA canWriteCorrelations={false} hasDataSources={false} />);

    expect(screen.getByText(/please contact your administrator/i)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /add data source/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /add correlation/i })).not.toBeInTheDocument();
  });
});
