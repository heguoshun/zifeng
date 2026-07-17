import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as echarts from 'echarts/core';
import type { EChartsCoreOption } from 'echarts/core';
import { BarChart as EChartsBarChart, LineChart as EChartsLineChart } from 'echarts/charts';
import { AxisPointerComponent, DataZoomComponent, GridComponent, LegendComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { ArrowDownRight, ArrowLeft, ArrowUpRight, Clock3, Download, Droplets, List, MapPin, Search, TrendingUp } from 'lucide-react';
import AppShell from '../components/AppShell';
import Breadcrumb from '../components/Breadcrumb';
import ElDateRangePicker from '../components/ElDateRangePicker';
import ElDateTimePicker from '../components/ElDateTimePicker';
import ElMonthRangePicker from '../components/ElMonthRangePicker';
import LargeMeterSidebar, { type LargeMeterPageId } from '../components/LargeMeterSidebar';
import ListPagination from '../components/ListPagination';
import AlarmDetailModal from '../components/AlarmDetailModal';
import ConvertWorkOrderModal, { type ConvertWorkOrderForm } from '../components/ConvertWorkOrderModal';
import { AlarmLevelCell, ProcessStatusCell, ReadStatusCell } from '../components/DeviceAlarmTableCells';
import IotToast, { type IotToastData, type IotToastType, triggerIotToast } from '../components/IotToast';
import type { LargeMeterArea, LargeMeterDevice } from '../data/largeMeters';
import { getAreaName, getMeterDisplayStatus, resolveRemoteManufacturer } from '../data/largeMeters';
import type { ProductRecord } from '../data/products';
import type { DeviceRecord } from '../data/devices';
import { DEFAULT_LIST_PAGE_SIZE, paginateItems } from '../utils/listPagination';
import { IOT_AXIS_TOOLTIP } from '../utils/echartsChartTheme';
import {
    filterAlarmsByDevice,
    normalizeDeviceAlarm,
    resolveAlarmProductName,
    resolveAlarmTriggerContent,
    resolveAlarmTriggerContentListDisplay,
    type DeviceAlarmRecord,
} from '../data/deviceAlarms';
import { createWorkOrderFromAlarm, type WorkOrderRecord } from '../data/workOrders';
import type { AlarmLevelRecord } from '../data/alarmLevels';
import { BAIDU_MAP_AK } from '../config/baiduMap';
import {
    DEFAULT_NIGHTLY_PERIOD,
    formatNightlyFieldLabels,
    formatNightlyPeriod,
    type NightlyPeriod,
    type NightlyWaterUsageConfig,
} from '../data/nightlyWaterUsageConfig';
import { loadBaiduMap } from '../utils/loadBaiduMap';
import '../device-access.css';
import '../product-management.css';
import '../product-create.css';
import '../large-meter.css';
import '../device-alarm-info.css';
import '../water-usage-analysis.css';

echarts.use([EChartsBarChart, EChartsLineChart, GridComponent, LegendComponent, TooltipComponent, AxisPointerComponent, DataZoomComponent, CanvasRenderer]);

type AnalysisTab = 'history' | 'daily' | 'monthly' | 'hourly' | 'nightly' | 'alarm';

type TabContentView = 'chart' | 'detail';

type MonitorRecord = {
    date: string;
    readAt: string;
    cumulativeReading: number;
    forwardAccumulation: number;
    reverseAccumulation: number;
    batteryVoltage: number;
    signalStrength: number;
    dailyUsage: number;
    monthlyUsage: number;
    hourlyUsage: number;
    nightlyUsage: number;
    alarmCount: number;
};

type HourlyRecord = {
    readAt: string;
    hourlyUsage: number;
};

type MonthlyRecord = {
    month: string;
    monthlyUsage: number;
};

type NightlyRecord = {
    date: string;
    dataTime: string;
    period: string;
    nightlyUsage: number;
    dailyUsage: number;
    ratio: number;
    peakFlow: number;
    peakHour: string;
    valleyFlow: number;
    valleyHour: string;
    isAbnormal: boolean;
};

type WaterUsageAnalysisPageProps = {
    meter: LargeMeterDevice;
    nightlyConfig: NightlyWaterUsageConfig;
    areas: LargeMeterArea[];
    products: ProductRecord[];
    devices: DeviceRecord[];
    deviceAlarms: DeviceAlarmRecord[];
    alarmLevels?: AlarmLevelRecord[];
    onUpdateAlarms: React.Dispatch<React.SetStateAction<DeviceAlarmRecord[]>>;
    onCreateWorkOrder?: (workOrder: WorkOrderRecord) => void;
    onViewWorkOrder?: (workOrderId: string) => void;
    onBack: () => void;
    onNavigateDeviceAccess: () => void;
    onNavigate: (pageId: LargeMeterPageId) => void;
    onNavigateMessageCenter?: () => void;
    onNavigateAlarmWorkOrder?: () => void;
    onNavigateSystemManagement?: () => void;
    onNavigateLargeMeterCenter?: () => void;
};

const DEFAULT_RANGE = { start: '2026-05-18', end: '2026-06-17' };

const _today = new Date();
const _yesterday = new Date(_today);
_yesterday.setDate(_today.getDate() - 1);
const _pad = (n: number) => String(n).padStart(2, '0');
const HOURLY_DEFAULT = `${_yesterday.getFullYear()}-${_pad(_yesterday.getMonth() + 1)}-${_pad(_yesterday.getDate())}`;
const DEFAULT_HOURLY_RANGE = { start: HOURLY_DEFAULT, end: HOURLY_DEFAULT };
const DEFAULT_MONTHLY_RANGE = { start: '2025-07', end: '2026-06' };

const TAB_LABELS: Record<AnalysisTab, string> = {
    history: '历史数据',
    daily: '日用水',
    monthly: '月用水',
    hourly: '时用水',
    nightly: '夜间用水',
    alarm: '报警数据',
};

const TAB_ORDER: AnalysisTab[] = ['history', 'daily', 'monthly', 'hourly', 'nightly', 'alarm'];

const METRIC_STYLES: Record<Exclude<AnalysisTab, 'alarm' | 'history'>, { seedOffset: number; color: string; baseRatio: number }> = {
    daily: { seedOffset: 17, color: '#1890ff', baseRatio: 1 },
    monthly: { seedOffset: 23, color: '#fa8c16', baseRatio: 1 },
    hourly: { seedOffset: 41, color: '#13c2c2', baseRatio: 0.15 },
    nightly: { seedOffset: 31, color: '#2f8f83', baseRatio: 0.3 },
};

type NightlyDateTimeRange = { start: string; end: string };

type NightlyRangePreset = 'yesterday' | 'month' | 'year' | 'custom';

const NIGHTLY_RANGE_PRESETS: { key: Exclude<NightlyRangePreset, 'custom'>; label: string }[] = [
    { key: 'yesterday', label: '昨日' },
    { key: 'month', label: '本月' },
    { key: 'year', label: '本年' },
];

function formatDateOnly(date: Date) {
    return `${date.getFullYear()}-${_pad(date.getMonth() + 1)}-${_pad(date.getDate())}`;
}

function addDays(dateStr: string, days: number) {
    const next = new Date(`${dateStr}T00:00:00`);
    next.setDate(next.getDate() + days);
    return formatDateOnly(next);
}

function isCrossMidnightPeriod(period: NightlyPeriod) {
    return period.start > period.end;
}

function buildNightlyHourLabels(period: NightlyPeriod) {
    const startHour = Number.parseInt(period.start.slice(0, 2), 10);
    const endHour = Number.parseInt(period.end.slice(0, 2), 10);
    const labels: string[] = [];
    let hour = startHour;
    for (let index = 0; index < 25; index += 1) {
        labels.push(`${String(hour).padStart(2, '0')}:00`);
        if (hour === endHour) break;
        hour = (hour + 1) % 24;
    }
    return labels;
}

function buildNightlyDateTimeBoundary(nightDate: string, period: NightlyPeriod, boundary: 'start' | 'end') {
    if (boundary === 'start') {
        return `${nightDate} ${period.start}:00`;
    }
    const endDate = isCrossMidnightPeriod(period) ? addDays(nightDate, 1) : nightDate;
    return `${endDate} ${period.end}:00`;
}

function buildNightlyPresetRange(
    preset: Exclude<NightlyRangePreset, 'custom'>,
    period: NightlyPeriod,
    ref = new Date(),
): NightlyDateTimeRange {
    const yesterday = new Date(ref);
    yesterday.setDate(ref.getDate() - 1);
    const yesterdayStr = formatDateOnly(yesterday);

    let startNightDate = yesterdayStr;
    if (preset === 'month') {
        startNightDate = `${ref.getFullYear()}-${_pad(ref.getMonth() + 1)}-01`;
    } else if (preset === 'year') {
        startNightDate = `${ref.getFullYear()}-01-01`;
    }

    return {
        start: buildNightlyDateTimeBoundary(startNightDate, period, 'start'),
        end: buildNightlyDateTimeBoundary(yesterdayStr, period, 'end'),
    };
}

function dateRangeFromNightlyDateTime(range: NightlyDateTimeRange) {
    const start = range.start.slice(0, 10);
    const endTime = range.end.match(/\s+(\d{2}:\d{2})/)?.[1] ?? '23:59';
    let end = range.end.slice(0, 10);
    if (endTime <= '12:00') {
        end = addDays(end, -1);
    }
    return start <= end ? { start, end } : { start: end, end: start };
}

function formatNightlyDateTimeDisplay(value: string) {
    if (!value) return value;
    return value.length === 16 ? `${value}:00` : value;
}

function pseudoRandom(seed: number) {
    const value = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
    return value - Math.floor(value);
}

function meterSeed(meter: LargeMeterDevice) {
    return meter.id.split('').reduce((sum, character) => sum + character.charCodeAt(0), 0);
}

function formatNumber(value: number, digits = 2) {
    return value.toLocaleString('zh-CN', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

function exportCsv(filename: string, headers: string[], rows: Array<Array<string | number>>) {
    const escapeCell = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;
    const csv = [headers, ...rows].map((row) => row.map(escapeCell).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}

function dateValues(start: string, end: string, maxCount = 366) {
    if (!start || !end) return [];
    const values: string[] = [];
    const current = new Date(`${start}T00:00:00`);
    const last = new Date(`${end}T00:00:00`);
    while (current <= last && values.length < maxCount) {
        values.push(`${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`);
        current.setDate(current.getDate() + 1);
    }
    return values;
}

function monthValues(start: string, end: string) {
    if (!start || !end) return [];
    const values: string[] = [];
    const current = new Date(`${start.slice(0, 7)}-01T00:00:00`);
    const last = new Date(`${end.slice(0, 7)}-01T00:00:00`);
    while (current <= last && values.length < 24) {
        values.push(`${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`);
        current.setMonth(current.getMonth() + 1);
    }
    return values;
}

function buildMonitorRecords(meter: LargeMeterDevice, start: string, end: string): MonitorRecord[] {
    const seed = meterSeed(meter);
    const dates = dateValues(start, end);
    const alarmPattern = meter.status === '告警'
        ? [0, 1, 0, 2, 1, 3, 0, 1, 4, 2, 0, 1]
        : [0, 0, 1, 0, 2, 0, 1, 0, 0, 1, 0, 0];
    const dailyUsages = dates.map((_, index) => {
        const rSeed = seed + index;
        return Number((meter.dailyUsage * (0.7 + pseudoRandom(rSeed * 17 + 100) * 0.6)).toFixed(2));
    });
    // 累计读数按时间正向累加：期初读数 + 每日用量，避免用“当前值减历史用量”制造不合理数据。
    let runningReading = Math.max(
        0,
        meter.currentReading - dailyUsages.reduce((total, usage) => total + usage, 0),
    );
    return dates.map((date, index) => {
        const rSeed = seed + index;
        const alarmCount = alarmPattern[(index + seed) % alarmPattern.length];
        const dailyUsage = dailyUsages[index] ?? 0;
        const monthlyUsage = Number((meter.monthlyUsage * (0.85 + pseudoRandom(rSeed * 23 + 200) * 0.3)).toFixed(2));
        const hourlyUsage = Number((meter.hourlyUsage * (0.6 + pseudoRandom(rSeed * 41 + 300) * 0.8)).toFixed(2));
        const nightlyUsage = Number((meter.nightlyUsage * (0.5 + pseudoRandom(rSeed * 31 + 400) * 1.0)).toFixed(2));
        const forwardAccumulation = Number((meter.forwardAccumulation * (0.82 + pseudoRandom(rSeed * 11 + 500) * 0.36)).toFixed(2));
        const reverseAccumulation = Number((meter.reverseAccumulation * (0.5 + pseudoRandom(rSeed * 13 + 600) * 1.2)).toFixed(2));
        runningReading += dailyUsage;
        const cumulativeReading = Number(runningReading.toFixed(2));
        const batteryVoltage = Number((3.55 + pseudoRandom(rSeed * 19 + 700) * 0.45).toFixed(2));
        const signalStrength = Math.round(-62 - pseudoRandom(rSeed * 29 + 800) * 28);
        return {
            date,
            readAt: `${date} ${String(1 + (index * 3) % 7).padStart(2, '0')}:${String(8 + (index * 11) % 50).padStart(2, '0')}:00`,
            cumulativeReading,
            forwardAccumulation,
            reverseAccumulation,
            batteryVoltage,
            signalStrength,
            dailyUsage,
            monthlyUsage,
            hourlyUsage,
            nightlyUsage,
            alarmCount,
        };
    }).reverse();
}

function buildHourlyRecords(meter: LargeMeterDevice, startDate: string, endDate: string): HourlyRecord[] {
    const seed = meterSeed(meter);
    const dates = dateValues(startDate, endDate);
    return dates.flatMap((date, dayIdx) =>
        Array.from({ length: 24 }, (_, hour) => {
            const variation = pseudoRandom(seed + dayIdx * 24 * 41 + hour * 41 + 900);
            return {
                readAt: `${date} ${String(hour).padStart(2, '0')}:00:00`,
                hourlyUsage: Number((meter.hourlyUsage * (0.45 + variation * 1.1)).toFixed(2)),
            };
        }),
    );
}

function buildMonthlyRecords(meter: LargeMeterDevice, start: string, end: string): MonthlyRecord[] {
    const seed = meterSeed(meter);
    return monthValues(start, end).map((month, index) => ({
        month,
        monthlyUsage: Number((meter.monthlyUsage * (0.78 + pseudoRandom(seed + index * 23 + 1000) * 0.44)).toFixed(2)),
    }));
}

function buildNightlyRecords(
    records: MonitorRecord[],
    meter: LargeMeterDevice,
    period: NightlyPeriod,
): NightlyRecord[] {
    const seed = meterSeed(meter);
    const periodLabel = formatNightlyPeriod(period);
    const abnormalThreshold = Math.max(meter.dailyUsage * 0.35, 12);
    return records.map((record, index) => {
        const ratio = record.dailyUsage > 0 ? (record.nightlyUsage / record.dailyUsage) * 100 : 0;
        const peakHour = `${String(Number.parseInt(period.start.slice(0, 2), 10) + 1 + (index * 3) % 4).padStart(2, '0')}:${String(15 + (index * 7) % 45).padStart(2, '0')}`;
        const valleyHour = `${String(Number.parseInt(period.end.slice(0, 2), 10) + (index * 2) % 2).padStart(2, '0')}:${String(10 + (index * 5) % 40).padStart(2, '0')}`;
        const peakFlow = Number((record.nightlyUsage / 8 * (0.8 + pseudoRandom(seed + index * 51 + 1100) * 0.4)).toFixed(2));
        const valleyFlow = Number((record.nightlyUsage / 12 * (0.25 + pseudoRandom(seed + index * 61 + 1200) * 0.45)).toFixed(2));
        const endDate = isCrossMidnightPeriod(period) ? addDays(record.date, 1) : record.date;
        const dataTime = `${record.date} ${period.start}:00 ~ ${endDate} ${period.end}:00`;
        return {
            date: record.date,
            dataTime,
            period: periodLabel,
            nightlyUsage: record.nightlyUsage,
            dailyUsage: record.dailyUsage,
            ratio: Number(ratio.toFixed(1)),
            peakFlow,
            peakHour,
            valleyFlow,
            valleyHour,
            isAbnormal: record.nightlyUsage >= abnormalThreshold,
        };
    });
}

function buildChartAxisLabelInterval(count: number) {
    if (count <= 12) return 0;
    if (count <= 24) return 1;
    if (count <= 48) return 3;
    if (count <= 90) return 6;
    return 'auto' as const;
}

function buildNightlyBarMaxWidth(count: number) {
    if (count <= 31) return 24;
    if (count <= 90) return 12;
    return 6;
}

function buildNightlyChartZoom(count: number) {
    if (count <= 31) return null;
    const windowSize = count > 90 ? 31 : Math.min(31, count);
    const startPercent = Math.max(0, 100 - (windowSize / count) * 100);
    return { start: startPercent, end: 100, windowSize };
}

function getDisplayInstallTime(meter: LargeMeterDevice): string {
    if (meter.installTime) return meter.installTime;
    // 未填写安装档案时不生成模拟日期，避免未绑定设备出现虚假的安装时间。
    return '-';
}

function Chart({ option, ariaLabel }: { option: EChartsCoreOption; ariaLabel: string }) {
    const containerRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!containerRef.current) return undefined;
        const chart = echarts.init(containerRef.current);
        chart.setOption(option, true);
        const observer = new ResizeObserver(() => chart.resize());
        observer.observe(containerRef.current);
        return () => { observer.disconnect(); chart.dispose(); };
    }, [option]);
    return <div ref={containerRef} className="wua-chart" role="img" aria-label={ariaLabel} />;
}

function DevicePointMap({ longitude, latitude, name }: { longitude: number; latitude: number; name: string }) {
    const mapRef = useRef<HTMLDivElement>(null);
    const [mapState, setMapState] = useState<'loading' | 'ready' | 'error'>('loading');
    useEffect(() => {
        let cancelled = false;
        let map: BMap.Map | null = null;
        let resizeObserver: ResizeObserver | null = null;
        loadBaiduMap(BAIDU_MAP_AK).then(() => {
            if (cancelled || !mapRef.current || !window.BMap?.Map) return;
            const point = new BMap.Point(longitude, latitude);
            map = new BMap.Map(mapRef.current);
            map.centerAndZoom(point, 17);
            map.enableScrollWheelZoom(true);
            map.addOverlay(new BMap.Marker(point));
            const recenter = () => {
                map?.checkResize();
                map?.panTo(point);
            };
            resizeObserver = new ResizeObserver(recenter);
            resizeObserver.observe(mapRef.current);
            requestAnimationFrame(recenter);
            window.setTimeout(recenter, 180);
            setMapState('ready');
        }).catch(() => { if (!cancelled) setMapState('error'); });
        return () => { cancelled = true; resizeObserver?.disconnect(); map?.clearOverlays(); };
    }, [latitude, longitude]);
    return <div className="wua-baidu-map-shell"><div ref={mapRef} className="wua-baidu-map" aria-label={`${name}百度地图点位`} />{mapState !== 'ready' && <div className="wua-baidu-map__state"><MapPin size={18} /><span>{mapState === 'loading' ? '地图加载中' : '地图暂不可用'}</span></div>}<div className="wua-baidu-map__caption">{longitude.toFixed(6)}, {latitude.toFixed(6)}</div></div>;
}

export default function WaterUsageAnalysisPage({
    meter,
    nightlyConfig,
    areas,
    products,
    devices,
    deviceAlarms,
    alarmLevels,
    onUpdateAlarms,
    onCreateWorkOrder,
    onViewWorkOrder,
    onBack,
    onNavigateDeviceAccess,
    onNavigate,
    onNavigateMessageCenter,
    onNavigateAlarmWorkOrder,
    onNavigateSystemManagement,
    onNavigateLargeMeterCenter,
}: WaterUsageAnalysisPageProps) {
    const [draftRange, setDraftRange] = useState(DEFAULT_RANGE);
    const [range, setRange] = useState(DEFAULT_RANGE);
    const [activeTab, setActiveTab] = useState<AnalysisTab>('history');
    const [draftMonthly, setDraftMonthly] = useState(DEFAULT_MONTHLY_RANGE);
    const [monthlyRange, setMonthlyRange] = useState(DEFAULT_MONTHLY_RANGE);
    const [draftHourly, setDraftHourly] = useState(DEFAULT_HOURLY_RANGE);
    const [hourlyRange, setHourlyRange] = useState(DEFAULT_HOURLY_RANGE);
    const [nightlyRangePreset, setNightlyRangePreset] = useState<NightlyRangePreset>('month');
    const [draftNightlyDateTimeRange, setDraftNightlyDateTimeRange] = useState<NightlyDateTimeRange>(
        () => buildNightlyPresetRange('month', DEFAULT_NIGHTLY_PERIOD),
    );
    const [nightlyDateTimeRange, setNightlyDateTimeRange] = useState<NightlyDateTimeRange>(
        () => buildNightlyPresetRange('month', DEFAULT_NIGHTLY_PERIOD),
    );
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(DEFAULT_LIST_PAGE_SIZE);
    const [jumpPage, setJumpPage] = useState('1');
    const [contentView, setContentView] = useState<TabContentView>('chart');
    const [toast, setToast] = useState<IotToastData | null>(null);
    const [detailModal, setDetailModal] = useState<{
        alarmId: string;
        mode: 'process' | 'view';
    } | null>(null);
    const [convertModal, setConvertModal] = useState<{ alarmId: string } | null>(null);
    const status = getMeterDisplayStatus(meter);
    const isUnassigned = !meter.areaId || !areas.some((area) => area.id === meter.areaId);
    const areaName = isUnassigned ? '-' : (getAreaName(areas, meter.areaId) || '-');
    const records = useMemo(() => buildMonitorRecords(meter, range.start, range.end), [meter, range]);
    const nightlyDateFilter = useMemo(
        () => dateRangeFromNightlyDateTime(nightlyDateTimeRange),
        [nightlyDateTimeRange],
    );
    const nightlySourceRecords = useMemo(
        () => buildMonitorRecords(meter, nightlyDateFilter.start, nightlyDateFilter.end),
        [meter, nightlyDateFilter],
    );
    const hourlyRecords = useMemo(() => buildHourlyRecords(meter, hourlyRange.start, hourlyRange.end), [meter, hourlyRange]);
    const monthlyRecords = useMemo(() => buildMonthlyRecords(meter, monthlyRange.start, monthlyRange.end), [meter, monthlyRange]);
    const nightlyRecords = useMemo(
        () => buildNightlyRecords(nightlySourceRecords, meter, nightlyConfig.period),
        [nightlySourceRecords, meter, nightlyConfig.period],
    );
    const nightlyFieldSet = useMemo(() => new Set(nightlyConfig.fields), [nightlyConfig.fields]);
    const nightlyStatistics = useMemo(() => {
        const totalUsage = nightlyRecords.reduce((sum, item) => sum + item.nightlyUsage, 0);
        const peak = nightlyRecords.reduce<NightlyRecord | null>(
            (current, item) => (!current || item.peakFlow > current.peakFlow ? item : current),
            null,
        );
        const valley = nightlyRecords.reduce<NightlyRecord | null>(
            (current, item) => (!current || item.valleyFlow < current.valleyFlow ? item : current),
            null,
        );
        const countByHour = (field: 'peakHour' | 'valleyHour') => {
            const counts = new Map<string, number>();
            nightlyRecords.forEach((item) => {
                const hour = `${item[field].slice(0, 2)}:00`;
                counts.set(hour, (counts.get(hour) ?? 0) + 1);
            });
            return [...counts.entries()].sort((a, b) => b[1] - a[1])[0] ?? ['-', 0] as const;
        };
        const [peakCommonHour, peakCommonCount] = countByHour('peakHour');
        const [valleyCommonHour, valleyCommonCount] = countByHour('valleyHour');
        return { totalUsage, peak, valley, peakCommonHour, peakCommonCount, valleyCommonHour, valleyCommonCount };
    }, [nightlyRecords]);
    const nightlyDistributionOption = useMemo<EChartsCoreOption>(() => {
        const hours = buildNightlyHourLabels(nightlyConfig.period);
        const hourIndexes = new Map(hours.map((hour, index) => [hour, index]));
        const peakCounts = Array(hours.length).fill(0) as number[];
        const valleyCounts = Array(hours.length).fill(0) as number[];
        nightlyRecords.forEach((item) => {
            const peakIndex = hourIndexes.get(`${item.peakHour.slice(0, 2)}:00`);
            const valleyIndex = hourIndexes.get(`${item.valleyHour.slice(0, 2)}:00`);
            if (peakIndex !== undefined) peakCounts[peakIndex] += 1;
            if (valleyIndex !== undefined) valleyCounts[valleyIndex] += 1;
        });
        return {
            animationDuration: 220,
            tooltip: { ...IOT_AXIS_TOOLTIP, trigger: 'axis' },
            legend: { top: 0, right: 8, itemWidth: 10, itemHeight: 10, textStyle: { color: '#475569', fontSize: 11 }, data: ['峰值出现次数', '谷值出现次数'] },
            grid: { top: 48, right: 22, bottom: 34, left: 40 },
            xAxis: { type: 'category', data: hours, axisTick: { show: false }, axisLine: { lineStyle: { color: '#dbe3ec' } }, axisLabel: { interval: 1, color: '#64748b', fontSize: 10 } },
            yAxis: { type: 'value', minInterval: 1, name: '次数', nameTextStyle: { color: '#94a3b8', padding: [0, 0, 0, -24] }, splitLine: { lineStyle: { color: '#edf2f7', type: 'dashed' } }, axisLabel: { color: '#94a3b8', fontSize: 10 } },
            series: [
                { type: 'bar', name: '峰值出现次数', data: peakCounts, barMaxWidth: 12, itemStyle: { color: '#f59e0b', borderRadius: [4, 4, 0, 0] } },
                { type: 'bar', name: '谷值出现次数', data: valleyCounts, barMaxWidth: 12, itemStyle: { color: '#2563eb', borderRadius: [4, 4, 0, 0] } },
            ],
        };
    }, [nightlyConfig.period, nightlyRecords]);
    const alarmRecords = useMemo(() => filterAlarmsByDevice(deviceAlarms, meter)
        .sort((a, b) => b.triggeredAt.localeCompare(a.triggeredAt)), [deviceAlarms, meter]);
    const coordinates = useMemo(() => {
        if (!isUnassigned && typeof meter.longitude === 'number' && typeof meter.latitude === 'number') {
            return { lng: meter.longitude, lat: meter.latitude };
        }
        const seed = meterSeed(meter);
        return { lng: 118.71 + pseudoRandom(seed) * 0.16, lat: 31.94 + pseudoRandom(seed + 7) * 0.11 };
    }, [isUnassigned, meter]);

    const tabRecords = useMemo(() => {
        if (activeTab === 'hourly') return hourlyRecords;
        if (activeTab === 'monthly') return monthlyRecords;
        if (activeTab === 'nightly') return nightlyRecords;
        if (activeTab === 'alarm') return alarmRecords;
        return records;
    }, [activeTab, alarmRecords, hourlyRecords, monthlyRecords, nightlyRecords, records]);

    const pagination = useMemo(
        () => paginateItems(tabRecords, currentPage, Number(pageSize)),
        [tabRecords, currentPage, pageSize],
    );

    useEffect(() => {
        setCurrentPage(1);
        setJumpPage('1');
    }, [activeTab, range, monthlyRange, hourlyRange, nightlyDateTimeRange, nightlyConfig, pageSize]);

    useEffect(() => {
        if (activeTab !== 'history') {
            setContentView('chart');
        }
    }, [activeTab]);

    useEffect(() => {
        setJumpPage(String(pagination.currentPage));
    }, [pagination.currentPage]);

    useEffect(() => {
        onUpdateAlarms((prev) => {
            const next = prev.map(normalizeDeviceAlarm);
            const changed = next.some((alarm, index) => alarm.content !== prev[index]?.content);
            return changed ? next : prev;
        });
    }, [onUpdateAlarms]);

    const showToast = (message: string, type: IotToastType = 'success') => {
        triggerIotToast(setToast, message, type);
    };

    const activeAlarm = useMemo(
        () => (detailModal ? deviceAlarms.find((item) => item.id === detailModal.alarmId) ?? null : null),
        [deviceAlarms, detailModal],
    );

    const convertAlarm = useMemo(
        () => (convertModal ? deviceAlarms.find((item) => item.id === convertModal.alarmId) ?? null : null),
        [convertModal, deviceAlarms],
    );

    const markAlarmRead = (alarmId: string) => {
        onUpdateAlarms((prev) => prev.map((item) => (
            item.id === alarmId ? { ...item, readStatus: '已读' } : item
        )));
    };

    const handleProcess = (alarm: DeviceAlarmRecord) => {
        markAlarmRead(alarm.id);
        setDetailModal({ alarmId: alarm.id, mode: 'process' });
    };

    const handleView = (alarm: DeviceAlarmRecord) => {
        markAlarmRead(alarm.id);
        setDetailModal({ alarmId: alarm.id, mode: 'view' });
    };

    const handleConfirmProcess = (result: string) => {
        if (!activeAlarm) return;

        const now = new Date();
        const pad = (value: number) => String(value).padStart(2, '0');
        const processTime = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

        onUpdateAlarms((prev) => prev.map((item) => (
            item.id === activeAlarm.id
                ? normalizeDeviceAlarm({
                    ...item,
                    readStatus: '已读',
                    processStatus: '已处理',
                    processMethod: '直接处理',
                    processResult: result,
                    processHandler: '当前用户',
                    processTime,
                    releaseTime: processTime,
                })
                : item
        )));

        setDetailModal(null);
        showToast(`「${activeAlarm.eventName}」已处理完成`);
    };

    const handleConvertTicket = (alarm: DeviceAlarmRecord) => {
        if (alarm.processStatus !== '未处理') return;
        markAlarmRead(alarm.id);
        setConvertModal({ alarmId: alarm.id });
    };

    const handleConfirmConvert = (form: ConvertWorkOrderForm) => {
        if (!convertAlarm) return;

        const now = new Date();
        const pad = (value: number) => String(value).padStart(2, '0');
        const createdAt = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} `
            + `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

        const workOrderRecord = createWorkOrderFromAlarm({
            name: form.name,
            level: form.level,
            content: form.content,
            assignees: form.assignees,
            space: convertAlarm.space,
            alarmId: convertAlarm.id,
            processingDeadline: form.processingDeadline,
            processingDeadlineUnit: form.processingDeadlineUnit,
        });

        onUpdateAlarms((prev) => prev.map((item) => (
            item.id === convertAlarm.id
                ? normalizeDeviceAlarm({
                    ...item,
                    readStatus: '已读',
                    processStatus: '处理中',
                    processMethod: '工单处理',
                    workOrder: {
                        id: workOrderRecord.id,
                        name: form.name,
                        createdAt,
                        level: form.level,
                        content: form.content,
                        assignees: form.assignees,
                        processingDeadline: form.processingDeadline,
                        processingDeadlineUnit: form.processingDeadlineUnit,
                    },
                })
                : item
        )));

        onCreateWorkOrder?.(workOrderRecord);
        setConvertModal(null);
        showToast(`「${convertAlarm.eventName}」已转为工单`);
    };

    const handleViewWorkOrder = (workOrder: NonNullable<DeviceAlarmRecord['workOrder']>) => {
        if (onViewWorkOrder) {
            onViewWorkOrder(workOrder.id);
            return;
        }
        showToast(`查看工单 ${workOrder.id}（原型）`, 'warning');
    };

    const showChart = activeTab !== 'history' && contentView === 'chart';
    const showDetail = activeTab === 'history' || contentView === 'detail';

    const chartOption = useMemo<EChartsCoreOption>(() => {
        const common = { type: 'line', smooth: true, symbol: 'circle', symbolSize: 6, lineStyle: { width: 2 } };
        let labels: string[] = [];
        let unit = 'm³';
        let series: EChartsCoreOption['series'];
        let labelInterval: number | 'auto' = 0;
        let labelRotate = 0;
        let nightlyOrdered: NightlyRecord[] = [];
        let nightlyZoom: ReturnType<typeof buildNightlyChartZoom> = null;
        let nightlyBarMaxWidth = 24;

        if (activeTab === 'alarm') {
            const alarmCounts = new Map<string, number>();
            [...alarmRecords].reverse().forEach((alarm) => {
                const date = alarm.triggeredAt.slice(0, 10);
                alarmCounts.set(date, (alarmCounts.get(date) ?? 0) + 1);
            });
            labels = [...alarmCounts.keys()];
            unit = '次';
            series = [{
                type: 'bar',
                name: '报警次数',
                data: [...alarmCounts.values()],
                barMaxWidth: 24,
                itemStyle: { color: '#f56c6c', borderRadius: [3, 3, 0, 0] },
            }];
        } else if (activeTab === 'monthly') {
            labels = monthlyRecords.map((item) => item.month);
            labelRotate = 0;
            const cfg = METRIC_STYLES.monthly;
            series = [{
                ...common,
                name: TAB_LABELS.monthly,
                data: monthlyRecords.map((item) => item.monthlyUsage),
                itemStyle: { color: cfg.color },
                areaStyle: { color: `${cfg.color}18` },
            }];
        } else if (activeTab === 'hourly') {
            labels = hourlyRecords.map((item) => item.readAt.slice(5, 16));
            labelInterval = buildChartAxisLabelInterval(labels.length);
            labelRotate = labels.length > 24 ? 35 : 0;
            const cfg = METRIC_STYLES.hourly;
            series = [{
                ...common,
                name: TAB_LABELS.hourly,
                data: hourlyRecords.map((item) => item.hourlyUsage),
                itemStyle: { color: cfg.color },
                areaStyle: { color: `${cfg.color}18` },
            }];
        } else if (activeTab === 'nightly') {
            nightlyOrdered = [...nightlyRecords].reverse();
            labels = nightlyOrdered.map((item) => item.date.slice(5));
            labelInterval = buildChartAxisLabelInterval(labels.length);
            labelRotate = labels.length > 60 ? 35 : 0;
            nightlyZoom = buildNightlyChartZoom(labels.length);
            nightlyBarMaxWidth = buildNightlyBarMaxWidth(labels.length);
            const cfg = METRIC_STYLES.nightly;
            const seriesList: EChartsCoreOption['series'] = [];
            if (nightlyFieldSet.has('usage')) {
                seriesList.push({
                    type: 'bar',
                    name: '夜间用水',
                    data: nightlyOrdered.map((item) => ({
                        value: item.nightlyUsage,
                        itemStyle: { color: item.isAbnormal ? '#f56c6c' : cfg.color },
                    })),
                    barMaxWidth: nightlyBarMaxWidth,
                    itemStyle: { color: cfg.color, borderRadius: [3, 3, 0, 0] },
                });
            }
            if (nightlyFieldSet.has('peak')) {
                seriesList.push({
                    ...common,
                    name: '峰值流量',
                    yAxisIndex: nightlyFieldSet.has('usage') ? 1 : 0,
                    data: nightlyOrdered.map((item) => item.peakFlow),
                    itemStyle: { color: '#fa8c16' },
                    showSymbol: labels.length <= 90,
                });
            }
            if (nightlyFieldSet.has('valley')) {
                seriesList.push({
                    ...common,
                    name: '谷值流量',
                    yAxisIndex: nightlyFieldSet.has('usage') ? 1 : 0,
                    data: nightlyOrdered.map((item) => item.valleyFlow),
                    itemStyle: { color: '#722ed1' },
                    showSymbol: labels.length <= 90,
                });
            }
            if (nightlyFieldSet.has('ratio')) {
                seriesList.push({
                    ...common,
                    name: '占日比例',
                    yAxisIndex: nightlyFieldSet.has('usage') ? 1 : 0,
                    data: nightlyOrdered.map((item) => item.ratio),
                    itemStyle: { color: '#13c2c2' },
                    showSymbol: labels.length <= 90,
                });
            }
            series = seriesList.length ? seriesList : [{
                type: 'bar',
                name: TAB_LABELS.nightly,
                data: nightlyOrdered.map((item) => item.nightlyUsage),
                barMaxWidth: nightlyBarMaxWidth,
            }];
            unit = nightlyFieldSet.has('usage') ? 'm³' : nightlyFieldSet.has('ratio') ? '%' : 'm³/h';
        } else if (activeTab === 'daily') {
            const ordered = [...records].reverse();
            labels = ordered.map((item) => item.date.slice(5));
            const cfg = METRIC_STYLES.daily;
            series = [{
                ...common,
                name: TAB_LABELS.daily,
                data: ordered.map((item) => item.dailyUsage),
                itemStyle: { color: cfg.color },
                areaStyle: { color: `${cfg.color}18` },
            }];
        } else {
            return {};
        }

        return {
            animationDuration: 220,
            tooltip: {
                ...IOT_AXIS_TOOLTIP,
                valueFormatter: (value) => `${value} ${unit}`,
                ...(activeTab === 'nightly' ? {
                    formatter: (params) => {
                        const items = Array.isArray(params) ? params : [params];
                        const index = items[0]?.dataIndex ?? 0;
                        const record = nightlyOrdered[index];
                        const title = record?.date ?? items[0]?.name ?? '';
                        const lines = items.map((item) => {
                            const marker = item.marker ?? '';
                            const seriesName = item.seriesName ?? '';
                            const rawValue = typeof item.value === 'object' && item.value !== null && 'value' in item.value
                                ? (item.value as { value: number }).value
                                : item.value;
                            return `${marker}${seriesName}：${rawValue} ${unit}`;
                        });
                        return [title, ...lines].join('<br/>');
                    },
                } : {}),
            },
            legend: {
                bottom: nightlyZoom ? 34 : 0,
                left: 'center',
                itemWidth: 12,
                itemHeight: 7,
                itemGap: 18,
                textStyle: { color: '#5c6b7a', fontSize: 12 },
            },
            grid: {
                left: 56,
                right: activeTab === 'nightly' && nightlyFieldSet.has('usage') && (nightlyFieldSet.has('peak') || nightlyFieldSet.has('valley') || nightlyFieldSet.has('ratio')) ? 60 : 18,
                top: activeTab === 'nightly' ? 48 : 38,
                bottom: nightlyZoom ? 92 : labelRotate ? 78 : 62,
            },
            ...(nightlyZoom ? {
                dataZoom: [
                    {
                        type: 'slider',
                        start: nightlyZoom.start,
                        end: nightlyZoom.end,
                        height: 18,
                        bottom: 8,
                        borderColor: '#e8edf3',
                        backgroundColor: '#f7f9fb',
                        fillerColor: 'rgba(35, 143, 216, 0.12)',
                        handleStyle: { color: '#238fd8', borderColor: '#238fd8' },
                        moveHandleStyle: { color: '#238fd8' },
                        textStyle: { color: '#8c9bab', fontSize: 11 },
                        brushSelect: false,
                    },
                    {
                        type: 'inside',
                        start: nightlyZoom.start,
                        end: nightlyZoom.end,
                        zoomOnMouseWheel: true,
                        moveOnMouseMove: true,
                        moveOnMouseWheel: true,
                    },
                ],
            } : {}),
            xAxis: {
                type: 'category',
                data: labels,
                axisTick: { show: false },
                axisLine: { lineStyle: { color: '#e8edf3' } },
                axisLabel: { color: '#8c9bab', interval: labelInterval, rotate: labelRotate },
            },
            yAxis: activeTab === 'nightly' && nightlyFieldSet.has('usage') && (nightlyFieldSet.has('peak') || nightlyFieldSet.has('valley') || nightlyFieldSet.has('ratio'))
                ? [
                    {
                        type: 'value',
                        name: 'm³',
                        nameGap: 18,
                        nameTextStyle: { color: '#8c9bab', padding: [0, 0, 0, -8] },
                        splitLine: { lineStyle: { color: '#eef1f5' } },
                        axisLabel: { color: '#8c9bab' },
                    },
                    {
                        type: 'value',
                        name: nightlyFieldSet.has('ratio') && !nightlyFieldSet.has('peak') && !nightlyFieldSet.has('valley') ? '%' : 'm³/h',
                        nameGap: 18,
                        nameTextStyle: { color: '#8c9bab', padding: [0, -4, 0, 0] },
                        splitLine: { show: false },
                        axisLabel: { color: '#8c9bab' },
                    },
                ]
                : {
                    type: 'value',
                    minInterval: activeTab === 'alarm' ? 1 : undefined,
                    name: unit,
                    nameGap: 18,
                    nameTextStyle: { color: '#8c9bab', padding: [0, 0, 0, -8] },
                    splitLine: { lineStyle: { color: '#eef1f5' } },
                    axisLabel: { color: '#8c9bab' },
                },
            series,
        };
    }, [activeTab, alarmRecords, hourlyRecords, monthlyRecords, nightlyFieldSet, nightlyRecords, records]);

    const detailTitle = useMemo(() => {
        if (activeTab === 'history') return '监测数据明细';
        if (activeTab === 'hourly') return `${TAB_LABELS.hourly}明细`;
        if (activeTab === 'monthly') return `${TAB_LABELS.monthly}明细`;
        if (activeTab === 'nightly') return `每日夜间流量明细（${formatNightlyPeriod(nightlyConfig.period)}）`;
        return `${TAB_LABELS[activeTab]}明细`;
    }, [activeTab, nightlyConfig.period]);

    const detailCount = pagination.total;

    const handleExportDetail = () => {
        let headers: string[] = [];
        let rows: Array<Array<string | number>> = [];
        if (activeTab === 'history') {
            headers = ['抄表时间', '累计读数(m³)', '日结累计正向流量(m³)', '日结累计逆向流量(m³)', '电池电压(V)', '信号强度(dBm)'];
            rows = records.map((item) => [item.readAt, item.cumulativeReading, item.forwardAccumulation, item.reverseAccumulation, item.batteryVoltage, item.signalStrength]);
        } else if (activeTab === 'daily') {
            headers = ['日期', '抄表时间', '日用水(m³)'];
            rows = records.map((item) => [item.date, item.readAt, item.dailyUsage]);
        } else if (activeTab === 'monthly') {
            headers = ['月份', '月用水(m³)'];
            rows = monthlyRecords.map((item) => [item.month, item.monthlyUsage]);
        } else if (activeTab === 'hourly') {
            headers = ['时间', '时用水(m³)'];
            rows = hourlyRecords.map((item) => [item.readAt, item.hourlyUsage]);
        } else if (activeTab === 'nightly') {
            headers = ['数据时间', '统计时段'];
            if (nightlyFieldSet.has('usage')) headers.push('夜间用水(m³)');
            if (nightlyFieldSet.has('ratio')) headers.push('日用水(m³)', '占日比例(%)');
            else if (nightlyFieldSet.has('usage')) headers.push('日用水(m³)');
            if (nightlyFieldSet.has('peak')) headers.push('峰值流量(m³/h)', '峰值时刻');
            if (nightlyFieldSet.has('valley')) headers.push('谷值流量(m³/h)', '谷值时刻');
            rows = nightlyRecords.map((item) => {
                const row: Array<string | number> = [item.dataTime, item.period];
                if (nightlyFieldSet.has('usage')) row.push(item.nightlyUsage);
                if (nightlyFieldSet.has('ratio')) row.push(item.dailyUsage, item.ratio);
                else if (nightlyFieldSet.has('usage')) row.push(item.dailyUsage);
                if (nightlyFieldSet.has('peak')) row.push(item.peakFlow, item.peakHour);
                if (nightlyFieldSet.has('valley')) row.push(item.valleyFlow, item.valleyHour);
                return row;
            });
        } else {
            headers = ['序号', '事件名称', '告警等级', '设备名称', '设备编号', '所属产品', '所属片区', '阅读状态', '触发时间', '触发内容', '处理状态'];
            rows = alarmRecords.map((item, index) => [
                index + 1,
                item.eventName,
                item.level,
                item.deviceName,
                item.deviceCode,
                resolveAlarmProductName(item.productId, products),
                item.space,
                item.readStatus,
                item.triggeredAt,
                resolveAlarmTriggerContent(item),
                item.processStatus,
            ]);
        }
        exportCsv(`${meter.code}-${TAB_LABELS[activeTab]}-${rangeHint.replaceAll(' ', '')}.csv`, headers, rows);
    };

    const rangeHint = useMemo(() => {
        if (activeTab === 'hourly') return `${hourlyRange.start} 至 ${hourlyRange.end}`;
        if (activeTab === 'monthly') return `${monthlyRange.start} 至 ${monthlyRange.end}`;
        if (activeTab === 'nightly') {
            return `${formatNightlyDateTimeDisplay(nightlyDateTimeRange.start)} 至 ${formatNightlyDateTimeDisplay(nightlyDateTimeRange.end)}`;
        }
        return `${range.start} 至 ${range.end}`;
    }, [activeTab, hourlyRange, monthlyRange, nightlyDateTimeRange, range]);

    const applyNightlyPreset = (preset: Exclude<NightlyRangePreset, 'custom'>) => {
        const next = buildNightlyPresetRange(preset, nightlyConfig.period);
        setNightlyRangePreset(preset);
        setDraftNightlyDateTimeRange(next);
        setNightlyDateTimeRange(next);
    };

    const resetNightlyRange = () => {
        applyNightlyPreset('month');
    };

    const installTime = getDisplayInstallTime(meter);
    const sidebar = <LargeMeterSidebar pageId="data-monitor" onNavigate={onNavigate} />;
    return (
        <>
        <AppShell
            activeTopTab="大表中心"
            sidebar={sidebar}
            onNavigateLargeMeterCenter={onNavigateLargeMeterCenter}
            onNavigateMessageCenter={onNavigateMessageCenter}
            onNavigateAlarmWorkOrder={onNavigateAlarmWorkOrder}
            onNavigateSystemManagement={onNavigateSystemManagement}
            onTopTabChange={(tab) => {
                if (tab === '设备接入') onNavigateDeviceAccess();
            }}
        >
            <div className="pm-page wua-page">
                <Breadcrumb items={[
                                    { label: '大表中心', pageId: 'data-monitor' },
                                    { label: '数据监测', pageId: 'data-monitor' },
                                    { label: '设备数据' },
                                ]} onNavigate={(id) => onNavigateLargeMeterCenter(id as LargeMeterPageId)} />

                <div className="pcp-head wua-page-head">
                    <button type="button" className="pcp-back-btn" onClick={onBack} aria-label="返回">
                        <ArrowLeft size={16} />
                    </button>
                    <div>
                        <h2 className="pcp-title">设备数据</h2>
                        <p>查看设备读数、用量趋势与异常记录</p>
                    </div>
                </div>

                <section className="panel wua-device-panel">
                    <div className="wua-device-body">
                        <div className="wua-device-col wua-device-col--main">
                            <div className="wua-device-head">
                                <div className="wua-device-head__title">
                                    <h2>{meter.name}</h2>
                                    <span className={`lm-status-tag lm-status-tag--${status.tone}`}>{status.label}</span>
                                </div>
                                <p className="wua-device-head__meta">{meter.code || '-'} · {meter.bodyNo || '-'} · {areaName || '-'}</p>
                            </div>

                            <dl className="wua-info-grid">
                                <div><dt>用户名称</dt><dd>{isUnassigned ? '-' : (meter.userName || '-')}</dd></div>
                                <div><dt>用户号</dt><dd>{isUnassigned ? '-' : (meter.userNo || '-')}</dd></div>
                                <div><dt>设备编号</dt><dd>{meter.code}</dd></div>
                                <div><dt>表身号</dt><dd>{isUnassigned ? '-' : (meter.bodyNo || '-')}</dd></div>
                                <div><dt>表具厂家</dt><dd>{isUnassigned ? '-' : (meter.manufacturer || '-')}</dd></div>
                                <div><dt>远传厂家</dt><dd>{isUnassigned ? '-' : resolveRemoteManufacturer(meter)}</dd></div>
                                <div><dt>设备功能</dt><dd>{isUnassigned ? '-' : (meter.deviceFunction || '-')}</dd></div>
                                <div><dt>设备口径</dt><dd>{isUnassigned ? '-' : (meter.caliber || '-')}</dd></div>
                                <div><dt>通讯码</dt><dd>{isUnassigned ? '-' : (meter.communicationNo || '-')}</dd></div>
                                <div><dt>安装时间</dt><dd>{installTime || '-'}</dd></div>
                                <div><dt>具体地址</dt><dd>{isUnassigned ? '-' : (meter.installAddress || '-')}</dd></div>
                                <div><dt>所属片区</dt><dd>{areaName || '-'}</dd></div>
                            </dl>
                        </div>

                        <div className="wua-device-col wua-device-col--side">
                            {isUnassigned ? (
                                <div className="wua-baidu-map-shell"><div className="wua-baidu-map__state"><MapPin size={18} /><span>-</span></div></div>
                            ) : (
                                <DevicePointMap longitude={coordinates.lng} latitude={coordinates.lat} name={meter.name} />
                            )}
                        </div>
                    </div>
                </section>

                <section className="panel wua-workspace" aria-label="设备数据">
                        <div className="wua-workspace__head">
                            <div className="wua-tabs" role="tablist" aria-label="监测指标">
                                {TAB_ORDER.map((tab) => (
                                    <button
                                        key={tab}
                                        type="button"
                                        role="tab"
                                        aria-selected={activeTab === tab}
                                        className={activeTab === tab ? 'is-active' : ''}
                                        onClick={() => setActiveTab(tab)}
                                    >
                                        {TAB_LABELS[tab]}
                                    </button>
                                ))}
                            </div>
                            <div className="wua-toolbar">
                                {activeTab === 'alarm' ? (
                                    <div className="wua-alarm-source">数据来源：设备告警信息 · 共 {alarmRecords.length} 条</div>
                                ) : activeTab === 'monthly' ? (
                                    <>
                                        <div className="wua-date-filter">
                                            <span>数据月份</span>
                                            <ElMonthRangePicker
                                                size="medium"
                                                start={draftMonthly.start}
                                                end={draftMonthly.end}
                                                placeholder="请选择月份范围"
                                                onChange={setDraftMonthly}
                                            />
                                        </div>
                                        <div className="wua-filter-actions">
                                            <button type="button" className="pm-btn pm-btn-primary" disabled={!draftMonthly.start || !draftMonthly.end} onClick={() => setMonthlyRange(draftMonthly)}><Search size={14} />查询</button>
                                            <button type="button" className="pm-btn pm-btn-ghost" onClick={() => { setDraftMonthly(DEFAULT_MONTHLY_RANGE); setMonthlyRange(DEFAULT_MONTHLY_RANGE); }}>重置</button>
                                        </div>
                                    </>
                                ) : activeTab === 'hourly' ? (
                                    <>
                                        <div className="wua-date-filter"><span>数据日期</span><ElDateRangePicker size="medium" start={draftHourly.start} end={draftHourly.end} onChange={setDraftHourly} /></div>
                                        <div className="wua-filter-actions">
                                            <button type="button" className="pm-btn pm-btn-primary" disabled={!draftHourly.start || !draftHourly.end} onClick={() => setHourlyRange(draftHourly)}><Search size={14} />查询</button>
                                            <button type="button" className="pm-btn pm-btn-ghost" onClick={() => { setDraftHourly(DEFAULT_HOURLY_RANGE); setHourlyRange(DEFAULT_HOURLY_RANGE); }}>重置</button>
                                        </div>
                                    </>
                                ) : activeTab === 'nightly' ? (
                                    <>
                                        <div className="wua-range-presets" role="group" aria-label="夜间用水时间快捷切换">
                                            {NIGHTLY_RANGE_PRESETS.map((preset) => (
                                                <button
                                                    key={preset.key}
                                                    type="button"
                                                    className={nightlyRangePreset === preset.key ? 'is-active' : ''}
                                                    onClick={() => applyNightlyPreset(preset.key)}
                                                >
                                                    {preset.label}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="wua-date-filter wua-date-filter--datetime">
                                            <span>数据时间</span>
                                            <ElDateTimePicker
                                                size="medium"
                                                className="wua-datetime-picker"
                                                value={draftNightlyDateTimeRange.start}
                                                placeholder="开始时间"
                                                onChange={(start) => {
                                                    setDraftNightlyDateTimeRange((previous) => ({ ...previous, start }));
                                                    setNightlyRangePreset('custom');
                                                }}
                                            />
                                            <span className="wua-date-filter__sep">至</span>
                                            <ElDateTimePicker
                                                size="medium"
                                                className="wua-datetime-picker"
                                                value={draftNightlyDateTimeRange.end}
                                                placeholder="结束时间"
                                                onChange={(end) => {
                                                    setDraftNightlyDateTimeRange((previous) => ({ ...previous, end }));
                                                    setNightlyRangePreset('custom');
                                                }}
                                            />
                                        </div>
                                        <div className="wua-filter-actions">
                                            <button
                                                type="button"
                                                className="pm-btn pm-btn-primary"
                                                disabled={!draftNightlyDateTimeRange.start || !draftNightlyDateTimeRange.end}
                                                onClick={() => setNightlyDateTimeRange(draftNightlyDateTimeRange)}
                                            >
                                                <Search size={14} />查询
                                            </button>
                                            <button type="button" className="pm-btn pm-btn-ghost" onClick={resetNightlyRange}>重置</button>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="wua-date-filter"><span>数据时间</span><ElDateRangePicker size="medium" start={draftRange.start} end={draftRange.end} onChange={setDraftRange} /></div>
                                        <div className="wua-filter-actions">
                                            <button type="button" className="pm-btn pm-btn-primary" disabled={!draftRange.start || !draftRange.end} onClick={() => setRange(draftRange)}><Search size={14} />查询</button>
                                            <button type="button" className="pm-btn pm-btn-ghost" onClick={() => { setDraftRange(DEFAULT_RANGE); setRange(DEFAULT_RANGE); }}>重置</button>
                                        </div>
                                    </>
                                )}
                            </div>
                            {activeTab === 'nightly' && (
                                <div className="wua-nightly-config-hint" aria-label="夜间用水统一配置说明">
                                    <div className="wua-nightly-config-hint__main">
                                        <span>夜间时段 <strong>{formatNightlyPeriod(nightlyConfig.period)}</strong></span>
                                        <span>监测字段 <strong>{formatNightlyFieldLabels(nightlyConfig.fields)}</strong></span>
                                    </div>
                                    <small>平台统一配置，适用于全部设备；可在数据监测页修改</small>
                                </div>
                            )}
                        </div>

                        <div className="wua-workspace__body">
                            {showChart && (
                                <div className="wua-chart-block">
                                    <div className="wua-block-head">
                                        <div>
                                            <h3>{activeTab === 'nightly' ? '夜间用水统计' : `${TAB_LABELS[activeTab]}趋势`}</h3>
                                            <p>{rangeHint}{activeTab === 'hourly' ? ' · 逐时' : activeTab === 'nightly' ? ` · 统计时段 ${formatNightlyPeriod(nightlyConfig.period)}` : ''}</p>
                                        </div>
                                        {(
                                            <div className="wua-view-toggle" role="group" aria-label="内容视图">
                                                <button type="button" className={contentView === 'chart' ? 'is-active' : ''} onClick={() => setContentView('chart')}><TrendingUp size={14} />趋势图</button>
                                                <button type="button" className={contentView === 'detail' ? 'is-active' : ''} onClick={() => setContentView('detail')}><List size={14} />数据明细</button>
                                            </div>
                                        )}
                                    </div>

                                    {activeTab === 'nightly' && (
                                        <div className="wua-nightly-summary" aria-label="夜间用水统计摘要">
                                            <div className="wua-nightly-hero">
                                                <div className="wua-nightly-hero__icon"><Droplets size={22} /></div>
                                                <div className="wua-nightly-hero__content">
                                                    <span>累计夜间用水</span>
                                                    <strong>{formatNumber(nightlyStatistics.totalUsage)}<em>m³</em></strong>
                                                    <small>{rangeHint} · 已统计 {nightlyRecords.length} 个夜间周期</small>
                                                </div>
                                                <div className="wua-nightly-hero__period">
                                                    <Clock3 size={14} />{formatNightlyPeriod(nightlyConfig.period)}
                                                </div>
                                            </div>
                                            <div className="wua-nightly-metric is-peak">
                                                <div className="wua-nightly-metric__head"><span><ArrowUpRight size={15} />峰值流量</span><b>MAX</b></div>
                                                <strong>{nightlyStatistics.peak ? formatNumber(nightlyStatistics.peak.peakFlow) : '-'}<em>m³/h</em></strong>
                                                <small>{nightlyStatistics.peak ? `${nightlyStatistics.peak.date} · ${nightlyStatistics.peak.peakHour}` : '暂无数据'}</small>
                                            </div>
                                            <div className="wua-nightly-metric is-valley">
                                                <div className="wua-nightly-metric__head"><span><ArrowDownRight size={15} />谷值流量</span><b>MIN</b></div>
                                                <strong>{nightlyStatistics.valley ? formatNumber(nightlyStatistics.valley.valleyFlow) : '-'}<em>m³/h</em></strong>
                                                <small>{nightlyStatistics.valley ? `${nightlyStatistics.valley.date} · ${nightlyStatistics.valley.valleyHour}` : '暂无数据'}</small>
                                            </div>
                                        </div>
                                    )}
                                    {activeTab === 'nightly' ? (
                                        <div className="wua-nightly-distribution">
                                            <div className="wua-nightly-distribution__head">
                                                <div>
                                                    <h4>峰谷时刻分布</h4>
                                                    <p>查看统计周期内，峰值与谷值最常出现在哪些小时</p>
                                                </div>
                                                <div className="wua-nightly-insights">
                                                    <span className="is-peak"><i />峰值集中 <strong>{nightlyStatistics.peakCommonHour}</strong><small>{nightlyStatistics.peakCommonCount} 次</small></span>
                                                    <span className="is-valley"><i />谷值集中 <strong>{nightlyStatistics.valleyCommonHour}</strong><small>{nightlyStatistics.valleyCommonCount} 次</small></span>
                                                </div>
                                            </div>
                                            <Chart option={nightlyDistributionOption} ariaLabel="峰谷时刻分布" />
                                        </div>
                                    ) : (
                                        <Chart option={chartOption} ariaLabel={`${TAB_LABELS[activeTab]}趋势`} />
                                    )}
                                </div>
                            )}

                            {showDetail && (
                            <div className="wua-data-block">
                                <div className="wua-block-head">
                                    <div>
                                        <h3>{detailTitle}</h3>
                                        <p>{activeTab === 'alarm' ? `共 ${detailCount} 条 · 与设备告警信息同步` : `共 ${detailCount} 条 · ${rangeHint}`}</p>
                                    </div>
                                    <div className="wua-block-actions">
                                        <button type="button" className="wua-export-btn" onClick={handleExportDetail}><Download size={14} />导出数据</button>
                                        {activeTab !== 'history' && (
                                            <div className="wua-view-toggle" role="group" aria-label="内容视图">
                                                <button type="button" className={contentView === 'chart' ? 'is-active' : ''} onClick={() => setContentView('chart')}><TrendingUp size={14} />趋势图</button>
                                                <button type="button" className={contentView === 'detail' ? 'is-active' : ''} onClick={() => setContentView('detail')}><List size={14} />数据明细</button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {activeTab === 'alarm' ? (
                                    <div className="pm-table-wrap wua-alarm-table-wrap">
                                        <table className="pm-table pm-table--device-alarm-page">
                                            <thead>
                                                <tr>
                                                    <th>序号</th>
                                                    <th>事件名称</th>
                                                    <th>告警等级</th>
                                                    <th>设备名称</th>
                                                    <th>设备编号</th>
                                                    <th>所属产品</th>
                                                    <th>所属片区</th>
                                                    <th>阅读状态</th>
                                                    <th>触发时间</th>
                                                    <th>触发内容</th>
                                                    <th>处理状态</th>
                                                    <th>操作</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {pagination.items.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={12} className="pcp-empty-cell">当前设备暂无告警记录</td>
                                                    </tr>
                                                ) : (pagination.items as DeviceAlarmRecord[]).map((alarm, index) => (
                                                    <tr key={alarm.id}>
                                                        <td>{(pagination.currentPage - 1) * Number(pageSize) + index + 1}</td>
                                                        <td>{alarm.eventName}</td>
                                                        <td><AlarmLevelCell level={alarm.level} /></td>
                                                        <td>{alarm.deviceName}</td>
                                                        <td>{alarm.deviceCode}</td>
                                                        <td>{resolveAlarmProductName(alarm.productId, products)}</td>
                                                        <td>{isUnassigned ? '-' : (alarm.space || '-')}</td>
                                                        <td><ReadStatusCell status={alarm.readStatus} /></td>
                                                        <td>{alarm.triggeredAt}</td>
                                                        <td>
                                                            <span
                                                                className="dai-trigger-content"
                                                                title={resolveAlarmTriggerContent(alarm)}
                                                            >
                                                                {resolveAlarmTriggerContentListDisplay(alarm)}
                                                            </span>
                                                        </td>
                                                        <td><ProcessStatusCell status={alarm.processStatus} /></td>
                                                        <td>
                                                            <div className="dai-table-actions">
                                                                {alarm.processStatus === '未处理' ? (
                                                                    <button type="button" onClick={() => handleProcess(alarm)}>处理</button>
                                                                ) : (
                                                                    <button type="button" onClick={() => handleView(alarm)}>查看</button>
                                                                )}
                                                                {alarm.processStatus === '未处理' ? (
                                                                    <button type="button" onClick={() => handleConvertTicket(alarm)}>转为工单</button>
                                                                ) : (
                                                                    <span className="is-disabled">转为工单</span>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                <div className="wua-table-wrap">
                                    {activeTab === 'history' && (
                                        <table className="wua-table wua-table--history">
                                            <thead>
                                                <tr>
                                                    <th>抄表时间</th>
                                                    <th className="col-num">累计读数(m³)</th>
                                                    <th className="col-num">日结累计正向流量(m³)</th>
                                                    <th className="col-num">日结累计逆向流量(m³)</th>
                                                    <th className="col-num">电池电压(V)</th>
                                                    <th className="col-num">信号强度(dBm)</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(pagination.items as MonitorRecord[]).map((record) => (
                                                    <tr key={record.readAt}>
                                                        <td>{record.readAt}</td>
                                                        <td className="col-num">{formatNumber(record.cumulativeReading)}</td>
                                                        <td className="col-num">{formatNumber(record.forwardAccumulation)}</td>
                                                        <td className="col-num">{formatNumber(record.reverseAccumulation)}</td>
                                                        <td className="col-num">{formatNumber(record.batteryVoltage, 2)}</td>
                                                        <td className="col-num"><span className={record.signalStrength < -75 ? 'wua-signal is-weak' : ''}>{record.signalStrength}</span></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}

                                    {activeTab === 'daily' && (
                                        <table className="wua-table wua-table--daily">
                                            <thead>
                                                <tr>
                                                    <th>日期</th>
                                                    <th>抄表时间</th>
                                                    <th className="col-num">日用水(m³)</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(pagination.items as MonitorRecord[]).map((record) => (
                                                    <tr key={record.readAt}>
                                                        <td>{record.date}</td>
                                                        <td>{record.readAt}</td>
                                                        <td className="col-num">{formatNumber(record.dailyUsage)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}

                                    {activeTab === 'monthly' && (
                                        <table className="wua-table wua-table--monthly">
                                            <thead>
                                                <tr>
                                                    <th>月份</th>
                                                    <th className="col-num">月用水(m³)</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(pagination.items as MonthlyRecord[]).map((record) => (
                                                    <tr key={record.month}>
                                                        <td>{record.month}</td>
                                                        <td className="col-num">{formatNumber(record.monthlyUsage)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}

                                    {activeTab === 'hourly' && (
                                        <table className="wua-table wua-table--hourly">
                                            <thead>
                                                <tr>
                                                    <th>时间</th>
                                                    <th className="col-num">时用水(m³)</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(pagination.items as HourlyRecord[]).map((record) => (
                                                    <tr key={record.readAt}>
                                                        <td>{record.readAt}</td>
                                                        <td className="col-num">{formatNumber(record.hourlyUsage)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}

                                    {activeTab === 'nightly' && (
                                        <table className="wua-table wua-table--nightly">
                                            <thead>
                                                <tr>
                                                    <th>数据时间</th>
                                                    <th>统计时段</th>
                                                    {nightlyFieldSet.has('usage') && <th className="col-num">夜间用水(m³)</th>}
                                                    {(nightlyFieldSet.has('usage') || nightlyFieldSet.has('ratio')) && (
                                                        <th className="col-num">日用水(m³)</th>
                                                    )}
                                                    {nightlyFieldSet.has('ratio') && <th className="col-num">占日比例</th>}
                                                    {nightlyFieldSet.has('peak') && <th className="col-num">峰值流量(m³/h)</th>}
                                                    {nightlyFieldSet.has('peak') && <th>峰值时刻</th>}
                                                    {nightlyFieldSet.has('valley') && <th className="col-num">谷值流量(m³/h)</th>}
                                                    {nightlyFieldSet.has('valley') && <th>谷值时刻</th>}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(pagination.items as NightlyRecord[]).map((record) => (
                                                    <tr key={`nightly-${record.date}`}>
                                                        <td>{record.dataTime}</td>
                                                        <td>{record.period}</td>
                                                        {nightlyFieldSet.has('usage') && (
                                                            <td className="col-num">{formatNumber(record.nightlyUsage)}</td>
                                                        )}
                                                        {(nightlyFieldSet.has('usage') || nightlyFieldSet.has('ratio')) && (
                                                            <td className="col-num">{formatNumber(record.dailyUsage)}</td>
                                                        )}
                                                        {nightlyFieldSet.has('ratio') && (
                                                            <td className="col-num">{formatNumber(record.ratio, 1)}%</td>
                                                        )}
                                                        {nightlyFieldSet.has('peak') && (
                                                            <td className="col-num">{formatNumber(record.peakFlow)}</td>
                                                        )}
                                                        {nightlyFieldSet.has('peak') && <td>{record.peakHour}</td>}
                                                        {nightlyFieldSet.has('valley') && (
                                                            <td className="col-num">{formatNumber(record.valleyFlow)}</td>
                                                        )}
                                                        {nightlyFieldSet.has('valley') && <td>{record.valleyHour}</td>}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}

                                </div>
                                )}
                                <ListPagination
                                    total={pagination.total}
                                    currentPage={pagination.currentPage}
                                    totalPages={pagination.totalPages}
                                    pageSize={pageSize}
                                    jumpPage={jumpPage}
                                    onPageChange={setCurrentPage}
                                    onPageSizeChange={setPageSize}
                                    onJumpPageChange={setJumpPage}
                                />
                            </div>
                            )}
                        </div>
                    </section>
            </div>
        </AppShell>

            <AlarmDetailModal
                open={detailModal !== null}
                mode={detailModal?.mode ?? 'view'}
                alarm={activeAlarm}
                products={products}
                devices={devices}
                onClose={() => setDetailModal(null)}
                onConfirmProcess={handleConfirmProcess}
                onViewWorkOrder={handleViewWorkOrder}
            />

            <ConvertWorkOrderModal
                open={convertModal !== null}
                alarm={convertAlarm}
                alarmLevels={alarmLevels}
                onClose={() => setConvertModal(null)}
                onConfirm={handleConfirmConvert}
            />

            <IotToast toast={toast} />
        </>
    );
}
