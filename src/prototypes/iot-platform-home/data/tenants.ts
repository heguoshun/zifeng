import {
    DEFAULT_TENANT_PERMISSION_IDS,
    buildPermissionId,
    flattenPermissionIds,
} from './tenantMenus';

import type { TreeSelectNode } from './orgHierarchy';

export type TenantRecord = {
    id: string;
    parentId: string | null;
    name: string;
    region: string;
    address: string;
    adminName: string;
    phone: string;
    password?: string;
    remark: string;
    createdAt: string;
    authorizedPermissionIds: string[];
    /** @deprecated 仅用于兼容旧数据，请使用 authorizedPermissionIds */
    authorizedMenuIds?: string[];
};

export const TENANT_REGION_OPTIONS = [
    { label: '江苏南京', value: '江苏南京' },
    { label: '江苏苏州', value: '江苏苏州' },
    { label: '江苏无锡', value: '江苏无锡' },
    { label: '浙江杭州', value: '浙江杭州' },
    { label: '上海', value: '上海' },
    { label: '北京', value: '北京' },
    { label: '广东深圳', value: '广东深圳' },
] as const;

export const TENANT_REMARK_MAX = 100;

export function generateTenantId(): string {
    return `tenant-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

export function generateTenantPassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export function formatTenantNow(): string {
    const now = new Date();
    const pad = (value: number) => String(value).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} `
        + `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

export function buildTenantTreeRows(
    tenants: TenantRecord[],
    expanded: Record<string, boolean>,
    keyword: string,
): { item: TenantRecord; depth: number; hasChildren: boolean }[] {
    const normalizedKeyword = keyword.trim().toLowerCase();
    const childrenMap = new Map<string | null, TenantRecord[]>();

    tenants.forEach((item) => {
        const list = childrenMap.get(item.parentId) ?? [];
        list.push(item);
        childrenMap.set(item.parentId, list);
    });

    const matchesKeyword = (item: TenantRecord) => {
        if (!normalizedKeyword) return true;
        return item.name.toLowerCase().includes(normalizedKeyword)
            || item.adminName.toLowerCase().includes(normalizedKeyword)
            || item.phone.includes(normalizedKeyword);
    };

    const hasMatchingDescendant = (item: TenantRecord): boolean => {
        const children = childrenMap.get(item.id) ?? [];
        return children.some((child) => matchesKeyword(child) || hasMatchingDescendant(child));
    };

    const shouldShow = (item: TenantRecord) => {
        if (!normalizedKeyword) return true;
        return matchesKeyword(item) || hasMatchingDescendant(item);
    };

    const rows: { item: TenantRecord; depth: number; hasChildren: boolean }[] = [];

    const walk = (parentId: string | null, depth: number) => {
        const nodes = childrenMap.get(parentId) ?? [];
        nodes.forEach((item) => {
            if (!shouldShow(item)) return;
            const children = childrenMap.get(item.id) ?? [];
            const hasChildren = children.length > 0;
            rows.push({ item, depth, hasChildren });
            if (hasChildren && (expanded[item.id] ?? true)) {
                walk(item.id, depth + 1);
            }
        });
    };

    walk(null, 0);
    return rows;
}

export function getFilteredRootTenants(
    tenants: TenantRecord[],
    keyword: string,
): TenantRecord[] {
    const roots = tenants.filter((item) => item.parentId === null);
    if (!keyword.trim()) return roots;

    const allExpanded = Object.fromEntries(tenants.map((item) => [item.id, true]));
    const visibleIds = new Set(
        buildTenantTreeRows(tenants, allExpanded, keyword).map((row) => row.item.id),
    );

    return roots.filter((root) => visibleIds.has(root.id));
}

export function buildTenantSubtreeRows(
    tenants: TenantRecord[],
    root: TenantRecord,
    expanded: Record<string, boolean>,
): { item: TenantRecord; depth: number; hasChildren: boolean }[] {
    const childrenMap = new Map<string | null, TenantRecord[]>();

    tenants.forEach((item) => {
        const list = childrenMap.get(item.parentId) ?? [];
        list.push(item);
        childrenMap.set(item.parentId, list);
    });

    const rows: { item: TenantRecord; depth: number; hasChildren: boolean }[] = [];

    const walk = (parentId: string, depth: number) => {
        const nodes = childrenMap.get(parentId) ?? [];
        nodes.forEach((item) => {
            const children = childrenMap.get(item.id) ?? [];
            const hasChildren = children.length > 0;
            rows.push({ item, depth, hasChildren });
            if (hasChildren && (expanded[item.id] ?? true)) {
                walk(item.id, depth + 1);
            }
        });
    };

    const children = childrenMap.get(root.id) ?? [];
    const hasChildren = children.length > 0;
    rows.push({ item: root, depth: 0, hasChildren });
    if (hasChildren && (expanded[root.id] ?? true)) {
        walk(root.id, 1);
    }

    return rows;
}

export function createInitialTenants(): TenantRecord[] {
    const zifengRootId = 'tenant-jiahuan';

    const roots = [
        {
            id: zifengRootId,
            parentId: null,
            name: '紫峰装备',
            region: '江苏南京',
            address: '江宁区秣周东路9号紫峰装备产业园',
            adminName: '陈建国',
            phone: '025-86881234',
            remark: '紫峰装备智慧化管理平台默认租户',
            createdAt: '2025-01-08 09:30:00',
            authorizedPermissionIds: flattenPermissionIds(),
        },
        {
            id: 'tenant-nanjing',
            parentId: zifengRootId,
            name: '紫峰装备南京制造基地',
            region: '江苏南京',
            address: '江宁区将军大道88号',
            adminName: '王磊',
            phone: '13851881234',
            remark: '智能装备总装与测试',
            createdAt: '2025-03-12 10:15:22',
            authorizedPermissionIds: [
                buildPermissionId('workbench-home', 'view'),
                buildPermissionId('workbench-dashboard', 'view'),
                buildPermissionId('device-overview', 'view'),
                buildPermissionId('device-product', 'view'),
                buildPermissionId('device-product', 'create'),
                buildPermissionId('device-product', 'edit'),
                buildPermissionId('device-mgmt', 'view'),
                buildPermissionId('device-mgmt', 'create'),
                buildPermissionId('device-mgmt', 'edit'),
                buildPermissionId('work-order', 'view'),
                buildPermissionId('work-order', 'create'),
                buildPermissionId('work-order', 'edit'),
                buildPermissionId('login-log', 'view'),
                buildPermissionId('operation-log', 'view'),
            ],
        },
        {
            id: 'tenant-suzhou',
            parentId: zifengRootId,
            name: '紫峰装备苏州研发中心',
            region: '江苏苏州',
            address: '工业园区星湖街328号创意产业园A座',
            adminName: '刘芳',
            phone: '13912785678',
            remark: '物模型与算法研发',
            createdAt: '2025-04-06 11:20:36',
            authorizedPermissionIds: [...DEFAULT_TENANT_PERMISSION_IDS],
        },
        {
            id: 'tenant-wuxi',
            parentId: zifengRootId,
            name: '紫峰装备无锡装配中心',
            region: '江苏无锡',
            address: '滨湖区太湖大道1500号',
            adminName: '赵强',
            phone: '13706198888',
            remark: '传感器与终端设备装配',
            createdAt: '2025-05-18 14:08:15',
            authorizedPermissionIds: [...DEFAULT_TENANT_PERMISSION_IDS],
        },
    ];

    return roots;
}

export function getTenantById(tenants: TenantRecord[], id: string): TenantRecord | undefined {
    return tenants.find((item) => item.id === id);
}

/** 上级租户选择树：展示完整层级，仅一级租户可选作上级 */
export function buildTenantParentSelectTree(tenants: TenantRecord[]): TreeSelectNode[] {
    const childrenMap = new Map<string | null, TenantRecord[]>();

    tenants.forEach((item) => {
        const list = childrenMap.get(item.parentId) ?? [];
        list.push(item);
        childrenMap.set(item.parentId, list);
    });

    const walk = (parentId: string | null): TreeSelectNode[] => {
        const nodes = childrenMap.get(parentId) ?? [];
        return nodes.map((item) => {
            const children = walk(item.id);
            return {
                id: item.id,
                label: item.name,
                selectable: item.parentId === null,
                children: children.length ? children : undefined,
            };
        });
    };

    return walk(null);
}

export function buildTenantSelectTree(tenants: TenantRecord[]): TreeSelectNode[] {
    const childrenMap = new Map<string | null, TenantRecord[]>();

    tenants.forEach((item) => {
        const list = childrenMap.get(item.parentId) ?? [];
        list.push(item);
        childrenMap.set(item.parentId, list);
    });

    const walk = (parentId: string | null): TreeSelectNode[] => {
        const nodes = childrenMap.get(parentId) ?? [];
        return nodes.map((item) => {
            const children = walk(item.id);
            return {
                id: item.id,
                label: item.name,
                children: children.length ? children : undefined,
            };
        });
    };

    return walk(null);
}

export function buildTenantTreeExpanded(tenants: TenantRecord[]): Record<string, boolean> {
    const expanded: Record<string, boolean> = {};
    tenants.forEach((item) => {
        const hasChildren = tenants.some((child) => child.parentId === item.id);
        if (hasChildren) {
            expanded[item.id] = item.parentId === null;
        }
    });
    return expanded;
}
