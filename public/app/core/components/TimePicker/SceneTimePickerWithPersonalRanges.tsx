import { intervalToAbbreviatedDurationString } from '@grafana/data';
import { t } from '@grafana/i18n';
import { sceneGraph, type SceneTimePicker } from '@grafana/scenes';

import { TimePickerWithHistory } from './TimePickerWithHistory';

interface Props {
  model: SceneTimePicker;
}

export function SceneTimePickerWithPersonalRanges({ model }: Props) {
  const { hidePicker, isOnCanvas, quickRanges, defaultQuickRanges, hideTimeSettings } = model.useState();
  const timeRange = sceneGraph.getTimeRange(model);
  const timeZone = timeRange.getTimeZone();
  const timeRangeState = timeRange.useState();

  if (hidePicker) {
    return null;
  }

  const value = timeRangeState.value;
  const halfSpanMs = (value.to.valueOf() - value.from.valueOf()) / 2;
  const moveDuration = intervalToAbbreviatedDurationString({
    start: new Date(value.from.valueOf()),
    end: new Date(value.from.valueOf() + halfSpanMs),
  });
  const canMoveForward = value.to.valueOf() + halfSpanMs <= Date.now();

  return (
    <TimePickerWithHistory
      isOnCanvas={isOnCanvas}
      value={value}
      quickRanges={quickRanges || defaultQuickRanges}
      quickRangesFromDashboard={quickRanges != null}
      onChange={(range) => timeRange.onTimeRangeChange(range)}
      timeZone={timeZone}
      fiscalYearStartMonth={timeRangeState.fiscalYearStartMonth}
      onMoveBackward={model.onMoveBackward}
      onMoveForward={model.onMoveForward}
      moveBackwardTooltip={t('time-picker.scene.move-backward', 'Move {{duration}} backward', {
        duration: moveDuration,
      })}
      moveForwardTooltip={
        canMoveForward
          ? t('time-picker.scene.move-forward', 'Move {{duration}} forward', { duration: moveDuration })
          : undefined
      }
      hideTimeZone={hideTimeSettings}
      onZoom={model.onZoom}
      onChangeTimeZone={(zone) => timeRange.onTimeZoneChange(zone)}
      onChangeFiscalYearStartMonth={model.onChangeFiscalYearStartMonth}
      weekStart={timeRangeState.weekStart}
    />
  );
}
