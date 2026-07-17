import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Search } from 'lucide-react';
import { handleSelectableRowClick } from '../../../common/selectableRow';
import AppShell from '../components/AppShell';
import type { MessageCenterPageId } from '../components/MessageCenterSidebar';
import type { AlarmWorkOrderPageId } from '../components/AlarmWorkOrderSidebar';
import type { AlarmPageModule } from '../utils/alarmModuleShell';
import { buildAlarmModuleShellConfig } from '../utils/alarmModuleShell';
import Breadcrumb from '../components/Breadcrumb';
import ElSelect from '../components/ElSelect';
import ElTreeSelect from '../components/ElTreeSelect';
import ElDateRangePicker from '../components/ElDateRangePicker';
import ListPagination from '../components/ListPagination';
import AlarmDetailModal from '../components/AlarmDetailModal';
import ConvertWorkOrderModal, { type ConvertWorkOrderForm } from '../components/ConvertWorkOrderModal';
import BatchProcessAlarmsModal from '../components/BatchProcessAlarmsModal';
import BatchConvertWorkOrderModal, { type BatchConvertWorkOrderForm } from '../components/BatchConvertWorkOrderModal';
import IotToast, { type IotToastData, type IotToastType, triggerIotToast } from '../components/IotToast';
import { paginateItems, DEFAULT_LIST_PAGE_SIZE } from '../utils/listPagination';
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
    resolveAlarmTriggerContentListDisplay,
    type DeviceAlarmRecord,
} from '../data/deviceAlarms';
import { createWorkOrderFromAlarm, type WorkOrderRecord } from '../data/workOrders';
import type { ProductRecord } from '../data/products';
import type { AlarmLevelRecord } from '../data/alarmLevels';
import type { DeviceRecord } from '../data/devices';
import '../device-access.css';
import '../product-management.css';
import '../device-alarm-info.css';
import ClearableInput from '../components/ClearableInput';
import { AlarmLevelCell, ProcessStatusCell, ReadStatusCell } from '../components/DeviceAlarmTableCells';

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

type DeviceAlarmInfoPageProps = {
    products: ProductRecord[];
    devices: DeviceRecord[];
    alarms: DeviceAlarmRecord[];
    alarmLevels?: AlarmLevelRecord[];
    onUpdateAlarms: React.Dispatch<React.SetStateAction<DeviceAlarmRecord[]>>;
    module?: AlarmPageModule;
    onNavigateHome: () => void;
    onNavigateDeviceAccess: () => void;
    onNavigate: (pageId: MessageCenterPageId) => void;
    onNavigateAlarmWorkOrder?: (pageId: AlarmWorkOrderPageId) => void;
    onViewWorkOrder?: (workOrderId: string) => void;
    onCreateWorkOrder?: (workOrder: WorkOrderRecord) => void;
    initialKeyword?: string;
};

export default function DeviceAlarmInfoPage({
    products,
    devices,
    alarms,
    alarmLevels,
    onUpdateAlarms,
    module = 'alarm-work-order',
    onNavigateHome,
    onNavigateDeviceAccess,
    onNavigate,
    onNavigateAlarmWorkOrder,
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
    const [pageSize, setPageSize] = useState('20');
    const [currentPage, setCurrentPage] = useState(1);
    const [jumpPage, setJumpPage] = useState('1');
    const [toast, setToast] = useState<IotToastData | null>(null);
    const [detailModal, setDetailModal] = useState<{
        alarmId: string;
        mode: 'process' | 'view';
    } | null>(null);
    const [convertModal, setConvertModal] = useState<{ alarmId: string } | null>(null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [batchProcessOpen, setBatchProcessOpen] = useState(false);
    const [batchConvertOpen, setBatchConvertOpen] = useState(false);

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

    const alarmMap = useMemo(
        () => new Map(alarms.map((alarm) => [alarm.id, alarm])),
        [alarms],
    );

    const selectedPendingAlarms = useMemo(
        () => selectedIds
            .map((id) => alarmMap.get(id))
            .filter((alarm): alarm is DeviceAlarmRecord => Boolean(alarm && alarm.processStatus === '未处理')),
        [alarmMap, selectedIds],
    );

    const selectablePageIds = useMemo(
        () => pagination.items
            .filter((alarm) => alarm.processStatus === '未处理')
            .map((alarm) => alarm.id),
        [pagination.items],
    );

    const allPageSelected = selectablePageIds.length > 0
        && selectablePageIds.every((id) => selectedIds.includes(id));

    const toggleSelect = (alarmId: string) => {
        const alarm = alarmMap.get(alarmId);
        if (!alarm || alarm.processStatus !== '未处理') return;
        setSelectedIds((prev) => (
            prev.includes(alarmId)
                ? prev.filter((id) => id !== alarmId)
                : [...prev, alarmId]
        ));
    };

    const toggleSelectAll = () => {
        if (allPageSelected) {
            setSelectedIds((prev) => prev.filter((id) => !selectablePageIds.includes(id)));
            return;
        }
        setSelectedIds((prev) => [...new Set([...prev, ...selectablePageIds])]);
    };

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
            processingDeadline: form.processingDeadline,
            processingDeadlineUnit: form.processingDeadlineUnit,
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
                        processingDeadline: form.processingDeadline,
                        processingDeadlineUnit: form.processingDeadlineUnit,
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

    const buildProcessTimestamp = () => {
        const now = new Date();
        const pad = (value: number) => String(value).padStart(2, '0');
        return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} `
            + `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    };

    const handleOpenBatchProcess = () => {
        if (!selectedPendingAlarms.length) {
            showToast('请先选择未处理的告警', 'warning');
            return;
        }
        selectedPendingAlarms.forEach((alarm) => markAlarmRead(alarm.id));
        setBatchProcessOpen(true);
    };

    const handleConfirmBatchProcess = (result: string) => {
        const targetIds = new Set(selectedPendingAlarms.map((alarm) => alarm.id));
        const processTime = buildProcessTimestamp();

        onUpdateAlarms((prev) => prev.map((item) => (
            targetIds.has(item.id)
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

        const count = selectedPendingAlarms.length;
        setSelectedIds((prev) => prev.filter((id) => !targetIds.has(id)));
        setBatchProcessOpen(false);
        showToast(`已批量处理 ${count} 条告警`);
    };

    const batchConvertDefaultLevel = useMemo(() => {
        const levels = selectedPendingAlarms.map((alarm) => alarm.level);
        const uniqueLevels = new Set(levels);
        if (uniqueLevels.size === 1) {
            return levels[0];
        }
        return '重要';
    }, [selectedPendingAlarms]);

    const handleOpenBatchConvert = () => {
        if (!selectedPendingAlarms.length) {
            showToast('请先选择未处理的告警', 'warning');
            return;
        }
        setBatchConvertOpen(true);
    };

    const handleConfirmBatchConvert = (form: BatchConvertWorkOrderForm) => {
        const createdAt = buildProcessTimestamp();
        const targetIds = new Set(selectedPendingAlarms.map((alarm) => alarm.id));
        const workOrders = selectedPendingAlarms.map((alarm) => createWorkOrderFromAlarm({
            name: alarm.eventName,
            level: form.level,
            content: form.content,
            assignees: form.assignees,
            space: alarm.space,
            alarmId: alarm.id,
            processingDeadline: form.processingDeadline,
            processingDeadlineUnit: form.processingDeadlineUnit,
        }));

        onUpdateAlarms((prev) => prev.map((item) => {
            if (!targetIds.has(item.id)) return item;
            const workOrderRecord = workOrders.find((record) => record.alarmId === item.id);
            if (!workOrderRecord) return item;
            return normalizeDeviceAlarm({
                ...item,
                readStatus: '已读',
                processStatus: '处理中',
                processMethod: '工单处理',
                workOrder: {
                    id: workOrderRecord.id,
                    name: workOrderRecord.name,
                    createdAt,
                    level: workOrderRecord.level,
                    content: form.content,
                    assignees: form.assignees,
                    processingDeadline: form.processingDeadline,
                    processingDeadlineUnit: form.processingDeadlineUnit,
                },
            });
        }));

        workOrders.forEach((workOrder) => onCreateWorkOrder?.(workOrder));

        const count = selectedPendingAlarms.length;
        setSelectedIds((prev) => prev.filter((id) => !targetIds.has(id)));
        setBatchConvertOpen(false);
        showToast(`已批量转为 ${count} 个工单`);
    };

    const updateDraft = (patch: Partial<FilterState>) => {
        setDraftFilters((prev) => ({ ...prev, ...patch }));
    };

    const shellConfig = buildAlarmModuleShellConfig({
        module,
        messagePageId: 'device-alarm-info',
        workOrderPageId: 'awo-device-alarm-info',
        crumbSuffix: '设备告警信息',
        onNavigateMessageCenter: onNavigate,
        onNavigateAlarmWorkOrder: onNavigateAlarmWorkOrder ?? (() => {}),
    });

    return (
        <AppShell
            activeTopTab={shellConfig.activeTopTab}
            sidebar={shellConfig.sidebar}
            onNavigateMessageCenter={() => onNavigate('msg-subscribe')}
            onNavigateAlarmWorkOrder={() => onNavigateAlarmWorkOrder?.('awo-device-alarm-info')}
            onTopTabChange={(tab) => {
                if (tab === '设备接入') onNavigateDeviceAccess();
                if (tab === '消息中心') onNavigate('msg-subscribe');
                if (tab === '告警工单') onNavigateAlarmWorkOrder?.('awo-device-alarm-info');
            }}
        >
            <div className="pm-page dai-alarm-page">
                <Breadcrumb items={shellConfig.crumbItems} onNavigate={(id) => onNavigateAlarmWorkOrder?.(id as AlarmWorkOrderPageId)} />

                <section className="panel pm-filter-panel">
                    <div className={`dai-filter-row ${filtersExpanded ? 'dai-filter-row--expanded' : ''}`}>
                        <div className="dai-filter-main-row">
                            <div className="pm-filter-field">
                                <span className="pm-filter-label">告警等级</span>
                                <ElSelect
                                    className="el-select--medium"
                                    size="medium"
                                    value={draftFilters.level}
                                    options={LEVEL_OPTIONS}
                                    onChange={(value) => updateDraft({ level: value })}
                                />
                            </div>
                            <div className="pm-filter-field">
                                <span className="pm-filter-label">产品</span>
                                <ElTreeSelect
                                    className="el-select--medium dai-product-tree-select"
                                    size="medium"
                                    value={draftFilters.product}
                                    tree={productTree}
                                    defaultExpanded={DEFAULT_PRODUCT_TREE_EXPANDED}
                                    filterable
                                    onChange={(value) => updateDraft({ product: value })}
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
                            {filtersExpanded && (
                                <div className="pm-filter-field dai-filter-date">
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
                                </div>
                            )}
                            {!filtersExpanded && (
                                <>
                                    <div className="pm-filter-field dai-filter-search">
                                        <span className="pm-filter-label">搜索</span>
                                        <ClearableInput
                                            type="text"
                                            className="pm-filter-input"
                                            placeholder="请输入搜索内容"
                                            value={draftFilters.keyword}
                                            onChange={(event) => updateDraft({ keyword: event.target.value })}
                                        />
                                    </div>
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
                        </div>

                        {filtersExpanded && (
                            <div className="dai-filter-second-row">
                                <div className="pm-filter-field">
                                    <span className="pm-filter-label">触发方式</span>
                                    <ElSelect
                                        className="el-select--medium"
                                        size="medium"
                                        value={draftFilters.triggerMethod}
                                        options={TRIGGER_OPTIONS}
                                        onChange={(value) => updateDraft({ triggerMethod: value })}
                                    />
                                </div>
                                <div className="pm-filter-field">
                                    <span className="pm-filter-label">处理方式</span>
                                    <ElSelect
                                        className="el-select--medium"
                                        size="medium"
                                        value={draftFilters.processMethod}
                                        options={PROCESS_METHOD_OPTIONS}
                                        onChange={(value) => updateDraft({ processMethod: value })}
                                    />
                                </div>
                                <div className="pm-filter-field dai-filter-search">
                                    <span className="pm-filter-label">搜索</span>
                                    <ClearableInput
                                        type="text"
                                        className="pm-filter-input"
                                        placeholder="请输入搜索内容"
                                        value={draftFilters.keyword}
                                        onChange={(event) => updateDraft({ keyword: event.target.value })}
                                    />
                                </div>
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
                        <h3>
                            告警列表
                            {selectedPendingAlarms.length > 0 && (
                                <span className="dai-list-selection">（已选 {selectedPendingAlarms.length} 项）</span>
                            )}
                        </h3>
                        <div className="dai-list-toolbar">
                            <button
                                type="button"
                                className="pm-btn pm-btn-ghost"
                                disabled={!selectedPendingAlarms.length}
                                onClick={handleOpenBatchProcess}
                            >
                                批量处理
                            </button>
                            <button
                                type="button"
                                className="pm-btn pm-btn-ghost"
                                disabled={!selectedPendingAlarms.length}
                                onClick={handleOpenBatchConvert}
                            >
                                批量转为工单
                            </button>
                        </div>
                    </div>

                    <div className="pm-table-wrap">
                        <table className="pm-table pm-table--device-alarm-page pm-table--device-alarm-page--selectable">
                            <thead>
                                <tr>
                                    <th className="dai-table__check">
                                        <input
                                            type="checkbox"
                                            checked={allPageSelected}
                                            disabled={!selectablePageIds.length}
                                            onChange={toggleSelectAll}
                                            aria-label="全选当前页未处理告警"
                                        />
                                    </th>
                                    <th>序号</th>
                                    <th>事件名称</th>
                                    <th>告警等级</th>
                                    <th>设备名称</th>
                                    <th>设备编号</th>
                                    <th>所属产品</th>
                                    <th>所属片区</th>
                                    <th>阅读状态</th>
                                    <th>触发时间</th>
                                    <th>触发内容</th>
                                    <th>处理状态</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pagination.items.map((alarm, index) => {
                                    const selectable = alarm.processStatus === '未处理';
                                    return (
                                    <tr
                                        key={alarm.id}
                                        className={selectable ? 'iot-selectable-row' : undefined}
                                        onClick={selectable
                                            ? (event) => handleSelectableRowClick(event, () => toggleSelect(alarm.id))
                                            : undefined}
                                    >
                                        <td className="dai-table__check">
                                            <input
                                                type="checkbox"
                                                checked={selectable && selectedIds.includes(alarm.id)}
                                                disabled={!selectable}
                                                onChange={() => toggleSelect(alarm.id)}
                                                aria-label={`选择${alarm.eventName}`}
                                            />
                                        </td>
                                        <td>{(pagination.currentPage - 1) * Number(pageSize) + index + 1}</td>
                                        <td>{alarm.eventName}</td>
                                        <td><AlarmLevelCell level={alarm.level} /></td>
                                        <td>{alarm.deviceName}</td>
                                        <td>{alarm.deviceCode}</td>
                                        <td>{resolveAlarmProductName(alarm.productId, products)}</td>
                                        <td>{alarm.space}</td>
                                        <td><ReadStatusCell status={alarm.readStatus} /></td>
                                        <td>{alarm.triggeredAt}</td>
                                        <td>
                                            <span
                                                className="dai-trigger-content"
                                                title={resolveAlarmTriggerContent(alarm)}
                                            >
                                                {resolveAlarmTriggerContentListDisplay(alarm)}
                                            </span>
                                        </td>
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
                                    );
                                })}
                                {!pagination.items.length && (
                                    <tr>
                                        <td colSpan={13} className="pcp-empty-cell">暂无符合条件的告警记录</td>
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
            </div>

            <AlarmDetailModal
                open={detailModal !== null}
                mode={detailModal?.mode ?? 'view'}
                alarm={activeAlarm}
                products={products}
                devices={devices}
                onClose={() => setDetailModal(null)}
                onConfirmProcess={handleConfirmProcess}
                onViewWorkOrder={handleViewWorkOrder}
            />

            <ConvertWorkOrderModal
                open={convertModal !== null}
                alarm={convertAlarm}
                alarmLevels={alarmLevels}
                onClose={() => setConvertModal(null)}
                onConfirm={handleConfirmConvert}
            />

            <BatchProcessAlarmsModal
                open={batchProcessOpen}
                count={selectedPendingAlarms.length}
                onClose={() => setBatchProcessOpen(false)}
                onConfirm={handleConfirmBatchProcess}
            />

            <BatchConvertWorkOrderModal
                open={batchConvertOpen}
                count={selectedPendingAlarms.length}
                defaultLevel={batchConvertDefaultLevel}
                alarmLevels={alarmLevels}
                onClose={() => setBatchConvertOpen(false)}
                onConfirm={handleConfirmBatchConvert}
            />

            <IotToast toast={toast} />
        </AppShell>
    );
}
