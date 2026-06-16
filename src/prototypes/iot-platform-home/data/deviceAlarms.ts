import type { ProductRecord } from './products';

export type AlarmLevel = '紧急' | '重要' | '次要' | '提示';

export type AlarmReadStatus = '未读' | '已读';

export type AlarmProcessStatus = '未处理' | '处理中' | '已处理';

export type AlarmTriggerMethod =
    | '设备状态触发'
    | '数据条件判断触发'
    | '事件上报时触发'
    | '功能调用时触发'
    | '属性数据上报时触发';

export type AlarmTriggerLogic = '单条件触发' | '多条件并集触发' | '多条件交集触发';

export type AlarmProcessMethod = '工单处理' | '直接处理' | '自动恢复';

export type AlarmTriggerCondition = {
    deviceName: string;
    deviceCode: string;
    productId: string;
    productName?: string;
    space: string;
    condition: string;
};

export type AlarmWorkOrder = {
    id: string;
    name: string;
    createdAt: string;
    level: AlarmLevel;
    content: string;
    assignees: string[];
    handler?: string;
    handledAt?: string;
    result?: string;
    attachmentCount?: number;
};

export type DeviceAlarmRecord = {
    id: string;
    eventName: string;
    level: AlarmLevel;
    deviceName: string;
    deviceCode: string;
    productId: string;
    space: string;
    readStatus: AlarmReadStatus;
    processStatus: AlarmProcessStatus;
    triggerMethod: AlarmTriggerMethod;
    processMethod: AlarmProcessMethod;
    content: string;
    triggeredAt: string;
    triggerConditions?: AlarmTriggerCondition[];
    triggerLogic?: AlarmTriggerLogic;
    releaseTime?: string;
    processResult?: string;
    processHandler?: string;
    processTime?: string;
    processAttachmentCount?: number;
    workOrder?: AlarmWorkOrder;
};

export const ALARM_LEVEL_OPTIONS = ['全部', '紧急', '重要', '次要', '提示'] as const;

export const ALARM_STATUS_OPTIONS = ['全部', '未处理', '处理中', '已处理'] as const;

export const ALARM_TRIGGER_OPTIONS = [
    '全部',
    '设备状态触发',
    '数据条件判断触发',
    '事件上报时触发',
    '功能调用时触发',
    '属性数据上报时触发',
] as const;

export const ALARM_PROCESS_METHOD_OPTIONS = ['全部', '工单处理', '直接处理', '自动恢复'] as const;

export function resolveAlarmProductName(productId: string, products: ProductRecord[]) {
    return products.find((product) => product.id === productId)?.name ?? '—';
}

export function resolveConditionProductName(
    condition: AlarmTriggerCondition,
    products: ProductRecord[],
) {
    return condition.productName ?? resolveAlarmProductName(condition.productId, products);
}

function parseConditionTextsFromContent(content: string) {
    const trimmed = content.trim();
    const matched = trimmed.match(/^触发条件为[:：](.+)$/);
    if (!matched) return [trimmed];

    return matched[1]
        .split('；')
        .map((item) => item.trim())
        .filter(Boolean);
}

export function resolveAlarmTriggerConditions(alarm: DeviceAlarmRecord): AlarmTriggerCondition[] {
    if (alarm.triggerConditions?.length) {
        return alarm.triggerConditions;
    }

    const conditionTexts = parseConditionTextsFromContent(alarm.content);
    return conditionTexts.map((condition) => ({
        deviceName: alarm.deviceName,
        deviceCode: alarm.deviceCode,
        productId: alarm.productId,
        space: alarm.space,
        condition,
    }));
}

export function resolveAlarmTriggerContent(alarm: DeviceAlarmRecord) {
    const conditions = resolveAlarmTriggerConditions(alarm);
    return `触发条件为:${conditions.map((item) => item.condition).join('；')}`;
}

function createDefaultWorkOrder(alarm: DeviceAlarmRecord): AlarmWorkOrder {
    const handler = alarm.processStatus === '处理中' ? '李四' : undefined;
    return {
        id: 'O202509122023',
        name: alarm.eventName,
        createdAt: '2025-07-01 12:00:30',
        level: alarm.level,
        content: '请尽快排除原因，修复问题',
        assignees: handler ? [handler] : [],
        handler,
    };
}

export function resolveAlarmWorkOrder(alarm: DeviceAlarmRecord): AlarmWorkOrder | null {
    if (alarm.processStatus === '处理中' || alarm.processMethod === '工单处理') {
        return alarm.workOrder ?? createDefaultWorkOrder(alarm);
    }
    return alarm.workOrder ?? null;
}

export function shouldShowWorkOrderSection(alarm: DeviceAlarmRecord) {
    return alarm.processStatus === '处理中'
        || (alarm.processStatus === '已处理' && alarm.processMethod === '工单处理');
}

export function shouldShowReleaseTimeInAlarmInfo(alarm: DeviceAlarmRecord) {
    return alarm.processStatus === '已处理' && !!alarm.releaseTime;
}

export function resolveAutoRecoveryResult(alarm: DeviceAlarmRecord) {
    return alarm.processResult ?? '自动恢复数据';
}

export function resolveAutoRecoveryProcessTime(alarm: DeviceAlarmRecord) {
    return alarm.processTime ?? alarm.releaseTime ?? '—';
}

export function normalizeDeviceAlarm(alarm: DeviceAlarmRecord): DeviceAlarmRecord {
    const normalized: DeviceAlarmRecord = {
        ...alarm,
        content: resolveAlarmTriggerContent(alarm),
    };

    if (normalized.processStatus === '处理中') {
        const { releaseTime: _releaseTime, ...processingAlarm } = normalized;
        const workOrder = processingAlarm.workOrder ?? createDefaultWorkOrder(processingAlarm);
        return {
            ...processingAlarm,
            processMethod: '工单处理',
            workOrder: {
                ...workOrder,
                name: workOrder.name ?? processingAlarm.eventName,
                assignees: workOrder.assignees?.length
                    ? workOrder.assignees
                    : (workOrder.handler ? [workOrder.handler] : ['李四']),
            },
        };
    }

    return normalized;
}

const WATER_PRESSURE_CONDITIONS: Omit<AlarmTriggerCondition, 'productId'>[] = [
    {
        deviceName: 'YBF-YLJ-01',
        deviceCode: 'YBF-YLJ-01',
        productName: '压力计',
        space: '一泵房',
        condition: '水压值 > 4MPa',
    },
    {
        deviceName: 'YBF-YLJ-02',
        deviceCode: 'YBF-YLJ-02',
        productName: '压力计',
        space: '一泵房',
        condition: '水压值 > 5MPa',
    },
];

type AlarmSeed = Omit<DeviceAlarmRecord, 'productId' | 'triggerConditions'> & {
    productIndex: number;
    triggerConditions?: Omit<AlarmTriggerCondition, 'productId'>[];
};

const ALARM_SEEDS: AlarmSeed[] = [
    {
        id: 'alarm-1',
        eventName: '大表设备离线告警',
        level: '重要',
        deviceName: '大表-主管网-001',
        deviceCode: 'DB000001',
        productIndex: 0,
        space: '主管网',
        readStatus: '未读',
        processStatus: '未处理',
        triggerMethod: '设备状态触发',
        processMethod: '直接处理',
        content: '触发条件为:设备在/离线状态 = 离线',
        triggeredAt: '2025-09-10 10:23:40',
    },
    {
        id: 'alarm-2',
        eventName: '水压阈值告警',
        level: '紧急',
        deviceName: '压力计-泵站-001',
        deviceCode: 'YL000001',
        productIndex: 8,
        space: '泵站',
        readStatus: '已读',
        processStatus: '未处理',
        triggerMethod: '数据条件判断触发',
        processMethod: '直接处理',
        content: '触发条件为:水压值 > 4MPa；水压值 > 5MPa',
        triggeredAt: '2025-09-08 17:00:00',
        triggerConditions: WATER_PRESSURE_CONDITIONS,
        triggerLogic: '多条件并集触发',
    },
    {
        id: 'alarm-3',
        eventName: '水压阈值告警',
        level: '紧急',
        deviceName: '压力计-泵站-001',
        deviceCode: 'YL000001',
        productIndex: 8,
        space: '泵站',
        readStatus: '已读',
        processStatus: '处理中',
        triggerMethod: '数据条件判断触发',
        processMethod: '工单处理',
        content: '触发条件为:水压值 > 4MPa；水压值 > 5MPa',
        triggeredAt: '2025-09-09 17:45:00',
        triggerConditions: WATER_PRESSURE_CONDITIONS,
        triggerLogic: '多条件交集触发',
        workOrder: {
            id: 'O202509122023',
            name: '水压阈值告警',
            createdAt: '2025-07-01 12:00:30',
            level: '紧急',
            content: '请尽快排除原因，修复问题',
            assignees: ['李四', '王五'],
        },
    },
    {
        id: 'alarm-4',
        eventName: '水质超标告警',
        level: '提示',
        deviceName: '水质仪-监测点-001',
        deviceCode: 'SZY000001',
        productIndex: 12,
        space: '监测点',
        readStatus: '已读',
        processStatus: '已处理',
        triggerMethod: '数据条件判断触发',
        processMethod: '直接处理',
        content: '触发条件为:浊度 > 0.4NTU',
        triggeredAt: '2025-09-09 18:30:05',
        processHandler: '张三',
        processTime: '2025-07-01 12:20:00',
        processResult: '已安排人员处理，现已恢复！',
        processAttachmentCount: 2,
        releaseTime: '2025-07-01 12:30:20',
    },
    {
        id: 'alarm-5',
        eventName: '智慧水站通信中断',
        level: '紧急',
        deviceName: '智慧水站-配水站-001',
        deviceCode: 'ZHSZ000001',
        productIndex: 19,
        space: '配水站',
        readStatus: '未读',
        processStatus: '未处理',
        triggerMethod: '设备状态触发',
        processMethod: '直接处理',
        content: '触发条件为:网关心跳超时 > 5min',
        triggeredAt: '2025-09-09 16:12:33',
    },
    {
        id: 'alarm-6',
        eventName: '大表读数异常',
        level: '重要',
        deviceName: '大表-工业园区-002',
        deviceCode: 'DB000002',
        productIndex: 0,
        space: '工业园区',
        readStatus: '已读',
        processStatus: '已处理',
        triggerMethod: '属性数据上报时触发',
        processMethod: '自动恢复',
        content: '触发条件为:读数突变 > 50%',
        triggeredAt: '2025-09-09 14:08:47',
        processTime: '2025-07-01 12:20:00',
        releaseTime: '2025-07-01 12:30:20',
        processResult: '自动恢复数据',
    },
    {
        id: 'alarm-7',
        eventName: '压力计低电量告警',
        level: '提示',
        deviceName: '压力计-二供泵房-003',
        deviceCode: 'YL000003',
        productIndex: 8,
        space: '二供泵房',
        readStatus: '未读',
        processStatus: '未处理',
        triggerMethod: '事件上报时触发',
        processMethod: '直接处理',
        content: '触发条件为:电池电量 < 20%',
        triggeredAt: '2025-09-09 11:55:12',
    },
    {
        id: 'alarm-8',
        eventName: '户表离线告警',
        level: '次要',
        deviceName: '户表-小区一号-002',
        deviceCode: 'HB000002',
        productIndex: 4,
        space: '小区一号',
        readStatus: '已读',
        processStatus: '处理中',
        triggerMethod: '设备状态触发',
        processMethod: '工单处理',
        content: '触发条件为:设备在/离线状态 = 离线',
        triggeredAt: '2025-09-08 22:18:56',
        workOrder: {
            id: 'O202509122024',
            name: '户表离线告警',
            createdAt: '2025-07-01 12:00:30',
            level: '次要',
            content: '请尽快排除原因，修复问题',
            assignees: ['王五'],
        },
    },
    {
        id: 'alarm-9',
        eventName: '水质仪故障',
        level: '重要',
        deviceName: '水质仪-供水厂-002',
        deviceCode: 'SZY000002',
        productIndex: 12,
        space: '供水厂',
        readStatus: '已读',
        processStatus: '处理中',
        triggerMethod: '事件上报时触发',
        processMethod: '工单处理',
        content: '触发条件为:传感器故障码 - E102',
        triggeredAt: '2025-09-08 19:40:28',
        workOrder: {
            id: 'O202509122025',
            name: '水质仪故障',
            createdAt: '2025-07-01 12:00:30',
            level: '重要',
            content: '请尽快排除原因，修复问题',
            assignees: ['赵六', '张三'],
        },
    },
    {
        id: 'alarm-10',
        eventName: '水压阈值告警',
        level: '紧急',
        deviceName: '压力计-泵站-001',
        deviceCode: 'YL000001',
        productIndex: 8,
        space: '泵站',
        readStatus: '已读',
        processStatus: '已处理',
        triggerMethod: '数据条件判断触发',
        processMethod: '工单处理',
        content: '触发条件为:水压值 > 4MPa；水压值 > 5MPa',
        triggeredAt: '2025-09-08 15:27:09',
        releaseTime: '2025-07-01 12:30:20',
        triggerConditions: WATER_PRESSURE_CONDITIONS,
        triggerLogic: '多条件交集触发',
        workOrder: {
            id: 'O202509122023',
            name: '水压阈值告警',
            createdAt: '2025-07-01 12:00:30',
            level: '紧急',
            content: '请尽快排除原因，修复问题',
            assignees: ['张三', '李四'],
            handler: '张三',
            handledAt: '2025-07-01 12:20:00',
            result: '已安排人员处理，现已恢复！',
            attachmentCount: 2,
        },
    },
];

export function createInitialDeviceAlarms(products: ProductRecord[]): DeviceAlarmRecord[] {
    if (!products.length) return [];

    return ALARM_SEEDS.map((seed) => {
        const { productIndex, triggerConditions, ...alarm } = seed;
        const product = products[productIndex % products.length];
        return normalizeDeviceAlarm({
            ...alarm,
            productId: product.id,
            triggerConditions: triggerConditions?.map((condition) => ({
                ...condition,
                productId: product.id,
            })),
        });
    });
}
