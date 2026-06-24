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
    subgroup?: string;
    actions: TenantPermissionAction[];
};

/** 与顶部导航、侧边栏目录一致的可授权模块 */
export const TENANT_PERMISSION_MODULES: TenantPermissionModule[] = [
    { id: 'workbench-home', label: '设备综合视图', group: '设备接入', subgroup: '工作台', actions: ['view'] },
    { id: 'device-overview', label: '接入概览', group: '设备接入', subgroup: '工作台', actions: ['view'] },

    { id: 'device-product', label: '产品管理', group: '设备接入', subgroup: '产品开发', actions: ['view', 'create', 'edit', 'delete', 'export'] },
    { id: 'model-library', label: '物模型库', group: '设备接入', subgroup: '产品开发', actions: ['view', 'create', 'edit', 'delete'] },
    { id: 'product-category', label: '产品分类', group: '设备接入', subgroup: '产品开发', actions: ['view', 'create', 'edit', 'delete'] },

    { id: 'device-mgmt', label: '设备管理', group: '设备接入', subgroup: '设备管理', actions: ['view', 'create', 'edit', 'delete', 'export'] },
    { id: 'device-group', label: '设备分组', group: '设备接入', subgroup: '设备管理', actions: ['view', 'create', 'edit', 'delete'] },

    { id: 'device-map', label: '设备地图', group: '设备接入', subgroup: '设备地图', actions: ['view', 'edit'] },

    { id: 'remote-upgrade', label: '远程升级', group: '设备接入', subgroup: '设备运维', actions: ['view', 'create', 'edit', 'delete'] },
    { id: 'network-protocol', label: '网络协议', group: '设备接入', subgroup: '设备运维', actions: ['view', 'create', 'edit', 'delete'] },
    { id: 'network-service', label: '网络服务', group: '设备接入', subgroup: '设备运维', actions: ['view', 'create', 'edit', 'delete'] },
    { id: 'protocol-mgmt', label: '协议管理', group: '设备接入', subgroup: '设备运维', actions: ['view', 'create', 'edit', 'delete', 'export'] },
    { id: 'certificate-mgmt', label: '证书管理', group: '设备接入', subgroup: '设备运维', actions: ['view', 'create', 'edit', 'delete'] },

    { id: 'data-monitor', label: '数据监测', group: '大表中心', actions: ['view', 'export'] },
    { id: 'data-report', label: '数据报表', group: '大表中心', actions: ['view', 'export'] },
    { id: 'area-config', label: '区域配置', group: '大表中心', actions: ['view', 'create', 'edit', 'delete'] },
    { id: 'device-archive', label: '大表档案', group: '大表中心', actions: ['view', 'export'] },

    { id: 'awo-alarm-info', label: '设备告警信息', group: '告警工单', subgroup: '设备告警', actions: ['view', 'export'] },
    { id: 'awo-alarm-rule', label: '告警规则配置', group: '告警工单', subgroup: '设备告警', actions: ['view', 'create', 'edit', 'delete'] },
    { id: 'awo-alarm-level', label: '告警等级管理', group: '告警工单', subgroup: '设备告警', actions: ['view', 'create', 'edit', 'delete'] },
    { id: 'work-order', label: '工单管理', group: '告警工单', subgroup: '工单管理', actions: ['view', 'create', 'edit', 'delete', 'export'] },

    { id: 'msg-subscribe', label: '消息订阅', group: '消息中心', subgroup: '消息配置', actions: ['view', 'create', 'edit', 'delete'] },
    { id: 'push-source-config', label: '推送源配置', group: '消息中心', subgroup: '消息配置', actions: ['view', 'create', 'edit', 'delete'] },
    { id: 'msg-template', label: '消息模板', group: '消息中心', subgroup: '消息配置', actions: ['view', 'create', 'edit', 'delete'] },
    { id: 'history-msg', label: '历史消息', group: '消息中心', subgroup: '历史消息', actions: ['view', 'export'] },

    { id: 'tenant-mgmt', label: '租户管理', group: '系统管理', subgroup: '组织管理', actions: ['view', 'create', 'edit', 'delete', 'export'] },
    { id: 'user-mgmt', label: '用户管理', group: '系统管理', subgroup: '组织管理', actions: ['view', 'create', 'edit', 'delete', 'export'] },
    { id: 'role-mgmt', label: '角色管理', group: '系统管理', subgroup: '组织管理', actions: ['view', 'create', 'edit', 'delete'] },
    { id: 'dept-mgmt', label: '部门管理', group: '系统管理', subgroup: '组织管理', actions: ['view', 'create', 'edit', 'delete'] },
    { id: 'position-mgmt', label: '岗位管理', group: '系统管理', subgroup: '组织管理', actions: ['view', 'create', 'edit', 'delete'] },

    { id: 'menu-mgmt', label: '菜单管理', group: '系统管理', subgroup: '系统配置', actions: ['view', 'create', 'edit', 'delete'] },
    { id: 'dict-mgmt', label: '字典管理', group: '系统管理', subgroup: '系统配置', actions: ['view', 'create', 'edit', 'delete'] },
    { id: 'param-mgmt', label: '参数管理', group: '系统管理', subgroup: '系统配置', actions: ['view', 'create', 'edit', 'delete'] },
    { id: 'notice-announcement', label: '通知公告', group: '系统管理', subgroup: '系统配置', actions: ['view', 'create', 'edit', 'delete'] },
    { id: 'file-mgmt', label: '文件管理', group: '系统管理', subgroup: '系统配置', actions: ['view', 'create', 'edit', 'delete'] },

    { id: 'login-log', label: '登录日志', group: '系统管理', subgroup: '日志管理', actions: ['view', 'export'] },
    { id: 'operation-log', label: '操作日志', group: '系统管理', subgroup: '日志管理', actions: ['view', 'export'] },
];

const LEGACY_GROUP_MODULES: Record<string, string[]> = {
    workbench: ['workbench-home', 'device-overview'],
    'device-access': [
        'workbench-home',
        'device-overview',
        'device-product',
        'model-library',
        'product-category',
        'device-mgmt',
        'device-group',
        'device-map',
        'remote-upgrade',
        'network-protocol',
        'network-service',
        'protocol-mgmt',
        'certificate-mgmt',
    ],
    'large-meter': ['data-monitor', 'data-report', 'area-config', 'device-archive'],
    'alarm-work-order': ['awo-alarm-info', 'awo-alarm-rule', 'awo-alarm-level', 'work-order'],
    'message-center': ['msg-subscribe', 'push-source-config', 'msg-template', 'history-msg'],
    'om-mgmt': ['work-order', 'network-protocol', 'network-service', 'protocol-mgmt', 'certificate-mgmt', 'remote-upgrade'],
    'data-sharing': [],
    'system-mgmt': [
        'tenant-mgmt',
        'user-mgmt',
        'role-mgmt',
        'dept-mgmt',
        'position-mgmt',
        'menu-mgmt',
        'dict-mgmt',
        'param-mgmt',
        'notice-announcement',
        'file-mgmt',
        'login-log',
        'operation-log',
    ],
    // 兼容旧模块 id
    'workbench-dashboard': ['workbench-home'],
    'alarm-info': ['awo-alarm-info'],
    'api-mgmt': [],
    'data-subscribe': [],
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
    nodeType: 'group' | 'subgroup' | 'module' | 'action';
    permissionId?: string;
    moduleActions?: Array<{ id: string; label: string; permissionId: string }>;
    children?: TenantPermissionTreeNode[];
};

const ACTION_LABEL_MAP = new Map(TENANT_PERMISSION_ACTIONS.map((item) => [item.id, item.label]));

function buildModuleTreeNode(module: TenantPermissionModule): TenantPermissionTreeNode {
    return {
        id: `module:${module.id}`,
        label: module.label,
        nodeType: 'module',
        moduleActions: module.actions.map((action) => ({
            id: buildPermissionId(module.id, action),
            label: ACTION_LABEL_MAP.get(action) ?? action,
            permissionId: buildPermissionId(module.id, action),
        })),
    };
}

export function buildTenantPermissionTree(): TenantPermissionTreeNode[] {
    return groupPermissionModules().map(({ group, modules }) => {
        const subgroupNames = [...new Set(
            modules.map((module) => module.subgroup).filter(Boolean),
        )] as string[];
        const directModules = modules.filter((module) => !module.subgroup);
        const subgroupNodes: TenantPermissionTreeNode[] = subgroupNames.map((subgroup) => ({
            id: `subgroup:${group}:${subgroup}`,
            label: subgroup,
            nodeType: 'subgroup',
            children: modules
                .filter((module) => module.subgroup === subgroup)
                .map(buildModuleTreeNode),
        }));

        return {
            id: `group:${group}`,
            label: group,
            nodeType: 'group',
            children: [
                ...directModules.map(buildModuleTreeNode),
                ...subgroupNodes,
            ],
        };
    });
}

export function collectTreePermissionIds(node: TenantPermissionTreeNode): string[] {
    if (node.permissionId) return [node.permissionId];
    if (node.moduleActions?.length) {
        return node.moduleActions.map((action) => action.permissionId);
    }
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
