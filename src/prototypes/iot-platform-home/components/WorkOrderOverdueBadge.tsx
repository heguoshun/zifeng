import React from 'react';
import {
    resolveWorkOrderOverdueInfo,
    type WorkOrderRecord,
} from '../data/workOrders';
import '../work-order-management.css';

type WorkOrderOverdueBadgeProps = {
    workOrder: WorkOrderRecord;
    emptyPlaceholder?: string;
};

export default function WorkOrderOverdueBadge({
    workOrder,
    emptyPlaceholder = '—',
}: WorkOrderOverdueBadgeProps) {
    const overdue = resolveWorkOrderOverdueInfo(workOrder);

    if (overdue.label === '—') {
        return <span className="wom-overdue-cell">{emptyPlaceholder}</span>;
    }

    const tone = overdue.status === 'active'
        ? 'active'
        : overdue.status === 'closed'
            ? 'closed'
            : 'normal';

    return (
        <span
            className={`wom-overdue-badge wom-overdue-badge--${tone}`}
            title={overdue.hint}
        >
            {overdue.label}
        </span>
    );
}
