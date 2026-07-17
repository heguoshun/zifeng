import {
    buildPermissionId,
    flattenPermissionIds,
    normalizeAuthorizedPermissionIds,
    type TenantPermissionAction,
} from './tenantMenus';
import { getProductCategoryLabel, PRODUCT_CATEGORY_TREE, type ProductCategoryNode } from './productCategories';

/** 数据域分类 ID，对应产品管理中的产品分类树节点 ID */
export type AlarmRuleCategoryScope = string;

/** 数据域生效的业务范围，用于角色授权说明 */
export const DATA_DOMAIN_APPLY_MODULES = [
    '设备列表',
    '告警规则',
    '工单管理',
    '设备告警',
] as const;

export const DATA_DOMAIN_APPLY_SCOPE_TEXT = DATA_DOMAIN_APPLY_MODULES.join('、');

/** 产品分类数据域树（排除 'all' 节点） */
export const DATA_DOMAIN_CATEGORY_TREE: ProductCategoryNode[] = PRODUCT_CATEGORY_TREE.filter(
    (node) => node.id !== 'all',
);

/** 收集树中所有叶子节点 ID */
export function collectLeafCategoryIds(nodes: ProductCategoryNode[]): string[] {
    const ids: string[] = [];
    const walk = (list: ProductCategoryNode[]) => {
        list.forEach((node) => {
            if (node.children?.length) {
                walk(node.children);
            } else {
                ids.push(node.id);
            }
        });
    };
    walk(nodes);
    return ids;
}

export const DATA_DOMAIN_LEAF_IDS = collectLeafCategoryIds(DATA_DOMAIN_CATEGORY_TREE);

export type SystemRoleRecord = {
    id: string;
    tenantId: string;
    name: string;
    roleCode: string;
    createdAt: string;
    isTenantAdmin?: boolean;
    authorizedPermissionIds?: string[];
    /** 角色说明，用于角色管理列表展示 */
    remark?: string;
    /**
     * 全局数据域（按产品分类）；未配置或企业管理员视为全部分类。
     * 限制设备列表、告警规则、工单等业务模块中可见与可操作的数据范围。
     */
    alarmRuleCategoryScopes?: AlarmRuleCategoryScope[];
};

const P = buildPermissionId;

function modulePerms(moduleId: string, actions: TenantPermissionAction[]): string[] {
    return actions.map((action) => P(moduleId, action));
}

const WORKBENCH_VIEW = modulePerms('workbench-home', ['view']);

const DEVICE_ACCESS_VIEW = [
    ...modulePerms('device-overview', ['view']),
    ...modulePerms('device-product', ['view']),
    ...modulePerms('device-mgmt', ['view']),
];

const DEVICE_ACCESS_EDIT = [
    ...DEVICE_ACCESS_VIEW,
    ...modulePerms('device-product', ['edit']),
    ...modulePerms('device-mgmt', ['edit']),
];

const LARGE_METER_CENTER = [
    ...modulePerms('data-monitor', ['view', 'export']),
    ...modulePerms('data-report', ['view', 'export']),
    ...modulePerms('area-config', ['view', 'create', 'edit', 'delete']),
];

const ALARM_WORK_ORDER_VIEW = [
    ...modulePerms('awo-alarm-info', ['view', 'export']),
    ...modulePerms('awo-alarm-level', ['view']),
];

const ALARM_RULE_MANAGE = modulePerms('awo-alarm-rule', ['view', 'create', 'edit', 'delete']);

const ALARM_WORK_ORDER_OPS = [
    ...ALARM_WORK_ORDER_VIEW,
    ...ALARM_RULE_MANAGE,
    ...modulePerms('work-order', ['view', 'create', 'edit', 'delete', 'export']),
];

const AUDIT_VIEW = [
    ...modulePerms('login-log', ['view', 'export']),
    ...modulePerms('operation-log', ['view', 'export']),
];

const OM_NETWORK = [
    ...modulePerms('network-protocol', ['view', 'create', 'edit', 'delete']),
    ...modulePerms('network-service', ['view', 'create', 'edit', 'delete']),
    ...modulePerms('protocol-mgmt', ['view', 'create', 'edit', 'delete', 'export']),
    ...modulePerms('certificate-mgmt', ['view', 'create', 'edit', 'delete']),
];

export function resolveRolePermissionIds(role: {
    authorizedPermissionIds?: string[] | null;
    isTenantAdmin?: boolean;
}): string[] {
    if (role.isTenantAdmin) {
        return flattenPermissionIds();
    }
    return normalizeAuthorizedPermissionIds(role.authorizedPermissionIds);
}

export function formatAlarmRuleScopeSummary(
    scopes?: AlarmRuleCategoryScope[] | null,
    options?: { isTenantAdmin?: boolean },
): string {
    if (options?.isTenantAdmin || !scopes?.length) {
        return '全部';
    }
    return scopes.map((id) => getProductCategoryLabel(id)).join('、');
}

export function getAlarmRuleRootCategoryIdsForRole(role: {
    alarmRuleCategoryScopes?: AlarmRuleCategoryScope[] | null;
    isTenantAdmin?: boolean;
}): string[] | null {
    if (role.isTenantAdmin || !role.alarmRuleCategoryScopes?.length) {
        return null;
    }
    return role.alarmRuleCategoryScopes;
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
        {
            id: 'role-jiahuan-admin',
            tenantId: 'tenant-jiahuan',
            name: '企业管理员',
            roleCode: 'R29p3',
            createdAt: '2024-09-18 10:30:00',
            isTenantAdmin: true,
            remark: '拥有租户内全部功能与全部数据域',
        },
        {
            id: 'role-jiahuan-large-meter',
            tenantId: 'tenant-jiahuan',
            name: '大表管理员',
            roleCode: 'R29p5',
            createdAt: '2025-06-20 09:00:00',
            remark: '负责大表设备监测、区域配置及大表告警规则维护',
            alarmRuleCategoryScopes: ['dabiao'],
            authorizedPermissionIds: [
                ...WORKBENCH_VIEW,
                ...DEVICE_ACCESS_VIEW,
                ...LARGE_METER_CENTER,
                ...ALARM_WORK_ORDER_VIEW,
                ...ALARM_RULE_MANAGE,
            ],
        },
        {
            id: 'role-jiahuan-household-meter',
            tenantId: 'tenant-jiahuan',
            name: '户表管理员',
            roleCode: 'R29p6',
            createdAt: '2025-09-01 10:30:00',
            remark: '负责户表设备接入查看及户表告警规则维护（后期上线）',
            alarmRuleCategoryScopes: ['hubiao'],
            authorizedPermissionIds: [
                ...WORKBENCH_VIEW,
                ...DEVICE_ACCESS_VIEW,
                ...ALARM_WORK_ORDER_VIEW,
                ...ALARM_RULE_MANAGE,
            ],
        },
        {
            id: 'role-jiahuan-iot',
            tenantId: 'tenant-jiahuan',
            name: '物联网角色',
            roleCode: 'R29p1',
            createdAt: '2025-06-24 14:20:10',
            remark: '设备接入与产品维护，可查看告警信息',
            authorizedPermissionIds: [
                ...DEVICE_ACCESS_EDIT,
                ...modulePerms('device-group', ['view', 'create', 'edit', 'delete']),
                ...modulePerms('device-map', ['view', 'edit']),
                ...ALARM_WORK_ORDER_VIEW,
            ],
        },
        {
            id: 'role-jiahuan-ops',
            tenantId: 'tenant-jiahuan',
            name: '运维人员',
            roleCode: 'R29p2',
            createdAt: '2025-06-06 09:15:33',
            remark: '告警处置与工单闭环，可查看全部告警规则但不可修改',
            authorizedPermissionIds: [
                ...WORKBENCH_VIEW,
                ...modulePerms('device-mgmt', ['view']),
                ...modulePerms('awo-alarm-info', ['view', 'export']),
                ...modulePerms('awo-alarm-rule', ['view']),
                ...modulePerms('awo-alarm-level', ['view']),
                ...modulePerms('work-order', ['view', 'create', 'edit', 'delete', 'export']),
            ],
        },
        {
            id: 'role-jiahuan-auditor',
            tenantId: 'tenant-jiahuan',
            name: '审计员',
            roleCode: 'R29p4',
            createdAt: '2025-08-01 09:00:00',
            remark: '只读查看登录与操作日志',
            authorizedPermissionIds: AUDIT_VIEW,
        },
        {
            id: 'role-jiahuan-upgrade-approver',
            tenantId: 'tenant-jiahuan',
            name: '远程升级审核人员',
            roleCode: 'R29p8',
            createdAt: '2026-07-15 09:00:00',
            remark: '负责远程升级任务审批，只能处理分配给自己的任务',
            authorizedPermissionIds: modulePerms('remote-upgrade', ['view', 'approve']),
        },
        {
            id: 'role-jiahuan-alarm-specialist',
            tenantId: 'tenant-jiahuan',
            name: '告警规则专员',
            roleCode: 'R29p7',
            createdAt: '2025-10-12 15:20:00',
            remark: '维护全部产品类型的告警规则与告警等级',
            authorizedPermissionIds: [
                ...WORKBENCH_VIEW,
                ...ALARM_WORK_ORDER_OPS,
                ...modulePerms('awo-alarm-level', ['create', 'edit', 'delete']),
            ],
        },
        {
            id: 'role-nanjing-admin',
            tenantId: 'tenant-nanjing',
            name: '企业管理员',
            roleCode: 'R30a1',
            createdAt: '2025-07-02 10:00:00',
            isTenantAdmin: true,
            remark: '南京制造基地租户管理员',
        },
        {
            id: 'role-nanjing-large-meter',
            tenantId: 'tenant-nanjing',
            name: '大表管理员',
            roleCode: 'R30a4',
            createdAt: '2025-07-15 09:30:00',
            remark: '南京基地大表告警规则配置',
            alarmRuleCategoryScopes: ['dabiao'],
            authorizedPermissionIds: [
                ...WORKBENCH_VIEW,
                ...modulePerms('device-mgmt', ['view']),
                ...ALARM_WORK_ORDER_VIEW,
                ...ALARM_RULE_MANAGE,
            ],
        },
        {
            id: 'role-nanjing-iot',
            tenantId: 'tenant-nanjing',
            name: '物联网角色',
            roleCode: 'R30a2',
            createdAt: '2025-07-02 10:05:00',
            remark: '设备接入日常运维',
            authorizedPermissionIds: [
                ...modulePerms('workbench-home', ['view']),
                ...modulePerms('workbench-dashboard', ['view']),
                ...modulePerms('device-overview', ['view']),
                ...modulePerms('device-mgmt', ['view', 'edit']),
                ...modulePerms('awo-alarm-info', ['view']),
            ],
        },
        {
            id: 'role-nanjing-device',
            tenantId: 'tenant-nanjing',
            name: '设备管理员',
            roleCode: 'R30a3',
            createdAt: '2025-07-08 15:20:00',
            remark: '设备档案与分组管理',
            authorizedPermissionIds: [
                ...DEVICE_ACCESS_EDIT,
                ...modulePerms('device-group', ['view', 'create', 'edit', 'delete']),
                ...modulePerms('device-map', ['view']),
            ],
        },
        {
            id: 'role-nanjing-ops',
            tenantId: 'tenant-nanjing',
            name: '运维人员',
            roleCode: 'R30a5',
            createdAt: '2025-08-20 11:10:00',
            remark: '工单处理与告警查看',
            authorizedPermissionIds: [
                ...modulePerms('work-order', ['view', 'create', 'edit']),
                ...modulePerms('awo-alarm-info', ['view', 'export']),
            ],
        },
        {
            id: 'role-nanjing-extra-admin',
            tenantId: 'tenant-nanjing',
            name: '企业管理员',
            roleCode: 'R31b1',
            createdAt: '2025-07-10 08:30:00',
            isTenantAdmin: true,
            remark: '备用企业管理员账号',
        },
        {
            id: 'role-nanjing-extra-iot',
            tenantId: 'tenant-nanjing',
            name: '物联网角色',
            roleCode: 'R31b2',
            createdAt: '2025-07-10 08:35:00',
            remark: '设备与网络组件维护',
            authorizedPermissionIds: [
                ...DEVICE_ACCESS_VIEW,
                ...OM_NETWORK,
            ],
        },
        {
            id: 'role-nanjing-extra-tenant-admin',
            tenantId: 'tenant-nanjing',
            name: '租户管理员',
            roleCode: 'R31b3',
            createdAt: '2025-07-10 08:40:00',
            isTenantAdmin: true,
            remark: '租户级系统管理（用户、角色、部门）',
        },
        {
            id: 'role-suzhou-admin',
            tenantId: 'tenant-suzhou',
            name: '企业管理员',
            roleCode: 'R32c1',
            createdAt: '2025-07-03 11:00:00',
            isTenantAdmin: true,
            remark: '苏州研发中心租户管理员',
        },
        {
            id: 'role-suzhou-iot',
            tenantId: 'tenant-suzhou',
            name: '物联网角色',
            roleCode: 'R32c2',
            createdAt: '2025-07-03 11:05:00',
            remark: '物模型与产品联调',
            authorizedPermissionIds: [
                ...DEVICE_ACCESS_EDIT,
                ...ALARM_WORK_ORDER_VIEW,
            ],
        },
        {
            id: 'role-suzhou-alarm',
            tenantId: 'tenant-suzhou',
            name: '告警规则专员',
            roleCode: 'R32c3',
            createdAt: '2025-11-08 14:00:00',
            remark: '研发环境告警规则验证',
            authorizedPermissionIds: ALARM_WORK_ORDER_OPS,
        },
        {
            id: 'role-wuxi-admin',
            tenantId: 'tenant-wuxi',
            name: '企业管理员',
            roleCode: 'R33d1',
            createdAt: '2025-07-03 14:10:00',
            isTenantAdmin: true,
            remark: '无锡装配中心租户管理员',
        },
        {
            id: 'role-wuxi-monitor',
            tenantId: 'tenant-wuxi',
            name: '监控值班员',
            roleCode: 'R33d2',
            createdAt: '2025-07-03 14:15:00',
            remark: '值班监控设备状态与告警信息',
            authorizedPermissionIds: [
                ...WORKBENCH_VIEW,
                ...modulePerms('device-mgmt', ['view']),
                ...modulePerms('device-map', ['view']),
                ...modulePerms('awo-alarm-info', ['view', 'export']),
                ...modulePerms('awo-alarm-rule', ['view']),
            ],
        },
        {
            id: 'role-wuxi-household-meter',
            tenantId: 'tenant-wuxi',
            name: '户表管理员',
            roleCode: 'R33d3',
            createdAt: '2026-01-10 09:00:00',
            remark: '无锡基地户表告警规则试点',
            alarmRuleCategoryScopes: ['hubiao'],
            authorizedPermissionIds: [
                ...WORKBENCH_VIEW,
                ...modulePerms('device-mgmt', ['view']),
                ...ALARM_WORK_ORDER_VIEW,
                ...ALARM_RULE_MANAGE,
            ],
        },
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
