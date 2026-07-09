import React, { useMemo, useState } from 'react';
import { ChevronRight, ClipboardList, Search } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import type { WorkOrderRecord } from '../../iot-platform-home/data/workOrders';
import { toMobileWorkOrderStatus } from '../data/appData';

type WorkOrderListPageProps = {
    workOrders: WorkOrderRecord[];
    initialFilter?: 'pending' | 'processing' | 'completed' | 'all';
    onOpenWorkOrder: (workOrderId: string) => void;
};

const FILTERS = [
    { id: 'all', label: '全部' },
    { id: 'pending', label: '待接单' },
    { id: 'processing', label: '处理中' },
    { id: 'completed', label: '已完成' },
] as const;

function statusLabel(workOrder: WorkOrderRecord) {
    const status = toMobileWorkOrderStatus(workOrder);
    if (status === 'pending') return '待接单';
    if (status === 'processing') return '处理中';
    return '已完成';
}

function statusTone(workOrder: WorkOrderRecord) {
    const status = toMobileWorkOrderStatus(workOrder);
    if (status === 'pending') return 'warning';
    if (status === 'processing') return 'primary';
    return 'success';
}

export default function WorkOrderListPage({
    workOrders,
    initialFilter = 'all',
    onOpenWorkOrder,
}: WorkOrderListPageProps) {
    const [query, setQuery] = useState('');
    const [filter, setFilter] = useState(initialFilter);

    const filtered = useMemo(() => {
        return workOrders.filter((item) => {
            const mobileStatus = toMobileWorkOrderStatus(item);
            if (filter !== 'all' && mobileStatus !== filter) return false;
            if (!query.trim()) return true;
            const keyword = query.trim().toLowerCase();
            return item.name.toLowerCase().includes(keyword) || item.content.toLowerCase().includes(keyword);
        });
    }, [workOrders, filter, query]);

    return (
        <div className="dma-page-content">
                <div className="dma-search-bar">
                    <Search size={16} color="#8c9bab" />
                    <input
                        placeholder="搜索工单名称或内容"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                    />
                </div>
                <div className="dma-filter-row">
                    {FILTERS.map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            className={`dma-filter-chip${filter === item.id ? ' is-active' : ''}`}
                            onClick={() => setFilter(item.id)}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
                {filtered.length === 0 ? (
                    <div className="dma-empty">暂无匹配工单</div>
                ) : (
                    filtered.map((item) => (
                        <article
                            key={item.id}
                            className="dma-list-card"
                            onClick={() => onOpenWorkOrder(item.id)}
                            role="button"
                            tabIndex={0}
                        >
                            <span className={`dma-list-avatar tone-${statusTone(item)}`}>
                                <ClipboardList size={18} />
                            </span>
                            <div className="dma-list-main">
                                <div className="dma-list-top">
                                    <h3>{item.name}</h3>
                                    <StatusBadge label={statusLabel(item)} tone={statusTone(item)} />
                                </div>
                                <p>{item.type} · {item.space}</p>
                                <p className="dma-list-sub">{item.content}</p>
                                <time className="dma-list-time">{item.createdAt.slice(5, 16)}</time>
                            </div>
                            <ChevronRight size={18} className="dma-list-arrow" />
                        </article>
                    ))
                )}
            </div>
    );
}
