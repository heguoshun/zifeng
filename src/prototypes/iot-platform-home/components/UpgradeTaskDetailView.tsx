import React, { useEffect, useMemo, useState } from 'react';
import {
    ArrowLeft,
    Search,
    Clock,
    Loader2,
    CheckCircle2,
    XCircle,
    AlertTriangle,
} from 'lucide-react';
import ListPagination from './ListPagination';
import UpgradeDeviceDetailDrawer from './UpgradeDeviceDetailDrawer';
import { ConfirmDialog } from './IotDialogs';
import {
    mergePackageBatches,
    type FirmwarePackageRecord,
    type PackageUpgradeStats,
    type UpgradeDeviceDetailRecord,
    type UpgradeTaskBatchRecord,
    type UpgradeTaskRecord,
} from '../data/remoteUpgrade';
import { paginateItems, DEFAULT_LIST_PAGE_SIZE } from '../utils/listPagination';
import '../remote-upgrade.css';
import ClearableInput from './ClearableInput';

type UpgradeTaskDetailViewProps = {
    record: FirmwarePackageRecord;
    upgradeTasks: UpgradeTaskRecord[];
    upgradeBatches: UpgradeTaskBatchRecord[];
    deviceDetails: UpgradeDeviceDetailRecord[];
    onBack: () => void;
    onToast: (message: string) => void;
    onResubmitTask?: (task: UpgradeTaskRecord) => void;
};

function BatchStatusCell({ status, cancelled }: { status: UpgradeTaskBatchRecord['status']; cancelled?: boolean }) {
    if (cancelled) {
        return (
            <span className="ru-batch-status">
                <i className="ru-batch-dot ru-batch-dot--cancelled" />
                已取消
            </span>
        );
    }

    const dotClass = status === '进行中'
        ? 'ru-batch-dot--running'
        : status === '未开始'
            ? 'ru-batch-dot--pending'
            : 'ru-batch-dot--done';

    return (
        <span className="ru-batch-status">
            <i className={`ru-batch-dot ${dotClass}`} />
            {status}
        </span>
    );
}

function TaskStatusTag({ status }: { status: UpgradeTaskRecord['status'] }) {
    const colorMap: Record<string, string> = {
        '待审核': '#e6a23c',
        '审核驳回': '#f56c6c',
        '待执行': '#909399',
        '执行中': '#409eff',
        '已完成': '#67c23a',
        '部分失败': '#f56c6c',
    };

    return (
        <span style={{
            display: 'inline-block',
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            background: `${colorMap[status] || '#909399'}15`,
            color: colorMap[status] || '#909399',
            border: `1px solid ${colorMap[status] || '#909399'}30`
        }}>
            {status}
        </span>
    );
}

function displayPersonName(value?: string): string {
    return value?.replace(/^(审核员|发起者)-/, '') || '未指定';
}

const DEFAULT_STATS: PackageUpgradeStats = {
    pending: 48,
    upgrading: 22,
    success: 20,
    failed: 5,
};

export default function UpgradeTaskDetailView({
    record,
    upgradeTasks,
    upgradeBatches,
    deviceDetails,
    onBack,
    onToast,
    onResubmitTask,
}: UpgradeTaskDetailViewProps) {
    const [draftKeyword, setDraftKeyword] = useState('');
    const [keyword, setKeyword] = useState('');
    const [pageSize, setPageSize] = useState('20');
    const [currentPage, setCurrentPage] = useState(1);
    const [jumpPage, setJumpPage] = useState('1');
    const [viewBatch, setViewBatch] = useState<UpgradeTaskBatchRecord | null>(null);
    const [cancelBatch, setCancelBatch] = useState<UpgradeTaskBatchRecord | null>(null);
    const [deleteBatch, setDeleteBatch] = useState<UpgradeTaskBatchRecord | null>(null);
    const [batchOverrides, setBatchOverrides] = useState<Record<string, UpgradeTaskBatchRecord>>({});
    const [hiddenBatchIds, setHiddenBatchIds] = useState<string[]>([]);
    const [cancelledBatchIds, setCancelledBatchIds] = useState<string[]>([]);
    const [detailTab, setDetailTab] = useState<'tasks' | 'batches'>('batches');

    const batches = useMemo(
        () => mergePackageBatches(record.id, 'firmware', record.version, upgradeTasks, upgradeBatches)
            .filter((item) => !hiddenBatchIds.includes(item.id))
            .map((item) => batchOverrides[item.id] ?? item),
        [record.id, record.version, upgradeTasks, upgradeBatches, hiddenBatchIds, batchOverrides],
    );

    // 待审核与已审核任务统一展示，避免拆成多个纵向列表
    const packageUpgradeTasks = useMemo(
        () => upgradeTasks
            .filter((task) => task.packageId === record.id)
            .sort((left, right) => right.createdAt.localeCompare(left.createdAt)),
        [record.id, upgradeTasks],
    );
    const pendingAuditTasks = useMemo(
        () => packageUpgradeTasks.filter((task) => task.status === '待审核'),
        [packageUpgradeTasks],
    );

    const filteredBatches = useMemo(() => {
        const normalized = keyword.trim();
        if (!normalized) return batches;
        return batches.filter((item) => item.batchNo.includes(normalized));
    }, [batches, keyword]);

    const pagination = useMemo(
        () => paginateItems(filteredBatches, currentPage, Number(pageSize)),
        [filteredBatches, currentPage, pageSize],
    );

    useEffect(() => {
        setCurrentPage(1);
        setJumpPage('1');
    }, [keyword, pageSize]);

    useEffect(() => {
        setJumpPage(String(pagination.currentPage));
    }, [pagination.currentPage]);

    const description = record.description === '—' ? '—' : record.description;

    const handleCancelBatch = () => {
        if (!cancelBatch) return;
        setBatchOverrides((prev) => ({
            ...prev,
            [cancelBatch.id]: { ...cancelBatch, status: '未开始' },
        }));
        setCancelledBatchIds((prev) => [...prev, cancelBatch.id]);
        setCancelBatch(null);
        onToast('任务已取消');
    };

    const handleRestartBatch = (batch: UpgradeTaskBatchRecord) => {
        setBatchOverrides((prev) => ({
            ...prev,
            [batch.id]: { ...batch, status: '进行中' },
        }));
        setCancelledBatchIds((prev) => prev.filter((id) => id !== batch.id));
        onToast('批次已重新开始');
    };

    const handleDeleteBatch = () => {
        if (!deleteBatch) return;
        setHiddenBatchIds((prev) => [...prev, deleteBatch.id]);
        setDeleteBatch(null);
        onToast('批次已删除');
    };

    return (
        <div className="ru-task-detail-view">
            <div className="pcp-head ru-task-detail-page-head">
                <button type="button" className="pcp-back-btn" onClick={onBack} aria-label="返回固件包列表">
                    <ArrowLeft size={16} />
                </button>
                <div>
                    <h2 className="pcp-title">{record.name}</h2>
                    <p>查看固件信息、升级任务与执行批次</p>
                </div>
            </div>

            {/* ── Firmware info + upgrade stats (unified card) ── */}
            <section className="ru-task-detail-head panel">
                <div className="pm-section-head">
                    <h3>固件信息</h3>
                </div>
                <div className="ru-detail-header">
                    <div className="ru-detail-header__body">
                        <div className="ru-detail-header__meta">
                            <div className="ru-meta-field">
                                <span className="ru-meta-field__label">固件包类型</span>
                                <span className="ru-meta-field__value">{record.type}</span>
                            </div>
                            <span className="ru-meta-sep" />
                            <div className="ru-meta-field">
                                <span className="ru-meta-field__label">所属产品</span>
                                <span className="ru-meta-field__value">{record.productName}</span>
                            </div>
                            <span className="ru-meta-sep" />
                            <div className="ru-meta-field">
                                <span className="ru-meta-field__label">固件版本号</span>
                                <span className="ru-meta-field__value">{record.version}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="ru-detail-desc">
                    <span className="ru-detail-desc__label">固件描述</span>
                    <span className="ru-detail-desc__text">{description}</span>
                </div>

                {/* 审核信息显示 */}
                {pendingAuditTasks.length > 0 && (
                    <div style={{
                        margin: '16px 24px 0',
                        padding: '12px 16px',
                        background: '#fff7e6',
                        border: '1px solid #ffe58f',
                        borderRadius: '6px'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            fontSize: '13px',
                            color: '#d48806',
                            fontWeight: 500,
                            marginBottom: 8
                        }}>
                            <AlertTriangle size={14} aria-hidden="true" /> 有待审核任务 ({pendingAuditTasks.length})
                        </div>
                        <div style={{ fontSize: '12px', color: '#8c6d1f' }}>
                            请审核以下任务以继续执行升级操作
                        </div>
                    </div>
                )}

                <div className="ru-detail-stats">
                    <div className="ru-detail-stat ru-detail-stat--pending">
                        <div className="ru-detail-stat__icon">
                            <Clock size={15} />
                        </div>
                        <div className="ru-detail-stat__data">
                            <strong>{DEFAULT_STATS.pending}</strong>
                            <span>待升级设备</span>
                        </div>
                    </div>
                    <div className="ru-detail-stat ru-detail-stat--upgrading">
                        <div className="ru-detail-stat__icon">
                            <Loader2 size={15} />
                        </div>
                        <div className="ru-detail-stat__data">
                            <strong>{DEFAULT_STATS.upgrading}</strong>
                            <span>升级中</span>
                        </div>
                    </div>
                    <div className="ru-detail-stat ru-detail-stat--success">
                        <div className="ru-detail-stat__icon">
                            <CheckCircle2 size={15} />
                        </div>
                        <div className="ru-detail-stat__data">
                            <strong>{DEFAULT_STATS.success}</strong>
                            <span>升级成功</span>
                        </div>
                    </div>
                    <div className="ru-detail-stat ru-detail-stat--failed">
                        <div className="ru-detail-stat__icon">
                            <XCircle size={15} />
                        </div>
                        <div className="ru-detail-stat__data">
                            <strong>{DEFAULT_STATS.failed}</strong>
                            <span>升级失败</span>
                        </div>
                    </div>
                </div>
            </section>

            <nav className="ru-detail-view-tabs" aria-label="远程升级任务视图">
                <button
                    type="button"
                    className={detailTab === 'batches' ? 'is-active' : ''}
                    onClick={() => setDetailTab('batches')}
                    aria-selected={detailTab === 'batches'}
                    role="tab"
                >
                    任务批次
                </button>
                <button
                    type="button"
                    className={detailTab === 'tasks' ? 'is-active' : ''}
                    onClick={() => setDetailTab('tasks')}
                    aria-selected={detailTab === 'tasks'}
                    role="tab"
                >
                    审批记录
                </button>
            </nav>

            {/* ── Upgrade tasks: pending and audited records in one list ── */}
            {detailTab === 'tasks' && packageUpgradeTasks.length > 0 && (
                <section className="panel pm-list-panel ru-pending-audit-panel">
                    <div className="pm-section-head">
                        <h3>审批记录</h3>
                    </div>
                    <div className="pm-table-wrap ru-pending-audit-table-wrap">
                        <table className="pm-table">
                            <thead>
                                <tr>
                                    <th>任务ID</th>
                                    <th>目标版本</th>
                                    <th>升级范围</th>
                                    <th>状态</th>
                                    <th>审核人员</th>
                                    <th>审核意见</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {packageUpgradeTasks.map((task) => {
                                    const rejected = task.status === '审核驳回';
                                    return (
                                    <tr key={task.id}>
                                        <td>{task.id}</td>
                                        <td>{task.targetVersion}</td>
                                        <td>{task.scope === '指定设备' ? `${task.deviceIds.length}个设备` : '全部设备'}</td>
                                        <td><TaskStatusTag status={task.status} /></td>
                                        <td>
                                            <div className="ru-upgrade-task-audit-info">
                                                <strong>{displayPersonName(task.auditor || task.designatedAuditor)}</strong>
                                                <span>{task.auditTime || '等待审核'}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="ru-audit-record-remark" title={task.auditRemark || '—'}>
                                                {task.auditRemark || '—'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="pm-table-actions">
                                                {task.status === '待审核' ? (
                                                    <span className="ru-audit-record-done">待审批</span>
                                                ) : rejected && onResubmitTask ? (
                                                    <button type="button" onClick={() => onResubmitTask(task)}>重新编辑</button>
                                                ) : (
                                                    <span className="ru-audit-record-done">已留痕</span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}

            {detailTab === 'tasks' && packageUpgradeTasks.length === 0 && (
                <section className="panel ru-detail-tab-empty">暂无审批记录</section>
            )}

            {/* ── Batch list ── */}
            {detailTab === 'batches' && <section className="panel pm-list-panel ru-task-batch-panel">
                <div className="pm-section-head">
                    <h3>任务批次列表</h3>
                </div>

                <div className="ru-batch-search">
                    <div className="ru-batch-search__inner">
                        <Search size={14} className="ru-batch-search__icon" />
                        <ClearableInput
                            type="text"
                            className="pm-filter-input ru-batch-search-input"
                            placeholder="请输入批次ID"
                            value={draftKeyword}
                            onChange={(event) => setDraftKeyword(event.target.value)}
                        />
                    </div>
                    <button
                        type="button"
                        className="pm-btn pm-btn-primary"
                        onClick={() => {
                            setKeyword(draftKeyword);
                            setCurrentPage(1);
                            setJumpPage('1');
                        }}
                    >
                        查询
                    </button>
                </div>

                <div className="pm-table-wrap">
                    <table className="pm-table">
                        <thead>
                            <tr>
                                <th>批次ID</th>
                                <th>状态</th>
                                <th>升级前版本号</th>
                                <th>升级后版本号</th>
                                <th>升级设备</th>
                                <th>升级时间</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pagination.items.map((batch) => {
                                const isCancelled = cancelledBatchIds.includes(batch.id);

                                return (
                                <tr key={batch.id}>
                                    <td>{batch.batchNo}</td>
                                    <td><BatchStatusCell status={batch.status} cancelled={isCancelled} /></td>
                                    <td>{batch.versionBefore}</td>
                                    <td>{batch.versionAfter}</td>
                                    <td>{batch.deviceCount}</td>
                                    <td>{batch.upgradeTime}</td>
                                    <td>
                                        <div className="pm-table-actions">
                                            {isCancelled ? (
                                                <button
                                                    type="button"
                                                    onClick={() => handleRestartBatch(batch)}
                                                >
                                                    重新开始
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    disabled={batch.status === '已完成'}
                                                    onClick={() => setCancelBatch(batch)}
                                                >
                                                    取消任务
                                                </button>
                                            )}
                                            <button type="button" onClick={() => setViewBatch(batch)}>查看</button>
                                            <button type="button" onClick={() => setDeleteBatch(batch)}>删除</button>
                                        </div>
                                    </td>
                                </tr>
                                );
                            })}
                            {!pagination.items.length && (
                                <tr>
                                    <td colSpan={7} className="pc-empty-cell">暂无任务批次</td>
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
            </section>}

            <UpgradeDeviceDetailDrawer
                open={Boolean(viewBatch)}
                batch={viewBatch}
                deviceDetails={deviceDetails}
                cancelled={viewBatch ? cancelledBatchIds.includes(viewBatch.id) : false}
                onClose={() => setViewBatch(null)}
            />

            {cancelBatch && (
                <ConfirmDialog
                    title="取消任务"
                    message={`确定取消任务「${cancelBatch.batchNo}」吗？`}
                    onClose={() => setCancelBatch(null)}
                    onConfirm={handleCancelBatch}
                />
            )}

            {deleteBatch && (
                <ConfirmDialog
                    title="删除批次"
                    message={`确定删除批次「${deleteBatch.batchNo}」吗？`}
                    onClose={() => setDeleteBatch(null)}
                    onConfirm={handleDeleteBatch}
                />
            )}

        </div>
    );
}
