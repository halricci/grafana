import { type SceneTimePicker } from '@grafana/scenes';
import { PersonalQuickRangesProvider } from '@grafana/ui';

interface Props {
  model: SceneTimePicker;
}

export function DashboardTimePicker({ model }: Props) {
  const { quickRanges } = model.useState();

  return (
    <PersonalQuickRangesProvider quickRangesFromDashboard={Array.isArray(quickRanges) && quickRanges.length > 0}>
      <model.Component model={model} />
    </PersonalQuickRangesProvider>
  );
}
