import React from 'react';

type StatusBadgeProps = {
    label: string;
    tone?: 'primary' | 'danger' | 'warning' | 'success' | 'muted';
};

export default function StatusBadge({ label, tone = 'muted' }: StatusBadgeProps) {
    return <span className={`dma-badge is-${tone}`}>{label}</span>;
}
