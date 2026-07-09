import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Search } from 'lucide-react';
import ElDateRangePicker from './ElDateRangePicker';
import type { DebugPropertyField } from '../data/deviceDebugging';
import {
    buildPropertyChartSeries,
    getDefaultPropertyDateRange,
    type PropertyChartPoint,
    type PropertyDateRange,
} from '../data/devicePropertyData';
import { buildSmoothAreaPath, buildSmoothPath } from './dashboard/chartUtils';
import '../product-create.css';

type DevicePropertyLineChartDrawerProps = {
    open: boolean;
    field: DebugPropertyField | null;
    deviceKey: string;
    onClose: () => void;
};

const CHART_WIDTH = 880;
const CHART_HEIGHT = 260;
const CHART_PADDING = { left: 52, right: 24, top: 16, bottom: 36 };
const MAX_X_LABELS = 7;

function fieldTickLabel(value: number): string {
    if (value >= 1000) return value.toLocaleString('en-US', { maximumFractionDigits: 0 });
    if (Number.isInteger(value)) return String(value);
    return value.toFixed(1);
}

function buildXAxisLabels(points: PropertyChartPoint[]): { index: number; label: string }[] {
    if (points.length <= MAX_X_LABELS) {
        return points.map((point, index) => ({ index, label: point.label }));
    }

    return Array.from({ length: MAX_X_LABELS }, (_, labelIndex) => {
        const index = Math.round((labelIndex / (MAX_X_LABELS - 1)) * (points.length - 1));
        return { index, label: points[index].label };
    });
}

function PropertyTrendChart({
    points,
    unit,
}: {
    points: PropertyChartPoint[];
    unit: string;
}) {
    const plotRef = useRef<HTMLDivElement>(null);
    const [hoverIndex, setHoverIndex] = useState<number | null>(null);
    const plotWidth = CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right;
    const plotHeight = CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom;
    const bottomY = CHART_HEIGHT - CHART_PADDING.bottom;

    const values = points.map((item) => item.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const valueSpan = Math.max(maxValue - minValue, maxValue * 0.2, 1);
    const chartMin = Math.max(0, minValue - valueSpan * 0.15);
    const chartMax = maxValue + valueSpan * 0.15;

    const chartPoints = points.map((item, index) => {
        const x = CHART_PADDING.left + index * (plotWidth / Math.max(points.length - 1, 1));
        const ratio = (item.value - chartMin) / (chartMax - chartMin || 1);
        const y = CHART_PADDING.top + (1 - ratio) * plotHeight;
        return { x, y, value: item.value, label: item.label };
    });

    const smoothLinePath = buildSmoothPath(chartPoints);
    const smoothAreaPath = buildSmoothAreaPath(chartPoints, bottomY);
    const yTickValues = Array.from({ length: 5 }, (_, index) => (
        chartMax - ((chartMax - chartMin) / 4) * index
    ));
    const xAxisLabels = buildXAxisLabels(points);
    const activePoint = hoverIndex !== null ? chartPoints[hoverIndex] : null;

    const handlePlotMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
        if (!plotRef.current || chartPoints.length <= 1) {
            setHoverIndex(0);
            return;
        }

        const rect = plotRef.current.getBoundingClientRect();
        const ratio = (event.clientX - rect.left) / rect.width;
        const index = Math.round(ratio * (chartPoints.length - 1));
        setHoverIndex(Math.max(0, Math.min(chartPoints.length - 1, index)));
    };

    return (
        <div className="dcp-prop-chart">
            {unit ? <div className="dcp-prop-chart__unit">单位：{unit}</div> : null}
            <div className="dcp-prop-chart__canvas">
                <div
                    className="chart-plot dcp-prop-chart__plot"
                    ref={plotRef}
                    onMouseMove={handlePlotMouseMove}
                    onMouseLeave={() => setHoverIndex(null)}
                >
                    <svg
                        className="chart-plot-svg dcp-prop-chart__svg"
                        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
                        preserveAspectRatio="xMidYMid meet"
                    >
                        <defs>
                            <linearGradient id="dcpPropAreaGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#1890ff" stopOpacity="0.22" />
                                <stop offset="100%" stopColor="#1890ff" stopOpacity="0.02" />
                            </linearGradient>
                        </defs>
                        {yTickValues.map((tickValue, index) => {
                            const y = CHART_PADDING.top + index * (plotHeight / 4);
                            return (
                                <g key={index}>
                                    <line
                                        x1={CHART_PADDING.left}
                                        y1={y}
                                        x2={CHART_WIDTH - CHART_PADDING.right}
                                        y2={y}
                                        stroke="#eef2f6"
                                        strokeWidth="1"
                                        vectorEffect="non-scaling-stroke"
                                    />
                                    <text
                                        x={CHART_PADDING.left - 8}
                                        y={y + 4}
                                        textAnchor="end"
                                        className="dcp-prop-chart__axis-label"
                                    >
                                        {fieldTickLabel(tickValue)}
                                    </text>
                                </g>
                            );
                        })}
                        <path d={smoothAreaPath} fill="url(#dcpPropAreaGradient)" />
                        <path
                            d={smoothLinePath}
                            fill="none"
                            stroke="#1890ff"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            vectorEffect="non-scaling-stroke"
                        />
                        {xAxisLabels.map(({ index, label }) => (
                            <text
                                key={`${index}-${label}`}
                                x={chartPoints[index].x}
                                y={CHART_HEIGHT - 10}
                                textAnchor="middle"
                                className="dcp-prop-chart__axis-label"
                            >
                                {label}
                            </text>
                        ))}
                        {activePoint && (
                            <>
                                <line
                                    x1={activePoint.x}
                                    y1={CHART_PADDING.top}
                                    x2={activePoint.x}
                                    y2={bottomY}
                                    stroke="#91caff"
                                    strokeWidth="1"
                                    strokeDasharray="4 4"
                                    vectorEffect="non-scaling-stroke"
                                />
                                <circle
                                    cx={activePoint.x}
                                    cy={activePoint.y}
                                    r="4"
                                    fill="#fff"
                                    stroke="#1890ff"
                                    strokeWidth="2"
                                    vectorEffect="non-scaling-stroke"
                                />
                            </>
                        )}
                    </svg>
                    {activePoint && (
                        <div
                            className="chart-tooltip is-visible"
                            style={{
                                left: `${(activePoint.x / CHART_WIDTH) * 100}%`,
                                top: `${(activePoint.y / CHART_HEIGHT) * 100}%`,
                            }}
                        >
                            <span>{activePoint.label}</span>
                            <strong>{activePoint.value}{unit ? ` ${unit}` : ''}</strong>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function DevicePropertyLineChartDrawer({
    open,
    field,
    deviceKey,
    onClose,
}: DevicePropertyLineChartDrawerProps) {
    const defaultRange = useMemo(() => getDefaultPropertyDateRange(), []);
    const [draftRange, setDraftRange] = useState<PropertyDateRange>(defaultRange);
    const [range, setRange] = useState<PropertyDateRange>(defaultRange);

    useEffect(() => {
        if (!open) return undefined;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const nextRange = getDefaultPropertyDateRange();
        setDraftRange(nextRange);
        setRange(nextRange);
    }, [open, field?.id]);

    const chartPoints = useMemo(() => {
        if (!field || !deviceKey) return [];
        return buildPropertyChartSeries(field, deviceKey, range);
    }, [field, deviceKey, range]);

    if (!open || !field) return null;

    const handleMaskMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
        if (event.target === event.currentTarget) {
            onClose();
        }
    };

    return createPortal(
        <div className="pcp-drawer-mask" role="presentation" onMouseDown={handleMaskMouseDown}>
            <aside
                className="pcp-drawer dcp-prop-drawer"
                role="dialog"
                aria-modal="true"
                aria-labelledby="dcp-prop-chart-title"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <div className="pcp-drawer__head">
                    <h3 id="dcp-prop-chart-title">{field.name} - 折线图</h3>
                    <button type="button" className="pcp-drawer__close" onClick={onClose} aria-label="关闭">
                        ×
                    </button>
                </div>
                <div className="pcp-drawer__body dcp-prop-drawer__body">
                    <div className="dcp-prop-drawer-filter">
                        <div className="dcp-prop-drawer-filter__field">
                            <span>时间范围</span>
                            <ElDateRangePicker
                                size="medium"
                                start={draftRange.start}
                                end={draftRange.end}
                                onChange={(nextRange) => setDraftRange(nextRange)}
                            />
                        </div>
                        <div className="dcp-prop-drawer-filter__actions">
                            <button
                                type="button"
                                className="pm-btn pm-btn-primary"
                                onClick={() => setRange(draftRange)}
                            >
                                <Search size={14} />
                                查询
                            </button>
                            <button
                                type="button"
                                className="pm-btn pm-btn-ghost"
                                onClick={() => {
                                    const nextRange = getDefaultPropertyDateRange();
                                    setDraftRange(nextRange);
                                    setRange(nextRange);
                                }}
                            >
                                重置
                            </button>
                        </div>
                    </div>

                    {chartPoints.length ? (
                        <PropertyTrendChart points={chartPoints} unit={field.unit ?? ''} />
                    ) : (
                        <div className="dcp-prop-drawer-empty">所选时间范围内暂无数据</div>
                    )}
                </div>
            </aside>
        </div>,
        document.body,
    );
}
