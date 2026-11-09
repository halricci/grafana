import { css } from '@emotion/css';
import { useState } from 'react';

import { dateMath, type GrafanaTheme2, type TimeOption } from '@grafana/data';
import { selectors } from '@grafana/e2e-selectors';
import { t } from '@grafana/i18n';
import {
  Button,
  Field,
  IconButton,
  Input,
  Stack,
  usePersonalQuickRanges,
  useStyles2,
  withPersonalQuickRange,
  withoutPersonalQuickRange,
} from '@grafana/ui';

interface Props {
  dashboardQuickRanges?: TimeOption[];
}

const settingsSelectors = selectors.pages.Dashboard.Settings.General;

export function PersonalQuickRangesSettings({ dashboardQuickRanges }: Props) {
  const styles = useStyles2(getStyles);
  const { ranges, replace } = usePersonalQuickRanges();
  const [display, setDisplay] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [error, setError] = useState<string | undefined>();

  const addRange = () => {
    const name = display.trim();
    const fromValue = from.trim();
    const toValue = to.trim();

    if (!name || !fromValue || !toValue) {
      setError(
        t('dashboard-settings.time-picker.personal-range-required', 'Enter a name, a from time, and a to time.')
      );
      return;
    }

    if (!dateMath.isValid(fromValue) || !dateMath.isValid(toValue)) {
      setError(
        t(
          'dashboard-settings.time-picker.personal-range-invalid',
          'Enter a valid time, such as now-6h or an absolute time.'
        )
      );
      return;
    }

    const fromDate = dateMath.parse(fromValue);
    const toDate = dateMath.parse(toValue, true);
    if (fromDate && toDate && fromDate.isAfter(toDate)) {
      setError(t('dashboard-settings.time-picker.personal-range-order', 'From must be before to.'));
      return;
    }

    const next = withPersonalQuickRange(ranges, { display: name, from: fromValue, to: toValue });
    replace(next);
    setDisplay('');
    setFrom('');
    setTo('');
    setError(undefined);
  };

  return (
    <Stack direction="column" gap={2}>
      <Field
        noMargin
        label={t('dashboard-settings.time-picker.your-quick-ranges-label', 'Your quick ranges')}
        description={t(
          'dashboard-settings.time-picker.your-quick-ranges-description',
          'Saved in this browser and shown in every dashboard time picker. Adding or removing a range does not change the dashboard.'
        )}
        data-testid={settingsSelectors.personalQuickRanges}
      >
        <Stack direction="column" gap={1}>
          {ranges.length > 0 && (
            <ul className={styles.list}>
              {ranges.map((range) => (
                <li key={`${range.from}-${range.to}`} className={styles.row}>
                  <span className={styles.name}>{range.display}</span>
                  <span className={styles.endpoints}>
                    {t('dashboard-settings.time-picker.personal-range-endpoints', '{{from}} to {{to}}', {
                      from: range.from,
                      to: range.to,
                    })}
                  </span>
                  <IconButton
                    name="trash-alt"
                    size="sm"
                    variant="destructive"
                    tooltip={t('dashboard-settings.time-picker.remove-personal-range', 'Remove {{display}}', {
                      display: range.display,
                    })}
                    onClick={() => replace(withoutPersonalQuickRange(ranges, range))}
                  />
                </li>
              ))}
            </ul>
          )}
          <Stack direction="column" gap={1}>
            <Input
              data-testid={settingsSelectors.personalQuickRangeNameInput}
              placeholder={t('dashboard-settings.time-picker.personal-range-name', 'Name')}
              value={display}
              onChange={(event) => setDisplay(event.currentTarget.value)}
            />
            <Input
              data-testid={settingsSelectors.personalQuickRangeFromInput}
              placeholder={t('dashboard-settings.time-picker.personal-range-from', 'From, for example now-6h')}
              value={from}
              onChange={(event) => setFrom(event.currentTarget.value)}
            />
            <Input
              data-testid={settingsSelectors.personalQuickRangeToInput}
              placeholder={t('dashboard-settings.time-picker.personal-range-to', 'To, for example now')}
              value={to}
              onChange={(event) => setTo(event.currentTarget.value)}
            />
            <div>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                data-testid={settingsSelectors.addPersonalQuickRangeButton}
                onClick={addRange}
              >
                {t('dashboard-settings.time-picker.add-personal-range', 'Add range')}
              </Button>
            </div>
            {error && <span className={styles.error}>{error}</span>}
          </Stack>
        </Stack>
      </Field>
      {dashboardQuickRanges && dashboardQuickRanges.length > 0 && (
        <Field
          noMargin
          label={t('dashboard-settings.time-picker.dashboard-quick-ranges-label', 'Dashboard quick ranges')}
          description={t(
            'dashboard-settings.time-picker.dashboard-quick-ranges-description',
            'Set on this dashboard and shown to everyone. They stay separate from your ranges.'
          )}
          data-testid={settingsSelectors.dashboardQuickRanges}
        >
          <ul className={styles.list}>
            {dashboardQuickRanges.map((range) => (
              <li key={`${range.display}-${range.from}-${range.to}`} className={styles.row}>
                <span className={styles.name}>{range.display}</span>
                <span className={styles.endpoints}>
                  {t('dashboard-settings.time-picker.dashboard-range-endpoints', '{{from}} to {{to}}', {
                    from: range.from,
                    to: range.to,
                  })}
                </span>
              </li>
            ))}
          </ul>
        </Field>
      )}
    </Stack>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  list: css({
    listStyle: 'none',
    margin: 0,
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(0.5),
  }),
  row: css({
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) auto auto',
    alignItems: 'center',
    columnGap: theme.spacing(1),
  }),
  name: css({
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }),
  endpoints: css({
    color: theme.colors.text.secondary,
    fontSize: theme.typography.bodySmall.fontSize,
  }),
  error: css({
    color: theme.colors.error.text,
    fontSize: theme.typography.bodySmall.fontSize,
  }),
});
