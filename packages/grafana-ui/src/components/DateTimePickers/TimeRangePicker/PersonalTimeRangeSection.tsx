import { css, cx } from '@emotion/css';

import { type GrafanaTheme2, isDateTime, type TimeOption, type TimeRange } from '@grafana/data';
import { selectors } from '@grafana/e2e-selectors';
import { t } from '@grafana/i18n';

import { useStyles2 } from '../../../themes/ThemeContext';
import { getFocusStyles } from '../../../themes/mixins';
import { Icon } from '../../Icon/Icon';

import { type PersonalRangeSaveState } from './PersonalTimeRangesContext';
import { TimePickerTitle } from './TimePickerTitle';

interface Props {
  ranges: TimeOption[];
  hasSavedRanges: boolean;
  value: TimeRange;
  saveState: PersonalRangeSaveState;
  onSave?: () => void;
  onRemove?: (option: TimeOption) => void;
  onSelect: (option: TimeOption) => void;
}

export function PersonalTimeRangeSection({
  ranges,
  hasSavedRanges,
  value,
  saveState,
  onSave,
  onRemove,
  onSelect,
}: Props) {
  const styles = useStyles2(getStyles);
  const title = t('time-picker.content.your-ranges', 'Your ranges');
  const saveLabel =
    saveState === 'saved'
      ? t('time-picker.personal-ranges.current-range-saved', 'Current range is already saved')
      : t('time-picker.personal-ranges.save-current-range', 'Save current range');

  return (
    <section aria-label={title} className={styles.section} data-testid={selectors.components.TimePicker.yourRanges}>
      <div className={styles.header}>
        <TimePickerTitle>{title}</TimePickerTitle>
        {onSave && saveState !== 'invalid' && (
          <button
            type="button"
            className={styles.saveButton}
            data-testid={selectors.components.TimePicker.personalRanges.saveButton}
            aria-label={saveLabel}
            disabled={saveState !== 'ready'}
            onClick={onSave}
          >
            {saveState === 'saved'
              ? t('time-picker.personal-ranges.saved', 'Saved')
              : t('time-picker.personal-ranges.save', 'Save')}
          </button>
        )}
      </div>
      {!hasSavedRanges && (
        <p className={styles.empty}>
          {t('time-picker.content.no-saved-ranges', 'Save a range to use it on every dashboard.')}
        </p>
      )}
      {ranges.length > 0 && (
        <ul className={styles.list}>
          {ranges.map((option) => {
            const selected = isSameRange(option, value);
            return (
              <li
                key={`${option.from}-${option.to}`}
                className={styles.row}
                data-testid={selectors.components.TimePicker.personalRanges.range(option.from, option.to)}
              >
                <button
                  type="button"
                  className={cx(styles.rangeButton, selected && styles.rangeButtonSelected)}
                  aria-pressed={selected}
                  onClick={() => onSelect(option)}
                >
                  {option.display}
                </button>
                {onRemove && (
                  <button
                    type="button"
                    className={styles.removeButton}
                    aria-label={t('time-picker.personal-ranges.remove', 'Remove {{display}}', {
                      display: option.display,
                    })}
                    onClick={() => onRemove(option)}
                  >
                    <Icon name="times" size="sm" />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function isSameRange(option: TimeOption, value: TimeRange): boolean {
  return option.from === rawToString(value.raw.from) && option.to === rawToString(value.raw.to);
}

function rawToString(value: TimeRange['raw']['from']): string | null {
  if (typeof value === 'string') {
    return value;
  }
  if (isDateTime(value) && value.isValid()) {
    return value.toISOString();
  }
  return null;
}

const getStyles = (theme: GrafanaTheme2) => ({
  section: css({
    borderBottom: `1px solid ${theme.colors.border.weak}`,
  }),
  header: css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing(1),
    padding: '8px 8px 5px 9px',
  }),
  saveButton: css({
    background: 'transparent',
    border: 'none',
    color: theme.colors.text.link,
    cursor: 'pointer',
    flexShrink: 0,
    fontSize: theme.typography.size.sm,
    padding: theme.spacing(0.5),
    whiteSpace: 'nowrap',

    '&:disabled': {
      color: theme.colors.text.disabled,
      cursor: 'default',
    },
    '&:focus-visible': getFocusStyles(theme),
  }),
  empty: css({
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.sm,
    margin: 0,
    padding: theme.spacing(0, 1, 1),
  }),
  list: css({
    listStyle: 'none',
    margin: 0,
    padding: theme.spacing(0.5),
  }),
  row: css({
    alignItems: 'center',
    display: 'flex',
    gap: theme.spacing(0.5),
  }),
  rangeButton: css({
    background: 'transparent',
    border: 'none',
    borderRadius: theme.shape.radius.default,
    color: theme.colors.text.primary,
    cursor: 'pointer',
    flex: 1,
    fontSize: theme.typography.size.sm,
    padding: theme.spacing(1),
    textAlign: 'left',

    '&:hover': {
      background: theme.colors.action.hover,
    },
    '&:focus-visible': getFocusStyles(theme),
  }),
  rangeButtonSelected: css({
    background: theme.colors.action.selected,
    fontWeight: theme.typography.fontWeightMedium,
  }),
  removeButton: css({
    alignItems: 'center',
    background: 'transparent',
    border: 'none',
    borderRadius: theme.shape.radius.default,
    color: theme.colors.text.secondary,
    cursor: 'pointer',
    display: 'flex',
    flexShrink: 0,
    padding: theme.spacing(0.5),

    '&:hover': {
      background: theme.colors.action.hover,
      color: theme.colors.text.primary,
    },
    '&:focus-visible': getFocusStyles(theme),
  }),
});
