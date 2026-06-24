import { mapProductProperty, type DebugPropertyField } from './deviceDebugging';
import type { ProductRecord } from './products';
import { formatDeviceDateTime } from '../utils/deviceTime';

export type DevicePropertyLatestValue = {
    propertyId: string;
    value: string;
    unit: string;
    updatedAt: string;
};

export type DevicePropertyHistoryRecord = {
    id: string;
    reportedAt: string;
    value: string;
    unit: string;
};

export type PropertyChartPoint = {
    label: string;
    value: number;
};

export type PropertyDateRange = {
    start: string;
    end: string;
};

/** 整数、单精度、双精度属性支持折线图 */
export function supportsPropertyLineChart(dataType: string): boolean {
    return dataType === 'int' || dataType === 'float' || dataType === 'double';
}

const MOCK_VALUES: Record<string, string | number | boolean> = {
    flow_rate: 1.28,
    total_flow: 1024.6,
    pressure: 0.42,
    water_temp: 18.5,
    battery: 86,
    valve_status: true,
    signal_strength: -72,
    daily_flow: 2.35,
    turbidity: 0.82,
    ph: 7.2,
    residual_chlorine: 0.45,
    conductivity: 320,
    inlet_pressure: 0.38,
    outlet_flow: 12.6,
    run_status: '运行',
    water_quality_index: 92,
    pump_power: 15.8,
    voltage: 220,
    current: 6,
    power: 45.2,
    temperature: 25.6,
    humidity: 68,
};

function seededRandom(seed: string): number {
    let hash = 0;
    for (let i = 0; i < seed.length; i += 1) {
        hash = ((hash << 5) - hash) + seed.charCodeAt(i);
        hash |= 0;
    }
    const value = Math.sin(hash * 12.9898) * 43758.5453;
    return value - Math.floor(value);
}

function formatPropertyValue(field: DebugPropertyField, deviceKey: string): string {
    const mock = MOCK_VALUES[field.identifier];
    if (mock !== undefined) {
        if (typeof mock === 'boolean') return mock ? '开' : '关';
        return String(mock);
    }

    const seed = `${deviceKey}:${field.identifier}`;
    const random = seededRandom(seed);

    switch (field.dataType) {
        case 'bool':
            return random > 0.5 ? '开' : '关';
        case 'int':
            return String(Math.round(10 + random * 90));
        case 'float':
            return (random * 100).toFixed(random > 0.5 ? 1 : 2);
        case 'enum':
            return ['运行', '待机', '故障'][Math.floor(random * 3)] ?? '—';
        case 'date': {
            const date = new Date();
            date.setMinutes(date.getMinutes() - Math.floor(random * 180));
            return formatDeviceDateTime(date);
        }
        default:
            return random > 0.3 ? `${field.name}数据` : '—';
    }
}

function buildUpdatedAt(deviceKey: string, propertyId: string, offsetMinutes = 0): string {
    const seed = seededRandom(`${deviceKey}:${propertyId}:time`);
    const base = new Date();
    base.setMinutes(base.getMinutes() - Math.floor(seed * 180) - offsetMinutes);
    return formatDeviceDateTime(base);
}

function buildPropertyLatestValue(
    field: DebugPropertyField,
    deviceKey: string,
    offsetMinutes = 0,
): DevicePropertyLatestValue {
    return {
        propertyId: field.id,
        value: formatPropertyValue(field, deviceKey),
        unit: field.unit ?? '',
        updatedAt: buildUpdatedAt(deviceKey, field.id, offsetMinutes),
    };
}

export function buildInitialDevicePropertyData(
    product: ProductRecord,
    deviceKey: string,
): Record<string, DevicePropertyLatestValue> {
    const fields = (product.properties ?? []).map(mapProductProperty);
    return Object.fromEntries(
        fields.map((field, index) => [
            field.id,
            buildPropertyLatestValue(field, deviceKey, index % 5),
        ]),
    );
}

export function refreshDevicePropertyValue(
    field: DebugPropertyField,
    deviceKey: string,
): DevicePropertyLatestValue {
    const seed = `${deviceKey}:${field.id}:${Date.now()}`;
    const random = seededRandom(seed);
    const next: DevicePropertyLatestValue = {
        propertyId: field.id,
        value: formatPropertyValue(field, seed),
        unit: field.unit ?? '',
        updatedAt: formatDeviceDateTime(new Date()),
    };

    if (field.dataType === 'int' || field.dataType === 'float') {
        const numeric = Number(next.value);
        if (Number.isFinite(numeric)) {
            const delta = field.dataType === 'int' ? 1 : 0.1;
            const direction = random > 0.5 ? 1 : -1;
            next.value = field.dataType === 'int'
                ? String(Math.max(0, Math.round(numeric + direction * delta)))
                : Math.max(0, numeric + direction * delta).toFixed(1);
        }
    }

    return next;
}

function formatDateOnly(date: Date): string {
    const pad = (value: number) => String(value).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function parseDateOnly(value: string): Date | null {
    if (!value) return null;
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return null;
    const year = Number(match[1]);
    const month = Number(match[2]) - 1;
    const day = Number(match[3]);
    const date = new Date(year, month, day);
    if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) {
        return null;
    }
    return date;
}

function formatDateTime(date: Date): string {
    const pad = (value: number) => String(value).padStart(2, '0');
    return `${formatDateOnly(date)} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export function getDefaultPropertyDateRange(): PropertyDateRange {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 6);
    return {
        start: formatDateOnly(start),
        end: formatDateOnly(end),
    };
}

export function isDateWithinRange(dateText: string, range: PropertyDateRange): boolean {
    const datePart = dateText.slice(0, 10);
    if (!range.start && !range.end) return true;
    if (range.start && datePart < range.start) return false;
    if (range.end && datePart > range.end) return false;
    return true;
}

function resolveBaseNumericValue(field: DebugPropertyField, deviceKey: string): number {
    const raw = formatPropertyValue(field, deviceKey);
    if (field.dataType === 'bool') {
        return raw === '开' ? 1 : 0;
    }
    const numeric = Number(raw);
    if (Number.isFinite(numeric)) return numeric;
    return 20 + seededRandom(`${deviceKey}:${field.identifier}:base`) * 60;
}

function buildSeriesValue(
    field: DebugPropertyField,
    deviceKey: string,
    timestamp: Date,
    index: number,
): number {
    const base = resolveBaseNumericValue(field, deviceKey);
    const wave = Math.sin(index / 2.4) * base * 0.12;
    const noise = (seededRandom(`${deviceKey}:${field.identifier}:${timestamp.getTime()}`) - 0.5) * base * 0.08;
    const next = base + wave + noise;

    if (field.dataType === 'int') {
        return Math.max(0, Math.round(next));
    }
    return Math.max(0, Number(next.toFixed(field.dataType === 'float' ? 2 : 1)));
}

function formatSeriesLabel(date: Date, withTime: boolean): string {
    if (!withTime) return formatDateOnly(date).slice(5);
    const pad = (value: number) => String(value).padStart(2, '0');
    return `${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:00`;
}

function formatHistoryValue(field: DebugPropertyField, value: number, reportedAt?: string): string {
    if (field.dataType === 'date') return reportedAt ?? '—';
    if (field.dataType === 'bool') return value >= 0.5 ? '开' : '关';
    if (field.dataType === 'int') return String(Math.round(value));
    if (field.dataType === 'float') return value.toFixed(2);
    if (field.dataType === 'enum') {
        const options = ['运行', '待机', '故障'];
        return options[Math.abs(Math.round(value)) % options.length] ?? '—';
    }
    return String(value);
}

function resolveRangeDates(range: PropertyDateRange): { start: Date; end: Date } {
    const now = new Date();
    const end = parseDateOnly(range.end) ?? now;
    const start = parseDateOnly(range.start) ?? new Date(end.getTime() - 6 * 24 * 60 * 60 * 1000);
    end.setHours(23, 59, 59, 999);
    start.setHours(0, 0, 0, 0);
    if (start.getTime() > end.getTime()) {
        return { start: end, end: start };
    }
    return { start, end };
}

export function buildPropertyChartSeries(
    field: DebugPropertyField,
    deviceKey: string,
    range: PropertyDateRange,
): PropertyChartPoint[] {
    const { start, end } = resolveRangeDates(range);
    const daySpan = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)));
    const withTime = daySpan <= 2;
    const targetCount = daySpan <= 2 ? 12 : daySpan <= 7 ? 14 : 7;
    const totalHours = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (60 * 60 * 1000)));
    const stepHours = Math.max(withTime ? 2 : 6, Math.ceil(totalHours / Math.max(targetCount - 1, 1)));
    const points: PropertyChartPoint[] = [];

    const cursor = new Date(start);
    let index = 0;
    while (cursor.getTime() <= end.getTime() && points.length < targetCount) {
        points.push({
            label: formatSeriesLabel(cursor, withTime),
            value: buildSeriesValue(field, deviceKey, cursor, index),
        });
        cursor.setHours(cursor.getHours() + stepHours);
        index += 1;
    }

    if (!points.length) {
        points.push({
            label: formatSeriesLabel(end, withTime),
            value: buildSeriesValue(field, deviceKey, end, 0),
        });
    }

    const lastPoint = points[points.length - 1];
    if (lastPoint && lastPoint.label !== formatSeriesLabel(end, withTime)) {
        points.push({
            label: formatSeriesLabel(end, withTime),
            value: buildSeriesValue(field, deviceKey, end, index),
        });
    }

    return points;
}

export function buildPropertyHistoryRecords(
    field: DebugPropertyField,
    deviceKey: string,
    range: PropertyDateRange,
): DevicePropertyHistoryRecord[] {
    const { start, end } = resolveRangeDates(range);
    const records: DevicePropertyHistoryRecord[] = [];
    const cursor = new Date(end);
    cursor.setMinutes(0, 0, 0);
    let index = 0;

    while (cursor.getTime() >= start.getTime() && records.length < 120) {
        const value = buildSeriesValue(field, deviceKey, cursor, index);
        records.push({
            id: `${field.id}-${cursor.getTime()}`,
            reportedAt: formatDateTime(cursor),
            value: formatHistoryValue(field, value, formatDateTime(cursor)),
            unit: field.unit ?? '',
        });
        cursor.setHours(cursor.getHours() - 2);
        index += 1;
    }

    return records;
}

export function filterPropertyHistoryRecords(
    records: DevicePropertyHistoryRecord[],
    range: PropertyDateRange,
): DevicePropertyHistoryRecord[] {
    return records.filter((record) => isDateWithinRange(record.reportedAt, range));
}
