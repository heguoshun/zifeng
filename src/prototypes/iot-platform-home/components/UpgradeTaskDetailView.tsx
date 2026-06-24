import React, { useEffect, useMemo, useState } from 'react';
import {
    ArrowLeft,
    FileUp,
    Search,
    Clock,
    Loader2,
    CheckCircle2,
    XCircle,
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

    const batches = useMemo(
        () => mergePackageBatches(record.id, 'firmware', record.version, upgradeTasks, upgradeBatches)
            .filter((item) => !hiddenBatchIds.includes(item.id))
            .map((item) => batchOverrides[item.id] ?? item),
        [record.id, record.version, upgradeTasks, upgradeBatches, hiddenBatchIds, batchOverrides],
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
        <>
            <button type="button" className="ru-task-detail-back" onClick={onBack}>
                <ArrowLeft size={15} />
                返回列表
            </button>

            {/* ── Firmware info + upgrade stats (unified card) ── */}
            <section className="ru-task-detail-head panel">
                <div className="ru-detail-header">
                    <div className="ru-detail-header__icon">
                        <FileUp size={24} strokeWidth={1.5} />
                    </div>
                    <div className="ru-detail-header__body">
                        <h2 className="ru-detail-header__title">{record.name}</h2>
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

            {/* ── Batch list ── */}
            <section className="panel pm-list-panel ru-task-batch-panel">
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
                                <th>升级方式</th>
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
                                    <td>{batch.scheduleType}</td>
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
                                    <td colSpan={8} className="pc-empty-cell">暂无任务批次</td>
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
            </section>

            <UpgradeDeviceDetailDrawer
                open={Boolean(viewBatch)}
                batch={viewBatch}
                deviceDetails={deviceDetails}
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
        </>
    );
}
