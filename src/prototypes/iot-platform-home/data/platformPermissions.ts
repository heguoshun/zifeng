import type { AlarmRuleCategoryScope } from './systemRoles';
import { buildPermissionId, type TenantPermissionAction } from './tenantMenus';
import type { PlatformSessionUser } from './platformSession';

export type PlatformTopTab = '设备接入' | '大表中心' | '告警工单' | '消息中心' | '系统管理';

const TOP_TAB_MODULE_IDS: Record<PlatformTopTab, string[]> = {
    设备接入: [
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
    大表中心: ['data-monitor', 'data-report', 'area-config', 'device-archive'],
    告警工单: ['awo-alarm-info', 'awo-alarm-rule', 'awo-alarm-level', 'work-order'],
    消息中心: ['msg-subscribe', 'push-source-config', 'msg-template', 'history-msg'],
    系统管理: [
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
};

const PAGE_MODULE_ACCESS: Record<string, { moduleId: string; action: TenantPermissionAction }> = {
    home: { moduleId: 'workbench-home', action: 'view' },
    'access-overview': { moduleId: 'device-overview', action: 'view' },
    'product-management': { moduleId: 'device-product', action: 'view' },
    'product-category': { moduleId: 'product-category', action: 'view' },
    'product-create': { moduleId: 'device-product', action: 'create' },
    'product-edit': { moduleId: 'device-product', action: 'edit' },
    'product-view': { moduleId: 'device-product', action: 'view' },
    'model-library': { moduleId: 'model-library', action: 'view' },
    'model-library-create': { moduleId: 'model-library', action: 'create' },
    'device-management': { moduleId: 'device-mgmt', action: 'view' },
    'device-create': { moduleId: 'device-mgmt', action: 'create' },
    'device-edit': { moduleId: 'device-mgmt', action: 'edit' },
    'device-view': { moduleId: 'device-mgmt', action: 'view' },
    'device-group': { moduleId: 'device-group', action: 'view' },
    'device-map': { moduleId: 'device-map', action: 'view' },
    'device-alarm-info': { moduleId: 'awo-alarm-info', action: 'view' },
    'awo-device-alarm-info': { moduleId: 'awo-alarm-info', action: 'view' },
    'alarm-rule-config': { moduleId: 'awo-alarm-rule', action: 'view' },
    'awo-alarm-rule-config': { moduleId: 'awo-alarm-rule', action: 'view' },
    'alarm-level-mgmt': { moduleId: 'awo-alarm-level', action: 'view' },
    'awo-alarm-level-mgmt': { moduleId: 'awo-alarm-level', action: 'view' },
    'work-order-management': { moduleId: 'work-order', action: 'view' },
    'work-order-detail': { moduleId: 'work-order', action: 'view' },
    'work-order-create': { moduleId: 'work-order', action: 'create' },
    'protocol-mgmt': { moduleId: 'protocol-mgmt', action: 'view' },
    'certificate-mgmt': { moduleId: 'certificate-mgmt', action: 'view' },
    'network-service': { moduleId: 'network-service', action: 'view' },
    'network-protocol': { moduleId: 'network-protocol', action: 'view' },
    'network-protocol-create': { moduleId: 'network-protocol', action: 'create' },
    'network-protocol-edit': { moduleId: 'network-protocol', action: 'edit' },
    'login-log': { moduleId: 'login-log', action: 'view' },
    'operation-log': { moduleId: 'operation-log', action: 'view' },
    'remote-upgrade': { moduleId: 'remote-upgrade', action: 'view' },
    'tenant-mgmt': { moduleId: 'tenant-mgmt', action: 'view' },
    'user-mgmt': { moduleId: 'user-mgmt', action: 'view' },
    'role-mgmt': { moduleId: 'role-mgmt', action: 'view' },
    'dept-mgmt': { moduleId: 'dept-mgmt', action: 'view' },
    'position-mgmt': { moduleId: 'position-mgmt', action: 'view' },
    'menu-mgmt': { moduleId: 'menu-mgmt', action: 'view' },
    'dict-mgmt': { moduleId: 'dict-mgmt', action: 'view' },
    'param-mgmt': { moduleId: 'param-mgmt', action: 'view' },
    'notice-announcement': { moduleId: 'notice-announcement', action: 'view' },
    'file-mgmt': { moduleId: 'file-mgmt', action: 'view' },
    'msg-subscribe': { moduleId: 'msg-subscribe', action: 'view' },
    'push-source-config': { moduleId: 'push-source-config', action: 'view' },
    'msg-template': { moduleId: 'msg-template', action: 'view' },
    'history-msg': { moduleId: 'history-msg', action: 'view' },
    'data-monitor': { moduleId: 'data-monitor', action: 'view' },
    'water-usage-analysis': { moduleId: 'data-monitor', action: 'view' },
    'data-report': { moduleId: 'data-report', action: 'view' },
    'area-config': { moduleId: 'area-config', action: 'view' },
    'device-archive': { moduleId: 'device-archive', action: 'view' },
};

export const SIDEBAR_ITEM_MODULE_IDS: Record<string, string> = {
    home: 'workbench-home',
    'product-mgmt': 'device-product',
    'device-mgmt': 'device-mgmt',
    'device-group': 'device-group',
    'device-map': 'device-map',
    'remote-upgrade': 'remote-upgrade',
    'network-protocol': 'network-protocol',
    'network-service': 'network-service',
    'protocol-mgmt': 'protocol-mgmt',
    'certificate-mgmt': 'certificate-mgmt',
    'awo-device-alarm-info': 'awo-alarm-info',
    'awo-alarm-rule-config': 'awo-alarm-rule',
    'awo-alarm-level-mgmt': 'awo-alarm-level',
    'awo-work-order-management': 'work-order',
    'msg-subscribe': 'msg-subscribe',
    'push-source-config': 'push-source-config',
    'msg-template': 'msg-template',
    'history-msg': 'history-msg',
    'data-monitor': 'data-monitor',
    'data-report': 'data-report',
    'area-config': 'area-config',
    'device-archive': 'device-archive',
    'tenant-mgmt': 'tenant-mgmt',
    'user-mgmt': 'user-mgmt',
    'role-mgmt': 'role-mgmt',
    'dept-mgmt': 'dept-mgmt',
    'position-mgmt': 'position-mgmt',
    'menu-mgmt': 'menu-mgmt',
    'dict-mgmt': 'dict-mgmt',
    'param-mgmt': 'param-mgmt',
    'notice-announcement': 'notice-announcement',
    'file-mgmt': 'file-mgmt',
    'login-log': 'login-log',
    'operation-log': 'operation-log',
};

const DEFAULT_LANDING_PAGES = [
    'home',
    'device-management',
    'product-management',
    'data-monitor',
    'awo-device-alarm-info',
    'msg-subscribe',
    'tenant-mgmt',
] as const;

export function hasPermission(
    user: PlatformSessionUser,
    moduleId: string,
    action: TenantPermissionAction = 'view',
): boolean {
    if (user.isTenantAdmin) {
        return true;
    }
    const permissionId = buildPermissionId(moduleId, action);
    if (user.permissionIds?.length) {
        return user.permissionIds.includes(permissionId);
    }
    return user.isSuperAdmin;
}

export function canViewModule(user: PlatformSessionUser, moduleId: string): boolean {
    return hasPermission(user, moduleId, 'view');
}

export function canAccessPage(user: PlatformSessionUser, pageId: string): boolean {
    const access = PAGE_MODULE_ACCESS[pageId];
    if (!access) {
        return user.isTenantAdmin || Boolean(user.isSuperAdmin && !user.permissionIds?.length);
    }
    return hasPermission(user, access.moduleId, access.action);
}

export function canAccessTopTab(user: PlatformSessionUser, tab: PlatformTopTab): boolean {
    const moduleIds = TOP_TAB_MODULE_IDS[tab];
    return moduleIds.some((moduleId) => canViewModule(user, moduleId));
}

export function getAccessibleTopTabs(user: PlatformSessionUser): PlatformTopTab[] {
    return (Object.keys(TOP_TAB_MODULE_IDS) as PlatformTopTab[]).filter((tab) => canAccessTopTab(user, tab));
}

export function getFirstAccessiblePage(user: PlatformSessionUser, pageIds: string[]): string | null {
    for (const pageId of DEFAULT_LANDING_PAGES) {
        if (pageIds.includes(pageId) && canAccessPage(user, pageId)) {
            return pageId;
        }
    }
    return pageIds.find((pageId) => canAccessPage(user, pageId)) ?? null;
}

export function getDefaultPageForTopTab(user: PlatformSessionUser, tab: PlatformTopTab): string | null {
    const candidates: Record<PlatformTopTab, string[]> = {
        设备接入: ['home', 'device-management', 'product-management', 'device-group', 'device-map'],
        大表中心: ['data-monitor', 'data-report', 'area-config', 'device-archive'],
        告警工单: ['awo-device-alarm-info', 'awo-alarm-rule-config', 'awo-alarm-level-mgmt', 'work-order-management'],
        消息中心: ['msg-subscribe', 'push-source-config', 'msg-template', 'history-msg'],
        系统管理: ['tenant-mgmt', 'user-mgmt', 'role-mgmt', 'login-log', 'operation-log'],
    };
    return candidates[tab].find((pageId) => canAccessPage(user, pageId)) ?? null;
}

export function canManageModelLibraryByPermission(user: PlatformSessionUser): boolean {
    return hasPermission(user, 'model-library', 'create')
        || hasPermission(user, 'model-library', 'edit');
}

export function filterSidebarItems<T extends { id: string }>(
    user: PlatformSessionUser,
    items: T[],
): T[] {
    return items.filter((item) => {
        const moduleId = SIDEBAR_ITEM_MODULE_IDS[item.id] ?? item.id;
        return canViewModule(user, moduleId);
    });
}

export function getAlarmRuleCategoryScopes(user: PlatformSessionUser): AlarmRuleCategoryScope[] | null {
    if (user.isTenantAdmin) {
        return null;
    }
    return user.alarmRuleCategoryScopes ?? null;
}
