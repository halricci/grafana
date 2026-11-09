import { PanelOptionsEditorBuilder, standardEditorsRegistry } from '@grafana/data';
import { VizOrientation } from '@grafana/schema';
import { getAllOptionEditors } from 'app/core/components/OptionsUI/registry';

import { plugin } from './module';
import { type Options } from './panelcfg.gen';

standardEditorsRegistry.setInit(getAllOptionEditors);

function buildItems() {
  const builder = new PanelOptionsEditorBuilder<Options>();
  plugin.getPanelOptionsSupplier()(builder, { data: [] });
  return builder.getItems();
}

describe('timeseries module', () => {
  it('registers an orientation radio that defaults to horizontal', () => {
    const orientation = buildItems().find((item) => item.path === 'orientation');
    const choices = orientation?.settings?.options ?? [];

    expect(orientation?.defaultValue).toBe(VizOrientation.Horizontal);
    expect(orientation?.showIf).toBeUndefined();
    expect(orientation?.category).toEqual(['Axis']);
    expect(choices.map((choice: { value: VizOrientation; label: string }) => [choice.value, choice.label])).toEqual([
      [VizOrientation.Auto, 'Auto'],
      [VizOrientation.Horizontal, 'Horizontal'],
      [VizOrientation.Vertical, 'Vertical'],
    ]);
  });
});
