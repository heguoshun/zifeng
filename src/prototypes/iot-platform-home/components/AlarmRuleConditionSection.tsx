import React, { useMemo } from 'react';
import { Minus, Plus } from 'lucide-react';
import ElSelect from './ElSelect';
import ElMultiSelect from './ElMultiSelect';
import ElTreeSelect from './ElTreeSelect';
import type { AlarmTriggerMethod } from '../data/deviceAlarms';
import type { AlarmLevelRecord } from '../data/alarmLevels';
import type { DeviceRecord } from '../data/devices';
import { DEFAULT_TREE_EXPANDED, matchesTreeSelection, SPACE_TREE } from '../data/orgHierarchy';
import {
    buildProductPickerTree,
    DEFAULT_PRODUCT_TREE_EXPANDED,
} from '../data/productCategories';
import type { ProductRecord } from '../data/products';
import {
    ALARM_CONDITION_LIMIT_OPTIONS,
    ALARM_RULE_DELAY_UNIT_OPTIONS,
    ALARM_REPEAT_SUPPRESSION_OPTIONS,
    ALARM_RULE_JUDGE_OPERATOR_OPTIONS,
    ALARM_RULE_SAMPLE_PERIOD_OPTIONS,
    ALARM_RULE_VALUE_METHOD_OPTIONS,
    getAlarmRuleTriggerConditionOptions,
    isDynamicValueMethod,
    needsSamplePeriodValueMethod,
    createDefaultLevelConditionConfig,
    createEmptyAlarmRuleCondition,
    type AlarmConditionLimitMode,
    type AlarmRepeatSuppressionMode,
    type AlarmRuleConditionItem,
    type AlarmRuleConditionSettings,
    type AlarmRuleDelayUnit,
    type AlarmRuleLevelConditionConfig,
} from '../data/alarmRules';

type AlarmRuleConditionSectionProps = {
    value: AlarmRuleConditionSettings;
    alarmLevels: AlarmLevelRecord[];
    triggerMethods: AlarmTriggerMethod[];
    products: ProductRecord[];
    devices: DeviceRecord[];
    onChange: (value: AlarmRuleConditionSettings) => void;
};

const DELAY_UNIT_OPTIONS = ALARM_RULE_DELAY_UNIT_OPTIONS.map((item) => ({
    label: item,
    value: item,
}));

const REPEAT_SUPPRESSION_OPTIONS = ALARM_REPEAT_SUPPRESSION_OPTIONS.map((item) => ({
    label: item,
    value: item,
}));

const VALUE_METHOD_OPTIONS = ALARM_RULE_VALUE_METHOD_OPTIONS.map((item) => ({
    label: item,
    value: item,
}));

const SAMPLE_PERIOD_OPTIONS = ALARM_RULE_SAMPLE_PERIOD_OPTIONS.map((item) => ({
    label: item,
    value: item,
}));

const JUDGE_OPERATOR_OPTIONS = ALARM_RULE_JUDGE_OPERATOR_OPTIONS.map((item) => ({
    label: item,
    value: item,
}));

function updateLevelConfig(
    settings: AlarmRuleConditionSettings,
    levelId: string,
    updater: (config: AlarmRuleLevelConditionConfig) => AlarmRuleLevelConditionConfig,
): AlarmRuleConditionSettings {
    const current = settings.levels[levelId] ?? createDefaultLevelConditionConfig();
    return {
        ...settings,
        levels: {
            ...settings.levels,
            [levelId]: updater(current),
        },
    };
}

export default function AlarmRuleConditionSection({
    value,
    alarmLevels,
    triggerMethods,
    products,
    devices,
    onChange,
}: AlarmRuleConditionSectionProps) {
    const activeConfig = value.levels[value.activeLevelId] ?? createDefaultLevelConditionConfig();
    const triggerMethod = triggerMethods[0];
    const isDataTrigger = triggerMethod === '数据条件判断触发';
    const isStatusTrigger = triggerMethod === '设备状态触发';
    const isEventTrigger = triggerMethod === '事件上报时触发';
    const isPropertyReportTrigger = triggerMethod === '属性数据上报时触发';
    const isFunctionTrigger = triggerMethod === '功能调用时触发';

    const productTree = useMemo(
        () => buildProductPickerTree(products),
        [products],
    );

    const productIds = useMemo(
        () => new Set(products.map((item) => item.id)),
        [products],
    );

    const setActiveLevelId = (levelId: string) => {
        onChange({ ...value, activeLevelId: levelId });
    };

    const setLimitMode = (limitMode: AlarmConditionLimitMode) => {
        onChange(updateLevelConfig(value, value.activeLevelId, (config) => ({
            ...config,
            limitMode,
        })));
    };

    const updateRepeatSuppression = (repeatSuppression: AlarmRepeatSuppressionMode) => {
        onChange(updateLevelConfig(value, value.activeLevelId, (config) => ({
            ...config,
            repeatSuppression,
            silenceTimeValue: repeatSuppression === '规定时间内抑制'
                ? config.silenceTimeValue
                : '',
        })));
    };

    const updateSilenceTime = (patch: { silenceTimeValue?: string; silenceTimeUnit?: AlarmRuleDelayUnit }) => {
        onChange(updateLevelConfig(value, value.activeLevelId, (config) => ({
            ...config,
            ...patch,
        })));
    };

    const updateCondition = (
        index: number,
        patch: Partial<AlarmRuleConditionItem>,
    ) => {
        onChange(updateLevelConfig(value, value.activeLevelId, (config) => ({
            ...config,
            conditions: config.conditions.map((item, itemIndex) => (
                itemIndex === index ? { ...item, ...patch } : item
            )),
        })));
    };

    const addCondition = (index: number) => {
        onChange(updateLevelConfig(value, value.activeLevelId, (config) => {
            const next = [...config.conditions];
            next.splice(index + 1, 0, createEmptyAlarmRuleCondition());
            return { ...config, conditions: next };
        }));
    };

    const removeCondition = (index: number) => {
        if (activeConfig.conditions.length <= 1) return;
        onChange(updateLevelConfig(value, value.activeLevelId, (config) => ({
            ...config,
            conditions: config.conditions.filter((_, itemIndex) => itemIndex !== index),
        })));
    };

    const getDeviceOptions = (condition: AlarmRuleConditionItem) => {
        if (!condition.productId) return [];
        return devices
            .filter((device) => device.productId === condition.productId)
            .filter((device) => !condition.spaceId
                || matchesTreeSelection(condition.spaceId, device.spaceId, SPACE_TREE))
            .slice(0, 50)
            .map((device) => ({ label: device.name, value: device.id }));
    };

    const getPropertyOptions = (productId: string) => {
        const product = products.find((item) => item.id === productId);
        return product?.properties.map((property) => ({
            label: property.name,
            value: property.id,
        })) ?? [];
    };

    const getEventOptions = (productId: string) => {
        const product = products.find((item) => item.id === productId);
        return product?.events.map((event) => ({
            label: event.name,
            value: event.id,
        })) ?? [];
    };

    const getFunctionOptions = (productId: string) => {
        const product = products.find((item) => item.id === productId);
        return product?.functions.map((fn) => ({
            label: fn.name,
            value: fn.id,
        })) ?? [];
    };

    const filterEventIds = (productId: string, eventIds: string[]) => {
        const validIds = new Set(getEventOptions(productId).map((item) => item.value));
        return eventIds.filter((eventId) => validIds.has(eventId));
    };

    if (!alarmLevels.length) {
        return (
            <section className="arc-condition-section">
                <h4 className="arc-form-section-title">条件配置</h4>
                <p className="arc-condition-empty-tip">请先在告警等级管理中配置告警等级</p>
            </section>
        );
    }

    return (
        <section className="arc-condition-section">
            <h4 className="arc-form-section-title">条件配置</h4>
            <div className="arc-condition-panel">
                <div className="arc-level-tabs" role="tablist" aria-label="告警级别">
                    {alarmLevels.map((level) => (
                        <button
                            key={level.id}
                            type="button"
                            role="tab"
                            aria-selected={value.activeLevelId === level.id}
                            className={`arc-level-tab ${value.activeLevelId === level.id ? 'is-active' : ''}`}
                            onClick={() => setActiveLevelId(level.id)}
                        >
                            {level.name}
                        </button>
                    ))}
                </div>

                <div className="arc-condition-limit">
                    <span className="pcp-form-label"><em>*</em>条件限制：</span>
                    <div className="pcp-radio-group">
                        {ALARM_CONDITION_LIMIT_OPTIONS.map((option) => (
                            <label key={option} className="pcp-radio">
                                <input
                                    type="radio"
                                    name={`arc-condition-limit-${value.activeLevelId}`}
                                    checked={activeConfig.limitMode === option}
                                    onChange={() => setLimitMode(option)}
                                />
                                <span>{option}</span>
                            </label>
                        ))}
                    </div>
                </div>
                <p className="arc-condition-limit-tip">
                    {activeConfig.limitMode === '部分条件满足'
                        ? '满足其中任意一条条件即触发告警'
                        : '需所有条件同时满足才触发告警'}
                </p>

                <div className="arc-condition-list">
                    {activeConfig.conditions.map((condition, index) => (
                        <div key={condition.id} className="arc-condition-card">
                            <div className="arc-condition-card__head">
                                <span className="arc-condition-card__title">条件{index + 1}</span>
                                <div className="arc-condition-card__actions">
                                    <button
                                        type="button"
                                        className="arc-condition-icon-btn"
                                        aria-label={`删除条件${index + 1}`}
                                        disabled={activeConfig.conditions.length <= 1}
                                        onClick={() => removeCondition(index)}
                                    >
                                        <Minus size={14} />
                                    </button>
                                    <button
                                        type="button"
                                        className="arc-condition-icon-btn"
                                        aria-label={`新增条件${index + 2}`}
                                        onClick={() => addCondition(index)}
                                    >
                                        <Plus size={14} />
                                    </button>
                                </div>
                            </div>
                            <div className="arc-condition-grid">
                                <label className="arc-condition-field">
                                    <span className="pcp-form-label"><em>*</em>产品名称：</span>
                                    <ElTreeSelect
                                        className="el-select--medium pcp-form-select arc-tree-select"
                                        size="medium"
                                        value={condition.productId}
                                        tree={productTree}
                                        placeholder="请选择产品"
                                        showAllOption={false}
                                        defaultExpanded={DEFAULT_PRODUCT_TREE_EXPANDED}
                                        onChange={(productId) => {
                                            if (!productIds.has(productId)) return;
                                            updateCondition(index, {
                                                productId,
                                                deviceIds: [],
                                                propertyId: '',
                                                eventIds: [],
                                                functionId: '',
                                            });
                                        }}
                                    />
                                </label>
                                <label className="arc-condition-field">
                                    <span className="pcp-form-label">所属空间：</span>
                                    <ElTreeSelect
                                        className="el-select--medium pcp-form-select arc-tree-select"
                                        size="medium"
                                        value={condition.spaceId || 'all'}
                                        tree={SPACE_TREE}
                                        placeholder="请选择空间"
                                        defaultExpanded={DEFAULT_TREE_EXPANDED}
                                        onChange={(spaceId) => updateCondition(index, {
                                            spaceId: spaceId === 'all' ? '' : spaceId,
                                            deviceIds: [],
                                        })}
                                    />
                                </label>
                                <label className="arc-condition-field">
                                    <span className="pcp-form-label"><em>*</em>设备名称：</span>
                                    <ElMultiSelect
                                        className="el-select--medium pcp-form-select"
                                        size="medium"
                                        value={condition.deviceIds}
                                        placeholder="请选择设备"
                                        showSelectAll
                                        options={getDeviceOptions(condition)}
                                        onChange={(deviceIds) => updateCondition(index, { deviceIds })}
                                    />
                                </label>
                                {isDataTrigger && (
                                    <>
                                        <label className="arc-condition-field">
                                            <span className="pcp-form-label"><em>*</em>属性数据：</span>
                                            <ElSelect
                                                className="el-select--medium pcp-form-select"
                                                size="medium"
                                                value={condition.propertyId}
                                                options={[
                                                    { label: '请选择属性数据', value: '' },
                                                    ...getPropertyOptions(condition.productId),
                                                ]}
                                                onChange={(propertyId) => updateCondition(index, { propertyId })}
                                            />
                                        </label>
                                        <label className="arc-condition-field">
                                            <span className="pcp-form-label"><em>*</em>取值方式：</span>
                                            <ElSelect
                                                className="el-select--medium pcp-form-select"
                                                size="medium"
                                                value={condition.valueMethod}
                                                options={[
                                                    { label: '请选择取值方式', value: '' },
                                                    ...VALUE_METHOD_OPTIONS,
                                                ]}
                                                onChange={(valueMethod) => {
                                                    const nextMethod = valueMethod as AlarmRuleConditionItem['valueMethod'];
                                                    const patch: Partial<AlarmRuleConditionItem> = {
                                                        valueMethod: nextMethod,
                                                    };
                                                    if (isDynamicValueMethod(nextMethod)) {
                                                        patch.judgeOperator = '';
                                                        patch.judgeValue = '';
                                                        patch.samplePeriod = '';
                                                    } else {
                                                        patch.judgeOperator = condition.judgeOperator || '>';
                                                        patch.judgeValueMin = '';
                                                        patch.judgeValueMax = '';
                                                        if (!needsSamplePeriodValueMethod(nextMethod)) {
                                                            patch.samplePeriod = '';
                                                        }
                                                    }
                                                    updateCondition(index, patch);
                                                }}
                                            />
                                        </label>
                                        <label className="arc-condition-field">
                                            <span className="pcp-form-label"><em>*</em>判断条件：</span>
                                            {isDynamicValueMethod(condition.valueMethod) ? (
                                                <div className="arc-judge-range-group">
                                                    <input
                                                        type="text"
                                                        className="pcp-form-input"
                                                        placeholder="请输入最小数值"
                                                        value={condition.judgeValueMin}
                                                        onChange={(event) => updateCondition(index, {
                                                            judgeValueMin: event.target.value.replace(/[^\d.-]/g, ''),
                                                        })}
                                                    />
                                                    <span className="arc-judge-range-separator">-</span>
                                                    <input
                                                        type="text"
                                                        className="pcp-form-input"
                                                        placeholder="请输入最大数值"
                                                        value={condition.judgeValueMax}
                                                        onChange={(event) => updateCondition(index, {
                                                            judgeValueMax: event.target.value.replace(/[^\d.-]/g, ''),
                                                        })}
                                                    />
                                                </div>
                                            ) : (
                                                <div className="arc-judge-input-group">
                                                    <ElSelect
                                                        className="el-select--medium arc-judge-operator-select"
                                                        size="medium"
                                                        value={condition.judgeOperator || '>'}
                                                        options={JUDGE_OPERATOR_OPTIONS}
                                                        onChange={(judgeOperator) => updateCondition(index, {
                                                            judgeOperator: judgeOperator as AlarmRuleConditionItem['judgeOperator'],
                                                        })}
                                                    />
                                                    <input
                                                        type="text"
                                                        className="pcp-form-input"
                                                        placeholder="请输入数值"
                                                        value={condition.judgeValue}
                                                        onChange={(event) => updateCondition(index, {
                                                            judgeValue: event.target.value.replace(/[^\d.-]/g, ''),
                                                        })}
                                                    />
                                                </div>
                                            )}
                                        </label>
                                        {needsSamplePeriodValueMethod(condition.valueMethod) && (
                                            <label className="arc-condition-field arc-condition-field--period">
                                                <span className="pcp-form-label"><em>*</em>取值周期：</span>
                                                <ElSelect
                                                    className="el-select--medium pcp-form-select"
                                                    size="medium"
                                                    value={condition.samplePeriod}
                                                    options={[
                                                        { label: '请选择周期', value: '' },
                                                        ...SAMPLE_PERIOD_OPTIONS,
                                                    ]}
                                                    onChange={(samplePeriod) => updateCondition(index, {
                                                        samplePeriod,
                                                    })}
                                                />
                                            </label>
                                        )}
                                    </>
                                )}
                                {isEventTrigger && (
                                    <label className="arc-condition-field">
                                        <span className="pcp-form-label"><em>*</em>事件名称：</span>
                                        <ElMultiSelect
                                            className="el-select--medium pcp-form-select"
                                            size="medium"
                                            value={filterEventIds(condition.productId, condition.eventIds)}
                                            placeholder="请选择事件"
                                            showTags
                                            options={getEventOptions(condition.productId)}
                                            onChange={(eventIds) => updateCondition(index, { eventIds })}
                                        />
                                    </label>
                                )}
                                {isPropertyReportTrigger && (
                                    <label className="arc-condition-field">
                                        <span className="pcp-form-label"><em>*</em>属性名称：</span>
                                        <ElSelect
                                            className="el-select--medium pcp-form-select"
                                            size="medium"
                                            value={condition.propertyId}
                                            options={[
                                                { label: '请选择', value: '' },
                                                ...getPropertyOptions(condition.productId),
                                            ]}
                                            onChange={(propertyId) => updateCondition(index, { propertyId })}
                                        />
                                    </label>
                                )}
                                {isFunctionTrigger && (
                                    <label className="arc-condition-field">
                                        <span className="pcp-form-label"><em>*</em>功能名称：</span>
                                        <ElSelect
                                            className="el-select--medium pcp-form-select"
                                            size="medium"
                                            value={condition.functionId}
                                            options={[
                                                { label: '请选择', value: '' },
                                                ...getFunctionOptions(condition.productId),
                                            ]}
                                            onChange={(functionId) => updateCondition(index, { functionId })}
                                        />
                                    </label>
                                )}
                                {isStatusTrigger && (
                                    <>
                                        <label className="arc-condition-field">
                                            <span className="pcp-form-label"><em>*</em>触发条件：</span>
                                            <ElSelect
                                                className="el-select--medium pcp-form-select"
                                                size="medium"
                                                value={condition.triggerCondition}
                                                options={[
                                                    { label: '请选择触发条件', value: '' },
                                                    { label: '设备下线', value: '设备下线' },
                                                    { label: '设备上线', value: '设备上线' },
                                                ]}
                                                onChange={(triggerCondition) => updateCondition(index, { triggerCondition })}
                                            />
                                        </label>
                                        <label className="arc-condition-field">
                                            <span className="pcp-form-label"><em>*</em>延迟时间：</span>
                                            <div className="arc-delay-input-group">
                                                <input
                                                    type="text"
                                                    className="pcp-form-input"
                                                    placeholder="请输入"
                                                    value={condition.delayValue}
                                                    onChange={(event) => updateCondition(index, {
                                                        delayValue: event.target.value.replace(/[^\d]/g, ''),
                                                    })}
                                                />
                                                <ElSelect
                                                    className="el-select--medium arc-delay-unit-select"
                                                    size="medium"
                                                    value={condition.delayUnit}
                                                    options={DELAY_UNIT_OPTIONS}
                                                    onChange={(delayUnit) => updateCondition(index, {
                                                        delayUnit: delayUnit as AlarmRuleDelayUnit,
                                                    })}
                                                />
                                            </div>
                                        </label>
                                    </>
                                )}
                                {!isDataTrigger && !isStatusTrigger && !isEventTrigger && !isPropertyReportTrigger && !isFunctionTrigger && (
                                    <>
                                        <label className="arc-condition-field">
                                            <span className="pcp-form-label"><em>*</em>触发条件：</span>
                                            <ElSelect
                                                className="el-select--medium pcp-form-select"
                                                size="medium"
                                                value={condition.triggerCondition}
                                                options={[
                                                    { label: '请选择触发条件', value: '' },
                                                    ...getAlarmRuleTriggerConditionOptions(triggerMethods).map((item) => ({
                                                        label: item,
                                                        value: item,
                                                    })),
                                                ]}
                                                onChange={(triggerCondition) => updateCondition(index, { triggerCondition })}
                                            />
                                        </label>
                                        <label className="arc-condition-field">
                                            <span className="pcp-form-label"><em>*</em>延迟时间：</span>
                                            <div className="arc-delay-input-group">
                                                <input
                                                    type="text"
                                                    className="pcp-form-input"
                                                    placeholder="请输入"
                                                    value={condition.delayValue}
                                                    onChange={(event) => updateCondition(index, {
                                                        delayValue: event.target.value.replace(/[^\d]/g, ''),
                                                    })}
                                                />
                                                <ElSelect
                                                    className="el-select--medium arc-delay-unit-select"
                                                    size="medium"
                                                    value={condition.delayUnit}
                                                    options={DELAY_UNIT_OPTIONS}
                                                    onChange={(delayUnit) => updateCondition(index, {
                                                        delayUnit: delayUnit as AlarmRuleDelayUnit,
                                                    })}
                                                />
                                            </div>
                                        </label>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="arc-repeat-limit">
                    <span className="arc-condition-card__title">重报限制</span>
                    <div className="arc-repeat-limit-grid">
                        <label className="arc-condition-field">
                            <span className="pcp-form-label"><em>*</em>重报抑制：</span>
                            <ElSelect
                                className="el-select--medium pcp-form-select"
                                size="medium"
                                value={activeConfig.repeatSuppression}
                                options={REPEAT_SUPPRESSION_OPTIONS}
                                onChange={(repeatSuppression) => updateRepeatSuppression(
                                    repeatSuppression as AlarmRepeatSuppressionMode,
                                )}
                            />
                        </label>
                        {activeConfig.repeatSuppression === '规定时间内抑制' && (
                            <label className="arc-condition-field">
                                <span className="pcp-form-label"><em>*</em>静默时间：</span>
                                <div className="arc-delay-input-group">
                                    <input
                                        type="text"
                                        className="pcp-form-input"
                                        placeholder="请输入"
                                        value={activeConfig.silenceTimeValue}
                                        onChange={(event) => updateSilenceTime({
                                            silenceTimeValue: event.target.value.replace(/[^\d]/g, ''),
                                        })}
                                    />
                                    <ElSelect
                                        className="el-select--medium arc-delay-unit-select"
                                        size="medium"
                                        value={activeConfig.silenceTimeUnit}
                                        options={DELAY_UNIT_OPTIONS}
                                        onChange={(silenceTimeUnit) => updateSilenceTime({
                                            silenceTimeUnit: silenceTimeUnit as AlarmRuleDelayUnit,
                                        })}
                                    />
                                </div>
                            </label>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
