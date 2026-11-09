import { css } from '@emotion/css';
import { useState } from 'react';

import { type GrafanaTheme2, type TimeOption } from '@grafana/data';
import { selectors } from '@grafana/e2e-selectors';
import { t } from '@grafana/i18n';

import { useStyles2 } from '../../../themes/ThemeContext';
import { Button } from '../../Button/Button';
import { Input } from '../../Input/Input';

import { TimePickerTitle } from './TimePickerTitle';
import { TimeRangeList } from './TimeRangeList';

interface Props {
  options: TimeOption[];
  hasSavedRanges: boolean;
  isFiltering: boolean;
  selected?: TimeOption;
  onSelect: (option: TimeOption) => void;
  onSave: (name: string) => boolean;
  onRemove: (option: TimeOption) => void;
}

export const PersonalQuickRanges = ({
  options,
  hasSavedRanges,
  isFiltering,
  selected,
  onSelect,
  onSave,
  onRemove,
}: Props) => {
  const styles = useStyles2(getStyles);
  const [name, setName] = useState('');
  const title = t('time-picker.personal.title', 'Your ranges');

  const save = () => {
    if (onSave(name)) {
      setName('');
    }
  };

  return (
    <section aria-label={title} data-testid={selectors.components.TimePicker.yourRanges} className={styles.section}>
      <div className={styles.title}>
        <TimePickerTitle>{title}</TimePickerTitle>
      </div>
      <p className={styles.hint}>{t('time-picker.personal.hint', 'Saved in this browser')}</p>
      <div className={styles.saveRow}>
        <Input
          value={name}
          onChange={(event) => setName(event.currentTarget.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              save();
            }
          }}
          placeholder={t('time-picker.personal.name-placeholder', 'Name (optional)')}
          aria-label={t('time-picker.personal.name-label', 'Name for this range')}
          data-testid={selectors.components.TimePicker.personalRangeName}
        />
        <Button
          size="sm"
          variant="secondary"
          type="button"
          fullWidth
          onClick={save}
          data-testid={selectors.components.TimePicker.savePersonalRange}
        >
          {t('time-picker.personal.save', 'Save current range')}
        </Button>
      </div>
      {options.length > 0 && (
        <TimeRangeList
          groupName={title}
          options={options}
          value={selected}
          onChange={onSelect}
          onRemove={onRemove}
        />
      )}
      {!hasSavedRanges && !isFiltering && (
        <p className={styles.empty}>{t('time-picker.personal.empty', 'No saved ranges yet.')}</p>
      )}
    </section>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  section: css({
    borderBottom: `1px solid ${theme.colors.border.weak}`,
  }),
  title: css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 16px 0 9px',
  }),
  hint: css({
    color: theme.colors.text.secondary,
    fontSize: theme.typography.bodySmall.fontSize,
    margin: 0,
    padding: theme.spacing(0.5, 1, 0, 1),
  }),
  saveRow: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
    padding: theme.spacing(1),
  }),
  empty: css({
    color: theme.colors.text.secondary,
    fontSize: theme.typography.bodySmall.fontSize,
    margin: 0,
    padding: theme.spacing(0, 1, 1, 1),
  }),
});
