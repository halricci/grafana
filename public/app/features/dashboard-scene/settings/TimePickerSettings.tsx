import { css } from '@emotion/css';
import { isEmpty } from 'lodash';
import { type FormEvent, memo, useState } from 'react';

import { type GrafanaTheme2, rangeUtil, type TimeOption, type TimeZone } from '@grafana/data';
import { selectors } from '@grafana/e2e-selectors';
import { t } from '@grafana/i18n';
import {
  Button,
  CollapsableSection,
  Field,
  IconButton,
  Input,
  parseQuickRangeInput,
  Stack,
  Switch,
  TimeZonePicker,
  usePersonalQuickRanges,
  useStyles2,
  type WeekStart,
  WeekStartPicker,
} from '@grafana/ui';

import { AutoRefreshIntervals } from './AutoRefreshIntervals';

interface Props {
  onWeekStartChange: (weekStart?: WeekStart) => void;
  onTimeZoneChange: (timeZone: TimeZone) => void;
  onRefreshIntervalChange: (interval: string[]) => void;
  onNowDelayChange: (nowDelay: string) => void;
  onHideTimePickerChange: (hide: boolean) => void;
  onLiveNowChange: (liveNow: boolean) => void;
  onQuickRangesChange: (quickRanges?: TimeOption[]) => void;
  quickRanges?: TimeOption[];
  refreshIntervals?: string[];
  timePickerHidden?: boolean;
  nowDelay?: string;
  timezone: TimeZone;
  weekStart?: WeekStart;
  liveNow?: boolean;
}

export const TimePickerSettings = memo(
  ({
    onWeekStartChange,
    onTimeZoneChange,
    onRefreshIntervalChange,
    onNowDelayChange,
    onHideTimePickerChange,
    onLiveNowChange,
    onQuickRangesChange,
    quickRanges,
    refreshIntervals,
    timePickerHidden,
    nowDelay,
    timezone,
    weekStart,
    liveNow,
  }: Props) => {
    const [isNowDelayValid, setIsNowDelayValid] = useState(true);

    const handleNowDelayChange = (event: FormEvent<HTMLInputElement>) => {
      const value = event.currentTarget.value;

      if (isEmpty(value)) {
        setIsNowDelayValid(true);
        return onNowDelayChange(value);
      }

      if (rangeUtil.isValidTimeSpan(value)) {
        setIsNowDelayValid(true);
        return onNowDelayChange(value);
      }

      setIsNowDelayValid(false);
    };

    const handleHideTimePickerChange = () => {
      onHideTimePickerChange(!timePickerHidden);
    };

    const handleLiveNowChange = () => {
      onLiveNowChange(!liveNow);
    };

    const handleTimeZoneChange = (timeZone?: string) => {
      if (typeof timeZone !== 'string') {
        return;
      }
      onTimeZoneChange(timeZone);
    };

    const handleWeekStartChange = (weekStart?: WeekStart) => {
      onWeekStartChange(weekStart);
    };

    return (
      <CollapsableSection label={t('dashboard-settings.time-picker.time-options-label', 'Time options')} isOpen={true}>
        <Stack direction="column" gap={2}>
          <Field
            noMargin
            label={t('dashboard-settings.time-picker.time-zone-label', 'Time zone')}
            data-testid={selectors.components.TimeZonePicker.containerV2}
          >
            <TimeZonePicker
              inputId="time-options-input"
              includeInternal={true}
              value={timezone}
              onChange={handleTimeZoneChange}
              width={40}
            />
          </Field>
          <Field
            noMargin
            label={t('dashboard-settings.time-picker.week-start-label', 'Week start')}
            data-testid={selectors.components.WeekStartPicker.containerV2}
          >
            <WeekStartPicker inputId="week-start-input" width={40} value={weekStart} onChange={handleWeekStartChange} />
          </Field>
          <AutoRefreshIntervals refreshIntervals={refreshIntervals} onRefreshIntervalChange={onRefreshIntervalChange} />
          <Field
            noMargin
            label={t('dashboard-settings.time-picker.now-delay-label', 'Now delay')}
            description={t(
              'dashboard-settings.time-picker.now-delay-description',
              'Exclude recent data that may be incomplete.'
            )}
          >
            <Input
              id="now-delay-input"
              invalid={!isNowDelayValid}
              // eslint-disable-next-line @grafana/i18n/no-untranslated-strings
              placeholder="0m"
              onChange={handleNowDelayChange}
              defaultValue={nowDelay}
            />
          </Field>
          <Field noMargin label={t('dashboard-settings.time-picker.hide-time-picker', 'Hide time picker')}>
            <Switch id="hide-time-picker-toggle" value={!!timePickerHidden} onChange={handleHideTimePickerChange} />
          </Field>
          <Field
            noMargin
            label={t('dashboard-settings.time-picker.refresh-live-dashboards-label', 'Refresh live dashboards')}
            description={t(
              'dashboard-settings.time-picker.refresh-live-dashboards-description',
              'Continuously update panels when the time range includes the current time'
            )}
          >
            <Switch id="refresh-live-dashboards-toggle" value={!!liveNow} onChange={handleLiveNowChange} />
          </Field>
          <DashboardQuickRanges ranges={quickRanges} onChange={onQuickRangesChange} />
          <PersonalQuickRanges />
        </Stack>
      </CollapsableSection>
    );
  }
);
TimePickerSettings.displayName = 'TimePickerSettings';

const quickRangeSelectors = selectors.pages.Dashboard.Settings.General;

function DashboardQuickRanges({
  ranges,
  onChange,
}: {
  ranges?: TimeOption[];
  onChange: (quickRanges?: TimeOption[]) => void;
}) {
  const dashboardRanges = ranges ?? [];

  const addRange = (range: TimeOption) => {
    const withoutDuplicate = dashboardRanges.filter((item) => item.from !== range.from || item.to !== range.to);
    onChange([...withoutDuplicate, range]);
  };

  const removeRange = (range: TimeOption) => {
    const next = dashboardRanges.filter((item) => item.from !== range.from || item.to !== range.to);
    onChange(next.length > 0 ? next : undefined);
  };

  return (
    <Field
      noMargin
      label={t('dashboard-settings.time-picker.dashboard-ranges-label', 'Dashboard ranges')}
      description={t(
        'dashboard-settings.time-picker.dashboard-ranges-description',
        'Saved with this dashboard for everyone who opens it. Custom ranges replace the built-in list. Personal ranges stay on this browser and are not saved here.'
      )}
    >
      <Stack direction="column" gap={1}>
        {dashboardRanges.length === 0 ? (
          <p>{t('dashboard-settings.time-picker.dashboard-ranges-empty', 'Using the built-in quick ranges.')}</p>
        ) : (
          <QuickRangeList
            ranges={dashboardRanges}
            rowTestId={quickRangeSelectors.dashboardQuickRanges.row}
            onRemove={removeRange}
          />
        )}
        <QuickRangeForm
          idPrefix="dashboard-quick-range"
          fromTestId={quickRangeSelectors.dashboardQuickRanges.fromInput}
          toTestId={quickRangeSelectors.dashboardQuickRanges.toInput}
          nameTestId={quickRangeSelectors.dashboardQuickRanges.nameInput}
          addTestId={quickRangeSelectors.dashboardQuickRanges.addButton}
          addLabel={t('dashboard-settings.time-picker.add-dashboard-range', 'Add dashboard range')}
          onAdd={addRange}
        />
        {dashboardRanges.length > 0 && (
          <Button
            size="sm"
            variant="secondary"
            fill="text"
            data-testid={quickRangeSelectors.dashboardQuickRanges.restoreButton}
            onClick={() => onChange(undefined)}
          >
            {t('dashboard-settings.time-picker.restore-builtin-ranges', 'Restore built-in ranges')}
          </Button>
        )}
      </Stack>
    </Field>
  );
}

function PersonalQuickRanges() {
  const { ranges, remember, remove } = usePersonalQuickRanges();

  return (
    <Field
      noMargin
      label={t('dashboard-settings.time-picker.personal-ranges-label', 'Your ranges')}
      description={t(
        'dashboard-settings.time-picker.personal-ranges-description',
        'Saved in this browser. Adding or removing a personal range does not change the dashboard.'
      )}
    >
      <Stack direction="column" gap={1}>
        {ranges.length === 0 ? (
          <p>{t('dashboard-settings.time-picker.personal-ranges-empty', 'No saved ranges yet.')}</p>
        ) : (
          <QuickRangeList ranges={ranges} rowTestId={quickRangeSelectors.personalQuickRanges.row} onRemove={remove} />
        )}
        <QuickRangeForm
          idPrefix="personal-quick-range"
          fromTestId={quickRangeSelectors.personalQuickRanges.fromInput}
          toTestId={quickRangeSelectors.personalQuickRanges.toInput}
          nameTestId={quickRangeSelectors.personalQuickRanges.nameInput}
          addTestId={quickRangeSelectors.personalQuickRanges.addButton}
          addLabel={t('dashboard-settings.time-picker.add-personal-range', 'Save personal range')}
          onAdd={remember}
        />
      </Stack>
    </Field>
  );
}

function QuickRangeList({
  ranges,
  rowTestId,
  onRemove,
}: {
  ranges: TimeOption[];
  rowTestId: (from: string, to: string) => string;
  onRemove: (range: TimeOption) => void;
}) {
  const styles = useStyles2(getQuickRangeStyles);

  return (
    <ul className={styles.list}>
      {ranges.map((range) => (
        <li key={`${range.from}-${range.to}`} className={styles.row} data-testid={rowTestId(range.from, range.to)}>
          <span>{range.display}</span>
          <IconButton
            name="times"
            size="sm"
            tooltip={t('dashboard-settings.time-picker.remove-range', 'Remove {{range}}', { range: range.display })}
            onClick={() => onRemove(range)}
          />
        </li>
      ))}
    </ul>
  );
}

function QuickRangeForm({
  idPrefix,
  fromTestId,
  toTestId,
  nameTestId,
  addTestId,
  addLabel,
  onAdd,
}: {
  idPrefix: string;
  fromTestId: string;
  toTestId: string;
  nameTestId: string;
  addTestId: string;
  addLabel: string;
  onAdd: (range: TimeOption) => void;
}) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [display, setDisplay] = useState('');
  const [invalid, setInvalid] = useState(false);

  const addRange = () => {
    const parsed = parseQuickRangeInput(from, to, display);
    if (!parsed) {
      setInvalid(true);
      return;
    }

    setInvalid(false);
    onAdd(parsed);
    setFrom('');
    setTo('');
    setDisplay('');
  };

  return (
    <Stack direction="column" gap={1}>
      <Stack gap={1}>
        <Input
          id={`${idPrefix}-from`}
          data-testid={fromTestId}
          placeholder={t('dashboard-settings.time-picker.range-from-placeholder', 'now-15m')}
          value={from}
          invalid={invalid}
          onChange={(event) => {
            setFrom(event.currentTarget.value);
            setInvalid(false);
          }}
        />
        <Input
          id={`${idPrefix}-to`}
          data-testid={toTestId}
          placeholder={t('dashboard-settings.time-picker.range-to-placeholder', 'now')}
          value={to}
          invalid={invalid}
          onChange={(event) => {
            setTo(event.currentTarget.value);
            setInvalid(false);
          }}
        />
        <Input
          id={`${idPrefix}-name`}
          data-testid={nameTestId}
          placeholder={t('dashboard-settings.time-picker.range-name-placeholder', 'Name')}
          value={display}
          onChange={(event) => setDisplay(event.currentTarget.value)}
        />
      </Stack>
      {invalid && (
        <span role="alert">{t('dashboard-settings.time-picker.invalid-range', 'Enter a valid from and to.')}</span>
      )}
      <Button size="sm" variant="secondary" data-testid={addTestId} onClick={addRange}>
        {addLabel}
      </Button>
    </Stack>
  );
}

const getQuickRangeStyles = (theme: GrafanaTheme2) => ({
  list: css({
    listStyle: 'none',
    margin: 0,
    padding: 0,
  }),
  row: css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing(1),
  }),
});
