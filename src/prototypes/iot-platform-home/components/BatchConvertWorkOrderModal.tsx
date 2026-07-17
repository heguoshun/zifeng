import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import ElSelect from './ElSelect';
import AssigneePickerDialog from './AssigneePickerDialog';
import ProcessingDeadlineField from './ProcessingDeadlineField';
import {
    ALARM_LEVEL_OPTIONS,
    type AlarmLevel,
} from '../data/deviceAlarms';
import {
    createInitialAlarmLevels,
    resolveProcessingDeadlineByLevelName,
    type AlarmLevelRecord,
    type ProcessingDeadlineValue,
} from '../data/alarmLevels';
import '../product-create.css';
import '../device-create.css';
import '../device-alarm-info.css';

const CONTENT_MAX = 100;

const LEVEL_OPTIONS = ALARM_LEVEL_OPTIONS
    .filter((item) => item !== '全部')
    .map((item) => ({ label: item, value: item }));

export type BatchConvertWorkOrderForm = {
    level: AlarmLevel;
    content: string;
    assignees: string[];
} & ProcessingDeadlineValue;

type BatchConvertWorkOrderModalProps = {
    open: boolean;
    count: number;
    defaultLevel?: AlarmLevel;
    alarmLevels?: AlarmLevelRecord[];
    onClose: () => void;
    onConfirm: (form: BatchConvertWorkOrderForm) => void;
};

const EMPTY_FORM: BatchConvertWorkOrderForm = {
    level: '重要',
    content: '',
    assignees: [],
    processingDeadline: undefined,
    processingDeadlineUnit: 'hour',
};

export default function BatchConvertWorkOrderModal({
    open,
    count,
    defaultLevel = '重要',
    alarmLevels = createInitialAlarmLevels(),
    onClose,
    onConfirm,
}: BatchConvertWorkOrderModalProps) {
    const [form, setForm] = useState<BatchConvertWorkOrderForm>(EMPTY_FORM);
    const [pickerOpen, setPickerOpen] = useState(false);

    useEffect(() => {
        if (!open) return;
        const deadline = resolveProcessingDeadlineByLevelName(defaultLevel, alarmLevels);
        setForm({
            ...EMPTY_FORM,
            level: defaultLevel,
            ...deadline,
        });
        setPickerOpen(false);
    }, [open, count, defaultLevel, alarmLevels]);

    const canSubmit = useMemo(
        () => form.level && form.content.trim() && form.assignees.length > 0,
        [form],
    );

    if (!open || count <= 0) return null;

    const handleConfirm = () => {
        if (!canSubmit) return;
        onConfirm({
            level: form.level,
            content: form.content.trim(),
            assignees: form.assignees,
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
                    aria-labelledby="dai-batch-convert-title"
                    onMouseDown={(event) => event.stopPropagation()}
                >
                    <div className="pcp-drawer__head">
                        <h3 id="dai-batch-convert-title">批量转为工单</h3>
                        <button type="button" className="pcp-drawer__close" onClick={onClose} aria-label="关闭">×</button>
                    </div>
                    <div className="pcp-drawer__body pcp-drawer__body--form dai-convert-work-order-body">
                        <p className="dai-batch-summary">
                            已选择 <strong>{count}</strong> 条未处理告警，将分别创建 {count} 个工单，工单名称同步各告警事件。
                        </p>
                        <div className="pcp-drawer-field">
                            <span className="pcp-form-label"><em>*</em>工单等级：</span>
                            <ElSelect
                                className="el-select--medium pcp-form-select"
                                size="medium"
                                value={form.level}
                                options={LEVEL_OPTIONS}
                                onChange={(value) => {
                                    const deadline = resolveProcessingDeadlineByLevelName(value, alarmLevels);
                                    setForm((prev) => ({
                                        ...prev,
                                        level: value as AlarmLevel,
                                        ...deadline,
                                    }));
                                }}
                            />
                        </div>
                        <ProcessingDeadlineField
                            processingDeadline={form.processingDeadline}
                            processingDeadlineUnit={form.processingDeadlineUnit}
                            onChange={(deadline) => setForm((prev) => ({ ...prev, ...deadline }))}
                        />
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
                            工单等级默认与选中告警等级同步，可下拉修改；修改等级后处理期限会按告警等级配置自动更新，也可手动调整。工单指派可选多人，任一人处理即可进入待验收环节。
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
