import { useMemo, type ReactNode } from 'react';

import { type SceneTimePicker } from '@grafana/scenes';
import { TimePickerQuickRangeGroupsContext } from '@grafana/ui';
import { usePersonalQuickRanges } from 'app/core/components/TimePicker/personalQuickRanges';

interface Props {
  timePicker: SceneTimePicker;
  children: ReactNode;
}

/**
 * SceneTimePicker already owns dashboard quick ranges and recently used absolute ranges.
 * Personal ranges are passed beside those, through context, so the picker can label them
 * without writing them back onto the scene.
 */
export function DashboardQuickRangeProvider({ timePicker, children }: Props) {
  const { quickRanges } = timePicker.useState();
  const [personalRanges, setPersonalRanges] = usePersonalQuickRanges();
  const dashboardRanges = quickRanges?.length ? quickRanges : undefined;

  const value = useMemo(
    () => ({
      personalRanges,
      onPersonalQuickRangesChange: setPersonalRanges,
      dashboardRanges,
    }),
    [personalRanges, setPersonalRanges, dashboardRanges]
  );

  return (
    <TimePickerQuickRangeGroupsContext.Provider value={value}>{children}</TimePickerQuickRangeGroupsContext.Provider>
  );
}
