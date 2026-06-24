import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import ElDateRangePicker from './ElDateRangePicker';
import ElSelect from './ElSelect';
import type { DebugPropertyField } from '../data/deviceDebugging';
import type { DeviceRecord } from '../data/devices';
import type { IotToastType } from './IotToast';
import '../device-create.css';
import '../product-create.css';

export type DeviceDataMigrationPayload = {
    propertyIds: string[];
    startDate: string;
    endDate: string;
    targetDeviceId: string;
};

type DeviceDataMigrationDrawerProps = {
    open: boolean;
    sourceDevice: DeviceRecord | null;
    devices: DeviceRecord[];
    properties: DebugPropertyField[];
    onClose: () => void;
    onSubmit: (payload: DeviceDataMigrationPayload) => void;
    onShowToast: (message: string, type?: IotToastType) => void;
};

type MigrationFormState = {
    propertyIds: string[];
    startDate: string;
    endDate: string;
    targetDeviceId: string;
};

const EMPTY_FORM: MigrationFormState = {
    propertyIds: [],
    startDate: '',
    endDate: '',
    targetDeviceId: '',
};

function getMigrationTargetDevices(
    devices: DeviceRecord[],
    sourceDevice: DeviceRecord | null,
): DeviceRecord[] {
    if (!sourceDevice) return [];
    return devices
        .filter((device) => device.productId === sourceDevice.productId && device.id !== sourceDevice.id)
        .sort((left, right) => left.name.localeCompare(right.name, 'zh-CN'));
}

export default function DeviceDataMigrationDrawer({
    open,
    sourceDevice,
    devices,
    properties,
    onClose,
    onSubmit,
    onShowToast,
}: DeviceDataMigrationDrawerProps) {
    const [form, setForm] = useState<MigrationFormState>(EMPTY_FORM);

    const targetDevices = useMemo(
        () => getMigrationTargetDevices(devices, sourceDevice),
        [devices, sourceDevice],
    );

    const targetDeviceOptions = useMemo(
        () => targetDevices.map((device) => ({
            label: device.name,
            value: device.id,
        })),
        [targetDevices],
    );

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
        setForm({
            ...EMPTY_FORM,
            targetDeviceId: targetDevices[0]?.id ?? '',
        });
    }, [open, sourceDevice?.id, targetDevices]);

    if (!open) return null;

    const toggleProperty = (propertyId: string) => {
        setForm((prev) => {
            const selected = prev.propertyIds.includes(propertyId);
            return {
                ...prev,
                propertyIds: selected
                    ? prev.propertyIds.filter((id) => id !== propertyId)
                    : [...prev.propertyIds, propertyId],
            };
        });
    };

    const handleSubmit = () => {
        if (!sourceDevice) {
            onShowToast('请先保存设备后再进行数据迁移', 'warning');
            return;
        }
        if (sourceDevice.enabled) {
            onShowToast('数据迁移需先停用当前设备', 'warning');
            return;
        }
        if (!form.propertyIds.length) {
            onShowToast('请选择属性迁移字段', 'warning');
            return;
        }
        if (!form.startDate || !form.endDate) {
            onShowToast('请选择数据时间范围', 'warning');
            return;
        }
        if (form.startDate > form.endDate) {
            onShowToast('开始时间不能晚于结束时间', 'warning');
            return;
        }
        if (!form.targetDeviceId) {
            onShowToast('请选择继承设备', 'warning');
            return;
        }

        onSubmit({
            propertyIds: form.propertyIds,
            startDate: form.startDate,
            endDate: form.endDate,
            targetDeviceId: form.targetDeviceId,
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
                className="pcp-drawer pcp-drawer--form dcp-group-dialog dcp-migrate-drawer"
                role="dialog"
                aria-modal="true"
                aria-labelledby="dcp-migrate-drawer-title"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <div className="pcp-drawer__head">
                    <h3 id="dcp-migrate-drawer-title">数据迁移</h3>
                    <button type="button" className="pcp-drawer__close" onClick={onClose} aria-label="关闭">
                        ×
                    </button>
                </div>

                <div className="pcp-drawer__body pcp-drawer__body--form dcp-migrate-drawer__body">
                    <div className="dcp-migrate-notice">数据迁移需停用当前设备</div>

                    <div className="pcp-drawer-field">
                        <span className="pcp-form-label"><em>*</em>属性迁移字段</span>
                        <div className="dcp-migrate-tags">
                            {properties.map((field) => (
                                <button
                                    key={field.id}
                                    type="button"
                                    className={`dcp-group-tag ${form.propertyIds.includes(field.id) ? 'is-selected' : ''}`.trim()}
                                    onClick={() => toggleProperty(field.id)}
                                >
                                    {field.name}
                                </button>
                            ))}
                            {!properties.length && (
                                <span className="dcp-migrate-empty">当前产品物模型暂无属性</span>
                            )}
                        </div>
                    </div>

                    <div className="pcp-drawer-field">
                        <span className="pcp-form-label"><em>*</em>数据时间范围</span>
                        <ElDateRangePicker
                            className="dcp-migrate-date-range-picker"
                            size="medium"
                            start={form.startDate}
                            end={form.endDate}
                            placeholder="请选择日期范围"
                            onChange={(range) => setForm((prev) => ({
                                ...prev,
                                startDate: range.start,
                                endDate: range.end,
                            }))}
                        />
                    </div>

                    <div className="pcp-drawer-field">
                        <span className="pcp-form-label"><em>*</em>继承设备</span>
                        <p className="dcp-migrate-hint">
                            继承设备需和原设备属于同一产品，具备相同物模型
                        </p>
                        <ElSelect
                            className="el-select--medium pcp-form-select"
                            size="medium"
                            value={form.targetDeviceId}
                            options={[
                                { label: '请选择', value: '' },
                                ...targetDeviceOptions,
                            ]}
                            onChange={(value) => setForm((prev) => ({ ...prev, targetDeviceId: value }))}
                        />
                        {!targetDeviceOptions.length && (
                            <span className="dcp-migrate-empty">暂无同产品可继承设备</span>
                        )}
                    </div>
                </div>

                <div className="pcp-drawer__foot">
                    <button type="button" className="pm-btn pm-btn-ghost" onClick={onClose}>
                        取消
                    </button>
                    <button type="button" className="pm-btn pm-btn-primary" onClick={handleSubmit}>
                        确定
                    </button>
                </div>
            </aside>
        </div>,
        document.body,
    );
}
