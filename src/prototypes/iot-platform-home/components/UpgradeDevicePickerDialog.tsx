import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { DeviceRecord } from '../data/devices';
import '../device-create.css';
import '../product-create.css';
import '../device-group.css';
import '../remote-upgrade.css';

type UpgradeDevicePickerDialogProps = {
    open: boolean;
    productId: string;
    devices: DeviceRecord[];
    selectedIds: string[];
    onClose: () => void;
    onConfirm: (deviceIds: string[]) => void;
};

export default function UpgradeDevicePickerDialog({
    open,
    productId,
    devices,
    selectedIds,
    onClose,
    onConfirm,
}: UpgradeDevicePickerDialogProps) {
    const [draftIds, setDraftIds] = useState<string[]>([]);
    const [leftChecked, setLeftChecked] = useState<string[]>([]);
    const [rightChecked, setRightChecked] = useState<string[]>([]);

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
        setDraftIds(selectedIds);
        setLeftChecked([]);
        setRightChecked([]);
    }, [open, selectedIds]);

    const productDevices = useMemo(
        () => devices.filter((item) => item.productId === productId),
        [devices, productId],
    );

    const availableDevices = useMemo(
        () => productDevices.filter((item) => !draftIds.includes(item.id)),
        [draftIds, productDevices],
    );

    const selectedDevices = useMemo(
        () => productDevices.filter((item) => draftIds.includes(item.id)),
        [draftIds, productDevices],
    );

    if (!open) return null;

    const toggleLeftCheck = (deviceId: string) => {
        setLeftChecked((prev) => (
            prev.includes(deviceId)
                ? prev.filter((id) => id !== deviceId)
                : [...prev, deviceId]
        ));
    };

    const toggleRightCheck = (deviceId: string) => {
        setRightChecked((prev) => (
            prev.includes(deviceId)
                ? prev.filter((id) => id !== deviceId)
                : [...prev, deviceId]
        ));
    };

    const toggleLeftAll = () => {
        const ids = availableDevices.map((device) => device.id);
        const allSelected = ids.length > 0 && ids.every((id) => leftChecked.includes(id));
        setLeftChecked(allSelected ? [] : ids);
    };

    const toggleRightAll = () => {
        const ids = selectedDevices.map((device) => device.id);
        const allSelected = ids.length > 0 && ids.every((id) => rightChecked.includes(id));
        setRightChecked(allSelected ? [] : ids);
    };

    const moveToRight = () => {
        if (!leftChecked.length) return;
        setDraftIds((prev) => Array.from(new Set([...prev, ...leftChecked])));
        setLeftChecked([]);
    };

    const moveToLeft = () => {
        if (!rightChecked.length) return;
        setDraftIds((prev) => prev.filter((id) => !rightChecked.includes(id)));
        setRightChecked([]);
    };

    const leftAllChecked = availableDevices.length > 0
        && availableDevices.every((device) => leftChecked.includes(device.id));

    const rightAllChecked = selectedDevices.length > 0
        && selectedDevices.every((device) => rightChecked.includes(device.id));

    const handleMaskMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
        if (event.target === event.currentTarget) {
            onClose();
        }
    };

    return createPortal(
        <div
            className="pcp-drawer-mask ru-drawer-mask ru-drawer-mask--nested"
            role="presentation"
            onMouseDown={handleMaskMouseDown}
        >
            <aside
                className="pcp-drawer ru-add-device-drawer"
                role="dialog"
                aria-modal="true"
                aria-labelledby="ru-add-device-title"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <div className="pcp-drawer__head">
                    <h3 id="ru-add-device-title">添加设备</h3>
                    <button type="button" className="pcp-drawer__close" onClick={onClose} aria-label="关闭">×</button>
                </div>

                <div className="pcp-drawer__body ru-add-device-body">
                    <div className="dg-transfer">
                        <div className="dg-transfer-panel">
                            <div className="dg-transfer-panel__head">
                                <span>选择设备</span>
                            </div>
                            <div className="dg-transfer-panel__list">
                                <label className="dg-transfer-item dg-transfer-item--all">
                                    <input
                                        type="checkbox"
                                        checked={leftAllChecked}
                                        onChange={toggleLeftAll}
                                    />
                                    <span>设备名称</span>
                                </label>
                                <ul className="dg-transfer-list">
                                    {availableDevices.map((device) => (
                                        <li key={device.id}>
                                            <label className="dg-transfer-item">
                                                <input
                                                    type="checkbox"
                                                    checked={leftChecked.includes(device.id)}
                                                    onChange={() => toggleLeftCheck(device.id)}
                                                />
                                                <span>{device.name}</span>
                                            </label>
                                        </li>
                                    ))}
                                    {!availableDevices.length && (
                                        <li className="dg-transfer-empty">暂无可选设备</li>
                                    )}
                                </ul>
                            </div>
                        </div>

                        <div className="dg-transfer-actions">
                            <button
                                type="button"
                                className="dg-transfer-actions__btn"
                                disabled={!leftChecked.length}
                                aria-label="添加到已选"
                                onClick={moveToRight}
                            >
                                <ChevronRight size={16} />
                            </button>
                            <button
                                type="button"
                                className="dg-transfer-actions__btn"
                                disabled={!rightChecked.length}
                                aria-label="移回可选"
                                onClick={moveToLeft}
                            >
                                <ChevronLeft size={16} />
                            </button>
                        </div>

                        <div className="dg-transfer-panel">
                            <div className="dg-transfer-panel__head">
                                <span>已选择设备</span>
                                <span className="ru-transfer-panel__count">{draftIds.length}个</span>
                            </div>
                            <div className="dg-transfer-panel__list">
                                <label className="dg-transfer-item dg-transfer-item--all">
                                    <input
                                        type="checkbox"
                                        checked={rightAllChecked}
                                        onChange={toggleRightAll}
                                    />
                                    <span>设备名称</span>
                                </label>
                                <ul className="dg-transfer-list">
                                    {selectedDevices.map((device) => (
                                        <li key={device.id}>
                                            <label className="dg-transfer-item">
                                                <input
                                                    type="checkbox"
                                                    checked={rightChecked.includes(device.id)}
                                                    onChange={() => toggleRightCheck(device.id)}
                                                />
                                                <span>{device.name}</span>
                                            </label>
                                        </li>
                                    ))}
                                    {!selectedDevices.length && (
                                        <li className="dg-transfer-empty">请从左侧选择设备</li>
                                    )}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pcp-drawer__foot">
                    <button type="button" className="pm-btn pm-btn-ghost" onClick={onClose}>取消</button>
                    <button
                        type="button"
                        className="pm-btn pm-btn-primary"
                        disabled={!draftIds.length}
                        onClick={() => onConfirm(draftIds)}
                    >
                        确定
                    </button>
                </div>
            </aside>
        </div>,
        document.body,
    );
}
