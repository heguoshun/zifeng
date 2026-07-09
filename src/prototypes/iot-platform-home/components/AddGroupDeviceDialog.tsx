import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ElSelect from './ElSelect';
import ElTreeSelect from './ElTreeSelect';
import type { DeviceRecord } from '../data/devices';
import {
    deviceMatchesGroup,
    type DeviceGroupRecord,
    type DeviceGroupTypeItem,
} from '../data/deviceGroups';
import {
    buildProductPickerTree,
    itemMatchesProductFilter,
} from '../data/productCategories';
import type { ProductRecord } from '../data/products';
import '../product-create.css';
import '../device-create.css';
import '../device-group.css';

type AddGroupDeviceDialogProps = {
    open: boolean;
    devices: DeviceRecord[];
    products: ProductRecord[];
    group: DeviceGroupRecord;
    groupTypes: DeviceGroupTypeItem[];
    onClose: () => void;
    onConfirm: (deviceIds: string[]) => void;
};

const RIGHT_FILTER_OPTIONS = [{ label: '全部', value: 'all' }];

export default function AddGroupDeviceDialog({
    open,
    devices,
    products,
    group,
    groupTypes,
    onClose,
    onConfirm,
}: AddGroupDeviceDialogProps) {
    const productTree = useMemo(() => buildProductPickerTree(products), [products]);

    const defaultProductFilter = useMemo(() => {
        const firstProduct = products.find((product) => devices.some((device) => (
            device.productId === product.id
            && !deviceMatchesGroup(device, groupTypes, group)
        )));
        return firstProduct?.id ?? products[0]?.id ?? 'all';
    }, [devices, group, groupTypes, products]);

    const [productFilter, setProductFilter] = useState(defaultProductFilter);
    const [rightFilter, setRightFilter] = useState('all');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [leftChecked, setLeftChecked] = useState<string[]>([]);
    const [rightChecked, setRightChecked] = useState<string[]>([]);

    useEffect(() => {
        if (!open) return;
        setProductFilter(defaultProductFilter);
        setRightFilter('all');
        setSelectedIds([]);
        setLeftChecked([]);
        setRightChecked([]);
    }, [defaultProductFilter, open]);

    const availableDevices = useMemo(() => devices.filter((device) => (
        !deviceMatchesGroup(device, groupTypes, group)
        && !selectedIds.includes(device.id)
        && itemMatchesProductFilter(productFilter, device.productId, products)
    )), [devices, group, groupTypes, productFilter, products, selectedIds]);

    const selectedDevices = useMemo(() => {
        const list = devices.filter((device) => selectedIds.includes(device.id));
        if (rightFilter === 'all') return list;
        return list.filter((device) => itemMatchesProductFilter(rightFilter, device.productId, products));
    }, [devices, products, rightFilter, selectedIds]);

    const rightFilterOptions = useMemo(() => {
        const productOptions = products
            .filter((product) => selectedIds.some((deviceId) => {
                const device = devices.find((item) => item.id === deviceId);
                return device?.productId === product.id;
            }))
            .map((product) => ({
                label: product.name,
                value: product.id,
            }));

        return [...RIGHT_FILTER_OPTIONS, ...productOptions];
    }, [devices, products, selectedIds]);

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
        setSelectedIds((prev) => Array.from(new Set([...prev, ...leftChecked])));
        setLeftChecked([]);
    };

    const moveToLeft = () => {
        if (!rightChecked.length) return;
        setSelectedIds((prev) => prev.filter((id) => !rightChecked.includes(id)));
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
            className="pcp-drawer-mask dg-add-device-mask"
            role="presentation"
            onMouseDown={handleMaskMouseDown}
        >
            <aside
                className="pcp-drawer dg-add-device-drawer"
                role="dialog"
                aria-modal="true"
                aria-labelledby="dg-add-device-title"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <div className="pcp-drawer__head">
                    <h3 id="dg-add-device-title">添加设备</h3>
                    <button type="button" className="pcp-drawer__close" onClick={onClose} aria-label="关闭">×</button>
                </div>

                <div className="pcp-drawer__body dg-add-device-body">
                    <div className="dg-transfer">
                        <div className="dg-transfer-panel">
                            <div className="dg-transfer-panel__head">
                                <span>选择设备</span>
                            </div>
                            <div className="dg-transfer-panel__filter">
                                <ElTreeSelect
                                    className="el-select--medium dg-transfer-product-select"
                                    size="medium"
                                    value={productFilter}
                                    tree={productTree}
                                    placeholder="请选择产品"
                                    filterable
                                    onChange={(value) => {
                                        setProductFilter(value);
                                        setLeftChecked([]);
                                    }}
                                />
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
                                <span className="dg-transfer-panel__count">{selectedIds.length}个</span>
                            </div>
                            <div className="dg-transfer-panel__filter">
                                <ElSelect
                                    className="el-select--medium dg-transfer-product-select"
                                    size="medium"
                                    value={rightFilter}
                                    options={rightFilterOptions}
                                    onChange={setRightFilter}
                                />
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
                        disabled={!selectedIds.length}
                        onClick={() => onConfirm(selectedIds)}
                    >
                        确定
                    </button>
                </div>
            </aside>
        </div>,
        document.body,
    );
}
