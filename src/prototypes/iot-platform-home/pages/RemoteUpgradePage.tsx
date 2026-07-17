import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Clock3, Plus, Search, XCircle } from 'lucide-react';
import AppShell from '../components/AppShell';
import Breadcrumb from '../components/Breadcrumb';
import DeviceAccessSidebar, { type DeviceAccessPageId } from '../components/DeviceAccessSidebar';
import ElSelect from '../components/ElSelect';
import ListPagination from '../components/ListPagination';
import FirmwarePackageFormDialog from '../components/FirmwarePackageFormDialog';
import UpgradeTaskFormDialog from '../components/UpgradeTaskFormDialog';
import UpgradeTaskDetailView from '../components/UpgradeTaskDetailView';
import AuditDialog from '../components/AuditDialog';
import { ConfirmDialog } from '../components/IotDialogs';
import IotToast, { type IotToastData, type IotToastType, triggerIotToast } from '../components/IotToast';
import type { DeviceRecord } from '../data/devices';
import type { ProductRecord } from '../data/products';
import type { SystemUserRecord } from '../data/systemUsers';
import type { SystemRoleRecord } from '../data/systemRoles';
import { buildPermissionId } from '../data/tenantMenus';
import {
    formatRemoteUpgradeNow,
    FIRMWARE_SEARCH_FIELD_OPTIONS,
    generateFirmwarePackageId,
    generateUpgradeTaskId,
    toFirmwarePackageFormValue,
    toUpgradeTaskFormValue,
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
    systemUsers: SystemUserRecord[];
    systemRoles: SystemRoleRecord[];
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
    systemUsers,
    systemRoles,
}: RemoteUpgradePageProps) {
    const [search, setSearch] = useState<ListSearchState>(INITIAL_SEARCH);
    const [fwFormMode, setFwFormMode] = useState<'add' | 'edit' | null>(null);
    const [fwEditingRecord, setFwEditingRecord] = useState<FirmwarePackageRecord | null>(null);
    const [fwDeleteTarget, setFwDeleteTarget] = useState<FirmwarePackageRecord | null>(null);
    const [taskContext, setTaskContext] = useState<UpgradePackageTarget | null>(null);
    const [resubmitSourceTask, setResubmitSourceTask] = useState<UpgradeTaskRecord | null>(null);
    const [taskDetail, setTaskDetail] = useState<FirmwarePackageRecord | null>(null);
    const [auditorTask, setAuditorTask] = useState<UpgradeTaskRecord | null>(null);
    const [toast, setToast] = useState<IotToastData | null>(null);
    const currentUser = '管理员-陈伟';
    const [workspaceTab, setWorkspaceTab] = useState<'packages' | 'approvals'>('packages');
    const currentUserId = currentUser.startsWith('审核员')
        ? 'user-li-manager'
        : currentUser.startsWith('管理员')
            ? 'user-chenwei'
            : 'user-zhanghe';
    const currentSystemUser = systemUsers.find((user) => user.id === currentUserId);
    const currentSystemRole = systemRoles.find((role) => role.id === currentSystemUser?.roleId);
    const approvalPermissionId = buildPermissionId('remote-upgrade', 'approve');
    const isAuditor = Boolean(
        currentSystemUser?.status === '正常'
        && (currentSystemRole?.isTenantAdmin || currentSystemRole?.authorizedPermissionIds?.includes(approvalPermissionId)),
    );

    const showToast = (message: string, type: IotToastType = 'success') => {
        triggerIotToast(setToast, message, type);
    };

    const filteredPackages = useMemo(
        () => filterPackages(firmwarePackages, search.keyword, search.searchField),
        [firmwarePackages, search.keyword, search.searchField],
    );

    // 统计每个固件包的待审核任务数
    const pendingAuditCountByPackage = useMemo(() => {
        const counts: Record<string, number> = {};
        upgradeTasks.forEach((task) => {
            if (task.status === '待审核') {
                counts[task.packageId] = (counts[task.packageId] || 0) + 1;
            }
        });
        return counts;
    }, [upgradeTasks]);

    const auditorTasks = useMemo(
        () => [...upgradeTasks]
            .sort((left, right) => {
                if (left.status === '待审核' && right.status !== '待审核') return -1;
                if (left.status !== '待审核' && right.status === '待审核') return 1;
                return right.createdAt.localeCompare(left.createdAt);
            }),
        [upgradeTasks],
    );

    const pendingAuditorTaskCount = auditorTasks.filter((task) => task.status === '待审核').length;

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
            status: '待审核',
            createdAt,
        };
        onUpdateUpgradeTasks((prev) => {
            const withoutResubmitSource = resubmitSourceTask
                ? prev.filter((task) => task.id !== resubmitSourceTask.id)
                : prev;
            return [newTask, ...withoutResubmitSource];
        });
        if (resubmitSourceTask) {
            onUpdateUpgradeBatches((prev) => prev.filter((batch) => batch.id !== resubmitSourceTask.id));
        }
        setResubmitSourceTask(null);
        setTaskContext(null);
        showToast(resubmitSourceTask ? '任务已重新提交，等待审核' : '升级任务创建成功，等待审核');
    };

    const handleAuditorApprove = (remark: string) => {
        if (!auditorTask) return;
        const auditTime = formatRemoteUpgradeNow();
        const firmware = firmwarePackages.find((item) => item.id === auditorTask.packageId);
        const approvedTask: UpgradeTaskRecord = {
            ...auditorTask,
            status: '待执行',
            auditor: currentUser,
            auditorUserId: currentUserId,
            auditTime,
            auditRemark: remark || undefined,
        };
        onUpdateUpgradeTasks((prev) => prev.map((task) => task.id === auditorTask.id ? approvedTask : task));
        onUpdateUpgradeBatches((prev) => [
            upgradeTaskToBatch(approvedTask, firmware?.version ?? auditorTask.targetVersion),
            ...prev.filter((batch) => batch.id !== auditorTask.id),
        ]);
        setAuditorTask(null);
        showToast('审核通过，任务已加入待执行队列');
    };

    const handleAuditorReject = (remark: string) => {
        if (!auditorTask) return;
        onUpdateUpgradeTasks((prev) => prev.map((task) => task.id === auditorTask.id ? {
            ...task,
            status: '审核驳回',
            auditor: currentUser,
            auditorUserId: currentUserId,
            auditTime: formatRemoteUpgradeNow(),
            auditRemark: remark,
        } : task));
        setAuditorTask(null);
        showToast('审核驳回，任务已退回发起人');
    };

    // 重新提交被驳回的任务
    const handleResubmitTask = (rejectedTask: UpgradeTaskRecord) => {
        const firmware = firmwarePackages.find((item) => item.id === rejectedTask.packageId);
        if (!firmware) {
            showToast('未找到对应固件包，无法重新编辑', 'warning');
            return;
        }
        setResubmitSourceTask(rejectedTask);
        setTaskContext(toUpgradeTarget(firmware));
    };

    const handleCloseTaskDialog = () => {
        setTaskContext(null);
        setResubmitSourceTask(null);
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
                <Breadcrumb items={[
                                    { label: '设备接入', pageId: 'home' },
                                    { label: '远程升级', pageId: 'remote-upgrade' },
                                    { label: '远程升级' },
                                ]} onNavigate={(id) => onNavigate(id as DeviceAccessPageId)} />

                <div className={taskDetail ? 'ru-workspace-detail' : 'ru-workspace-shell'}>
                {!taskDetail && <nav className="ru-workspace-tabs" aria-label="远程升级工作台" role="tablist">
                    <button
                        type="button"
                        className={workspaceTab === 'packages' ? 'is-active' : ''}
                        onClick={() => { setWorkspaceTab('packages'); setTaskDetail(null); }}
                        role="tab"
                        aria-selected={workspaceTab === 'packages'}
                    >
                        固件包管理
                    </button>
                    <button
                        type="button"
                        className={workspaceTab === 'approvals' ? 'is-active' : ''}
                        onClick={() => { setWorkspaceTab('approvals'); setTaskDetail(null); }}
                        role="tab"
                        aria-selected={workspaceTab === 'approvals'}
                    >
                        审批任务
                        {pendingAuditorTaskCount > 0 && <em>{pendingAuditorTaskCount} 待审批</em>}
                    </button>
                </nav>}

                {workspaceTab === 'approvals' ? (
                    <section className="panel pm-list-panel ru-approval-workbench">
                        <div className="pm-section-head ru-approval-workbench__head">
                            <div>
                                <h3>我的审批任务</h3>
                                <p>直接处理分配给你的远程升级审批，无需进入固件包列表</p>
                            </div>
                            <div className="ru-approval-summary">
                                <span><Clock3 size={15} />待审批 <strong>{pendingAuditorTaskCount}</strong></span>
                                <span><CheckCircle2 size={15} />已处理 <strong>{auditorTasks.length - pendingAuditorTaskCount}</strong></span>
                            </div>
                        </div>
                        <div className="pm-table-wrap">
                            <table className="pm-table">
                                <thead>
                                    <tr>
                                        <th>任务ID</th>
                                        <th>固件包</th>
                                        <th>所属产品</th>
                                        <th>目标版本</th>
                                        <th>升级范围</th>
                                        <th>提交时间</th>
                                        <th>审批状态</th>
                                        <th>操作</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {auditorTasks.map((task) => {
                                        const firmware = firmwarePackages.find((item) => item.id === task.packageId);
                                        const rejected = task.status === '审核驳回';
                                        const approved = Boolean(task.auditTime) && !rejected;
                                        return (
                                            <tr key={task.id}>
                                                <td>{task.id}</td>
                                                <td>{task.packageName}</td>
                                                <td>{firmware?.productName || '—'}</td>
                                                <td>{task.targetVersion}</td>
                                                <td>{task.scope === '指定设备' ? `${task.deviceIds.length} 个设备` : '全部设备'}</td>
                                                <td>{task.createdAt}</td>
                                                <td>
                                                    <span className={`ru-approval-state ${task.status === '待审核' ? 'is-pending' : rejected ? 'is-rejected' : 'is-approved'}`}>
                                                        {task.status === '待审核' ? <Clock3 size={14} /> : rejected ? <XCircle size={14} /> : <CheckCircle2 size={14} />}
                                                        {task.status === '待审核' ? '待审批' : rejected ? '已驳回' : '已通过'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="pm-table-actions">
                                                        {task.status === '待审核' ? (
                                                            <button type="button" onClick={() => setAuditorTask(task)}>审批</button>
                                                        ) : approved || rejected ? (
                                                            <span className="ru-audit-record-done" title={task.auditRemark || '无审批意见'}>已留痕</span>
                                                        ) : null}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {!auditorTasks.length && (
                                        <tr><td colSpan={8} className="pc-empty-cell">暂无分配给你的审批任务</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                ) : taskDetail ? (
                    <UpgradeTaskDetailView
                        record={taskDetail}
                        upgradeTasks={upgradeTasks}
                        upgradeBatches={upgradeBatches}
                        deviceDetails={upgradeDeviceDetails}
                        onBack={() => setTaskDetail(null)}
                        onToast={(message) => showToast(message)}
                        onResubmitTask={handleResubmitTask}
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
                                                    style={{ position: 'relative' }}
                                                >
                                                    任务详情
                                                    {pendingAuditCountByPackage[record.id] > 0 && (
                                                        <span style={{
                                                            position: 'absolute',
                                                            top: '-8px',
                                                            right: '-8px',
                                                            background: '#f56c6c',
                                                            color: '#fff',
                                                            borderRadius: '10px',
                                                            padding: '0 5px',
                                                            fontSize: '10px',
                                                            lineHeight: '16px',
                                                            minWidth: '16px',
                                                            textAlign: 'center'
                                                        }}>
                                                            {pendingAuditCountByPackage[record.id]}
                                                        </span>
                                                    )}
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
                mode={resubmitSourceTask ? 'resubmit' : 'create'}
                initialValue={resubmitSourceTask ? toUpgradeTaskFormValue(resubmitSourceTask) : undefined}
                rejectRemark={resubmitSourceTask?.auditRemark}
                onClose={handleCloseTaskDialog}
                onSubmit={handleCreateTask}
            />

            {auditorTask && (() => {
                const firmware = firmwarePackages.find((item) => item.id === auditorTask.packageId);
                return (
                    <AuditDialog
                        open
                        task={auditorTask}
                        taskName={`${auditorTask.packageName} - ${auditorTask.targetVersion}`}
                        productName={firmware?.productName || '—'}
                        productId={firmware?.productId || ''}
                        devices={devices}
                        currentUser={currentUser}
                        onClose={() => setAuditorTask(null)}
                        onApprove={handleAuditorApprove}
                        onReject={handleAuditorReject}
                    />
                );
            })()}

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
