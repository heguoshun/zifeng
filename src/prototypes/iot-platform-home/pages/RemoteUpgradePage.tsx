import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import AppShell from '../components/AppShell';
import DeviceAccessSidebar, { type DeviceAccessPageId } from '../components/DeviceAccessSidebar';
import ElSelect from '../components/ElSelect';
import ListPagination from '../components/ListPagination';
import FirmwarePackageFormDialog from '../components/FirmwarePackageFormDialog';
import UpgradeTaskFormDialog from '../components/UpgradeTaskFormDialog';
import UpgradeTaskDetailView from '../components/UpgradeTaskDetailView';
import { ConfirmDialog } from '../components/IotDialogs';
import IotToast, { type IotToastData, type IotToastType, triggerIotToast } from '../components/IotToast';
import type { DeviceRecord } from '../data/devices';
import type { ProductRecord } from '../data/products';
import {
    formatRemoteUpgradeNow,
    FIRMWARE_SEARCH_FIELD_OPTIONS,
    generateFirmwarePackageId,
    generateUpgradeTaskId,
    toFirmwarePackageFormValue,
    type FirmwarePackageFormValue,
    type FirmwarePackageRecord,
    type UpgradePackageTarget,
    upgradeTaskToBatch,
    type UpgradeDeviceDetailRecord,
    type UpgradeTaskBatchRecord,
    type UpgradeTaskFormValue,
    type UpgradeTaskRecord,
} from '../data/remoteUpgrade';
import { paginateItems, DEFAULT_LIST_PAGE_SIZE } from '../utils/listPagination';
import '../device-access.css';
import '../device-create.css';
import '../product-management.css';
import '../product-create.css';
import '../remote-upgrade.css';
import ClearableInput from '../components/ClearableInput';

type RemoteUpgradePageProps = {
    products: ProductRecord[];
    devices: DeviceRecord[];
    firmwarePackages: FirmwarePackageRecord[];
    upgradeTasks: UpgradeTaskRecord[];
    upgradeBatches: UpgradeTaskBatchRecord[];
    upgradeDeviceDetails: UpgradeDeviceDetailRecord[];
    onUpdateFirmwarePackages: React.Dispatch<React.SetStateAction<FirmwarePackageRecord[]>>;
    onUpdateUpgradeTasks: React.Dispatch<React.SetStateAction<UpgradeTaskRecord[]>>;
    onUpdateUpgradeBatches: React.Dispatch<React.SetStateAction<UpgradeTaskBatchRecord[]>>;
    onNavigateHome: () => void;
    onNavigateDeviceAccess: () => void;
    onNavigateMessageCenter: () => void;
    onNavigate: (pageId: DeviceAccessPageId) => void;
};

type ListSearchState = {
    searchField: string;
    draftKeyword: string;
    keyword: string;
    pageSize: string;
    currentPage: number;
    jumpPage: string;
};

const INITIAL_SEARCH: ListSearchState = {
    searchField: 'name',
    draftKeyword: '',
    keyword: '',
    pageSize: '10',
    currentPage: 1,
    jumpPage: '1',
};

function filterPackages<T extends { name: string; productName: string }>(
    packages: T[],
    keyword: string,
    searchField: string,
): T[] {
    const normalized = keyword.trim().toLowerCase();
    if (!normalized) return packages;
    return packages.filter((item) => {
        const fieldValue = searchField === 'productName' ? item.productName : item.name;
        return fieldValue.toLowerCase().includes(normalized);
    });
}

function toUpgradeTarget(record: FirmwarePackageRecord): UpgradePackageTarget {
    return {
        id: record.id,
        name: record.name,
        version: record.version,
        productId: record.productId,
    };
}

export default function RemoteUpgradePage({
    products,
    devices,
    firmwarePackages,
    upgradeTasks,
    upgradeBatches,
    upgradeDeviceDetails,
    onUpdateFirmwarePackages,
    onUpdateUpgradeTasks,
    onUpdateUpgradeBatches,
    onNavigateHome,
    onNavigateDeviceAccess,
    onNavigateMessageCenter,
    onNavigate,
}: RemoteUpgradePageProps) {
    const [search, setSearch] = useState<ListSearchState>(INITIAL_SEARCH);
    const [fwFormMode, setFwFormMode] = useState<'add' | 'edit' | null>(null);
    const [fwEditingRecord, setFwEditingRecord] = useState<FirmwarePackageRecord | null>(null);
    const [fwDeleteTarget, setFwDeleteTarget] = useState<FirmwarePackageRecord | null>(null);
    const [taskContext, setTaskContext] = useState<UpgradePackageTarget | null>(null);
    const [taskDetail, setTaskDetail] = useState<FirmwarePackageRecord | null>(null);
    const [toast, setToast] = useState<IotToastData | null>(null);

    const showToast = (message: string, type: IotToastType = 'success') => {
        triggerIotToast(setToast, message, type);
    };

    const filteredPackages = useMemo(
        () => filterPackages(firmwarePackages, search.keyword, search.searchField),
        [firmwarePackages, search.keyword, search.searchField],
    );

    const pagination = useMemo(
        () => paginateItems(filteredPackages, search.currentPage, Number(search.pageSize)),
        [filteredPackages, search.currentPage, search.pageSize],
    );

    useEffect(() => {
        setSearch((prev) => ({ ...prev, currentPage: 1, jumpPage: '1' }));
    }, [search.keyword, search.searchField, search.pageSize]);

    useEffect(() => {
        setSearch((prev) => ({ ...prev, jumpPage: String(pagination.currentPage) }));
    }, [pagination.currentPage]);

    const resolveProductName = (productId: string) => (
        products.find((item) => item.id === productId)?.name ?? '—'
    );

    const handleSearch = () => {
        setSearch((prev) => ({
            ...prev,
            keyword: prev.draftKeyword,
            currentPage: 1,
            jumpPage: '1',
        }));
    };

    const handleReset = () => {
        setSearch(INITIAL_SEARCH);
    };

    const handleSaveFirmware = (value: FirmwarePackageFormValue) => {
        const productName = resolveProductName(value.productId);
        if (fwFormMode === 'edit' && fwEditingRecord) {
            onUpdateFirmwarePackages((prev) => prev.map((item) => (
                item.id === fwEditingRecord.id
                    ? { ...item, ...value, productName, description: value.description || '—' }
                    : item
            )));
            showToast('固件包保存成功');
        } else {
            onUpdateFirmwarePackages((prev) => [
                {
                    id: generateFirmwarePackageId(),
                    ...value,
                    productName,
                    description: value.description || '—',
                    createdAt: formatRemoteUpgradeNow(),
                },
                ...prev,
            ]);
            showToast('固件包添加成功');
        }
        setFwFormMode(null);
        setFwEditingRecord(null);
    };

    const handleDeleteFirmware = () => {
        if (!fwDeleteTarget) return;
        onUpdateFirmwarePackages((prev) => prev.filter((item) => item.id !== fwDeleteTarget.id));
        onUpdateUpgradeTasks((prev) => prev.filter((item) => !(item.packageKind === 'firmware' && item.packageId === fwDeleteTarget.id)));
        onUpdateUpgradeBatches((prev) => prev.filter((item) => item.packageId !== fwDeleteTarget.id));
        setFwDeleteTarget(null);
        showToast('固件包已删除');
    };

    const handleCreateTask = (value: UpgradeTaskFormValue) => {
        if (!taskContext) return;
        const taskId = generateUpgradeTaskId();
        const createdAt = formatRemoteUpgradeNow();
        const newTask: UpgradeTaskRecord = {
            id: taskId,
            packageKind: 'firmware',
            packageId: taskContext.id,
            packageName: taskContext.name,
            targetVersion: value.targetVersion,
            scope: value.scope,
            deviceIds: value.deviceIds,
            scheduleType: value.scheduleType,
            scheduledAt: value.scheduledAt,
            retryStrategy: value.retryStrategy,
            timeout: value.timeout,
            status: value.scheduleType === '立即升级' ? '执行中' : '待执行',
            createdAt,
        };
        onUpdateUpgradeTasks((prev) => [newTask, ...prev]);
        onUpdateUpgradeBatches((prev) => [
            upgradeTaskToBatch(newTask, taskContext.version),
            ...prev,
        ]);
        setTaskContext(null);
        showToast('升级任务创建成功');
    };

    const sidebar = <DeviceAccessSidebar pageId="remote-upgrade" onNavigate={onNavigate} />;

    return (
        <AppShell
            activeTopTab="设备接入"
            sidebar={sidebar}
            onNavigateMessageCenter={onNavigateMessageCenter}
            onTopTabChange={(tab) => {
                if (tab === '设备接入') onNavigate('home');
            }}
        >
            <div className="pm-page ru-page">
                <div className="crumb">设备接入 / 设备运维 / 远程升级</div>

                {taskDetail ? (
                    <UpgradeTaskDetailView
                        record={taskDetail}
                        upgradeTasks={upgradeTasks}
                        upgradeBatches={upgradeBatches}
                        deviceDetails={upgradeDeviceDetails}
                        onBack={() => setTaskDetail(null)}
                        onToast={(message) => showToast(message)}
                    />
                ) : (
                <section className="panel pm-list-panel">
                    <div className="pm-section-head">
                        <h3>固件包列表</h3>
                    </div>

                    <div className="pm-filter-panel" style={{ boxShadow: 'none', border: 0, padding: '0 0 12px' }}>
                        <div className="ru-search-row">
                            <div className="ru-search-input-group">
                                <ElSelect
                                    className="el-select--medium ru-search-field-select"
                                    size="medium"
                                    value={search.searchField}
                                    options={FIRMWARE_SEARCH_FIELD_OPTIONS}
                                    onChange={(value) => setSearch((prev) => ({ ...prev, searchField: value }))}
                                />
                                <ClearableInput
                                    type="text"
                                    className="pm-filter-input ru-search-keyword-input"
                                    placeholder="请输入搜索内容"
                                    value={search.draftKeyword}
                                    onChange={(event) => setSearch((prev) => ({ ...prev, draftKeyword: event.target.value }))}
                                />
                            </div>
                            <button type="button" className="pm-btn pm-btn-primary" onClick={handleSearch}>
                                <Search size={14} />
                                查询
                            </button>
                            <button type="button" className="pm-btn pm-btn-ghost" onClick={handleReset}>
                                重置
                            </button>
                            <button
                                type="button"
                                className="pm-btn pm-btn-primary ru-search-row__add"
                                onClick={() => {
                                    setFwEditingRecord(null);
                                    setFwFormMode('add');
                                }}
                            >
                                <Plus size={14} />
                                添加固件包
                            </button>
                        </div>
                    </div>

                    <div className="pm-table-wrap">
                        <table className="pm-table">
                            <thead>
                                <tr>
                                    <th>序号</th>
                                    <th>固件包名称</th>
                                    <th>固件包类型</th>
                                    <th>产品名称</th>
                                    <th>固件包版本号</th>
                                    <th>添加时间</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pagination.items.map((record, index) => (
                                    <tr key={record.id}>
                                        <td>{(pagination.currentPage - 1) * Number(search.pageSize) + index + 1}</td>
                                        <td>{record.name}</td>
                                        <td>{record.type}</td>
                                        <td>{record.productName}</td>
                                        <td>{record.version}</td>
                                        <td>{record.createdAt}</td>
                                        <td>
                                            <div className="pm-table-actions">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setFwEditingRecord(record);
                                                        setFwFormMode('edit');
                                                    }}
                                                >
                                                    编辑
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setTaskContext(toUpgradeTarget(record))}
                                                >
                                                    创建任务
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setTaskDetail(record)}
                                                >
                                                    任务详情
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setFwDeleteTarget(record)}
                                                >
                                                    删除
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {!pagination.items.length && (
                                    <tr>
                                        <td colSpan={7} className="pc-empty-cell">暂无固件包数据</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <ListPagination
                        total={pagination.total}
                        currentPage={pagination.currentPage}
                        totalPages={pagination.totalPages}
                        pageSize={search.pageSize}
                        jumpPage={search.jumpPage}
                        onPageChange={(page) => setSearch((prev) => ({ ...prev, currentPage: page }))}
                        onPageSizeChange={(size) => setSearch((prev) => ({ ...prev, pageSize: size }))}
                        onJumpPageChange={(page) => setSearch((prev) => ({ ...prev, jumpPage: page }))}
                    />
                </section>
                )}
            </div>

            <FirmwarePackageFormDialog
                open={fwFormMode !== null}
                mode={fwFormMode ?? 'add'}
                initialValue={fwEditingRecord ? toFirmwarePackageFormValue(fwEditingRecord) : undefined}
                products={products}
                onClose={() => { setFwFormMode(null); setFwEditingRecord(null); }}
                onSubmit={handleSaveFirmware}
            />

            <UpgradeTaskFormDialog
                open={Boolean(taskContext)}
                upgradePackage={taskContext}
                devices={devices}
                onClose={() => setTaskContext(null)}
                onSubmit={handleCreateTask}
            />

            {fwDeleteTarget && (
                <ConfirmDialog
                    title="删除固件包"
                    message={`确定删除固件包「${fwDeleteTarget.name}」吗？关联升级任务将一并删除。`}
                    onClose={() => setFwDeleteTarget(null)}
                    onConfirm={handleDeleteFirmware}
                />
            )}

            <IotToast toast={toast} />
        </AppShell>
    );
}
