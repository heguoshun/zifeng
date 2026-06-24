import React, { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import ListPagination from './ListPagination';

import ElSelect from './ElSelect';
import DeviceGroupTags from './DeviceGroupTags';
import {
    STATUS_LABEL,
    resolveDeviceOrg,
    type DeviceRecord,
} from '../data/devices';
import { paginateItems, DEFAULT_LIST_PAGE_SIZE } from '../utils/listPagination';
import { handleSelectableRowClick } from '../../../common/selectableRow';
import type { ProductRecord } from '../data/products';
import { ConfirmDialog } from './IotDialogs';
import IotToast, { type IotToastData, type IotToastType, triggerIotToast } from './IotToast';
import '../sub-device-management.css';
import ClearableInput from './ClearableInput';

const STATUS_OPTIONS = [
    { label: '请选择', value: '' },
    { label: '在线', value: 'online' },
    { label: '离线', value: 'offline' },
    { label: '故障', value: 'fault' },
    { label: '禁用', value: 'disabled' },
];

type SubDeviceManagementPanelProps = {
    gatewayDevice: DeviceRecord;
    subDevices: DeviceRecord[];
    products: ProductRecord[];
    allDevices: DeviceRecord[];
    onShowToast: (message: string, type?: IotToastType) => void;
};

export default function SubDeviceManagementPanel({
    gatewayDevice,
    subDevices,
    products,
    allDevices,
    onShowToast,
}: SubDeviceManagementPanelProps) {
    const [draftName, setDraftName] = useState('');
    const [draftCode, setDraftCode] = useState('');
    const [draftStatus, setDraftStatus] = useState('');

    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [status, setStatus] = useState('');

    const [pageSize, setPageSize] = useState('20');
    const [currentPage, setCurrentPage] = useState(1);
    const [jumpPage, setJumpPage] = useState('1');

    const [toast, setToast] = useState<IotToastData | null>(null);
    const [unbindingDevice, setUnbindingDevice] = useState<DeviceRecord | null>(null);

    /* 本地管理的已绑定子设备列表（支持解绑/绑定操作） */
    const [boundDevices, setBoundDevices] = useState<DeviceRecord[]>(() => subDevices);

    /* 绑定抽屉 */
    const [bindDrawerOpen, setBindDrawerOpen] = useState(false);
    const [bindDraftName, setBindDraftName] = useState('');
    const [bindDraftCode, setBindDraftCode] = useState('');
    const [bindDraftStatus, setBindDraftStatus] = useState('');
    const [bindName, setBindName] = useState('');
    const [bindCode, setBindCode] = useState('');
    const [bindStatus, setBindStatus] = useState('');
    const [bindPageSize, setBindPageSize] = useState('10');
    const [bindCurrentPage, setBindCurrentPage] = useState(1);
    const [bindJumpPage, setBindJumpPage] = useState('1');
    const [selectedBindIds, setSelectedBindIds] = useState<Set<string>>(new Set());

    const showToast = (message: string, type: IotToastType = 'warning') => {
        triggerIotToast(setToast, message, type);
    };

    const enrichedSubDevices = useMemo(
        () =>
            boundDevices.map((device) => ({
                ...device,
                productName:
                    products.find((p) => p.id === device.productId)?.name ?? '—',
                nodeType:
                    products.find((p) => p.id === device.productId)?.nodeType ??
                    '直连设备',
                ...resolveDeviceOrg(device),
            })),
        [boundDevices, products],
    );

    const filteredDevices = useMemo(() => {
        return enrichedSubDevices.filter((device) => {
            const matchName = !name || device.name.includes(name);
            const matchCode = !code || device.code.includes(code);
            const matchStatus = !status || device.status === status;
            return matchName && matchCode && matchStatus;
        });
    }, [enrichedSubDevices, name, code, status]);

    const pagination = useMemo(
        () => paginateItems(filteredDevices, currentPage, Number(pageSize)),
        [currentPage, filteredDevices, pageSize],
    );

    const displayDevices = pagination.items;

    const handleSearch = () => {
        setName(draftName.trim());
        setCode(draftCode.trim());
        setStatus(draftStatus);
        setCurrentPage(1);
        setJumpPage('1');
    };

    const handleReset = () => {
        setDraftName('');
        setDraftCode('');
        setDraftStatus('');
        setName('');
        setCode('');
        setStatus('');
        setCurrentPage(1);
        setJumpPage('1');
    };

    /* ── 绑定逻辑 ── */

    const availableDevices = useMemo(
        () => {
            const boundIds = new Set(boundDevices.map((d) => d.id));
            return allDevices.filter((device) => {
                if (boundIds.has(device.id)) return false;
                if (device.id === gatewayDevice.id) return false;
                const product = products.find((p) => p.id === device.productId);
                return product?.nodeType === '网关子设备';
            });
        },
        [allDevices, boundDevices, gatewayDevice, products],
    );

    const enrichedAvailable = useMemo(
        () =>
            availableDevices.map((device) => {
                const product = products.find((p) => p.id === device.productId);
                const org = resolveDeviceOrg(device);
                return {
                    ...device,
                    productName: product?.name ?? '—',
                    nodeType: product?.nodeType ?? '—',
                    departmentName: org.department,
                };
            }),
        [availableDevices, products],
    );

    const filteredAvailable = useMemo(() => {
        return enrichedAvailable.filter((device) => {
            const matchName = !bindName || device.name.includes(bindName);
            const matchCode = !bindCode || device.code.includes(bindCode);
            const matchStatus = !bindStatus || device.status === bindStatus;
            return matchName && matchCode && matchStatus;
        });
    }, [enrichedAvailable, bindName, bindCode, bindStatus]);

    const bindPagination = useMemo(
        () => paginateItems(filteredAvailable, bindCurrentPage, Number(bindPageSize)),
        [bindCurrentPage, filteredAvailable, bindPageSize],
    );

    const bindHandleSearch = () => {
        setBindName(bindDraftName.trim());
        setBindCode(bindDraftCode.trim());
        setBindStatus(bindDraftStatus);
        setBindCurrentPage(1);
        setBindJumpPage('1');
    };

    const bindHandleReset = () => {
        setBindDraftName('');
        setBindDraftCode('');
        setBindDraftStatus('');
        setBindName('');
        setBindCode('');
        setBindStatus('');
        setBindCurrentPage(1);
        setBindJumpPage('1');
    };

    const toggleBindSelect = (deviceId: string) => {
        setSelectedBindIds((prev) => {
            const next = new Set(prev);
            if (next.has(deviceId)) {
                next.delete(deviceId);
            } else {
                next.add(deviceId);
            }
            return next;
        });
    };

    const toggleBindSelectAll = () => {
        const pageIds = bindPagination.items.map((d) => d.id);
        const allSelected = pageIds.length > 0 && pageIds.every((id) => selectedBindIds.has(id));
        setSelectedBindIds((prev) => {
            const next = new Set(prev);
            if (allSelected) {
                pageIds.forEach((id) => next.delete(id));
            } else {
                pageIds.forEach((id) => next.add(id));
            }
            return next;
        });
    };

    const handleBindConfirm = () => {
        if (selectedBindIds.size === 0) {
            showToast('请选择要绑定的子设备');
            return;
        }
        const selectedDevices = availableDevices.filter((d) => selectedBindIds.has(d.id));
        const names = selectedDevices.map((d) => d.name).join('、');
        setBoundDevices((prev) => [...prev, ...selectedDevices]);
        setBindDrawerOpen(false);
        setSelectedBindIds(new Set());
        showToast(`已成功绑定 ${selectedBindIds.size} 台子设备：${names}`, 'success');
    };

    const handleOpenBind = () => {
        setBindDraftName('');
        setBindDraftCode('');
        setBindDraftStatus('');
        setBindName('');
        setBindCode('');
        setBindStatus('');
        setBindCurrentPage(1);
        setBindJumpPage('1');
        setSelectedBindIds(new Set());
        setBindDrawerOpen(true);
    };

    const handleUnbind = () => {
        if (!unbindingDevice) return;
        setBoundDevices((prev) => prev.filter((d) => d.id !== unbindingDevice.id));
        showToast(`子设备「${unbindingDevice.name}」已解绑`, 'success');
        setUnbindingDevice(null);
    };

    return (
        <section className="panel dcp-panel sdm-panel">
            <div className="pm-filter-row sdm-filter-row">
                <div className="pm-filter-field">
                    <span className="pm-filter-label">设备名称</span>
                    <ClearableInput
                        type="text"
                        className="pm-filter-input"
                        placeholder="请输入产品名称"
                        value={draftName}
                        onChange={(e) => setDraftName(e.target.value)}
                    />
                </div>
                <div className="pm-filter-field">
                    <span className="pm-filter-label">设备编号</span>
                    <ClearableInput
                        type="text"
                        className="pm-filter-input"
                        placeholder="输入产品编号"
                        value={draftCode}
                        onChange={(e) => setDraftCode(e.target.value)}
                    />
                </div>
                <div className="pm-filter-field">
                    <span className="pm-filter-label">设备状态</span>
                    <ElSelect
                        className="el-select--medium"
                        size="medium"
                        value={draftStatus}
                        options={STATUS_OPTIONS}
                        onChange={setDraftStatus}
                    />
                </div>
                <div className="pm-filter-actions">
                    <button
                        type="button"
                        className="pm-btn pm-btn-primary"
                        onClick={handleSearch}
                    >
                        <Search size={14} />
                        搜索
                    </button>
                    <button
                        type="button"
                        className="pm-btn pm-btn-ghost"
                        onClick={handleReset}
                    >
                        重置
                    </button>
                    <button
                        type="button"
                        className="pm-btn pm-btn-primary"
                        onClick={handleOpenBind}
                    >
                        绑定
                    </button>
                </div>
            </div>

            <div className="pm-table-wrap">
                <table className="pm-table pm-table--sub-device">
                    <thead>
                        <tr>
                            <th><input type="checkbox" aria-label="全选" /></th>
                            <th>序号</th>
                            <th>设备编号</th>
                            <th>设备名称</th>
                            <th>所属产品</th>
                            <th>节点类型</th>
                            <th>设备状态</th>
                            <th>所属部门</th>
                            <th>设备分组</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {displayDevices.map((device, index) => {
                            const org = resolveDeviceOrg(device);
                            return (
                                <tr key={device.id}>
                                    <td><input type="checkbox" aria-label={`选择 ${device.name}`} /></td>
                                    <td>{(pagination.currentPage - 1) * Number(pageSize) + index + 1}</td>
                                    <td>{device.code}</td>
                                    <td>{device.name}</td>
                                    <td>{device.productName}</td>
                                    <td>{device.nodeType}</td>
                                    <td>
                                        <span className={`sdm-status-tag sdm-status-tag--${device.status}`}>
                                            {STATUS_LABEL[device.status]}
                                        </span>
                                    </td>
                                    <td>{org.department}</td>
                                    <td><DeviceGroupTags groups={device.groups} /></td>
                                    <td>
                                        <button
                                            type="button"
                                            className="pm-link-btn pm-link-btn--danger"
                                            onClick={() => setUnbindingDevice(device)}
                                        >
                                            解绑
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                        {!displayDevices.length && (
                            <tr>
                                <td colSpan={10} className="pcp-empty-cell">
                                    暂无子设备
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* ── 分页 ── */}
            <ListPagination
                total={pagination.total}
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                pageSize={pageSize}
                jumpPage={jumpPage}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
                onJumpPageChange={setJumpPage}
            />

            {/* ── 绑定抽屉 ── */}
            {bindDrawerOpen && (
                <>
                    <div className="pcp-drawer-mask" onClick={() => setBindDrawerOpen(false)} />
                    <aside className="pcp-drawer pcp-drawer--form sdm-bind-drawer" style={{ position: 'fixed', zIndex: 120 }}>
                        <div className="pcp-drawer__head">
                            <h3>绑定子设备</h3>
                            <button
                                type="button"
                                className="pcp-drawer__close"
                                onClick={() => setBindDrawerOpen(false)}
                            >
                                ×
                            </button>
                        </div>

                        <div className="pcp-drawer__body pcp-drawer__body--form sdm-bind-drawer__body">
                            {/* 筛选 */}
                            <div className="sdm-bind-filter">
                                <label className="sdm-filter-item">
                                    <span className="sdm-filter-label">设备名称</span>
                                    <ClearableInput
                                        type="text"
                                        className="sdm-filter-input"
                                        placeholder="请输入设备名称"
                                        value={bindDraftName}
                                        onChange={(e) => setBindDraftName(e.target.value)}
                                    />
                                </label>
                                <label className="sdm-filter-item">
                                    <span className="sdm-filter-label">设备编号</span>
                                    <ClearableInput
                                        type="text"
                                        className="sdm-filter-input"
                                        placeholder="请输入设备编号"
                                        value={bindDraftCode}
                                        onChange={(e) => setBindDraftCode(e.target.value)}
                                    />
                                </label>
                                <div className="sdm-filter-item">
                                    <span className="sdm-filter-label">设备状态</span>
                                    <ElSelect
                                        className="el-select--medium"
                                        size="medium"
                                        value={bindDraftStatus}
                                        options={STATUS_OPTIONS}
                                        onChange={setBindDraftStatus}
                                    />
                                </div>
                                <div className="sdm-filter-actions">
                                    <button
                                        type="button"
                                        className="pm-btn pm-btn-primary"
                                        onClick={bindHandleSearch}
                                    >
                                        <Search size={14} />
                                        搜索
                                    </button>
                                    <button
                                        type="button"
                                        className="pm-btn pm-btn-ghost"
                                        onClick={bindHandleReset}
                                    >
                                        重置
                                    </button>
                                </div>
                            </div>

                            {/* 设备列表 */}
                            <div className="pm-table-wrap sdm-bind-table-wrap">
                                <table className="pm-table pm-table--sub-device">
                                    <thead>
                                        <tr>
                                            <th>
                                                <input
                                                    type="checkbox"
                                                    aria-label="全选"
                                                    checked={
                                                        bindPagination.items.length > 0 &&
                                                        bindPagination.items.every((d) => selectedBindIds.has(d.id))
                                                    }
                                                    onChange={toggleBindSelectAll}
                                                />
                                            </th>
                                            <th>序号</th>
                                            <th>设备编号</th>
                                            <th>设备名称</th>
                                            <th>所属产品</th>
                                            <th>节点类型</th>
                                            <th>设备状态</th>
                                            <th>所属部门</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {bindPagination.items.map((device, index) => (
                                            <tr
                                                key={device.id}
                                                className="iot-selectable-row"
                                                onClick={(event) => handleSelectableRowClick(
                                                    event,
                                                    () => toggleBindSelect(device.id),
                                                )}
                                            >
                                                <td>
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedBindIds.has(device.id)}
                                                        onChange={() => toggleBindSelect(device.id)}
                                                        aria-label={`选择 ${device.name}`}
                                                    />
                                                </td>
                                                <td>{(bindPagination.currentPage - 1) * Number(bindPageSize) + index + 1}</td>
                                                <td>{device.code}</td>
                                                <td>{device.name}</td>
                                                <td>{device.productName}</td>
                                                <td>{device.nodeType}</td>
                                                <td>
                                                    <span className={`sdm-status-tag sdm-status-tag--${device.status}`}>
                                                        {STATUS_LABEL[device.status]}
                                                    </span>
                                                </td>
                                                <td>{device.departmentName}</td>
                                            </tr>
                                        ))}
                                        {!bindPagination.items.length && (
                                            <tr>
                                                <td colSpan={8} className="pcp-empty-cell">
                                                    暂无可绑定的子设备
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* 分页 */}
                            <ListPagination
                                total={bindPagination.total}
                                currentPage={bindPagination.currentPage}
                                totalPages={bindPagination.totalPages}
                                pageSize={bindPageSize}
                                jumpPage={bindJumpPage}
                                onPageChange={setBindCurrentPage}
                                onPageSizeChange={setBindPageSize}
                                onJumpPageChange={setBindJumpPage}
                            />
                        </div>

                        <div className="pcp-drawer__foot">
                            <button
                                type="button"
                                className="pm-btn pm-btn-ghost"
                                onClick={() => setBindDrawerOpen(false)}
                            >
                                取消
                            </button>
                            <button
                                type="button"
                                className="pm-btn pm-btn-primary"
                                onClick={handleBindConfirm}
                            >
                                确定
                            </button>
                        </div>
                    </aside>
                </>
            )}

            {/* ── 解绑确认 ── */}
            {unbindingDevice && (
                <ConfirmDialog
                    title="解绑子设备"
                    message={`确定要解绑子设备「${unbindingDevice.name}」吗？`}
                    onClose={() => setUnbindingDevice(null)}
                    onConfirm={handleUnbind}
                />
            )}

            <IotToast toast={toast} />
        </section>
    );
}
