import type { DateRange } from './types';

export const chartMonths = [
    '2025-02', '2025-03', '2025-04', '2025-05', '2025-06', '2025-07',
    '2025-08', '2025-09', '2025-10', '2025-11', '2025-12', '2026-01',
];

export function formatChartValue(value: number) {
    return value.toLocaleString('en-US');
}

export function sliceChartData(values: number[], range: DateRange) {
    return {
        months: chartMonths.slice(range.start, range.end + 1),
        values: values.slice(range.start, range.end + 1),
    };
}

export function indexToMonthParts(index: number) {
    const [year, month] = chartMonths[index].split('-');
    return { year: Number(year), month: Number(month) };
}

export function monthKey(year: number, month: number) {
    return `${year}-${String(month).padStart(2, '0')}`;
}

export function monthIndexFromParts(year: number, month: number) {
    return chartMonths.indexOf(monthKey(year, month));
}

export function buildSmoothPath(points: { x: number; y: number }[]) {
    if (points.length === 0) return '';
    if (points.length === 1) return `M ${points[0].x},${points[0].y}`;

    let path = `M ${points[0].x},${points[0].y}`;
    for (let i = 0; i < points.length - 1; i += 1) {
        const p0 = points[i - 1] ?? points[i];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = points[i + 2] ?? p2;
        const cp1x = p1.x + (p2.x - p0.x) / 6;
        const cp1y = p1.y + (p2.y - p0.y) / 6;
        const cp2x = p2.x - (p3.x - p1.x) / 6;
        const cp2y = p2.y - (p3.y - p1.y) / 6;
        path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
    }
    return path;
}

export function buildSmoothAreaPath(points: { x: number; y: number }[], bottomY: number) {
    if (points.length === 0) return '';
    const linePath = buildSmoothPath(points);
    const last = points[points.length - 1];
    const first = points[0];
    return `${linePath} L ${last.x},${bottomY} L ${first.x},${bottomY} Z`;
}
