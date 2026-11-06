import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { seedDataSources } from 'test/helpers/seedDataSources';
import { render } from 'test/test-utils';

import { contextSrv } from 'app/core/services/context_srv';
import { mockDataSource } from 'app/features/alerting/unified/mocks';

import CorrelationsPage from '../CorrelationsPage';

import { EmptyCorrelationsCTA } from './EmptyCorrelationsCTA';

const fetchCorrelations = jest.fn().mockResolvedValue({
  correlations: [],
  page: 1,
  limit: 100,
  totalCount: 0,
});

function seedDataSource(builtIn: boolean) {
  seedDataSources(
    [
      mockDataSource(
        {
          uid: builtIn ? 'grafana' : 'prom',
          name: builtIn ? '-- Grafana --' : 'Prometheus',
          type: builtIn ? 'datasource' : 'prometheus',
        },
        { id: builtIn ? 'grafana' : 'prometheus', builtIn }
      ),
    ],
    { legacySrv: 'mock' }
  );
}

describe('EmptyCorrelationsCTA', () => {
  it('opens the add correlation flow when a data source is configured', async () => {
    const onClick = jest.fn();
    render(<EmptyCorrelationsCTA canWriteCorrelations hasDataSources onClick={onClick} />);

    expect(screen.getByText("You haven't defined any correlations yet")).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Add correlation' }));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('link', { name: 'Add new data source' })).not.toBeInTheDocument();
  });

  it('links to Connections > Add new data source when none are configured', () => {
    render(<EmptyCorrelationsCTA canWriteCorrelations hasDataSources={false} onClick={jest.fn()} />);

    expect(screen.getByText('Add a data source first')).toBeInTheDocument();
    expect(
      screen.getByText('Correlations need a source data source. Add one before creating a correlation.')
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Add new data source' })).toHaveAttribute(
      'href',
      '/connections/datasources/new'
    );
    expect(screen.queryByRole('button', { name: 'Add correlation' })).not.toBeInTheDocument();
  });
});

describe('CorrelationsPage empty state', () => {
  beforeEach(() => {
    jest.spyOn(contextSrv, 'hasPermission').mockReturnValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('keeps the add correlation action when a configured data source exists', async () => {
    seedDataSource(false);

    render(<CorrelationsPage fetchCorrelations={fetchCorrelations} isLoading={false} />);

    expect(await screen.findByRole('button', { name: 'Add correlation' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Add new data source' })).not.toBeInTheDocument();
  });

  it('asks for a data source when the only registered source is built-in', async () => {
    seedDataSource(true);

    render(<CorrelationsPage fetchCorrelations={fetchCorrelations} isLoading={false} />);

    expect(await screen.findByRole('link', { name: 'Add new data source' })).toHaveAttribute(
      'href',
      '/connections/datasources/new'
    );
    expect(screen.queryByRole('button', { name: 'Add correlation' })).not.toBeInTheDocument();
  });
});
