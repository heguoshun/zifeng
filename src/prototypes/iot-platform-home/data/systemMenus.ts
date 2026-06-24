import type { TreeSelectNode } from './orgHierarchy';

export type SystemMenuType = 'root' | 'submenu' | 'button';

export type SystemMenuOpenType = 'internal' | 'external';

export type SystemMenuRecord = {
    id: string;
    parentId: string | null;
    name: string;
    path: string;
    component: string;
    redirect?: string;
    icon?: string;
    sort: number;
    menuType: SystemMenuType;
    isRoute: boolean;
    hidden: boolean;
    keepAlive: boolean;
    alwaysShow: boolean;
    openType: SystemMenuOpenType;
};

export const MENU_TYPE_OPTIONS: { label: string; value: SystemMenuType }[] = [
    { label: '一级菜单', value: 'root' },
    { label: '子菜单', value: 'submenu' },
    { label: '按钮/权限', value: 'button' },
];

export const OPEN_TYPE_OPTIONS: { label: string; value: SystemMenuOpenType }[] = [
    { label: '内部', value: 'internal' },
    { label: '外部', value: 'external' },
];

function seed(id: string, data: Omit<SystemMenuRecord, 'id'>): SystemMenuRecord {
    return { id, ...data };
}

function buildInitialMenus(): SystemMenuRecord[] {
    const menus: SystemMenuRecord[] = [
        seed('menu-workbench', {
            parentId: null,
            name: '工作台',
            path: '/workbench',
            component: 'layouts/RouteView',
            redirect: '/workbench/home',
            icon: 'home',
            sort: 1,
            menuType: 'root',
            isRoute: true,
            hidden: false,
            keepAlive: false,
            alwaysShow: true,
            openType: 'internal',
        }),
        seed('menu-workbench-home', {
            parentId: 'menu-workbench',
            name: '设备综合视图',
            path: '/workbench/home',
            component: 'workbench/Home',
            icon: 'dashboard',
            sort: 1,
            menuType: 'submenu',
            isRoute: true,
            hidden: false,
            keepAlive: true,
            alwaysShow: false,
            openType: 'internal',
        }),
        seed('menu-workbench-dashboard', {
            parentId: 'menu-workbench',
            name: '设备态势感知',
            path: '/workbench/dashboard',
            component: 'workbench/Dashboard',
            icon: 'radar-chart',
            sort: 2,
            menuType: 'submenu',
            isRoute: true,
            hidden: false,
            keepAlive: true,
            alwaysShow: false,
            openType: 'internal',
        }),

        seed('menu-device-access', {
            parentId: null,
            name: '设备接入',
            path: '/device-access',
            component: 'layouts/RouteView',
            redirect: '/device-access/overview',
            icon: 'hdd',
            sort: 2,
            menuType: 'root',
            isRoute: true,
            hidden: false,
            keepAlive: false,
            alwaysShow: true,
            openType: 'internal',
        }),
        seed('menu-access-overview', {
            parentId: 'menu-device-access',
            name: '接入概览',
            path: '/device-access/overview',
            component: 'deviceAccess/AccessOverview',
            icon: 'bar-chart',
            sort: 1,
            menuType: 'submenu',
            isRoute: true,
            hidden: false,
            keepAlive: true,
            alwaysShow: false,
            openType: 'internal',
        }),
        seed('menu-product-mgmt', {
            parentId: 'menu-device-access',
            name: '产品管理',
            path: '/device-access/product',
            component: 'deviceAccess/ProductManagement',
            icon: 'appstore',
            sort: 2,
            menuType: 'submenu',
            isRoute: true,
            hidden: false,
            keepAlive: true,
            alwaysShow: false,
            openType: 'internal',
        }),
        seed('menu-model-lib', {
            parentId: 'menu-device-access',
            name: '物模型库',
            path: '/device-access/model-lib',
            component: 'deviceAccess/ModelLib',
            icon: 'database',
            sort: 3,
            menuType: 'submenu',
            isRoute: true,
            hidden: false,
            keepAlive: true,
            alwaysShow: false,
            openType: 'internal',
        }),
        seed('menu-device-mgmt', {
            parentId: 'menu-device-access',
            name: '设备管理',
            path: '/device-access/device',
            component: 'deviceAccess/DeviceManagement',
            icon: 'cluster',
            sort: 4,
            menuType: 'submenu',
            isRoute: true,
            hidden: false,
            keepAlive: true,
            alwaysShow: false,
            openType: 'internal',
        }),
        seed('menu-device-group', {
            parentId: 'menu-device-access',
            name: '设备分组',
            path: '/device-access/device-group',
            component: 'deviceAccess/DeviceGroup',
            icon: 'team',
            sort: 5,
            menuType: 'submenu',
            isRoute: true,
            hidden: false,
            keepAlive: true,
            alwaysShow: false,
            openType: 'internal',
        }),
        seed('menu-device-map', {
            parentId: 'menu-device-access',
            name: '设备地图',
            path: '/device-access/device-map',
            component: 'deviceAccess/DeviceMap',
            icon: 'environment',
            sort: 6,
            menuType: 'submenu',
            isRoute: true,
            hidden: false,
            keepAlive: true,
            alwaysShow: false,
            openType: 'internal',
        }),
        seed('menu-device-om', {
            parentId: 'menu-device-access',
            name: '设备运维',
            path: '/device-access/device-om',
            component: 'layouts/RouteView',
            redirect: '/device-access/device-om/ota',
            icon: 'tool',
            sort: 8,
            menuType: 'submenu',
            isRoute: true,
            hidden: false,
            keepAlive: false,
            alwaysShow: true,
            openType: 'internal',
        }),
        seed('menu-ota', {
            parentId: 'menu-device-om',
            name: '远程升级',
            path: '/device-access/device-om/ota',
            component: 'deviceAccess/OtaUpgrade',
            icon: 'cloud-upload',
            sort: 1,
            menuType: 'submenu',
            isRoute: true,
            hidden: false,
            keepAlive: true,
            alwaysShow: false,
            openType: 'internal',
        }),
        seed('menu-network-protocol', {
            parentId: 'menu-device-om',
            name: '网络协议',
            path: '/device-access/device-om/network-protocol',
            component: 'deviceAccess/NetworkProtocol',
            icon: 'global',
            sort: 2,
            menuType: 'submenu',
            isRoute: true,
            hidden: false,
            keepAlive: true,
            alwaysShow: false,
            openType: 'internal',
        }),
        seed('menu-network-service', {
            parentId: 'menu-device-om',
            name: '网络服务',
            path: '/device-access/device-om/network-service',
            component: 'deviceAccess/NetworkService',
            icon: 'cloud-server',
            sort: 3,
            menuType: 'submenu',
            isRoute: true,
            hidden: false,
            keepAlive: true,
            alwaysShow: false,
            openType: 'internal',
        }),
        seed('menu-protocol-mgmt', {
            parentId: 'menu-device-om',
            name: '协议管理',
            path: '/device-access/device-om/protocol',
            component: 'deviceAccess/ProtocolMgmt',
            icon: 'code',
            sort: 4,
            menuType: 'submenu',
            isRoute: true,
            hidden: false,
            keepAlive: true,
            alwaysShow: false,
            openType: 'internal',
        }),
        seed('menu-certificate-mgmt', {
            parentId: 'menu-device-om',
            name: '证书管理',
            path: '/device-access/device-om/certificate',
            component: 'deviceAccess/CertificateMgmt',
            icon: 'safety-certificate',
            sort: 5,
            menuType: 'submenu',
            isRoute: true,
            hidden: false,
            keepAlive: true,
            alwaysShow: false,
            openType: 'internal',
        }),
        seed('menu-large-meter', {
            parentId: null,
            name: '大表中心',
            path: '/large-meter',
            component: 'layouts/RouteView',
            redirect: '/large-meter/data-monitor',
            icon: 'dashboard',
            sort: 3,
            menuType: 'root',
            isRoute: true,
            hidden: false,
            keepAlive: false,
            alwaysShow: true,
            openType: 'internal',
        }),
        seed('menu-data-monitor', {
            parentId: 'menu-large-meter',
            name: '数据监测',
            path: '/large-meter/data-monitor',
            component: 'largeMeter/DataMonitor',
            icon: 'bar-chart',
            sort: 1,
            menuType: 'submenu',
            isRoute: true,
            hidden: false,
            keepAlive: true,
            alwaysShow: false,
            openType: 'internal',
        }),
        seed('menu-data-report', {
            parentId: 'menu-large-meter',
            name: '数据报表',
            path: '/large-meter/data-report',
            component: 'largeMeter/DataReport',
            icon: 'file',
            sort: 2,
            menuType: 'submenu',
            isRoute: true,
            hidden: false,
            keepAlive: true,
            alwaysShow: false,
            openType: 'internal',
        }),
        seed('menu-area-config', {
            parentId: 'menu-large-meter',
            name: '区域配置',
            path: '/large-meter/area-config',
            component: 'largeMeter/AreaConfig',
            icon: 'apartment',
            sort: 3,
            menuType: 'submenu',
            isRoute: true,
            hidden: false,
            keepAlive: true,
            alwaysShow: false,
            openType: 'internal',
        }),
        seed('menu-alarm-work-order', {
            parentId: null,
            name: '告警工单',
            path: '/alarm-work-order',
            component: 'layouts/RouteView',
            redirect: '/alarm-work-order/alarm-info',
            icon: 'alert',
            sort: 4,
            menuType: 'root',
            isRoute: true,
            hidden: false,
            keepAlive: false,
            alwaysShow: true,
            openType: 'internal',
        }),
        seed('menu-awo-alarm-info', {
            parentId: 'menu-alarm-work-order',
            name: '设备告警信息',
            path: '/alarm-work-order/alarm-info',
            component: 'alarmWorkOrder/AlarmInfo',
            icon: 'alert',
            sort: 1,
            menuType: 'submenu',
            isRoute: true,
            hidden: false,
            keepAlive: true,
            alwaysShow: false,
            openType: 'internal',
        }),
        seed('menu-awo-alarm-rule', {
            parentId: 'menu-alarm-work-order',
            name: '告警规则配置',
            path: '/alarm-work-order/alarm-rule',
            component: 'alarmWorkOrder/AlarmRule',
            icon: 'setting',
            sort: 2,
            menuType: 'submenu',
            isRoute: true,
            hidden: false,
            keepAlive: true,
            alwaysShow: false,
            openType: 'internal',
        }),
        seed('menu-awo-alarm-level', {
            parentId: 'menu-alarm-work-order',
            name: '告警等级管理',
            path: '/alarm-work-order/alarm-level',
            component: 'alarmWorkOrder/AlarmLevel',
            icon: 'flag',
            sort: 3,
            menuType: 'submenu',
            isRoute: true,
            hidden: false,
            keepAlive: true,
            alwaysShow: false,
            openType: 'internal',
        }),
        seed('menu-message-center', {
            parentId: null,
            name: '消息中心',
            path: '/message-center',
            component: 'layouts/RouteView',
            redirect: '/message-center/subscribe',
            icon: 'notification',
            sort: 5,
            menuType: 'root',
            isRoute: true,
            hidden: false,
            keepAlive: false,
            alwaysShow: true,
            openType: 'internal',
        }),
        seed('menu-msg-subscribe', {
            parentId: 'menu-message-center',
            name: '消息订阅',
            path: '/message-center/subscribe',
            component: 'message/Subscribe',
            icon: 'mail',
            sort: 1,
            menuType: 'submenu',
            isRoute: true,
            hidden: false,
            keepAlive: true,
            alwaysShow: false,
            openType: 'internal',
        }),
        seed('menu-push-source', {
            parentId: 'menu-message-center',
            name: '推送源配置',
            path: '/message-center/push-source',
            component: 'message/PushSource',
            icon: 'api',
            sort: 2,
            menuType: 'submenu',
            isRoute: true,
            hidden: false,
            keepAlive: true,
            alwaysShow: false,
            openType: 'internal',
        }),
        seed('menu-msg-template', {
            parentId: 'menu-message-center',
            name: '消息模板',
            path: '/message-center/template',
            component: 'message/Template',
            icon: 'file',
            sort: 3,
            menuType: 'submenu',
            isRoute: true,
            hidden: false,
            keepAlive: true,
            alwaysShow: false,
            openType: 'internal',
        }),
        seed('menu-history-msg', {
            parentId: 'menu-message-center',
            name: '历史消息',
            path: '/message-center/history',
            component: 'message/History',
            icon: 'history',
            sort: 4,
            menuType: 'submenu',
            isRoute: true,
            hidden: false,
            keepAlive: true,
            alwaysShow: false,
            openType: 'internal',
        }),

        seed('menu-om-mgmt', {
            parentId: null,
            name: '运维管理',
            path: '/om-mgmt',
            component: 'layouts/RouteView',
            redirect: '/om-mgmt/work-order',
            icon: 'tool',
            sort: 6,
            menuType: 'root',
            isRoute: true,
            hidden: false,
            keepAlive: false,
            alwaysShow: true,
            openType: 'internal',
        }),
        seed('menu-work-order', {
            parentId: 'menu-om-mgmt',
            name: '工单管理',
            path: '/om-mgmt/work-order',
            component: 'om/WorkOrder',
            icon: 'solution',
            sort: 1,
            menuType: 'submenu',
            isRoute: true,
            hidden: false,
            keepAlive: true,
            alwaysShow: false,
            openType: 'internal',
        }),
        seed('menu-system-alarm', {
            parentId: 'menu-om-mgmt',
            name: '系统告警信息',
            path: '/om-mgmt/system-alarm',
            component: 'om/SystemAlarm',
            icon: 'warning',
            sort: 2,
            menuType: 'submenu',
            isRoute: true,
            hidden: false,
            keepAlive: true,
            alwaysShow: false,
            openType: 'internal',
        }),
        seed('menu-platform-status', {
            parentId: 'menu-om-mgmt',
            name: '平台状态监控',
            path: '/om-mgmt/platform-status',
            component: 'om/PlatformStatus',
            icon: 'monitor',
            sort: 3,
            menuType: 'submenu',
            isRoute: true,
            hidden: false,
            keepAlive: true,
            alwaysShow: false,
            openType: 'internal',
        }),

        seed('menu-data-sharing', {
            parentId: null,
            name: '数据共享',
            path: '/data-sharing',
            component: 'layouts/RouteView',
            redirect: '/data-sharing/api',
            icon: 'share-alt',
            sort: 7,
            menuType: 'root',
            isRoute: true,
            hidden: false,
            keepAlive: false,
            alwaysShow: true,
            openType: 'internal',
        }),
        seed('menu-api-mgmt', {
            parentId: 'menu-data-sharing',
            name: 'API 管理',
            path: '/data-sharing/api',
            component: 'dataSharing/ApiMgmt',
            icon: 'api',
            sort: 1,
            menuType: 'submenu',
            isRoute: true,
            hidden: false,
            keepAlive: true,
            alwaysShow: false,
            openType: 'internal',
        }),
        seed('menu-data-subscribe', {
            parentId: 'menu-data-sharing',
            name: '数据订阅',
            path: '/data-sharing/subscribe',
            component: 'dataSharing/DataSubscribe',
            icon: 'cloud-sync',
            sort: 2,
            menuType: 'submenu',
            isRoute: true,
            hidden: false,
            keepAlive: true,
            alwaysShow: false,
            openType: 'internal',
        }),

        seed('menu-system-mgmt', {
            parentId: null,
            name: '系统管理',
            path: '/system-mgmt',
            component: 'layouts/RouteView',
            redirect: '/system-mgmt/tenant',
            icon: 'setting',
            sort: 8,
            menuType: 'root',
            isRoute: true,
            hidden: false,
            keepAlive: false,
            alwaysShow: true,
            openType: 'internal',
        }),
        seed('menu-tenant-mgmt', {
            parentId: 'menu-system-mgmt',
            name: '租户管理',
            path: '/system-mgmt/tenant',
            component: 'system/TenantMgmt',
            icon: 'team',
            sort: 1,
            menuType: 'submenu',
            isRoute: true,
            hidden: false,
            keepAlive: true,
            alwaysShow: false,
            openType: 'internal',
        }),
        seed('menu-user-mgmt', {
            parentId: 'menu-system-mgmt',
            name: '用户管理',
            path: '/system-mgmt/user',
            component: 'system/UserMgmt',
            icon: 'user',
            sort: 2,
            menuType: 'submenu',
            isRoute: true,
            hidden: false,
            keepAlive: true,
            alwaysShow: false,
            openType: 'internal',
        }),
        seed('menu-role-mgmt', {
            parentId: 'menu-system-mgmt',
            name: '角色管理',
            path: '/system-mgmt/role',
            component: 'system/RoleMgmt',
            icon: 'safety',
            sort: 3,
            menuType: 'submenu',
            isRoute: true,
            hidden: false,
            keepAlive: true,
            alwaysShow: false,
            openType: 'internal',
        }),
        seed('menu-dept-mgmt', {
            parentId: 'menu-system-mgmt',
            name: '部门管理',
            path: '/system-mgmt/dept',
            component: 'system/DeptMgmt',
            icon: 'apartment',
            sort: 4,
            menuType: 'submenu',
            isRoute: true,
            hidden: false,
            keepAlive: true,
            alwaysShow: false,
            openType: 'internal',
        }),
        seed('menu-menu-mgmt', {
            parentId: 'menu-system-mgmt',
            name: '菜单管理',
            path: '/system-mgmt/menu',
            component: 'system/MenuMgmt',
            icon: 'menu',
            sort: 5,
            menuType: 'submenu',
            isRoute: true,
            hidden: false,
            keepAlive: true,
            alwaysShow: false,
            openType: 'internal',
        }),
        seed('menu-login-log', {
            parentId: 'menu-system-mgmt',
            name: '登录日志',
            path: '/system-mgmt/login-log',
            component: 'system/LoginLog',
            icon: 'login',
            sort: 6,
            menuType: 'submenu',
            isRoute: true,
            hidden: false,
            keepAlive: true,
            alwaysShow: false,
            openType: 'internal',
        }),
        seed('menu-operation-log', {
            parentId: 'menu-system-mgmt',
            name: '操作日志',
            path: '/system-mgmt/operation-log',
            component: 'system/OperationLog',
            icon: 'audit',
            sort: 7,
            menuType: 'submenu',
            isRoute: true,
            hidden: false,
            keepAlive: true,
            alwaysShow: false,
            openType: 'internal',
        }),
    ];

    return menus;
}

export function createInitialSystemMenus(): SystemMenuRecord[] {
    return buildInitialMenus();
}

export function generateMenuId(): string {
    return `menu-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

export function getMenuById(menus: SystemMenuRecord[], id: string): SystemMenuRecord | undefined {
    return menus.find((item) => item.id === id);
}

export function getRootMenus(menus: SystemMenuRecord[]): SystemMenuRecord[] {
    return menus
        .filter((item) => item.parentId === null)
        .sort((a, b) => a.sort - b.sort);
}

export function getFilteredRootMenus(menus: SystemMenuRecord[], keyword: string): SystemMenuRecord[] {
    const normalizedKeyword = keyword.trim().toLowerCase();
    const roots = getRootMenus(menus);
    if (!normalizedKeyword) return roots;

    const childrenMap = buildChildrenMap(menus);
    const matches = (item: SystemMenuRecord) =>
        item.name.toLowerCase().includes(normalizedKeyword)
        || item.path.toLowerCase().includes(normalizedKeyword)
        || item.component.toLowerCase().includes(normalizedKeyword);

    const hasMatchingDescendant = (item: SystemMenuRecord): boolean => {
        const children = childrenMap.get(item.id) ?? [];
        return children.some((child) => matches(child) || hasMatchingDescendant(child));
    };

    return roots.filter((root) => matches(root) || hasMatchingDescendant(root));
}

function buildChildrenMap(menus: SystemMenuRecord[]): Map<string, SystemMenuRecord[]> {
    const map = new Map<string, SystemMenuRecord[]>();
    menus.forEach((item) => {
        if (!item.parentId) return;
        const list = map.get(item.parentId) ?? [];
        list.push(item);
        map.set(item.parentId, list);
    });
    map.forEach((list) => list.sort((a, b) => a.sort - b.sort));
    return map;
}

export function buildMenuSubtreeRows(
    menus: SystemMenuRecord[],
    root: SystemMenuRecord,
    expanded: Record<string, boolean>,
): { item: SystemMenuRecord; depth: number; hasChildren: boolean; rootIndex: number }[] {
    const childrenMap = buildChildrenMap(menus);
    const rows: { item: SystemMenuRecord; depth: number; hasChildren: boolean; rootIndex: number }[] = [];

    const walk = (parentId: string, depth: number, rootIndex: number) => {
        const nodes = childrenMap.get(parentId) ?? [];
        nodes.forEach((item) => {
            const children = childrenMap.get(item.id) ?? [];
            const hasChildren = children.length > 0;
            rows.push({ item, depth, hasChildren, rootIndex });
            if (hasChildren && (expanded[item.id] ?? true)) {
                walk(item.id, depth + 1, rootIndex);
            }
        });
    };

    const children = childrenMap.get(root.id) ?? [];
    const hasChildren = children.length > 0;
    const rootIndex = root.sort;
    rows.push({ item: root, depth: 0, hasChildren, rootIndex });
    if (hasChildren && (expanded[root.id] ?? true)) {
        walk(root.id, 1, rootIndex);
    }

    return rows;
}

export function buildDefaultMenuExpanded(menus: SystemMenuRecord[]): Record<string, boolean> {
    return Object.fromEntries(menus.map((item) => [item.id, true]));
}

export function collectDescendantIds(menus: SystemMenuRecord[], rootId: string): string[] {
    const childrenMap = buildChildrenMap(menus);
    const result: string[] = [];
    const walk = (parentId: string) => {
        const children = childrenMap.get(parentId) ?? [];
        children.forEach((child) => {
            result.push(child.id);
            walk(child.id);
        });
    };
    walk(rootId);
    return result;
}

export function buildMenuParentSelectTree(menus: SystemMenuRecord[]): TreeSelectNode[] {
    const childrenMap = buildChildrenMap(menus);
    const roots = getRootMenus(menus);

    const buildNode = (item: SystemMenuRecord): TreeSelectNode => {
        const children = childrenMap.get(item.id) ?? [];
        if (!children.length) {
            return { id: item.id, label: item.name };
        }
        return {
            id: item.id,
            label: item.name,
            children: children.map(buildNode),
        };
    };

    return roots.map(buildNode);
}

export function formatMenuTypeLabel(menuType: SystemMenuType): string {
    return MENU_TYPE_OPTIONS.find((item) => item.value === menuType)?.label ?? menuType;
}

export type MenuFormValue = Omit<SystemMenuRecord, 'id'>;

export function toMenuFormValue(menu: SystemMenuRecord): MenuFormValue {
    const { id: _id, ...rest } = menu;
    return rest;
}

export function defaultMenuFormValue(parentId: string | null = null): MenuFormValue {
    const isRoot = parentId === null;
    return {
        parentId,
        name: '',
        path: '',
        component: isRoot ? 'layouts/RouteView' : '',
        redirect: '',
        icon: '',
        sort: 1,
        menuType: isRoot ? 'root' : 'submenu',
        isRoute: true,
        hidden: false,
        keepAlive: false,
        alwaysShow: isRoot,
        openType: 'internal',
    };
}
