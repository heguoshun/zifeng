export type TenantPermissionAction = 'view' | 'create' | 'edit' | 'delete' | 'export';

export type TenantPermissionActionDef = {
    id: TenantPermissionAction;
    label: string;
};

export const TENANT_PERMISSION_ACTIONS: TenantPermissionActionDef[] = [
    { id: 'view', label: '查看' },
    { id: 'create', label: '新增' },
    { id: 'edit', label: '编辑' },
    { id: 'delete', label: '删除' },
    { id: 'export', label: '导出' },
];

export type TenantPermissionModule = {
    id: string;
    label: string;
    group: string;
    actions: TenantPermissionAction[];
};

export const TENANT_PERMISSION_MODULES: TenantPermissionModule[] = [
    { id: 'workbench-home', label: '设备综合视图', group: '工作台', actions: ['view'] },
    { id: 'workbench-dashboard', label: '设备态势感知', group: '工作台', actions: ['view'] },

    { id: 'device-overview', label: '接入概览', group: '设备接入', actions: ['view'] },
    { id: 'device-product', label: '产品管理', group: '设备接入', actions: ['view', 'create', 'edit', 'delete', 'export'] },
    { id: 'device-mgmt', label: '设备管理', group: '设备接入', actions: ['view', 'create', 'edit', 'delete', 'export'] },
    { id: 'device-group', label: '设备分组', group: '设备接入', actions: ['view', 'create', 'edit', 'delete'] },
    { id: 'device-map', label: '设备地图', group: '设备地图', actions: ['view', 'edit'] },

    { id: 'alarm-info', label: '设备告警信息', group: '消息中心', actions: ['view', 'export'] },
    { id: 'alarm-rule', label: '告警规则配置', group: '消息中心', actions: ['view', 'create', 'edit', 'delete'] },
    { id: 'alarm-level', label: '告警等级管理', group: '消息中心', actions: ['view', 'create', 'edit', 'delete'] },

    { id: 'work-order', label: '工单管理', group: '运维管理', actions: ['view', 'create', 'edit', 'delete', 'export'] },
    { id: 'network-protocol', label: '网络协议', group: '运维管理', actions: ['view', 'create', 'edit', 'delete'] },
    { id: 'network-service', label: '网络服务', group: '运维管理', actions: ['view', 'create', 'edit', 'delete'] },
    { id: 'protocol-mgmt', label: '协议管理', group: '运维管理', actions: ['view', 'create', 'edit', 'delete', 'export'] },
    { id: 'login-log', label: '登录日志', group: '运维管理', actions: ['view', 'export'] },
    { id: 'operation-log', label: '操作日志', group: '运维管理', actions: ['view', 'export'] },

    { id: 'api-mgmt', label: 'API 管理', group: '数据共享', actions: ['view', 'create', 'edit', 'delete'] },
    { id: 'data-subscribe', label: '数据订阅', group: '数据共享', actions: ['view', 'create', 'edit', 'delete'] },

    { id: 'tenant-mgmt', label: '租户管理', group: '系统管理', actions: ['view', 'create', 'edit', 'delete', 'export'] },
    { id: 'user-mgmt', label: '用户管理', group: '系统管理', actions: ['view', 'create', 'edit', 'delete', 'export'] },
    { id: 'role-mgmt', label: '角色管理', group: '系统管理', actions: ['view', 'create', 'edit', 'delete'] },
    { id: 'dept-mgmt', label: '部门管理', group: '系统管理', actions: ['view', 'create', 'edit', 'delete'] },
    { id: 'menu-mgmt', label: '菜单管理', group: '系统管理', actions: ['view', 'create', 'edit', 'delete'] },
];

const LEGACY_GROUP_MODULES: Record<string, string[]> = {
    workbench: ['workbench-home', 'workbench-dashboard'],
    'device-access': ['device-overview', 'device-product', 'device-mgmt', 'device-group', 'device-map'],
    'message-center': ['alarm-info', 'alarm-rule', 'alarm-level'],
    'om-mgmt': ['work-order', 'network-protocol', 'network-service', 'protocol-mgmt', 'login-log', 'operation-log'],
    'data-sharing': ['api-mgmt', 'data-subscribe'],
    'system-mgmt': ['tenant-mgmt', 'user-mgmt', 'role-mgmt', 'dept-mgmt', 'menu-mgmt'],
};

const MODULE_MAP = new Map(TENANT_PERMISSION_MODULES.map((item) => [item.id, item]));

export function buildPermissionId(moduleId: string, action: TenantPermissionAction): string {
    return `${moduleId}:${action}`;
}

export function parsePermissionId(permissionId: string): { moduleId: string; action: TenantPermissionAction } | null {
    const separatorIndex = permissionId.lastIndexOf(':');
    if (separatorIndex <= 0) return null;
    const moduleId = permissionId.slice(0, separatorIndex);
    const action = permissionId.slice(separatorIndex + 1) as TenantPermissionAction;
    const module = MODULE_MAP.get(moduleId);
    if (!module || !module.actions.includes(action)) return null;
    return { moduleId, action };
}

export function flattenPermissionIds(modules: TenantPermissionModule[] = TENANT_PERMISSION_MODULES): string[] {
    return modules.flatMap((module) => module.actions.map((action) => buildPermissionId(module.id, action)));
}

export function groupPermissionModules(
    modules: TenantPermissionModule[] = TENANT_PERMISSION_MODULES,
): { group: string; modules: TenantPermissionModule[] }[] {
    const groups: { group: string; modules: TenantPermissionModule[] }[] = [];
    modules.forEach((module) => {
        const existing = groups.find((item) => item.group === module.group);
        if (existing) {
            existing.modules.push(module);
            return;
        }
        groups.push({ group: module.group, modules: [module] });
    });
    return groups;
}

function migrateLegacyMenuId(menuId: string): string[] {
    const module = MODULE_MAP.get(menuId);
    if (module) {
        return module.actions.map((action) => buildPermissionId(module.id, action));
    }

    const legacyModules = LEGACY_GROUP_MODULES[menuId];
    if (legacyModules) {
        return legacyModules.flatMap((moduleId) => {
            const legacyModule = MODULE_MAP.get(moduleId);
            if (!legacyModule) return [];
            return [buildPermissionId(legacyModule.id, 'view')];
        });
    }

    return [];
}

export type TenantPermissionTreeNode = {
    id: string;
    label: string;
    nodeType: 'group' | 'module' | 'action';
    permissionId?: string;
    children?: TenantPermissionTreeNode[];
};

const ACTION_LABEL_MAP = new Map(TENANT_PERMISSION_ACTIONS.map((item) => [item.id, item.label]));

export function buildTenantPermissionTree(): TenantPermissionTreeNode[] {
    return groupPermissionModules().map(({ group, modules }) => ({
        id: `group:${group}`,
        label: group,
        nodeType: 'group',
        children: modules.map((module) => ({
            id: `module:${module.id}`,
            label: module.label,
            nodeType: 'module',
            children: module.actions.map((action) => ({
                id: buildPermissionId(module.id, action),
                label: ACTION_LABEL_MAP.get(action) ?? action,
                nodeType: 'action',
                permissionId: buildPermissionId(module.id, action),
            })),
        })),
    }));
}

export function collectTreePermissionIds(node: TenantPermissionTreeNode): string[] {
    if (node.permissionId) return [node.permissionId];
    return (node.children ?? []).flatMap(collectTreePermissionIds);
}

export function normalizeAuthorizedPermissionIds(ids?: string[] | null): string[] {
    if (!ids?.length) return [];
    const result = new Set<string>();
    ids.forEach((id) => {
        if (parsePermissionId(id)) {
            result.add(id);
            return;
        }
        migrateLegacyMenuId(id).forEach((permissionId) => result.add(permissionId));
    });
    return Array.from(result);
}

export function resolveTenantPermissionIds(tenant: {
    authorizedPermissionIds?: string[] | null;
    authorizedMenuIds?: string[] | null;
}): string[] {
    return normalizeAuthorizedPermissionIds(
        tenant.authorizedPermissionIds ?? tenant.authorizedMenuIds,
    );
}

export function formatAuthorizedPermissionSummary(ids?: string[] | null): string {
    const normalized = normalizeAuthorizedPermissionIds(ids);
    if (!normalized.length) return '—';

    const actionLabelMap = new Map(TENANT_PERMISSION_ACTIONS.map((item) => [item.id, item.label]));
    const lines: string[] = [];

    TENANT_PERMISSION_MODULES.forEach((module) => {
        const granted = module.actions
            .filter((action) => normalized.includes(buildPermissionId(module.id, action)))
            .map((action) => actionLabelMap.get(action) ?? action);
        if (!granted.length) return;
        lines.push(`${module.label}（${granted.join('、')}）`);
    });

    return lines.length ? lines.join('；') : '—';
}

export const DEFAULT_TENANT_PERMISSION_IDS = [
    buildPermissionId('workbench-home', 'view'),
    buildPermissionId('device-overview', 'view'),
    buildPermissionId('device-product', 'view'),
    buildPermissionId('device-mgmt', 'view'),
];
