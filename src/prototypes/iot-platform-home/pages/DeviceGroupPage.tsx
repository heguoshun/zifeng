import React, { useEffect, useMemo, useState } from 'react';
import { Search, Trash2, X } from 'lucide-react';
import AppShell from '../components/AppShell';
import DeviceAccessSidebar, { type DeviceAccessPageId } from '../components/DeviceAccessSidebar';
import AddGroupDeviceDialog from '../components/AddGroupDeviceDialog';
import DeviceGroupTags from '../components/DeviceGroupTags';
import DeviceGroupFormDialog from '../components/DeviceGroupFormDialog';
import DeviceGroupTypeDialog from '../components/DeviceGroupTypeDialog';
import ElSelect from '../components/ElSelect';
import ElTreeSelect from '../components/ElTreeSelect';
import { ConfirmDialog } from '../components/IotDialogs';
import IotToast, { type IotToastData, type IotToastType, triggerIotToast } from '../components/IotToast';
import ListPagination from '../components/ListPagination';
import {
    DEPARTMENT_TREE,
    matchesTreeSelection,
} from '../data/orgHierarchy';
import {
    STATUS_LABEL,
    formatCollectFrequencyDisplay,
    resolveDeviceOrg,
    resolveDeviceProduct,
    type DeviceRecord,
    type DeviceStatus,
} from '../data/devices';
import {
    addDeviceToGroup,
    buildGroupTypeOptions,
    countDevicesInGroup,
    deviceMatchesGroup,
    formatGroupCreatedAt,
    generateGroupCode,
    getGroupTypeLabel,
    removeDeviceFromGroup,
    type DeviceGroupRecord,
    type DeviceGroupTypeItem,
} from '../data/deviceGroups';
import type { ProductRecord } from '../data/products';
import { paginateItems, DEFAULT_LIST_PAGE_SIZE } from '../utils/listPagination';
import { handleSelectableRowClick } from '../../../common/selectableRow';
import '../device-access.css';
import '../product-management.css';
import '../device-management.css';
import '../device-group.css';
import ClearableInput from '../components/ClearableInput';

type DeviceGroupPageProps = {
    groups: DeviceGroupRecord[];
    groupTypes: DeviceGroupTypeItem[];
    devices: DeviceRecord[];
    products: ProductRecord[];
    onUpdateGroups: React.Dispatch<React.SetStateAction<DeviceGroupRecord[]>>;
    onUpdateGroupTypes: React.Dispatch<React.SetStateAction<DeviceGroupTypeItem[]>>;
    onUpdateDevices: React.Dispatch<React.SetStateAction<DeviceRecord[]>>;
    onNavigateHome: () => void;
    onNavigate: (pageId: DeviceAccessPageId) => void;
};

type GroupRow = DeviceGroupRecord & {
    deviceCount: number;
    typeLabel: string;
};

type EnrichedDevice = DeviceRecord & {
    productName: string;
    nodeType: string;
    department: string;
    space: string;
};

type DeleteTarget =
    | { mode: 'single'; group: DeviceGroupRecord }
    | { mode: 'batch'; count: number };

type RemoveDeviceTarget =
    | { mode: 'single'; device: DeviceRecord }
    | { mode: 'batch'; count: number };

const NODE_TYPE_OPTIONS = ['全部', '直连设备', '网关设备', '网关子设备'].map((type) => ({
    label: type,
    value: type,
}));

const STATUS_OPTIONS = ['全部', '在线', '离线', '故障', '禁用'].map((type) => ({
    label: type,
    value: type,
}));

const STATUS_FILTER_MAP: Record<string, DeviceStatus | '全部'> = {
    全部: '全部',
    在线: 'online',
    离线: 'offline',
    故障: 'fault',
    禁用: 'disabled',
};

function StatusTag({ status }: { status: DeviceStatus }) {
    return (
        <span className={`dm-status-tag dm-status-tag--${status}`}>
            {STATUS_LABEL[status]}
        </span>
    );
}

export default function DeviceGroupPage({
    groups,
    groupTypes,
    devices,
    products,
    onUpdateGroups,
    onUpdateGroupTypes,
    onUpdateDevices,
    onNavigateHome,
    onNavigate,
}: DeviceGroupPageProps) {
    const [activeType, setActiveType] = useState<'all' | string>('all');
    const [keyword, setKeyword] = useState('');
    const [draftKeyword, setDraftKeyword] = useState('');
    const [pageSize, setPageSize] = useState('20');
    const [currentPage, setCurrentPage] = useState(1);
    const [jumpPage, setJumpPage] = useState('1');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [viewingGroup, setViewingGroup] = useState<DeviceGroupRecord | null>(null);
    const [formOpen, setFormOpen] = useState(false);
    const [typeDialogOpen, setTypeDialogOpen] = useState(false);
    const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
    const [editingGroup, setEditingGroup] = useState<DeviceGroupRecord | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
    const [removeDeviceTarget, setRemoveDeviceTarget] = useState<RemoveDeviceTarget | null>(null);
    const [addDeviceOpen, setAddDeviceOpen] = useState(false);
    const [toast, setToast] = useState<IotToastData | null>(null);

    const [nodeType, setNodeType] = useState('全部');
    const [deviceStatus, setDeviceStatus] = useState('全部');
    const [department, setDepartment] = useState('all');
    const [deviceKeyword, setDeviceKeyword] = useState('');
    const [draftNodeType, setDraftNodeType] = useState('全部');
    const [draftDeviceStatus, setDraftDeviceStatus] = useState('全部');
    const [draftDepartment, setDraftDepartment] = useState('all');
    const [draftDeviceKeyword, setDraftDeviceKeyword] = useState('');
    const [devicePageSize, setDevicePageSize] = useState('10');
    const [deviceCurrentPage, setDeviceCurrentPage] = useState(1);
    const [deviceJumpPage, setDeviceJumpPage] = useState('1');
    const [selectedDeviceIds, setSelectedDeviceIds] = useState<string[]>([]);
    const [viewDevice, setViewDevice] = useState<EnrichedDevice | null>(null);

    const typeOptions = useMemo(() => buildGroupTypeOptions(groupTypes), [groupTypes]);

    const typeSidebarItems = useMemo(() => ([
        { id: 'all' as const, label: '全部' },
        ...typeOptions.map((item) => ({ id: item.value, label: item.label })),
    ]), [typeOptions]);

    const showToast = (message: string, type: IotToastType = 'warning') => {
        triggerIotToast(setToast, message, type);
    };

    const enrichedGroups = useMemo<GroupRow[]>(() => groups.map((group) => ({
        ...group,
        typeLabel: getGroupTypeLabel(groupTypes, group.type),
        deviceCount: countDevicesInGroup(devices, groupTypes, group),
    })), [groups, devices, groupTypes]);

    const typeCounts = useMemo(() => {
        const counts: Record<string, number> = { all: enrichedGroups.length };
        groupTypes.forEach((type) => {
            counts[type.id] = 0;
        });
        enrichedGroups.forEach((group) => {
            if (counts[group.type] != null) {
                counts[group.type] += 1;
            }
        });
        return counts;
    }, [enrichedGroups, groupTypes]);

    const filteredGroups = useMemo(() => enrichedGroups.filter((group) => {
        const matchType = activeType === 'all' || group.type === activeType;
        const matchKeyword = !keyword || group.name.includes(keyword) || group.code.includes(keyword);
        return matchType && matchKeyword;
    }), [activeType, enrichedGroups, keyword]);

    const pagination = useMemo(
        () => paginateItems(filteredGroups, currentPage, Number(pageSize)),
        [currentPage, filteredGroups, pageSize],
    );

    const enrichedDevices = useMemo(() => devices.map((device) => ({
        ...device,
        ...resolveDeviceProduct(device, products),
        ...resolveDeviceOrg(device),
    })), [devices, products]);

    const devicesInGroup = useMemo(() => {
        if (!viewingGroup) return [];

        return enrichedDevices.filter((device) => {
            const matchType = nodeType === '全部' || device.nodeType === nodeType;
            const matchDepartment = matchesTreeSelection(department, device.departmentId, DEPARTMENT_TREE);
            const matchKeyword = !deviceKeyword
                || device.name.includes(deviceKeyword)
                || device.code.includes(deviceKeyword);
            return matchType && matchDepartment && matchKeyword
                && deviceMatchesGroup(device, groupTypes, viewingGroup);
        });
    }, [department, deviceKeyword, enrichedDevices, groupTypes, nodeType, viewingGroup]);

    const filteredDevices = useMemo(() => {
        const statusFilter = STATUS_FILTER_MAP[deviceStatus];
        if (statusFilter === '全部') return devicesInGroup;
        return devicesInGroup.filter((device) => device.status === statusFilter);
    }, [deviceStatus, devicesInGroup]);

    const devicePagination = useMemo(
        () => paginateItems(filteredDevices, deviceCurrentPage, Number(devicePageSize)),
        [deviceCurrentPage, devicePageSize, filteredDevices],
    );

    useEffect(() => {
        if (activeType === 'all') return;
        if (groupTypes.some((item) => item.id === activeType)) return;
        setActiveType('all');
    }, [activeType, groupTypes]);

    useEffect(() => {
        setCurrentPage(1);
        setJumpPage('1');
        setSelectedIds([]);
    }, [activeType, keyword, pageSize]);

    useEffect(() => {
        setJumpPage(String(pagination.currentPage));
    }, [pagination.currentPage]);

    useEffect(() => {
        if (!viewingGroup) return;
        if (groups.some((item) => item.id === viewingGroup.id)) return;
        setViewingGroup(null);
    }, [groups, viewingGroup]);

    useEffect(() => {
        setDeviceCurrentPage(1);
        setDeviceJumpPage('1');
        setSelectedDeviceIds([]);
    }, [viewingGroup, nodeType, deviceStatus, department, deviceKeyword, devicePageSize]);

    useEffect(() => {
        setDeviceJumpPage(String(devicePagination.currentPage));
    }, [devicePagination.currentPage]);

    const pageIds = pagination.items.map((item) => item.id);
    const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));

    const pageDeviceIds = devicePagination.items.map((item) => item.id);
    const allPageDevicesSelected = pageDeviceIds.length > 0
        && pageDeviceIds.every((id) => selectedDeviceIds.includes(id));

    const toggleSelectAll = () => {
        if (allPageSelected) {
            setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
            return;
        }

        setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    };

    const toggleSelectRow = (groupId: string) => {
        setSelectedIds((prev) => (
            prev.includes(groupId)
                ? prev.filter((id) => id !== groupId)
                : [...prev, groupId]
        ));
    };

    const toggleSelectAllDevices = () => {
        if (allPageDevicesSelected) {
            setSelectedDeviceIds((prev) => prev.filter((id) => !pageDeviceIds.includes(id)));
            return;
        }
        setSelectedDeviceIds((prev) => Array.from(new Set([...prev, ...pageDeviceIds])));
    };

    const toggleSelectDevice = (deviceId: string) => {
        setSelectedDeviceIds((prev) => (
            prev.includes(deviceId)
                ? prev.filter((id) => id !== deviceId)
                : [...prev, deviceId]
        ));
    };

    const openCreateDialog = () => {
        setFormMode('create');
        setEditingGroup(null);
        setFormOpen(true);
    };

    const openEditDialog = (group: DeviceGroupRecord) => {
        setFormMode('edit');
        setEditingGroup(group);
        setFormOpen(true);
    };

    const handleConfirmForm = (value: { name: string; type: string }) => {
        const trimmedName = value.name.trim();
        const duplicated = groups.some((item) => (
            item.name === trimmedName
            && item.type === value.type
            && item.id !== editingGroup?.id
        ));

        if (duplicated) {
            showToast('同类型下已存在相同分组名称');
            return;
        }

        if (formMode === 'edit' && editingGroup) {
            onUpdateGroups((prev) => prev.map((item) => (
                item.id === editingGroup.id
                    ? { ...item, name: trimmedName, type: value.type }
                    : item
            )));
            setFormOpen(false);
            showToast('分组编辑成功', 'success');
            return;
        }

        onUpdateGroups((prev) => [
            {
                id: `group-${Date.now()}`,
                name: trimmedName,
                code: generateGroupCode(),
                type: value.type,
                createdAt: formatGroupCreatedAt(),
            },
            ...prev,
        ]);
        setFormOpen(false);
        showToast('分组新增成功', 'success');
    };

    const handleConfirmTypes = (nextTypes: DeviceGroupTypeItem[]) => {
        const removedTypeIds = groupTypes
            .filter((item) => !nextTypes.some((next) => next.id === item.id))
            .map((item) => item.id);

        if (removedTypeIds.length && groups.some((group) => removedTypeIds.includes(group.type))) {
            showToast('该类型下仍有分组，无法删除');
            return;
        }

        onUpdateGroupTypes(nextTypes);
        setTypeDialogOpen(false);
        showToast('分组类型保存成功', 'success');
    };

    const handleDeleteConfirm = () => {
        if (!deleteTarget) return;

        if (deleteTarget.mode === 'single') {
            onUpdateGroups((prev) => prev.filter((item) => item.id !== deleteTarget.group.id));
            setSelectedIds((prev) => prev.filter((id) => id !== deleteTarget.group.id));
            if (viewingGroup?.id === deleteTarget.group.id) {
                setViewingGroup(null);
            }
            showToast('分组删除成功', 'success');
        } else {
            onUpdateGroups((prev) => prev.filter((item) => !selectedIds.includes(item.id)));
            setSelectedIds([]);
            showToast(`已删除 ${deleteTarget.count} 个分组`, 'success');
        }

        setDeleteTarget(null);
    };

    const handleViewDevices = (group: DeviceGroupRecord) => {
        setViewingGroup(group);
        setDraftNodeType('全部');
        setDraftDeviceStatus('全部');
        setDraftDepartment('all');
        setDraftDeviceKeyword('');
        setNodeType('全部');
        setDeviceStatus('全部');
        setDepartment('all');
        setDeviceKeyword('');
    };

    const handleRemoveDevicesConfirm = () => {
        if (!removeDeviceTarget || !viewingGroup) return;

        const targetIds = removeDeviceTarget.mode === 'single'
            ? [removeDeviceTarget.device.id]
            : selectedDeviceIds;

        onUpdateDevices((prev) => prev.map((device) => (
            targetIds.includes(device.id)
                ? removeDeviceFromGroup(device, groupTypes, viewingGroup)
                : device
        )));

        setSelectedDeviceIds((prev) => prev.filter((id) => !targetIds.includes(id)));
        setRemoveDeviceTarget(null);
        showToast(
            removeDeviceTarget.mode === 'single'
                ? '设备已从分组移除'
                : `已从分组移除 ${removeDeviceTarget.count} 台设备`,
            'success',
        );
    };

    const handleAddDevicesConfirm = (deviceIds: string[]) => {
        if (!viewingGroup || !deviceIds.length) return;

        onUpdateDevices((prev) => prev.map((device) => (
            deviceIds.includes(device.id)
                ? addDeviceToGroup(device, groupTypes, viewingGroup)
                : device
        )));

        setAddDeviceOpen(false);
        showToast(`已添加 ${deviceIds.length} 台设备`, 'success');
    };

    const resetDeviceFilters = () => {
        setDraftNodeType('全部');
        setDraftDeviceStatus('全部');
        setDraftDepartment('all');
        setDraftDeviceKeyword('');
        setNodeType('全部');
        setDeviceStatus('全部');
        setDepartment('all');
        setDeviceKeyword('');
    };

    const sidebar = <DeviceAccessSidebar pageId="device-group" onNavigate={onNavigate} />;

    return (
        <AppShell
            activeTopTab="设备接入"
            sidebar={sidebar}
            onTopTabChange={(tab) => {
                if (tab === '设备接入') onNavigate('home');
            }}
        >
            <div className="pm-page">
                <div className="crumb">设备接入 / 设备管理 / 设备分组</div>

                {!viewingGroup && (
                    <section className="panel pm-filter-panel">
                        <div className="pm-filter-row dg-filter-row">
                            <div className="pm-filter-field">
                                <span className="pm-filter-label">分组名称</span>
                                <ClearableInput
                                    type="text"
                                    className="pm-filter-input"
                                    placeholder="请输入分组名称"
                                    value={draftKeyword}
                                    onChange={(event) => setDraftKeyword(event.target.value)}
                                />
                            </div>
                            <div className="pm-filter-actions">
                                <button
                                    type="button"
                                    className="pm-btn pm-btn-primary"
                                    onClick={() => setKeyword(draftKeyword.trim())}
                                >
                                    <Search size={14} />
                                    查询
                                </button>
                                <button
                                    type="button"
                                    className="pm-btn pm-btn-ghost"
                                    onClick={() => {
                                        setDraftKeyword('');
                                        setKeyword('');
                                    }}
                                >
                                    重置
                                </button>
                            </div>
                        </div>
                    </section>
                )}

                <div className="pm-content-grid">
                    <section className="panel pm-category-panel dg-type-panel">
                        <div className="pm-section-head">
                            <h3>分组类型</h3>
                            <button
                                type="button"
                                className="dg-type-add-btn"
                                onClick={() => setTypeDialogOpen(true)}
                            >
                                添加
                            </button>
                        </div>
                        <ul className="dg-type-list">
                            {typeSidebarItems.map((item) => (
                                <li key={item.id}>
                                    <button
                                        type="button"
                                        className={`dg-type-item ${activeType === item.id ? 'is-active' : ''}`.trim()}
                                        onClick={() => setActiveType(item.id)}
                                    >
                                        <span>{item.label}</span>
                                        <span className="dg-type-item__count">({typeCounts[item.id] ?? 0})</span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </section>

                    <section className="panel pm-list-panel">
                        {viewingGroup ? (
                            <>
                                <div className="dg-device-tag">
                                    <button
                                        type="button"
                                        className="dg-device-tag__close"
                                        aria-label="返回分组列表"
                                        onClick={() => setViewingGroup(null)}
                                    >
                                        <X size={12} />
                                    </button>
                                    <span>{viewingGroup.name}</span>
                                </div>

                                <section className="panel pm-filter-panel dg-device-filter">
                                    <div className="pm-filter-row dm-filter-row--device">
                                        <div className="pm-filter-field">
                                            <span className="pm-filter-label">节点类型</span>
                                            <ElSelect
                                                className="el-select--medium"
                                                size="medium"
                                                value={draftNodeType}
                                                options={NODE_TYPE_OPTIONS}
                                                onChange={setDraftNodeType}
                                            />
                                        </div>
                                        <div className="pm-filter-field">
                                            <span className="pm-filter-label">设备状态</span>
                                            <ElSelect
                                                className="el-select--medium"
                                                size="medium"
                                                value={draftDeviceStatus}
                                                options={STATUS_OPTIONS}
                                                onChange={setDraftDeviceStatus}
                                            />
                                        </div>
                                        <div className="pm-filter-field">
                                            <span className="pm-filter-label">所属部门</span>
                                            <ElTreeSelect
                                                className="el-select--medium dm-tree-select"
                                                size="medium"
                                                value={draftDepartment}
                                                tree={DEPARTMENT_TREE}
                                                onChange={setDraftDepartment}
                                            />
                                        </div>
                                        <div className="pm-filter-inline-group">
                                            <div className="pm-filter-field">
                                                <span className="pm-filter-label">设备搜索</span>
                                                <ClearableInput
                                                    type="text"
                                                    className="pm-filter-input"
                                                    placeholder="请输入设备名称/设备编号"
                                                    value={draftDeviceKeyword}
                                                    onChange={(event) => setDraftDeviceKeyword(event.target.value)}
                                                />
                                            </div>
                                            <div className="pm-filter-actions">
                                                <button
                                                    type="button"
                                                    className="pm-btn pm-btn-primary"
                                                    onClick={() => {
                                                        setNodeType(draftNodeType);
                                                        setDeviceStatus(draftDeviceStatus);
                                                        setDepartment(draftDepartment);
                                                        setDeviceKeyword(draftDeviceKeyword.trim());
                                                    }}
                                                >
                                                    <Search size={14} />
                                                    搜索
                                                </button>
                                                <button
                                                    type="button"
                                                    className="pm-btn pm-btn-ghost"
                                                    onClick={resetDeviceFilters}
                                                >
                                                    重置
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                <div className="dg-device-toolbar">
                                    <button
                                        type="button"
                                        className="pm-btn pm-btn-primary"
                                        onClick={() => setAddDeviceOpen(true)}
                                    >
                                        + 添加设备
                                    </button>
                                    <button
                                        type="button"
                                        className="pm-btn pm-btn-ghost dg-device-toolbar__danger"
                                        disabled={!selectedDeviceIds.length}
                                        onClick={() => {
                                            if (!selectedDeviceIds.length) return;
                                            setRemoveDeviceTarget({ mode: 'batch', count: selectedDeviceIds.length });
                                        }}
                                    >
                                        <Trash2 size={14} />
                                        批量删除设备
                                    </button>
                                </div>

                                <div className="pm-table-wrap dg-table-wrap">
                                    <table className="pm-table">
                                        <thead>
                                            <tr>
                                                <th>
                                                    <input
                                                        type="checkbox"
                                                        aria-label="全选"
                                                        checked={allPageDevicesSelected}
                                                        onChange={toggleSelectAllDevices}
                                                    />
                                                </th>
                                                <th>设备编号</th>
                                                <th>设备名称</th>
                                                <th>所属产品</th>
                                                <th>设备状态</th>
                                                <th>所属部门</th>
                                                <th>设备分组</th>
                                                <th>操作</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {devicePagination.items.map((device: EnrichedDevice) => (
                                                <tr
                                                    key={device.id}
                                                    className="iot-selectable-row"
                                                    onClick={(event) => handleSelectableRowClick(
                                                        event,
                                                        () => toggleSelectDevice(device.id),
                                                    )}
                                                >
                                                    <td>
                                                        <input
                                                            type="checkbox"
                                                            aria-label={`选择 ${device.name}`}
                                                            checked={selectedDeviceIds.includes(device.id)}
                                                            onChange={() => toggleSelectDevice(device.id)}
                                                        />
                                                    </td>
                                                    <td>{device.code}</td>
                                                    <td>{device.name}</td>
                                                    <td>{device.productName}</td>
                                                    <td><StatusTag status={device.status} /></td>
                                                    <td>{device.department}</td>
                                                    <td>
                                                        <DeviceGroupTags groups={device.groups} />
                                                    </td>
                                                    <td>
                                                        <div className="pm-table-actions">
                                                            <button
                                                                type="button"
                                                                onClick={() => setViewDevice(device)}
                                                            >
                                                                查看
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => setRemoveDeviceTarget({ mode: 'single', device })}
                                                            >
                                                                删除
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {!devicePagination.items.length && (
                                                <tr>
                                                    <td colSpan={8} className="dg-table-empty">该分组下暂无设备</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                <ListPagination
                                    total={devicePagination.total}
                                    currentPage={devicePagination.currentPage}
                                    totalPages={devicePagination.totalPages}
                                    pageSize={devicePageSize}
                                    jumpPage={deviceJumpPage}
                                    onPageChange={setDeviceCurrentPage}
                                    onPageSizeChange={setDevicePageSize}
                                    onJumpPageChange={setDeviceJumpPage}
                                />
                            </>
                        ) : (
                            <>
                                <div className="pm-section-head">
                                    <h3>分组列表</h3>
                                    <div className="dg-toolbar">
                                        <button type="button" className="pm-btn pm-btn-primary" onClick={openCreateDialog}>
                                            新增
                                        </button>
                                        <button
                                            type="button"
                                            className="pm-btn pm-btn-primary"
                                            disabled={!selectedIds.length}
                                            onClick={() => {
                                                if (!selectedIds.length) return;
                                                setDeleteTarget({ mode: 'batch', count: selectedIds.length });
                                            }}
                                        >
                                            批量删除
                                        </button>
                                        <button
                                            type="button"
                                            className="pm-btn pm-btn-ghost"
                                            onClick={() => showToast('导出功能（原型）')}
                                        >
                                            导出
                                        </button>
                                    </div>
                                </div>

                                <div className="pm-table-wrap dg-table-wrap">
                                    <table className="pm-table">
                                        <thead>
                                            <tr>
                                                <th>
                                                    <input
                                                        type="checkbox"
                                                        aria-label="全选"
                                                        checked={allPageSelected}
                                                        onChange={toggleSelectAll}
                                                    />
                                                </th>
                                                <th>序号</th>
                                                <th>分组名称</th>
                                                <th>分组编码</th>
                                                <th>分组类型</th>
                                                <th>设备数量</th>
                                                <th>创建时间</th>
                                                <th>操作</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {pagination.items.map((group, index) => (
                                                <tr
                                                    key={group.id}
                                                    className="iot-selectable-row"
                                                    onClick={(event) => handleSelectableRowClick(
                                                        event,
                                                        () => toggleSelectRow(group.id),
                                                    )}
                                                >
                                                    <td>
                                                        <input
                                                            type="checkbox"
                                                            aria-label={`选择 ${group.name}`}
                                                            checked={selectedIds.includes(group.id)}
                                                            onChange={() => toggleSelectRow(group.id)}
                                                        />
                                                    </td>
                                                    <td>{(pagination.currentPage - 1) * Number(pageSize) + index + 1}</td>
                                                    <td>{group.name}</td>
                                                    <td>
                                                        <span className="dg-code-tip" title="新增分组后，系统自动为每项生成唯一编号">
                                                            {group.code}
                                                        </span>
                                                    </td>
                                                    <td>{group.typeLabel}</td>
                                                    <td>{group.deviceCount}</td>
                                                    <td>{group.createdAt}</td>
                                                    <td>
                                                        <div className="pm-table-actions">
                                                            <button type="button" onClick={() => openEditDialog(group)}>编辑</button>
                                                            <button type="button" onClick={() => handleViewDevices(group)}>查看设备</button>
                                                            <button
                                                                type="button"
                                                                onClick={() => setDeleteTarget({ mode: 'single', group })}
                                                            >
                                                                删除
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {!pagination.items.length && (
                                                <tr>
                                                    <td colSpan={8} className="dg-table-empty">暂无分组数据</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

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
                            </>
                        )}
                    </section>
                </div>
            </div>

            <IotToast toast={toast} />

            <DeviceGroupFormDialog
                open={formOpen}
                mode={formMode}
                typeOptions={typeOptions}
                initialValue={editingGroup ?? undefined}
                onClose={() => setFormOpen(false)}
                onConfirm={handleConfirmForm}
            />

            <DeviceGroupTypeDialog
                open={typeDialogOpen}
                groupTypes={groupTypes}
                onClose={() => setTypeDialogOpen(false)}
                onConfirm={handleConfirmTypes}
            />

            {deleteTarget && (
                <ConfirmDialog
                    title="删除分组"
                    message={
                        deleteTarget.mode === 'single'
                            ? `确定删除分组「${deleteTarget.group.name}」吗？`
                            : `确定删除选中的 ${deleteTarget.count} 个分组吗？`
                    }
                    onClose={() => setDeleteTarget(null)}
                    onConfirm={handleDeleteConfirm}
                />
            )}

            {removeDeviceTarget && (
                <ConfirmDialog
                    title="移除设备"
                    message={
                        removeDeviceTarget.mode === 'single'
                            ? `确定将设备「${removeDeviceTarget.device.name}」从分组「${viewingGroup?.name}」中移除吗？`
                            : `确定将选中的 ${removeDeviceTarget.count} 台设备从分组「${viewingGroup?.name}」中移除吗？`
                    }
                    onClose={() => setRemoveDeviceTarget(null)}
                    onConfirm={handleRemoveDevicesConfirm}
                />
            )}

            {viewingGroup && (
                <AddGroupDeviceDialog
                    open={addDeviceOpen}
                    devices={devices}
                    products={products}
                    group={viewingGroup}
                    groupTypes={groupTypes}
                    onClose={() => setAddDeviceOpen(false)}
                    onConfirm={handleAddDevicesConfirm}
                />
            )}
            {viewDevice && (
                <>
                    <div className="pcp-drawer-mask" onClick={() => setViewDevice(null)} />
                    <aside className="pcp-drawer pcp-drawer--form" style={{ position: 'fixed', zIndex: 120 }}>
                        <div className="pcp-drawer__head">
                            <h3>设备详情</h3>
                            <button type="button" className="pcp-drawer__close" onClick={() => setViewDevice(null)}>×</button>
                        </div>
                        <div className="pcp-drawer__body">
                            {[
                                { label: '设备名称', value: viewDevice.name },
                                { label: '设备编号', value: viewDevice.code },
                                { label: '所属产品', value: viewDevice.productName },
                                { label: '当前状态', value: STATUS_LABEL[viewDevice.status as DeviceStatus] ?? viewDevice.status },
                                { label: '所属部门', value: viewDevice.department },
                                { label: '采集频率', value: formatCollectFrequencyDisplay(viewDevice.collectFrequency, viewDevice.collectFrequencyUnit) },
                                { label: '经度', value: String(viewDevice.longitude) },
                                { label: '纬度', value: String(viewDevice.latitude) },
                                { label: '注册码', value: viewDevice.registrationCode },
                            ].map((item) => (
                                <div key={item.label} className="pcp-drawer-field" style={{ flexDirection: 'row', gap: 12 }}>
                                    <span style={{ width: 72, flexShrink: 0, fontSize: 13, color: 'var(--text-muted)' }}>{item.label}</span>
                                    <span style={{ fontSize: 13, color: 'var(--text)' }}>{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </aside>
                </>
            )}
        </AppShell>
    );
}
