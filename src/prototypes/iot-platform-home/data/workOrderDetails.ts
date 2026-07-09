import type { WorkOrderRecord, WorkOrderRelatedDeviceGroup } from './workOrders';

export type WorkOrderAlarmCondition = {
    deviceCode: string;
    productName: string;
    space: string;
    condition: string;
};

export type WorkOrderAlarmDetail = {
    eventName: string;
    triggeredAt: string;
    level: WorkOrderRecord['level'];
    triggerMethod: string;
    conditions: WorkOrderAlarmCondition[];
};

export type WorkOrderProcessRecordLine = {
    label?: string;
    value: string;
    tone?: 'default' | 'warning' | 'success';
};

export type WorkOrderProcessRecordItem = {
    id: string;
    title: string;
    time?: string;
    lines: WorkOrderProcessRecordLine[];
    attachmentCount?: number;
    showAcceptButton?: boolean;
};

export type WorkOrderTaskContent = {
    relatedDevices: WorkOrderRelatedDeviceGroup[];
    content: string;
    attachmentCount: number;
};

export type WorkOrderDetailView = {
    typeLabel: string;
    processor: string;
    acceptor: string;
    acceptanceStatus: string;
    attachmentCount: number;
    alarm: WorkOrderAlarmDetail | null;
    taskContent: WorkOrderTaskContent | null;
    records: WorkOrderProcessRecordItem[];
};

function mapWorkOrderTypeLabel(type: WorkOrderRecord['type']) {
    return type;
}

function mapAcceptanceStatus(status: WorkOrderRecord['status']) {
    if (status === '待验收') return '未验收';
    if (status === '已结单') return '已验收';
    if (status === '退回') return '未通过';
    return '—';
}

function shiftTime(time: string, hours: number) {
    const date = new Date(time.replace(/-/g, '/'));
    if (Number.isNaN(date.getTime())) return time;
    date.setHours(date.getHours() + hours);
    const pad = (value: number) => String(value).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} `
        + `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function buildTaskContent(workOrder: WorkOrderRecord): WorkOrderTaskContent | null {
    if (workOrder.type !== '其他工单') return null;

    return {
        relatedDevices: workOrder.relatedDevices ?? [],
        content: workOrder.content,
        attachmentCount: workOrder.createAttachmentCount ?? 0,
    };
}

function buildAlarmDetail(workOrder: WorkOrderRecord): WorkOrderAlarmDetail | null {
    if (workOrder.type !== '告警工单') return null;

    return {
        eventName: workOrder.name,
        triggeredAt: shiftTime(workOrder.createdAt, -2),
        level: workOrder.level,
        triggerMethod: '数据条件判断触发',
        conditions: [
            {
                deviceCode: 'YBF-YLJ-01',
                productName: '压力计',
                space: workOrder.space,
                condition: workOrder.content.includes('MPa') ? '水压值 > 4MPa' : workOrder.content,
            },
        ],
    };
}

function buildHandleCompleteRecord(
    workOrder: WorkOrderRecord,
    options: {
        idSuffix?: string;
        time?: string;
        result?: string;
        withAttachment?: boolean;
    } = {},
): WorkOrderProcessRecordItem {
    const handler = workOrder.handler ?? workOrder.assignees[0] ?? '—';
    const result = options.result ?? workOrder.result ?? '—';

    return {
        id: `${workOrder.id}-handle${options.idSuffix ?? ''}`,
        title: '处理完成',
        time: options.time ?? workOrder.handledAt ?? workOrder.createdAt,
        lines: [
            { label: '处理人员', value: handler },
            { label: '处理结果', value: result },
        ],
        attachmentCount: options.withAttachment
            ? (workOrder.processAttachmentCount ?? 1)
            : 0,
    };
}

function buildProcessRecords(workOrder: WorkOrderRecord): WorkOrderProcessRecordItem[] {
    const acceptor = 'admin';
    const processor = workOrder.handler ?? workOrder.assignees[0] ?? '—';
    const dispatch: WorkOrderProcessRecordItem = {
        id: `${workOrder.id}-dispatch`,
        title: '工单下派',
        time: workOrder.createdAt,
        lines: [{ label: '生成人', value: acceptor }],
    };

    if (workOrder.status === '待处理') {
        return [
            dispatch,
            {
                id: `${workOrder.id}-pending`,
                title: '待处理',
                lines: [{ label: '处理人员', value: processor }],
            },
        ];
    }

    if (workOrder.status === '待验收') {
        return [
            dispatch,
            buildHandleCompleteRecord(workOrder, { withAttachment: true }),
            {
                id: `${workOrder.id}-pending-accept`,
                title: '待验收',
                lines: [{ label: '验收人', value: acceptor }],
                showAcceptButton: true,
            },
        ];
    }

    if (workOrder.status === '退回') {
        return [
            dispatch,
            buildHandleCompleteRecord(workOrder, { withAttachment: true }),
            {
                id: `${workOrder.id}-return`,
                title: '退回',
                time: shiftTime(workOrder.handledAt ?? workOrder.createdAt, 2),
                lines: [
                    { label: '验收人员', value: acceptor },
                    { label: '验收结果', value: '未通过，已退回', tone: 'warning' },
                    { label: '备注', value: workOrder.acceptanceRemark ?? '经核查，设备依然为离线状态，没有最新数据上传' },
                ],
            },
            {
                id: `${workOrder.id}-pending`,
                title: '待处理',
                lines: [{ label: '处理人员', value: processor }],
            },
        ];
    }

    const handledAt = workOrder.handledAt ?? workOrder.createdAt;
    const closedAt = workOrder.closedAt ?? shiftTime(handledAt, 1);

    return [
        dispatch,
        buildHandleCompleteRecord(workOrder, {
            idSuffix: '-1',
            time: handledAt,
            result: '设备网络中断，现已经恢复网络',
            withAttachment: true,
        }),
        {
            id: `${workOrder.id}-return`,
            title: '退回',
            time: shiftTime(handledAt, 2),
            lines: [
                { label: '验收人员', value: acceptor },
                { label: '验收结果', value: '未通过，已退回', tone: 'warning' },
                { label: '备注', value: workOrder.acceptanceRemark ?? '经核查，设备依然为离线状态，没有最新数据上传' },
            ],
        },
        buildHandleCompleteRecord(workOrder, {
            idSuffix: '-2',
            time: shiftTime(handledAt, 4),
            result: workOrder.result ?? '设备网络环境不稳定，现已经恢复网络',
            withAttachment: true,
        }),
        {
            id: `${workOrder.id}-accept`,
            title: '工单验收',
            time: closedAt,
            lines: [
                { label: '验收人员', value: acceptor },
                { label: '验收结果', value: '通过，已结单', tone: 'success' },
            ],
        },
    ];
}

export function resolveWorkOrderDetailView(workOrder: WorkOrderRecord): WorkOrderDetailView {
    const hasProcessResult = Boolean(workOrder.handler && workOrder.result);

    return {
        typeLabel: mapWorkOrderTypeLabel(workOrder.type),
        processor: workOrder.handler ?? workOrder.assignees[0] ?? '—',
        acceptor: 'admin',
        acceptanceStatus: mapAcceptanceStatus(workOrder.status),
        attachmentCount: workOrder.processAttachmentCount ?? (hasProcessResult ? 2 : 0),
        alarm: buildAlarmDetail(workOrder),
        taskContent: buildTaskContent(workOrder),
        records: buildProcessRecords(workOrder),
    };
}
