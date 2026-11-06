import { render, screen } from 'test/test-utils';

import { type Role } from 'app/types/accessControl';

import { RolePicker } from './RolePicker';

const writerRole: Role = {
  uid: 'writer',
  name: 'fixed:dashboards:writer',
  displayName: 'Dashboard writer',
  description: 'Create and edit dashboards',
  group: 'dashboards',
  global: false,
  version: 1,
  created: '2020-01-01',
  updated: '2020-01-01',
  delegatable: true,
  filteredDisplayName: '',
};

const readerRole: Role = {
  uid: 'reader',
  name: 'fixed:datasources:reader',
  displayName: 'Data source reader',
  description: 'Read data sources',
  group: 'datasources',
  global: false,
  version: 1,
  created: '2020-01-01',
  updated: '2020-01-01',
  delegatable: true,
  filteredDisplayName: '',
};

async function searchRoles(query: string) {
  const { user } = render(
    <RolePicker
      pickerId={`role-picker-${query}`}
      appliedRoles={[]}
      roleOptions={[writerRole, readerRole]}
      onRolesChange={() => undefined}
    />
  );

  await user.click(screen.getByText('No roles assigned'));
  await user.type(screen.getByTestId('role-picker-input'), query);
}

describe('RolePicker search', () => {
  it.each([
    {
      query: 'Dashboard writer',
      visible: 'Dashboard writer',
      hidden: 'Data source reader',
    },
    {
      query: 'DATA SOURCE',
      visible: 'Data source reader',
      hidden: 'Dashboard writer',
    },
    {
      query: 'fixed:dashboards:writer',
      visible: 'Dashboard writer',
      hidden: 'Data source reader',
    },
  ])('shows "$visible" and hides "$hidden" when searching for "$query"', async ({ query, visible, hidden }) => {
    await searchRoles(query);

    expect(screen.getByText(visible)).toBeInTheDocument();
    expect(screen.queryByText(hidden)).not.toBeInTheDocument();
  });

  it('matches the internal name when a role has no display name', async () => {
    const unnamedRole: Role = { ...readerRole, uid: 'unnamed', displayName: undefined as unknown as string };
    const { user } = render(
      <RolePicker
        pickerId="role-picker-unnamed"
        appliedRoles={[]}
        roleOptions={[writerRole, unnamedRole]}
        onRolesChange={() => undefined}
      />
    );

    await user.click(screen.getByText('No roles assigned'));
    await user.type(screen.getByTestId('role-picker-input'), 'fixed:datasources:reader');

    expect(screen.getByText('fixed:datasources:reader')).toBeInTheDocument();
    expect(screen.queryByText('Dashboard writer')).not.toBeInTheDocument();
  });
});
