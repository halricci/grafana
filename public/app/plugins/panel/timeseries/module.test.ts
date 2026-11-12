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

describe('time series module', () => {
  it('registers an Axis orientation radio that defaults to horizontal', () => {
    const orientation = buildItems().find((item) => item.path === 'orientation');

    expect(orientation?.name).toBe('Orientation');
    expect(orientation?.defaultValue).toBe(VizOrientation.Horizontal);
    expect(orientation?.category).toEqual(['Axis']);
    expect(orientation?.settings?.options).toEqual([
      { value: VizOrientation.Auto, label: 'Auto' },
      { value: VizOrientation.Horizontal, label: 'Horizontal' },
      { value: VizOrientation.Vertical, label: 'Vertical' },
    ]);
  });
});
