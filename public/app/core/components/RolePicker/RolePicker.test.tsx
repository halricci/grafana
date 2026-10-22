import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { type Role } from 'app/types/accessControl';

import { RolePicker } from './RolePicker';

function createRole(partial: Partial<Role> & Pick<Role, 'uid' | 'name'>): Role {
  return {
    displayName: '',
    filteredDisplayName: '',
    description: '',
    group: 'Dashboards',
    global: true,
    version: 1,
    created: 'created',
    updated: 'updated',
    delegatable: true,
    ...partial,
  };
}

const dashboardWriter = createRole({
  uid: 'dashboard-writer',
  name: 'fixed:dashboards:writer',
  displayName: 'Dashboard writer',
  filteredDisplayName: 'Dashboards:Dashboard writer',
});

const datasourcesReader = createRole({
  uid: 'datasources-reader',
  name: 'fixed:datasources:reader',
  displayName: 'Data source reader',
  filteredDisplayName: 'Datasources:Data source reader',
});

const nameOnlyRole = createRole({
  uid: 'name-only',
  name: 'fixed:support.bundles:writer',
  displayName: undefined,
  filteredDisplayName: '',
});

const defaultProps = {
  appliedRoles: [] as Role[],
  roleOptions: [dashboardWriter, datasourcesReader, nameOnlyRole],
  onRolesChange: jest.fn(),
  showBasicRole: false,
  pickerId: 'role-picker-test',
};

async function openPickerAndSearch(query: string, pickerId: string) {
  const user = userEvent.setup();
  render(<RolePicker {...defaultProps} pickerId={pickerId} />);

  // RolePickerInput opens on mouseDown of the collapsed wrapper
  fireEvent.mouseDown(screen.getByText('No roles assigned'));
  const input = await screen.findByTestId('role-picker-input');
  await user.type(input, query);
}

describe('RolePicker', () => {
  it('filters roles by display name case-insensitively', async () => {
    await openPickerAndSearch('dashboard', 'role-picker-display-name');

    expect(screen.getByText('Dashboards:Dashboard writer')).toBeInTheDocument();
    expect(screen.queryByText('Datasources:Data source reader')).not.toBeInTheDocument();
  });

  it('still filters roles by internal name', async () => {
    await openPickerAndSearch('fixed:dashboards:writer', 'role-picker-internal-name');

    expect(screen.getByText('Dashboards:Dashboard writer')).toBeInTheDocument();
    expect(screen.queryByText('Datasources:Data source reader')).not.toBeInTheDocument();
  });

  it('matches on name when displayName is missing', async () => {
    await openPickerAndSearch('support.bundles', 'role-picker-name-only');

    expect(screen.getByText('fixed:support.bundles:writer')).toBeInTheDocument();
    expect(screen.queryByText('Dashboards:Dashboard writer')).not.toBeInTheDocument();
  });
});
