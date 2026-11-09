import { css } from '@emotion/css';
import { useState } from 'react';

import { type GrafanaTheme2, type TimeOption, type TimeRange, type TimeZone, rangeUtil } from '@grafana/data';
import { selectors } from '@grafana/e2e-selectors';
import { t } from '@grafana/i18n';

import { useStyles2 } from '../../../themes/ThemeContext';
import { Button } from '../../Button/Button';
import { Input } from '../../Input/Input';
import {
  timeRangeToPersonalQuickRange,
  withPersonalQuickRange,
  withoutPersonalQuickRange,
} from '../personalQuickRanges';

import { TimePickerTitle } from './TimePickerTitle';
import { TimeRangeList } from './TimeRangeList';

interface Props {
  ranges: TimeOption[];
  value: TimeRange;
  timeZone?: TimeZone;
  searchTerm: string;
  selected?: TimeOption;
  onSelect: (option: TimeOption) => void;
  onChangeRanges: (ranges: TimeOption[]) => void;
}

export function PersonalQuickRangeSection({
  ranges,
  value,
  timeZone,
  searchTerm,
  selected,
  onSelect,
  onChangeRanges,
}: Props) {
  const styles = useStyles2(getStyles);
  const [isNaming, setIsNaming] = useState(false);
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState<string | undefined>();
  const query = searchTerm.trim().toLowerCase();
  const visibleRanges = query ? ranges.filter((option) => option.display.toLowerCase().includes(query)) : ranges;

  if (query && visibleRanges.length === 0) {
    return null;
  }

  const removeRange = (option: TimeOption) => {
    onChangeRanges(withoutPersonalQuickRange(ranges, option));
  };

  const from = typeof value.raw.from === 'string' ? value.raw.from : value.raw.from.toISOString();
  const to = typeof value.raw.to === 'string' ? value.raw.to : value.raw.to.toISOString();

  const startNaming = () => {
    setName(rangeUtil.describeTimeRange(value.raw, timeZone, ranges));
    setNameError(undefined);
    setIsNaming(true);
  };

  const commit = () => {
    const nextRange = timeRangeToPersonalQuickRange(value, name);
    if (!nextRange) {
      setNameError(t('time-picker.personal-ranges.name-required', 'Enter a name'));
      return;
    }

    onChangeRanges(withPersonalQuickRange(ranges, nextRange));
    setIsNaming(false);
    setNameError(undefined);
  };

  return (
    <section
      aria-label={t('time-picker.personal-ranges.title', 'Your ranges')}
      className={styles.section}
      data-testid={selectors.components.TimePicker.personalRanges}
    >
      <div className={styles.title}>
        <TimePickerTitle>{t('time-picker.personal-ranges.title', 'Your ranges')}</TimePickerTitle>
      </div>
      {visibleRanges.length > 0 ? (
        <TimeRangeList options={visibleRanges} value={selected} onChange={onSelect} onRemove={removeRange} />
      ) : (
        <p className={styles.hint}>
          {t(
            'time-picker.personal-ranges.empty',
            'Saved in this browser for every dashboard. They are not part of the dashboard.'
          )}
        </p>
      )}
      {!query &&
        (isNaming ? (
          <div className={styles.editor}>
            <span className={styles.endpoints}>
              {t('time-picker.personal-ranges.endpoints', '{{from}} to {{to}}', { from, to })}
            </span>
            <Input
              autoFocus
              data-testid={selectors.components.TimePicker.personalRangeNameInput}
              invalid={Boolean(nameError)}
              placeholder={t('time-picker.personal-ranges.name-placeholder', 'Name')}
              value={name}
              onChange={(event) => {
                setName(event.currentTarget.value);
                setNameError(undefined);
              }}
            />
            {nameError && <span className={styles.error}>{nameError}</span>}
            <div className={styles.actions}>
              <Button
                type="button"
                size="sm"
                data-testid={selectors.components.TimePicker.confirmPersonalRangeButton}
                onClick={commit}
              >
                {t('time-picker.personal-ranges.save', 'Save')}
              </Button>
              <Button type="button" size="sm" variant="secondary" fill="text" onClick={() => setIsNaming(false)}>
                {t('time-picker.personal-ranges.cancel', 'Cancel')}
              </Button>
            </div>
          </div>
        ) : (
          <div className={styles.editor}>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              fill="text"
              icon="plus"
              data-testid={selectors.components.TimePicker.savePersonalRangeButton}
              onClick={startNaming}
            >
              {t('time-picker.personal-ranges.save-current', 'Save current range')}
            </Button>
          </div>
        ))}
    </section>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  section: css({
    borderBottom: `1px solid ${theme.colors.border.weak}`,
  }),
  title: css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 16px 5px 9px',
  }),
  hint: css({
    color: theme.colors.text.secondary,
    fontSize: theme.typography.bodySmall.fontSize,
    lineHeight: theme.typography.bodySmall.lineHeight,
    margin: 0,
    padding: theme.spacing(0, 1, 1, 1),
  }),
  editor: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
    padding: theme.spacing(0, 1, 1, 1),
  }),
  endpoints: css({
    color: theme.colors.text.secondary,
    fontSize: theme.typography.bodySmall.fontSize,
    overflowWrap: 'anywhere',
  }),
  error: css({
    color: theme.colors.error.text,
    fontSize: theme.typography.bodySmall.fontSize,
  }),
  actions: css({
    display: 'flex',
    gap: theme.spacing(1),
  }),
});
