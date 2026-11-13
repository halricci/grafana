import { render, screen } from 'test/test-utils';

import { type Role } from 'app/types/accessControl';

import { RolePicker } from './RolePicker';

const dashboardWriter = createRole({
  uid: 'fixed-dashboards-writer',
  name: 'fixed:dashboards:writer',
  displayName: 'Dashboard writer',
  group: 'dashboards',
});

const folderReader = createRole({
  uid: 'fixed-folders-reader',
  name: 'fixed:folders:reader',
  displayName: 'Folder reader',
  group: 'folders',
});

describe('RolePicker search', () => {
  it.each([
    {
      query: 'board writer',
      visible: 'Dashboard writer',
      hidden: 'Folder reader',
    },
    {
      query: 'dashboard writer',
      visible: 'Dashboard writer',
      hidden: 'Folder reader',
    },
    {
      query: 'FOLDER READER',
      visible: 'Folder reader',
      hidden: 'Dashboard writer',
    },
    {
      query: 'fixed:folders:reader',
      visible: 'Folder reader',
      hidden: 'Dashboard writer',
    },
    {
      query: 'FIXED:DASHBOARDS:WRITER',
      visible: 'Dashboard writer',
      hidden: 'Folder reader',
    },
  ])('shows "$visible" when the query is "$query"', async ({ query, visible, hidden }) => {
    const { user } = render(
      <RolePicker
        pickerId={`role-picker-${query}`}
        appliedRoles={[]}
        roleOptions={[dashboardWriter, folderReader]}
        onRolesChange={() => {}}
      />,
      { renderWithRouter: false }
    );

    await user.click(screen.getByText('No roles assigned'));
    await user.type(screen.getByTestId('role-picker-input'), query);

    expect(screen.getByText(visible)).toBeInTheDocument();
    expect(screen.queryByText(hidden)).not.toBeInTheDocument();
  });
});

function createRole(overrides: Partial<Role> & Pick<Role, 'uid' | 'name' | 'group'>): Role {
  return {
    created: '2020-01-01T00:00:00Z',
    updated: '2020-01-01T00:00:00Z',
    description: '',
    displayName: '',
    version: 1,
    filteredDisplayName: '',
    delegatable: true,
    ...overrides,
  };
}
