import { type SceneTimePicker } from '@grafana/scenes';
import { QuickRangesSourceContext, type QuickRangesKind } from '@grafana/ui/internal';

interface Props {
  model: SceneTimePicker;
}

export function DashboardTimePicker({ model }: Props) {
  const { quickRanges } = model.useState();
  const kind: QuickRangesKind = quickRanges?.length ? 'dashboard' : 'builtin';

  return (
    <QuickRangesSourceContext.Provider value={kind}>
      <model.Component model={model} />
    </QuickRangesSourceContext.Provider>
  );
}
