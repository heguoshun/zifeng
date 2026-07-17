import type { AlarmLevel } from './deviceAlarms';
import { resolveProcessingDeadlineByLevelName } from './alarmLevels';

export type WorkOrderType = '告警工单' | '其他工单';

export type WorkOrderStatus = '待处理' | '待验收' | '退回' | '已结单';

export type WorkOrderReadStatus = '未读' | '已读';

export type WorkOrderRelatedDeviceGroup = {
    productName: string;
    space: string;
    deviceNames: string[];
};

export type WorkOrderRecord = {
    id: string;
    name: string;
    level: AlarmLevel;
    type: WorkOrderType;
    status: WorkOrderStatus;
    createdAt: string;
    readStatus: WorkOrderReadStatus;
    content: string;
    space: string;
    closedAt?: string;
    assignees: string[];
    handler?: string;
    handledAt?: string;
    result?: string;
    alarmId?: string;
    processingDeadline?: number;
    processingDeadlineUnit?: 'hour' | 'day';
    relatedDevices?: WorkOrderRelatedDeviceGroup[];
    createAttachmentCount?: number;
    processAttachmentCount?: number;
    acceptanceRemark?: string;
};

export const WORK_ORDER_TYPE_OPTIONS = ['全部', '告警工单', '其他工单'] as const;

export const WORK_ORDER_LEVEL_OPTIONS = ['全部', '紧急', '重要', '次要', '提示'] as const;

export const WORK_ORDER_STATUS_OPTIONS = ['全部', '待处理', '待验收', '退回', '已结单'] as const;

export const WORK_ORDER_READ_STATUS_OPTIONS = ['全部', '未读', '已读'] as const;

/** 原型当前登录的处理人员 */
export const CURRENT_WORK_ORDER_USER = '张三';

/** 原型当前登录角色：管理人员可验收，处理人员可处理 */
export type WorkOrderViewerRole = 'admin' | 'assignee';

export const CURRENT_WORK_ORDER_ROLE: WorkOrderViewerRole = 'admin';

export function isWorkOrderAdminViewer(role: WorkOrderViewerRole = CURRENT_WORK_ORDER_ROLE): boolean {
    return role === 'admin';
}

export function getVisibleWorkOrdersForViewer(
    workOrders: WorkOrderRecord[],
    role: WorkOrderViewerRole = CURRENT_WORK_ORDER_ROLE,
    currentUser: string = CURRENT_WORK_ORDER_USER,
): WorkOrderRecord[] {
    if (isWorkOrderAdminViewer(role)) return workOrders;
    return workOrders.filter((item) => isWorkOrderAssignedToUser(item, currentUser));
}

export function isWorkOrderAssignedToUser(
    workOrder: WorkOrderRecord,
    currentUser: string = CURRENT_WORK_ORDER_USER,
): boolean {
    return workOrder.assignees.includes(currentUser);
}

export function canAssigneeProcessWorkOrder(
    workOrder: WorkOrderRecord,
    currentUser: string = CURRENT_WORK_ORDER_USER,
): boolean {
    return workOrder.assignees.includes(currentUser)
        && (workOrder.status === '待处理' || workOrder.status === '退回');
}

/** 管理人员是否可对工单执行验收 */
export function canAdminAcceptWorkOrder(workOrder: WorkOrderRecord): boolean {
    return workOrder.status === '待验收';
}

export function canShowWorkOrderProcessAction(
    workOrder: WorkOrderRecord,
    currentUser: string = CURRENT_WORK_ORDER_USER,
): boolean {
    return canAssigneeProcessWorkOrder(workOrder, currentUser);
}

export function canShowWorkOrderAcceptAction(
    workOrder: WorkOrderRecord,
    role: WorkOrderViewerRole = CURRENT_WORK_ORDER_ROLE,
): boolean {
    return isWorkOrderAdminViewer(role) && canAdminAcceptWorkOrder(workOrder);
}

export function createInitialWorkOrders(): WorkOrderRecord[] {
    const withDeadline = (level: AlarmLevel, record: WorkOrderRecord): WorkOrderRecord => {
        const deadline = resolveProcessingDeadlineByLevelName(level);
        return {
            ...record,
            processingDeadline: record.processingDeadline ?? deadline.processingDeadline,
            processingDeadlineUnit: record.processingDeadlineUnit ?? deadline.processingDeadlineUnit,
        };
    };

    return [
        withDeadline('重要', {
            id: '0202509122023',
            name: '水压阈值告警',
            level: '重要',
            type: '告警工单',
            status: '待处理',
            createdAt: '2025-09-10 10:23:40',
            readStatus: '未读',
            content: '水压值超过4MPa，请尽快处理!',
            space: '4F/401',
            assignees: ['张三', '李四'],
        }),
        withDeadline('紧急', {
            id: '0202509251642',
            name: '网络链路波动复查',
            level: '紧急',
            type: '告警工单',
            status: '退回',
            createdAt: '2025-09-22 16:42:10',
            readStatus: '已读',
            content: '网络链路波动需复查',
            space: '2F/机房',
            assignees: ['赵六', '钱七'],
            handler: '赵六',
            handledAt: '2025-09-23 09:10:00',
            result: '已排查链路，需补充测试报告后重新提交。',
        }),
        withDeadline('重要', {
            id: '0202509280935',
            name: '水压阀值告警工单',
            level: '重要',
            type: '其他工单',
            status: '已结单',
            createdAt: '2025-07-01 12:30:23',
            readStatus: '已读',
            content: '压力计频繁离线，又自动恢复，请排查原因。',
            space: '北河口水厂',
            closedAt: '2025-07-02 12:30:23',
            assignees: ['刘恒'],
            handler: '刘恒',
            handledAt: '2025-07-02 10:15:00',
            result: '已排查网络链路，设备恢复稳定上传。',
            relatedDevices: [
                {
                    productName: '压力计',
                    space: '一泵房',
                    deviceNames: ['YBF-YLJ-01', 'YBF-YLJ-02'],
                },
                {
                    productName: '流量计',
                    space: '二泵房',
                    deviceNames: ['YBF-LLJ-01', 'YBF-LLJ-02'],
                },
            ],
            createAttachmentCount: 1,
        }),
        withDeadline('紧急', {
            id: '0202509301148',
            name: '温度传感器离线',
            level: '紧急',
            type: '告警工单',
            status: '待处理',
            createdAt: '2025-09-28 11:48:05',
            readStatus: '未读',
            content: '3F 会议室温度传感器离线超过30分钟',
            space: '3F/301',
            assignees: ['张三'],
        }),
        withDeadline('重要', {
            id: '0202510030912',
            name: '门禁系统异常',
            level: '重要',
            type: '告警工单',
            status: '待验收',
            createdAt: '2025-10-02 09:12:44',
            readStatus: '已读',
            content: '1F 主入口门禁刷卡无响应',
            space: '1F/大厅',
            assignees: ['赵六'],
            handler: '赵六',
            handledAt: '2025-10-02 14:35:00',
            result: '已更换读卡器模块，待验收确认。',
        }),
        withDeadline('次要', {
            id: '0202510051420',
            name: '消防设备年检',
            level: '次要',
            type: '其他工单',
            status: '待处理',
            createdAt: '2025-10-04 14:20:33',
            readStatus: '未读',
            content: '年度消防设备检测与记录更新',
            space: '全楼',
            assignees: ['钱七', '孙八'],
            relatedDevices: [
                {
                    productName: '烟雾探测器',
                    space: '6F/走廊',
                    deviceNames: ['YW-601', 'YW-602'],
                },
            ],
        }),
        withDeadline('重要', {
            id: '0202510081035',
            name: 'UPS 电池更换',
            level: '重要',
            type: '其他工单',
            status: '退回',
            createdAt: '2025-10-07 10:35:50',
            readStatus: '已读',
            content: '2F 机房 UPS 电池组到期更换',
            space: '2F/机房',
            assignees: ['王五'],
            handler: '王五',
            handledAt: '2025-10-08 09:00:00',
            result: '电池已更换，缺少更换记录照片，请补充后重新提交。',
            relatedDevices: [
                {
                    productName: 'UPS 电源',
                    space: '2F/机房',
                    deviceNames: ['UPS-201'],
                },
            ],
            createAttachmentCount: 1,
        }),
        withDeadline('提示', {
            id: '0202510101605',
            name: '烟雾探测器误报',
            level: '提示',
            type: '告警工单',
            status: '已结单',
            createdAt: '2025-10-09 16:05:12',
            readStatus: '已读',
            content: '6F 走廊烟雾探测器频繁误报',
            space: '6F/走廊',
            closedAt: '2025-10-10 11:20:00',
            assignees: ['张三', '李四'],
            handler: '张三',
            handledAt: '2025-10-10 10:45:00',
            result: '已清洁探测器并调整灵敏度，误报已消除。',
        }),
    ];
}

export function generateWorkOrderId(): string {
    const now = new Date();
    const pad = (value: number) => String(value).padStart(2, '0');
    return `0${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}`;
}

export function createWorkOrderFromAlarm(input: {
    name: string;
    level: AlarmLevel;
    content: string;
    assignees: string[];
    space: string;
    alarmId: string;
    processingDeadline?: number;
    processingDeadlineUnit?: 'hour' | 'day';
}): WorkOrderRecord {
    const now = new Date();
    const pad = (value: number) => String(value).padStart(2, '0');
    const createdAt = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} `
        + `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    return {
        id: generateWorkOrderId(),
        name: input.name,
        level: input.level,
        type: '告警工单',
        status: '待处理',
        createdAt,
        readStatus: '未读',
        content: input.content,
        space: input.space,
        assignees: input.assignees,
        alarmId: input.alarmId,
        processingDeadline: input.processingDeadline,
        processingDeadlineUnit: input.processingDeadlineUnit,
    };
}

export type WorkOrderOverdueStatus = 'none' | 'active' | 'closed';

export type WorkOrderOverdueInfo = {
    status: WorkOrderOverdueStatus;
    label: string;
    hint?: string;
    deadlineAt?: string;
};

export function parseWorkOrderDateTime(value?: string): Date | null {
    if (!value?.trim()) return null;
    const date = new Date(value.trim().replace(' ', 'T'));
    return Number.isNaN(date.getTime()) ? null : date;
}

export function formatWorkOrderDateTime(date: Date): string {
    const pad = (value: number) => String(value).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} `
        + `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export function getWorkOrderDeadlineDate(workOrder: WorkOrderRecord): Date | null {
    if (workOrder.processingDeadline === undefined) return null;
    const created = parseWorkOrderDateTime(workOrder.createdAt);
    if (!created) return null;

    const amount = workOrder.processingDeadline;
    const unit = workOrder.processingDeadlineUnit ?? 'hour';
    const durationMs = unit === 'day'
        ? amount * 24 * 60 * 60 * 1000
        : amount * 60 * 60 * 1000;

    return new Date(created.getTime() + durationMs);
}

export function resolveWorkOrderOverdueInfo(
    workOrder: WorkOrderRecord,
    now = Date.now(),
): WorkOrderOverdueInfo {
    const deadline = getWorkOrderDeadlineDate(workOrder);
    if (!deadline) {
        return { status: 'none', label: '—' };
    }

    const deadlineAt = formatWorkOrderDateTime(deadline);

    if (workOrder.status === '已结单') {
        const finishedAt = parseWorkOrderDateTime(workOrder.closedAt ?? workOrder.handledAt ?? '');
        if (finishedAt && finishedAt.getTime() > deadline.getTime()) {
            return {
                status: 'closed',
                label: '超期完成',
                hint: `应于 ${deadlineAt} 前完成`,
                deadlineAt,
            };
        }
        return { status: 'none', label: '未超期', deadlineAt };
    }

    if (now > deadline.getTime()) {
        return {
            status: 'active',
            label: '已超期',
            hint: `应于 ${deadlineAt} 前完成`,
            deadlineAt,
        };
    }

    return { status: 'none', label: '未超期', deadlineAt };
}
