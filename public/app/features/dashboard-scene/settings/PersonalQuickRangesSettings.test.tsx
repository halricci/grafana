import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { selectors } from '@grafana/e2e-selectors';
import {
  PERSONAL_QUICK_RANGES_STORAGE_KEY,
  writePersonalQuickRanges,
} from 'app/core/components/TimePicker/personalQuickRanges';

import { PersonalQuickRangesSettings } from './PersonalQuickRangesSettings';

describe('PersonalQuickRangesSettings', () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it('adds and removes a personal range in browser storage', async () => {
    const user = userEvent.setup();
    render(<PersonalQuickRangesSettings />);

    expect(screen.getByTestId(selectors.components.TimePicker.addPersonalQuickRange)).toBeDisabled();

    await user.type(screen.getByTestId(selectors.components.TimePicker.personalQuickRangeName), 'Overnight');
    await user.type(screen.getByTestId(selectors.components.TimePicker.personalQuickRangeFrom), 'now-12h');
    await user.type(screen.getByTestId(selectors.components.TimePicker.personalQuickRangeTo), 'now');
    await user.click(screen.getByTestId(selectors.components.TimePicker.addPersonalQuickRange));

    expect(JSON.parse(window.localStorage.getItem(PERSONAL_QUICK_RANGES_STORAGE_KEY) ?? '[]')).toEqual([
      { display: 'Overnight', from: 'now-12h', to: 'now' },
    ]);
    expect(screen.getByText('Overnight (now-12h to now)')).toBeInTheDocument();
    expect(screen.getByTestId(selectors.components.TimePicker.personalQuickRangeName)).toHaveValue('');

    await user.click(screen.getByTestId(selectors.components.TimePicker.removePersonalQuickRange('now-12h', 'now')));

    expect(JSON.parse(window.localStorage.getItem(PERSONAL_QUICK_RANGES_STORAGE_KEY) ?? '[]')).toEqual([]);
    expect(screen.queryByText('Overnight (now-12h to now)')).not.toBeInTheDocument();
  });

  it('does not save a range the time picker cannot apply', async () => {
    const user = userEvent.setup();
    render(<PersonalQuickRangesSettings />);

    await user.type(screen.getByTestId(selectors.components.TimePicker.personalQuickRangeName), 'Broken');
    await user.type(screen.getByTestId(selectors.components.TimePicker.personalQuickRangeFrom), 'not-a-time');
    await user.type(screen.getByTestId(selectors.components.TimePicker.personalQuickRangeTo), 'still-not');

    expect(screen.getByTestId(selectors.components.TimePicker.addPersonalQuickRange)).toBeDisabled();
    expect(window.localStorage.getItem(PERSONAL_QUICK_RANGES_STORAGE_KEY)).toBeNull();
  });

  it('renames a saved range instead of keeping two copies', async () => {
    writePersonalQuickRanges([{ display: 'Old name', from: 'now-1h', to: 'now' }]);
    const user = userEvent.setup();
    render(<PersonalQuickRangesSettings />);

    await user.type(screen.getByTestId(selectors.components.TimePicker.personalQuickRangeName), 'New name');
    await user.type(screen.getByTestId(selectors.components.TimePicker.personalQuickRangeFrom), 'now-1h');
    await user.type(screen.getByTestId(selectors.components.TimePicker.personalQuickRangeTo), 'now');
    await user.click(screen.getByTestId(selectors.components.TimePicker.addPersonalQuickRange));

    expect(JSON.parse(window.localStorage.getItem(PERSONAL_QUICK_RANGES_STORAGE_KEY) ?? '[]')).toEqual([
      { display: 'New name', from: 'now-1h', to: 'now' },
    ]);
  });
});
