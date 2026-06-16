import React, { useEffect, useRef, useState } from 'react';
import type { LegendItem } from './types';

const OUTER_R = 52;
const INNER_R = 35;
const MID_R = (OUTER_R + INNER_R) / 2;
const CIRCUMFERENCE = 2 * Math.PI * MID_R;
const STROKE_WIDTH = OUTER_R - INNER_R;
const SVG_SIZE = 104;

function DonutSegment({
    arcLength,
    startOffset,
    color,
    isHovered,
    isDimmed,
    animated,
    onMouseEnter,
    onMouseLeave,
}: {
    arcLength: number;
    startOffset: number;
    color: string;
    isHovered: boolean;
    isDimmed: boolean;
    animated: boolean;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
}) {
    const offset = -(startOffset + CIRCUMFERENCE * 0.25);
    const targetLen = animated ? arcLength : 0;

    return (
        <circle
            cx="0"
            cy="0"
            r={MID_R}
            fill="none"
            stroke={color}
            strokeWidth={STROKE_WIDTH}
            strokeDasharray={`${targetLen} ${CIRCUMFERENCE - targetLen}`}
            strokeDashoffset={offset}
            strokeLinecap="butt"
            className={`donut-segment${isHovered ? ' is-hovered' : ''}${isDimmed ? ' is-dimmed' : ''}${animated ? ' is-animated' : ''}`}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        />
    );
}

function CountUp({ value, duration = 400 }: { value: number; duration?: number }) {
    const [display, setDisplay] = useState(0);
    const raf = useRef<number>(0);
    const startTime = useRef(0);
    const startValue = useRef(0);

    useEffect(() => {
        startTime.current = 0;
        startValue.current = display;
        const target = value;

        const step = (timestamp: number) => {
            if (!startTime.current) startTime.current = timestamp;
            const elapsed = timestamp - startTime.current;
            const progress = Math.min(elapsed / duration, 1);
            // ease-out
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(startValue.current + (target - startValue.current) * eased);
            setDisplay(current);
            if (progress < 1) {
                raf.current = requestAnimationFrame(step);
            }
        };

        raf.current = requestAnimationFrame(step);
        return () => cancelAnimationFrame(raf.current);
    }, [value, duration]);

    return <strong>{display}</strong>;
}

/** SVG donut with animations and per-segment hover tooltip */
export function DonutChart({
    legend,
    centerLabel,
    size = 104,
}: {
    legend: LegendItem[];
    centerLabel: string;
    size?: number;
}) {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const [animated, setAnimated] = useState(false);

    const total = legend.reduce((sum, item) => sum + item.value, 0);

    let cumulative = 0;
    const segments = legend.map((item) => {
        const arcLength = (item.value / total) * CIRCUMFERENCE;
        const startOffset = (cumulative / total) * CIRCUMFERENCE;
        cumulative += item.value;
        return { ...item, arcLength, startOffset };
    });

    // Trigger enter animation on mount
    useEffect(() => {
        const timer = requestAnimationFrame(() => setAnimated(true));
        return () => cancelAnimationFrame(timer);
    }, []);

    const hovered = hoveredIndex !== null ? segments[hoveredIndex] : null;

    return (
        <div className="donut-wrap" style={{ position: 'relative' }}>
            <svg
                width={size}
                height={size}
                viewBox={`${-OUTER_R} ${-OUTER_R} ${size} ${size}`}
                style={{ overflow: 'visible' }}
            >
                {/* background track */}
                <circle
                    cx="0"
                    cy="0"
                    r={MID_R}
                    fill="none"
                    stroke="#e8edf5"
                    strokeWidth={STROKE_WIDTH}
                    strokeLinecap="butt"
                />
                {segments.map((seg, i) => (
                    <DonutSegment
                        key={seg.label}
                        arcLength={seg.arcLength}
                        startOffset={seg.startOffset}
                        color={seg.color}
                        isHovered={hoveredIndex === i}
                        isDimmed={hoveredIndex !== null && hoveredIndex !== i}
                        animated={animated}
                        onMouseEnter={() => setHoveredIndex(i)}
                        onMouseLeave={() => setHoveredIndex(null)}
                    />
                ))}
            </svg>
            <div
                className="donut-hole"
                style={{
                    position: 'absolute',
                    width: INNER_R * 2 - 4,
                    height: INNER_R * 2 - 4,
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                }}
            >
                <CountUp value={hovered ? hovered.value : total} />
                <span className="donut-hole-label">{hovered ? hovered.label : centerLabel}</span>
            </div>
            {/* Tooltip */}
            <div className={`donut-tooltip${hovered ? ' is-visible' : ''}`}>
                {hovered && (
                    <>
                        <i style={{ backgroundColor: hovered.color }} />
                        <span className="donut-tooltip-label">{hovered.label}</span>
                        <span className="donut-tooltip-value">{hovered.value}</span>
                    </>
                )}
            </div>
        </div>
    );
}

export function LegendList({ items }: { items: LegendItem[] }) {
    return (
        <div className="legend-list">
            {items.map((item) => (
                <div className="legend-item" key={item.label}>
                    <i style={{ backgroundColor: item.color }} />
                    <span className="legend-label">{item.label}</span>
                    <span className="legend-value">{item.value}</span>
                </div>
            ))}
        </div>
    );
}

// ── Legacy CSS donut (used by DonutPanel / AccessOverview) ──

export function Donut({
    value,
    label,
    fill,
}: {
    value: string;
    label: string;
    fill: string;
}) {
    return (
        <div className="donut-wrap">
            <div
                className="donut"
                style={{ '--donut-fill': fill } as React.CSSProperties}
            >
                <div className="donut-hole">
                    <strong>{value}</strong>
                    <span>{label}</span>
                </div>
            </div>
        </div>
    );
}

export function DonutPanel({
    title,
    centerValue,
    centerLabel,
    fill,
    legend,
}: {
    title: string;
    centerValue: string;
    centerLabel: string;
    fill: string;
    legend: LegendItem[];
}) {
    return (
        <section className="panel ao-third-panel work-panel">
            <h3>{title}</h3>
            <div className="work-content">
                <div className="work-chart-group">
                    <Donut value={centerValue} label={centerLabel} fill={fill} />
                    <LegendList items={legend} />
                </div>
            </div>
        </section>
    );
}
