import React, { useEffect, useState } from 'react';
import type { BarData } from './types';

function BarTooltip({ label, value }: { label: string; value: number }) {
    return (
        <div className="bar-tooltip">
            <span className="bar-tooltip-label">{label}</span>
            <span className="bar-tooltip-value">{value}</span>
        </div>
    );
}

export default function BarChart({ bars }: { bars: BarData[] }) {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setMounted(true), 80);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="bar-chart">
            <div className="bar-grid">
                {[1000, 800, 600, 400, 200, 0].map((tick) => (
                    <span key={tick}>{tick}</span>
                ))}
            </div>
            <div className="bars">
                {bars.map((bar, i) => (
                    <div
                        className="bar-column"
                        key={bar.label}
                        onMouseEnter={() => setHoveredIndex(i)}
                        onMouseLeave={() => setHoveredIndex(null)}
                    >
                        <BarTooltip label={bar.label} value={bar.value} />
                        <div className="bar-track">
                            <div
                                className={`bar-fill${hoveredIndex === i ? ' is-hovered' : ''}`}
                                style={{
                                    height: mounted ? `${bar.value}%` : '0%',
                                }}
                            />
                        </div>
                        <span>{bar.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
