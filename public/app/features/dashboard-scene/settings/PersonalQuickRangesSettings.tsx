import { css } from '@emotion/css';
import { type FormEvent, useState } from 'react';

import { type GrafanaTheme2 } from '@grafana/data';
import { selectors } from '@grafana/e2e-selectors';
import { t } from '@grafana/i18n';
import {
  Button,
  Field,
  IconButton,
  Input,
  Stack,
  createPersonalQuickRange,
  usePersonalQuickRanges,
  useStyles2,
} from '@grafana/ui';

export function PersonalQuickRangesSettings() {
  const styles = useStyles2(getStyles);
  const { ranges, save, remove } = usePersonalQuickRanges();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [error, setError] = useState<string | undefined>();

  const onAdd = () => {
    const result = createPersonalQuickRange(from, to);
    if (!result.ok) {
      setError(messageFor(result.error));
      return;
    }

    save(result.range);
    setFrom('');
    setTo('');
    setError(undefined);
  };

  return (
    <Field
      noMargin
      className={styles.field}
      label={t('dashboard-settings.time-picker.personal-ranges-label', 'Your quick ranges')}
      description={t(
        'dashboard-settings.time-picker.personal-ranges-description',
        'Saved in this browser and shown in every dashboard time picker. Adding or removing one does not change this dashboard.'
      )}
    >
      <div>
        <Stack direction="row" alignItems="flex-end" gap={1}>
          <Field noMargin label={t('dashboard-settings.time-picker.personal-ranges-from', 'Quick range from')}>
            <Input
              id="personal-quick-range-from"
              width={22}
              value={from}
              onChange={(event: FormEvent<HTMLInputElement>) => {
                setFrom(event.currentTarget.value);
                setError(undefined);
              }}
              data-testid={selectors.components.TimePicker.personalQuickRangeFrom}
            />
          </Field>
          <Field noMargin label={t('dashboard-settings.time-picker.personal-ranges-to', 'Quick range to')}>
            <Input
              id="personal-quick-range-to"
              width={16}
              value={to}
              onChange={(event: FormEvent<HTMLInputElement>) => {
                setTo(event.currentTarget.value);
                setError(undefined);
              }}
              data-testid={selectors.components.TimePicker.personalQuickRangeTo}
            />
          </Field>
          <Button type="button" onClick={onAdd} data-testid={selectors.components.TimePicker.addPersonalQuickRange}>
            {t('dashboard-settings.time-picker.personal-ranges-add', 'Add range')}
          </Button>
        </Stack>
        {error && (
          <div role="alert" className={styles.error}>
            {error}
          </div>
        )}
        {ranges.length === 0 ? (
          <p className={styles.empty}>
            {t('dashboard-settings.time-picker.personal-ranges-empty', 'No saved ranges yet.')}
          </p>
        ) : (
          <ul className={styles.list}>
            {ranges.map((range) => (
              <li key={`${range.from}-${range.to}`} className={styles.item}>
                <span>{range.display}</span>
                <IconButton
                  name="times"
                  size="sm"
                  variant="secondary"
                  tooltip={t('dashboard-settings.time-picker.personal-ranges-remove', 'Remove {{display}}', {
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
    </Field>
  );
}

function messageFor(error: 'empty' | 'invalid' | 'order'): string {
  if (error === 'order') {
    return t('dashboard-settings.time-picker.personal-ranges-order', '"From" must be before "To".');
  }

  return t('dashboard-settings.time-picker.personal-ranges-invalid', 'Enter a date or a relative time such as now-1h.');
}

const getStyles = (theme: GrafanaTheme2) => ({
  field: css({
    marginBottom: theme.spacing(2),
  }),
  empty: css({
    color: theme.colors.text.secondary,
    fontSize: theme.typography.bodySmall.fontSize,
    margin: theme.spacing(1, 0, 0),
  }),
  error: css({
    color: theme.colors.error.text,
    fontSize: theme.typography.bodySmall.fontSize,
    margin: theme.spacing(1, 0, 0),
  }),
  list: css({
    listStyle: 'none',
    margin: theme.spacing(1, 0, 0),
    padding: 0,
  }),
  item: css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing(1),
    padding: theme.spacing(0.5, 0),
  }),
});
