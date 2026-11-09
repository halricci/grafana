import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { store, type TimeOption } from '@grafana/data';
import { selectors } from '@grafana/e2e-selectors';
import { PERSONAL_QUICK_RANGES_STORAGE_KEY } from '@grafana/ui';

import { PersonalQuickRangesSettings } from './PersonalQuickRangesSettings';

const settings = selectors.pages.Dashboard.Settings.General;
const dashboardRanges: TimeOption[] = [{ display: 'Last 6 hours', from: 'now-6h', to: 'now' }];

describe('PersonalQuickRangesSettings', () => {
  beforeEach(() => {
    store.delete(PERSONAL_QUICK_RANGES_STORAGE_KEY);
  });

  it('saves and removes a personal range without changing dashboard ranges', async () => {
    const user = userEvent.setup();
    const dashboardSnapshot = dashboardRanges.map((range) => ({ ...range }));

    const view = render(<PersonalQuickRangesSettings dashboardQuickRanges={dashboardRanges} />);

    await user.type(screen.getByTestId(settings.personalQuickRangeNameInput), 'Deploy window');
    await user.type(screen.getByTestId(settings.personalQuickRangeFromInput), 'now-6h');
    await user.type(screen.getByTestId(settings.personalQuickRangeToInput), 'now');
    await user.click(screen.getByTestId(settings.addPersonalQuickRangeButton));

    expect(screen.getByTestId(settings.personalQuickRanges)).toHaveTextContent('Deploy window');
    expect(screen.getByTestId(settings.personalQuickRanges)).toHaveTextContent('now-6h to now');
    expect(store.getObject(PERSONAL_QUICK_RANGES_STORAGE_KEY)).toEqual([
      { display: 'Deploy window', from: 'now-6h', to: 'now' },
    ]);
    expect(screen.getByTestId(settings.dashboardQuickRanges)).toHaveTextContent('Last 6 hours');
    expect(dashboardRanges).toEqual(dashboardSnapshot);

    view.unmount();
    render(<PersonalQuickRangesSettings dashboardQuickRanges={dashboardRanges} />);
    expect(screen.getByText('Deploy window')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Remove Deploy window' }));

    expect(screen.queryByText('Deploy window')).not.toBeInTheDocument();
    expect(screen.getByTestId(settings.dashboardQuickRanges)).toHaveTextContent('Last 6 hours');
    expect(store.getObject(PERSONAL_QUICK_RANGES_STORAGE_KEY)).toEqual([]);
    expect(dashboardRanges).toEqual(dashboardSnapshot);
  });

  it('does not store an invalid range', async () => {
    const user = userEvent.setup();
    render(<PersonalQuickRangesSettings dashboardQuickRanges={dashboardRanges} />);

    await user.type(screen.getByTestId(settings.personalQuickRangeNameInput), 'Nope');
    await user.type(screen.getByTestId(settings.personalQuickRangeFromInput), 'not-a-time');
    await user.type(screen.getByTestId(settings.personalQuickRangeToInput), 'now');
    await user.click(screen.getByTestId(settings.addPersonalQuickRangeButton));

    expect(screen.getByText('Enter a valid time, such as now-6h or an absolute time.')).toBeInTheDocument();
    expect(screen.queryByText('Nope')).not.toBeInTheDocument();
    expect(store.getObject(PERSONAL_QUICK_RANGES_STORAGE_KEY, [])).toEqual([]);
    expect(screen.getByTestId(settings.dashboardQuickRanges)).toHaveTextContent('Last 6 hours');
  });
});
