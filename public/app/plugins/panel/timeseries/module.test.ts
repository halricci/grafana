import { PanelOptionsEditorBuilder, standardEditorsRegistry, VizOrientation } from '@grafana/data';
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
  it('registers orientation as Auto / Horizontal / Vertical defaulting to Horizontal', () => {
    const orientation = buildItems().find((item) => item.path === 'orientation');

    expect(orientation?.editor).toBe(standardEditorsRegistry.get('radio').editor);
    expect(orientation?.defaultValue).toBe(VizOrientation.Horizontal);
    expect(orientation?.settings?.options).toEqual([
      { value: VizOrientation.Auto, label: 'Auto' },
      { value: VizOrientation.Horizontal, label: 'Horizontal' },
      { value: VizOrientation.Vertical, label: 'Vertical' },
    ]);
  });
});
