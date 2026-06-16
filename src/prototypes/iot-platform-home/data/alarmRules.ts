import type { AlarmTriggerMethod } from './deviceAlarms';
import type { AlarmLevelRecord } from './alarmLevels';
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

export const ALARM_RULE_DEVICE_STATUS_TRIGGER_CONDITIONS = ['设备下线', '设备上线'] as const;

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
    { id: 'cat-pressure', parentId: null, name: '压力计' },
    { id: 'cat-pressure-offline', parentId: 'cat-pressure', name: '离线告警' },
    { id: 'cat-pressure-threshold', parentId: 'cat-pressure', name: '阈值告警' },
    { id: 'cat-meter', parentId: null, name: '电表规则' },
    { id: 'cat-meter-offline', parentId: 'cat-meter', name: '离线告警' },
    { id: 'cat-meter-abnormal', parentId: 'cat-meter', name: '读数异常' },
    { id: 'cat-water', parentId: null, name: '水表规则' },
    { id: 'cat-water-flow', parentId: 'cat-water', name: '流量异常' },
    { id: 'cat-water-fault', parentId: 'cat-water', name: '故障上报' },
];

const INITIAL_RULES: AlarmRuleRecord[] = [
    {
        id: 'rule-1',
        categoryId: 'cat-pressure-offline',
        name: '压力计离线告警',
        description: '设备离线超过5分钟触发告警',
        editMode: '触发条件设置',
        triggerMethods: ['设备状态触发'],
        notifyAlarm: true,
        createWorkOrder: false,
        workOrderAssignees: [],
        enabled: true,
        createdAt: '2025-07-01 12:00:30',
    },
    {
        id: 'rule-2',
        categoryId: 'cat-pressure-threshold',
        name: '水压阈值告警',
        description: '水压值超过设定阈值时触发，适用于一泵房压力监测场景',
        editMode: '触发条件设置',
        triggerMethods: ['数据条件判断触发'],
        notifyAlarm: true,
        createWorkOrder: false,
        workOrderAssignees: [],
        enabled: true,
        createdAt: '2025-07-01 12:05:18',
    },
    {
        id: 'rule-3',
        categoryId: 'cat-meter-abnormal',
        name: '电表读数异常',
        description: '读数突变超过50%触发告警',
        editMode: 'SQL语句编辑',
        triggerMethods: ['属性数据上报时触发'],
        notifyAlarm: true,
        createWorkOrder: true,
        workOrderAssignees: ['张三', '李四'],
        sqlSettings: undefined,
        enabled: false,
        createdAt: '2025-07-02 09:15:42',
    },
    {
        id: 'rule-4',
        categoryId: 'cat-meter-offline',
        name: '电表设备离线',
        description: '电表设备离线状态持续超过10分钟',
        editMode: '触发条件设置',
        triggerMethods: ['设备状态触发'],
        notifyAlarm: true,
        createWorkOrder: false,
        workOrderAssignees: [],
        enabled: true,
        createdAt: '2025-07-02 10:22:11',
    },
    {
        id: 'rule-5',
        categoryId: 'cat-water-flow',
        name: '水表流量异常',
        description: '水表流量数据连续3次上报异常值',
        editMode: '触发条件设置',
        triggerMethods: ['数据条件判断触发'],
        notifyAlarm: true,
        createWorkOrder: false,
        workOrderAssignees: [],
        enabled: true,
        createdAt: '2025-07-03 14:30:00',
    },
    {
        id: 'rule-6',
        categoryId: 'cat-water-fault',
        name: '水表故障上报',
        description: '设备上报故障码E102时触发',
        editMode: '触发条件设置',
        triggerMethods: ['事件上报时触发'],
        notifyAlarm: true,
        createWorkOrder: true,
        workOrderAssignees: ['王五'],
        enabled: true,
        createdAt: '2025-07-03 16:45:22',
    },
];

export function createInitialAlarmRuleCategories(): AlarmRuleCategory[] {
    return INITIAL_CATEGORIES.map((item) => ({ ...item }));
}

export function createInitialAlarmRules(): AlarmRuleRecord[] {
    return INITIAL_RULES.map((item) => ({ ...item }));
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
    'cat-pressure': true,
    'cat-meter': true,
    'cat-water': true,
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
    const allowedTriggerConditions = new Set(getAlarmRuleTriggerConditionOptions(triggerMethods));

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
                        };
                    }

                    if (triggerMethod === '属性数据上报时触发') {
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

