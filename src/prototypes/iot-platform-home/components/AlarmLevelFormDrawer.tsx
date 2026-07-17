import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { DEFAULT_ALARM_LEVEL_COLORS } from '../data/alarmLevels';
import ElSelect from './ElSelect';
import '../product-create.css';
import '../device-create.css';
import '../alarm-level-management.css';
import ClearableInput from './ClearableInput';

export type AlarmLevelFormValue = {
    name: string;
    color: string;
    description: string;
    processingDeadline?: number;
    processingDeadlineUnit?: 'hour' | 'day';
};

type AlarmLevelFormDrawerProps = {
    open: boolean;
    mode: 'add' | 'edit';
    initialValue?: AlarmLevelFormValue;
    onClose: () => void;
    onSubmit: (value: AlarmLevelFormValue) => void;
};

const EMPTY_FORM: AlarmLevelFormValue = {
    name: '',
    color: DEFAULT_ALARM_LEVEL_COLORS[0],
    description: '',
    processingDeadline: undefined,
    processingDeadlineUnit: 'hour',
};

const DEADLINE_UNIT_OPTIONS = [
    { label: '小时', value: 'hour' },
    { label: '天', value: 'day' },
] as const;

export default function AlarmLevelFormDrawer({
    open,
    mode,
    initialValue,
    onClose,
    onSubmit,
}: AlarmLevelFormDrawerProps) {
    const [form, setForm] = useState<AlarmLevelFormValue>(EMPTY_FORM);

    useEffect(() => {
        if (!open) return;

        if (mode === 'edit' && initialValue) {
            setForm({ ...initialValue });
            return;
        }

        setForm(EMPTY_FORM);
    }, [open, mode, initialValue]);

    if (!open) return null;

    const handleConfirm = () => {
        onSubmit({
            name: form.name.trim(),
            color: form.color,
            description: form.description.trim(),
            processingDeadline: form.processingDeadline,
            processingDeadlineUnit: form.processingDeadlineUnit,
        });
    };

    const handleMaskMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
        if (event.target === event.currentTarget) {
            onClose();
        }
    };

    return createPortal(
        <div
            className="pcp-drawer-mask dcp-group-dialog-mask"
            role="presentation"
            onMouseDown={handleMaskMouseDown}
        >
            <aside
                className="pcp-drawer pcp-drawer--form dcp-group-dialog alm-form-drawer"
                role="dialog"
                aria-modal="true"
                aria-labelledby="alm-drawer-title"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <div className="pcp-drawer__head">
                    <h3 id="alm-drawer-title">{mode === 'add' ? '新增告警等级' : '编辑告警等级'}</h3>
                    <button type="button" className="pcp-drawer__close" onClick={onClose} aria-label="关闭">×</button>
                </div>
                <div className="pcp-drawer__body pcp-drawer__body--form">
                    <label className="pcp-drawer-field">
                        <span className="pcp-form-label"><em>*</em>级别名称：</span>
                        <ClearableInput
                            type="text"
                            className="pcp-form-input"
                            placeholder="请输入级别名称"
                            value={form.name}
                            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                        />
                    </label>
                    <label className="pcp-drawer-field">
                        <span className="pcp-form-label"><em>*</em>颜色配置：</span>
                        <div className="alm-color-picker">
                            {DEFAULT_ALARM_LEVEL_COLORS.map((color) => (
                                <button
                                    key={color}
                                    type="button"
                                    className={`alm-color-option ${form.color === color ? 'is-active' : ''}`}
                                    style={{ backgroundColor: color }}
                                    aria-label={color}
                                    onClick={() => setForm((prev) => ({ ...prev, color }))}
                                />
                            ))}
                            <span className="alm-color-custom">
                                自定义
                                <input
                                    type="color"
                                    value={form.color}
                                    onChange={(event) => setForm((prev) => ({ ...prev, color: event.target.value }))}
                                />
                            </span>
                        </div>
                    </label>
                    <label className="pcp-drawer-field">
                        <span className="pcp-form-label">描述：</span>
                        <textarea
                            className="pcp-form-textarea"
                            placeholder="请输入描述"
                            rows={4}
                            value={form.description}
                            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                        />
                    </label>
                    <div className="pcp-drawer-field">
                        <span className="pcp-form-label">工单处理期限：</span>
                        <div className="alm-deadline-row">
                            <ClearableInput
                                type="number"
                                className="pcp-form-input alm-deadline-row__value"
                                placeholder="请输入数值"
                                min="0"
                                step="1"
                                value={form.processingDeadline ?? ''}
                                onChange={(event) => {
                                    const value = event.target.value === '' ? undefined : Number(event.target.value);
                                    setForm((prev) => ({ ...prev, processingDeadline: value }));
                                }}
                            />
                            <ElSelect
                                className="el-select--medium alm-deadline-row__unit"
                                size="medium"
                                value={form.processingDeadlineUnit ?? 'hour'}
                                options={[...DEADLINE_UNIT_OPTIONS]}
                                onChange={(value) => setForm((prev) => ({
                                    ...prev,
                                    processingDeadlineUnit: value as 'hour' | 'day',
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
                        disabled={!form.name.trim()}
                        onClick={handleConfirm}
                    >
                        {mode === 'add' ? '新增' : '保存'}
                    </button>
                </div>
            </aside>
        </div>,
        document.body,
    );
}
