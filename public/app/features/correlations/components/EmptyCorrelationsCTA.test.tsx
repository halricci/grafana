import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { EmptyCorrelationsCTA } from './EmptyCorrelationsCTA';

describe('EmptyCorrelationsCTA', () => {
  it('offers Add correlation when a data source exists', async () => {
    const onClick = jest.fn();
    const user = userEvent.setup();

    render(<EmptyCorrelationsCTA canWriteCorrelations hasDataSources onClick={onClick} />);

    expect(screen.getByText("You haven't defined any correlations yet")).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Add correlation' }));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('link', { name: 'Add new data source' })).not.toBeInTheDocument();
  });

  it('links to Connections to add a data source when none exist', () => {
    const onClick = jest.fn();

    render(<EmptyCorrelationsCTA canWriteCorrelations hasDataSources={false} onClick={onClick} />);

    expect(screen.getByText('Add a data source first')).toBeInTheDocument();
    expect(
      screen.getByText(
        'A correlation needs a source data source. Add one in Connections, then come back to create a correlation.'
      )
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Add new data source' })).toHaveAttribute(
      'href',
      '/connections/datasources/new'
    );
    expect(screen.queryByRole('button', { name: 'Add correlation' })).not.toBeInTheDocument();
    expect(onClick).not.toHaveBeenCalled();
  });
});
