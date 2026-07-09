import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Plus, Search } from 'lucide-react';
import { handleSelectableRowClick } from '../../../common/selectableRow';
import AppShell from '../components/AppShell';
import AlarmWorkOrderSidebar, { type AlarmWorkOrderPageId } from '../components/AlarmWorkOrderSidebar';
import ElSelect from '../components/ElSelect';
import ElDateRangePicker from '../components/ElDateRangePicker';
import ListPagination from '../components/ListPagination';
import WorkOrderCreateDrawer from '../components/WorkOrderCreateDrawer';
import WorkOrderDetailDrawer from '../components/WorkOrderDetailDrawer';
import WorkOrderProcessDrawer from '../components/WorkOrderProcessDrawer';
import WorkOrderAcceptDialog, { type WorkOrderAcceptPayload } from '../components/WorkOrderAcceptDialog';
import BatchWorkOrderAcceptDialog from '../components/BatchWorkOrderAcceptDialog';
import IotToast, { type IotToastData, type IotToastType, triggerIotToast } from '../components/IotToast';
import { paginateItems, DEFAULT_LIST_PAGE_SIZE } from '../utils/listPagination';
import type { DeviceRecord } from '../data/devices';
import type { ProductRecord } from '../data/products';
import {
    WORK_ORDER_LEVEL_OPTIONS,
    WORK_ORDER_READ_STATUS_OPTIONS,
    WORK_ORDER_STATUS_OPTIONS,
    WORK_ORDER_TYPE_OPTIONS,
    canShowWorkOrderAcceptAction,
    canShowWorkOrderProcessAction,
    CURRENT_WORK_ORDER_USER,
    getVisibleWorkOrdersForViewer,
    isWorkOrderAdminViewer,
    type WorkOrderRecord,
    type WorkOrderReadStatus,
    type WorkOrderStatus,
} from '../data/workOrders';
import '../device-access.css';
import '../product-management.css';
import '../work-order-management.css';
import ClearableInput from '../components/ClearableInput';

const TYPE_OPTIONS = WORK_ORDER_TYPE_OPTIONS.map((item) => ({ label: item, value: item }));
const LEVEL_OPTIONS = WORK_ORDER_LEVEL_OPTIONS.map((item) => ({ label: item, value: item }));
const STATUS_OPTIONS = WORK_ORDER_STATUS_OPTIONS.map((item) => ({ label: item, value: item }));
const READ_STATUS_OPTIONS = WORK_ORDER_READ_STATUS_OPTIONS.map((item) => ({ label: item, value: item }));

type FilterState = {
    type: string;
    level: string;
    status: string;
    readStatus: string;
    startTime: string;
    endTime: string;
    keyword: string;
};

const DEFAULT_FILTERS: FilterState = {
    type: '全部',
    level: '全部',
    status: '全部',
    readStatus: '全部',
    startTime: '',
    endTime: '',
    keyword: '',
};

function ReadStatusCell({ status }: { status: WorkOrderReadStatus }) {
    const statusClass = status === '未读' ? 'wom-read-status--unread' : 'wom-read-status--read';

    return (
        <span className={`wom-read-status ${statusClass}`}>
            <i className="wom-read-status__icon" aria-hidden="true">
                {status === '未读' ? (
                    <svg viewBox="0 0 16 16" fill="none">
                        <circle cx="8" cy="8" r="7" fill="currentColor" />
                        <path d="M8 4.5V8l2.2 1.4" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                ) : (
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

function WorkOrderStatusCell({ status }: { status: WorkOrderStatus }) {
    const dotClass = status === '待处理'
        ? 'wom-status-dot--pending'
        : status === '待验收'
            ? 'wom-status-dot--acceptance'
            : status === '退回'
                ? 'wom-status-dot--returned'
                : 'wom-status-dot--closed';

    return (
        <span>
            <i className={`wom-status-dot ${dotClass}`} />
            {status}
        </span>
    );
}

type WorkOrderManagementPageProps = {
    workOrders: WorkOrderRecord[];
    products: ProductRecord[];
    devices: DeviceRecord[];
    createDrawerOpen?: boolean;
    onCreateDrawerOpenChange?: (open: boolean) => void;
    detailDrawerOpen?: boolean;
    detailWorkOrderId?: string | null;
    onDetailDrawerOpenChange?: (open: boolean) => void;
    onUpdateWorkOrders: React.Dispatch<React.SetStateAction<WorkOrderRecord[]>>;
    onNavigateHome: () => void;
    onNavigateDeviceAccess: () => void;
    onNavigateMessageCenter: () => void;
    onNavigate: (pageId: AlarmWorkOrderPageId) => void;
    onCreateWorkOrder: (workOrder: WorkOrderRecord) => void;
    initialStatus?: string;
};

export default function WorkOrderManagementPage({
    workOrders,
    products,
    devices,
    createDrawerOpen = false,
    onCreateDrawerOpenChange,
    detailDrawerOpen = false,
    detailWorkOrderId = null,
    onDetailDrawerOpenChange,
    onUpdateWorkOrders,
    onNavigateHome,
    onNavigateDeviceAccess,
    onNavigateMessageCenter,
    onNavigate,
    onCreateWorkOrder,
    initialStatus,
}: WorkOrderManagementPageProps) {
    const [filtersExpanded, setFiltersExpanded] = useState(false);
    const [draftFilters, setDraftFilters] = useState<FilterState>(() =>
        initialStatus ? { ...DEFAULT_FILTERS, status: initialStatus } : DEFAULT_FILTERS,
    );
    const [appliedFilters, setAppliedFilters] = useState<FilterState>(() =>
        initialStatus ? { ...DEFAULT_FILTERS, status: initialStatus } : DEFAULT_FILTERS,
    );
    const [pageSize, setPageSize] = useState('20');
    const [currentPage, setCurrentPage] = useState(1);
    const [jumpPage, setJumpPage] = useState('1');
    const [toast, setToast] = useState<IotToastData | null>(null);
    const [processTarget, setProcessTarget] = useState<WorkOrderRecord | null>(null);
    const [acceptTarget, setAcceptTarget] = useState<WorkOrderRecord | null>(null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [batchAcceptOpen, setBatchAcceptOpen] = useState(false);
    const [createDrawerVisible, setCreateDrawerVisible] = useState(createDrawerOpen);
    const [detailDrawerVisible, setDetailDrawerVisible] = useState(detailDrawerOpen);
    const [detailWorkOrder, setDetailWorkOrder] = useState<WorkOrderRecord | null>(null);

    const openCreateDrawer = () => {
        setCreateDrawerVisible(true);
        onCreateDrawerOpenChange?.(true);
    };

    const closeCreateDrawer = () => {
        setCreateDrawerVisible(false);
        onCreateDrawerOpenChange?.(false);
    };

    useEffect(() => {
        setCreateDrawerVisible(createDrawerOpen);
    }, [createDrawerOpen]);

    useEffect(() => {
        setDetailDrawerVisible(detailDrawerOpen);
    }, [detailDrawerOpen]);

    useEffect(() => {
        if (!detailWorkOrderId) return;
        setDetailWorkOrder(workOrders.find((item) => item.id === detailWorkOrderId) ?? null);
    }, [detailWorkOrderId, workOrders]);

    useEffect(() => {
        if (initialStatus) {
            const filtered = { ...DEFAULT_FILTERS, status: initialStatus };
            setDraftFilters(filtered);
            setAppliedFilters(filtered);
        }
    }, [initialStatus]);

    const showToast = (message: string, type: IotToastType = 'success') => {
        triggerIotToast(setToast, message, type);
    };

    const canBatchAccept = isWorkOrderAdminViewer();

    const visibleWorkOrders = useMemo(
        () => getVisibleWorkOrdersForViewer(workOrders),
        [workOrders],
    );

    const filteredWorkOrders = useMemo(() => visibleWorkOrders.filter((item) => {
        if (appliedFilters.type !== '全部' && item.type !== appliedFilters.type) return false;
        if (appliedFilters.level !== '全部' && item.level !== appliedFilters.level) return false;
        if (appliedFilters.status !== '全部' && item.status !== appliedFilters.status) return false;
        if (appliedFilters.readStatus !== '全部' && item.readStatus !== appliedFilters.readStatus) return false;
        if (appliedFilters.startTime || appliedFilters.endTime) {
            const createdDate = item.createdAt.split(' ')[0];
            if (appliedFilters.startTime && createdDate < appliedFilters.startTime) return false;
            if (appliedFilters.endTime && createdDate > appliedFilters.endTime) return false;
        }
        if (appliedFilters.keyword.trim()) {
            const keyword = appliedFilters.keyword.trim().toLowerCase();
            const haystack = `${item.id} ${item.name} ${item.content} ${item.space}`.toLowerCase();
            if (!haystack.includes(keyword)) return false;
        }
        return true;
    }), [visibleWorkOrders, appliedFilters]);

    const pagination = useMemo(
        () => paginateItems(filteredWorkOrders, currentPage, Number(pageSize)),
        [filteredWorkOrders, currentPage, pageSize],
    );

    const workOrderMap = useMemo(
        () => new Map(filteredWorkOrders.map((item) => [item.id, item])),
        [filteredWorkOrders],
    );

    const selectedAcceptableWorkOrders = useMemo(
        () => selectedIds
            .map((id) => workOrderMap.get(id))
            .filter((item): item is WorkOrderRecord => Boolean(item && canShowWorkOrderAcceptAction(item))),
        [selectedIds, workOrderMap],
    );

    const selectablePageIds = useMemo(
        () => pagination.items
            .filter((item) => canShowWorkOrderAcceptAction(item))
            .map((item) => item.id),
        [pagination.items],
    );

    const allPageSelected = selectablePageIds.length > 0
        && selectablePageIds.every((id) => selectedIds.includes(id));

    const toggleSelect = (workOrderId: string) => {
        const workOrder = workOrderMap.get(workOrderId);
        if (!workOrder || !canShowWorkOrderAcceptAction(workOrder)) return;
        setSelectedIds((prev) => (
            prev.includes(workOrderId)
                ? prev.filter((id) => id !== workOrderId)
                : [...prev, workOrderId]
        ));
    };

    const toggleSelectAll = () => {
        if (allPageSelected) {
            setSelectedIds((prev) => prev.filter((id) => !selectablePageIds.includes(id)));
            return;
        }
        setSelectedIds((prev) => [...new Set([...prev, ...selectablePageIds])]);
    };

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

    const markAsRead = (workOrderId: string) => {
        onUpdateWorkOrders((prev) => prev.map((item) => (
            item.id === workOrderId ? { ...item, readStatus: '已读' } : item
        )));
    };

    const openDetailDrawer = (item: WorkOrderRecord) => {
        markAsRead(item.id);
        setDetailWorkOrder(item);
        setDetailDrawerVisible(true);
        onDetailDrawerOpenChange?.(true);
    };

    const closeDetailDrawer = () => {
        setDetailDrawerVisible(false);
        setDetailWorkOrder(null);
        onDetailDrawerOpenChange?.(false);
    };

    const handleViewDetail = (item: WorkOrderRecord) => {
        openDetailDrawer(item);
    };

    const handleOpenProcess = (item: WorkOrderRecord) => {
        if (!canShowWorkOrderProcessAction(item)) return;
        markAsRead(item.id);
        setProcessTarget(item);
    };

    const buildTimestamp = () => {
        const now = new Date();
        const pad = (value: number) => String(value).padStart(2, '0');
        return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} `
            + `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    };

    const applyWorkOrderAcceptance = (
        workOrder: WorkOrderRecord,
        payload: WorkOrderAcceptPayload,
        timestamp: string,
    ): WorkOrderRecord => (
        payload.result === '通过'
            ? {
                ...workOrder,
                status: '已结单',
                closedAt: timestamp,
                readStatus: '已读',
            }
            : {
                ...workOrder,
                status: '退回',
                readStatus: '已读',
                acceptanceRemark: payload.remark,
            }
    );

    const handleAcceptWorkOrder = (workOrder: WorkOrderRecord, payload: WorkOrderAcceptPayload) => {
        const timestamp = buildTimestamp();
        const updated = applyWorkOrderAcceptance(workOrder, payload, timestamp);

        onUpdateWorkOrders((prev) => prev.map((item) => (
            item.id === workOrder.id ? updated : item
        )));
        if (detailWorkOrder?.id === workOrder.id) {
            setDetailWorkOrder(updated);
        }
        setAcceptTarget(null);
        showToast(payload.result === '通过'
            ? `工单「${workOrder.name}」验收通过`
            : `工单「${workOrder.name}」已退回`);
    };

    const handleOpenBatchAccept = () => {
        if (!selectedAcceptableWorkOrders.length) {
            showToast('请先选择待验收的工单', 'warning');
            return;
        }
        setBatchAcceptOpen(true);
    };

    const handleConfirmBatchAccept = (payload: WorkOrderAcceptPayload) => {
        const timestamp = buildTimestamp();
        const targetIds = new Set(selectedAcceptableWorkOrders.map((item) => item.id));
        const updates = new Map(
            selectedAcceptableWorkOrders.map((item) => [
                item.id,
                applyWorkOrderAcceptance(item, payload, timestamp),
            ]),
        );

        onUpdateWorkOrders((prev) => prev.map((item) => updates.get(item.id) ?? item));
        if (detailWorkOrder && targetIds.has(detailWorkOrder.id)) {
            setDetailWorkOrder(updates.get(detailWorkOrder.id) ?? detailWorkOrder);
        }

        const count = selectedAcceptableWorkOrders.length;
        setSelectedIds((prev) => prev.filter((id) => !targetIds.has(id)));
        setBatchAcceptOpen(false);
        showToast(payload.result === '通过'
            ? `已批量验收通过 ${count} 个工单`
            : `已批量退回 ${count} 个工单`);
    };

    const handleProcessWorkOrder = (payload: { result: string; attachmentCount: number }) => {
        if (!processTarget) return;

        const now = new Date();
        const pad = (value: number) => String(value).padStart(2, '0');
        const handledAt = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} `
            + `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
        const updated: WorkOrderRecord = {
            ...processTarget,
            status: '待验收',
            handler: CURRENT_WORK_ORDER_USER,
            handledAt,
            result: payload.result,
            processAttachmentCount: payload.attachmentCount,
            readStatus: '已读',
        };

        onUpdateWorkOrders((prev) => prev.map((item) => (
            item.id === processTarget.id ? updated : item
        )));
        if (detailWorkOrder?.id === processTarget.id) {
            setDetailWorkOrder(updated);
        }
        setProcessTarget(null);
        showToast(`工单「${processTarget.name}」已提交处理结果`);
    };

    const sidebar = <AlarmWorkOrderSidebar pageId="work-order-management" onNavigate={onNavigate} />;

    return (
        <AppShell
            activeTopTab="告警工单"
            sidebar={sidebar}
            onNavigateAlarmWorkOrder={() => onNavigate('work-order-management')}
            onNavigateMessageCenter={onNavigateMessageCenter}
            onTopTabChange={(tab) => {
                if (tab === '设备接入') onNavigateDeviceAccess();
            }}
        >
            <div className="pm-page wom-page">
                <div className="crumb">告警工单 / 工单管理</div>

                <section className="panel pm-filter-panel">
                    <div className="wom-filter-row">
                        <div className="wom-filter-main-row">
                            <div className="pm-filter-field">
                                <span className="pm-filter-label">工单类型</span>
                                <ElSelect
                                    className="el-select--medium"
                                    size="medium"
                                    value={draftFilters.type}
                                    options={TYPE_OPTIONS}
                                    onChange={(value) => updateDraft({ type: value })}
                                />
                            </div>
                            <div className="pm-filter-field">
                                <span className="pm-filter-label">工单等级</span>
                                <ElSelect
                                    className="el-select--medium"
                                    size="medium"
                                    value={draftFilters.level}
                                    options={LEVEL_OPTIONS}
                                    onChange={(value) => updateDraft({ level: value })}
                                />
                            </div>
                            <div className="pm-filter-field">
                                <span className="pm-filter-label">工单状态</span>
                                <ElSelect
                                    className="el-select--medium"
                                    size="medium"
                                    value={draftFilters.status}
                                    options={STATUS_OPTIONS}
                                    onChange={(value) => updateDraft({ status: value })}
                                />
                            </div>

                            {filtersExpanded && (
                                <div className="pm-filter-field">
                                    <span className="pm-filter-label">生成时间</span>
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
                                    <div className="pm-filter-field wom-filter-search">
                                        <span className="pm-filter-label">搜索</span>
                                        <div className="wom-filter-search-input">
                                            <ClearableInput
                                                type="text"
                                                className="pm-filter-input"
                                                placeholder="请输入内容"
                                                value={draftFilters.keyword}
                                                onChange={(event) => updateDraft({ keyword: event.target.value })}
                                            />
                                            <Search size={14} className="wom-filter-search-icon" />
                                        </div>
                                    </div>
                                    <div className="pm-filter-actions wom-filter-actions">
                                        <button type="button" className="pm-btn pm-btn-primary" onClick={handleSearch}>
                                            <Search size={14} />
                                            查询
                                        </button>
                                        <button type="button" className="pm-btn pm-btn-ghost" onClick={handleReset}>
                                            重置
                                        </button>
                                        <button
                                            type="button"
                                            className="wom-filter-expand"
                                            onClick={() => setFiltersExpanded(true)}
                                        >
                                            展开
                                            <ChevronDown size={14} />
                                        </button>
                                    </div>
                                </>
                            )}

                            {filtersExpanded && (
                                <div className="pm-filter-field wom-filter-search">
                                    <span className="pm-filter-label">搜索</span>
                                    <div className="wom-filter-search-input">
                                        <ClearableInput
                                            type="text"
                                            className="pm-filter-input"
                                            placeholder="请输入内容"
                                            value={draftFilters.keyword}
                                            onChange={(event) => updateDraft({ keyword: event.target.value })}
                                        />
                                        <Search size={14} className="wom-filter-search-icon" />
                                    </div>
                                </div>
                            )}
                        </div>

                        {filtersExpanded && (
                            <div className="wom-filter-second-row">
                                <div className="pm-filter-field">
                                    <span className="pm-filter-label">阅读状态</span>
                                    <ElSelect
                                        className="el-select--medium"
                                        size="medium"
                                        value={draftFilters.readStatus}
                                        options={READ_STATUS_OPTIONS}
                                        onChange={(value) => updateDraft({ readStatus: value })}
                                    />
                                </div>
                                <div className="pm-filter-actions wom-filter-actions">
                                    <button type="button" className="pm-btn pm-btn-primary" onClick={handleSearch}>
                                        <Search size={14} />
                                        查询
                                    </button>
                                    <button type="button" className="pm-btn pm-btn-ghost" onClick={handleReset}>
                                        重置
                                    </button>
                                    <button
                                        type="button"
                                        className="wom-filter-expand"
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
                            工单列表
                            {canBatchAccept && selectedAcceptableWorkOrders.length > 0 && (
                                <span className="wom-list-selection">
                                    （已选 {selectedAcceptableWorkOrders.length} 项）
                                </span>
                            )}
                        </h3>
                        <div className="wom-list-toolbar">
                            {canBatchAccept ? (
                                <button
                                    type="button"
                                    className="pm-btn pm-btn-ghost"
                                    disabled={!selectedAcceptableWorkOrders.length}
                                    onClick={handleOpenBatchAccept}
                                >
                                    批量验收
                                </button>
                            ) : null}
                            <button type="button" className="pm-btn pm-btn-primary wom-add-btn" onClick={openCreateDrawer}>
                                <Plus size={14} />
                                新增工单
                            </button>
                        </div>
                    </div>

                    <div className="pm-table-wrap">
                        <table className={`pm-table${canBatchAccept ? ' pm-table--work-order-selectable' : ''}`}>
                            <thead>
                                <tr>
                                    {canBatchAccept ? (
                                        <th className="wom-table__check">
                                            <input
                                                type="checkbox"
                                                checked={allPageSelected}
                                                disabled={!selectablePageIds.length}
                                                onChange={toggleSelectAll}
                                                aria-label="全选当前页待验收工单"
                                            />
                                        </th>
                                    ) : null}
                                    <th>序号</th>
                                    <th>工单编号</th>
                                    <th>工单名称</th>
                                    <th>工单等级</th>
                                    <th>工单类型</th>
                                    <th>工单状态</th>
                                    <th>生成时间</th>
                                    <th>阅读状态</th>
                                    <th>工单内容</th>
                                    <th>所属区域</th>
                                    <th>结单时间</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pagination.items.map((item, index) => {
                                    const selectable = canShowWorkOrderAcceptAction(item);
                                    return (
                                    <tr
                                        key={item.id}
                                        className={canBatchAccept && selectable ? 'iot-selectable-row' : undefined}
                                        onClick={canBatchAccept && selectable
                                            ? (event) => handleSelectableRowClick(event, () => toggleSelect(item.id))
                                            : undefined}
                                    >
                                        {canBatchAccept ? (
                                            <td className="wom-table__check">
                                                <input
                                                    type="checkbox"
                                                    checked={selectable && selectedIds.includes(item.id)}
                                                    disabled={!selectable}
                                                    onChange={() => toggleSelect(item.id)}
                                                    aria-label={`选择${item.name}`}
                                                />
                                            </td>
                                        ) : null}
                                        <td>{(pagination.currentPage - 1) * Number(pageSize) + index + 1}</td>
                                        <td>{item.id}</td>
                                        <td>{item.name}</td>
                                        <td>{item.level}</td>
                                        <td>{item.type}</td>
                                        <td><WorkOrderStatusCell status={item.status} /></td>
                                        <td>{item.createdAt}</td>
                                        <td><ReadStatusCell status={item.readStatus} /></td>
                                        <td className="wom-content-cell" title={item.content}>{item.content}</td>
                                        <td>{item.space}</td>
                                        <td>{item.closedAt ?? '—'}</td>
                                        <td>
                                            <div className="wom-table-actions">
                                                <button type="button" onClick={() => handleViewDetail(item)}>详情</button>
                                                {canShowWorkOrderProcessAction(item) ? (
                                                    <button type="button" onClick={() => handleOpenProcess(item)}>工单处理</button>
                                                ) : null}
                                                {canShowWorkOrderAcceptAction(item) ? (
                                                    <button type="button" onClick={() => setAcceptTarget(item)}>工单验收</button>
                                                ) : null}
                                            </div>
                                        </td>
                                    </tr>
                                    );
                                })}
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

            <WorkOrderCreateDrawer
                open={createDrawerVisible}
                products={products}
                devices={devices}
                onClose={closeCreateDrawer}
                onSubmit={(workOrder) => {
                    onCreateWorkOrder(workOrder);
                    closeCreateDrawer();
                    showToast(`工单「${workOrder.name}」创建成功`);
                }}
            />

            <WorkOrderProcessDrawer
                open={Boolean(processTarget)}
                workOrder={processTarget}
                onClose={() => setProcessTarget(null)}
                onConfirm={handleProcessWorkOrder}
            />

            <WorkOrderDetailDrawer
                open={detailDrawerVisible}
                workOrder={detailWorkOrder}
                onClose={closeDetailDrawer}
                onAccept={detailWorkOrder && canShowWorkOrderAcceptAction(detailWorkOrder)
                    ? () => setAcceptTarget(detailWorkOrder)
                    : undefined}
            />

            <WorkOrderAcceptDialog
                open={Boolean(acceptTarget)}
                workOrder={acceptTarget}
                onClose={() => setAcceptTarget(null)}
                onConfirm={(payload) => {
                    if (!acceptTarget) return;
                    handleAcceptWorkOrder(acceptTarget, payload);
                }}
            />

            <BatchWorkOrderAcceptDialog
                open={batchAcceptOpen}
                count={selectedAcceptableWorkOrders.length}
                onClose={() => setBatchAcceptOpen(false)}
                onConfirm={handleConfirmBatchAccept}
            />

            <IotToast toast={toast} />
        </AppShell>
    );
}
