import { css } from '@emotion/css';
import { type FormEvent, useState } from 'react';

import { type GrafanaTheme2 } from '@grafana/data';
import { selectors } from '@grafana/e2e-selectors';
import { t } from '@grafana/i18n';
import { Button, Field, IconButton, Input, Stack, Text, useStyles2 } from '@grafana/ui';
import { normalizeQuickRange, usePersonalQuickRanges } from '@grafana/ui/internal';

export function PersonalQuickRangesSettings() {
  const styles = useStyles2(getStyles);
  const { ranges, save, remove } = usePersonalQuickRanges();
  const [display, setDisplay] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [error, setError] = useState<string | undefined>();

  const onAdd = () => {
    const range = normalizeQuickRange(from, to, display);
    if (!range) {
      setError(
        t(
          'dashboard-settings.time-picker.personal-quick-ranges-invalid',
          'Enter a relative range such as now-6h to now.'
        )
      );
      return;
    }

    const result = save(range);
    if (!result.ok) {
      setError(messageFor(result.reason));
      return;
    }

    setError(undefined);
    setDisplay('');
    setFrom('');
    setTo('');
  };

  return (
    <div className={styles.section}>
      <Text element="h4">{t('dashboard-settings.time-picker.personal-quick-ranges-label', 'Your quick ranges')}</Text>
      <Text element="p" color="secondary" variant="bodySmall">
        {t(
          'dashboard-settings.time-picker.personal-quick-ranges-description',
          'Saved in this browser for every dashboard. Adding or removing a range does not change this dashboard.'
        )}
      </Text>
      <Stack direction="column" gap={1}>
        <Field
          noMargin
          label={t('dashboard-settings.time-picker.personal-quick-range-name', 'Name')}
          description={t(
            'dashboard-settings.time-picker.personal-quick-range-name-description',
            'Optional. Leave blank to use the range, such as Last 6 hours.'
          )}
        >
          <Input
            id="personal-quick-range-name"
            width={40}
            placeholder={t('dashboard-settings.time-picker.personal-quick-range-name-placeholder', 'Last 6 hours')}
            value={display}
            onChange={(event: FormEvent<HTMLInputElement>) => setDisplay(event.currentTarget.value)}
          />
        </Field>
        <Field
          noMargin
          label={t('dashboard-settings.time-picker.personal-quick-range-from', 'From')}
          invalid={Boolean(error)}
          error={error}
        >
          <Input
            id="personal-quick-range-from"
            width={40}
            // eslint-disable-next-line @grafana/i18n/no-untranslated-strings -- relative time syntax, not prose
            placeholder="now-6h"
            value={from}
            onChange={(event: FormEvent<HTMLInputElement>) => setFrom(event.currentTarget.value)}
          />
        </Field>
        <Field noMargin label={t('dashboard-settings.time-picker.personal-quick-range-to', 'To')}>
          <Input
            id="personal-quick-range-to"
            width={40}
            // eslint-disable-next-line @grafana/i18n/no-untranslated-strings -- relative time syntax, not prose
            placeholder="now"
            value={to}
            onChange={(event: FormEvent<HTMLInputElement>) => setTo(event.currentTarget.value)}
          />
        </Field>
        <div>
          <Button
            type="button"
            variant="secondary"
            onClick={onAdd}
            data-testid={selectors.components.TimePicker.addPersonalQuickRange}
          >
            {t('dashboard-settings.time-picker.personal-quick-range-add', 'Add to your ranges')}
          </Button>
        </div>
      </Stack>
      {ranges.length > 0 && (
        <ul className={styles.list}>
          {ranges.map((range) => (
            <li key={`${range.from}-${range.to}`} className={styles.row}>
              <span>
                <span className={styles.name}>{range.display}</span>
                <span className={styles.expr}>
                  {range.from} {'\u2192'} {range.to}
                </span>
              </span>
              <IconButton
                name="times"
                variant="destructive"
                tooltip={t('time-picker.quick-ranges.remove-option', 'Remove {{display}} from your ranges', {
                  display: range.display,
                })}
                data-testid={selectors.components.TimePicker.removePersonalQuickRange(range.from, range.to)}
                onClick={() => remove(range)}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function messageFor(reason: 'invalid' | 'duplicate' | 'limit'): string {
  switch (reason) {
    case 'duplicate':
      return t('time-picker.quick-ranges.error-duplicate', 'This range is already in your ranges.');
    case 'limit':
      return t('time-picker.quick-ranges.error-limit', 'You can save up to 15 ranges. Remove one to save another.');
    case 'invalid':
      return t(
        'dashboard-settings.time-picker.personal-quick-ranges-invalid',
        'Enter a relative range such as now-6h to now.'
      );
  }
}

const getStyles = (theme: GrafanaTheme2) => ({
  section: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
    marginBottom: theme.spacing(2),
  }),
  list: css({
    listStyle: 'none',
    margin: 0,
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(0.5),
  }),
  row: css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing(1),
    padding: theme.spacing(0.5, 0),
  }),
  name: css({
    display: 'block',
  }),
  expr: css({
    display: 'block',
    color: theme.colors.text.secondary,
    fontSize: theme.typography.bodySmall.fontSize,
  }),
});
