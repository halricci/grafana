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
  it('registers orientation as an Axis radio that defaults to horizontal', () => {
    const orientation = buildItems().find((item) => item.path === 'orientation');

    expect(orientation?.defaultValue).toBe(VizOrientation.Horizontal);
    expect(orientation?.category).toEqual(['Axis']);
    expect(orientation?.settings?.options?.map((option: { value?: VizOrientation }) => option.value)).toEqual([
      VizOrientation.Auto,
      VizOrientation.Horizontal,
      VizOrientation.Vertical,
    ]);
  });
});
