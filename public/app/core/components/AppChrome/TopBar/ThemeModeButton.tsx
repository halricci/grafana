import { selectors } from '@grafana/e2e-selectors';
import { t } from '@grafana/i18n';
import { reportInteraction } from '@grafana/runtime';
import { ToolbarButton, useTheme2 } from '@grafana/ui';
import { toggleTheme } from 'app/core/services/theme';

export function ThemeModeButton() {
  const theme = useTheme2();
  const switchToLight = theme.isDark;
  const label = switchToLight
    ? t('navigation.theme-mode.switch-to-light', 'Switch to light mode')
    : t('navigation.theme-mode.switch-to-dark', 'Switch to dark mode');

  return (
    <ToolbarButton
      iconOnly
      icon="adjust-circle"
      aria-label={label}
      tooltip={label}
      data-testid={selectors.components.NavToolbar.themeModeButton}
      onClick={() => {
        reportInteraction('grafana_preferences_theme_changed', {
          toTheme: switchToLight ? 'light' : 'dark',
          preferenceType: 'top_bar',
        });
        toggleTheme(false);
      }}
    />
  );
}
