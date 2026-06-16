import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import AppShell from '../components/AppShell';
import DeviceAccessSidebar, { type DeviceAccessPageId } from '../components/DeviceAccessSidebar';
import ElSelect from '../components/ElSelect';
import ListPagination from '../components/ListPagination';
import FirmwarePackageFormDialog from '../components/FirmwarePackageFormDialog';
import SoftwarePackageFormDialog from '../components/SoftwarePackageFormDialog';
import UpgradeTaskFormDialog from '../components/UpgradeTaskFormDialog';
import UpgradeTaskDetailView from '../components/UpgradeTaskDetailView';
import { ConfirmDialog } from '../components/IotDialogs';
import IotToast, { type IotToastData, type IotToastType, triggerIotToast } from '../components/IotToast';
import type { DeviceRecord } from '../data/devices';
import type { ProductRecord } from '../data/products';
import {
    formatRemoteUpgradeNow,
    FIRMWARE_SEARCH_FIELD_OPTIONS,
    SOFTWARE_SEARCH_FIELD_OPTIONS,
    generateFirmwarePackageId,
    generateSoftwarePackageId,
    generateUpgradeTaskId,
    toFirmwarePackageFormValue,
    toSoftwarePackageFormValue,
    type FirmwarePackageFormValue,
    type FirmwarePackageRecord,
    type SoftwarePackageFormValue,
    type SoftwarePackageRecord,
    type UpgradePackageKind,
    type UpgradePackageTarget,
    upgradeTaskToBatch,
    type UpgradeDeviceDetailRecord,
    type UpgradeTaskBatchRecord,
    type UpgradeTaskFormValue,
    type UpgradeTaskRecord,
} from '../data/remoteUpgrade';
import { paginateItems } from '../utils/listPagination';
import '../device-access.css';
import '../device-create.css';
import '../product-management.css';
import '../product-create.css';
import '../remote-upgrade.css';

type MainTab = 'firmware' | 'software';

type RemoteUpgradePageProps = {
    products: ProductRecord[];
    devices: DeviceRecord[];
    firmwarePackages: FirmwarePackageRecord[];
    softwarePackages: SoftwarePackageRecord[];
    upgradeTasks: UpgradeTaskRecord[];
    upgradeBatches: UpgradeTaskBatchRecord[];
    upgradeDeviceDetails: UpgradeDeviceDetailRecord[];
    onUpdateFirmwarePackages: React.Dispatch<React.SetStateAction<FirmwarePackageRecord[]>>;
    onUpdateSoftwarePackages: React.Dispatch<React.SetStateAction<SoftwarePackageRecord[]>>;
    onUpdateUpgradeTasks: React.Dispatch<React.SetStateAction<UpgradeTaskRecord[]>>;
    onUpdateUpgradeBatches: React.Dispatch<React.SetStateAction<UpgradeTaskBatchRecord[]>>;
    onNavigateHome: () => void;
    onNavigateDeviceAccess: () => void;
    onNavigateMessageCenter: () => void;
    onNavigate: (pageId: DeviceAccessPageId) => void;
    onNavigateOmManagement: () => void;
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

function toUpgradeTarget(record: FirmwarePackageRecord | SoftwarePackageRecord): UpgradePackageTarget {
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
    softwarePackages,
    upgradeTasks,
    upgradeBatches,
    upgradeDeviceDetails,
    onUpdateFirmwarePackages,
    onUpdateSoftwarePackages,
    onUpdateUpgradeTasks,
    onUpdateUpgradeBatches,
    onNavigateHome,
    onNavigateDeviceAccess,
    onNavigateMessageCenter,
    onNavigate,
    onNavigateOmManagement,
}: RemoteUpgradePageProps) {
    const [mainTab, setMainTab] = useState<MainTab>('firmware');
    const [fwSearch, setFwSearch] = useState<ListSearchState>(INITIAL_SEARCH);
    const [swSearch, setSwSearch] = useState<ListSearchState>(INITIAL_SEARCH);
    const [fwFormMode, setFwFormMode] = useState<'add' | 'edit' | null>(null);
    const [swFormMode, setSwFormMode] = useState<'add' | 'edit' | null>(null);
    const [fwEditingRecord, setFwEditingRecord] = useState<FirmwarePackageRecord | null>(null);
    const [swEditingRecord, setSwEditingRecord] = useState<SoftwarePackageRecord | null>(null);
    const [fwDeleteTarget, setFwDeleteTarget] = useState<FirmwarePackageRecord | null>(null);
    const [swDeleteTarget, setSwDeleteTarget] = useState<SoftwarePackageRecord | null>(null);
    const [taskContext, setTaskContext] = useState<{ kind: UpgradePackageKind; target: UpgradePackageTarget } | null>(null);
    const [taskDetail, setTaskDetail] = useState<{ kind: UpgradePackageKind; record: FirmwarePackageRecord | SoftwarePackageRecord } | null>(null);
    const [toast, setToast] = useState<IotToastData | null>(null);

    const showToast = (message: string, type: IotToastType = 'success') => {
        triggerIotToast(setToast, message, type);
    };

    const isFirmwareTab = mainTab === 'firmware';
    const activeSearch = isFirmwareTab ? fwSearch : swSearch;
    const setActiveSearch = isFirmwareTab ? setFwSearch : setSwSearch;
    const activePackages = isFirmwareTab ? firmwarePackages : softwarePackages;
    const searchOptions = isFirmwareTab ? FIRMWARE_SEARCH_FIELD_OPTIONS : SOFTWARE_SEARCH_FIELD_OPTIONS;

    const filteredPackages = useMemo(
        () => filterPackages(activePackages, activeSearch.keyword, activeSearch.searchField),
        [activePackages, activeSearch.keyword, activeSearch.searchField],
    );

    const pagination = useMemo(
        () => paginateItems(filteredPackages, activeSearch.currentPage, Number(activeSearch.pageSize)),
        [filteredPackages, activeSearch.currentPage, activeSearch.pageSize],
    );

    useEffect(() => {
        setActiveSearch((prev) => ({ ...prev, currentPage: 1, jumpPage: '1' }));
    }, [activeSearch.keyword, activeSearch.searchField, activeSearch.pageSize, mainTab, setActiveSearch]);

    useEffect(() => {
        setActiveSearch((prev) => ({ ...prev, jumpPage: String(pagination.currentPage) }));
    }, [pagination.currentPage, setActiveSearch]);

    const resolveProductName = (productId: string) => (
        products.find((item) => item.id === productId)?.name ?? '—'
    );

    const handleSearch = () => {
        setActiveSearch((prev) => ({
            ...prev,
            keyword: prev.draftKeyword,
            currentPage: 1,
            jumpPage: '1',
        }));
    };

    const handleReset = () => {
        setActiveSearch(INITIAL_SEARCH);
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

    const handleSaveSoftware = (value: SoftwarePackageFormValue) => {
        const productName = resolveProductName(value.productId);
        if (swFormMode === 'edit' && swEditingRecord) {
            onUpdateSoftwarePackages((prev) => prev.map((item) => (
                item.id === swEditingRecord.id
                    ? { ...item, ...value, productName, description: value.description || '—' }
                    : item
            )));
            showToast('软件包保存成功');
        } else {
            onUpdateSoftwarePackages((prev) => [
                {
                    id: generateSoftwarePackageId(),
                    ...value,
                    productName,
                    description: value.description || '—',
                    createdAt: formatRemoteUpgradeNow(),
                },
                ...prev,
            ]);
            showToast('软件包添加成功');
        }
        setSwFormMode(null);
        setSwEditingRecord(null);
    };

    const handleDeleteFirmware = () => {
        if (!fwDeleteTarget) return;
        onUpdateFirmwarePackages((prev) => prev.filter((item) => item.id !== fwDeleteTarget.id));
        onUpdateUpgradeTasks((prev) => prev.filter((item) => !(item.packageKind === 'firmware' && item.packageId === fwDeleteTarget.id)));
        onUpdateUpgradeBatches((prev) => prev.filter((item) => item.packageId !== fwDeleteTarget.id));
        setFwDeleteTarget(null);
        showToast('固件包已删除');
    };

    const handleDeleteSoftware = () => {
        if (!swDeleteTarget) return;
        onUpdateSoftwarePackages((prev) => prev.filter((item) => item.id !== swDeleteTarget.id));
        onUpdateUpgradeTasks((prev) => prev.filter((item) => !(item.packageKind === 'software' && item.packageId === swDeleteTarget.id)));
        onUpdateUpgradeBatches((prev) => prev.filter((item) => item.packageId !== swDeleteTarget.id));
        setSwDeleteTarget(null);
        showToast('软件包已删除');
    };

    const handleCreateTask = (value: UpgradeTaskFormValue) => {
        if (!taskContext) return;
        const taskId = generateUpgradeTaskId();
        const createdAt = formatRemoteUpgradeNow();
        const newTask: UpgradeTaskRecord = {
            id: taskId,
            packageKind: taskContext.kind,
            packageId: taskContext.target.id,
            packageName: taskContext.target.name,
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
            upgradeTaskToBatch(newTask, taskContext.target.version),
            ...prev,
        ]);
        setTaskContext(null);
        showToast('升级任务创建成功');
    };

    const packageLabel = isFirmwareTab ? '固件包' : '软件包';
    const versionLabel = isFirmwareTab ? '固件包版本号' : '软件包版本号';

    const sidebar = <DeviceAccessSidebar pageId="remote-upgrade" onNavigate={onNavigate} />;

    return (
        <AppShell
            activeTopTab="设备接入"
            sidebar={sidebar}
            onNavigateOmManagement={onNavigateOmManagement}
            onNavigateMessageCenter={onNavigateMessageCenter}
            onTopTabChange={(tab) => {
                if (tab === '设备接入') onNavigate('home');
                if (tab === '运维管理') onNavigateOmManagement();
            }}
        >
            <div className="pm-page ru-page">
                <div className="crumb">设备接入 / 设备运维 / 远程升级</div>

                {taskDetail ? (
                    <UpgradeTaskDetailView
                        kind={taskDetail.kind}
                        record={taskDetail.record}
                        upgradeTasks={upgradeTasks}
                        upgradeBatches={upgradeBatches}
                        deviceDetails={upgradeDeviceDetails}
                        onBack={() => setTaskDetail(null)}
                        onToast={(message) => showToast(message)}
                    />
                ) : (
                <section className="panel pm-list-panel">
                    <div className="ru-main-tabs">
                        <button
                            type="button"
                            className={`ru-main-tab ${mainTab === 'firmware' ? 'is-active' : ''}`}
                            onClick={() => setMainTab('firmware')}
                        >
                            固件包管理
                        </button>
                        <button
                            type="button"
                            className={`ru-main-tab ${mainTab === 'software' ? 'is-active' : ''}`}
                            onClick={() => setMainTab('software')}
                        >
                            软件包管理
                        </button>
                    </div>

                    <div className="pm-section-head" style={{ marginTop: 16 }}>
                        <h3>{packageLabel}列表</h3>
                        <button
                            type="button"
                            className="pm-btn pm-btn-primary"
                            onClick={() => {
                                if (isFirmwareTab) {
                                    setFwEditingRecord(null);
                                    setFwFormMode('add');
                                } else {
                                    setSwEditingRecord(null);
                                    setSwFormMode('add');
                                }
                            }}
                        >
                            <Plus size={14} />
                            {isFirmwareTab ? '添加固件包' : '添加软件包'}
                        </button>
                    </div>

                    <div className="pm-filter-panel" style={{ boxShadow: 'none', border: 0, padding: '0 0 12px' }}>
                        <div className="ru-search-row">
                            <div className="ru-search-input-group">
                                <ElSelect
                                    key={mainTab}
                                    className="el-select--medium ru-search-field-select"
                                    size="medium"
                                    value={activeSearch.searchField}
                                    options={searchOptions}
                                    onChange={(value) => setActiveSearch((prev) => ({ ...prev, searchField: value }))}
                                />
                                <input
                                    type="text"
                                    className="pm-filter-input ru-search-keyword-input"
                                    placeholder="请输入搜索内容"
                                    value={activeSearch.draftKeyword}
                                    onChange={(event) => setActiveSearch((prev) => ({ ...prev, draftKeyword: event.target.value }))}
                                />
                            </div>
                            <button type="button" className="pm-btn pm-btn-primary" onClick={handleSearch}>
                                <Search size={14} />
                                查询
                            </button>
                            <button type="button" className="pm-btn pm-btn-ghost" onClick={handleReset}>
                                重置
                            </button>
                        </div>
                    </div>

                    <div className="pm-table-wrap">
                        <table className="pm-table">
                            <thead>
                                <tr>
                                    <th>序号</th>
                                    <th>{packageLabel}名称</th>
                                    {isFirmwareTab && <th>固件包类型</th>}
                                    <th>产品名称</th>
                                    <th>{versionLabel}</th>
                                    <th>添加时间</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pagination.items.map((record, index) => (
                                    <tr key={record.id}>
                                        <td>{(pagination.currentPage - 1) * Number(activeSearch.pageSize) + index + 1}</td>
                                        <td>{record.name}</td>
                                        {isFirmwareTab && <td>{(record as FirmwarePackageRecord).type}</td>}
                                        <td>{record.productName}</td>
                                        <td>{record.version}</td>
                                        <td>{record.createdAt}</td>
                                        <td>
                                            <div className="pm-table-actions">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (isFirmwareTab) {
                                                            setFwEditingRecord(record as FirmwarePackageRecord);
                                                            setFwFormMode('edit');
                                                        } else {
                                                            setSwEditingRecord(record as SoftwarePackageRecord);
                                                            setSwFormMode('edit');
                                                        }
                                                    }}
                                                >
                                                    编辑
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setTaskContext({
                                                        kind: isFirmwareTab ? 'firmware' : 'software',
                                                        target: toUpgradeTarget(record),
                                                    })}
                                                >
                                                    创建任务
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setTaskDetail({
                                                        kind: isFirmwareTab ? 'firmware' : 'software',
                                                        record,
                                                    })}
                                                >
                                                    任务详情
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (isFirmwareTab) {
                                                            setFwDeleteTarget(record as FirmwarePackageRecord);
                                                        } else {
                                                            setSwDeleteTarget(record as SoftwarePackageRecord);
                                                        }
                                                    }}
                                                >
                                                    删除
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {!pagination.items.length && (
                                    <tr>
                                        <td colSpan={isFirmwareTab ? 7 : 6} className="pc-empty-cell">暂无{packageLabel}数据</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <ListPagination
                        total={pagination.total}
                        currentPage={pagination.currentPage}
                        totalPages={pagination.totalPages}
                        pageSize={activeSearch.pageSize}
                        jumpPage={activeSearch.jumpPage}
                        onPageChange={(page) => setActiveSearch((prev) => ({ ...prev, currentPage: page }))}
                        onPageSizeChange={(size) => setActiveSearch((prev) => ({ ...prev, pageSize: size }))}
                        onJumpPageChange={(page) => setActiveSearch((prev) => ({ ...prev, jumpPage: page }))}
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

            <SoftwarePackageFormDialog
                open={swFormMode !== null}
                mode={swFormMode ?? 'add'}
                initialValue={swEditingRecord ? toSoftwarePackageFormValue(swEditingRecord) : undefined}
                products={products}
                onClose={() => { setSwFormMode(null); setSwEditingRecord(null); }}
                onSubmit={handleSaveSoftware}
            />

            <UpgradeTaskFormDialog
                open={Boolean(taskContext)}
                upgradePackage={taskContext?.target ?? null}
                devices={devices}
                onClose={() => setTaskContext(null)}
                onSubmit={handleCreateTask}
            />

            {fwDeleteTarget && (
                <ConfirmDialog
                    title="删除固件包"
                    message={`确定删除固件包「${fwDeleteTarget.name}」吗？关联升级任务将一并删除。`}
                    drawerClassName="dcp-group-dialog ru-drawer"
                    onClose={() => setFwDeleteTarget(null)}
                    onConfirm={handleDeleteFirmware}
                />
            )}

            {swDeleteTarget && (
                <ConfirmDialog
                    title="删除软件包"
                    message={`确定删除软件包「${swDeleteTarget.name}」吗？关联升级任务将一并删除。`}
                    drawerClassName="dcp-group-dialog ru-drawer"
                    onClose={() => setSwDeleteTarget(null)}
                    onConfirm={handleDeleteSoftware}
                />
            )}

            <IotToast toast={toast} />
        </AppShell>
    );
}
