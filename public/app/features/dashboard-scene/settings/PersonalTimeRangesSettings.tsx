import { useSyncExternalStore } from 'react';

import { type TimeOption, type TimeRange, type TimeZone } from '@grafana/data';
import { selectors } from '@grafana/e2e-selectors';
import { t } from '@grafana/i18n';
import { Button, Field, IconButton, Stack } from '@grafana/ui';

import {
  addPersonalTimeRange,
  getPersonalRangeSaveState,
  getPersonalTimeRangesSnapshot,
  removePersonalTimeRange,
  subscribePersonalTimeRanges,
} from '../timepicker/personalTimeRanges';

interface Props {
  currentTimeRange?: TimeRange;
  dashboardQuickRanges?: TimeOption[];
  timeZone?: TimeZone;
}

export function PersonalTimeRangesSettings({ currentTimeRange, dashboardQuickRanges, timeZone }: Props) {
  const ranges = useSyncExternalStore(
    subscribePersonalTimeRanges,
    getPersonalTimeRangesSnapshot,
    getPersonalTimeRangesSnapshot
  );
  const saveState = getPersonalRangeSaveState(currentTimeRange?.raw, {
    timeZone,
    quickRanges: dashboardQuickRanges,
  });
  const saveLabel =
    saveState === 'saved'
      ? t('time-picker.personal-ranges.current-range-saved', 'Current range is already saved')
      : t('time-picker.personal-ranges.save-current-range', 'Save current range');

  return (
    <Stack direction="column" gap={2}>
      <Field
        noMargin
        label={t('dashboard-settings.time-picker.your-ranges-label', 'Your time ranges')}
        description={t(
          'dashboard-settings.time-picker.your-ranges-description',
          'These ranges are saved in this browser and show up on every dashboard you open. Saving or removing one does not change this dashboard.'
        )}
      >
        <div>
          {currentTimeRange && saveState !== 'invalid' && (
            <Button
              size="sm"
              variant="secondary"
              fill="outline"
              data-testid={selectors.components.TimePicker.personalRanges.saveButton}
              disabled={saveState !== 'ready'}
              onClick={() =>
                addPersonalTimeRange(currentTimeRange.raw, { timeZone, quickRanges: dashboardQuickRanges })
              }
            >
              {saveLabel}
            </Button>
          )}
          {ranges.length === 0 ? (
            <p>{t('dashboard-settings.time-picker.no-saved-ranges', 'No saved ranges yet.')}</p>
          ) : (
            <ul>
              {ranges.map((range) => (
                <li
                  key={`${range.from}-${range.to}`}
                  data-testid={selectors.components.TimePicker.personalRanges.range(range.from, range.to)}
                >
                  <Stack justifyContent="space-between" alignItems="center">
                    <span>{range.display}</span>
                    <IconButton
                      name="times"
                      aria-label={t('time-picker.personal-ranges.remove', 'Remove {{display}}', {
                        display: range.display,
                      })}
                      onClick={() => removePersonalTimeRange(range)}
                    />
                  </Stack>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Field>
      <Field
        noMargin
        label={t('dashboard-settings.time-picker.dashboard-ranges-label', 'Dashboard ranges')}
        description={dashboardRangesDescription(dashboardQuickRanges)}
      >
        <div>
          {dashboardQuickRanges && dashboardQuickRanges.length > 0 && (
            <ul>
              {dashboardQuickRanges.map((range) => (
                <li key={`${range.from}-${range.to}`}>{range.display}</li>
              ))}
            </ul>
          )}
        </div>
      </Field>
    </Stack>
  );
}

function dashboardRangesDescription(ranges?: TimeOption[]): string {
  if (!ranges) {
    return t(
      'dashboard-settings.time-picker.dashboard-ranges-standard',
      'This dashboard has no quick ranges of its own. The time picker shows the standard ranges next to yours.'
    );
  }
  if (ranges.length === 0) {
    return t('dashboard-settings.time-picker.dashboard-ranges-empty', 'This dashboard has no quick ranges.');
  }
  return t(
    'dashboard-settings.time-picker.dashboard-ranges-attached',
    'Quick ranges attached to this dashboard. They stay on the dashboard when you change your ranges.'
  );
}
