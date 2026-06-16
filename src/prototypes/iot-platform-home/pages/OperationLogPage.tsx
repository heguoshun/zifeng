import React, { useEffect, useMemo, useState } from 'react';
import { Search, Upload } from 'lucide-react';
import AppShell from '../components/AppShell';
import OmManagementSidebar, { type OmManagementPageId } from '../components/OmManagementSidebar';
import ElSelect from '../components/ElSelect';
import ElDateRangePicker from '../components/ElDateRangePicker';
import ListPagination from '../components/ListPagination';
import OperationLogDetailDrawer from '../components/OperationLogDetailDrawer';
import IotToast, { type IotToastData, type IotToastType, triggerIotToast } from '../components/IotToast';
import {
    OPERATION_LOG_STATUS_OPTIONS,
    OPERATION_LOG_TYPE_OPTIONS,
    type OperationLogRecord,
    type OperationLogStatus,
} from '../data/operationLogs';
import { paginateItems } from '../utils/listPagination';
import '../device-access.css';
import '../product-management.css';
import '../work-order-management.css';
import '../log-management.css';

type FilterState = {
    module: string;
    operator: string;
    operationType: string;
    status: string;
    startTime: string;
    endTime: string;
};

const DEFAULT_FILTERS: FilterState = {
    module: '',
    operator: '',
    operationType: '全部',
    status: '全部',
    startTime: '',
    endTime: '',
};

const TYPE_OPTIONS = OPERATION_LOG_TYPE_OPTIONS.map((item) => ({
    label: item,
    value: item,
}));

const STATUS_OPTIONS = OPERATION_LOG_STATUS_OPTIONS.map((item) => ({
    label: item,
    value: item,
}));

function OperationStatusTag({ status }: { status: OperationLogStatus }) {
    const className = status === '成功' ? 'log-status-tag--success' : 'log-status-tag--fail';
    return <span className={`log-status-tag ${className}`}>{status}</span>;
}

type OperationLogPageProps = {
    operationLogs: OperationLogRecord[];
    onNavigateHome: () => void;
    onNavigateDeviceAccess: () => void;
    onNavigateMessageCenter: () => void;
    onNavigate: (pageId: OmManagementPageId) => void;
};

export default function OperationLogPage({
    operationLogs,
    onNavigateHome,
    onNavigateDeviceAccess,
    onNavigateMessageCenter,
    onNavigate,
}: OperationLogPageProps) {
    const [draftFilters, setDraftFilters] = useState<FilterState>(DEFAULT_FILTERS);
    const [appliedFilters, setAppliedFilters] = useState<FilterState>(DEFAULT_FILTERS);
    const [pageSize, setPageSize] = useState('10');
    const [currentPage, setCurrentPage] = useState(1);
    const [jumpPage, setJumpPage] = useState('1');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [detailRecord, setDetailRecord] = useState<OperationLogRecord | null>(null);
    const [toast, setToast] = useState<IotToastData | null>(null);

    const showToast = (message: string, type: IotToastType = 'success') => {
        triggerIotToast(setToast, message, type);
    };

    const filteredLogs = useMemo(() => operationLogs.filter((item) => {
        if (appliedFilters.module.trim() && !item.module.includes(appliedFilters.module.trim())) {
            return false;
        }
        if (appliedFilters.operator.trim() && !item.operator.includes(appliedFilters.operator.trim())) {
            return false;
        }
        if (appliedFilters.operationType !== '全部' && item.operationType !== appliedFilters.operationType) {
            return false;
        }
        if (appliedFilters.status !== '全部' && item.status !== appliedFilters.status) {
            return false;
        }
        if (appliedFilters.startTime || appliedFilters.endTime) {
            const operationDate = item.operationTime.split(' ')[0];
            if (appliedFilters.startTime && operationDate < appliedFilters.startTime) return false;
            if (appliedFilters.endTime && operationDate > appliedFilters.endTime) return false;
        }
        return true;
    }), [appliedFilters, operationLogs]);

    const pagination = useMemo(
        () => paginateItems(filteredLogs, currentPage, Number(pageSize)),
        [currentPage, filteredLogs, pageSize],
    );

    const pageIds = pagination.items.map((item) => item.id);
    const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));

    useEffect(() => {
        setCurrentPage(1);
        setJumpPage('1');
    }, [appliedFilters, pageSize]);

    useEffect(() => {
        setJumpPage(String(pagination.currentPage));
    }, [pagination.currentPage]);

    const updateDraft = (patch: Partial<FilterState>) => {
        setDraftFilters((prev) => ({ ...prev, ...patch }));
    };

    const handleSearch = () => {
        setAppliedFilters(draftFilters);
        setCurrentPage(1);
        setJumpPage('1');
    };

    const handleReset = () => {
        setDraftFilters(DEFAULT_FILTERS);
        setAppliedFilters(DEFAULT_FILTERS);
        setCurrentPage(1);
        setJumpPage('1');
    };

    const toggleSelectAll = () => {
        if (allPageSelected) {
            setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
            return;
        }
        setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    };

    const toggleSelect = (id: string) => {
        setSelectedIds((prev) => (
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        ));
    };

    const handleExport = () => {
        const count = selectedIds.length || filteredLogs.length;
        showToast(`已提交 ${count} 条操作日志导出任务`);
    };

    const sidebar = <OmManagementSidebar pageId="operation-log" onNavigate={onNavigate} />;

    return (
        <AppShell
            activeTopTab="运维管理"
            sidebar={sidebar}
            onNavigateOmManagement={() => onNavigate('work-order-management')}
            onNavigateMessageCenter={onNavigateMessageCenter}
            onTopTabChange={(tab) => {
                if (tab === '设备接入') onNavigateDeviceAccess();
            }}
        >
            <div className="pm-page log-page">
                <div className="crumb">运维管理 / 日志管理 / 操作日志</div>

                <section className="panel pm-filter-panel">
                    <div className="log-filter-row">
                        <label className="pm-filter-field">
                            <span className="pm-filter-label">系统模块</span>
                            <input
                                type="text"
                                className="pm-filter-input"
                                placeholder="请输入系统模块"
                                value={draftFilters.module}
                                onChange={(event) => updateDraft({ module: event.target.value })}
                            />
                        </label>
                        <label className="pm-filter-field">
                            <span className="pm-filter-label">操作人员</span>
                            <input
                                type="text"
                                className="pm-filter-input"
                                placeholder="请输入操作人员"
                                value={draftFilters.operator}
                                onChange={(event) => updateDraft({ operator: event.target.value })}
                            />
                        </label>
                        <label className="pm-filter-field">
                            <span className="pm-filter-label">操作类型</span>
                            <ElSelect
                                className="el-select--medium"
                                size="medium"
                                value={draftFilters.operationType}
                                options={TYPE_OPTIONS}
                                onChange={(value) => updateDraft({ operationType: value })}
                            />
                        </label>
                        <label className="pm-filter-field">
                            <span className="pm-filter-label">状态</span>
                            <ElSelect
                                className="el-select--medium"
                                size="medium"
                                value={draftFilters.status}
                                options={STATUS_OPTIONS}
                                onChange={(value) => updateDraft({ status: value })}
                            />
                        </label>
                        <label className="pm-filter-field">
                            <span className="pm-filter-label">操作时间</span>
                            <ElDateRangePicker
                                size="medium"
                                start={draftFilters.startTime}
                                end={draftFilters.endTime}
                                onChange={(range) => updateDraft({
                                    startTime: range.start,
                                    endTime: range.end,
                                })}
                            />
                        </label>
                        <div className="pm-filter-actions">
                            <button type="button" className="pm-btn pm-btn-primary" onClick={handleSearch}>
                                <Search size={14} />
                                查询
                            </button>
                            <button type="button" className="pm-btn pm-btn-ghost" onClick={handleReset}>
                                重置
                            </button>
                        </div>
                    </div>
                </section>

                <section className="panel pm-list-panel">
                    <div className="pm-section-head">
                        <h3>操作日志</h3>
                        <button type="button" className="pm-btn pm-btn-ghost" onClick={handleExport}>
                            <Upload size={14} />
                            导出
                        </button>
                    </div>

                    <div className="pm-table-wrap">
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
                                    <th>日志编号</th>
                                    <th>系统模块</th>
                                    <th>操作类型</th>
                                    <th>请求方式</th>
                                    <th>操作人员</th>
                                    <th>主机</th>
                                    <th>操作状态</th>
                                    <th>操作时间</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pagination.items.map((item, index) => (
                                    <tr key={item.id}>
                                        <td>
                                            <input
                                                type="checkbox"
                                                aria-label={`选择 ${item.id}`}
                                                checked={selectedIds.includes(item.id)}
                                                onChange={() => toggleSelect(item.id)}
                                            />
                                        </td>
                                        <td>{(pagination.currentPage - 1) * Number(pageSize) + index + 1}</td>
                                        <td>{item.id}</td>
                                        <td>{item.module}</td>
                                        <td>{item.operationType}</td>
                                        <td>{item.requestMethod}</td>
                                        <td>{item.operator}</td>
                                        <td>{item.host}</td>
                                        <td><OperationStatusTag status={item.status} /></td>
                                        <td>{item.operationTime}</td>
                                        <td>
                                            <div className="log-table-actions">
                                                <button type="button" onClick={() => setDetailRecord(item)}>
                                                    详情
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
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
            </div>

            <OperationLogDetailDrawer
                open={detailRecord !== null}
                record={detailRecord}
                onClose={() => setDetailRecord(null)}
            />
            <IotToast toast={toast} />
        </AppShell>
    );
}
