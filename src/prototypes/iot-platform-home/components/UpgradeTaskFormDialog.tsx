import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import ElSelect from './ElSelect';
import ElDateTimePicker from './ElDateTimePicker';
import {
    EMPTY_UPGRADE_TASK_FORM,
    RETRY_STRATEGY_OPTIONS,
    UPGRADE_TIMEOUT_OPTIONS,
    type UpgradePackageTarget,
    type UpgradeTaskFormValue,
} from '../data/remoteUpgrade';
import UpgradeDevicePickerDialog from './UpgradeDevicePickerDialog';
import type { DeviceRecord } from '../data/devices';
import '../device-create.css';
import '../product-create.css';
import '../remote-upgrade.css';
import ClearableInput from './ClearableInput';

type UpgradeTaskFormDialogProps = {
    open: boolean;
    upgradePackage: UpgradePackageTarget | null;
    devices: DeviceRecord[];
    mode?: 'create' | 'resubmit';
    initialValue?: UpgradeTaskFormValue;
    rejectRemark?: string;
    onClose: () => void;
    onSubmit: (value: UpgradeTaskFormValue) => void;
};

export default function UpgradeTaskFormDialog({
    open,
    upgradePackage,
    devices,
    mode = 'create',
    initialValue,
    rejectRemark,
    onClose,
    onSubmit,
}: UpgradeTaskFormDialogProps) {
    const [form, setForm] = useState<UpgradeTaskFormValue>(EMPTY_UPGRADE_TASK_FORM);
    const [touched, setTouched] = useState(false);
    const [devicePickerOpen, setDevicePickerOpen] = useState(false);

    useEffect(() => {
        if (!open) return undefined;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [open]);

    useEffect(() => {
        if (!open) return;
        setForm(initialValue ? {
            ...initialValue,
            deviceIds: [...initialValue.deviceIds],
        } : {
            ...EMPTY_UPGRADE_TASK_FORM,
            targetVersion: upgradePackage?.version ?? '',
        });
        setTouched(false);
        setDevicePickerOpen(false);
    }, [open, upgradePackage, initialValue]);

    if (!open || !upgradePackage) return null;

    const showDevicePicker = form.scope === '指定设备';
    const canSubmit = Boolean(
        form.targetVersion.trim()
        && form.retryStrategy
        && form.timeout
        && form.scheduledAt.trim()
        && (!showDevicePicker || form.deviceIds.length > 0),
    );

    const handleConfirm = () => {
        setTouched(true);
        if (!canSubmit) return;
        onSubmit({
            ...form,
            targetVersion: form.targetVersion.trim(),
            scheduleType: '定时升级',
        });
    };

    const handleMaskMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
        if (event.target === event.currentTarget) {
            onClose();
        }
    };

    return createPortal(
        <>
            <div className="pcp-drawer-mask ru-drawer-mask" role="presentation" onMouseDown={handleMaskMouseDown}>
                <aside
                    className="pcp-drawer pcp-drawer--form dcp-group-dialog ru-drawer"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="ru-task-drawer-title"
                    onMouseDown={(event) => event.stopPropagation()}
                >
                    <div className="pcp-drawer__head">
                        <h3 id="ru-task-drawer-title">{mode === 'resubmit' ? '重新编辑升级任务' : '创建升级任务'}</h3>
                        <button type="button" className="pcp-drawer__close" onClick={onClose} aria-label="关闭">×</button>
                    </div>
                    <div className="pcp-drawer__body pcp-drawer__body--form">
                        {mode === 'resubmit' && (
                            <div className="ru-task-resubmit-notice" role="note">
                                <strong>驳回原因</strong>
                                <p>{rejectRemark?.trim() || '审核人员未填写驳回说明'}</p>
                            </div>
                        )}
                        <label className="pcp-drawer-field">
                            <span className="pcp-form-label"><em>*</em>待升级版本</span>
                            <ClearableInput
                                type="text"
                                className="pcp-form-input"
                                placeholder="请输入版本号"
                                value={form.targetVersion}
                                onChange={(event) => setForm((prev) => ({ ...prev, targetVersion: event.target.value }))}
                            />
                        </label>
                        <div className="pcp-drawer-field">
                            <span className="pcp-form-label"><em>*</em>升级范围</span>
                            <div className="pcp-radio-group">
                                {(['全部设备', '指定设备'] as const).map((option) => (
                                    <label key={option} className="pcp-radio">
                                        <input
                                            type="radio"
                                            name="upgrade-scope"
                                            checked={form.scope === option}
                                            onChange={() => setForm((prev) => ({
                                                ...prev,
                                                scope: option,
                                                deviceIds: option === '全部设备' ? [] : prev.deviceIds,
                                            }))}
                                        />
                                        <span>{option}</span>
                                    </label>
                                ))}
                            </div>
                            {showDevicePicker && (
                                <div className="ru-device-select-row">
                                    <input
                                        type="text"
                                        className="pcp-form-input"
                                        readOnly
                                        value={`已选择 ${form.deviceIds.length} 个设备`}
                                    />
                                    <button
                                        type="button"
                                        className="pm-btn pm-btn-primary"
                                        onClick={() => setDevicePickerOpen(true)}
                                    >
                                        选择设备
                                    </button>
                                </div>
                            )}
                        </div>
                        <div className="pcp-drawer-field">
                            <span className="pcp-form-label"><em>*</em>升级时间</span>
                            <ElDateTimePicker
                                className="pcp-form-select ru-datetime-picker"
                                size="medium"
                                value={form.scheduledAt}
                                placeholder="请选择升级时间"
                                onChange={(scheduledAt) => setForm((prev) => ({
                                    ...prev,
                                    scheduleType: '定时升级',
                                    scheduledAt,
                                }))}
                            />
                            <p className="ru-upload-hint" style={{ marginTop: 6 }}>
                                审核通过后，任务将在所选时间自动开始执行
                            </p>
                        </div>
                        <div className="pcp-drawer-field">
                            <span className="pcp-form-label"><em>*</em>升级失败重试策略</span>
                            <ElSelect
                                className="el-select--medium pcp-form-select"
                                size="medium"
                                value={form.retryStrategy}
                                options={RETRY_STRATEGY_OPTIONS}
                                onChange={(value) => setForm((prev) => ({ ...prev, retryStrategy: value }))}
                            />
                        </div>
                        <div className="pcp-drawer-field">
                            <span className="pcp-form-label"><em>*</em>升级超时时间</span>
                            <ElSelect
                                className="el-select--medium pcp-form-select"
                                size="medium"
                                value={form.timeout}
                                options={UPGRADE_TIMEOUT_OPTIONS}
                                onChange={(value) => setForm((prev) => ({ ...prev, timeout: value }))}
                            />
                        </div>
                        {touched && !canSubmit && (
                            <p className="ru-form-error">请完整填写必填项</p>
                        )}
                    </div>
                    <div className="pcp-drawer__foot">
                        <button type="button" className="pm-btn pm-btn-ghost" onClick={onClose}>取消</button>
                        <button type="button" className="pm-btn pm-btn-primary" onClick={handleConfirm}>确定</button>
                    </div>
                </aside>
            </div>
            <UpgradeDevicePickerDialog
                open={devicePickerOpen}
                productId={upgradePackage.productId}
                devices={devices}
                selectedIds={form.deviceIds}
                onClose={() => setDevicePickerOpen(false)}
                onConfirm={(deviceIds) => {
                    setForm((prev) => ({ ...prev, deviceIds }));
                    setDevicePickerOpen(false);
                }}
            />
        </>,
        document.body,
    );
}
