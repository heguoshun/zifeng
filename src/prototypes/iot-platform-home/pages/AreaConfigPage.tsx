import React, { useEffect, useMemo, useState } from 'react';
import { Link2, Pencil, Plus, Search, Trash2, Unlink, Upload } from 'lucide-react';
import AppShell from '../components/AppShell';
import Breadcrumb from '../components/Breadcrumb';
import LargeMeterSidebar, { type LargeMeterPageId } from '../components/LargeMeterSidebar';
import AreaConfigTree from '../components/AreaConfigTree';
import AreaFormDialog, { type AreaFormValue } from '../components/AreaFormDialog';
import BindDeviceDialog, { type BindDeviceValue } from '../components/BindDeviceDialog';
import ImportDevicesDialog from '../components/ImportDevicesDialog';
import ElSelect from '../components/ElSelect';
import ElDateRangePicker from '../components/ElDateRangePicker';
import ListPagination from '../components/ListPagination';
import { ConfirmDialog } from '../components/IotDialogs';
import IotToast, { type IotToastData, type IotToastType, triggerIotToast } from '../components/IotToast';
import type { DeviceGroupRecord, DeviceGroupTypeItem } from '../data/deviceGroups';
import type { DeviceRecord } from '../data/devices';
import {
    createArchiveRecordsFromDeviceChange,
    type DeviceArchiveRecord,
} from '../data/deviceArchives';
import {
    countDevicesInLargeMeterArea,
    countDirectDevicesInArea,
    getLargeMeterAreaDeleteBlockReason,
    isLargeMeterDevice,
    resolveDeviceProduct,
    STATUS_LABEL,
    type DeviceStatus,
} from '../data/devices';
import type { ProductRecord } from '../data/products';
import type { DictTypeRecord } from '../data/systemDictionaries';
import type { LargeMeterArea, LargeMeterDevice } from '../data/largeMeters';
import {
    buildAreaConfigTree,
    filterAreaConfigTree,
    getAreaPath,
    getChildAreas,
    getDefaultAreaTreeExpanded,
    normalizeLargeMeterAreaId,
} from '../data/largeMeters';
import { paginateItems, DEFAULT_LIST_PAGE_SIZE } from '../utils/listPagination';
import '../device-access.css';
import '../product-management.css';
import '../device-management.css';
import '../large-meter.css';
import '../area-config.css';
import ClearableInput from '../components/ClearableInput';

type AreaConfigPageProps = {
    areas: LargeMeterArea[];
    devices: DeviceRecord[];
    products: ProductRecord[];
    deviceGroups: DeviceGroupRecord[];
    groupTypes: DeviceGroupTypeItem[];
    dictionaries: DictTypeRecord[];
    onUpdateAreas: React.Dispatch<React.SetStateAction<LargeMeterArea[]>>;
    onUpdateDevices: React.Dispatch<React.SetStateAction<DeviceRecord[]>>;
    onUpdateLargeMeters: React.Dispatch<React.SetStateAction<LargeMeterDevice[]>>;
    onUpdateArchiveRecords: React.Dispatch<React.SetStateAction<DeviceArchiveRecord[]>>;
    onViewDeviceArchive: (deviceId: string) => void;
    onNavigateDeviceAccess: () => void;
    onNavigate: (pageId: LargeMeterPageId) => void;
    onNavigateMessageCenter?: () => void;
    onNavigateAlarmWorkOrder?: () => void;
    onNavigateSystemManagement?: () => void;
    onNavigateLargeMeterCenter?: () => void;
};

type DetailTab = 'basic' | 'children' | 'devices';

type DeviceFilterState = {
    installStartTime: string;
    installEndTime: string;
    manufacturer: string;
    remoteManufacturer: string;
};

const DEFAULT_DEVICE_FILTERS: DeviceFilterState = {
    installStartTime: '',
    installEndTime: '',
    manufacturer: '全部',
    remoteManufacturer: '全部',
};

const DETAIL_TABS: { id: DetailTab; label: string }[] = [
    { id: 'basic', label: '基本信息' },
    { id: 'children', label: '子片区' },
    { id: 'devices', label: '关联设备' },
];

function formatDateIdPart(date: Date): string {
    const year = String(date.getFullYear());
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
}

function generateAreaId(areas: LargeMeterArea[]): string {
    const datePart = formatDateIdPart(new Date());
    const prefix = `AREA-${datePart}-`;
    const maxSequence = areas.reduce((max, area) => {
        if (!area.id.startsWith(prefix)) return max;
        const sequence = Number(area.id.slice(prefix.length));
        return Number.isFinite(sequence) ? Math.max(max, sequence) : max;
    }, 0);
    return `${prefix}${String(maxSequence + 1).padStart(3, '0')}`;
}

function DeviceStatusTag({ status }: { status: DeviceStatus }) {
    return (
        <span className={`dm-status-tag dm-status-tag--${status}`}>
            {STATUS_LABEL[status]}
        </span>
    );
}

function formatLinkedDeviceName(device: DeviceRecord, category: string) {
    if (!device.gatewayId) return device.name;

    const sequence = device.code.match(/(\d+)$/)?.[1]?.slice(-2);
    return sequence ? `${category}-${sequence}` : category;
}

function formatInstallDate(value?: string) {
    if (!value) return '—';

    const matched = value.match(/^(\d{4})[./-](\d{1,2})[./-](\d{1,2})(?:\D+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);
    if (!matched) return value;

    const [, year, month, day, hour = '0', minute = '0', second = '0'] = matched;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')} ${hour.padStart(2, '0')}:${minute.padStart(2, '0')}:${second.padStart(2, '0')}`;
}

function getInstallDate(value?: string) {
    if (!value) return '';

    const matched = value.match(/^(\d{4})[./-](\d{1,2})[./-](\d{1,2})/);
    if (!matched) return '';

    const [, year, month, day] = matched;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

function matchesInstallTimeRange(installTime: string | undefined, start: string, end: string) {
    if (!start && !end) return true;

    const date = getInstallDate(installTime);
    if (!date) return false;
    if (start && date < start) return false;
    if (end && date > end) return false;
    return true;
}

function getAreaDescendantIds(areas: LargeMeterArea[], areaId: string): string[] {
    const descendants: string[] = [];
    const collect = (parentId: string) => {
        areas
            .filter((area) => area.parentId === parentId)
            .forEach((area) => {
                descendants.push(area.id);
                collect(area.id);
            });
    };
    collect(areaId);
    return descendants;
}

export default function AreaConfigPage({
    areas,
    devices,
    products,
    deviceGroups,
    groupTypes,
    dictionaries,
    onUpdateAreas,
    onUpdateDevices,
    onUpdateLargeMeters,
    onUpdateArchiveRecords,
    onViewDeviceArchive,
    onNavigateDeviceAccess,
    onNavigate,
    onNavigateMessageCenter,
    onNavigateAlarmWorkOrder,
    onNavigateSystemManagement,
    onNavigateLargeMeterCenter,
}: AreaConfigPageProps) {
    const meterManufacturerOptions = useMemo(() => {
        const dict = dictionaries.find((d) => d.code === 'meter_manufacturer');
        return dict?.items.filter((item) => item.enabled).map((item) => ({ label: item.name, value: item.dataValue })) ?? [];
    }, [dictionaries]);

    const remoteManufacturerOptions = useMemo(() => {
        const dict = dictionaries.find((d) => d.code === 'remote_manufacturer');
        return dict?.items.filter((item) => item.enabled).map((item) => ({ label: item.name, value: item.dataValue })) ?? [];
    }, [dictionaries]);

    const meterManufacturerFilterOptions = useMemo(
        () => [{ label: '全部', value: '全部' }, ...meterManufacturerOptions],
        [meterManufacturerOptions],
    );

    const remoteManufacturerFilterOptions = useMemo(
        () => [{ label: '全部', value: '全部' }, ...remoteManufacturerOptions],
        [remoteManufacturerOptions],
    );
    const [treeKeyword, setTreeKeyword] = useState('');
    const [expanded, setExpanded] = useState<Record<string, boolean>>(() => getDefaultAreaTreeExpanded(areas));
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<DetailTab>('basic');
    const [dialogMode, setDialogMode] = useState<'add' | 'edit' | null>(null);
    const [dialogParentId, setDialogParentId] = useState('');
    const [pendingAreaId, setPendingAreaId] = useState('');
    const [editingArea, setEditingArea] = useState<LargeMeterArea | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<LargeMeterArea | null>(null);
    const [unbindTarget, setUnbindTarget] = useState<DeviceRecord | null>(null);
    const [bindDialogOpen, setBindDialogOpen] = useState(false);
    const [editInstallTarget, setEditInstallTarget] = useState<DeviceRecord | null>(null);
    const [importDialogOpen, setImportDialogOpen] = useState(false);
    const [toast, setToast] = useState<IotToastData | null>(null);
    const [devicePage, setDevicePage] = useState(1);
    const [devicePageSize, setDevicePageSize] = useState('10');
    const [deviceJumpPage, setDeviceJumpPage] = useState('1');
    const [draftDeviceFilters, setDraftDeviceFilters] = useState<DeviceFilterState>(DEFAULT_DEVICE_FILTERS);
    const [appliedDeviceFilters, setAppliedDeviceFilters] = useState<DeviceFilterState>(DEFAULT_DEVICE_FILTERS);

    const showToast = (message: string, type: IotToastType = 'warning') => {
        triggerIotToast(setToast, message, type);
    };

    const areaTree = useMemo(
        () => buildAreaConfigTree(areas),
        [areas],
    );

    const filteredTree = useMemo(
        () => filterAreaConfigTree(areaTree, treeKeyword),
        [areaTree, treeKeyword],
    );

    useEffect(() => {
        setSelectedId((previous) => (previous ? normalizeLargeMeterAreaId(previous) : previous));
    }, []);

    useEffect(() => {
        if (!selectedId && areas.length > 0) {
            const firstRoot = areas.find((a) => a.parentId === null);
            if (firstRoot) setSelectedId(firstRoot.id);
        }
    }, [areas, selectedId]);

    useEffect(() => {
        if (!treeKeyword.trim()) return;
        setExpanded((prev) => {
            const next = { ...prev };
            const expandAll = (nodes: typeof areaTree) => {
                nodes.forEach((node) => {
                    if (node.children?.length) next[node.id] = true;
                    if (node.children) expandAll(node.children);
                });
            };
            expandAll(filteredTree);
            return next;
        });
    }, [treeKeyword, filteredTree]);

    const selectedArea = useMemo(
        () => areas.find((a) => a.id === selectedId) ?? null,
        [areas, selectedId],
    );

    const childAreas = useMemo(() => {
        if (!selectedArea) return [];
        return getChildAreas(areas, selectedArea.id);
    }, [areas, selectedArea]);

    const boundDevices = useMemo(() => {
        if (!selectedArea) return [];
        return devices.filter((device) => {
            if (device.largeMeterAreaId !== selectedArea.id || !isLargeMeterDevice(device, products)) {
                return false;
            }
            if (appliedDeviceFilters.manufacturer !== '全部' && device.manufacturer !== appliedDeviceFilters.manufacturer) {
                return false;
            }
            if (appliedDeviceFilters.remoteManufacturer !== '全部' && device.remoteManufacturer !== appliedDeviceFilters.remoteManufacturer) {
                return false;
            }
            if (!matchesInstallTimeRange(
                device.installTime,
                appliedDeviceFilters.installStartTime,
                appliedDeviceFilters.installEndTime,
            )) {
                return false;
            }
            return true;
        });
    }, [devices, products, selectedArea, appliedDeviceFilters]);

    const devicePagination = useMemo(
        () => paginateItems(boundDevices, devicePage, Number(devicePageSize)),
        [boundDevices, devicePage, devicePageSize],
    );

    useEffect(() => {
        setDevicePage(1);
        setDeviceJumpPage('1');
    }, [selectedId, devicePageSize, appliedDeviceFilters]);

    useEffect(() => {
        setDeviceJumpPage(String(devicePagination.currentPage));
    }, [devicePagination.currentPage]);

    const parentName = selectedArea?.parentId
        ? areas.find((a) => a.id === selectedArea.parentId)?.name ?? '—'
        : '无（顶级片区）';

    const parentOptions = useMemo(() => {
        const excludedIds = editingArea
            ? new Set([editingArea.id, ...getAreaDescendantIds(areas, editingArea.id)])
            : new Set<string>();
        return areas
            .filter((area) => !excludedIds.has(area.id))
            .map((area) => ({ label: area.name, value: area.id }));
    }, [areas, editingArea]);

    const directDeviceCount = selectedArea ? countDirectDevicesInArea(devices, selectedArea.id, products) : 0;
    const totalDeviceCount = selectedArea ? countDevicesInLargeMeterArea(devices, areas, selectedArea.id, products) : 0;

    const handleSelectArea = (id: string) => {
        setSelectedId(id);
        setActiveTab('basic');
        setDraftDeviceFilters(DEFAULT_DEVICE_FILTERS);
        setAppliedDeviceFilters(DEFAULT_DEVICE_FILTERS);
    };

    const handleDeviceSearch = () => {
        setAppliedDeviceFilters({ ...draftDeviceFilters });
        setDevicePage(1);
        setDeviceJumpPage('1');
    };

    const handleDeviceReset = () => {
        setDraftDeviceFilters(DEFAULT_DEVICE_FILTERS);
        setAppliedDeviceFilters(DEFAULT_DEVICE_FILTERS);
        setDevicePage(1);
        setDeviceJumpPage('1');
    };

    const updateDeviceFilter = (patch: Partial<DeviceFilterState>) => {
        setDraftDeviceFilters((prev) => ({ ...prev, ...patch }));
    };

    const openAddRoot = () => {
        setEditingArea(null);
        setDialogParentId('');
        setPendingAreaId(generateAreaId(areas));
        setDialogMode('add');
    };

    const openAddChild = () => {
        if (!selectedArea) {
            showToast('请先选择一个片区');
            return;
        }
        setEditingArea(null);
        setDialogParentId(selectedArea.id);
        setPendingAreaId(generateAreaId(areas));
        setDialogMode('add');
    };

    const openEdit = () => {
        if (!selectedArea) {
            showToast('请先选择一个片区');
            return;
        }
        setEditingArea(selectedArea);
        setPendingAreaId('');
        setDialogMode('edit');
    };

    const handleDeleteClick = () => {
        if (!selectedArea) {
            showToast('请先选择一个片区');
            return;
        }
        const blockReason = getLargeMeterAreaDeleteBlockReason(areas, devices, selectedArea.id, products);
        if (blockReason) {
            showToast(blockReason);
            return;
        }
        setDeleteTarget(selectedArea);
    };

    const confirmDelete = () => {
        if (!deleteTarget) return;
        onUpdateAreas((prev) => prev.filter((a) => a.id !== deleteTarget.id));
        if (selectedId === deleteTarget.id) {
            const nextRoot = areas.find((a) => a.parentId === null && a.id !== deleteTarget.id);
            setSelectedId(nextRoot?.id ?? null);
        }
        showToast(`已删除「${deleteTarget.name}」`, 'success');
        setDeleteTarget(null);
    };

    const handleDialogConfirm = (value: AreaFormValue) => {
        const trimmed = value.name.trim();
        if (!trimmed) {
            showToast('请输入片区名称');
            return;
        }

        if (dialogMode === 'edit' && editingArea) {
            const nextParentId = value.parentId || null;
            const movedToNewParent = nextParentId !== editingArea.parentId;
            const siblings = areas.filter((a) => a.parentId === nextParentId && a.id !== editingArea.id);
            onUpdateAreas((prev) => prev.map((a) => (
                a.id === editingArea.id
                    ? {
                        ...a,
                        name: trimmed,
                        parentId: nextParentId,
                        sort: movedToNewParent ? siblings.length + 1 : a.sort,
                    }
                    : a
            )));
            if (nextParentId) {
                setExpanded((prev) => ({ ...prev, [nextParentId]: true }));
            }
            showToast(`已更新「${trimmed}」`, 'success');
        } else if (dialogMode === 'add') {
            const parentId = dialogParentId || value.parentId || null;
            const siblings = areas.filter((a) => a.parentId === parentId);
            const newArea: LargeMeterArea = {
                id: pendingAreaId || generateAreaId(areas),
                name: trimmed,
                parentId,
                sort: siblings.length + 1,
            };
            onUpdateAreas((prev) => [...prev, newArea]);
            showToast(`已新增「${trimmed}」`, 'success');
            if (parentId) {
                setExpanded((prev) => ({ ...prev, [parentId]: true }));
            }
            setSelectedId(newArea.id);
        }

        setDialogMode(null);
        setEditingArea(null);
        setDialogParentId('');
        setPendingAreaId('');
    };

    const handleBindDevices = (deviceIds: string[]) => {
        if (!deviceIds.length || !selectedArea) return;
        const selectedDevices = devices.filter((device) => deviceIds.includes(device.id) && isLargeMeterDevice(device, products));
        const archiveAdditions = devices
            .filter((device) => deviceIds.includes(device.id) && isLargeMeterDevice(device, products))
            .flatMap((device) => createArchiveRecordsFromDeviceChange(
                device,
                { ...device, largeMeterAreaId: selectedArea.id },
                { operator: 'superadmin', includeInstallation: !device.largeMeterAreaId },
            ));
        onUpdateDevices((prev) => prev.map((device) => (
            deviceIds.includes(device.id) && isLargeMeterDevice(device, products)
                ? { ...device, largeMeterAreaId: selectedArea.id }
                : device
        )));
        onUpdateLargeMeters((previous) => previous.map((meter) => {
            const linkedDevice = selectedDevices.find((device) => (
                device.code === meter.code || (device.userNo && device.userNo === meter.userNo)
            ));
            return linkedDevice
                ? { ...meter, code: linkedDevice.code, areaId: selectedArea.id }
                : meter;
        }));
        if (archiveAdditions.length) {
            onUpdateArchiveRecords((previous) => [...archiveAdditions, ...previous]);
        }
        showToast(`已绑定 ${deviceIds.length} 个设备`, 'success');
        setBindDialogOpen(false);
        setActiveTab('devices');
    };

    const handleBindDevice = (value: BindDeviceValue) => {
        if (!selectedArea) return;
        const currentDevice = devices.find((device) => device.id === value.deviceId);
        if (!currentDevice || !isLargeMeterDevice(currentDevice, products)) return;
        const nextDevice: DeviceRecord = {
            ...currentDevice,
            largeMeterAreaId: selectedArea.id,
            name: value.name,
            userName: value.userName,
            userNo: value.userNo,
            bodyNo: value.bodyNo,
            installTime: value.installTime,
            installAddress: value.installAddress,
            longitude: value.longitude ?? currentDevice.longitude,
            latitude: value.latitude ?? currentDevice.latitude,
            mapAddress: value.mapAddress ?? currentDevice.mapAddress,
            manufacturer: value.manufacturer,
            remoteManufacturer: value.remoteManufacturer,
            deviceFunction: value.deviceFunction,
            caliber: value.caliber,
            communicationNo: value.communicationNo,
        };
        const nextArchiveRecords = createArchiveRecordsFromDeviceChange(currentDevice, nextDevice, {
            operator: 'superadmin',
            includeInstallation: !currentDevice.largeMeterAreaId,
        });
        onUpdateDevices((previous) => previous.map((device) => (
            device.id === nextDevice.id ? nextDevice : device
        )));
        onUpdateLargeMeters((previous) => previous.map((meter) => (
            (currentDevice.userNo ? meter.userNo === currentDevice.userNo : false) || meter.code === currentDevice.code
                ? {
                    ...meter,
                    code: currentDevice.code,
                    areaId: selectedArea.id,
                    name: value.name,
                    userName: value.userName,
                    userNo: value.userNo,
                    bodyNo: value.bodyNo,
                    installTime: value.installTime,
                    installAddress: value.installAddress,
                    longitude: value.longitude,
                    latitude: value.latitude,
                    manufacturer: value.manufacturer,
                    remoteManufacturer: value.remoteManufacturer,
                    deviceFunction: value.deviceFunction,
                    caliber: value.caliber,
                    communicationNo: value.communicationNo,
                }
                : meter
        )));
        if (nextArchiveRecords.length) {
            onUpdateArchiveRecords((previous) => [...nextArchiveRecords, ...previous]);
        }
        const isEdit = Boolean(currentDevice.largeMeterAreaId);
        showToast(isEdit ? `已更新「${value.name}」安装信息` : `已绑定「${value.name}」`, 'success');
        setBindDialogOpen(false);
        setEditInstallTarget(null);
        setActiveTab('devices');
    };

    const handleImportDevices = (deviceIds: string[]) => {
        handleBindDevices(deviceIds);
        setImportDialogOpen(false);
    };

    const confirmUnbind = () => {
        if (!unbindTarget) return;
        onUpdateDevices((prev) => prev.map((device) => (
            device.id === unbindTarget.id
                ? { ...device, largeMeterAreaId: undefined }
                : device
        )));
        onUpdateLargeMeters((previous) => previous.map((meter) => (
            (meter.code === unbindTarget.code || (unbindTarget.userNo && meter.userNo === unbindTarget.userNo))
                ? {
                    ...meter,
                    areaId: '',
                    userName: '',
                    userNo: '',
                    bodyNo: '',
                    installTime: '',
                    installAddress: '',
                    manufacturer: '',
                    remoteManufacturer: '',
                    deviceFunction: '',
                    caliber: '',
                    communicationNo: '',
                }
                : meter
        )));
        showToast(`已解绑「${unbindTarget.name}」`, 'success');
        setUnbindTarget(null);
    };

    const dialogInitialValue: AreaFormValue | undefined = dialogMode === 'edit' && editingArea
        ? { name: editingArea.name, parentId: editingArea.parentId ?? '' }
        : dialogParentId
            ? { name: '', parentId: dialogParentId }
            : undefined;

    const sidebar = <LargeMeterSidebar pageId="area-config" onNavigate={onNavigate} />;

    return (
        <AppShell
            activeTopTab="大表中心"
            sidebar={sidebar}
            onNavigateLargeMeterCenter={onNavigateLargeMeterCenter}
            onNavigateMessageCenter={onNavigateMessageCenter}
            onNavigateAlarmWorkOrder={onNavigateAlarmWorkOrder}
            onNavigateSystemManagement={onNavigateSystemManagement}
            onTopTabChange={(tab) => {
                if (tab === '设备接入') onNavigateDeviceAccess();
            }}
        >
            <div className="pm-page lac-page">
                <Breadcrumb items={[
                                    { label: '大表中心', pageId: 'data-monitor' },
                                    { label: '区域配置' },
                                ]} onNavigate={(id) => onNavigate(id as LargeMeterPageId)} />

                <div className="lac-layout">
                    <aside className="panel lac-tree-panel">
                        <div className="lac-tree-panel__head">
                            <h3>片区结构</h3>
                            <button type="button" className="pm-link-btn" onClick={openAddRoot}>
                                + 新增
                            </button>
                        </div>
                        <div className="lac-tree-panel__search">
                            <ClearableInput
                                type="text"
                                placeholder="搜索片区名称"
                                value={treeKeyword}
                                onChange={(e) => setTreeKeyword(e.target.value)}
                            />
                        </div>
                        <div className="lac-tree-body">
                            {filteredTree.length === 0 ? (
                                <p className="lac-tree-empty">
                                    {treeKeyword ? '无匹配片区' : '暂无片区，请点击新增'}
                                </p>
                            ) : (
                                <AreaConfigTree
                                    nodes={filteredTree}
                                    expanded={expanded}
                                    activeId={selectedId}
                                    onToggle={(id) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))}
                                    onSelect={handleSelectArea}
                                />
                            )}
                        </div>
                    </aside>

                    <section className="panel lac-detail-panel">
                        {!selectedArea ? (
                            <div className="lac-detail-empty">请在左侧选择片区进行管理</div>
                        ) : (
                            <>
                                <div className="lac-detail-header">
                                    <div className="lac-detail-header__title">
                                        <h3>{selectedArea.name}</h3>
                                        <div className="lac-detail-header__path">
                                            {getAreaPath(areas, selectedArea.id)}
                                        </div>
                                    </div>
                                    <div className="lac-detail-actions">
                                        <button type="button" className="pm-btn pm-btn-ghost" onClick={openAddChild}>
                                            <Plus size={14} />
                                            新增子片区
                                        </button>
                                        <button type="button" className="pm-btn pm-btn-ghost" onClick={openEdit}>
                                            <Pencil size={14} />
                                            编辑
                                        </button>
                                        <button type="button" className="pm-btn pm-btn-ghost" onClick={handleDeleteClick}>
                                            <Trash2 size={14} />
                                            删除
                                        </button>
                                    </div>
                                </div>

                                <div className="lac-stat-row">
                                    <div className="lac-stat-card">
                                        <div className="lac-stat-card__label">子片区</div>
                                        <div className="lac-stat-card__value">{childAreas.length}</div>
                                    </div>
                                    <div className="lac-stat-card">
                                        <div className="lac-stat-card__label">直属设备</div>
                                        <div className="lac-stat-card__value">{directDeviceCount}</div>
                                    </div>
                                    <div className="lac-stat-card">
                                        <div className="lac-stat-card__label">含下级设备</div>
                                        <div className="lac-stat-card__value">{totalDeviceCount}</div>
                                    </div>
                                    <div className="lac-stat-card">
                                        <div className="lac-stat-card__label">排序</div>
                                        <div className="lac-stat-card__value">{selectedArea.sort}</div>
                                    </div>
                                </div>

                                <div className="lac-tabs">
                                    {DETAIL_TABS.map((tab) => (
                                        <button
                                            key={tab.id}
                                            type="button"
                                            className={`lac-tab ${activeTab === tab.id ? 'is-active' : ''}`}
                                            onClick={() => setActiveTab(tab.id)}
                                        >
                                            {tab.label}
                                            {tab.id === 'children' && childAreas.length > 0 ? ` (${childAreas.length})` : ''}
                                            {tab.id === 'devices' && directDeviceCount > 0 ? ` (${directDeviceCount})` : ''}
                                        </button>
                                    ))}
                                </div>

                                <div className="lac-tab-content">
                                    {activeTab === 'basic' && (
                                        <div className="lac-info-grid">
                                            <div className="lac-info-item">
                                                <span className="lac-info-item__label">片区名称</span>
                                                <span className="lac-info-item__value">{selectedArea.name}</span>
                                            </div>
                                            <div className="lac-info-item">
                                                <span className="lac-info-item__label">上级片区</span>
                                                <span className="lac-info-item__value">{parentName}</span>
                                            </div>
                                            <div className="lac-info-item">
                                                <span className="lac-info-item__label">片区路径</span>
                                                <span className="lac-info-item__value">{getAreaPath(areas, selectedArea.id)}</span>
                                            </div>
                                            <div className="lac-info-item">
                                                <span className="lac-info-item__label">片区 ID</span>
                                                <span className="lac-info-item__value">{selectedArea.id}</span>
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 'children' && (
                                        <>
                                            <div className="lac-section-head">
                                                <h4>子片区列表</h4>
                                            </div>
                                            {childAreas.length === 0 ? (
                                                <div className="lac-table-empty">暂无子片区</div>
                                            ) : (
                                                <div className="pm-table-wrap">
                                                    <table className="pm-table">
                                                        <thead>
                                                            <tr>
                                                                <th>片区名称</th>
                                                                <th>直属设备</th>
                                                                <th>子片区数</th>
                                                                <th>排序</th>
                                                                <th>操作</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {childAreas.map((child) => (
                                                                <tr key={child.id}>
                                                                    <td>
                                                                        <button
                                                                            type="button"
                                                                            className="lac-child-name-btn"
                                                                            onClick={() => handleSelectArea(child.id)}
                                                                        >
                                                                            {child.name}
                                                                        </button>
                                                                    </td>
                                                                    <td>{countDirectDevicesInArea(devices, child.id, products)}</td>
                                                                    <td>{getChildAreas(areas, child.id).length}</td>
                                                                    <td>{child.sort}</td>
                                                                    <td>
                                                                        <div className="pm-table-actions">
                                                                            <button type="button" onClick={() => handleSelectArea(child.id)}>查看</button>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {activeTab === 'devices' && (
                                        <>
                                            <div className="lac-device-filter">
                                                <div className="pm-filter-field">
                                                    <span className="pm-filter-label">安装时间</span>
                                                    <ElDateRangePicker
                                                        size="medium"
                                                        start={draftDeviceFilters.installStartTime}
                                                        end={draftDeviceFilters.installEndTime}
                                                        onChange={(range) => updateDeviceFilter({
                                                            installStartTime: range.start,
                                                            installEndTime: range.end,
                                                        })}
                                                    />
                                                </div>
                                                <div className="pm-filter-field">
                                                    <span className="pm-filter-label">表具厂家</span>
                                                    <ElSelect
                                                        className="el-select--medium"
                                                        size="medium"
                                                        value={draftDeviceFilters.manufacturer}
                                                        options={meterManufacturerFilterOptions}
                                                        onChange={(value) => updateDeviceFilter({ manufacturer: value })}
                                                    />
                                                </div>
                                                <div className="pm-filter-field">
                                                    <span className="pm-filter-label">远传厂家</span>
                                                    <ElSelect
                                                        className="el-select--medium"
                                                        size="medium"
                                                        value={draftDeviceFilters.remoteManufacturer}
                                                        options={remoteManufacturerFilterOptions}
                                                        onChange={(value) => updateDeviceFilter({ remoteManufacturer: value })}
                                                    />
                                                </div>
                                                <div className="pm-filter-actions lac-device-filter__actions">
                                                    <button type="button" className="pm-btn pm-btn-primary" onClick={handleDeviceSearch}>
                                                        <Search size={14} />
                                                        查询
                                                    </button>
                                                    <button type="button" className="pm-btn pm-btn-ghost" onClick={handleDeviceReset}>
                                                        重置
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="lac-section-head">
                                                <h4>关联设备</h4>
                                                <div className="lac-device-actions">
                                                    <button
                                                        type="button"
                                                        className="pm-btn pm-btn-primary"
                                                        onClick={() => setBindDialogOpen(true)}
                                                    >
                                                        <Link2 size={14} />
                                                        绑定设备
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="pm-btn pm-btn-ghost"
                                                        onClick={() => setImportDialogOpen(true)}
                                                    >
                                                        <Upload size={14} />
                                                        导入
                                                    </button>
                                                </div>
                                            </div>
                                            {boundDevices.length === 0 ? (
                                                <div className="lac-table-empty">
                                                    {devices.some((device) => (
                                                        device.largeMeterAreaId === selectedArea.id
                                                        && isLargeMeterDevice(device, products)
                                                    ))
                                                        ? '暂无符合条件的关联设备'
                                                        : '暂无关联设备，点击「绑定设备」添加'}
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="pm-table-wrap">
                                                        <table className="pm-table">
                                                            <thead>
                                                                <tr>
                                                                    <th>设备名称</th>
                                                                    <th>设备编号</th>
                                                                    <th>产品类别</th>
                                                                    <th>用户名称</th>
                                                                    <th>用户号</th>
                                                                    <th>表身号</th>
                                                                    <th>安装时间</th>
                                                                    <th>安装地址</th>
                                                                    <th>表具厂家</th>
                                                                    <th>远传厂家</th>
                                                                    <th>操作</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {devicePagination.items.map((device) => {
                                                                    const { category } = resolveDeviceProduct(device, products);
                                                                    return (
                                                                        <tr key={device.id}>
                                                                            <td>{formatLinkedDeviceName(device, category)}</td>
                                                                            <td>{device.code}</td>
                                                                            <td>{category}</td>
                                                                            <td>{device.userName || '—'}</td>
                                                                            <td>{device.userNo || '—'}</td>
                                                                            <td>{device.bodyNo || '—'}</td>
                                                                            <td>{formatInstallDate(device.installTime)}</td>
                                                                            <td>{device.installAddress || '—'}</td>
                                                                            <td>{device.manufacturer || '—'}</td>
                                                                            <td>{device.remoteManufacturer || '—'}</td>
                                                                            <td>
                                                                                <div className="lac-row-actions">
                                                                                    <button type="button" className="pm-link-btn" onClick={() => setEditInstallTarget(device)}>编辑</button>
                                                                                    <button type="button" className="pm-link-btn" onClick={() => onViewDeviceArchive(device.id)}>查看档案</button>
                                                                                    <button
                                                                                        type="button"
                                                                                        className="lac-unbind-btn"
                                                                                        onClick={() => setUnbindTarget(device)}
                                                                                    >
                                                                                        <Unlink size={12} />
                                                                                        解绑
                                                                                    </button>
                                                                                </div>
                                                                            </td>
                                                                        </tr>
                                                                    );
                                                                })}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                    <ListPagination
                                                        total={devicePagination.total}
                                                        currentPage={devicePagination.currentPage}
                                                        totalPages={devicePagination.totalPages}
                                                        pageSize={devicePageSize}
                                                        jumpPage={deviceJumpPage}
                                                        onPageChange={setDevicePage}
                                                        onPageSizeChange={setDevicePageSize}
                                                        onJumpPageChange={setDeviceJumpPage}
                                                    />
                                                </>
                                            )}
                                        </>
                                    )}
                                </div>
                            </>
                        )}
                    </section>
                </div>
            </div>

            <AreaFormDialog
                open={dialogMode !== null}
                mode={dialogMode === 'edit' ? 'edit' : 'add'}
                parentOptions={parentOptions}
                initialValue={dialogInitialValue}
                onClose={() => {
                    setDialogMode(null);
                    setEditingArea(null);
                    setDialogParentId('');
                    setPendingAreaId('');
                }}
                onConfirm={handleDialogConfirm}
            />

            {deleteTarget ? (
                <ConfirmDialog
                    title="删除片区"
                    message={`确定要删除片区「${deleteTarget.name}」吗？此操作不可恢复。`}
                    onClose={() => setDeleteTarget(null)}
                    onConfirm={confirmDelete}
                />
            ) : null}

            {unbindTarget ? (
                <ConfirmDialog
                    title="解绑设备"
                    message={`确定将设备「${unbindTarget.name}」从当前片区解绑吗？`}
                    onClose={() => setUnbindTarget(null)}
                    onConfirm={confirmUnbind}
                />
            ) : null}

            {selectedArea && (bindDialogOpen || editInstallTarget) && (
                <BindDeviceDialog
                    open={bindDialogOpen || editInstallTarget !== null}
                    area={selectedArea}
                    devices={devices}
                    products={products}
                    editingDevice={editInstallTarget}
                    meterManufacturerOptions={meterManufacturerOptions}
                    remoteManufacturerOptions={remoteManufacturerOptions}
                    onClose={() => {
                        setBindDialogOpen(false);
                        setEditInstallTarget(null);
                    }}
                    onConfirm={handleBindDevice}
                />
            )}

            {selectedArea && (
                <ImportDevicesDialog
                    open={importDialogOpen}
                    area={selectedArea}
                    devices={devices}
                    products={products}
                    onClose={() => setImportDialogOpen(false)}
                    onConfirm={handleImportDevices}
                />
            )}

            <IotToast toast={toast} />
        </AppShell>
    );
}
