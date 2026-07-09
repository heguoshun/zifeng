import type { AlarmTriggerMethod } from './deviceAlarms';
import { createInitialAlarmLevels, type AlarmLevelRecord } from './alarmLevels';
import type { TreeSelectNode } from './orgHierarchy';

export type AlarmRuleCategory = {
    id: string;
    parentId: string | null;
    name: string;
};

export type AlarmRuleCategoryNode = AlarmRuleCategory & {
    children?: AlarmRuleCategoryNode[];
};

export type AlarmRuleEditMode = '触发条件设置' | 'SQL语句编辑';

export type AlarmConditionLimitMode = '部分条件满足' | '全部条件满足';

export type AlarmRuleDelayUnit = '分钟' | '小时' | '秒' | '天';

export type AlarmRuleValueMethod =
    | '原始值'
    | '差值'
    | '动态值'
    | '最大值'
    | '最小值'
    | '平均值';

export type AlarmRuleJudgeOperator = '>' | '<' | '=' | '>=' | '<=' | '!=';

export type AlarmPropertyReportCheckType = '属性变更' | '非整点上报';

export type AlarmPropertyReportTimeSource = '数据时间' | '收到时间';

export type AlarmPropertyReportToleranceUnit = '秒' | '分钟';

export type AlarmRuleConditionItem = {
    id: string;
    productId: string;
    spaceId: string;
    deviceIds: string[];
    triggerCondition: string;
    delayValue: string;
    delayUnit: AlarmRuleDelayUnit;
    valueMethod: AlarmRuleValueMethod | '';
    propertyId: string;
    judgeOperator: AlarmRuleJudgeOperator | '';
    judgeValue: string;
    judgeValueMin: string;
    judgeValueMax: string;
    samplePeriod: string;
    eventIds: string[];
    functionId: string;
    reportCheckType: AlarmPropertyReportCheckType | '';
    reportTimeSource: AlarmPropertyReportTimeSource | '';
    reportToleranceValue: string;
    reportToleranceUnit: AlarmPropertyReportToleranceUnit | '';
};

export type AlarmRepeatSuppressionMode = '抑制' | '规定时间内抑制' | '不抑制';

export type AlarmRuleLevelConditionConfig = {
    limitMode: AlarmConditionLimitMode;
    conditions: AlarmRuleConditionItem[];
    repeatSuppression: AlarmRepeatSuppressionMode;
    silenceTimeValue: string;
    silenceTimeUnit: AlarmRuleDelayUnit;
};

export type AlarmRuleConditionSettings = {
    activeLevelId: string;
    levels: Record<string, AlarmRuleLevelConditionConfig>;
};

export type AlarmRuleLevelSqlConfig = {
    sql: string;
};

export type AlarmRuleSqlSettings = {
    activeLevelId: string;
    levels: Record<string, AlarmRuleLevelSqlConfig>;
};

export const ALARM_RULE_DEFAULT_SQL_TEMPLATE = `-- 工具暂时仅对MySQL的SQL友好
DELETE FROM table1
WHERE NOT EXISTS (SELECT * FROM table2 WHERE table1.field1=table2.field1);`;

export const ALARM_RULE_SQL_DEBUG_SAMPLE_INPUT = `{
  "deviceId": 123,
  "productId": "00001",
  "deviceName": "iot-0001",
  "messageType": "lifeCycle",
  "data": {
    "status": "online",
    "time": 1524448722123
  }
}`;

/** @deprecated 旧版按级别名称存储，仅用于迁移 */
type LegacyAlarmRuleConditionSettings = {
    activeLevel?: string;
    activeLevelId?: string;
    levels: Record<string, AlarmRuleLevelConditionConfig>;
};

export type AlarmRuleRecord = {
    id: string;
    categoryId: string;
    name: string;
    description: string;
    editMode: AlarmRuleEditMode;
    triggerMethods: AlarmTriggerMethod[];
    notifyAlarm: boolean;
    createWorkOrder: boolean;
    workOrderAssignees: string[];
    conditionSettings?: AlarmRuleConditionSettings;
    sqlSettings?: AlarmRuleSqlSettings;
    enabled: boolean;
    createdAt: string;
};

export const ALARM_CONDITION_LIMIT_OPTIONS = ['部分条件满足', '全部条件满足'] as const;

export const ALARM_RULE_DELAY_UNIT_OPTIONS = ['分钟', '小时', '秒', '天'] as const;

export const ALARM_REPEAT_SUPPRESSION_OPTIONS = ['抑制', '规定时间内抑制', '不抑制'] as const;

export const ALARM_RULE_VALUE_METHOD_OPTIONS = [
    '原始值',
    '差值',
    '动态值',
    '最大值',
    '最小值',
    '平均值',
] as const;

export const ALARM_RULE_JUDGE_OPERATOR_OPTIONS = ['>', '<', '=', '>=', '<=', '!='] as const;

export const ALARM_PROPERTY_REPORT_CHECK_TYPE_OPTIONS = ['属性变更', '非整点上报'] as const;

export const ALARM_PROPERTY_REPORT_TIME_SOURCE_OPTIONS = ['数据时间', '收到时间'] as const;

export const ALARM_PROPERTY_REPORT_TOLERANCE_UNIT_OPTIONS = ['秒', '分钟'] as const;

export const DEFAULT_OFF_HOUR_REPORT_TOLERANCE_VALUE = '5';

export const DEFAULT_OFF_HOUR_REPORT_TOLERANCE_UNIT: AlarmPropertyReportToleranceUnit = '秒';

export function isOffHourReportCheck(checkType: string): checkType is '非整点上报' {
    return checkType === '非整点上报';
}

export function resolveDataTimePropertyId(
    properties: { id: string; identifier?: string; name: string }[],
): string {
    const matched = properties.find((item) => (
        item.identifier === 'data_time' || item.name === '数据时间'
    ));
    return matched?.id ?? '';
}

export function formatOffHourReportConditionSummary(condition: AlarmRuleConditionItem): string {
    const tolerance = condition.reportToleranceValue.trim() || DEFAULT_OFF_HOUR_REPORT_TOLERANCE_VALUE;
    const unit = condition.reportToleranceUnit || DEFAULT_OFF_HOUR_REPORT_TOLERANCE_UNIT;
    const timeProperty = condition.reportTimeSource || '数据时间';
    return `非整点上报（时间属性：${timeProperty}，容差 ±${tolerance} ${unit}）`;
}

export const ALARM_RULE_SAMPLE_PERIOD_VALUE_METHODS = ['最大值', '最小值', '平均值'] as const;

export const ALARM_RULE_SAMPLE_PERIOD_OPTIONS = [
    '3个周期',
    '5个周期',
    '10个周期',
    '15个周期',
    '20个周期',
] as const;

export function isDynamicValueMethod(valueMethod: string) {
    return valueMethod === '动态值';
}

export function needsSamplePeriodValueMethod(valueMethod: string) {
    return (ALARM_RULE_SAMPLE_PERIOD_VALUE_METHODS as readonly string[]).includes(valueMethod);
}

export const ALARM_RULE_DEVICE_STATUS_TRIGGER_CONDITIONS = ['设备下线', '设备上线', '连续未上报'] as const;

export const ALARM_RULE_TRIGGER_CONDITION_OPTIONS = [
    '设备离线',
    '水压值 > 4MPa',
    '水压值 > 5MPa',
    '温度 > 40℃',
    '读数突变超过50%',
    '流量连续3次异常',
    '故障码E102上报',
] as const;

export const ALARM_RULE_EDIT_MODE_OPTIONS = ['触发条件设置', 'SQL语句编辑'] as const;

export const ALARM_RULE_DESCRIPTION_MAX = 100;

export const ALARM_RULE_STATUS_OPTIONS = ['全部', '启用', '禁用'] as const;

export const ALARM_RULE_TRIGGER_FILTER_OPTIONS = [
    '全部',
    '设备状态触发',
    '数据条件判断触发',
    '事件上报时触发',
    '功能调用时触发',
    '属性数据上报时触发',
] as const;

const INITIAL_CATEGORIES: AlarmRuleCategory[] = [
    { id: 'cat-large-meter', parentId: null, name: '大表' },
    { id: 'cat-large-offline', parentId: 'cat-large-meter', name: '离线' },
    { id: 'cat-large-reverse-flow', parentId: 'cat-large-meter', name: '反向流量' },
    { id: 'cat-large-low-voltage', parentId: 'cat-large-meter', name: '低电压告警' },
    { id: 'cat-large-high-flow', parentId: 'cat-large-meter', name: '大流告警' },
    { id: 'cat-large-continuous-usage', parentId: 'cat-large-meter', name: '持续用水' },
    { id: 'cat-large-identity-mismatch', parentId: 'cat-large-meter', name: '识别不一致' },
    { id: 'cat-large-no-report', parentId: 'cat-large-meter', name: '连续三天未上报' },
    { id: 'cat-large-off-hour', parentId: 'cat-large-meter', name: '非整点上报' },

    { id: 'cat-household-meter', parentId: null, name: '户表' },
    { id: 'cat-household-offline', parentId: 'cat-household-meter', name: '离线告警' },
    { id: 'cat-household-reading', parentId: 'cat-household-meter', name: '读数异常' },
    { id: 'cat-household-theft', parentId: 'cat-household-meter', name: '窃水监测' },

    { id: 'cat-pressure', parentId: null, name: '压力计' },
    { id: 'cat-pressure-offline', parentId: 'cat-pressure', name: '离线告警' },
    { id: 'cat-pressure-threshold', parentId: 'cat-pressure', name: '阈值告警' },
    { id: 'cat-pressure-fluctuation', parentId: 'cat-pressure', name: '波动异常' },

    { id: 'cat-water-quality', parentId: null, name: '水质分析仪' },
    { id: 'cat-water-quality-offline', parentId: 'cat-water-quality', name: '离线告警' },
    { id: 'cat-water-quality-limit', parentId: 'cat-water-quality', name: '指标超限' },
    { id: 'cat-water-quality-missing', parentId: 'cat-water-quality', name: '数据异常' },

    { id: 'cat-smart-station', parentId: null, name: '智慧水站' },
    { id: 'cat-smart-station-offline', parentId: 'cat-smart-station', name: '离线告警' },
    { id: 'cat-smart-station-device', parentId: 'cat-smart-station', name: '设备异常' },
    { id: 'cat-smart-station-security', parentId: 'cat-smart-station', name: '安防告警' },
];

const INITIAL_RULES: AlarmRuleRecord[] = [
    // 大表（属性上报：数据时间、累计流量、正向流量、反向流量、瞬时流量、电池电压、信号强度）
    {
        id: 'rule-large-7',
        categoryId: 'cat-large-offline',
        name: '大表离线告警',
        description: '平台判定设备离线且超过 30 分钟未恢复时触发',
        editMode: '触发条件设置',
        triggerMethods: ['设备状态触发'],
        notifyAlarm: true,
        createWorkOrder: true,
        workOrderAssignees: ['张三'],
        enabled: true,
        createdAt: '2025-06-10 07:30:00',
    },
    {
        id: 'rule-large-1',
        categoryId: 'cat-large-reverse-flow',
        name: '大表反向流量告警',
        description: '属性上报中反向流量超过 0.8m³/h，或检测到反向用水异常时触发',
        editMode: '触发条件设置',
        triggerMethods: ['数据条件判断触发'],
        notifyAlarm: true,
        createWorkOrder: false,
        workOrderAssignees: [],
        enabled: true,
        createdAt: '2025-06-10 08:12:30',
    },
    {
        id: 'rule-large-2',
        categoryId: 'cat-large-low-voltage',
        name: '大表低电压告警',
        description: '设备上报低电压告警事件，或属性上报中电池电压低于 3.2V 时触发',
        editMode: '触发条件设置',
        triggerMethods: ['事件上报时触发'],
        notifyAlarm: true,
        createWorkOrder: false,
        workOrderAssignees: [],
        enabled: true,
        createdAt: '2025-06-11 09:20:15',
    },
    {
        id: 'rule-large-3',
        categoryId: 'cat-large-high-flow',
        name: '大表大流告警',
        description: '属性上报中瞬时流量超过 150m³/h 时触发',
        editMode: '触发条件设置',
        triggerMethods: ['数据条件判断触发'],
        notifyAlarm: true,
        createWorkOrder: false,
        workOrderAssignees: [],
        enabled: true,
        createdAt: '2025-06-11 11:05:30',
    },
    {
        id: 'rule-large-4',
        categoryId: 'cat-large-continuous-usage',
        name: '大表持续用水告警',
        description: '连续用水时长超过 6 小时未停止时触发',
        editMode: '触发条件设置',
        triggerMethods: ['数据条件判断触发'],
        notifyAlarm: true,
        createWorkOrder: true,
        workOrderAssignees: ['李四'],
        enabled: true,
        createdAt: '2025-06-11 14:18:42',
    },
    {
        id: 'rule-large-5',
        categoryId: 'cat-large-identity-mismatch',
        name: '大表识别不一致告警',
        description: '设备上报表身号与用户档案信息不一致时触发',
        editMode: '触发条件设置',
        triggerMethods: ['属性数据上报时触发'],
        notifyAlarm: true,
        createWorkOrder: false,
        workOrderAssignees: [],
        enabled: true,
        createdAt: '2025-06-12 14:30:00',
    },
    {
        id: 'rule-large-6',
        categoryId: 'cat-large-no-report',
        name: '大表连续三天未上报告警',
        description: '连续 72 小时未收到设备上报数据时触发',
        editMode: '触发条件设置',
        triggerMethods: ['设备状态触发'],
        notifyAlarm: true,
        createWorkOrder: true,
        workOrderAssignees: ['张三'],
        enabled: true,
        createdAt: '2025-06-13 10:45:22',
    },
    {
        id: 'rule-large-off-hour',
        categoryId: 'cat-large-off-hour',
        name: '大表非整点上报告警',
        description: '属性上报的数据时间偏离整点超过容差范围时触发',
        editMode: '触发条件设置',
        triggerMethods: ['属性数据上报时触发'],
        notifyAlarm: true,
        createWorkOrder: false,
        workOrderAssignees: [],
        enabled: true,
        createdAt: '2025-06-14 09:15:00',
    },

    // 户表
    {
        id: 'rule-household-1',
        categoryId: 'cat-household-offline',
        name: '户表离线告警',
        description: '户表设备离线状态持续超过30分钟',
        editMode: '触发条件设置',
        triggerMethods: ['设备状态触发'],
        notifyAlarm: true,
        createWorkOrder: false,
        workOrderAssignees: [],
        enabled: true,
        createdAt: '2025-06-16 07:15:30',
    },
    {
        id: 'rule-household-2',
        categoryId: 'cat-household-offline',
        name: 'NB-IoT信号弱',
        description: 'RSRP低于-110dBm持续1小时触发信号质量告警',
        editMode: '触发条件设置',
        triggerMethods: ['属性数据上报时触发'],
        notifyAlarm: true,
        createWorkOrder: false,
        workOrderAssignees: [],
        enabled: true,
        createdAt: '2025-06-17 13:22:11',
    },
    {
        id: 'rule-household-3',
        categoryId: 'cat-household-reading',
        name: '户表读数异常',
        description: '读数突变超过50%或与上期差值异常',
        editMode: 'SQL语句编辑',
        triggerMethods: ['属性数据上报时触发'],
        notifyAlarm: true,
        createWorkOrder: true,
        workOrderAssignees: ['张三', '李四'],
        enabled: true,
        createdAt: '2025-06-18 09:15:42',
    },
    {
        id: 'rule-household-4',
        categoryId: 'cat-household-reading',
        name: '夜间异常用水',
        description: '凌晨2点至5点用水量超过日均夜间用水3倍',
        editMode: '触发条件设置',
        triggerMethods: ['数据条件判断触发'],
        notifyAlarm: true,
        createWorkOrder: true,
        workOrderAssignees: ['王五'],
        enabled: true,
        createdAt: '2025-06-19 22:40:00',
    },
    {
        id: 'rule-household-5',
        categoryId: 'cat-household-theft',
        name: '反向流量告警',
        description: '检测到反向累计流量增长触发窃水嫌疑告警',
        editMode: '触发条件设置',
        triggerMethods: ['数据条件判断触发'],
        notifyAlarm: true,
        createWorkOrder: true,
        workOrderAssignees: ['张三'],
        enabled: true,
        createdAt: '2025-06-20 15:30:18',
    },
    {
        id: 'rule-household-6',
        categoryId: 'cat-household-theft',
        name: '旁路用水告警',
        description: '进出口流量差值持续超过阈值判定旁路用水',
        editMode: '触发条件设置',
        triggerMethods: ['数据条件判断触发'],
        notifyAlarm: true,
        createWorkOrder: true,
        workOrderAssignees: ['李四'],
        enabled: false,
        createdAt: '2025-06-21 08:55:33',
    },

    // 压力计
    {
        id: 'rule-pressure-1',
        categoryId: 'cat-pressure-offline',
        name: '压力计离线告警',
        description: '压力计设备离线超过5分钟触发告警',
        editMode: '触发条件设置',
        triggerMethods: ['设备状态触发'],
        notifyAlarm: true,
        createWorkOrder: false,
        workOrderAssignees: [],
        enabled: true,
        createdAt: '2025-06-22 12:00:30',
    },
    {
        id: 'rule-pressure-2',
        categoryId: 'cat-pressure-threshold',
        name: '水压阈值告警',
        description: '水压值超过设定阈值时触发，适用于一泵房压力监测场景',
        editMode: '触发条件设置',
        triggerMethods: ['数据条件判断触发'],
        notifyAlarm: true,
        createWorkOrder: false,
        workOrderAssignees: [],
        enabled: true,
        createdAt: '2025-06-23 12:05:18',
    },
    {
        id: 'rule-pressure-3',
        categoryId: 'cat-pressure-threshold',
        name: '低压告警',
        description: '管网压力低于0.15MPa持续10分钟触发低压告警',
        editMode: '触发条件设置',
        triggerMethods: ['数据条件判断触发'],
        notifyAlarm: true,
        createWorkOrder: true,
        workOrderAssignees: ['张三'],
        enabled: true,
        createdAt: '2025-06-24 06:30:00',
    },
    {
        id: 'rule-pressure-4',
        categoryId: 'cat-pressure-threshold',
        name: '高压告警',
        description: '管网压力高于0.6MPa持续5分钟触发高压告警',
        editMode: '触发条件设置',
        triggerMethods: ['数据条件判断触发'],
        notifyAlarm: true,
        createWorkOrder: true,
        workOrderAssignees: ['李四'],
        enabled: true,
        createdAt: '2025-06-25 18:20:45',
    },
    {
        id: 'rule-pressure-5',
        categoryId: 'cat-pressure-fluctuation',
        name: '压力波动异常',
        description: '1小时内压力波动幅度超过0.2MPa触发稳定性告警',
        editMode: '触发条件设置',
        triggerMethods: ['数据条件判断触发'],
        notifyAlarm: true,
        createWorkOrder: false,
        workOrderAssignees: [],
        enabled: true,
        createdAt: '2025-06-26 14:10:22',
    },

    // 水质分析仪
    {
        id: 'rule-quality-1',
        categoryId: 'cat-water-quality-offline',
        name: '水质仪离线告警',
        description: '水质分析仪离线超过15分钟触发告警',
        editMode: '触发条件设置',
        triggerMethods: ['设备状态触发'],
        notifyAlarm: true,
        createWorkOrder: false,
        workOrderAssignees: [],
        enabled: true,
        createdAt: '2025-06-27 09:00:00',
    },
    {
        id: 'rule-quality-2',
        categoryId: 'cat-water-quality-limit',
        name: '余氯超限告警',
        description: '出厂水余氯低于0.3mg/L或高于4mg/L触发告警',
        editMode: '触发条件设置',
        triggerMethods: ['数据条件判断触发'],
        notifyAlarm: true,
        createWorkOrder: true,
        workOrderAssignees: ['张三', '王五'],
        enabled: true,
        createdAt: '2025-06-28 10:15:30',
    },
    {
        id: 'rule-quality-3',
        categoryId: 'cat-water-quality-limit',
        name: 'pH值异常',
        description: 'pH值超出6.5-8.5正常范围持续30分钟',
        editMode: '触发条件设置',
        triggerMethods: ['数据条件判断触发'],
        notifyAlarm: true,
        createWorkOrder: true,
        workOrderAssignees: ['李四'],
        enabled: true,
        createdAt: '2025-06-29 11:30:18',
    },
    {
        id: 'rule-quality-4',
        categoryId: 'cat-water-quality-limit',
        name: '浊度超标',
        description: '浊度超过1NTU持续20分钟触发水质异常告警',
        editMode: '触发条件设置',
        triggerMethods: ['数据条件判断触发'],
        notifyAlarm: true,
        createWorkOrder: false,
        workOrderAssignees: [],
        enabled: true,
        createdAt: '2025-06-30 15:45:42',
    },
    {
        id: 'rule-quality-5',
        categoryId: 'cat-water-quality-missing',
        name: '水质数据缺失',
        description: '连续2个采集周期未上报水质数据触发缺失告警',
        editMode: '触发条件设置',
        triggerMethods: ['属性数据上报时触发'],
        notifyAlarm: true,
        createWorkOrder: false,
        workOrderAssignees: [],
        enabled: true,
        createdAt: '2025-07-01 08:20:11',
    },

    // 智慧水站
    {
        id: 'rule-station-1',
        categoryId: 'cat-smart-station-offline',
        name: '水站离线告警',
        description: '智慧水站网关离线超过5分钟触发整站离线告警',
        editMode: '触发条件设置',
        triggerMethods: ['设备状态触发'],
        notifyAlarm: true,
        createWorkOrder: true,
        workOrderAssignees: ['张三'],
        enabled: true,
        createdAt: '2025-07-02 07:30:00',
    },
    {
        id: 'rule-station-2',
        categoryId: 'cat-smart-station-device',
        name: '泵站故障告警',
        description: '泵站运行状态上报故障码F201时触发',
        editMode: '触发条件设置',
        triggerMethods: ['事件上报时触发'],
        notifyAlarm: true,
        createWorkOrder: true,
        workOrderAssignees: ['李四', '王五'],
        enabled: true,
        createdAt: '2025-07-03 09:45:18',
    },
    {
        id: 'rule-station-3',
        categoryId: 'cat-smart-station-device',
        name: '加药设备异常',
        description: '加药泵电流异常或药剂余量低于10%',
        editMode: '触发条件设置',
        triggerMethods: ['数据条件判断触发'],
        notifyAlarm: true,
        createWorkOrder: true,
        workOrderAssignees: ['张三'],
        enabled: true,
        createdAt: '2025-07-04 13:10:33',
    },
    {
        id: 'rule-station-4',
        categoryId: 'cat-smart-station-security',
        name: '门禁异常告警',
        description: '非授权时段门禁开启或强行开门触发安防告警',
        editMode: '触发条件设置',
        triggerMethods: ['事件上报时触发'],
        notifyAlarm: true,
        createWorkOrder: true,
        workOrderAssignees: ['王五'],
        enabled: true,
        createdAt: '2025-07-05 22:15:00',
    },
    {
        id: 'rule-station-5',
        categoryId: 'cat-smart-station-security',
        name: '视频离线告警',
        description: '水站视频监控离线超过30分钟触发告警',
        editMode: '触发条件设置',
        triggerMethods: ['设备状态触发'],
        notifyAlarm: true,
        createWorkOrder: false,
        workOrderAssignees: [],
        enabled: false,
        createdAt: '2025-07-06 16:40:22',
    },
];

type MockCategoryBinding = {
    productId: string;
    deviceIds: string[];
    spaceId: string;
    propertyIds: {
        flow: string;
        pressure: string;
        battery: string;
        signal: string;
        ph: string;
        chlorine: string;
        turbidity: string;
        dataTime?: string;
        totalFlow?: string;
        forwardFlow?: string;
        reverseFlow?: string;
        instantFlow?: string;
        batteryVoltage?: string;
        signalStrength?: string;
    };
    eventIds: {
        fault: string;
        offline: string;
        flowAbnormal: string;
        security: string;
        pumpFault: string;
        emptyPipe?: string;
        lowBattery?: string;
        reverseFlow?: string;
        flowOverload?: string;
        motherboard?: string;
    };
    functionIds: {
        valve: string;
    };
};

function resolveMockCategoryBinding(categoryId: string): MockCategoryBinding {
    if (categoryId.includes('household')) {
        return {
            productId: '5',
            deviceIds: ['5'],
            spaceId: '',
            propertyIds: {
                flow: 'hb-p2',
                pressure: '',
                battery: 'hb-p4',
                signal: 'hb-p5',
                ph: '',
                chlorine: '',
                turbidity: '',
            },
            eventIds: {
                fault: 'hb-e2',
                offline: 'hb-e4',
                flowAbnormal: 'hb-e1',
                security: 'hb-e2',
                pumpFault: '',
            },
            functionIds: { valve: 'hb-f1' },
        };
    }

    if (categoryId.includes('pressure')) {
        return {
            productId: '9',
            deviceIds: ['9'],
            spaceId: '',
            propertyIds: {
                flow: '',
                pressure: 'yl-p1',
                battery: 'yl-p3',
                signal: 'yl-p4',
                ph: '',
                chlorine: '',
                turbidity: '',
            },
            eventIds: {
                fault: 'yl-e3',
                offline: 'yl-e4',
                flowAbnormal: 'yl-e1',
                security: '',
                pumpFault: '',
            },
            functionIds: { valve: 'yl-f1' },
        };
    }

    if (categoryId.includes('water-quality')) {
        return {
            productId: '13',
            deviceIds: ['13'],
            spaceId: '',
            propertyIds: {
                flow: '',
                pressure: '',
                battery: '',
                signal: '',
                ph: 'szy-p2',
                chlorine: 'szy-p3',
                turbidity: 'szy-p1',
            },
            eventIds: {
                fault: 'szy-e3',
                offline: 'szy-e4',
                flowAbnormal: 'szy-e1',
                security: '',
                pumpFault: '',
            },
            functionIds: { valve: 'szy-f1' },
        };
    }

    if (categoryId.includes('smart-station')) {
        return {
            productId: '17',
            deviceIds: ['17'],
            spaceId: '',
            propertyIds: {
                flow: 'zhsz-p2',
                pressure: 'zhsz-p1',
                battery: '',
                signal: '',
                ph: '',
                chlorine: 'zhsz-p4',
                turbidity: 'zhsz-p3',
            },
            eventIds: {
                fault: 'zhsz-e2',
                offline: 'zhsz-e3',
                flowAbnormal: 'zhsz-e1',
                security: 'zhsz-e2',
                pumpFault: 'zhsz-e1',
            },
            functionIds: { valve: 'zhsz-f1' },
        };
    }

    return {
        productId: '1',
        deviceIds: ['1'],
        spaceId: '',
        propertyIds: {
            flow: 'db-p5',
            pressure: '',
            battery: 'db-p6',
            signal: 'db-p7',
            ph: '',
            chlorine: '',
            turbidity: '',
            dataTime: 'db-p1',
            totalFlow: 'db-p2',
            forwardFlow: 'db-p3',
            reverseFlow: 'db-p4',
            instantFlow: 'db-p5',
            batteryVoltage: 'db-p6',
            signalStrength: 'db-p7',
        },
        eventIds: {
            fault: 'db-e6',
            offline: 'db-e3',
            flowAbnormal: 'db-e5',
            security: '',
            pumpFault: '',
            emptyPipe: 'db-e1',
            lowBattery: 'db-e2',
            reverseFlow: 'db-e4',
            flowOverload: 'db-e5',
            motherboard: 'db-e6',
        },
        functionIds: { valve: 'db-f1' },
    };
}

function createFilledAlarmRuleCondition(
    triggerMethod: AlarmTriggerMethod,
    categoryId: string,
    overrides: Partial<AlarmRuleConditionItem> = {},
): AlarmRuleConditionItem {
    const binding = resolveMockCategoryBinding(categoryId);
    const base: AlarmRuleConditionItem = {
        ...createEmptyAlarmRuleCondition(),
        productId: binding.productId,
        spaceId: binding.spaceId,
        deviceIds: binding.deviceIds,
        delayUnit: '分钟',
        ...overrides,
    };

    switch (triggerMethod) {
        case '设备状态触发':
            return {
                ...base,
                triggerCondition: overrides.triggerCondition ?? '设备下线',
                delayValue: overrides.delayValue ?? '5',
            };
        case '数据条件判断触发':
            return {
                ...base,
                valueMethod: overrides.valueMethod ?? '原始值',
                propertyId: overrides.propertyId ?? (
                    binding.propertyIds.pressure
                    || binding.propertyIds.flow
                    || binding.propertyIds.chlorine
                ),
                judgeOperator: overrides.judgeOperator ?? '>',
                judgeValue: overrides.judgeValue ?? '0.6',
                samplePeriod: overrides.samplePeriod ?? '',
            };
        case '事件上报时触发':
            return {
                ...base,
                eventIds: overrides.eventIds ?? [binding.eventIds.fault || binding.eventIds.flowAbnormal],
            };
        case '属性数据上报时触发': {
            const isOffHour = overrides.reportCheckType === '非整点上报';
            const propertyId = overrides.propertyId ?? (
                isOffHour
                    ? (binding.propertyIds.dataTime || binding.propertyIds.battery || binding.propertyIds.signal || binding.propertyIds.flow)
                    : (binding.propertyIds.battery || binding.propertyIds.signal || binding.propertyIds.flow)
            );
            const reportCheckType = overrides.reportCheckType
                ?? (propertyId ? '属性变更' : '');
            return {
                ...base,
                reportCheckType,
                reportTimeSource: reportCheckType === '非整点上报'
                    ? (overrides.reportTimeSource ?? '数据时间')
                    : '',
                reportToleranceValue: reportCheckType === '非整点上报'
                    ? (overrides.reportToleranceValue ?? DEFAULT_OFF_HOUR_REPORT_TOLERANCE_VALUE)
                    : '',
                reportToleranceUnit: reportCheckType === '非整点上报'
                    ? (overrides.reportToleranceUnit ?? DEFAULT_OFF_HOUR_REPORT_TOLERANCE_UNIT)
                    : '',
                propertyId,
            };
        }
        case '功能调用时触发':
            return {
                ...base,
                functionId: overrides.functionId ?? binding.functionIds.valve,
            };
        default:
            return {
                ...base,
                triggerCondition: overrides.triggerCondition ?? '水压值 > 4MPa',
                delayValue: overrides.delayValue ?? '10',
            };
    }
}

function createFilledAlarmRuleConditionSettings(
    rule: AlarmRuleRecord,
    alarmLevels: AlarmLevelRecord[],
): AlarmRuleConditionSettings {
    const triggerMethod = rule.triggerMethods[0] ?? '设备状态触发';
    const ruleOverrides = RULE_CONDITION_OVERRIDES[rule.id] ?? {};
    const levels = alarmLevels.reduce((acc, level, index) => {
        acc[level.id] = {
            limitMode: index % 2 === 0 ? '部分条件满足' : '全部条件满足',
            conditions: [
                createFilledAlarmRuleCondition(triggerMethod, rule.categoryId, {
                    delayValue: ['5', '10', '15', '30'][index % 4],
                    judgeValue: ['0.6', '0.15', '4', '1'][index % 4],
                    ...ruleOverrides,
                }),
            ],
            repeatSuppression: '不抑制',
            silenceTimeValue: '',
            silenceTimeUnit: '分钟',
        };
        return acc;
    }, {} as Record<string, AlarmRuleLevelConditionConfig>);

    return {
        activeLevelId: alarmLevels[0]?.id ?? '',
        levels,
    };
}

const RULE_CONDITION_OVERRIDES: Record<string, Partial<AlarmRuleConditionItem>> = {
    'rule-large-7': { triggerCondition: '设备下线', delayValue: '30', delayUnit: '分钟' },
    'rule-large-1': { propertyId: 'db-p4', judgeValue: '0.8', judgeOperator: '>' },
    'rule-large-2': { eventIds: ['db-e2'] },
    'rule-large-3': { propertyId: 'db-p5', judgeValue: '150', judgeOperator: '>' },
    'rule-large-4': {
        propertyId: 'db-p5',
        judgeValue: '0',
        judgeOperator: '>',
        valueMethod: '平均值',
        samplePeriod: '10个周期',
    },
    'rule-large-5': { propertyId: 'db-p1' },
    'rule-large-6': { triggerCondition: '设备下线', delayValue: '72', delayUnit: '小时' },
    'rule-large-off-hour': {
        reportCheckType: '非整点上报',
        reportTimeSource: '数据时间',
        reportToleranceValue: '5',
        reportToleranceUnit: '秒',
        propertyId: 'db-p1',
    },
    'rule-household-2': { propertyId: 'hb-p5' },
    'rule-household-4': { propertyId: 'hb-p2', judgeValue: '3', judgeOperator: '>' },
    'rule-household-5': { propertyId: 'hb-p2', judgeValue: '0', judgeOperator: '>' },
    'rule-pressure-2': { propertyId: 'yl-p1', judgeValue: '0.6' },
    'rule-pressure-3': { propertyId: 'yl-p1', judgeValue: '0.15', judgeOperator: '<' },
    'rule-pressure-4': { propertyId: 'yl-p1', judgeValue: '0.6' },
    'rule-pressure-5': { propertyId: 'yl-p1', judgeValue: '0.2' },
    'rule-quality-2': { propertyId: 'szy-p3', judgeValue: '4' },
    'rule-quality-3': { propertyId: 'szy-p2', judgeValue: '8.5' },
    'rule-quality-4': { propertyId: 'szy-p1', judgeValue: '1' },
    'rule-quality-5': { propertyId: 'szy-p3' },
    'rule-station-2': { eventIds: ['zhsz-e1'] },
    'rule-station-3': { propertyId: 'zhsz-p5', judgeValue: '10', judgeOperator: '<' },
    'rule-station-4': { eventIds: ['zhsz-e2'] },
    'rule-station-5': { delayValue: '30' },
};

const MOCK_SQL_BY_RULE: Record<string, string> = {
    'rule-household-3': `SELECT device_id, total_flow, lag_total_flow
FROM household_meter_stats
WHERE abs(total_flow - lag_total_flow) / lag_total_flow > 0.5;`,
};

function createFilledAlarmRuleSqlSettings(
    rule: AlarmRuleRecord,
    alarmLevels: AlarmLevelRecord[],
): AlarmRuleSqlSettings {
    const sql = MOCK_SQL_BY_RULE[rule.id] ?? ALARM_RULE_DEFAULT_SQL_TEMPLATE;
    const levels = alarmLevels.reduce((acc, level) => {
        acc[level.id] = { sql };
        return acc;
    }, {} as Record<string, AlarmRuleLevelSqlConfig>);

    return {
        activeLevelId: alarmLevels[0]?.id ?? '',
        levels,
    };
}

function enrichMockAlarmRule(rule: AlarmRuleRecord, alarmLevels: AlarmLevelRecord[]): AlarmRuleRecord {
    if (rule.editMode === 'SQL语句编辑') {
        return {
            ...rule,
            sqlSettings: createFilledAlarmRuleSqlSettings(rule, alarmLevels),
        };
    }

    return {
        ...rule,
        conditionSettings: createFilledAlarmRuleConditionSettings(rule, alarmLevels),
    };
}

export function isAlarmRuleConditionSettingsFilled(
    settings?: AlarmRuleConditionSettings,
): boolean {
    if (!settings?.levels) return false;
    return Object.values(settings.levels).some((config) =>
        config.conditions.some((item) => Boolean(item.productId && item.deviceIds.length > 0)),
    );
}

export function ensureAlarmRuleMockSettings(
    rule: AlarmRuleRecord,
    alarmLevels: AlarmLevelRecord[],
): AlarmRuleRecord {
    if (rule.editMode === 'SQL语句编辑') {
        if (rule.sqlSettings !== undefined) {
            return {
                ...rule,
                sqlSettings: syncAlarmRuleSqlSettings(rule.sqlSettings, alarmLevels),
            };
        }
        return { ...rule, sqlSettings: createFilledAlarmRuleSqlSettings(rule, alarmLevels) };
    }

    if (rule.conditionSettings !== undefined) {
        return {
            ...rule,
            conditionSettings: syncAlarmRuleConditionSettings(rule.conditionSettings, alarmLevels),
        };
    }

    return {
        ...rule,
        conditionSettings: createFilledAlarmRuleConditionSettings(rule, alarmLevels),
    };
}

export function resolveAlarmRuleEditFormSettings(
    rule: AlarmRuleRecord,
    alarmLevels: AlarmLevelRecord[],
): Pick<AlarmRuleRecord, 'conditionSettings' | 'sqlSettings'> {
    const ensured = ensureAlarmRuleMockSettings(rule, alarmLevels);

    if (ensured.editMode === 'SQL语句编辑') {
        return {
            conditionSettings: undefined,
            sqlSettings: syncAlarmRuleSqlSettings(ensured.sqlSettings, alarmLevels),
        };
    }

    const conditionSettings = syncAlarmRuleConditionSettings(
        ensured.conditionSettings ?? createFilledAlarmRuleConditionSettings(ensured, alarmLevels),
        alarmLevels,
    );

    return {
        conditionSettings: sanitizeConditionFieldsForTrigger(
            conditionSettings,
            ensured.triggerMethods,
        ),
        sqlSettings: syncAlarmRuleSqlSettings(ensured.sqlSettings, alarmLevels),
    };
}

export function createInitialAlarmRuleCategories(): AlarmRuleCategory[] {
    return INITIAL_CATEGORIES.map((item) => ({ ...item }));
}

export function createInitialAlarmRules(): AlarmRuleRecord[] {
    const alarmLevels = createInitialAlarmLevels();
    return INITIAL_RULES.map((item) => enrichMockAlarmRule(item, alarmLevels));
}

export function generateAlarmRuleCategoryId(): string {
    return `cat-${Date.now()}`;
}

export function generateAlarmRuleId(): string {
    return `rule-${Date.now()}`;
}

export function formatAlarmRuleNow(): string {
    const now = new Date();
    const pad = (value: number) => String(value).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} `
        + `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

export const DEFAULT_ALARM_CATEGORY_TREE_EXPANDED: Record<string, boolean> = {
    'cat-large-meter': true,
    'cat-household-meter': true,
    'cat-pressure': true,
    'cat-water-quality': true,
    'cat-smart-station': true,
};

export function buildAlarmRuleCategorySelectTree(categories: AlarmRuleCategory[]): TreeSelectNode[] {
    const toTreeSelect = (nodes: AlarmRuleCategoryNode[]): TreeSelectNode[] => nodes.map((node) => ({
        id: node.id,
        label: node.name,
        children: node.children?.length ? toTreeSelect(node.children) : undefined,
    }));

    return toTreeSelect(buildCategoryTree(categories));
}

export function buildCategoryTree(categories: AlarmRuleCategory[]): AlarmRuleCategoryNode[] {
    const childrenMap = new Map<string | null, AlarmRuleCategory[]>();
    categories.forEach((item) => {
        const list = childrenMap.get(item.parentId) ?? [];
        list.push(item);
        childrenMap.set(item.parentId, list);
    });

    const buildNodes = (parentId: string | null): AlarmRuleCategoryNode[] => (
        (childrenMap.get(parentId) ?? []).map((node) => {
            const children = buildNodes(node.id);
            return children.length
                ? { ...node, children }
                : { ...node };
        })
    );

    return buildNodes(null);
}

export function getCategoryDescendantIds(
    categories: AlarmRuleCategory[],
    categoryId: string,
): string[] {
    const children = categories.filter((item) => item.parentId === categoryId);
    return children.flatMap((child) => [child.id, ...getCategoryDescendantIds(categories, child.id)]);
}

/** 当前分类及其所有子分类 ID（用于列表筛选） */
export function getCategoryScopeIds(
    categories: AlarmRuleCategory[],
    categoryId: string,
): string[] {
    return [categoryId, ...getCategoryDescendantIds(categories, categoryId)];
}

export function getCategoryInvalidParentIds(
    categories: AlarmRuleCategory[],
    categoryId: string,
): string[] {
    return [categoryId, ...getCategoryDescendantIds(categories, categoryId)];
}

export const CATEGORY_DELETE_BLOCKED_BY_RULES = '该分类下存在告警规则，请先移除告警规则！';

export function categoryContainsAlarmRules(
    categories: AlarmRuleCategory[],
    rules: AlarmRuleRecord[],
    categoryId: string,
) {
    const scopeIds = new Set([categoryId, ...getCategoryDescendantIds(categories, categoryId)]);
    return rules.some((rule) => scopeIds.has(rule.categoryId));
}

export function isDuplicateCategoryName(
    categories: AlarmRuleCategory[],
    name: string,
    excludeId?: string,
) {
    const normalized = name.trim();
    return categories.some((item) => item.name === normalized && item.id !== excludeId);
}

export function buildCategoryOptions(
    categories: AlarmRuleCategory[],
): { label: string; value: string }[] {
    const childrenMap = new Map<string | null, AlarmRuleCategory[]>();
    categories.forEach((item) => {
        const list = childrenMap.get(item.parentId) ?? [];
        list.push(item);
        childrenMap.set(item.parentId, list);
    });

    const options: { label: string; value: string }[] = [];

    const walk = (parentId: string | null, prefix: string) => {
        const nodes = childrenMap.get(parentId) ?? [];
        nodes.forEach((node) => {
            const label = prefix ? `${prefix} / ${node.name}` : node.name;
            options.push({ label, value: node.id });
            walk(node.id, label);
        });
    };

    walk(null, '');
    return options;
}

export function formatTriggerMethods(methods: AlarmTriggerMethod[]) {
    return methods.length ? methods.join('、') : '—';
}

export function ruleMatchesTriggerFilter(
    rule: AlarmRuleRecord,
    selectedMethods: AlarmTriggerMethod[],
) {
    if (!selectedMethods.length) return true;
    return rule.triggerMethods.some((method) => selectedMethods.includes(method));
}

export function truncateRuleDescription(text: string, max = 20) {
    if (text.length <= max) return text;
    return `${text.slice(0, max)}...`;
}

export function generateAlarmRuleConditionId(): string {
    return `cond-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export function createEmptyAlarmRuleCondition(): AlarmRuleConditionItem {
    return {
        id: generateAlarmRuleConditionId(),
        productId: '',
        spaceId: '',
        deviceIds: [],
        triggerCondition: '',
        delayValue: '',
        delayUnit: '分钟',
        valueMethod: '',
        propertyId: '',
        judgeOperator: '>',
        judgeValue: '',
        judgeValueMin: '',
        judgeValueMax: '',
        samplePeriod: '',
        eventIds: [],
        functionId: '',
        reportCheckType: '',
        reportTimeSource: '',
        reportToleranceValue: '',
        reportToleranceUnit: '',
    };
}

export function createDefaultLevelConditionConfig(): AlarmRuleLevelConditionConfig {
    return {
        limitMode: '部分条件满足',
        conditions: [createEmptyAlarmRuleCondition()],
        repeatSuppression: '抑制',
        silenceTimeValue: '',
        silenceTimeUnit: '分钟',
    };
}

export function normalizeAlarmRuleLevelConditionConfig(
    config: Partial<AlarmRuleLevelConditionConfig> & {
        limitMode: AlarmConditionLimitMode;
        conditions: AlarmRuleConditionItem[];
    },
): AlarmRuleLevelConditionConfig {
    return {
        limitMode: config.limitMode,
        conditions: config.conditions,
        repeatSuppression: config.repeatSuppression ?? '抑制',
        silenceTimeValue: config.silenceTimeValue ?? '',
        silenceTimeUnit: config.silenceTimeUnit ?? '分钟',
    };
}

export function createDefaultAlarmRuleConditionSettings(
    alarmLevels: AlarmLevelRecord[],
): AlarmRuleConditionSettings {
    const levels = alarmLevels.reduce((acc, level) => {
        acc[level.id] = createDefaultLevelConditionConfig();
        return acc;
    }, {} as Record<string, AlarmRuleLevelConditionConfig>);

    return {
        activeLevelId: alarmLevels[0]?.id ?? '',
        levels,
    };
}

export function syncAlarmRuleConditionSettings(
    settings: AlarmRuleConditionSettings | LegacyAlarmRuleConditionSettings,
    alarmLevels: AlarmLevelRecord[],
): AlarmRuleConditionSettings {
    if (!alarmLevels.length) {
        return { activeLevelId: '', levels: {} };
    }

    const nameToId = new Map(alarmLevels.map((level) => [level.name, level.id]));
    const sourceLevels = settings.levels ?? {};
    const migratedLevels: Record<string, AlarmRuleLevelConditionConfig> = {};

    alarmLevels.forEach((level) => {
        const byId = sourceLevels[level.id];
        const byName = sourceLevels[level.name];
        if (byId) {
            migratedLevels[level.id] = normalizeAlarmRuleLevelConditionConfig(byId);
        } else if (byName) {
            migratedLevels[level.id] = normalizeAlarmRuleLevelConditionConfig(byName);
        } else {
            migratedLevels[level.id] = createDefaultLevelConditionConfig();
        }
    });

    let activeLevelId = settings.activeLevelId ?? '';
    if (!activeLevelId && settings.activeLevel) {
        activeLevelId = nameToId.get(settings.activeLevel) ?? '';
    }
    if (!migratedLevels[activeLevelId]) {
        activeLevelId = alarmLevels[0].id;
    }

    return { activeLevelId, levels: migratedLevels };
}

export function getAlarmRuleTriggerConditionOptions(triggerMethods: AlarmTriggerMethod[]) {
    const triggerMethod = triggerMethods[0];
    if (triggerMethod === '设备状态触发') {
        return [...ALARM_RULE_DEVICE_STATUS_TRIGGER_CONDITIONS];
    }
    return [...ALARM_RULE_TRIGGER_CONDITION_OPTIONS];
}

export function sanitizeConditionFieldsForTrigger(
    settings: AlarmRuleConditionSettings,
    triggerMethods: AlarmTriggerMethod[],
): AlarmRuleConditionSettings {
    const triggerMethod = triggerMethods[0];
    const allowedTriggerConditions = new Set<string>(getAlarmRuleTriggerConditionOptions(triggerMethods) as string[]);

    const levels = Object.fromEntries(
        Object.entries(settings.levels).map(([levelId, config]) => [
            levelId,
            {
                ...config,
                conditions: config.conditions.map((condition) => {
                    if (triggerMethod === '数据条件判断触发') {
                        const valueMethod = (
                            condition.valueMethod
                            && (ALARM_RULE_VALUE_METHOD_OPTIONS as readonly string[]).includes(condition.valueMethod)
                        )
                            ? condition.valueMethod
                            : '';
                        const isDynamic = isDynamicValueMethod(valueMethod);
                        const needsPeriod = needsSamplePeriodValueMethod(valueMethod);
                        return {
                            ...condition,
                            triggerCondition: '',
                            delayValue: '',
                            delayUnit: '分钟',
                            eventIds: [],
                            functionId: '',
                            valueMethod,
                            judgeOperator: isDynamic
                                ? ''
                                : (
                                    condition.judgeOperator
                                    && (ALARM_RULE_JUDGE_OPERATOR_OPTIONS as readonly string[]).includes(condition.judgeOperator)
                                )
                                    ? condition.judgeOperator
                                    : '>',
                            judgeValue: isDynamic ? '' : condition.judgeValue,
                            judgeValueMin: isDynamic ? condition.judgeValueMin : '',
                            judgeValueMax: isDynamic ? condition.judgeValueMax : '',
                            samplePeriod: needsPeriod
                                ? (
                                    (ALARM_RULE_SAMPLE_PERIOD_OPTIONS as readonly string[]).includes(condition.samplePeriod)
                                        ? condition.samplePeriod
                                        : ''
                                )
                                : '',
                            reportCheckType: '',
                            reportTimeSource: '',
                            reportToleranceValue: '',
                            reportToleranceUnit: '',
                        };
                    }

                    if (triggerMethod === '设备状态触发') {
                        return {
                            ...condition,
                            valueMethod: '',
                            propertyId: '',
                            judgeOperator: '>',
                            judgeValue: '',
                            judgeValueMin: '',
                            judgeValueMax: '',
                            samplePeriod: '',
                            eventIds: [],
                            functionId: '',
                            triggerCondition: allowedTriggerConditions.has(condition.triggerCondition)
                                ? condition.triggerCondition
                                : '',
                            reportCheckType: '',
                            reportTimeSource: '',
                            reportToleranceValue: '',
                            reportToleranceUnit: '',
                        };
                    }

                    if (triggerMethod === '事件上报时触发') {
                        return {
                            ...condition,
                            triggerCondition: '',
                            delayValue: '',
                            delayUnit: '分钟',
                            valueMethod: '',
                            propertyId: '',
                            judgeOperator: '>',
                            judgeValue: '',
                            judgeValueMin: '',
                            judgeValueMax: '',
                            samplePeriod: '',
                            functionId: '',
                            eventIds: condition.eventIds ?? [],
                            reportCheckType: '',
                            reportTimeSource: '',
                            reportToleranceValue: '',
                            reportToleranceUnit: '',
                        };
                    }

                    if (triggerMethod === '属性数据上报时触发') {
                        const reportCheckType = (
                            ALARM_PROPERTY_REPORT_CHECK_TYPE_OPTIONS as readonly string[]
                        ).includes(condition.reportCheckType ?? '')
                            ? condition.reportCheckType
                            : '';
                        const isOffHour = isOffHourReportCheck(reportCheckType);
                        const reportTimeSource = isOffHour && (
                            ALARM_PROPERTY_REPORT_TIME_SOURCE_OPTIONS as readonly string[]
                        ).includes(condition.reportTimeSource ?? '')
                            ? condition.reportTimeSource
                            : isOffHour
                                ? '数据时间'
                                : '';
                        return {
                            ...condition,
                            triggerCondition: '',
                            delayValue: '',
                            delayUnit: '分钟',
                            valueMethod: '',
                            judgeOperator: '>',
                            judgeValue: '',
                            judgeValueMin: '',
                            judgeValueMax: '',
                            samplePeriod: '',
                            eventIds: [],
                            functionId: '',
                            reportCheckType: reportCheckType as AlarmPropertyReportCheckType | '',
                            reportTimeSource: reportTimeSource as AlarmPropertyReportTimeSource | '',
                            reportToleranceValue: isOffHour
                                ? (condition.reportToleranceValue || DEFAULT_OFF_HOUR_REPORT_TOLERANCE_VALUE)
                                : '',
                            reportToleranceUnit: isOffHour && (
                                ALARM_PROPERTY_REPORT_TOLERANCE_UNIT_OPTIONS as readonly string[]
                            ).includes(condition.reportToleranceUnit ?? '')
                                ? condition.reportToleranceUnit
                                : isOffHour
                                    ? DEFAULT_OFF_HOUR_REPORT_TOLERANCE_UNIT
                                    : '',
                            propertyId: condition.propertyId ?? '',
                        };
                    }

                    if (triggerMethod === '功能调用时触发') {
                        return {
                            ...condition,
                            triggerCondition: '',
                            delayValue: '',
                            delayUnit: '分钟',
                            valueMethod: '',
                            propertyId: '',
                            judgeOperator: '>',
                            judgeValue: '',
                            judgeValueMin: '',
                            judgeValueMax: '',
                            samplePeriod: '',
                            eventIds: [],
                            functionId: condition.functionId ?? '',
                            reportCheckType: '',
                            reportTimeSource: '',
                            reportToleranceValue: '',
                            reportToleranceUnit: '',
                        };
                    }

                    return {
                        ...condition,
                        valueMethod: '',
                        propertyId: '',
                        judgeOperator: '>',
                        judgeValue: '',
                        judgeValueMin: '',
                        judgeValueMax: '',
                        samplePeriod: '',
                        eventIds: [],
                        functionId: '',
                        triggerCondition: allowedTriggerConditions.has(condition.triggerCondition)
                            ? condition.triggerCondition
                            : '',
                    };
                }),
            },
        ]),
    );

    return { ...settings, levels };
}

export function isAlarmRuleConditionItemComplete(
    condition: AlarmRuleConditionItem,
    triggerMethod?: AlarmTriggerMethod,
) {
    const baseValid = Boolean(condition.productId && condition.deviceIds.length > 0);
    if (!baseValid) return false;

    if (triggerMethod === '数据条件判断触发') {
        if (!condition.valueMethod || !condition.propertyId) return false;

        if (isDynamicValueMethod(condition.valueMethod)) {
            return Boolean(condition.judgeValueMin.trim() && condition.judgeValueMax.trim());
        }

        const judgeValid = Boolean(
            condition.judgeOperator
            && condition.judgeValue.trim(),
        );

        if (needsSamplePeriodValueMethod(condition.valueMethod)) {
            return judgeValid && Boolean(condition.samplePeriod);
        }

        return judgeValid;
    }

    if (triggerMethod === '设备状态触发') {
        return Boolean(condition.triggerCondition && condition.delayValue.trim());
    }

    if (triggerMethod === '事件上报时触发') {
        return Boolean(condition.eventIds.length > 0);
    }

    if (triggerMethod === '属性数据上报时触发') {
        if (!condition.reportCheckType) return false;
        if (isOffHourReportCheck(condition.reportCheckType)) {
            const toleranceValid = condition.reportToleranceValue.trim() !== ''
                && !Number.isNaN(Number(condition.reportToleranceValue));
            const unitValid = (
                ALARM_PROPERTY_REPORT_TOLERANCE_UNIT_OPTIONS as readonly string[]
            ).includes(condition.reportToleranceUnit ?? '');
            if (!toleranceValid || !unitValid || !condition.reportTimeSource) return false;
            if (condition.reportTimeSource === '数据时间') {
                return Boolean(condition.propertyId);
            }
            return true;
        }
        return Boolean(condition.propertyId);
    }

    if (triggerMethod === '功能调用时触发') {
        return Boolean(condition.functionId);
    }

    return Boolean(condition.triggerCondition && condition.delayValue.trim());
}

export function isAlarmRuleRepeatSuppressionValid(config: AlarmRuleLevelConditionConfig) {
    if (config.repeatSuppression !== '规定时间内抑制') return true;
    return Boolean(config.silenceTimeValue.trim());
}

export function isAlarmRuleLevelConfigValid(
    config: AlarmRuleLevelConditionConfig,
    triggerMethod?: AlarmTriggerMethod,
) {
    return config.conditions.length > 0
        && config.conditions.every((item) => isAlarmRuleConditionItemComplete(item, triggerMethod))
        && isAlarmRuleRepeatSuppressionValid(config);
}

export function isAlarmRuleConditionSettingsValid(
    settings: AlarmRuleConditionSettings,
    alarmLevels: AlarmLevelRecord[],
    triggerMethods?: AlarmTriggerMethod[],
) {
    if (!alarmLevels.length) return false;
    const activeConfig = settings.levels[settings.activeLevelId];
    const triggerMethod = triggerMethods?.[0];
    return activeConfig ? isAlarmRuleLevelConfigValid(activeConfig, triggerMethod) : false;
}

export function createDefaultLevelSqlConfig(): AlarmRuleLevelSqlConfig {
    return { sql: ALARM_RULE_DEFAULT_SQL_TEMPLATE };
}

export function createDefaultAlarmRuleSqlSettings(
    alarmLevels: AlarmLevelRecord[],
): AlarmRuleSqlSettings {
    const levels = alarmLevels.reduce((acc, level) => {
        acc[level.id] = createDefaultLevelSqlConfig();
        return acc;
    }, {} as Record<string, AlarmRuleLevelSqlConfig>);

    return {
        activeLevelId: alarmLevels[0]?.id ?? '',
        levels,
    };
}

export function syncAlarmRuleSqlSettings(
    settings: AlarmRuleSqlSettings | undefined,
    alarmLevels: AlarmLevelRecord[],
): AlarmRuleSqlSettings {
    if (!alarmLevels.length) {
        return { activeLevelId: '', levels: {} };
    }

    const sourceLevels = settings?.levels ?? {};
    const migratedLevels: Record<string, AlarmRuleLevelSqlConfig> = {};

    alarmLevels.forEach((level) => {
        const existing = sourceLevels[level.id];
        migratedLevels[level.id] = {
            sql: existing?.sql ?? ALARM_RULE_DEFAULT_SQL_TEMPLATE,
        };
    });

    let activeLevelId = settings?.activeLevelId ?? '';
    if (!migratedLevels[activeLevelId]) {
        activeLevelId = alarmLevels[0].id;
    }

    return { activeLevelId, levels: migratedLevels };
}

export function isAlarmRuleSqlSettingsValid(
    settings: AlarmRuleSqlSettings,
    alarmLevels: AlarmLevelRecord[],
) {
    if (!alarmLevels.length) return false;
    return alarmLevels.every((level) => Boolean(settings.levels[level.id]?.sql.trim()));
}

export function mockAlarmRuleSqlDebugOutput(input: string): string {
    try {
        const parsed = JSON.parse(input) as Record<string, unknown>;
        const reordered: Record<string, unknown> = {};
        if ('data' in parsed) reordered.data = parsed.data;
        ['deviceId', 'deviceName', 'messageType', 'productId'].forEach((key) => {
            if (key in parsed) reordered[key] = parsed[key];
        });
        Object.keys(parsed).forEach((key) => {
            if (!(key in reordered)) reordered[key] = parsed[key];
        });
        return JSON.stringify(reordered, null, 2);
    } catch {
        return '消息输入不是合法 JSON';
    }
}

