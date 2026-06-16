import React, { useEffect, useMemo, useState } from 'react';
import { Search, Upload } from 'lucide-react';
import AppShell from '../components/AppShell';
import DeviceAccessSidebar, { type DeviceAccessPageId } from '../components/DeviceAccessSidebar';
import ElSelect from '../components/ElSelect';
import ElDateRangePicker from '../components/ElDateRangePicker';
import ListPagination from '../components/ListPagination';
import DeviceLogDetailDrawer from '../components/DeviceLogDetailDrawer';
import DeviceLogStatusCode from '../components/DeviceLogStatusCode';
import IotToast, { type IotToastData, type IotToastType, triggerIotToast } from '../components/IotToast';
import {
    DEVICE_LOG_PRODUCT_OPTIONS,
    DEVICE_LOG_BIZ_TYPE_OPTIONS,
    DEVICE_LOG_STATUS_OPTIONS,
    type DeviceLogRecord,
} from '../data/deviceLogs';
import { paginateItems } from '../utils/listPagination';
import '../device-access.css';
import '../product-management.css';
import '../work-order-management.css';
import '../log-management.css';
import '../device-log.css';

type FilterState = {
    productName: string;
    bizType: string;
    status: string;
    startTime: string;
    endTime: string;
};

const DEFAULT_FILTERS: FilterState = {
    productName: '全部',
    bizType: '全部',
    status: '全部',
    startTime: '',
    endTime: '',
};

const PRODUCT_OPTIONS = DEVICE_LOG_PRODUCT_OPTIONS.map((item) => ({ label: item, value: item }));
const BIZ_TYPE_OPTIONS = DEVICE_LOG_BIZ_TYPE_OPTIONS.map((item) => ({ label: item, value: item }));
const STATUS_OPTIONS = DEVICE_LOG_STATUS_OPTIONS.map((item) => ({ label: item, value: item }));

type DeviceLogPageProps = {
    deviceLogs: DeviceLogRecord[];
    onNavigateHome: () => void;
    onNavigateDeviceAccess: () => void;
    onNavigateMessageCenter: () => void;
    onNavigate: (pageId: DeviceAccessPageId) => void;
    onNavigateOmManagement: () => void;
};

export default function DeviceLogPage({
    deviceLogs,
    onNavigateHome,
    onNavigateDeviceAccess,
    onNavigateMessageCenter,
    onNavigate,
    onNavigateOmManagement,
}: DeviceLogPageProps) {
    const [draftFilters, setDraftFilters] = useState<FilterState>(DEFAULT_FILTERS);
    const [appliedFilters, setAppliedFilters] = useState<FilterState>(DEFAULT_FILTERS);
    const [pageSize, setPageSize] = useState('10');
    const [currentPage, setCurrentPage] = useState(1);
    const [jumpPage, setJumpPage] = useState('1');
    const [detailRecord, setDetailRecord] = useState<DeviceLogRecord | null>(null);
    const [toast, setToast] = useState<IotToastData | null>(null);

    const showToast = (message: string, type: IotToastType = 'success') => {
        triggerIotToast(setToast, message, type);
    };

    const filteredLogs = useMemo(() => deviceLogs.filter((item) => {
        if (appliedFilters.productName !== '全部' && item.productName !== appliedFilters.productName) {
            return false;
        }
        if (appliedFilters.bizType !== '全部' && item.bizType !== appliedFilters.bizType) {
            return false;
        }
        if (appliedFilters.status !== '全部' && String(item.statusCode) !== appliedFilters.status) {
            return false;
        }
        if (appliedFilters.startTime || appliedFilters.endTime) {
            const logDate = item.eventTime.split(' ')[0];
            if (appliedFilters.startTime && logDate < appliedFilters.startTime) return false;
            if (appliedFilters.endTime && logDate > appliedFilters.endTime) return false;
        }
        return true;
    }), [appliedFilters, deviceLogs]);

    const pagination = useMemo(
        () => paginateItems(filteredLogs, currentPage, Number(pageSize)),
        [currentPage, filteredLogs, pageSize],
    );

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

    const handleExport = () => {
        showToast(`已提交 ${filteredLogs.length} 条设备日志导出任务`);
    };

    const sidebar = <DeviceAccessSidebar pageId="device-log" onNavigate={onNavigate} />;

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
            <div className="pm-page log-page">
                <div className="crumb">设备接入 / 设备运维 / 设备日志</div>

                <section className="panel pm-filter-panel">
                    <div className="log-filter-row">
                        <label className="pm-filter-field">
                            <span className="pm-filter-label">所属产品</span>
                            <ElSelect
                                className="el-select--medium"
                                size="medium"
                                value={draftFilters.productName}
                                options={PRODUCT_OPTIONS}
                                onChange={(value) => updateDraft({ productName: value })}
                            />
                        </label>
                        <label className="pm-filter-field">
                            <span className="pm-filter-label">业务类型</span>
                            <ElSelect
                                className="el-select--medium"
                                size="medium"
                                value={draftFilters.bizType}
                                options={BIZ_TYPE_OPTIONS}
                                onChange={(value) => updateDraft({ bizType: value })}
                            />
                        </label>
                        <label className="pm-filter-field">
                            <span className="pm-filter-label">日志状态</span>
                            <ElSelect
                                className="el-select--medium"
                                size="medium"
                                value={draftFilters.status}
                                options={STATUS_OPTIONS}
                                onChange={(value) => updateDraft({ status: value })}
                            />
                        </label>
                        <label className="pm-filter-field">
                            <span className="pm-filter-label">日志时间</span>
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
                        <h3>设备日志</h3>
                        <button type="button" className="pm-btn pm-btn-ghost" onClick={handleExport}>
                            <Upload size={14} />
                            导出
                        </button>
                    </div>

                    <div className="pm-table-wrap">
                        <table className="pm-table">
                            <thead>
                                <tr>
                                    <th>日志时间</th>
                                    <th>设备编号</th>
                                    <th>设备名称</th>
                                    <th>所属产品</th>
                                    <th>消息ID</th>
                                    <th>业务类型</th>
                                    <th>日志状态</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pagination.items.map((item) => (
                                    <tr key={item.id}>
                                        <td>{item.eventTime}</td>
                                        <td>{item.deviceCode}</td>
                                        <td>{item.deviceName}</td>
                                        <td>{item.productName}</td>
                                        <td className="device-log-msg-id" title={item.messageId}>{item.messageId}</td>
                                        <td>{item.bizType}</td>
                                        <td><DeviceLogStatusCode code={item.statusCode} /></td>
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

            <DeviceLogDetailDrawer
                open={detailRecord !== null}
                record={detailRecord}
                onClose={() => setDetailRecord(null)}
            />
            <IotToast toast={toast} />
        </AppShell>
    );
}
