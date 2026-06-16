import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Search } from 'lucide-react';
import AppShell from '../components/AppShell';
import MessageCenterSidebar, { type MessageCenterPageId } from '../components/MessageCenterSidebar';
import ElSelect from '../components/ElSelect';
import ElTreeSelect from '../components/ElTreeSelect';
import ElDateRangePicker from '../components/ElDateRangePicker';
import ListPagination from '../components/ListPagination';
import AlarmDetailModal from '../components/AlarmDetailModal';
import ConvertWorkOrderModal, { type ConvertWorkOrderForm } from '../components/ConvertWorkOrderModal';
import IotToast, { type IotToastData, type IotToastType, triggerIotToast } from '../components/IotToast';
import { paginateItems } from '../utils/listPagination';
import {
    buildProductPickerTree,
    DEFAULT_PRODUCT_TREE_EXPANDED,
    itemMatchesProductFilter,
} from '../data/productCategories';
import {
    ALARM_LEVEL_OPTIONS,
    ALARM_PROCESS_METHOD_OPTIONS,
    ALARM_STATUS_OPTIONS,
    ALARM_TRIGGER_OPTIONS,
    resolveAlarmProductName,
    normalizeDeviceAlarm,
    resolveAlarmTriggerContent,
    type DeviceAlarmRecord,
} from '../data/deviceAlarms';
import { createWorkOrderFromAlarm, type WorkOrderRecord } from '../data/workOrders';
import type { ProductRecord } from '../data/products';
import '../device-access.css';
import '../product-management.css';
import '../device-alarm-info.css';

const LEVEL_OPTIONS = ALARM_LEVEL_OPTIONS.map((item) => ({ label: item, value: item }));
const STATUS_OPTIONS = ALARM_STATUS_OPTIONS.map((item) => ({ label: item, value: item }));
const TRIGGER_OPTIONS = ALARM_TRIGGER_OPTIONS.map((item) => ({ label: item, value: item }));
const PROCESS_METHOD_OPTIONS = ALARM_PROCESS_METHOD_OPTIONS.map((item) => ({ label: item, value: item }));

type FilterState = {
    level: string;
    product: string;
    status: string;
    triggerMethod: string;
    processMethod: string;
    startTime: string;
    endTime: string;
    keyword: string;
};

const DEFAULT_FILTERS: FilterState = {
    level: '全部',
    product: 'all',
    status: '全部',
    triggerMethod: '全部',
    processMethod: '全部',
    startTime: '',
    endTime: '',
    keyword: '',
};

function ReadStatusCell({ status }: { status: DeviceAlarmRecord['readStatus'] }) {
    return (
        <span>
            <i className={`dai-status-dot ${status === '未读' ? 'dai-status-dot--unread' : 'dai-status-dot--read'}`} />
            {status}
        </span>
    );
}


function AlarmLevelCell({ level }: { level: DeviceAlarmRecord['level'] }) {
    return <span className="dai-level-tag">{level}</span>;
}

function ProcessStatusCell({ status }: { status: DeviceAlarmRecord['processStatus'] }) {
    const statusClass = status === '未处理'
        ? 'dai-process-status--pending'
        : status === '处理中'
            ? 'dai-process-status--processing'
            : 'dai-process-status--done';

    return (
        <span className={`dai-process-status ${statusClass}`}>
            <i className="dai-process-status__icon" aria-hidden="true">
                {status === '未处理' && (
                    <svg viewBox="0 0 16 16" fill="none">
                        <circle cx="8" cy="8" r="7" fill="currentColor" />
                        <path d="M8 4.5V8l2.2 1.4" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                )}
                {status === '处理中' && (
                    <svg viewBox="0 0 16 16" fill="none">
                        <circle cx="8" cy="8" r="7" fill="currentColor" />
                        <path d="M6.5 5.2v5.6l4.8-2.8-4.8-2.8z" fill="#fff" />
                    </svg>
                )}
                {status === '已处理' && (
                    <svg viewBox="0 0 16 16" fill="none">
                        <circle cx="8" cy="8" r="7" fill="currentColor" />
                        <path d="M5 8.2l2 2 4.2-4.4" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                )}
            </i>
            {status}
        </span>
    );
}

type DeviceAlarmInfoPageProps = {
    products: ProductRecord[];
    alarms: DeviceAlarmRecord[];
    onUpdateAlarms: React.Dispatch<React.SetStateAction<DeviceAlarmRecord[]>>;
    onNavigateHome: () => void;
    onNavigateDeviceAccess: () => void;
    onNavigate: (pageId: MessageCenterPageId) => void;
    onNavigateOmManagement?: () => void;
    onViewWorkOrder?: (workOrderId: string) => void;
    onCreateWorkOrder?: (workOrder: WorkOrderRecord) => void;
    initialKeyword?: string;
};

export default function DeviceAlarmInfoPage({
    products,
    alarms,
    onUpdateAlarms,
    onNavigateHome,
    onNavigateDeviceAccess,
    onNavigate,
    onNavigateOmManagement,
    onViewWorkOrder,
    onCreateWorkOrder,
    initialKeyword,
}: DeviceAlarmInfoPageProps) {
    const [filtersExpanded, setFiltersExpanded] = useState(false);
    const [draftFilters, setDraftFilters] = useState<FilterState>(() =>
        initialKeyword ? { ...DEFAULT_FILTERS, keyword: initialKeyword } : DEFAULT_FILTERS,
    );
    const [appliedFilters, setAppliedFilters] = useState<FilterState>(() =>
        initialKeyword ? { ...DEFAULT_FILTERS, keyword: initialKeyword } : DEFAULT_FILTERS,
    );
    const [pageSize, setPageSize] = useState('10');
    const [currentPage, setCurrentPage] = useState(1);
    const [jumpPage, setJumpPage] = useState('1');
    const [toast, setToast] = useState<IotToastData | null>(null);
    const [detailModal, setDetailModal] = useState<{
        alarmId: string;
        mode: 'process' | 'view';
    } | null>(null);
    const [convertModal, setConvertModal] = useState<{ alarmId: string } | null>(null);

    const showToast = (message: string, type: IotToastType = 'success') => {
        triggerIotToast(setToast, message, type);
    };

    const productTree = useMemo(() => buildProductPickerTree(products), [products]);

    const productNameMap = useMemo(
        () => new Map(products.map((product) => [product.id, product.name])),
        [products],
    );

    const filteredAlarms = useMemo(() => alarms
        .filter((alarm) => {
        const productName = productNameMap.get(alarm.productId) ?? '';
        const matchLevel = appliedFilters.level === '全部' || alarm.level === appliedFilters.level;
        const matchProduct = itemMatchesProductFilter(appliedFilters.product, alarm.productId, products);
        const matchStatus = appliedFilters.status === '全部' || alarm.processStatus === appliedFilters.status;
        const matchTrigger = appliedFilters.triggerMethod === '全部' || alarm.triggerMethod === appliedFilters.triggerMethod;
        const matchProcessMethod = appliedFilters.processMethod === '全部' || alarm.processMethod === appliedFilters.processMethod;
        const matchStart = !appliedFilters.startTime || alarm.triggeredAt >= appliedFilters.startTime;
        const matchEnd = !appliedFilters.endTime || alarm.triggeredAt <= `${appliedFilters.endTime} 23:59:59`;
        const keyword = appliedFilters.keyword.trim();
        const triggerContent = resolveAlarmTriggerContent(alarm);
        const matchKeyword = !keyword
            || alarm.eventName.includes(keyword)
            || alarm.deviceName.includes(keyword)
            || alarm.deviceCode.includes(keyword)
            || triggerContent.includes(keyword)
            || alarm.content.includes(keyword)
            || productName.includes(keyword)
            || alarm.space.includes(keyword);
        return matchLevel && matchProduct && matchStatus && matchTrigger && matchProcessMethod && matchStart && matchEnd && matchKeyword;
        })
        .sort((a, b) => b.triggeredAt.localeCompare(a.triggeredAt)), [alarms, appliedFilters, productNameMap, products]);

    const pagination = useMemo(
        () => paginateItems(filteredAlarms, currentPage, Number(pageSize)),
        [currentPage, filteredAlarms, pageSize],
    );

    useEffect(() => {
        onUpdateAlarms((prev) => {
            const next = prev.map(normalizeDeviceAlarm);
            const changed = next.some((alarm, index) => alarm.content !== prev[index]?.content);
            return changed ? next : prev;
        });
    }, [onUpdateAlarms]);

    useEffect(() => {
        if (initialKeyword) {
            const filtered = { ...DEFAULT_FILTERS, keyword: initialKeyword };
            setDraftFilters(filtered);
            setAppliedFilters(filtered);
        }
    }, [initialKeyword]);

    useEffect(() => {
        setCurrentPage(1);
        setJumpPage('1');
    }, [appliedFilters, pageSize]);

    useEffect(() => {
        setJumpPage(String(pagination.currentPage));
    }, [pagination.currentPage]);

    const handleSearch = () => {
        setAppliedFilters({ ...draftFilters, keyword: draftFilters.keyword.trim() });
    };

    const handleReset = () => {
        setDraftFilters(DEFAULT_FILTERS);
        setAppliedFilters(DEFAULT_FILTERS);
    };

    const activeAlarm = useMemo(
        () => (detailModal ? alarms.find((item) => item.id === detailModal.alarmId) ?? null : null),
        [alarms, detailModal],
    );

    const convertAlarm = useMemo(
        () => (convertModal ? alarms.find((item) => item.id === convertModal.alarmId) ?? null : null),
        [alarms, convertModal],
    );

    const markAlarmRead = (alarmId: string) => {
        onUpdateAlarms((prev) => prev.map((item) => (
            item.id === alarmId ? { ...item, readStatus: '已读' } : item
        )));
    };

    const handleProcess = (alarm: DeviceAlarmRecord) => {
        markAlarmRead(alarm.id);
        setDetailModal({ alarmId: alarm.id, mode: 'process' });
    };

    const handleView = (alarm: DeviceAlarmRecord) => {
        markAlarmRead(alarm.id);
        setDetailModal({ alarmId: alarm.id, mode: 'view' });
    };

    const handleConfirmProcess = (result: string) => {
        if (!activeAlarm) return;

        const now = new Date();
        const pad = (value: number) => String(value).padStart(2, '0');
        const processTime = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

        onUpdateAlarms((prev) => prev.map((item) => (
            item.id === activeAlarm.id
                ? normalizeDeviceAlarm({
                    ...item,
                    readStatus: '已读',
                    processStatus: '已处理',
                    processMethod: '直接处理',
                    processResult: result,
                    processHandler: '当前用户',
                    processTime,
                    releaseTime: processTime,
                })
                : item
        )));

        setDetailModal(null);
        showToast(`「${activeAlarm.eventName}」已处理完成`);
    };

    const handleConvertTicket = (alarm: DeviceAlarmRecord) => {
        if (alarm.processStatus !== '未处理') return;
        markAlarmRead(alarm.id);
        setConvertModal({ alarmId: alarm.id });
    };

    const handleConfirmConvert = (form: ConvertWorkOrderForm) => {
        if (!convertAlarm) return;

        const now = new Date();
        const pad = (value: number) => String(value).padStart(2, '0');
        const createdAt = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} `
            + `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

        const workOrderRecord = createWorkOrderFromAlarm({
            name: form.name,
            level: form.level,
            content: form.content,
            assignees: form.assignees,
            space: convertAlarm.space,
            alarmId: convertAlarm.id,
        });

        onUpdateAlarms((prev) => prev.map((item) => (
            item.id === convertAlarm.id
                ? normalizeDeviceAlarm({
                    ...item,
                    readStatus: '已读',
                    processStatus: '处理中',
                    processMethod: '工单处理',
                    workOrder: {
                        id: workOrderRecord.id,
                        name: form.name,
                        createdAt,
                        level: form.level,
                        content: form.content,
                        assignees: form.assignees,
                    },
                })
                : item
        )));

        onCreateWorkOrder?.(workOrderRecord);
        setConvertModal(null);
        showToast(`「${convertAlarm.eventName}」已转为工单`);
    };

    const handleViewWorkOrder = (workOrder: NonNullable<DeviceAlarmRecord['workOrder']>) => {
        if (onViewWorkOrder) {
            onViewWorkOrder(workOrder.id);
            return;
        }
        showToast(`查看工单 ${workOrder.id}（原型）`, 'warning');
    };

    const updateDraft = (patch: Partial<FilterState>) => {
        setDraftFilters((prev) => ({ ...prev, ...patch }));
    };

    const sidebar = <MessageCenterSidebar pageId="device-alarm-info" onNavigate={onNavigate} />;

    return (
        <AppShell
            activeTopTab="消息中心"
            sidebar={sidebar}
            onNavigateMessageCenter={() => onNavigate('device-alarm-info')}
            onNavigateOmManagement={onNavigateOmManagement}
            onTopTabChange={(tab) => {
                if (tab === '设备接入') onNavigateDeviceAccess();
            }}
        >
            <div className="pm-page dai-alarm-page">
                <div className="crumb">消息中心 / 告警消息 / 设备告警信息</div>

                <section className="panel pm-filter-panel">
                    <div className={`dai-filter-row ${filtersExpanded ? 'dai-filter-row--expanded' : ''}`}>
                        <div className="dai-filter-main-row">
                        <label className="pm-filter-field">
                            <span className="pm-filter-label">告警等级</span>
                            <ElSelect
                                className="el-select--medium"
                                size="medium"
                                value={draftFilters.level}
                                options={LEVEL_OPTIONS}
                                onChange={(value) => updateDraft({ level: value })}
                            />
                        </label>
                        <label className="pm-filter-field">
                            <span className="pm-filter-label">产品</span>
                            <ElTreeSelect
                                className="el-select--medium dai-product-tree-select"
                                size="medium"
                                value={draftFilters.product}
                                tree={productTree}
                                defaultExpanded={DEFAULT_PRODUCT_TREE_EXPANDED}
                                onChange={(value) => updateDraft({ product: value })}
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
                            <span className="pm-filter-label">触发方式</span>
                            <ElSelect
                                className="el-select--medium"
                                size="medium"
                                value={draftFilters.triggerMethod}
                                options={TRIGGER_OPTIONS}
                                onChange={(value) => updateDraft({ triggerMethod: value })}
                            />
                        </label>

                        {!filtersExpanded && (
                            <>
                                <label className="pm-filter-field">
                                    <span className="pm-filter-label">搜索</span>
                                    <input
                                        type="text"
                                        className="pm-filter-input"
                                        placeholder="请输入搜索内容"
                                        value={draftFilters.keyword}
                                        onChange={(event) => updateDraft({ keyword: event.target.value })}
                                    />
                                </label>
                                <div className="pm-filter-actions dai-filter-actions">
                                    <button type="button" className="pm-btn pm-btn-primary" onClick={handleSearch}>
                                        <Search size={14} />
                                        查询
                                    </button>
                                    <button type="button" className="pm-btn pm-btn-ghost" onClick={handleReset}>
                                        重置
                                    </button>
                                    <button
                                        type="button"
                                        className="dai-filter-expand"
                                        onClick={() => setFiltersExpanded(true)}
                                    >
                                        展开
                                        <ChevronDown size={14} />
                                    </button>
                                </div>
                            </>
                        )}

                        {filtersExpanded && (
                            <>
                                <label className="pm-filter-field">
                                    <span className="pm-filter-label">处理方式</span>
                                    <ElSelect
                                        className="el-select--medium"
                                        size="medium"
                                        value={draftFilters.processMethod}
                                        options={PROCESS_METHOD_OPTIONS}
                                        onChange={(value) => updateDraft({ processMethod: value })}
                                    />
                                </label>
                                <label className="pm-filter-field">
                                    <span className="pm-filter-label">触发时间</span>
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
                            </>
                        )}
                        </div>

                        {filtersExpanded && (
                            <div className="dai-filter-second-row">
                                <label className="pm-filter-field">
                                    <span className="pm-filter-label">搜索</span>
                                    <input
                                        type="text"
                                        className="pm-filter-input"
                                        placeholder="请输入搜索内容"
                                        value={draftFilters.keyword}
                                        onChange={(event) => updateDraft({ keyword: event.target.value })}
                                    />
                                </label>
                                <div className="pm-filter-actions dai-filter-actions">
                                    <button type="button" className="pm-btn pm-btn-primary" onClick={handleSearch}>
                                        <Search size={14} />
                                        查询
                                    </button>
                                    <button type="button" className="pm-btn pm-btn-ghost" onClick={handleReset}>
                                        重置
                                    </button>
                                    <button
                                        type="button"
                                        className="dai-filter-expand"
                                        onClick={() => setFiltersExpanded(false)}
                                    >
                                        收起
                                        <ChevronUp size={14} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                <section className="panel pm-list-panel">
                    <div className="pm-section-head">
                        <h3>告警列表</h3>
                    </div>

                    <div className="pm-table-wrap">
                        <table className="pm-table">
                            <thead>
                                <tr>
                                    <th>序号</th>
                                    <th>事件名称</th>
                                    <th>告警等级</th>
                                    <th>设备名称</th>
                                    <th>设备编号</th>
                                    <th>所属产品</th>
                                    <th>所属空间</th>
                                    <th>阅读状态</th>
                                    <th>触发时间</th>
                                    <th>触发内容</th>
                                    <th>处理状态</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pagination.items.map((alarm, index) => (
                                    <tr key={alarm.id}>
                                        <td>{(pagination.currentPage - 1) * Number(pageSize) + index + 1}</td>
                                        <td>{alarm.eventName}</td>
                                        <td><AlarmLevelCell level={alarm.level} /></td>
                                        <td>{alarm.deviceName}</td>
                                        <td>{alarm.deviceCode}</td>
                                        <td>{resolveAlarmProductName(alarm.productId, products)}</td>
                                        <td>{alarm.space}</td>
                                        <td><ReadStatusCell status={alarm.readStatus} /></td>
                                        <td>{alarm.triggeredAt}</td>
                                        <td className="dai-trigger-content">{resolveAlarmTriggerContent(alarm)}</td>
                                        <td><ProcessStatusCell status={alarm.processStatus} /></td>
                                        <td>
                                            <div className="dai-table-actions">
                                                {alarm.processStatus === '未处理' ? (
                                                    <button type="button" onClick={() => handleProcess(alarm)}>处理</button>
                                                ) : (
                                                    <button type="button" onClick={() => handleView(alarm)}>查看</button>
                                                )}
                                                {alarm.processStatus === '未处理' ? (
                                                    <button type="button" onClick={() => handleConvertTicket(alarm)}>转为工单</button>
                                                ) : (
                                                    <span className="is-disabled">转为工单</span>
                                                )}
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

            <AlarmDetailModal
                open={detailModal !== null}
                mode={detailModal?.mode ?? 'view'}
                alarm={activeAlarm}
                products={products}
                onClose={() => setDetailModal(null)}
                onConfirmProcess={handleConfirmProcess}
                onViewWorkOrder={handleViewWorkOrder}
            />

            <ConvertWorkOrderModal
                open={convertModal !== null}
                alarm={convertAlarm}
                onClose={() => setConvertModal(null)}
                onConfirm={handleConfirmConvert}
            />

            <IotToast toast={toast} />
        </AppShell>
    );
}
