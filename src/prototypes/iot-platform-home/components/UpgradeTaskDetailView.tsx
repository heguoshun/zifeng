import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Search } from 'lucide-react';
import ListPagination from './ListPagination';
import UpgradeDeviceDetailDrawer from './UpgradeDeviceDetailDrawer';
import { ConfirmDialog } from './IotDialogs';
import {
    mergePackageBatches,
    type FirmwarePackageRecord,
    type PackageUpgradeStats,
    type SoftwarePackageRecord,
    type UpgradeDeviceDetailRecord,
    type UpgradePackageKind,
    type UpgradeTaskBatchRecord,
    type UpgradeTaskRecord,
} from '../data/remoteUpgrade';
import { paginateItems } from '../utils/listPagination';
import '../remote-upgrade.css';

type UpgradeTaskDetailViewProps = {
    kind: UpgradePackageKind;
    record: FirmwarePackageRecord | SoftwarePackageRecord;
    upgradeTasks: UpgradeTaskRecord[];
    upgradeBatches: UpgradeTaskBatchRecord[];
    deviceDetails: UpgradeDeviceDetailRecord[];
    onBack: () => void;
    onToast: (message: string) => void;
};

function BatchStatusCell({ status }: { status: UpgradeTaskBatchRecord['status'] }) {
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
    kind,
    record,
    upgradeTasks,
    upgradeBatches,
    deviceDetails,
    onBack,
    onToast,
}: UpgradeTaskDetailViewProps) {
    const packageLabel = kind === 'firmware' ? '固件' : '软件';
    const [draftKeyword, setDraftKeyword] = useState('');
    const [keyword, setKeyword] = useState('');
    const [pageSize, setPageSize] = useState('10');
    const [currentPage, setCurrentPage] = useState(1);
    const [jumpPage, setJumpPage] = useState('1');
    const [viewBatch, setViewBatch] = useState<UpgradeTaskBatchRecord | null>(null);
    const [cancelBatch, setCancelBatch] = useState<UpgradeTaskBatchRecord | null>(null);
    const [deleteBatch, setDeleteBatch] = useState<UpgradeTaskBatchRecord | null>(null);
    const [batchOverrides, setBatchOverrides] = useState<Record<string, UpgradeTaskBatchRecord>>({});
    const [hiddenBatchIds, setHiddenBatchIds] = useState<string[]>([]);

    const batches = useMemo(
        () => mergePackageBatches(record.id, kind, record.version, upgradeTasks, upgradeBatches)
            .filter((item) => !hiddenBatchIds.includes(item.id))
            .map((item) => batchOverrides[item.id] ?? item),
        [record.id, kind, record.version, upgradeTasks, upgradeBatches, hiddenBatchIds, batchOverrides],
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
    const firmwareRecord = kind === 'firmware' ? (record as FirmwarePackageRecord) : null;

    const handleCancelBatch = () => {
        if (!cancelBatch) return;
        setBatchOverrides((prev) => ({
            ...prev,
            [cancelBatch.id]: { ...cancelBatch, status: '未开始' },
        }));
        setCancelBatch(null);
        onToast('批次已取消');
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
                <ArrowLeft size={16} />
                返回列表
            </button>

            <section className="ru-task-detail-head panel">
                <h2 className="ru-task-detail-title">{record.name}</h2>
                <dl className="ru-task-detail-meta">
                    {kind === 'firmware' && firmwareRecord && (
                        <div>
                            <dt>{packageLabel}包类型</dt>
                            <dd>{firmwareRecord.type}</dd>
                        </div>
                    )}
                    <div>
                        <dt>所属产品</dt>
                        <dd>{record.productName}</dd>
                    </div>
                    <div>
                        <dt>{packageLabel}版本号</dt>
                        <dd>{record.version}</dd>
                    </div>
                    <div className="ru-task-detail-meta__desc">
                        <dt>{packageLabel}描述</dt>
                        <dd>{description}</dd>
                    </div>
                </dl>
            </section>

            <section className="ru-task-detail-stats panel">
                <div className="ru-stat-card">
                    <strong>{DEFAULT_STATS.pending}</strong>
                    <span>待升级设备</span>
                </div>
                <div className="ru-stat-card">
                    <strong>{DEFAULT_STATS.upgrading}</strong>
                    <span>升级中</span>
                </div>
                <div className="ru-stat-card">
                    <strong>{DEFAULT_STATS.success}</strong>
                    <span>升级成功</span>
                </div>
                <div className="ru-stat-card">
                    <strong>{DEFAULT_STATS.failed}</strong>
                    <span>升级失败</span>
                </div>
            </section>

            <section className="panel pm-list-panel ru-task-batch-panel">
                <div className="pm-section-head">
                    <h3>任务批次列表</h3>
                </div>

                <div className="pm-filter-panel" style={{ boxShadow: 'none', border: 0, padding: '0 0 12px' }}>
                    <div className="ru-search-row">
                        <input
                            type="text"
                            className="pm-filter-input ru-batch-search-input"
                            placeholder="请输入批次ID"
                            value={draftKeyword}
                            onChange={(event) => setDraftKeyword(event.target.value)}
                        />
                        <button
                            type="button"
                            className="pm-btn pm-btn-primary"
                            onClick={() => {
                                setKeyword(draftKeyword);
                                setCurrentPage(1);
                                setJumpPage('1');
                            }}
                        >
                            <Search size={14} />
                            查询
                        </button>
                    </div>
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
                            {pagination.items.map((batch) => (
                                <tr key={batch.id}>
                                    <td>{batch.batchNo}</td>
                                    <td><BatchStatusCell status={batch.status} /></td>
                                    <td>{batch.versionBefore}</td>
                                    <td>{batch.versionAfter}</td>
                                    <td>{batch.deviceCount}</td>
                                    <td>{batch.scheduleType}</td>
                                    <td>{batch.upgradeTime}</td>
                                    <td>
                                        <div className="pm-table-actions">
                                            <button
                                                type="button"
                                                disabled={batch.status === '已完成'}
                                                onClick={() => setCancelBatch(batch)}
                                            >
                                                取消
                                            </button>
                                            <button type="button" onClick={() => setViewBatch(batch)}>查看</button>
                                            <button type="button" onClick={() => setDeleteBatch(batch)}>删除</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
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
                    title="取消批次"
                    message={`确定取消批次「${cancelBatch.batchNo}」吗？`}
                    drawerClassName="dcp-group-dialog ru-drawer"
                    onClose={() => setCancelBatch(null)}
                    onConfirm={handleCancelBatch}
                />
            )}

            {deleteBatch && (
                <ConfirmDialog
                    title="删除批次"
                    message={`确定删除批次「${deleteBatch.batchNo}」吗？`}
                    drawerClassName="dcp-group-dialog ru-drawer"
                    onClose={() => setDeleteBatch(null)}
                    onConfirm={handleDeleteBatch}
                />
            )}
        </>
    );
}
