import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Minus, Plus } from 'lucide-react';
import ElSelect from './ElSelect';
import ElMultiSelect from './ElMultiSelect';
import ElTreeSelect from './ElTreeSelect';
import AssigneePickerDialog from './AssigneePickerDialog';
import IotToast, { type IotToastData, type IotToastType, triggerIotToast } from './IotToast';
import { ALARM_LEVEL_OPTIONS, type AlarmLevel } from '../data/deviceAlarms';
import {
    buildProductPickerTree,
    DEFAULT_PRODUCT_TREE_EXPANDED,
} from '../data/productCategories';
import { resolveDeviceOrg, type DeviceRecord } from '../data/devices';
import type { ProductRecord } from '../data/products';
import { type WorkOrderRecord } from '../data/workOrders';
import '../product-create.css';
import '../device-create.css';
import '../device-alarm-info.css';
import '../alarm-rule-config.css';
import '../work-order-management.css';
import ClearableInput from './ClearableInput';

const CONTENT_MAX = 100;

const LEVEL_OPTIONS = [
    { label: '请选择工单等级', value: '' },
    ...ALARM_LEVEL_OPTIONS
        .filter((item) => item !== '全部')
        .map((item) => ({ label: item, value: item })),
];

type RelatedDeviceRow = {
    id: string;
    productId: string;
    deviceIds: string[];
};

type WorkOrderCreateDrawerProps = {
    open: boolean;
    products: ProductRecord[];
    devices: DeviceRecord[];
    onClose: () => void;
    onSubmit: (workOrder: WorkOrderRecord) => void;
};

let deviceRowSeed = 0;

function createEmptyDeviceRow(): RelatedDeviceRow {
    deviceRowSeed += 1;
    return { id: `device-row-${deviceRowSeed}`, productId: '', deviceIds: [] };
}

export default function WorkOrderCreateDrawer({
    open,
    products,
    devices,
    onClose,
    onSubmit,
}: WorkOrderCreateDrawerProps) {
    const [name, setName] = useState('');
    const [level, setLevel] = useState('');
    const [content, setContent] = useState('');
    const [deviceRows, setDeviceRows] = useState<RelatedDeviceRow[]>([createEmptyDeviceRow()]);
    const [assignees, setAssignees] = useState<string[]>([]);
    const [pickerOpen, setPickerOpen] = useState(false);
    const [toast, setToast] = useState<IotToastData | null>(null);

    const productTree = useMemo(
        () => buildProductPickerTree(products),
        [products],
    );

    const productIds = useMemo(
        () => new Set(products.map((item) => item.id)),
        [products],
    );

    useEffect(() => {
        if (!open) return;
        setName('');
        setLevel('');
        setContent('');
        setDeviceRows([createEmptyDeviceRow()]);
        setAssignees([]);
        setPickerOpen(false);
        setToast(null);
    }, [open]);

    const showToast = (message: string, type: IotToastType = 'warning') => {
        triggerIotToast(setToast, message, type);
    };

    const getSelectedDeviceIds = (excludeRowId?: string) => deviceRows
        .filter((row) => row.id !== excludeRowId)
        .flatMap((row) => row.deviceIds);

    const getDeviceOptions = (row: RelatedDeviceRow) => {
        if (!row.productId) return [];

        const selectedElsewhere = new Set(getSelectedDeviceIds(row.id));
        return devices
            .filter((device) => device.productId === row.productId)
            .filter((device) => !selectedElsewhere.has(device.id) || row.deviceIds.includes(device.id))
            .map((device) => ({ label: device.name, value: device.id }));
    };

    const isRowComplete = (row: RelatedDeviceRow) => Boolean(row.productId && row.deviceIds.length > 0);

    const isRowEmpty = (row: RelatedDeviceRow) => !row.productId && row.deviceIds.length === 0;

    const hasIncompleteRow = deviceRows.some((row) => !isRowComplete(row) && !isRowEmpty(row));

    const completedDeviceRows = deviceRows.filter(isRowComplete);

    const updateDeviceRow = (rowId: string, patch: Partial<RelatedDeviceRow>) => {
        setDeviceRows((prev) => prev.map((row) => {
            if (row.id !== rowId) return row;

            const nextRow = { ...row, ...patch };

            if ('productId' in patch && patch.productId !== row.productId) {
                nextRow.deviceIds = [];
            }

            return nextRow;
        }));
    };

    const addDeviceRow = () => {
        if (hasIncompleteRow) {
            showToast('请先完成当前关联设备选择');
            return;
        }
        setDeviceRows((prev) => [...prev, createEmptyDeviceRow()]);
    };

    const removeDeviceRow = (rowId: string) => {
        setDeviceRows((prev) => {
            if (prev.length <= 1) return prev;
            return prev.filter((row) => row.id !== rowId);
        });
    };

    const canAddDeviceRow = !hasIncompleteRow;

    const canSubmit = useMemo(() => {
        const completed = deviceRows.filter(isRowComplete);
        const incomplete = deviceRows.some((row) => !isRowComplete(row) && !isRowEmpty(row));
        return Boolean(
            name.trim()
            && level
            && content.trim()
            && assignees.length > 0
            && completed.length > 0
            && !incomplete,
        );
    }, [name, level, content, assignees, deviceRows]);

    const handleSubmit = () => {
        if (!name.trim()) {
            showToast('请输入工单标题');
            return;
        }
        if (!level) {
            showToast('请选择工单等级');
            return;
        }
        if (hasIncompleteRow) {
            showToast('请完善关联设备信息');
            return;
        }
        if (!completedDeviceRows.length) {
            showToast('请选择关联设备');
            return;
        }

        const deviceIds = completedDeviceRows.flatMap((row) => row.deviceIds);
        if (new Set(deviceIds).size !== deviceIds.length) {
            showToast('关联设备不能重复选择');
            return;
        }
        if (!content.trim()) {
            showToast('请输入工单内容');
            return;
        }
        if (!assignees.length) {
            showToast('请选择工单指派');
            return;
        }

        const primaryDeviceId = completedDeviceRows[0]?.deviceIds[0];
        const primaryDevice = devices.find((device) => device.id === primaryDeviceId);
        const space = primaryDevice ? resolveDeviceOrg(primaryDevice).space : '—';

        const now = new Date();
        const pad = (value: number) => String(value).padStart(2, '0');
        const createdAt = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} `
            + `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
        const id = `0${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}`;

        const relatedDevices = completedDeviceRows.map((row) => {
            const product = products.find((item) => item.id === row.productId);
            const rowDevices = row.deviceIds
                .map((deviceId) => devices.find((device) => device.id === deviceId))
                .filter((device): device is DeviceRecord => Boolean(device));
            const primaryDevice = rowDevices[0];

            return {
                productName: product?.name ?? '—',
                space: primaryDevice ? resolveDeviceOrg(primaryDevice).space : '—',
                deviceNames: rowDevices.map((device) => device.name),
            };
        });

        onSubmit({
            id,
            name: name.trim(),
            level: level as AlarmLevel,
            type: '其他工单',
            status: '待处理',
            createdAt,
            readStatus: '未读',
            content: content.trim(),
            space,
            assignees,
            relatedDevices,
            createAttachmentCount: 0,
        });
    };

    const handleMaskMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
        if (event.target === event.currentTarget) {
            onClose();
        }
    };

    if (!open) return null;

    return createPortal(
        <>
            <div
                className="pcp-drawer-mask dcp-group-dialog-mask"
                role="presentation"
                onMouseDown={handleMaskMouseDown}
            >
                <aside
                    className="pcp-drawer pcp-drawer--form dcp-group-dialog wom-create-drawer"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="wom-create-drawer-title"
                    onMouseDown={(event) => event.stopPropagation()}
                >
                    <div className="pcp-drawer__head">
                        <h3 id="wom-create-drawer-title">创建工单</h3>
                        <button type="button" className="pcp-drawer__close" onClick={onClose} aria-label="关闭">×</button>
                    </div>
                    <div className="pcp-drawer__body pcp-drawer__body--form">
                        <label className="pcp-drawer-field">
                            <span className="pcp-form-label"><em>*</em>工单标题</span>
                            <ClearableInput
                                type="text"
                                className="pcp-form-input"
                                placeholder="请输入工单名称"
                                value={name}
                                onChange={(event) => setName(event.target.value)}
                            />
                        </label>
                        <div className="pcp-drawer-field">
                            <span className="pcp-form-label"><em>*</em>工单等级</span>
                            <ElSelect
                                className="el-select--medium"
                                size="medium"
                                value={level}
                                options={LEVEL_OPTIONS}
                                onChange={setLevel}
                            />
                        </div>
                        <div className="pcp-drawer-field">
                            <span className="pcp-form-label"><em>*</em>关联设备</span>
                            <div className="wom-device-rows">
                                {deviceRows.map((row, index) => (
                                    <div className="wom-device-row" key={row.id}>
                                        <div className="wom-device-row__cell">
                                            <ElTreeSelect
                                                className="el-select--medium pcp-form-select wom-product-tree-select"
                                                size="medium"
                                                value={row.productId}
                                                tree={productTree}
                                                placeholder="请选择产品"
                                                showAllOption={false}
                                                defaultExpanded={DEFAULT_PRODUCT_TREE_EXPANDED}
                                                filterable
                                                onChange={(productId) => {
                                                    if (!productIds.has(productId)) return;
                                                    updateDeviceRow(row.id, { productId, deviceIds: [] });
                                                }}
                                            />
                                        </div>
                                        <div className="wom-device-row__cell">
                                            <ElMultiSelect
                                                className="el-select--medium pcp-form-select"
                                                size="medium"
                                                value={row.deviceIds}
                                                placeholder="请选择设备"
                                                showSelectAll
                                                disabled={!row.productId}
                                                options={getDeviceOptions(row)}
                                                onChange={(deviceIds) => updateDeviceRow(row.id, { deviceIds })}
                                            />
                                        </div>
                                        <div className="wom-device-row__action">
                                            {deviceRows.length > 1 && (
                                                <button
                                                    type="button"
                                                    className="wom-device-remove"
                                                    aria-label={`删除关联设备${index + 1}`}
                                                    onClick={() => removeDeviceRow(row.id)}
                                                >
                                                    <Minus size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button
                                type="button"
                                className={`wom-device-add ${canAddDeviceRow ? '' : 'is-disabled'}`.trim()}
                                disabled={!canAddDeviceRow}
                                onClick={addDeviceRow}
                            >
                                <Plus size={14} />
                                添加
                            </button>
                        </div>
                        <label className="pcp-drawer-field">
                            <span className="pcp-form-label"><em>*</em>工单内容</span>
                            <div className="dai-textarea-wrap">
                                <textarea
                                    className="pcp-form-textarea dai-convert-textarea"
                                    placeholder="请输入描述信息"
                                    maxLength={CONTENT_MAX}
                                    value={content}
                                    onChange={(event) => setContent(event.target.value)}
                                />
                                <span className="dai-textarea-counter">
                                    {content.length}/{CONTENT_MAX}
                                </span>
                            </div>
                        </label>
                        <div className="pcp-drawer-field">
                            <span className="pcp-form-label"><em>*</em>工单指派</span>
                            <div className="dai-assignee-field">
                                <input
                                    type="text"
                                    readOnly
                                    className="pcp-form-input dai-assignee-display"
                                    placeholder="请选择"
                                    value={assignees.join('、')}
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
                        <div className="pcp-drawer-field">
                            <span className="pcp-form-label">附件</span>
                            <div className="pcp-upload-wrap dai-upload-wrap">
                                <button type="button" className="pcp-upload-box" aria-label="上传图片">
                                    <Plus size={18} />
                                    上传图片
                                </button>
                                <p className="pcp-upload-tip dai-upload-tip">
                                    支持文件格式：jpg、png、jpge单个文件不超过10M
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="pcp-drawer__foot">
                        <button type="button" className="pm-btn pm-btn-ghost" onClick={onClose}>取消</button>
                        <button
                            type="button"
                            className="pm-btn pm-btn-primary"
                            disabled={!canSubmit}
                            onClick={handleSubmit}
                        >
                            确定
                        </button>
                    </div>
                </aside>
            </div>

            <AssigneePickerDialog
                open={pickerOpen}
                selected={assignees}
                onClose={() => setPickerOpen(false)}
                onConfirm={(next) => {
                    setAssignees(next);
                    setPickerOpen(false);
                }}
            />

            <IotToast toast={toast} />
        </>,
        document.body,
    );
}
