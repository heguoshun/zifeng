/**
 * 原型页面目录仅展示应用内菜单导航项（与各模块 Sidebar 一致）。
 * 新增/编辑/详情等子功能页、重复路由别名不在此列表中。
 */
export const PROTOTYPE_MENU_PAGE_IDS = [
    // 设备接入
    'home',
    'product-management',
    'device-management',
    'device-group',
    'device-map',
    'remote-upgrade',
    'network-protocol',
    'network-service',
    'protocol-mgmt',
    'certificate-mgmt',
    // 大表中心
    'data-monitor',
    'data-report',
    'area-config',
    'device-archive',
    // 告警工单
    'awo-device-alarm-info',
    'awo-alarm-rule-config',
    'awo-alarm-level-mgmt',
    'work-order-management',
    // 消息中心
    'msg-subscribe',
    'push-source-config',
    'msg-template',
    'history-msg',
    // 系统管理
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
] as const;

export type PrototypeMenuPageId = typeof PROTOTYPE_MENU_PAGE_IDS[number];

export function isPrototypeMenuPage(pageId: string): pageId is PrototypeMenuPageId {
    return (PROTOTYPE_MENU_PAGE_IDS as readonly string[]).includes(pageId);
}
