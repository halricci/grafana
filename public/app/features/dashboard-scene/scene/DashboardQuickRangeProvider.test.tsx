import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { dateTime } from '@grafana/data';
import { SceneTimePicker } from '@grafana/scenes';
import { PERSONAL_QUICK_RANGES_STORAGE_KEY } from 'app/core/components/TimePicker/personalQuickRanges';

import { TimePickerContentWithScreenSize } from '../../../../../packages/grafana-ui/src/components/DateTimePickers/TimeRangePicker/TimePickerContent';

import { DashboardQuickRangeProvider } from './DashboardQuickRangeProvider';

const HISTORY_STORAGE_KEY = 'grafana.dashboard.timepicker.history';
const HISTORY = [{ from: '2022-12-03T00:00:00.000Z', to: '2022-12-03T23:59:59.000Z' }];

describe('DashboardQuickRangeProvider', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(HISTORY));
  });

  it('saves and removes a personal range without changing the dashboard quick ranges', async () => {
    const user = userEvent.setup();
    const quickRanges = [{ from: 'now-6h', to: 'now', display: 'Last 6 hours' }];
    const timePicker = new SceneTimePicker({ quickRanges });
    const onChange = jest.fn();

    render(
      <DashboardQuickRangeProvider timePicker={timePicker}>
        <TimePickerContentWithScreenSize
          isFullscreen
          timeZone="utc"
          value={{ from: dateTime(), to: dateTime(), raw: { from: 'now-15m', to: 'now' } }}
          quickOptions={quickRanges}
          onChange={onChange}
          onChangeTimeZone={() => undefined}
        />
      </DashboardQuickRangeProvider>
    );

    expect(screen.getByRole('region', { name: 'Dashboard ranges' })).toHaveTextContent('Last 6 hours');

    await user.click(screen.getByRole('button', { name: 'Save to your ranges' }));

    expect(onChange).not.toHaveBeenCalled();
    expect(timePicker.state.quickRanges).toBe(quickRanges);
    expect(JSON.parse(window.localStorage.getItem(PERSONAL_QUICK_RANGES_STORAGE_KEY) ?? 'null')).toEqual([
      { from: 'now-15m', to: 'now', display: 'Last 15 minutes' },
    ]);
    expect(JSON.parse(window.localStorage.getItem(HISTORY_STORAGE_KEY) ?? 'null')).toEqual(HISTORY);
    expect(screen.getByRole('region', { name: 'Your ranges' })).toHaveTextContent('Last 15 minutes');

    await user.click(screen.getByRole('button', { name: 'Remove Last 15 minutes from your ranges' }));

    expect(timePicker.state.quickRanges).toBe(quickRanges);
    expect(timePicker.state.quickRanges).toEqual([{ from: 'now-6h', to: 'now', display: 'Last 6 hours' }]);
    expect(JSON.parse(window.localStorage.getItem(PERSONAL_QUICK_RANGES_STORAGE_KEY) ?? 'null')).toEqual([]);
    expect(screen.getByRole('region', { name: 'Dashboard ranges' })).toHaveTextContent('Last 6 hours');
    expect(onChange).not.toHaveBeenCalled();
  });
});
