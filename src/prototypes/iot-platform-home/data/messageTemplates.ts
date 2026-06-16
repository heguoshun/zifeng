export type MessageTemplateFieldType = '日期' | '字符串' | '布尔值' | '枚举值' | '数值';

export type MessageTemplateVariable = {
    id: string;
    key: string;
    name: string;
    fieldType: MessageTemplateFieldType;
};

export type MessageTemplateId =
    | 'device-alarm'
    | 'system-alarm'
    | 'device-runtime'
    | 'alarm-report'
    | 'work-order-report';

export type MessageTemplateRecord = {
    id: MessageTemplateId;
    content: string;
    maxLength: number;
    variables: MessageTemplateVariable[];
};

export type MessageTemplateTreeNode = {
    id: string;
    label: string;
    templateId?: MessageTemplateId;
    children?: MessageTemplateTreeNode[];
};

export const MESSAGE_TEMPLATE_TREE: MessageTemplateTreeNode[] = [
    {
        id: 'alarm-group',
        label: '告警类',
        children: [
            { id: 'device-alarm', label: '设备告警信息', templateId: 'device-alarm' },
            { id: 'system-alarm', label: '系统告警信息', templateId: 'system-alarm' },
        ],
    },
    {
        id: 'subscribe-group',
        label: '订阅类',
        children: [
            { id: 'device-runtime', label: '设备运行情况', templateId: 'device-runtime' },
            { id: 'alarm-report', label: '告警处理报告', templateId: 'alarm-report' },
            { id: 'work-order-report', label: '工单处理报告', templateId: 'work-order-report' },
        ],
    },
];

const DEVICE_ALARM_VARIABLES: MessageTemplateVariable[] = [
    { id: 'v1', key: 'datetime', name: '触发时间', fieldType: '日期' },
    { id: 'v2', key: 'DeviceName', name: '设备名称', fieldType: '字符串' },
    { id: 'v3', key: 'DeviceNumber', name: '设备编号', fieldType: '字符串' },
    { id: 'v4', key: 'AlertLevel', name: '告警等级', fieldType: '布尔值' },
    { id: 'v5', key: 'LogicTrigger', name: '触发条件', fieldType: '字符串' },
    { id: 'v6', key: 'DeviceLocation', name: '设备位置', fieldType: '字符串' },
    { id: 'v7', key: 'DeviceSpace', name: '所属空间', fieldType: '枚举值' },
];

const SYSTEM_ALARM_VARIABLES: MessageTemplateVariable[] = [
    { id: 'v1', key: 'datetime', name: '触发时间', fieldType: '日期' },
    { id: 'v2', key: 'AlertLevel', name: '告警等级', fieldType: '布尔值' },
    { id: 'v3', key: 'AlertContent', name: '告警内容', fieldType: '字符串' },
    { id: 'v4', key: 'ServerName', name: '服务器名称', fieldType: '字符串' },
    { id: 'v5', key: 'MetricName', name: '监控指标', fieldType: '字符串' },
];

const DEVICE_RUNTIME_VARIABLES: MessageTemplateVariable[] = [
    { id: 'v1', key: 'datetime', name: '统计时间', fieldType: '日期' },
    { id: 'v2', key: 'DeviceTotal', name: '设备总数', fieldType: '数值' },
    { id: 'v3', key: 'OnlineCount', name: '在线设备数', fieldType: '数值' },
    { id: 'v4', key: 'OfflineCount', name: '离线设备数', fieldType: '数值' },
    { id: 'v5', key: 'FaultCount', name: '故障设备数', fieldType: '数值' },
];

const ALARM_REPORT_VARIABLES: MessageTemplateVariable[] = [
    { id: 'v1', key: 'datetime', name: '报告时间', fieldType: '日期' },
    { id: 'v2', key: 'AlarmTotal', name: '告警总数', fieldType: '数值' },
    { id: 'v3', key: 'HandledCount', name: '已处理数', fieldType: '数值' },
    { id: 'v4', key: 'PendingCount', name: '未处理数', fieldType: '数值' },
    { id: 'v5', key: 'HandleRate', name: '处理率', fieldType: '字符串' },
];

const WORK_ORDER_REPORT_VARIABLES: MessageTemplateVariable[] = [
    { id: 'v1', key: 'datetime', name: '报告时间', fieldType: '日期' },
    { id: 'v2', key: 'WorkOrderTotal', name: '工单总数', fieldType: '数值' },
    { id: 'v3', key: 'CompletedCount', name: '已完成数', fieldType: '数值' },
    { id: 'v4', key: 'PendingCount', name: '待处理数', fieldType: '数值' },
    { id: 'v5', key: 'CompletionRate', name: '完成率', fieldType: '字符串' },
];

export function buildVariablePlaceholder(key: string): string {
    return `#{${key}}`;
}

export function findTemplateIdByTreeNode(nodeId: string): MessageTemplateId | null {
    const walk = (nodes: MessageTemplateTreeNode[]): MessageTemplateId | null => {
        for (const node of nodes) {
            if (node.id === nodeId) {
                return node.templateId ?? null;
            }
            if (node.children?.length) {
                const found = walk(node.children);
                if (found) return found;
            }
        }
        return null;
    };
    return walk(MESSAGE_TEMPLATE_TREE);
}

export function createInitialMessageTemplates(): MessageTemplateRecord[] {
    return [
        {
            id: 'device-alarm',
            maxLength: 200,
            content: '尊敬的用户您好，系统于#{datetime}监测到有设备触发告警，产品名称：#{ProductionName}，设备编号:#{deviceCode}，触发条件为：#{LogicTrigger}，告警等级：#{AlertLevel}。请及时处理！【嘉环物联网】',
            variables: DEVICE_ALARM_VARIABLES,
        },
        {
            id: 'system-alarm',
            maxLength: 200,
            content: '尊敬的用户您好，系统于#{datetime}监测到系统告警，告警等级：#{AlertLevel}，告警内容：#{AlertContent}，服务器：#{ServerName}，监控指标：#{MetricName}。请及时处理！【嘉环物联网】',
            variables: SYSTEM_ALARM_VARIABLES,
        },
        {
            id: 'device-runtime',
            maxLength: 200,
            content: '尊敬的用户您好，#{datetime}设备运行情况如下：设备总数 #{DeviceTotal}，在线 #{OnlineCount}，离线 #{OfflineCount}，故障 #{FaultCount}。【嘉环物联网】',
            variables: DEVICE_RUNTIME_VARIABLES,
        },
        {
            id: 'alarm-report',
            maxLength: 200,
            content: '尊敬的用户您好，#{datetime}告警处理报告：告警总数 #{AlarmTotal}，已处理 #{HandledCount}，未处理 #{PendingCount}，处理率 #{HandleRate}。【嘉环物联网】',
            variables: ALARM_REPORT_VARIABLES,
        },
        {
            id: 'work-order-report',
            maxLength: 200,
            content: '尊敬的用户您好，#{datetime}工单处理报告：工单总数 #{WorkOrderTotal}，已完成 #{CompletedCount}，待处理 #{PendingCount}，完成率 #{CompletionRate}。【嘉环物联网】',
            variables: WORK_ORDER_REPORT_VARIABLES,
        },
    ];
}
