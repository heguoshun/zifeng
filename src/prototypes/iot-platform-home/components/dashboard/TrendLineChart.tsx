import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { DateRange } from './types';
import {
    chartMonths,
    formatChartValue,
    indexToMonthParts,
    monthIndexFromParts,
    buildSmoothAreaPath,
    buildSmoothPath,
    sliceChartData,
} from './chartUtils';

function MonthPickerPanel({
    title,
    year,
    selectedIndex,
    onSelect,
}: {
    title: string;
    year: number;
    selectedIndex: number | null;
    onSelect: (index: number) => void;
}) {
    return (
        <div className="month-picker-panel">
            <div className="month-picker-panel__title">{title}</div>
            <div className="month-picker-grid">
                {Array.from({ length: 12 }, (_, index) => {
                    const month = index + 1;
                    const monthIndex = monthIndexFromParts(year, month);
                    const disabled = monthIndex < 0;
                    const selected = monthIndex === selectedIndex;

                    return (
                        <button
                            key={month}
                            type="button"
                            className={[
                                'month-picker-cell',
                                disabled ? 'is-disabled' : '',
                                selected ? 'is-selected' : '',
                            ].filter(Boolean).join(' ')}
                            disabled={disabled}
                            onClick={() => {
                                if (monthIndex >= 0) onSelect(monthIndex);
                            }}
                        >
                            {month}月
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export function ChartToolbar({
    range,
    onChange,
}: {
    range: DateRange;
    onChange: (range: DateRange) => void;
}) {
    const [open, setOpen] = useState(false);
    const [startYear, setStartYear] = useState(() => indexToMonthParts(range.start).year);
    const [endYear, setEndYear] = useState(() => indexToMonthParts(range.end).year);
    const [draftStart, setDraftStart] = useState(range.start);
    const [draftEnd, setDraftEnd] = useState(range.end);
    const wrapRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setStartYear(indexToMonthParts(range.start).year);
        setEndYear(indexToMonthParts(range.end).year);
        setDraftStart(range.start);
        setDraftEnd(range.end);
    }, [range.end, range.start]);

    useEffect(() => {
        if (!open) return undefined;

        const handleClickOutside = (event: MouseEvent) => {
            if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [open]);

    const handleMonthPick = (index: number, side: 'start' | 'end') => {
        if (side === 'start') {
            const nextStart = index;
            const nextEnd = index > draftEnd ? index : draftEnd;
            setDraftStart(nextStart);
            setDraftEnd(nextEnd);
            onChange({ start: nextStart, end: nextEnd });
            return;
        }

        if (index < draftStart) {
            setDraftStart(index);
            setDraftEnd(index);
            onChange({ start: index, end: index });
            return;
        }

        setDraftEnd(index);
        onChange({ start: draftStart, end: index });
    };

    return (
        <div className={`el-select el-select--daterange el-select--medium ${open ? 'is-open' : ''}`} ref={wrapRef}>
            <button
                type="button"
                className="el-select__wrapper"
                onClick={() => setOpen((prev) => !prev)}
            >
                <span className="el-select__selected">
                    {chartMonths[range.start]}
                    <span className="el-select__range-sep"> ~ </span>
                    {chartMonths[range.end]}
                </span>
                <ChevronDown size={12} className="el-select__caret" />
            </button>
            {open && (
                <div className="el-select-dropdown el-select-dropdown--daterange">
                    <div className="month-picker-header">
                        <div className="month-picker-year">
                            <button type="button" onClick={() => setStartYear((y) => y - 1)} aria-label="上一年">‹</button>
                            <span>{startYear}年</span>
                            <button type="button" onClick={() => setStartYear((y) => y + 1)} aria-label="下一年">›</button>
                        </div>
                        <div className="month-picker-year">
                            <button type="button" onClick={() => setEndYear((y) => y - 1)} aria-label="上一年">‹</button>
                            <span>{endYear}年</span>
                            <button type="button" onClick={() => setEndYear((y) => y + 1)} aria-label="下一年">›</button>
                        </div>
                    </div>
                    <div className="month-picker-body">
                        <MonthPickerPanel
                            title="开始月份"
                            year={startYear}
                            selectedIndex={draftStart}
                            onSelect={(index) => handleMonthPick(index, 'start')}
                        />
                        <MonthPickerPanel
                            title="结束月份"
                            year={endYear}
                            selectedIndex={draftEnd}
                            onSelect={(index) => handleMonthPick(index, 'end')}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

export function LineChart({
    compact = false,
    chartMonths,
    chartValues,
    gradientKey = 'default',
    maxValue,
    valueSuffix = '条',
}: {
    compact?: boolean;
    chartValues: number[];
    chartMonths: string[];
    gradientKey?: string;
    maxValue?: number;
    valueSuffix?: string;
}) {
    const [hoverIndex, setHoverIndex] = useState<number | null>(null);
    const [lineAnimated, setLineAnimated] = useState(false);
    const plotRef = useRef<HTMLDivElement>(null);
    const width = 640;
    const height = 148;
    const bottomY = height - 14;
    const resolvedMax = maxValue ?? (compact ? 150000 : 300000);
    const points = chartValues.map((v, index) => {
        const x = 24 + index * ((width - 48) / Math.max(chartValues.length - 1, 1));
        const y = height - 16 - (v / 100) * (height - 32);
        return { x, y, v, month: chartMonths[index] };
    });
    const smoothLinePath = buildSmoothPath(points);
    const smoothAreaPath = buildSmoothAreaPath(points, bottomY);
    const gradientId = compact ? `areaGradientCompact-${gradientKey}` : `areaGradient-${gradientKey}`;
    const clipId = compact ? `plotClipCompact-${gradientKey}` : `plotClip-${gradientKey}`;
    const yTicks = compact
        ? ['150,000', '120,000', '90,000', '60,000', '30,000', '0']
        : ['300,000', '250,000', '200,000', '150,000', '100,000', '50,000', '0'];
    const activePoint = hoverIndex !== null ? points[hoverIndex] : null;

    // Trigger line-draw animation on mount
    useEffect(() => {
        const timer = setTimeout(() => setLineAnimated(true), 100);
        return () => clearTimeout(timer);
    }, []);

    const handlePointerMove = (event: React.MouseEvent<HTMLDivElement>) => {
        if (points.length === 0 || !plotRef.current) return;
        const rect = plotRef.current.getBoundingClientRect();
        const relativeX = ((event.clientX - rect.left) / rect.width) * width;
        const nearest = points.reduce((best, point, index) => {
            const distance = Math.abs(point.x - relativeX);
            return distance < best.distance ? { index, distance } : best;
        }, { index: 0, distance: Number.POSITIVE_INFINITY });
        setHoverIndex(nearest.index);
    };

    return (
        <div className="line-chart">
            <div className="y-axis">
                {yTicks.map((tick) => (
                    <span key={tick}>{tick}</span>
                ))}
            </div>
            <div className="chart-canvas">
                <div
                    className="chart-plot"
                    ref={plotRef}
                    onMouseMove={handlePointerMove}
                    onMouseLeave={() => setHoverIndex(null)}
                >
                    <svg
                        className="chart-plot-svg"
                        viewBox={`0 0 ${width} ${height}`}
                        preserveAspectRatio="none"
                        aria-hidden="true"
                    >
                        <defs>
                            <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
                                <stop offset="0" stopColor="#8eb8f0" stopOpacity="0.55" />
                                <stop offset="1" stopColor="#eaf3ff" stopOpacity="0.08" />
                            </linearGradient>
                            <clipPath id={clipId}>
                                <rect x="24" y="12" width={width - 48} height={height - 26} />
                            </clipPath>
                        </defs>
                        {[0.18, 0.35, 0.52, 0.69, 0.86].map((ratio) => (
                            <line
                                key={ratio}
                                x1="24"
                                x2={width - 24}
                                y1={height * ratio}
                                y2={height * ratio}
                                className="grid-line"
                            />
                        ))}
                        {activePoint && (
                            <line
                                x1={activePoint.x}
                                x2={activePoint.x}
                                y1={16}
                                y2={bottomY}
                                className="chart-hover-line"
                            />
                        )}
                        <path
                            d={smoothAreaPath}
                            fill={`url(#${gradientId})`}
                            clipPath={`url(#${clipId})`}
                            className={`chart-area${lineAnimated ? ' is-animated' : ''}`}
                        />
                        <path
                            d={smoothLinePath}
                            fill="none"
                            stroke="#5a86c9"
                            strokeWidth="1.4"
                            clipPath={`url(#${clipId})`}
                            className={`chart-line${lineAnimated ? ' is-animated' : ''}`}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                    <div className="chart-markers" aria-hidden="true">
                        {points.map((point, index) => (
                            <button
                                key={point.month}
                                type="button"
                                className={`chart-marker${hoverIndex === index ? ' is-active' : ''}`}
                                style={{
                                    left: `${(point.x / width) * 100}%`,
                                    top: `${(point.y / height) * 100}%`,
                                }}
                                onMouseEnter={() => setHoverIndex(index)}
                                onFocus={() => setHoverIndex(index)}
                            />
                        ))}
                    </div>
                    <div
                        className={`chart-tooltip${activePoint ? ' is-visible' : ''}`}
                        style={
                            activePoint
                                ? {
                                      left: `${(activePoint.x / width) * 100}%`,
                                      top: `${(activePoint.y / height) * 100}%`,
                                  }
                                : undefined
                        }
                    >
                        {activePoint && (
                            <>
                                <span>{activePoint.month}</span>
                                <strong>{formatChartValue(Math.round((activePoint.v / 100) * resolvedMax))} {valueSuffix}</strong>
                            </>
                        )}
                    </div>
                </div>
                <div className="x-axis">
                    {chartMonths.map((month) => (
                        <span key={month}>{month}</span>
                    ))}
                </div>
            </div>
        </div>
    );
}

export function ChartPanel({
    title,
    children,
    toolbar = false,
    wide = false,
    third = false,
    unitLabel = '单位：万条',
    range,
    onRangeChange,
}: {
    title: string;
    children: React.ReactNode;
    toolbar?: boolean;
    wide?: boolean;
    third?: boolean;
    unitLabel?: string;
    range?: DateRange;
    onRangeChange?: (range: DateRange) => void;
}) {
    const panelClass = third
        ? 'ao-third-panel chart-panel'
        : `panel chart-panel ${wide ? 'chart-panel-wide' : 'chart-panel-narrow'}`;

    return (
        <section className={panelClass}>
            <div className="panel-head">
                <div className="panel-title-group">
                    <h3>{title}</h3>
                    {unitLabel && <p>{unitLabel}</p>}
                </div>
                {toolbar && range && onRangeChange && (
                    <ChartToolbar range={range} onChange={onRangeChange} />
                )}
            </div>
            <div className="chart-body">{children}</div>
        </section>
    );
}

export function TrendChartPanel({
    title,
    compact = false,
    values,
    gradientKey = 'default',
    unitLabel = '单位：万条',
    valueSuffix = '条',
    maxValue,
}: {
    title: string;
    compact?: boolean;
    values: number[];
    gradientKey?: string;
    unitLabel?: string;
    valueSuffix?: string;
    maxValue?: number;
}) {
    const [range, setRange] = useState<DateRange>({ start: 0, end: chartMonths.length - 1 });
    const { months: slicedMonths, values: chartValues } = sliceChartData(values, range);

    return (
        <ChartPanel title={title} toolbar wide range={range} onRangeChange={setRange} unitLabel={unitLabel}>
            <LineChart
                compact={compact}
                chartMonths={slicedMonths}
                chartValues={chartValues}
                gradientKey={gradientKey}
                maxValue={maxValue}
                valueSuffix={valueSuffix}
            />
        </ChartPanel>
    );
}
