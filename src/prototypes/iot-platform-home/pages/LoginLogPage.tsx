import React, { useEffect, useMemo, useState } from 'react';
import { Search, Upload } from 'lucide-react';
import AppShell from '../components/AppShell';
import Breadcrumb from '../components/Breadcrumb';
import SystemManagementSidebar, { type SystemManagementPageId } from '../components/SystemManagementSidebar';
import ElSelect from '../components/ElSelect';
import ElDateRangePicker from '../components/ElDateRangePicker';
import ListPagination from '../components/ListPagination';
import IotToast, { type IotToastData, type IotToastType, triggerIotToast } from '../components/IotToast';
import {
    LOGIN_LOG_STATUS_OPTIONS,
    type LoginLogRecord,
    type LoginLogStatus,
} from '../data/loginLogs';
import { paginateItems, DEFAULT_LIST_PAGE_SIZE } from '../utils/listPagination';
import { handleSelectableRowClick } from '../../../common/selectableRow';
import '../device-access.css';
import '../product-management.css';
import '../work-order-management.css';
import '../log-management.css';
import ClearableInput from '../components/ClearableInput';

type FilterState = {
    address: string;
    username: string;
    status: string;
    startTime: string;
    endTime: string;
};

const DEFAULT_FILTERS: FilterState = {
    address: '',
    username: '',
    status: '全部',
    startTime: '',
    endTime: '',
};

const STATUS_OPTIONS = LOGIN_LOG_STATUS_OPTIONS.map((item) => ({
    label: item,
    value: item,
}));

function LoginStatusTag({ status }: { status: LoginLogStatus }) {
    const className = status === '成功' ? 'log-status-tag--success' : 'log-status-tag--fail';
    return <span className={`log-status-tag ${className}`}>{status}</span>;
}

type LoginLogPageProps = {
    loginLogs: LoginLogRecord[];
    onNavigateHome: () => void;
    onNavigateDeviceAccess: () => void;
    onNavigateMessageCenter: () => void;
    onNavigateSystemManagement: () => void;
    onNavigate: (pageId: SystemManagementPageId) => void;
};

export default function LoginLogPage({
    loginLogs,
    onNavigateHome,
    onNavigateDeviceAccess,
    onNavigateMessageCenter,
    onNavigateSystemManagement,
    onNavigate,
}: LoginLogPageProps) {
    const [draftFilters, setDraftFilters] = useState<FilterState>(DEFAULT_FILTERS);
    const [appliedFilters, setAppliedFilters] = useState<FilterState>(DEFAULT_FILTERS);
    const [pageSize, setPageSize] = useState('20');
    const [currentPage, setCurrentPage] = useState(1);
    const [jumpPage, setJumpPage] = useState('1');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [toast, setToast] = useState<IotToastData | null>(null);

    const showToast = (message: string, type: IotToastType = 'success') => {
        triggerIotToast(setToast, message, type);
    };

    const filteredLogs = useMemo(() => loginLogs.filter((item) => {
        if (appliedFilters.address.trim() && !item.address.includes(appliedFilters.address.trim())) {
            return false;
        }
        if (appliedFilters.username.trim() && !item.username.includes(appliedFilters.username.trim())) {
            return false;
        }
        if (appliedFilters.status !== '全部' && item.status !== appliedFilters.status) {
            return false;
        }
        if (appliedFilters.startTime || appliedFilters.endTime) {
            const accessDate = item.accessTime.split(' ')[0];
            if (appliedFilters.startTime && accessDate < appliedFilters.startTime) return false;
            if (appliedFilters.endTime && accessDate > appliedFilters.endTime) return false;
        }
        return true;
    }), [appliedFilters, loginLogs]);

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
        showToast(`已提交 ${count} 条登录日志导出任务`);
    };

    const sidebar = <SystemManagementSidebar pageId="login-log" onNavigate={onNavigate} />;

    return (
        <AppShell
            activeTopTab="系统管理"
            sidebar={sidebar}
            onNavigateMessageCenter={onNavigateMessageCenter}
            onNavigateSystemManagement={onNavigateSystemManagement}
            onTopTabChange={(tab) => {
                if (tab === '设备接入') onNavigateDeviceAccess();
            }}
        >
            <div className="pm-page log-page">
                <Breadcrumb items={[
                                    { label: '系统管理', pageId: 'tenant-mgmt' },
                                    { label: '登录日志' },
                                ]} onNavigate={(id) => onNavigate(id as SystemManagementPageId)} />

                <section className="panel pm-filter-panel">
                    <div className="log-filter-row">
                        <div className="pm-filter-field">
                            <span className="pm-filter-label">登录地址</span>
                            <ClearableInput
                                type="text"
                                className="pm-filter-input"
                                placeholder="请输入登录地址"
                                value={draftFilters.address}
                                onChange={(event) => updateDraft({ address: event.target.value })}
                            />
                        </div>
                        <div className="pm-filter-field">
                            <span className="pm-filter-label">用户名称</span>
                            <ClearableInput
                                type="text"
                                className="pm-filter-input"
                                placeholder="请输入用户名称"
                                value={draftFilters.username}
                                onChange={(event) => updateDraft({ username: event.target.value })}
                            />
                        </div>
                        <div className="pm-filter-field">
                            <span className="pm-filter-label">状态</span>
                            <ElSelect
                                className="el-select--medium"
                                size="medium"
                                value={draftFilters.status}
                                options={STATUS_OPTIONS}
                                onChange={(value) => updateDraft({ status: value })}
                            />
                        </div>
                        <div className="pm-filter-field">
                            <span className="pm-filter-label">访问时间</span>
                            <ElDateRangePicker
                                size="medium"
                                start={draftFilters.startTime}
                                end={draftFilters.endTime}
                                onChange={(range) => updateDraft({
                                    startTime: range.start,
                                    endTime: range.end,
                                })}
                            />
                        </div>
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
                        <h3>登录日志</h3>
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
                                    <th>用户名称</th>
                                    <th>地址</th>
                                    <th>登录状态</th>
                                    <th>操作系统</th>
                                    <th>访问时间</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pagination.items.map((item, index) => (
                                    <tr
                                        key={item.id}
                                        className="iot-selectable-row"
                                        onClick={(event) => handleSelectableRowClick(event, () => toggleSelect(item.id))}
                                    >
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
                                        <td>{item.username}</td>
                                        <td>{item.address}</td>
                                        <td><LoginStatusTag status={item.status} /></td>
                                        <td className="log-os-cell" title={item.operatingSystem}>{item.operatingSystem}</td>
                                        <td>{item.accessTime}</td>
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

            <IotToast toast={toast} />
        </AppShell>
    );
}
