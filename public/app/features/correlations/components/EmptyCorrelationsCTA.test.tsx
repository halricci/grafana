import { render, screen } from 'test/test-utils';

import { EmptyCorrelationsCTA } from './EmptyCorrelationsCTA';

describe('EmptyCorrelationsCTA', () => {
  it('links to add a data source when none are configured', () => {
    render(<EmptyCorrelationsCTA canWriteCorrelations hasDataSources={false} />);

    const addDataSource = screen.getByRole('link', { name: 'Add data source' });
    expect(addDataSource).toHaveAttribute('href', '/connections/datasources/new');
    expect(screen.getByText('Add a data source first')).toBeInTheDocument();
    expect(screen.getByText('A correlation needs a source data source.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Add correlation' })).not.toBeInTheDocument();
  });

  it('starts a new correlation when a data source exists', async () => {
    const onClick = jest.fn();
    const { user } = render(<EmptyCorrelationsCTA canWriteCorrelations hasDataSources onClick={onClick} />);

    await user.click(screen.getByRole('button', { name: 'Add correlation' }));

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(screen.getByText("You haven't defined any correlations yet")).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Add data source' })).not.toBeInTheDocument();
  });

  it('asks a user who cannot create correlations to contact an administrator', () => {
    render(<EmptyCorrelationsCTA canWriteCorrelations={false} hasDataSources={false} />);

    expect(screen.getByText('There are no correlations configured yet.')).toBeInTheDocument();
    expect(screen.getByText('Please contact your administrator to create new correlations.')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Add data source' })).not.toBeInTheDocument();
  });
});
