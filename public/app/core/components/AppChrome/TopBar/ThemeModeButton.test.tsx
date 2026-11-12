import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from 'test/test-utils';

import { createTheme, ThemeContext } from '@grafana/data';
import { reportInteraction } from '@grafana/runtime';
import { toggleTheme } from 'app/core/services/theme';

import { ThemeModeButton } from './ThemeModeButton';

jest.mock('@grafana/runtime', () => ({
  ...jest.requireActual('@grafana/runtime'),
  reportInteraction: jest.fn(),
}));

jest.mock('app/core/services/theme', () => ({
  toggleTheme: jest.fn(),
}));

const toggleThemeMock = jest.mocked(toggleTheme);

function renderButton(mode: 'light' | 'dark') {
  return render(
    <ThemeContext.Provider value={createTheme({ colors: { mode } })}>
      <ThemeModeButton />
    </ThemeContext.Provider>
  );
}

describe('ThemeModeButton', () => {
  beforeEach(() => {
    toggleThemeMock.mockClear();
    jest.mocked(reportInteraction).mockClear();
  });

  it('asks a dark UI to switch to light mode', async () => {
    const user = userEvent.setup();
    renderButton('dark');

    await user.click(screen.getByRole('button', { name: 'Switch to light mode' }));

    expect(toggleThemeMock).toHaveBeenCalledTimes(1);
    expect(toggleThemeMock).toHaveBeenCalledWith(false);
    expect(reportInteraction).toHaveBeenCalledWith('grafana_preferences_theme_changed', {
      toTheme: 'light',
      preferenceType: 'top_bar',
    });
  });

  it('asks a light UI to switch to dark mode', async () => {
    const user = userEvent.setup();
    renderButton('light');

    await user.click(screen.getByRole('button', { name: 'Switch to dark mode' }));

    expect(toggleThemeMock).toHaveBeenCalledTimes(1);
    expect(toggleThemeMock).toHaveBeenCalledWith(false);
    expect(reportInteraction).toHaveBeenCalledWith('grafana_preferences_theme_changed', {
      toTheme: 'dark',
      preferenceType: 'top_bar',
    });
  });
});
