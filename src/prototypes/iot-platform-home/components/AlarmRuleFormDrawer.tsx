import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check } from 'lucide-react';
import ElTreeSelect from './ElTreeSelect';
import AssigneePickerDialog from './AssigneePickerDialog';
import AlarmRuleConditionSection from './AlarmRuleConditionSection';
import AlarmRuleSqlSection from './AlarmRuleSqlSection';
import type { AlarmTriggerMethod } from '../data/deviceAlarms';
import type { AlarmLevelRecord } from '../data/alarmLevels';
import type { DeviceRecord } from '../data/devices';
import type { ProductRecord } from '../data/products';
import {
    ALARM_RULE_DESCRIPTION_MAX,
    ALARM_RULE_EDIT_MODE_OPTIONS,
    ALARM_RULE_TRIGGER_FILTER_OPTIONS,
    buildAlarmRuleCategorySelectTree,
    createDefaultAlarmRuleConditionSettings,
    createDefaultAlarmRuleSqlSettings,
    resolveAlarmRuleEditFormSettings,
    syncAlarmRuleConditionSettings,
    syncAlarmRuleSqlSettings,
    DEFAULT_ALARM_CATEGORY_TREE_EXPANDED,
    isAlarmRuleConditionSettingsValid,
    isAlarmRuleSqlSettingsValid,
    sanitizeConditionFieldsForTrigger,
    type AlarmRuleCategory,
    type AlarmRuleConditionSettings,
    type AlarmRuleEditMode,
    type AlarmRuleRecord,
    type AlarmRuleSqlSettings,
} from '../data/alarmRules';
import '../product-create.css';
import '../device-create.css';
import '../device-alarm-info.css';
import '../alarm-rule-config.css';
import ClearableInput from './ClearableInput';

const TRIGGER_OPTIONS = ALARM_RULE_TRIGGER_FILTER_OPTIONS
    .filter((item) => item !== '全部') as AlarmTriggerMethod[];

export type AlarmRuleFormValue = {
    name: string;
    categoryId: string;
    description: string;
    editMode: AlarmRuleEditMode;
    triggerMethods: AlarmTriggerMethod[];
    notifyAlarm: boolean;
    createWorkOrder: boolean;
    workOrderAssignees: string[];
    conditionSettings: AlarmRuleConditionSettings;
    sqlSettings: AlarmRuleSqlSettings;
};

type AlarmRuleFormDrawerProps = {
    open: boolean;
    mode: 'add' | 'edit';
    categories: AlarmRuleCategory[];
    alarmLevels: AlarmLevelRecord[];
    products: ProductRecord[];
    devices: DeviceRecord[];
    editingRule?: AlarmRuleRecord | null;
    initialValue?: AlarmRuleFormValue;
    onClose: () => void;
    onSubmit: (value: AlarmRuleFormValue) => void;
};

const EMPTY_FORM: AlarmRuleFormValue = {
    name: '',
    categoryId: '',
    description: '',
    editMode: '触发条件设置',
    triggerMethods: ['设备状态触发'],
    notifyAlarm: true,
    createWorkOrder: false,
    workOrderAssignees: [],
    conditionSettings: { activeLevelId: '', levels: {} },
    sqlSettings: { activeLevelId: '', levels: {} },
};

export default function AlarmRuleFormDrawer({
    open,
    mode,
    categories,
    alarmLevels,
    products,
    devices,
    editingRule,
    initialValue,
    onClose,
    onSubmit,
}: AlarmRuleFormDrawerProps) {
    const [form, setForm] = useState<AlarmRuleFormValue>(EMPTY_FORM);
    const [pickerOpen, setPickerOpen] = useState(false);
    const categoryTree = useMemo(
        () => buildAlarmRuleCategorySelectTree(categories),
        [categories],
    );

    useEffect(() => {
        if (!open) return;
        setPickerOpen(false);
        const defaultConditionSettings = createDefaultAlarmRuleConditionSettings(alarmLevels);
        const defaultSqlSettings = createDefaultAlarmRuleSqlSettings(alarmLevels);

        if (mode === 'edit' && editingRule) {
            const resolved = resolveAlarmRuleEditFormSettings(editingRule, alarmLevels);
            const triggerMethods = editingRule.triggerMethods?.length
                ? [editingRule.triggerMethods[0]]
                : EMPTY_FORM.triggerMethods;

            setForm({
                name: editingRule.name,
                categoryId: editingRule.categoryId,
                description: editingRule.description,
                editMode: editingRule.editMode ?? '触发条件设置',
                triggerMethods,
                notifyAlarm: editingRule.notifyAlarm ?? true,
                createWorkOrder: editingRule.createWorkOrder ?? false,
                workOrderAssignees: editingRule.workOrderAssignees ?? [],
                conditionSettings: resolved.conditionSettings ?? defaultConditionSettings,
                sqlSettings: resolved.sqlSettings ?? defaultSqlSettings,
            });
            return;
        }

        const triggerMethods = initialValue?.triggerMethods?.length
            ? [initialValue.triggerMethods[0]]
            : EMPTY_FORM.triggerMethods;

        setForm({
            ...EMPTY_FORM,
            categoryId: initialValue?.categoryId ?? '',
            triggerMethods,
            conditionSettings: initialValue?.conditionSettings ?? defaultConditionSettings,
            sqlSettings: initialValue?.sqlSettings ?? defaultSqlSettings,
        });
    }, [open, mode, editingRule, alarmLevels, initialValue?.categoryId]);

    if (!open) return null;

    const selectTriggerMethod = (method: AlarmTriggerMethod) => {
        setForm((prev) => {
            if (prev.triggerMethods[0] === method) return prev;
            const triggerMethods = [method];
            return {
                ...prev,
                triggerMethods,
                conditionSettings: sanitizeConditionFieldsForTrigger(
                    prev.conditionSettings,
                    triggerMethods,
                ),
            };
        });
    };

    const handleConfirm = () => {
        onSubmit({
            name: form.name.trim(),
            categoryId: form.categoryId,
            description: form.description.trim(),
            editMode: form.editMode,
            triggerMethods: form.triggerMethods,
            notifyAlarm: form.notifyAlarm,
            createWorkOrder: form.createWorkOrder,
            workOrderAssignees: form.createWorkOrder ? form.workOrderAssignees : [],
            conditionSettings: form.editMode === '触发条件设置'
                ? syncAlarmRuleConditionSettings(form.conditionSettings, alarmLevels)
                : form.conditionSettings,
            sqlSettings: form.editMode === 'SQL语句编辑'
                ? syncAlarmRuleSqlSettings(form.sqlSettings, alarmLevels)
                : form.sqlSettings,
        });
    };

    const handleMaskMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
        if (event.target === event.currentTarget) {
            onClose();
        }
    };

    const isConditionValid = form.editMode === 'SQL语句编辑'
        ? isAlarmRuleSqlSettingsValid(form.sqlSettings, alarmLevels)
        : form.editMode !== '触发条件设置'
            || isAlarmRuleConditionSettingsValid(form.conditionSettings, alarmLevels, form.triggerMethods);

    const isValid = Boolean(
        form.name.trim()
        && form.categoryId
        && form.editMode
        && form.triggerMethods.length
        && (!form.createWorkOrder || form.workOrderAssignees.length > 0)
        && isConditionValid,
    );

    return createPortal(
        <>
            <div
                className="pcp-drawer-mask dcp-group-dialog-mask arc-rule-form-mask"
                role="presentation"
                onMouseDown={handleMaskMouseDown}
            >
                <aside
                    className="pcp-drawer pcp-drawer--form dcp-group-dialog arc-form-drawer"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="arc-rule-drawer-title"
                    onMouseDown={(event) => event.stopPropagation()}
                >
                    <div className="pcp-drawer__head">
                        <h3 id="arc-rule-drawer-title">{mode === 'add' ? '新增告警规则' : '编辑告警规则'}</h3>
                        <button type="button" className="pcp-drawer__close" onClick={onClose} aria-label="关闭">×</button>
                    </div>
                    <div className="pcp-drawer__body pcp-drawer__body--form">
                        <h4 className="arc-form-section-title">基础信息</h4>
                        <label className="pcp-drawer-field">
                            <span className="pcp-form-label"><em>*</em>规则名称：</span>
                            <ClearableInput
                                type="text"
                                className="pcp-form-input"
                                placeholder="请输入规则名称"
                                value={form.name}
                                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                            />
                        </label>
                        <div className="pcp-drawer-field">
                            <span className="pcp-form-label"><em>*</em>规则分类：</span>
                            <ElTreeSelect
                                className="el-select--medium pcp-form-select arc-tree-select"
                                size="medium"
                                value={form.categoryId}
                                tree={categoryTree}
                                placeholder="请选择"
                                showAllOption={false}
                                defaultExpanded={DEFAULT_ALARM_CATEGORY_TREE_EXPANDED}
                                onChange={(value) => setForm((prev) => ({ ...prev, categoryId: value }))}
                            />
                        </div>
                        <label className="pcp-drawer-field">
                            <span className="pcp-form-label">规则描述：</span>
                            <div className="dai-textarea-wrap">
                                <textarea
                                    className="pcp-form-textarea dai-convert-textarea"
                                    placeholder="请输入规则描述"
                                    rows={4}
                                    maxLength={ALARM_RULE_DESCRIPTION_MAX}
                                    value={form.description}
                                    onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                                />
                                <span className="dai-textarea-counter">
                                    {form.description.length}/{ALARM_RULE_DESCRIPTION_MAX}
                                </span>
                            </div>
                        </label>
                        <div className="pcp-drawer-field">
                            <span className="pcp-form-label"><em>*</em>编辑方式：</span>
                            <div className="arc-edit-mode-group">
                                {ALARM_RULE_EDIT_MODE_OPTIONS.map((option) => (
                                    <button
                                        key={option}
                                        type="button"
                                        className={`arc-option-card ${form.editMode === option ? 'is-active' : ''}`}
                                        onClick={() => setForm((prev) => ({ ...prev, editMode: option }))}
                                    >
                                        {form.editMode === option && (
                                            <span className="arc-option-card__check" aria-hidden="true">
                                                <Check size={12} strokeWidth={3} />
                                            </span>
                                        )}
                                        {option}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="pcp-drawer-field">
                            <span className="pcp-form-label"><em>*</em>触发方式：</span>
                            <div className="arc-trigger-chip-group">
                                {TRIGGER_OPTIONS.map((method) => {
                                    const active = form.triggerMethods[0] === method;
                                    return (
                                        <button
                                            key={method}
                                            type="button"
                                            className={`arc-option-chip ${active ? 'is-active' : ''}`}
                                            onClick={() => selectTriggerMethod(method)}
                                        >
                                            {active && (
                                                <span className="arc-option-chip__check" aria-hidden="true">
                                                    <Check size={10} strokeWidth={3} />
                                                </span>
                                            )}
                                            {method}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <h4 className="arc-form-section-title">执行动作</h4>
                        <div className="pcp-drawer-field arc-action-field">
                            <span className="pcp-form-label">告警通知：</span>
                            <label className="arc-action-checkbox">
                                <input
                                    type="checkbox"
                                    checked={form.notifyAlarm}
                                    onChange={(event) => setForm((prev) => ({
                                        ...prev,
                                        notifyAlarm: event.target.checked,
                                    }))}
                                />
                                <span>告警信息</span>
                            </label>
                        </div>
                        <div className="pcp-drawer-field arc-action-field">
                            <span className="pcp-form-label">工单生成：</span>
                            <label className="arc-action-checkbox">
                                <input
                                    type="checkbox"
                                    checked={form.createWorkOrder}
                                    onChange={(event) => setForm((prev) => ({
                                        ...prev,
                                        createWorkOrder: event.target.checked,
                                        workOrderAssignees: event.target.checked ? prev.workOrderAssignees : [],
                                    }))}
                                />
                                <span>是</span>
                            </label>
                        </div>
                        {form.createWorkOrder && (
                            <div className="pcp-drawer-field">
                                <span className="pcp-form-label"><em>*</em>工单指派：</span>
                                <div className="dai-assignee-field">
                                    <input
                                        type="text"
                                        readOnly
                                        className="pcp-form-input dai-assignee-display"
                                        placeholder="请选择指派人"
                                        value={form.workOrderAssignees.join('、')}
                                    />
                                    <button
                                        type="button"
                                        className="pm-btn pm-btn-primary dai-assignee-btn"
                                        onClick={() => setPickerOpen(true)}
                                    >
                                        选择
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="arc-edit-mode-content">
                            <div
                                className={`arc-edit-mode-pane ${form.editMode === '触发条件设置' ? 'is-active' : ''}`}
                                aria-hidden={form.editMode !== '触发条件设置'}
                            >
                                <AlarmRuleConditionSection
                                    value={form.conditionSettings}
                                    alarmLevels={alarmLevels}
                                    triggerMethods={form.triggerMethods}
                                    products={products}
                                    devices={devices}
                                    onChange={(conditionSettings) => setForm((prev) => ({
                                        ...prev,
                                        conditionSettings,
                                    }))}
                                />
                            </div>
                            <div
                                className={`arc-edit-mode-pane ${form.editMode === 'SQL语句编辑' ? 'is-active' : ''}`}
                                aria-hidden={form.editMode !== 'SQL语句编辑'}
                            >
                                <AlarmRuleSqlSection
                                    value={form.sqlSettings}
                                    alarmLevels={alarmLevels}
                                    onChange={(sqlSettings) => setForm((prev) => ({
                                        ...prev,
                                        sqlSettings,
                                    }))}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="pcp-drawer__foot">
                        <button type="button" className="pm-btn pm-btn-ghost" onClick={onClose}>取消</button>
                        <button
                            type="button"
                            className="pm-btn pm-btn-primary"
                            disabled={!isValid}
                            onClick={handleConfirm}
                        >
                            {mode === 'add' ? '新增' : '保存'}
                        </button>
                    </div>
                </aside>
            </div>

            <AssigneePickerDialog
                open={pickerOpen}
                selected={form.workOrderAssignees}
                onClose={() => setPickerOpen(false)}
                onConfirm={(assignees) => {
                    setForm((prev) => ({ ...prev, workOrderAssignees: assignees }));
                    setPickerOpen(false);
                }}
            />
        </>,
        document.body,
    );
}
