import React, { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import ElSelect from './ElSelect';
import ElDateRangePicker from './ElDateRangePicker';
import ListPagination from './ListPagination';
import LogDetailDrawer from './LogDetailDrawer';
import {
    createInitialPropertyLogs,
    createInitialFunctionLogs,
    createInitialEventLogs,
    EVENT_LOG_TYPE_OPTIONS,
    type PropertyLogRecord,
    type FunctionLogRecord,
    type EventLogRecord,
} from '../data/deviceLogManagement';
import { paginateItems, DEFAULT_LIST_PAGE_SIZE } from '../utils/listPagination';
import type { DeviceRecord } from '../data/devices';
import type { IotToastType } from './IotToast';
import '../log-management.css';
import '../device-log.css';
import '../device-log-management.css';
import ClearableInput from './ClearableInput';

type LogTab = 'property' | 'function' | 'event';

type PropertyFilter = {
    startTime: string;
    endTime: string;
};

type FunctionFilter = {
    identifier: string;
    startTime: string;
    endTime: string;
};

type EventFilter = {
    identifier: string;
    logType: string;
};

const PROPERTY_FILTER_DEFAULT: PropertyFilter = { startTime: '', endTime: '' };
const FUNCTION_FILTER_DEFAULT: FunctionFilter = { identifier: '', startTime: '', endTime: '' };
const EVENT_FILTER_DEFAULT: EventFilter = { identifier: '', logType: '全部' };

const EVENT_TYPE_OPTIONS = EVENT_LOG_TYPE_OPTIONS.map((item) => ({ label: item, value: item }));

type DetailState =
    | { kind: 'property'; record: PropertyLogRecord }
    | { kind: 'function'; record: FunctionLogRecord }
    | { kind: 'event'; record: EventLogRecord }
    | null;

type DeviceLogManagementPanelProps = {
    device: DeviceRecord | null;
    readonly?: boolean;
    onShowToast: (message: string, type?: IotToastType) => void;
};

export default function DeviceLogManagementPanel({
    device,
    readonly = false,
    onShowToast,
}: DeviceLogManagementPanelProps) {
    const [activeTab, setActiveTab] = useState<LogTab>('property');

    /* ── Lazy-init log data ── */
    const [propertyLogs] = useState(createInitialPropertyLogs);
    const [functionLogs] = useState(createInitialFunctionLogs);
    const [eventLogs] = useState(createInitialEventLogs);

    /* ── Property filters ── */
    const [propertyDraft, setPropertyDraft] = useState<PropertyFilter>(PROPERTY_FILTER_DEFAULT);
    const [propertyApplied, setPropertyApplied] = useState<PropertyFilter>(PROPERTY_FILTER_DEFAULT);

    /* ── Function filters ── */
    const [functionDraft, setFunctionDraft] = useState<FunctionFilter>(FUNCTION_FILTER_DEFAULT);
    const [functionApplied, setFunctionApplied] = useState<FunctionFilter>(FUNCTION_FILTER_DEFAULT);

    /* ── Event filters ── */
    const [eventDraft, setEventDraft] = useState<EventFilter>(EVENT_FILTER_DEFAULT);
    const [eventApplied, setEventApplied] = useState<EventFilter>(EVENT_FILTER_DEFAULT);

    /* ── Pagination ── */
    const [pageSize, setPageSize] = useState('20');
    const [currentPage, setCurrentPage] = useState(1);
    const [jumpPage, setJumpPage] = useState('1');

    /* ── Detail drawer ── */
    const [detail, setDetail] = useState<DetailState>(null);

    /* ── Filtered data ── */
    const filteredPropertyLogs = useMemo(() => propertyLogs.filter((item) => {
        if (propertyApplied.startTime || propertyApplied.endTime) {
            const logDate = item.time.split(' ')[0];
            if (propertyApplied.startTime && logDate < propertyApplied.startTime) return false;
            if (propertyApplied.endTime && logDate > propertyApplied.endTime) return false;
        }
        return true;
    }), [propertyApplied, propertyLogs]);

    const filteredFunctionLogs = useMemo(() => functionLogs.filter((item) => {
        if (functionApplied.identifier && !item.functionIdentifier.includes(functionApplied.identifier)) {
            return false;
        }
        if (functionApplied.startTime || functionApplied.endTime) {
            const logDate = item.sendTime.split(' ')[0];
            if (functionApplied.startTime && logDate < functionApplied.startTime) return false;
            if (functionApplied.endTime && logDate > functionApplied.endTime) return false;
        }
        return true;
    }), [functionApplied, functionLogs]);

    const filteredEventLogs = useMemo(() => eventLogs.filter((item) => {
        if (eventApplied.identifier && !item.identifier.includes(eventApplied.identifier)) {
            return false;
        }
        if (eventApplied.logType !== '全部' && item.logType !== eventApplied.logType) {
            return false;
        }
        return true;
    }), [eventApplied, eventLogs]);

    const activeData = activeTab === 'property'
        ? filteredPropertyLogs
        : activeTab === 'function'
            ? filteredFunctionLogs
            : filteredEventLogs;

    const pagination = useMemo(
        () => paginateItems(activeData, currentPage, Number(pageSize)),
        [currentPage, activeData, pageSize],
    );

    useEffect(() => {
        setCurrentPage(1);
        setJumpPage('1');
    }, [activeTab, propertyApplied, functionApplied, eventApplied, pageSize]);

    useEffect(() => {
        setJumpPage(String(pagination.currentPage));
    }, [pagination.currentPage]);

    /* ── Handlers ── */
    const handlePropertySearch = () => { setPropertyApplied(propertyDraft); };
    const handlePropertyReset = () => {
        setPropertyDraft(PROPERTY_FILTER_DEFAULT);
        setPropertyApplied(PROPERTY_FILTER_DEFAULT);
    };

    const handleFunctionSearch = () => { setFunctionApplied(functionDraft); };
    const handleFunctionReset = () => {
        setFunctionDraft(FUNCTION_FILTER_DEFAULT);
        setFunctionApplied(FUNCTION_FILTER_DEFAULT);
    };

    const handleEventSearch = () => { setEventApplied(eventDraft); };
    const handleEventReset = () => {
        setEventDraft(EVENT_FILTER_DEFAULT);
        setEventApplied(EVENT_FILTER_DEFAULT);
    };

    return (
        <section className="panel dcp-panel dlm-panel">
            {/* ── Sub-tabs ── */}
            <div className="pcp-model-tabs">
                <button
                    type="button"
                    className={activeTab === 'property' ? 'is-active' : ''}
                    onClick={() => setActiveTab('property')}
                >
                    属性日志
                </button>
                <button
                    type="button"
                    className={activeTab === 'function' ? 'is-active' : ''}
                    onClick={() => setActiveTab('function')}
                >
                    功能日志
                </button>
                <button
                    type="button"
                    className={activeTab === 'event' ? 'is-active' : ''}
                    onClick={() => setActiveTab('event')}
                >
                    事件日志
                </button>
            </div>

            {/* ── Filter bar ── */}
            <div className="dlm-filter-bar">
                {activeTab === 'property' && (
                    <>
                        <div className="dlm-filter-field">
                            <span className="dlm-filter-label">时间范围:</span>
                            <ElDateRangePicker
                                size="medium"
                                start={propertyDraft.startTime}
                                end={propertyDraft.endTime}
                                placeholder="开始日期 ~ 结束日期"
                                onChange={(range) => setPropertyDraft({
                                    startTime: range.start,
                                    endTime: range.end,
                                })}
                            />
                        </div>
                        <div className="dlm-filter-actions">
                            <button type="button" className="pm-btn pm-btn-primary" onClick={handlePropertySearch}>
                                <Search size={14} />
                                查询
                            </button>
                            <button type="button" className="pm-btn pm-btn-ghost" onClick={handlePropertyReset}>
                                重置
                            </button>
                        </div>
                    </>
                )}

                {activeTab === 'function' && (
                    <>
                        <label className="dlm-filter-field">
                            <span className="dlm-filter-label">标识符:</span>
                            <ClearableInput
                                className="dlm-filter-input"
                                type="text"
                                placeholder="输入标识符"
                                value={functionDraft.identifier}
                                onChange={(e) => setFunctionDraft((prev) => ({ ...prev, identifier: e.target.value }))}
                            />
                        </label>
                        <div className="dlm-filter-field">
                            <span className="dlm-filter-label">时间范围:</span>
                            <ElDateRangePicker
                                size="medium"
                                start={functionDraft.startTime}
                                end={functionDraft.endTime}
                                placeholder="开始日期 ~ 结束日期"
                                onChange={(range) => setFunctionDraft({
                                    ...functionDraft,
                                    startTime: range.start,
                                    endTime: range.end,
                                })}
                            />
                        </div>
                        <div className="dlm-filter-actions">
                            <button type="button" className="pm-btn pm-btn-primary" onClick={handleFunctionSearch}>
                                <Search size={14} />
                                查询
                            </button>
                            <button type="button" className="pm-btn pm-btn-ghost" onClick={handleFunctionReset}>
                                重置
                            </button>
                        </div>
                    </>
                )}

                {activeTab === 'event' && (
                    <>
                        <label className="dlm-filter-field">
                            <span className="dlm-filter-label">标识符:</span>
                            <ClearableInput
                                className="dlm-filter-input"
                                type="text"
                                placeholder="请输入标识符"
                                value={eventDraft.identifier}
                                onChange={(e) => setEventDraft((prev) => ({ ...prev, identifier: e.target.value }))}
                            />
                        </label>
                        <div className="dlm-filter-field">
                            <span className="dlm-filter-label">日志类型:</span>
                            <ElSelect
                                className="el-select--medium"
                                size="medium"
                                value={eventDraft.logType}
                                options={EVENT_TYPE_OPTIONS}
                                onChange={(value) => setEventDraft((prev) => ({ ...prev, logType: value }))}
                            />
                        </div>
                        <div className="dlm-filter-actions">
                            <button type="button" className="pm-btn pm-btn-primary" onClick={handleEventSearch}>
                                <Search size={14} />
                                查询
                            </button>
                            <button type="button" className="pm-btn pm-btn-ghost" onClick={handleEventReset}>
                                重置
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* ── Table ── */}
            <div className="dlm-table-wrap">
                <table className="pcp-table">
                    {activeTab === 'property' && (
                        <>
                            <thead>
                                <tr>
                                    <th style={{ width: 60 }}>序号</th>
                                    <th>类型</th>
                                    <th>时间</th>
                                    <th>内容</th>
                                    <th style={{ width: 80 }}>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pagination.items.length === 0 ? (
                                    <tr><td colSpan={5} className="pcp-empty-cell">暂无数据</td></tr>
                                ) : (
                                    (pagination.items as PropertyLogRecord[]).map((item, index) => (
                                        <tr key={item.id}>
                                            <td>{(pagination.currentPage - 1) * Number(pageSize) + index + 1}</td>
                                            <td>{item.type}</td>
                                            <td>{item.time}</td>
                                            <td>{item.content}</td>
                                            <td>
                                                <div className="log-table-actions">
                                                    <button type="button" onClick={() => setDetail({ kind: 'property', record: item })}>
                                                        查询
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </>
                    )}

                    {activeTab === 'function' && (
                        <>
                            <thead>
                                <tr>
                                    <th style={{ width: 60 }}>序号</th>
                                    <th>功能标识</th>
                                    <th>功能名称</th>
                                    <th>下发时间</th>
                                    <th>参数</th>
                                    <th>下发回复</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pagination.items.length === 0 ? (
                                    <tr><td colSpan={6} className="pcp-empty-cell">暂无数据</td></tr>
                                ) : (
                                    (pagination.items as FunctionLogRecord[]).map((item, index) => (
                                        <tr key={item.id}>
                                            <td>{(pagination.currentPage - 1) * Number(pageSize) + index + 1}</td>
                                            <td><code className="dlm-code">{item.functionIdentifier}</code></td>
                                            <td>{item.functionName}</td>
                                            <td>{item.sendTime}</td>
                                            <td><code className="dlm-code">{item.params}</code></td>
                                            <td>
                                                <span className={`dlm-reply ${item.reply === '1' ? 'dlm-reply--ok' : 'dlm-reply--fail'}`}>
                                                    {item.reply}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </>
                    )}

                    {activeTab === 'event' && (
                        <>
                            <thead>
                                <tr>
                                    <th style={{ width: 60 }}>序号</th>
                                    <th>类型</th>
                                    <th>时间</th>
                                    <th>内容</th>
                                    <th style={{ width: 80 }}>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pagination.items.length === 0 ? (
                                    <tr><td colSpan={5} className="pcp-empty-cell">暂无数据</td></tr>
                                ) : (
                                    (pagination.items as EventLogRecord[]).map((item, index) => (
                                        <tr key={item.id}>
                                            <td>{(pagination.currentPage - 1) * Number(pageSize) + index + 1}</td>
                                            <td>
                                                <span className={`dlm-event-tag dlm-event-tag--${item.type === '告警' ? 'warn' : item.type === '故障' ? 'fail' : 'info'}`}>
                                                    {item.type}
                                                </span>
                                            </td>
                                            <td>{item.time}</td>
                                            <td>{item.content}</td>
                                            <td>
                                                <div className="log-table-actions">
                                                    <button type="button" onClick={() => setDetail({ kind: 'event', record: item })}>
                                                        查询
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </>
                    )}
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

            <LogDetailDrawer
                open={detail !== null}
                detail={detail}
                onClose={() => setDetail(null)}
            />
        </section>
    );
}
