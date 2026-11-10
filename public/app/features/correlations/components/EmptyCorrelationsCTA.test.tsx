import { render, screen } from 'test/test-utils';

import { EmptyCorrelationsCTA } from './EmptyCorrelationsCTA';

describe('EmptyCorrelationsCTA', () => {
  it('links to Connections > Add new data source when none are configured', () => {
    render(<EmptyCorrelationsCTA canWriteCorrelations hasDataSources={false} />);

    expect(screen.getByText('Add a data source first')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Add data source' })).toHaveAttribute(
      'href',
      '/connections/datasources/new'
    );
    expect(screen.queryByRole('button', { name: 'Add correlation' })).not.toBeInTheDocument();
  });

  it('starts a new correlation when a data source is configured', async () => {
    const onClick = jest.fn();
    const { user } = render(<EmptyCorrelationsCTA canWriteCorrelations hasDataSources onClick={onClick} />);

    await user.click(screen.getByRole('button', { name: 'Add correlation' }));

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(screen.getByText("You haven't defined any correlations yet")).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Add data source' })).not.toBeInTheDocument();
  });

  it('tells viewers without write access to contact an administrator', () => {
    render(<EmptyCorrelationsCTA canWriteCorrelations={false} hasDataSources={false} />);

    expect(screen.getByText('There are no correlations configured yet.')).toBeInTheDocument();
    expect(screen.getByText('Please contact your administrator to create new correlations.')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Add data source' })).not.toBeInTheDocument();
  });
});
