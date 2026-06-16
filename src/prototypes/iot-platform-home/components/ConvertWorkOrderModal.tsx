import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import ElSelect from './ElSelect';
import AssigneePickerDialog from './AssigneePickerDialog';
import {
    ALARM_LEVEL_OPTIONS,
    type AlarmLevel,
    type DeviceAlarmRecord,
} from '../data/deviceAlarms';
import '../product-create.css';
import '../device-create.css';
import '../device-alarm-info.css';

const CONTENT_MAX = 100;

const LEVEL_OPTIONS = ALARM_LEVEL_OPTIONS
    .filter((item) => item !== '全部')
    .map((item) => ({ label: item, value: item }));

export type ConvertWorkOrderForm = {
    name: string;
    level: AlarmLevel;
    content: string;
    assignees: string[];
};

type ConvertWorkOrderModalProps = {
    open: boolean;
    alarm: DeviceAlarmRecord | null;
    onClose: () => void;
    onConfirm: (form: ConvertWorkOrderForm) => void;
};

const EMPTY_FORM: ConvertWorkOrderForm = {
    name: '',
    level: '重要',
    content: '',
    assignees: [],
};

export default function ConvertWorkOrderModal({
    open,
    alarm,
    onClose,
    onConfirm,
}: ConvertWorkOrderModalProps) {
    const [form, setForm] = useState<ConvertWorkOrderForm>(EMPTY_FORM);
    const [pickerOpen, setPickerOpen] = useState(false);

    useEffect(() => {
        if (!open || !alarm) return;
        setForm({
            name: alarm.eventName,
            level: alarm.level,
            content: '',
            assignees: [],
        });
        setPickerOpen(false);
    }, [open, alarm?.id, alarm?.eventName, alarm?.level]);

    const canSubmit = useMemo(
        () => form.name.trim()
            && form.level
            && form.content.trim()
            && form.assignees.length > 0,
        [form],
    );

    if (!open || !alarm) return null;

    const handleConfirm = () => {
        if (!canSubmit) return;
        onConfirm({
            name: form.name.trim(),
            level: form.level,
            content: form.content.trim(),
            assignees: form.assignees,
        });
    };

    const handleMaskMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
        if (event.target === event.currentTarget) {
            onClose();
        }
    };

    return createPortal(
        <>
            <div
                className="pcp-drawer-mask dcp-group-dialog-mask dai-convert-work-order-mask"
                role="presentation"
                onMouseDown={handleMaskMouseDown}
            >
                <aside
                    className="pcp-drawer pcp-drawer--form dcp-group-dialog dai-convert-work-order-drawer"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="dai-convert-work-order-title"
                    onMouseDown={(event) => event.stopPropagation()}
                >
                    <div className="pcp-drawer__head">
                        <h3 id="dai-convert-work-order-title">转为工单</h3>
                        <button type="button" className="pcp-drawer__close" onClick={onClose} aria-label="关闭">×</button>
                    </div>
                    <div className="pcp-drawer__body pcp-drawer__body--form dai-convert-work-order-body">
                        <label className="pcp-drawer-field">
                            <span className="pcp-form-label"><em>*</em>工单名称：</span>
                            <input
                                type="text"
                                className="pcp-form-input"
                                placeholder="请输入工单名称"
                                value={form.name}
                                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                            />
                        </label>
                        <label className="pcp-drawer-field">
                            <span className="pcp-form-label"><em>*</em>工单等级：</span>
                            <ElSelect
                                className="el-select--medium pcp-form-select"
                                size="medium"
                                value={form.level}
                                options={LEVEL_OPTIONS}
                                onChange={(value) => setForm((prev) => ({
                                    ...prev,
                                    level: value as AlarmLevel,
                                }))}
                            />
                        </label>
                        <label className="pcp-drawer-field">
                            <span className="pcp-form-label"><em>*</em>工单内容：</span>
                            <div className="dai-textarea-wrap">
                                <textarea
                                    className="pcp-form-textarea dai-convert-textarea"
                                    placeholder="请输入描述信息"
                                    value={form.content}
                                    maxLength={CONTENT_MAX}
                                    onChange={(event) => setForm((prev) => ({ ...prev, content: event.target.value }))}
                                />
                                <span className="dai-textarea-counter">
                                    {form.content.length}/{CONTENT_MAX}
                                </span>
                            </div>
                        </label>
                        <div className="pcp-drawer-field">
                            <span className="pcp-form-label"><em>*</em>工单指派：</span>
                            <div className="dai-assignee-field">
                                <input
                                    type="text"
                                    readOnly
                                    className="pcp-form-input dai-assignee-display"
                                    placeholder="请选择"
                                    value={form.assignees.join('、')}
                                />
                                <button
                                    type="button"
                                    className="pm-btn pm-btn-primary dai-assignee-btn"
                                    onClick={() => setPickerOpen(true)}
                                >
                                    请选择
                                </button>
                            </div>
                        </div>
                        <p className="dai-convert-work-order-tip">
                            工单等级和告警等级同步，可进行下拉修改。工单指派可选多人，状态同步，任何人一人处理即可进入待验收环节，退回后，指派人员都可以进行重新处理。
                        </p>
                    </div>
                    <div className="pcp-drawer__foot">
                        <button type="button" className="pm-btn pm-btn-ghost" onClick={onClose}>取消</button>
                        <button
                            type="button"
                            className="pm-btn pm-btn-primary"
                            disabled={!canSubmit}
                            onClick={handleConfirm}
                        >
                            确定
                        </button>
                    </div>
                </aside>
            </div>

            <AssigneePickerDialog
                open={pickerOpen}
                selected={form.assignees}
                onClose={() => setPickerOpen(false)}
                onConfirm={(assignees) => {
                    setForm((prev) => ({ ...prev, assignees }));
                    setPickerOpen(false);
                }}
            />
        </>,
        document.body,
    );
}
