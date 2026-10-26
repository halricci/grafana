import { css } from '@emotion/css';
import { type FormEvent, useState } from 'react';

import { type GrafanaTheme2, type TimeOption } from '@grafana/data';
import { selectors } from '@grafana/e2e-selectors';
import { t } from '@grafana/i18n';
import { Button, Field, IconButton, Input, Stack, useStyles2 } from '@grafana/ui';
import { removePersonalQuickRange, savePersonalQuickRange, usePersonalQuickRanges } from '@grafana/ui/internal';

interface Props {
  dashboardQuickRanges?: TimeOption[];
}

export function PersonalQuickRangesSettings({ dashboardQuickRanges }: Props) {
  const styles = useStyles2(getStyles);
  const personalRanges = usePersonalQuickRanges();
  const [display, setDisplay] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const trimmedFrom = from.trim();
  const trimmedTo = to.trim();

  const onAdd = () => {
    if (!trimmedFrom || !trimmedTo) {
      return;
    }

    savePersonalQuickRange({
      from: trimmedFrom,
      to: trimmedTo,
      display: display.trim() || `${trimmedFrom} to ${trimmedTo}`,
    });
    setDisplay('');
    setFrom('');
    setTo('');
  };

  return (
    <>
      <Field
        noMargin
        label={t('dashboard-settings.time-picker.your-ranges-label', 'Your quick ranges')}
        description={t(
          'dashboard-settings.time-picker.your-ranges-description',
          'Saved in this browser for every dashboard. Adding or removing them does not change this dashboard.'
        )}
      >
        <Stack direction="column" gap={1}>
          <Stack gap={1} alignItems="flex-end">
            <Input
              id="personal-range-display"
              placeholder={t('dashboard-settings.time-picker.range-name-placeholder', 'Name')}
              aria-label={t('dashboard-settings.time-picker.range-name-label', 'Range name')}
              value={display}
              onChange={(event: FormEvent<HTMLInputElement>) => setDisplay(event.currentTarget.value)}
              data-testid={selectors.components.TimePicker.personalRangeDisplayInput}
            />
            <Input
              id="personal-range-from"
              placeholder={t('dashboard-settings.time-picker.range-from-placeholder', 'From')}
              aria-label={t('dashboard-settings.time-picker.range-from-label', 'Range from')}
              value={from}
              onChange={(event: FormEvent<HTMLInputElement>) => setFrom(event.currentTarget.value)}
              data-testid={selectors.components.TimePicker.personalRangeFromInput}
            />
            <Input
              id="personal-range-to"
              placeholder={t('dashboard-settings.time-picker.range-to-placeholder', 'To')}
              aria-label={t('dashboard-settings.time-picker.range-to-label', 'Range to')}
              value={to}
              onChange={(event: FormEvent<HTMLInputElement>) => setTo(event.currentTarget.value)}
              data-testid={selectors.components.TimePicker.personalRangeToInput}
            />
            <Button
              type="button"
              onClick={onAdd}
              disabled={!trimmedFrom || !trimmedTo}
              data-testid={selectors.components.TimePicker.addPersonalRangeButton}
            >
              {t('dashboard-settings.time-picker.add-range', 'Add range')}
            </Button>
          </Stack>
          {personalRanges.length > 0 && (
            <ul className={styles.list} data-testid={selectors.components.TimePicker.personalRanges}>
              {personalRanges.map((range) => (
                <li
                  key={`${range.from}-${range.to}`}
                  className={styles.row}
                  data-testid={selectors.components.TimePicker.personalRangeRow(range.from, range.to)}
                >
                  <span>{range.display}</span>
                  <IconButton
                    name="times"
                    size="sm"
                    aria-label={t('time-picker.personal.remove', 'Remove {{display}}', { display: range.display })}
                    onClick={() => removePersonalQuickRange(range)}
                  />
                </li>
              ))}
            </ul>
          )}
        </Stack>
      </Field>
      {dashboardQuickRanges && dashboardQuickRanges.length > 0 && (
        <Field
          noMargin
          label={t('dashboard-settings.time-picker.dashboard-ranges-label', 'Dashboard ranges')}
          description={t(
            'dashboard-settings.time-picker.dashboard-ranges-description',
            'Saved on this dashboard for everyone who opens it.'
          )}
        >
          <ul className={styles.list} data-testid={selectors.components.TimePicker.dashboardRanges}>
            {dashboardQuickRanges.map((range) => (
              <li key={`${range.from}-${range.to}`} className={styles.row}>
                <span>{range.display}</span>
              </li>
            ))}
          </ul>
        </Field>
      )}
    </>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
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
    padding: theme.spacing(0.5, 0),
  }),
});
