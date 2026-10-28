import { useMemo, type ReactNode } from 'react';

import { PersonalQuickRangesContext, usePersonalQuickRanges } from './personalQuickRanges';

interface Props {
  quickRangesFromDashboard: boolean;
  children: ReactNode;
}

export function PersonalQuickRangesProvider({ quickRangesFromDashboard, children }: Props) {
  const { ranges, saveTimeRange, remove } = usePersonalQuickRanges();
  const value = useMemo(
    () => ({
      ranges,
      quickRangesFromDashboard,
      save: saveTimeRange,
      remove,
    }),
    [quickRangesFromDashboard, ranges, remove, saveTimeRange]
  );

  return <PersonalQuickRangesContext.Provider value={value}>{children}</PersonalQuickRangesContext.Provider>;
}
