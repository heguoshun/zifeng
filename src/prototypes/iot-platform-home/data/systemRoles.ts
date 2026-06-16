import { buildPermissionId, normalizeAuthorizedPermissionIds } from './tenantMenus';

export type SystemRoleRecord = {
    id: string;
    tenantId: string;
    name: string;
    roleCode: string;
    createdAt: string;
    isTenantAdmin?: boolean;
    authorizedPermissionIds?: string[];
};

export function resolveRolePermissionIds(role: {
    authorizedPermissionIds?: string[] | null;
}): string[] {
    return normalizeAuthorizedPermissionIds(role.authorizedPermissionIds);
}

export function getRolesByTenant(roles: SystemRoleRecord[], tenantId: string): SystemRoleRecord[] {
    if (!tenantId || tenantId === 'all') return [];
    return roles.filter((item) => item.tenantId === tenantId);
}

export function getRoleLabel(roles: SystemRoleRecord[], roleId: string): string {
    return roles.find((item) => item.id === roleId)?.name ?? '—';
}

export function isRoleBelongsToTenant(
    roles: SystemRoleRecord[],
    roleId: string,
    tenantId: string,
): boolean {
    const role = roles.find((item) => item.id === roleId);
    return Boolean(role && role.tenantId === tenantId);
}

export function createInitialRoles(): SystemRoleRecord[] {
    return [
        { id: 'role-jiahuan-admin', tenantId: 'tenant-jiahuan', name: '企业管理员', roleCode: 'R29p3', createdAt: '2024-09-18 10:30:00', isTenantAdmin: true },
        {
            id: 'role-jiahuan-iot',
            tenantId: 'tenant-jiahuan',
            name: '物联网角色',
            roleCode: 'R29p1',
            createdAt: '2025-06-24 14:20:10',
            authorizedPermissionIds: [
                buildPermissionId('device-overview', 'view'),
                buildPermissionId('device-product', 'view'),
                buildPermissionId('device-product', 'edit'),
                buildPermissionId('device-mgmt', 'view'),
                buildPermissionId('device-mgmt', 'edit'),
            ],
        },
        { id: 'role-jiahuan-ops', tenantId: 'tenant-jiahuan', name: '运维人员', roleCode: 'R29p2', createdAt: '2025-06-06 09:15:33' },
        { id: 'role-jiahuan-auditor', tenantId: 'tenant-jiahuan', name: '审计员', roleCode: 'R29p4', createdAt: '2025-08-01 09:00:00' },
        { id: 'role-nanjing-admin', tenantId: 'tenant-nanjing', name: '企业管理员', roleCode: 'R30a1', createdAt: '2025-07-02 10:00:00', isTenantAdmin: true },
        {
            id: 'role-nanjing-iot',
            tenantId: 'tenant-nanjing',
            name: '物联网角色',
            roleCode: 'R30a2',
            createdAt: '2025-07-02 10:05:00',
            authorizedPermissionIds: [
                buildPermissionId('device-overview', 'view'),
                buildPermissionId('device-mgmt', 'view'),
                buildPermissionId('alarm-info', 'view'),
            ],
        },
        { id: 'role-nanjing-device', tenantId: 'tenant-nanjing', name: '设备管理员', roleCode: 'R30a3', createdAt: '2025-07-08 15:20:00' },
        { id: 'role-yuncheng-admin', tenantId: 'tenant-root-1', name: '企业管理员', roleCode: 'R31b1', createdAt: '2025-07-10 08:30:00', isTenantAdmin: true },
        { id: 'role-yuncheng-iot', tenantId: 'tenant-root-1', name: '物联网角色', roleCode: 'R31b2', createdAt: '2025-07-10 08:35:00' },
        { id: 'role-yuncheng-tenant-admin', tenantId: 'tenant-root-1', name: '租户管理员', roleCode: 'R31b3', createdAt: '2025-07-10 08:40:00', isTenantAdmin: true },
        { id: 'role-suzhou-admin', tenantId: 'tenant-suzhou', name: '企业管理员', roleCode: 'R32c1', createdAt: '2025-07-03 11:00:00', isTenantAdmin: true },
        { id: 'role-suzhou-iot', tenantId: 'tenant-suzhou', name: '物联网角色', roleCode: 'R32c2', createdAt: '2025-07-03 11:05:00' },
        { id: 'role-wuxi-admin', tenantId: 'tenant-wuxi', name: '企业管理员', roleCode: 'R33d1', createdAt: '2025-07-03 14:10:00', isTenantAdmin: true },
        { id: 'role-wuxi-monitor', tenantId: 'tenant-wuxi', name: '监控值班员', roleCode: 'R33d2', createdAt: '2025-07-03 14:15:00' },
    ];
}

let roleCodeCounter = 3400;

export function generateRoleCode(): string {
    roleCodeCounter += 1;
    const prefix = 'R';
    const suffix = Math.floor(Math.random() * 900 + 100);
    return `${prefix}${roleCodeCounter}${String.fromCharCode(97 + (roleCodeCounter % 26))}${suffix}`;
}

export function generateRoleId(): string {
    return `role-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

export function formatRoleNow(): string {
    const now = new Date();
    const pad = (value: number) => String(value).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} `
        + `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

/** @deprecated 使用 createInitialRoles() 替代，仅保留用于兼容旧引用 */
export const SYSTEM_ROLES: SystemRoleRecord[] = createInitialRoles();
