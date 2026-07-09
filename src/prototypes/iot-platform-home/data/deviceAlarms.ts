import type { ProductRecord } from './products';
import type { DeviceRecord } from './devices';
import { findPlatformDeviceForLargeMeter, syncLargeMeterDeviceCodes } from './devices';
import { isLargeMeterProduct } from './productCategories';
import {
    ALARM_TYPE_OPTIONS,
    createInitialAreas,
    createInitialLargeMeters,
    getAreaPath,
    type LargeMeterDevice,
} from './largeMeters';

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

export const ALARM_LEVEL_COLORS: Record<AlarmLevel, string> = {
    紧急: '#f66d5c',
    重要: '#f6a54b',
    次要: '#f7d149',
    提示: '#4f82eb',
};

export const ALARM_LEVEL_ORDER: AlarmLevel[] = ['紧急', '重要', '次要', '提示'];

export function filterAlarmsByDevice(
    alarms: DeviceAlarmRecord[],
    device: { code: string } | null | undefined,
) {
    if (!device) return [];
    return alarms.filter((alarm) => alarm.deviceCode === device.code);
}

/** 告警触发设备编号与设备管理保持一致 */
export function resolveDeviceByAlarmCode(
    deviceCode: string,
    devices: DeviceRecord[],
): DeviceRecord | null {
    return devices.find((device) => device.code === deviceCode) ?? null;
}

export function buildPendingAlarmLevelLegend(alarms: DeviceAlarmRecord[]) {
    const pending = alarms.filter((alarm) => alarm.processStatus !== '已处理');
    const counts = ALARM_LEVEL_ORDER.map((level) => ({
        label: level,
        value: pending.filter((alarm) => alarm.level === level).length,
        color: ALARM_LEVEL_COLORS[level],
    }));
    return counts.filter((item) => item.value > 0);
}

export function buildPendingAlarmLevelCounts(alarms: DeviceAlarmRecord[]) {
    const pending = alarms.filter((alarm) => alarm.processStatus !== '已处理');
    return ALARM_LEVEL_ORDER.map((level) => ({
        level,
        count: pending.filter((alarm) => alarm.level === level).length,
        color: ALARM_LEVEL_COLORS[level],
    }));
}

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

export function formatAlarmTriggerContentListDisplay(content: string, maxLength = 25) {
    if (content.length <= maxLength) return content;
    return `${content.slice(0, maxLength)}...`;
}

export function resolveAlarmTriggerContentListDisplay(alarm: DeviceAlarmRecord, maxLength = 25) {
    return formatAlarmTriggerContentListDisplay(resolveAlarmTriggerContent(alarm), maxLength);
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
    {
        id: 'alarm-11',
        eventName: '大表流量异常告警',
        level: '紧急',
        deviceName: '大表-主管网-001',
        deviceCode: 'DB000001',
        productIndex: 0,
        space: '主管网',
        readStatus: '未读',
        processStatus: '未处理',
        triggerMethod: '数据条件判断触发',
        processMethod: '直接处理',
        content: '触发条件为:瞬时流量 > 120m³/h',
        triggeredAt: '2025-09-10 09:18:22',
    },
    {
        id: 'alarm-12',
        eventName: '大表漏水告警',
        level: '重要',
        deviceName: '大表-主管网-001',
        deviceCode: 'DB000001',
        productIndex: 0,
        space: '主管网',
        readStatus: '未读',
        processStatus: '未处理',
        triggerMethod: '事件上报时触发',
        processMethod: '直接处理',
        content: '触发条件为:漏水检测状态 = 异常',
        triggeredAt: '2025-09-10 08:45:10',
    },
    {
        id: 'alarm-13',
        eventName: '大表读数突变告警',
        level: '重要',
        deviceName: '大表-主管网-001',
        deviceCode: 'DB000001',
        productIndex: 0,
        space: '主管网',
        readStatus: '已读',
        processStatus: '未处理',
        triggerMethod: '属性数据上报时触发',
        processMethod: '直接处理',
        content: '触发条件为:读数突变 > 35%',
        triggeredAt: '2025-09-09 21:32:18',
    },
    {
        id: 'alarm-14',
        eventName: '大表电池低电量告警',
        level: '提示',
        deviceName: '大表-主管网-001',
        deviceCode: 'DB000001',
        productIndex: 0,
        space: '主管网',
        readStatus: '未读',
        processStatus: '未处理',
        triggerMethod: '事件上报时触发',
        processMethod: '直接处理',
        content: '触发条件为:电池电量 < 15%',
        triggeredAt: '2025-09-09 19:06:44',
    },
    {
        id: 'alarm-15',
        eventName: '大表通信超时告警',
        level: '紧急',
        deviceName: '大表-主管网-001',
        deviceCode: 'DB000001',
        productIndex: 0,
        space: '主管网',
        readStatus: '已读',
        processStatus: '处理中',
        triggerMethod: '设备状态触发',
        processMethod: '工单处理',
        content: '触发条件为:通信超时 > 10min',
        triggeredAt: '2025-09-09 16:40:55',
        workOrder: {
            id: 'O202509122026',
            name: '大表通信超时告警',
            createdAt: '2025-09-09 16:45:00',
            level: '紧急',
            content: '请排查通信链路并恢复上报',
            assignees: ['李四'],
        },
    },
    {
        id: 'alarm-16',
        eventName: '大表阀门异常告警',
        level: '次要',
        deviceName: '大表-主管网-001',
        deviceCode: 'DB000001',
        productIndex: 0,
        space: '主管网',
        readStatus: '已读',
        processStatus: '处理中',
        triggerMethod: '功能调用时触发',
        processMethod: '工单处理',
        content: '触发条件为:阀门状态 = 卡滞',
        triggeredAt: '2025-09-09 14:22:31',
        workOrder: {
            id: 'O202509122027',
            name: '大表阀门异常告警',
            createdAt: '2025-09-09 14:30:00',
            level: '次要',
            content: '请现场检查阀门执行机构',
            assignees: ['王五', '赵六'],
        },
    },
    {
        id: 'alarm-17',
        eventName: '大表反流量告警',
        level: '次要',
        deviceName: '大表-主管网-001',
        deviceCode: 'DB000001',
        productIndex: 0,
        space: '主管网',
        readStatus: '已读',
        processStatus: '已处理',
        triggerMethod: '数据条件判断触发',
        processMethod: '直接处理',
        content: '触发条件为:反向流量 > 0.5m³/h',
        triggeredAt: '2025-09-08 18:15:07',
        processHandler: '张三',
        processTime: '2025-09-08 18:40:00',
        processResult: '已确认管道回流，调整阀门后恢复',
        releaseTime: '2025-09-08 18:55:00',
    },
    {
        id: 'alarm-18',
        eventName: '大表温度异常告警',
        level: '提示',
        deviceName: '大表-主管网-001',
        deviceCode: 'DB000001',
        productIndex: 0,
        space: '主管网',
        readStatus: '已读',
        processStatus: '已处理',
        triggerMethod: '数据条件判断触发',
        processMethod: '自动恢复',
        content: '触发条件为:设备温度 > 55℃',
        triggeredAt: '2025-09-08 11:08:26',
        processTime: '2025-09-08 11:25:00',
        releaseTime: '2025-09-08 11:30:00',
        processResult: '自动恢复数据',
    },
    {
        id: 'alarm-19',
        eventName: '大表固件版本过低',
        level: '提示',
        deviceName: '大表-主管网-001',
        deviceCode: 'DB000001',
        productIndex: 0,
        space: '主管网',
        readStatus: '未读',
        processStatus: '未处理',
        triggerMethod: '属性数据上报时触发',
        processMethod: '直接处理',
        content: '触发条件为:固件版本 < V2.3.0',
        triggeredAt: '2025-09-07 15:33:19',
    },
    {
        id: 'alarm-20',
        eventName: '大表数据上报延迟',
        level: '重要',
        deviceName: '大表-主管网-001',
        deviceCode: 'DB000001',
        productIndex: 0,
        space: '主管网',
        readStatus: '已读',
        processStatus: '已处理',
        triggerMethod: '设备状态触发',
        processMethod: '工单处理',
        content: '触发条件为:上报延迟 > 30min',
        triggeredAt: '2025-09-07 09:12:48',
        releaseTime: '2025-09-07 10:05:00',
        workOrder: {
            id: 'O202509122028',
            name: '大表数据上报延迟',
            createdAt: '2025-09-07 09:20:00',
            level: '重要',
            content: '请检查采集频率与网络链路',
            assignees: ['张三'],
            handler: '张三',
            handledAt: '2025-09-07 09:55:00',
            result: '网络波动导致，已恢复上报',
        },
    },
    {
        id: 'alarm-21',
        eventName: '大表拆表告警',
        level: '紧急',
        deviceName: '大表-工业园区-002',
        deviceCode: 'DB000002',
        productIndex: 0,
        space: '工业园区',
        readStatus: '未读',
        processStatus: '未处理',
        triggerMethod: '事件上报时触发',
        processMethod: '直接处理',
        content: '触发条件为:拆表检测 = 触发',
        triggeredAt: '2025-09-10 07:56:03',
    },
    {
        id: 'alarm-22',
        eventName: '大表夜间流量异常',
        level: '重要',
        deviceName: '大表-工业园区-002',
        deviceCode: 'DB000002',
        productIndex: 0,
        space: '工业园区',
        readStatus: '已读',
        processStatus: '未处理',
        triggerMethod: '数据条件判断触发',
        processMethod: '直接处理',
        content: '触发条件为:夜间最小流量 > 8m³/h',
        triggeredAt: '2025-09-09 06:18:40',
    },
    {
        id: 'alarm-23',
        eventName: '大表压力波动告警',
        level: '次要',
        deviceName: '大表-工业园区-002',
        deviceCode: 'DB000002',
        productIndex: 0,
        space: '工业园区',
        readStatus: '已读',
        processStatus: '处理中',
        triggerMethod: '数据条件判断触发',
        processMethod: '工单处理',
        content: '触发条件为:压力波动率 > 20%',
        triggeredAt: '2025-09-08 13:44:12',
        workOrder: {
            id: 'O202509122029',
            name: '大表压力波动告警',
            createdAt: '2025-09-08 14:00:00',
            level: '次要',
            content: '请排查管网压力稳定性',
            assignees: ['李四'],
        },
    },
];

type LargeMeterAlarmTemplate = {
    level: AlarmLevel;
    triggerMethod: AlarmTriggerMethod;
    processMethod: AlarmProcessMethod;
    content: string;
};

/** 大表告警规则分类（含离线），与告警规则配置分类树一致 */
const LARGE_METER_ALARM_CATEGORY_OPTIONS = ['离线', ...ALARM_TYPE_OPTIONS] as const;

type LargeMeterAlarmCategory = (typeof LARGE_METER_ALARM_CATEGORY_OPTIONS)[number];

const LARGE_METER_ALARM_TEMPLATES: Record<LargeMeterAlarmCategory, LargeMeterAlarmTemplate> = {
    离线: {
        level: '重要',
        triggerMethod: '设备状态触发',
        processMethod: '工单处理',
        content: '设备与平台通信中断超过 30 分钟',
    },
    反向流量: {
        level: '次要',
        triggerMethod: '数据条件判断触发',
        processMethod: '直接处理',
        content: '反向流量 > 0.8m³/h',
    },
    低电压告警: {
        level: '提示',
        triggerMethod: '事件上报时触发',
        processMethod: '直接处理',
        content: '电池电压 < 3.2V',
    },
    大流告警: {
        level: '紧急',
        triggerMethod: '数据条件判断触发',
        processMethod: '直接处理',
        content: '瞬时流量 > 150m³/h',
    },
    持续用水: {
        level: '重要',
        triggerMethod: '数据条件判断触发',
        processMethod: '工单处理',
        content: '连续用水时长 > 6h',
    },
    识别不一致: {
        level: '重要',
        triggerMethod: '属性数据上报时触发',
        processMethod: '直接处理',
        content: '表身号识别与用户档案不一致',
    },
    连续三天未上报: {
        level: '紧急',
        triggerMethod: '设备状态触发',
        processMethod: '工单处理',
        content: '连续 72h 未收到上报数据',
    },
};

function resolveLargeMeterSpace(areaId: string, areas: ReturnType<typeof createInitialAreas>) {
    if (!areaId) return '未分配区域';
    const path = getAreaPath(areas, areaId);
    return path || '未分配区域';
}

function pickAlarmTypesForMeter(meter: LargeMeterDevice, meterIndex: number): LargeMeterAlarmCategory[] {
    const result: LargeMeterAlarmCategory[] = [];

    if (meter.status === '离线') {
        result.push('离线');
    }
    if (
        meter.alarmType
        && LARGE_METER_ALARM_CATEGORY_OPTIONS.includes(meter.alarmType as LargeMeterAlarmCategory)
    ) {
        result.push(meter.alarmType as LargeMeterAlarmCategory);
    }

    for (let i = 0; result.length < 3; i += 1) {
        const type = LARGE_METER_ALARM_CATEGORY_OPTIONS[(meterIndex + i) % LARGE_METER_ALARM_CATEGORY_OPTIONS.length];
        if (!result.includes(type)) {
            result.push(type);
        }
    }

    if (meterIndex % 4 === 0) {
        const extra = LARGE_METER_ALARM_CATEGORY_OPTIONS[
            (meterIndex + 5) % LARGE_METER_ALARM_CATEGORY_OPTIONS.length
        ];
        if (!result.includes(extra)) {
            result.push(extra);
        }
    }

    return result;
}

function buildLargeMeterAlarms(productId: string, devices: DeviceRecord[]): DeviceAlarmRecord[] {
    const areas = createInitialAreas();
    const meters = syncLargeMeterDeviceCodes(createInitialLargeMeters(), devices);
    const processStatuses: AlarmProcessStatus[] = ['未处理', '处理中', '已处理'];
    const alarms: DeviceAlarmRecord[] = [];
    let alarmSeq = 0;

    meters.forEach((meter, meterIndex) => {
        const alarmTypes = pickAlarmTypesForMeter(meter, meterIndex);

        alarmTypes.forEach((alarmType, typeIndex) => {
            alarmSeq += 1;
            const template = LARGE_METER_ALARM_TEMPLATES[alarmType];
            const processStatus = processStatuses[(meterIndex + typeIndex) % processStatuses.length];
            const day = 10 + ((meterIndex + typeIndex) % 8);
            const hour = 6 + ((meterIndex * 2 + typeIndex * 3) % 16);
            const minute = (meterIndex * 11 + typeIndex * 17) % 60;
            const second = (meterIndex * 7 + typeIndex * 13) % 60;
            const triggeredAt = `2026-06-${String(day).padStart(2, '0')} `
                + `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:`
                + `${String(second).padStart(2, '0')}`;
            const processTime = processStatus === '已处理'
                ? `2026-06-${String(day).padStart(2, '0')} ${String(Math.min(23, hour + 1)).padStart(2, '0')}:20:00`
                : undefined;

            // 尝试从设备管理中查找匹配的大表设备
            const linkedDevice = findPlatformDeviceForLargeMeter(meter, devices);
            const finalDeviceName = linkedDevice?.name ?? meter.name;
            const finalDeviceCode = linkedDevice?.code ?? meter.code;

            alarms.push(normalizeDeviceAlarm({
                id: `alarm-lm-${meterIndex + 1}-${typeIndex + 1}`,
                eventName: alarmType,
                level: template.level,
                deviceName: finalDeviceName,
                deviceCode: finalDeviceCode,
                productId,
                space: resolveLargeMeterSpace(meter.areaId, areas),
                readStatus: (meterIndex + typeIndex) % 2 === 0 ? '未读' : '已读',
                processStatus,
                triggerMethod: template.triggerMethod,
                processMethod: processStatus === '处理中' ? '工单处理' : template.processMethod,
                content: `触发条件为:${template.content}`,
                triggeredAt,
                processHandler: processStatus === '已处理' ? '张三' : undefined,
                processTime,
                processResult: processStatus === '已处理' ? '现场核查后已恢复正常' : undefined,
                releaseTime: processStatus === '已处理' ? processTime : undefined,
                workOrder: processStatus === '处理中' ? {
                    id: `O202606${String(alarmSeq).padStart(4, '0')}`,
                    name: `${alarmType}告警`,
                    createdAt: triggeredAt,
                    level: template.level,
                    content: '请尽快排查并恢复设备正常上报',
                    assignees: typeIndex % 2 === 0 ? ['李四', '王五'] : ['王五'],
                } : undefined,
            }));
        });
    });

    return alarms;
}

export function createInitialDeviceAlarms(products: ProductRecord[], devices: DeviceRecord[]): DeviceAlarmRecord[] {
    if (!products.length) return [];

    // 构建设备编号到设备记录的映射
    const deviceByCode = new Map<string, DeviceRecord>();
    devices.forEach((device) => {
        deviceByCode.set(device.code, device);
    });

    const seededAlarms = ALARM_SEEDS.map((seed) => {
        const { productIndex, triggerConditions, ...alarm } = seed;
        const product = products[productIndex % products.length];

        // 尝试从设备数据中获取设备名称和设备编号
        const matchedDevice = deviceByCode.get(alarm.deviceCode);
        const finalDeviceName = matchedDevice ? matchedDevice.name : alarm.deviceName;
        const finalDeviceCode = matchedDevice ? matchedDevice.code : alarm.deviceCode;

        return normalizeDeviceAlarm({
            ...alarm,
            deviceName: finalDeviceName,
            deviceCode: finalDeviceCode,
            productId: product.id,
            triggerConditions: triggerConditions?.map((condition) => ({
                ...condition,
                productId: product.id,
            })),
        });
    });

    const largeMeterProduct = products.find((product) => isLargeMeterProduct(product)) ?? products[0];
    const largeMeterAlarms = buildLargeMeterAlarms(largeMeterProduct.id, devices);

    return [...seededAlarms, ...largeMeterAlarms];
}
