import { css, cx } from '@emotion/css';
import { memo, useId } from 'react';

import { type GrafanaTheme2, type TimeOption } from '@grafana/data';
import { selectors } from '@grafana/e2e-selectors';
import { t } from '@grafana/i18n';

import { useStyles2 } from '../../../themes/ThemeContext';
import { getFocusStyles } from '../../../themes/mixins';
import { IconButton } from '../../IconButton/IconButton';

const getStyles = (theme: GrafanaTheme2) => {
  return {
    container: css({
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'relative',
    }),
    radio: css({
      opacity: 0,
      width: '0 !important',
      '&:focus-visible + label': getFocusStyles(theme),
    }),
    label: css({
      cursor: 'pointer',
      flex: 1,
      padding: theme.spacing(1),
      borderRadius: theme.shape.radius.default,

      '&:hover': {
        background: theme.colors.action.hover,
        cursor: 'pointer',
      },
    }),
    labelSelected: css({
      background: theme.colors.action.selected,

      '&::before': {
        backgroundImage: theme.colors.gradients.brandVertical,
        borderRadius: theme.shape.radius.default,
        content: '" "',
        display: 'block',
        height: '100%',
        position: 'absolute',
        width: theme.spacing(0.5),
        left: 0,
        top: 0,
      },
    }),
  };
};

interface Props {
  value: TimeOption;
  selected?: boolean;
  onSelect: (option: TimeOption) => void;
  onRemove?: (option: TimeOption) => void;
  /**
   *  Input identifier. This should be the same for all options in a group.
   */
  name: string;
}

export const TimeRangeOption = memo<Props>(({ value, onSelect, onRemove, selected = false, name }) => {
  const styles = useStyles2(getStyles);
  // In case there are more of the same timerange in the list
  const id = useId();

  return (
    <li
      className={styles.container}
      data-testid={selectors.components.TimePicker.timeRangeOption(value.from, value.to)}
    >
      <input
        className={styles.radio}
        checked={selected}
        name={name}
        type="checkbox"
        data-role="item"
        tabIndex={-1}
        id={id}
        onChange={() => onSelect(value)}
      />
      <label className={cx(styles.label, selected && styles.labelSelected)} htmlFor={id}>
        {value.display}
      </label>
      {onRemove && (
        <IconButton
          name="trash-alt"
          aria-label={t('time-picker.time-range.remove', 'Remove {{range}}', { range: value.display })}
          data-testid={selectors.components.TimePicker.removePersonalRange(value.from, value.to)}
          onClick={() => onRemove(value)}
        />
      )}
    </li>
  );
});

TimeRangeOption.displayName = 'TimeRangeOption';
