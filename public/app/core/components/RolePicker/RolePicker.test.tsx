import { render, screen, userEvent } from 'test/test-utils';

import { type Role } from 'app/types/accessControl';

import { RolePicker } from './RolePicker';

const reportsWriter: Role = {
  uid: 'reports-writer',
  name: 'fixed:reports:writer',
  displayName: 'Weekly Digest Editor',
  description: '',
  group: 'reports',
  created: '',
  updated: '',
  version: 1,
  filteredDisplayName: '',
  delegatable: true,
};

const datasourcesAdmin: Role = {
  uid: 'datasources-admin',
  name: 'fixed:datasources:admin',
  displayName: 'Datasources Admin',
  description: '',
  group: 'datasources',
  created: '',
  updated: '',
  version: 1,
  filteredDisplayName: '',
  delegatable: true,
};

// displayName is absent at runtime for roles that were never given one.
const auditViewer = {
  uid: 'audit-viewer',
  name: 'custom:audit:viewer',
  description: '',
  group: 'audit',
  created: '',
  updated: '',
  version: 1,
  filteredDisplayName: '',
  delegatable: true,
} as Role;

const roleOptions = [reportsWriter, datasourcesAdmin, auditViewer];

async function searchRoles(query: string) {
  const user = userEvent.setup();
  render(<RolePicker appliedRoles={[]} roleOptions={roleOptions} onRolesChange={() => {}} pickerId={query} />);
  await user.click(screen.getByText('No roles assigned'));
  await user.type(screen.getByTestId('role-picker-input'), query);
}

describe('RolePicker search', () => {
  it('matches a display-name substring regardless of case', async () => {
    await searchRoles('DiGeSt');

    expect(screen.getByText('Weekly Digest Editor')).toBeInTheDocument();
    expect(screen.queryByText('Datasources Admin')).not.toBeInTheDocument();
    expect(screen.queryByText('custom:audit:viewer')).not.toBeInTheDocument();
  });

  it('still matches the internal name regardless of case', async () => {
    await searchRoles('DATASOURCES:ADMIN');

    expect(screen.getByText('Datasources Admin')).toBeInTheDocument();
    expect(screen.queryByText('Weekly Digest Editor')).not.toBeInTheDocument();
    expect(screen.queryByText('custom:audit:viewer')).not.toBeInTheDocument();
  });

  it('matches on name when the role has no displayName', async () => {
    await searchRoles('AuDiT');

    expect(screen.getByText('custom:audit:viewer')).toBeInTheDocument();
    expect(screen.queryByText('Weekly Digest Editor')).not.toBeInTheDocument();
    expect(screen.queryByText('Datasources Admin')).not.toBeInTheDocument();
  });
});
