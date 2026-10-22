import { render, type RenderResult, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { dateTime, type TimeRange } from '@grafana/data';

import { type PropsWithScreenSize, TimePickerContentWithScreenSize } from './TimePickerContent';

describe('TimePickerContent', () => {
  const absoluteValue = createAbsoluteTimeRange('2019-12-17T07:48:27.433Z', '2019-12-18T07:49:27.433Z');
  const relativeValue = createRelativeTimeRange();
  const history = [
    createAbsoluteTimeRange('2019-12-17T07:48:27.433Z', '2019-12-17T07:49:27.433Z'),
    createAbsoluteTimeRange('2019-10-18T07:50:27.433Z', '2019-10-18T07:51:27.433Z'),
  ];

  describe('Wide Screen', () => {
    it('renders with history', async () => {
      renderComponent({ value: absoluteValue, history });
      expect(await screen.findByText(/absolute time range/i)).toBeInTheDocument();
      expect(await screen.findByText(/recently used absolute ranges/i)).toBeInTheDocument();
      expect(await screen.findByText(/2019-12-17 07:48:27 to 2019-12-17 07:49:27/i)).toBeInTheDocument();
      expect(await screen.findByText(/2019-10-18 07:50:27 to 2019-10-18 07:51:27/i)).toBeInTheDocument();
    });

    it('renders with empty history', async () => {
      renderComponent({ value: absoluteValue });
      expect(
        await screen.findByText(
          /it looks like you haven't used this time picker before\. as soon as you enter some time intervals, recently used intervals will appear here\./i
        )
      ).toBeInTheDocument();
      expect(screen.queryByText(/recently used absolute ranges/i)).not.toBeInTheDocument();
    });

    it('renders without history', async () => {
      renderComponent({ value: absoluteValue, history, showHistory: false });
      expect(await screen.findByText(/absolute time range/i)).toBeInTheDocument();
      expect(screen.queryByText(/recently used absolute ranges/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/2019-12-17 07:48:27 to 2019-12-17 07:49:27/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/2019-10-18 07:50:27 to 2019-10-18 07:51:27/i)).not.toBeInTheDocument();
    });

    it('renders with relative picker', async () => {
      renderComponent({ value: absoluteValue });
      expect(await screen.findByText(/Last 5 minutes/i)).toBeInTheDocument();
    });

    it('renders without relative picker', async () => {
      renderComponent({ value: absoluteValue, hideQuickRanges: true });
      expect(await screen.findByText(/absolute time range/i)).toBeInTheDocument();
      expect(screen.queryByText(/Last 5 minutes/i)).not.toBeInTheDocument();
    });

    it('renders with timezone picker', async () => {
      renderComponent({ value: absoluteValue, hideTimeZone: false });
      expect(await screen.findByText(/absolute time range/i)).toBeInTheDocument();
      expect(screen.getByText(/coordinated universal time/i)).toBeInTheDocument();
    });

    it('renders without timezone picker', async () => {
      renderComponent({ value: absoluteValue, hideTimeZone: true });
      expect(await screen.findByText(/absolute time range/i)).toBeInTheDocument();
      expect(screen.queryByText(/coordinated universal time/i)).not.toBeInTheDocument();
    });
  });

  describe('Narrow Screen', () => {
    it('renders with history', async () => {
      renderComponent({ value: absoluteValue, history, isFullscreen: false });
      expect(await screen.findByText(/recently used absolute ranges/i)).toBeInTheDocument();
      expect(await screen.findByText(/2019-12-17 07:48:27 to 2019-12-17 07:49:27/i)).toBeInTheDocument();
      expect(await screen.findByText(/2019-10-18 07:50:27 to 2019-10-18 07:51:27/i)).toBeInTheDocument();
    });

    it('renders with empty history', async () => {
      renderComponent({ value: absoluteValue, isFullscreen: false });
      expect(await screen.findByText(/absolute time range/i)).toBeInTheDocument();
      expect(screen.queryByText(/recently used absolute ranges/i)).not.toBeInTheDocument();
      expect(
        screen.queryByText(
          /it looks like you haven't used this time picker before\. as soon as you enter some time intervals, recently used intervals will appear here\./i
        )
      ).not.toBeInTheDocument();
    });

    it('renders without history', async () => {
      renderComponent({ value: absoluteValue, isFullscreen: false, history, showHistory: false });
      expect(await screen.findByText(/absolute time range/i)).toBeInTheDocument();
      expect(screen.queryByText(/recently used absolute ranges/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/2019-12-17 07:48:27 to 2019-12-17 07:49:27/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/2019-10-18 07:50:27 to 2019-10-18 07:51:27/i)).not.toBeInTheDocument();
    });

    it('renders with relative picker', async () => {
      renderComponent({ value: absoluteValue, isFullscreen: false });
      expect(await screen.findByText(/Last 5 minutes/i)).toBeInTheDocument();
    });

    it('renders without relative picker', async () => {
      renderComponent({ value: absoluteValue, isFullscreen: false, hideQuickRanges: true });
      expect(await screen.findByText(/absolute time range/i)).toBeInTheDocument();
      expect(screen.queryByText(/Last 5 minutes/i)).not.toBeInTheDocument();
    });

    it('renders with absolute picker when absolute value and quick ranges are visible', async () => {
      renderComponent({ value: absoluteValue, isFullscreen: false });
      expect(await screen.findByLabelText('From')).toBeInTheDocument();
    });

    it('renders with absolute picker when absolute value and quick ranges are hidden', async () => {
      renderComponent({ value: absoluteValue, isFullscreen: false, hideQuickRanges: true });
      expect(await screen.findByLabelText('From')).toBeInTheDocument();
    });

    it('renders without absolute picker when narrow screen and quick ranges are visible', async () => {
      renderComponent({ value: relativeValue, isFullscreen: false });
      expect(await screen.findByText(/absolute time range/i)).toBeInTheDocument();
      expect(screen.queryByLabelText('From')).not.toBeInTheDocument();
    });

    it('renders with absolute picker when narrow screen and quick ranges are hidden', async () => {
      renderComponent({ value: relativeValue, isFullscreen: false, hideQuickRanges: true });
      expect(await screen.findByLabelText('From')).toBeInTheDocument();
    });

    it('renders without timezone picker', async () => {
      renderComponent({ value: absoluteValue, hideTimeZone: true });
      expect(await screen.findByText(/absolute time range/i)).toBeInTheDocument();
      expect(screen.queryByText(/coordinated universal time/i)).not.toBeInTheDocument();
    });
  });

  describe('Time Shortcut Parsing', () => {
    it('shows custom time option when typing a valid time shortcut', async () => {
      const user = userEvent.setup();
      renderComponent({ value: relativeValue });

      const searchInput = screen.getByPlaceholderText(/search quick ranges/i);
      await user.type(searchInput, '30m');

      expect(screen.getByText('Last 30 minutes')).toBeInTheDocument();
    });

    it('does not show custom time option for compound durations', async () => {
      const user = userEvent.setup();
      renderComponent({ value: relativeValue });

      const searchInput = screen.getByPlaceholderText(/search quick ranges/i);
      await user.type(searchInput, '1h30m');

      expect(screen.queryByText(/Last 1 hour 30 minutes/i)).not.toBeInTheDocument();
    });

    it('uses singular form for single units', async () => {
      const user = userEvent.setup();
      renderComponent({ value: relativeValue });

      const searchInput = screen.getByPlaceholderText(/search quick ranges/i);
      await user.type(searchInput, '1h');

      expect(screen.getByText('Last 1 hour')).toBeInTheDocument();
    });

    it('does not show duplicate options if custom shortcut matches existing option', async () => {
      const user = userEvent.setup();
      renderComponent({ value: relativeValue });

      const searchInput = screen.getByPlaceholderText(/search quick ranges/i);
      await user.type(searchInput, '5m');

      const options = screen.getAllByText(/Last 5 minutes/i);
      expect(options).toHaveLength(1);
    });

    it('filters existing options while showing custom shortcut', async () => {
      const user = userEvent.setup();
      renderComponent({ value: relativeValue });

      const searchInput = screen.getByPlaceholderText(/search quick ranges/i);
      await user.type(searchInput, '45m');

      expect(screen.getByText('Last 45 minutes')).toBeInTheDocument();
      expect(screen.queryByText(/Last 5 minutes/i)).not.toBeInTheDocument();
    });

    it('does not show custom option for invalid time shortcuts', async () => {
      const user = userEvent.setup();
      renderComponent({ value: relativeValue });

      const searchInput = screen.getByPlaceholderText(/search quick ranges/i);
      await user.type(searchInput, 'invalid');

      expect(screen.queryByText(/Last invalid/i)).not.toBeInTheDocument();
    });
  });

  describe('Personal ranges', () => {
    const personalRanges = [{ from: 'now-2h', to: 'now', display: 'Last 2 hours' }];

    it('shows your ranges apart from dashboard ranges and keeps recently used absolute ranges', async () => {
      renderComponent({ value: absoluteValue, history, personalRanges });

      const yours = await screen.findByRole('region', { name: 'Your ranges' });
      const dashboard = screen.getByRole('region', { name: 'Dashboard' });
      expect(within(yours).getByRole('button', { name: 'Last 2 hours' })).toBeInTheDocument();
      expect(within(dashboard).getByText('Last 5 minutes')).toBeInTheDocument();
      expect(within(yours).queryByText('Last 5 minutes')).not.toBeInTheDocument();
      expect(screen.getByText(/recently used absolute ranges/i)).toBeInTheDocument();
      expect(screen.getByText(/2019-12-17 07:48:27 to 2019-12-17 07:49:27/i)).toBeInTheDocument();
    });

    it('keeps quick ranges unlabeled when there is no personal list', async () => {
      renderComponent({ value: relativeValue });

      expect(await screen.findByText('Last 5 minutes')).toBeInTheDocument();
      expect(screen.queryByRole('region', { name: 'Your ranges' })).not.toBeInTheDocument();
      expect(screen.queryByRole('region', { name: 'Dashboard' })).not.toBeInTheDocument();
    });

    it('saving or removing a personal range does not apply a time range', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      const onSave = jest.fn();
      const onRemove = jest.fn();
      renderComponent({
        value: relativeValue,
        personalRanges,
        onChange,
        onSavePersonalRange: onSave,
        onRemovePersonalRange: onRemove,
      });

      await user.click(screen.getByRole('button', { name: 'Save current range' }));
      expect(onSave).toHaveBeenCalledTimes(1);
      expect(onChange).not.toHaveBeenCalled();

      await user.click(screen.getByRole('button', { name: 'Remove Last 2 hours' }));
      expect(onRemove).toHaveBeenCalledWith({ from: 'now-2h', to: 'now', display: 'Last 2 hours' });
      expect(onChange).not.toHaveBeenCalled();
    });

    it('applies the selected personal range', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      renderComponent({
        value: relativeValue,
        personalRanges,
        onChange,
        onSavePersonalRange: jest.fn(),
        onRemovePersonalRange: jest.fn(),
      });

      await user.click(screen.getByRole('button', { name: 'Last 2 hours' }));

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange.mock.calls[0][0].raw).toEqual({ from: 'now-2h', to: 'now' });
    });

    it('does not save again when the current range is already saved', async () => {
      const user = userEvent.setup();
      const onSave = jest.fn();
      renderComponent({
        value: relativeValue,
        personalRanges,
        personalRangeSaveState: 'saved',
        onSavePersonalRange: onSave,
        onRemovePersonalRange: jest.fn(),
      });

      const saved = screen.getByRole('button', { name: 'Current range is already saved' });
      expect(saved).toBeDisabled();
      await user.click(saved);
      expect(onSave).not.toHaveBeenCalled();
    });

    it('filters personal ranges from the quick range search', async () => {
      const user = userEvent.setup();
      renderComponent({
        value: relativeValue,
        personalRanges: [
          { from: 'now-2h', to: 'now', display: 'Last 2 hours' },
          { from: 'now-7d', to: 'now', display: 'Last 7 days' },
        ],
        onSavePersonalRange: jest.fn(),
        onRemovePersonalRange: jest.fn(),
      });

      await user.type(screen.getByPlaceholderText(/search quick ranges/i), '7 days');

      expect(screen.getByRole('button', { name: 'Last 7 days' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Last 2 hours' })).not.toBeInTheDocument();
      expect(screen.queryByText('Last 5 minutes')).not.toBeInTheDocument();
    });
  });
});

function noop(): {} {
  return {};
}

function renderComponent({
  value,
  isFullscreen = true,
  showHistory = true,
  history = [],
  hideQuickRanges = false,
  hideTimeZone = false,
  onChange = noop,
  personalRanges,
  onSavePersonalRange,
  onRemovePersonalRange,
  personalRangeSaveState,
  dashboardRangesLabel,
}: Pick<PropsWithScreenSize, 'value'> & Partial<PropsWithScreenSize>): RenderResult {
  return render(
    <TimePickerContentWithScreenSize
      onChangeTimeZone={noop}
      onChange={onChange}
      quickOptions={[
        { from: 'now-5m', to: 'now', display: 'Last 5 minutes' },
        { from: 'now-15m', to: 'now', display: 'Last 15 minutes' },
      ]}
      timeZone="utc"
      value={value}
      isFullscreen={isFullscreen}
      showHistory={showHistory}
      history={history}
      hideQuickRanges={hideQuickRanges}
      hideTimeZone={hideTimeZone}
      personalRanges={personalRanges}
      onSavePersonalRange={onSavePersonalRange}
      onRemovePersonalRange={onRemovePersonalRange}
      personalRangeSaveState={personalRangeSaveState}
      dashboardRangesLabel={dashboardRangesLabel}
    />
  );
}

function createRelativeTimeRange(): TimeRange {
  const now = dateTime();
  const now5m = now.subtract(5, 'm');

  return {
    from: now5m,
    to: now,
    raw: { from: 'now-5m', to: 'now' },
  };
}

function createAbsoluteTimeRange(from: string, to: string): TimeRange {
  return {
    from: dateTime(from),
    to: dateTime(to),
    raw: { from: dateTime(from), to: dateTime(to) },
  };
}
