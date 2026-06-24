import React, { useMemo } from 'react';
import { Minus, Plus } from 'lucide-react';
import ElSelect from './ElSelect';
import ElMultiSelect from './ElMultiSelect';
import ElTreeSelect from './ElTreeSelect';
import type { AlarmTriggerMethod } from '../data/deviceAlarms';
import type { AlarmLevelRecord } from '../data/alarmLevels';
import type { DeviceRecord } from '../data/devices';
import {
    buildProductPickerTree,
    DEFAULT_PRODUCT_TREE_EXPANDED,
} from '../data/productCategories';
import type { ProductRecord } from '../data/products';
import ClearableInput from './ClearableInput';
import {
    ALARM_CONDITION_LIMIT_OPTIONS,
    ALARM_PROPERTY_REPORT_CHECK_TYPE_OPTIONS,
    ALARM_PROPERTY_REPORT_TIME_SOURCE_OPTIONS,
    ALARM_PROPERTY_REPORT_TOLERANCE_UNIT_OPTIONS,
    ALARM_RULE_DELAY_UNIT_OPTIONS,
    ALARM_REPEAT_SUPPRESSION_OPTIONS,
    ALARM_RULE_JUDGE_OPERATOR_OPTIONS,
    ALARM_RULE_SAMPLE_PERIOD_OPTIONS,
    ALARM_RULE_VALUE_METHOD_OPTIONS,
    DEFAULT_OFF_HOUR_REPORT_TOLERANCE_UNIT,
    DEFAULT_OFF_HOUR_REPORT_TOLERANCE_VALUE,
    getAlarmRuleTriggerConditionOptions,
    isDynamicValueMethod,
    isOffHourReportCheck,
    needsSamplePeriodValueMethod,
    createDefaultLevelConditionConfig,
    createEmptyAlarmRuleCondition,
    resolveDataTimePropertyId,
    type AlarmConditionLimitMode,
    type AlarmPropertyReportCheckType,
    type AlarmPropertyReportTimeSource,
    type AlarmPropertyReportToleranceUnit,
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

const REPORT_CHECK_TYPE_OPTIONS = ALARM_PROPERTY_REPORT_CHECK_TYPE_OPTIONS.map((item) => ({
    label: item,
    value: item,
}));

const REPORT_TIME_PROPERTY_OPTIONS = ALARM_PROPERTY_REPORT_TIME_SOURCE_OPTIONS.map((item) => ({
    label: item,
    value: item,
}));

const REPORT_TOLERANCE_UNIT_OPTIONS = ALARM_PROPERTY_REPORT_TOLERANCE_UNIT_OPTIONS.map((item) => ({
    label: item,
    value: item,
}));

function resolveOffHourPropertyId(product: ProductRecord | undefined): string {
    if (!product) return '';
    return resolveDataTimePropertyId(product.properties);
}

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
                                <div className="arc-condition-field">
                                    <span className="pcp-form-label"><em>*</em>产品名称：</span>
                                    <ElTreeSelect
                                        className="el-select--medium pcp-form-select arc-tree-select"
                                        size="medium"
                                        value={condition.productId}
                                        tree={productTree}
                                        placeholder="请选择产品"
                                        showAllOption={false}
                                        defaultExpanded={DEFAULT_PRODUCT_TREE_EXPANDED}
                                        filterable
                                        onChange={(productId) => {
                                            if (!productIds.has(productId)) return;
                                            const product = products.find((item) => item.id === productId);
                                            const dataTimePropertyId = resolveOffHourPropertyId(product);
                                            const isOffHour = isOffHourReportCheck(condition.reportCheckType);
                                            const usesDataTime = (condition.reportTimeSource || '数据时间') !== '收到时间';
                                            updateCondition(index, {
                                                productId,
                                                deviceIds: [],
                                                propertyId: isOffHour && usesDataTime && dataTimePropertyId
                                                    ? dataTimePropertyId
                                                    : '',
                                                eventIds: [],
                                                functionId: '',
                                            });
                                        }}
                                    />
                                </div>
                                <div className="arc-condition-field">
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
                                </div>
                                {isDataTrigger && (
                                    <>
                                        <div className="arc-condition-field">
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
                                        </div>
                                        <div className="arc-condition-field">
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
                                        </div>
                                        <div className="arc-condition-field">
                                            <span className="pcp-form-label"><em>*</em>判断条件：</span>
                                            {isDynamicValueMethod(condition.valueMethod) ? (
                                                <div className="arc-judge-range-group">
                                                    <ClearableInput
                                                        type="text"
                                                        className="pcp-form-input"
                                                        placeholder="请输入最小数值"
                                                        value={condition.judgeValueMin}
                                                        onChange={(event) => updateCondition(index, {
                                                            judgeValueMin: event.target.value.replace(/[^\d.-]/g, ''),
                                                        })}
                                                    />
                                                    <span className="arc-judge-range-separator">-</span>
                                                    <ClearableInput
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
                                                    <ClearableInput
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
                                        </div>
                                        {needsSamplePeriodValueMethod(condition.valueMethod) && (
                                            <div className="arc-condition-field arc-condition-field--period">
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
                                            </div>
                                        )}
                                    </>
                                )}
                                {isEventTrigger && (
                                    <div className="arc-condition-field">
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
                                    </div>
                                )}
                                {isPropertyReportTrigger && (
                                    <>
                                        <div className="arc-condition-field">
                                            <span className="pcp-form-label"><em>*</em>校验类型：</span>
                                            <ElSelect
                                                className="el-select--medium pcp-form-select"
                                                size="medium"
                                                value={condition.reportCheckType}
                                                options={[
                                                    { label: '请选择', value: '' },
                                                    ...REPORT_CHECK_TYPE_OPTIONS,
                                                ]}
                                                onChange={(value) => {
                                                    if (!value) {
                                                        updateCondition(index, {
                                                            reportCheckType: '',
                                                            propertyId: '',
                                                            reportTimeSource: '',
                                                            reportToleranceValue: '',
                                                            reportToleranceUnit: '',
                                                        });
                                                        return;
                                                    }
                                                    const reportCheckType = value as AlarmPropertyReportCheckType;
                                                    const product = products.find((item) => item.id === condition.productId);
                                                    const dataTimePropertyId = resolveOffHourPropertyId(product);
                                                    if (isOffHourReportCheck(reportCheckType)) {
                                                        updateCondition(index, {
                                                            reportCheckType,
                                                            reportTimeSource: condition.reportTimeSource || '数据时间',
                                                            reportToleranceValue: condition.reportToleranceValue
                                                                || DEFAULT_OFF_HOUR_REPORT_TOLERANCE_VALUE,
                                                            reportToleranceUnit: condition.reportToleranceUnit
                                                                || DEFAULT_OFF_HOUR_REPORT_TOLERANCE_UNIT,
                                                            propertyId: dataTimePropertyId,
                                                        });
                                                        return;
                                                    }
                                                    updateCondition(index, {
                                                        reportCheckType,
                                                        propertyId: '',
                                                        reportTimeSource: '',
                                                        reportToleranceValue: '',
                                                        reportToleranceUnit: '',
                                                    });
                                                }}
                                            />
                                        </div>
                                        {isOffHourReportCheck(condition.reportCheckType) ? (
                                            <>
                                                <div className="arc-condition-field">
                                                    <span className="pcp-form-label"><em>*</em>时间属性：</span>
                                                    <ElSelect
                                                        className="el-select--medium pcp-form-select"
                                                        size="medium"
                                                        value={condition.reportTimeSource || '数据时间'}
                                                        options={REPORT_TIME_PROPERTY_OPTIONS}
                                                        onChange={(value) => {
                                                            const reportTimeSource = value as AlarmPropertyReportTimeSource;
                                                            const product = products.find((item) => item.id === condition.productId);
                                                            const dataTimePropertyId = resolveOffHourPropertyId(product);
                                                            updateCondition(index, {
                                                                reportTimeSource,
                                                                propertyId: reportTimeSource === '数据时间'
                                                                    ? dataTimePropertyId
                                                                    : '',
                                                            });
                                                        }}
                                                    />
                                                </div>
                                                <div className="arc-condition-field">
                                                    <span className="pcp-form-label"><em>*</em>容差：</span>
                                                    <div className="arc-delay-input-group">
                                                        <ClearableInput
                                                            type="text"
                                                            className="pcp-form-input"
                                                            placeholder="请输入"
                                                            value={condition.reportToleranceValue}
                                                            onChange={(event) => updateCondition(index, {
                                                                reportToleranceValue: event.target.value.replace(/[^\d]/g, ''),
                                                            })}
                                                        />
                                                        <ElSelect
                                                            className="el-select--medium arc-delay-unit-select"
                                                            size="medium"
                                                            value={condition.reportToleranceUnit || DEFAULT_OFF_HOUR_REPORT_TOLERANCE_UNIT}
                                                            options={REPORT_TOLERANCE_UNIT_OPTIONS}
                                                            onChange={(unit) => updateCondition(index, {
                                                                reportToleranceUnit: unit as AlarmPropertyReportToleranceUnit,
                                                            })}
                                                        />
                                                    </div>
                                                </div>
                                                <p className="arc-condition-field-tip arc-condition-field-tip--full">
                                                    当上报时间偏离最近整点超过容差范围时触发告警，例如容差 5 分钟表示允许在整点前后 5 分钟内上报，容差 30 秒同理。
                                                </p>
                                            </>
                                        ) : condition.reportCheckType === '属性变更' ? (
                                            <div className="arc-condition-field">
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
                                            </div>
                                        ) : null}
                                    </>
                                )}
                                {isFunctionTrigger && (
                                    <div className="arc-condition-field">
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
                                    </div>
                                )}
                                {isStatusTrigger && (
                                    <>
                                        <div className="arc-condition-field">
                                            <span className="pcp-form-label"><em>*</em>触发条件：</span>
                                            <ElSelect
                                                className="el-select--medium pcp-form-select"
                                                size="medium"
                                                value={condition.triggerCondition}
                                                options={[
                                                    { label: '请选择触发条件', value: '' },
                                                    { label: '设备下线', value: '设备下线' },
                                                    { label: '设备上线', value: '设备上线' },
                                                    { label: '连续未上报', value: '连续未上报' },
                                                ]}
                                                onChange={(triggerCondition) => updateCondition(index, { triggerCondition })}
                                            />
                                        </div>
                                        <div className="arc-condition-field">
                                            <span className="pcp-form-label">
                                                <em>*</em>
                                                {condition.triggerCondition === '连续未上报' ? '持续时间' : '延迟时间'}：
                                            </span>
                                            <div className="arc-delay-input-group">
                                                <ClearableInput
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
                                        </div>
                                    </>
                                )}
                                {!isDataTrigger && !isStatusTrigger && !isEventTrigger && !isPropertyReportTrigger && !isFunctionTrigger && (
                                    <>
                                        <div className="arc-condition-field">
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
                                        </div>
                                        <div className="arc-condition-field">
                                            <span className="pcp-form-label"><em>*</em>延迟时间：</span>
                                            <div className="arc-delay-input-group">
                                                <ClearableInput
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
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="arc-repeat-limit">
                    <span className="arc-condition-card__title">重报限制</span>
                    <div className="arc-repeat-limit-grid">
                        <div className="arc-condition-field">
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
                        </div>
                        {activeConfig.repeatSuppression === '规定时间内抑制' && (
                            <div className="arc-condition-field">
                                <span className="pcp-form-label"><em>*</em>静默时间：</span>
                                <div className="arc-delay-input-group">
                                    <ClearableInput
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
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
