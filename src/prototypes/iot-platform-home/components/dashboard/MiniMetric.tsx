import React from 'react';
import { RadioTower } from 'lucide-react';
import type { Metric } from './types';

export default function MiniMetric({ item }: { item: Metric }) {
    return (
        <div className={`metric-card metric-${item.tone}`}>
            <div className="metric-text">
                <span>{item.label}</span>
                <strong>{item.value}</strong>
            </div>
            <RadioTower className="metric-icon" size={28} strokeWidth={1.3} />
        </div>
    );
}
