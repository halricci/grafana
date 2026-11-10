import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { type Role } from 'app/types/accessControl';

import { RolePicker } from './RolePicker';

const dashboardWriter: Role = {
  uid: 'dashboard-writer',
  name: 'fixed:dashboards:writer',
  displayName: 'Dashboard writer',
  group: 'dashboards',
  description: 'Create and edit dashboards',
  global: false,
  version: 1,
  created: '2020-01-01T00:00:00Z',
  updated: '2020-01-01T00:00:00Z',
  delegatable: true,
  filteredDisplayName: 'dashboards:Dashboard writer',
};

const folderReader: Role = {
  uid: 'folder-reader',
  name: 'fixed:folders:reader',
  displayName: 'Folder reader',
  group: 'folders',
  description: 'View folders',
  global: false,
  version: 1,
  created: '2020-01-01T00:00:00Z',
  updated: '2020-01-01T00:00:00Z',
  delegatable: true,
  filteredDisplayName: 'folders:Folder reader',
};

async function searchRoles(query: string) {
  // jsdom does not lay out the picker, so the default pointer-events check never hits it.
  const user = userEvent.setup({ pointerEventsCheck: 0 });
  render(<RolePicker appliedRoles={[]} roleOptions={[dashboardWriter, folderReader]} onRolesChange={() => {}} />);

  await user.click(screen.getByText('No roles assigned'));
  await user.type(await screen.findByTestId('role-picker-input'), query);
}

describe('RolePicker search', () => {
  it.each([
    {
      query: 'BOARD wri',
      visible: 'dashboards:Dashboard writer',
      hidden: 'folders:Folder reader',
    },
    {
      query: 'folders:reader',
      visible: 'folders:Folder reader',
      hidden: 'dashboards:Dashboard writer',
    },
  ])('shows "$visible" and hides "$hidden" when the query is "$query"', async ({ query, visible, hidden }) => {
    await searchRoles(query);

    expect(await screen.findByText(visible)).toBeInTheDocument();
    expect(screen.queryByText(hidden)).not.toBeInTheDocument();
  });
});
