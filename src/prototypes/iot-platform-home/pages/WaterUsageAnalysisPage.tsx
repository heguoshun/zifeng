import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as echarts from 'echarts/core';
import type { EChartsCoreOption } from 'echarts/core';
import { BarChart as EChartsBarChart, LineChart as EChartsLineChart } from 'echarts/charts';
import { GridComponent, LegendComponent, TooltipComponent, AxisPointerComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { ArrowLeft, Download, List, MapPin, Search, TrendingUp } from 'lucide-react';
import AppShell from '../components/AppShell';
import ElDateRangePicker from '../components/ElDateRangePicker';
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
import { BAIDU_MAP_AK } from '../config/baiduMap';
import {
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

echarts.use([EChartsBarChart, EChartsLineChart, GridComponent, LegendComponent, TooltipComponent, AxisPointerComponent, CanvasRenderer]);

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
    deviceAlarms: DeviceAlarmRecord[];
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

function dateValues(start: string, end: string) {
    if (!start || !end) return [];
    const values: string[] = [];
    const current = new Date(`${start}T00:00:00`);
    const last = new Date(`${end}T00:00:00`);
    while (current <= last && values.length < 92) {
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
    return dates.map((date, index) => {
        const rSeed = seed + index;
        const alarmCount = alarmPattern[(index + seed) % alarmPattern.length];
        const dailyUsage = Number((meter.dailyUsage * (0.7 + pseudoRandom(rSeed * 17 + 100) * 0.6)).toFixed(2));
        const monthlyUsage = Number((meter.monthlyUsage * (0.85 + pseudoRandom(rSeed * 23 + 200) * 0.3)).toFixed(2));
        const hourlyUsage = Number((meter.hourlyUsage * (0.6 + pseudoRandom(rSeed * 41 + 300) * 0.8)).toFixed(2));
        const nightlyUsage = Number((meter.nightlyUsage * (0.5 + pseudoRandom(rSeed * 31 + 400) * 1.0)).toFixed(2));
        const forwardAccumulation = Number((meter.forwardAccumulation * (0.82 + pseudoRandom(rSeed * 11 + 500) * 0.36)).toFixed(2));
        const reverseAccumulation = Number((meter.reverseAccumulation * (0.5 + pseudoRandom(rSeed * 13 + 600) * 1.2)).toFixed(2));
        const cumulativeReading = Number((meter.currentReading - index * dailyUsage * 0.92).toFixed(2));
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
        return {
            date: record.date,
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
    return Math.floor(count / 12);
}

function getDisplayInstallTime(meter: LargeMeterDevice): string {
    if (meter.installTime) return meter.installTime;
    const seed = meterSeed(meter);
    const year = 2022 + Math.floor(pseudoRandom(seed + 1200) * 4);
    const month = 1 + Math.floor(pseudoRandom(seed + 1201) * 12);
    const day = 1 + Math.floor(pseudoRandom(seed + 1202) * 28);
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} ${String(8 + Math.floor(pseudoRandom(seed + 1203) * 10)).padStart(2, '0')}:00:00`;
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
    deviceAlarms,
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
    const areaName = getAreaName(areas, meter.areaId) || '未分配';
    const records = useMemo(() => buildMonitorRecords(meter, range.start, range.end), [meter, range]);
    const hourlyRecords = useMemo(() => buildHourlyRecords(meter, hourlyRange.start, hourlyRange.end), [meter, hourlyRange]);
    const monthlyRecords = useMemo(() => buildMonthlyRecords(meter, monthlyRange.start, monthlyRange.end), [meter, monthlyRange]);
    const nightlyRecords = useMemo(
        () => buildNightlyRecords(records, meter, nightlyConfig.period),
        [records, meter, nightlyConfig.period],
    );
    const nightlyFieldSet = useMemo(() => new Set(nightlyConfig.fields), [nightlyConfig.fields]);
    const alarmRecords = useMemo(() => filterAlarmsByDevice(deviceAlarms, meter)
        .sort((a, b) => b.triggeredAt.localeCompare(a.triggeredAt)), [deviceAlarms, meter]);
    const coordinates = useMemo(() => {
        if (typeof meter.longitude === 'number' && typeof meter.latitude === 'number') {
            return { lng: meter.longitude, lat: meter.latitude };
        }
        const seed = meterSeed(meter);
        return { lng: 118.71 + pseudoRandom(seed) * 0.16, lat: 31.94 + pseudoRandom(seed + 7) * 0.11 };
    }, [meter]);

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

    const latestReadAt = records[0]?.readAt;

    useEffect(() => {
        setCurrentPage(1);
        setJumpPage('1');
    }, [activeTab, range, monthlyRange, hourlyRange, nightlyConfig, pageSize]);

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
        let labelInterval = 0;
        let labelRotate = 0;

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
            const ordered = [...nightlyRecords].reverse();
            labels = ordered.map((item) => item.date.slice(5));
            labelInterval = buildChartAxisLabelInterval(labels.length);
            const cfg = METRIC_STYLES.nightly;
            const seriesList: EChartsCoreOption['series'] = [];
            if (nightlyFieldSet.has('usage')) {
                seriesList.push({
                    type: 'bar',
                    name: '夜间用水',
                    data: ordered.map((item) => ({
                        value: item.nightlyUsage,
                        itemStyle: { color: item.isAbnormal ? '#f56c6c' : cfg.color },
                    })),
                    barMaxWidth: 24,
                    itemStyle: { color: cfg.color, borderRadius: [3, 3, 0, 0] },
                });
            }
            if (nightlyFieldSet.has('peak')) {
                seriesList.push({
                    ...common,
                    name: '峰值流量',
                    yAxisIndex: nightlyFieldSet.has('usage') ? 1 : 0,
                    data: ordered.map((item) => item.peakFlow),
                    itemStyle: { color: '#fa8c16' },
                });
            }
            if (nightlyFieldSet.has('valley')) {
                seriesList.push({
                    ...common,
                    name: '谷值流量',
                    yAxisIndex: nightlyFieldSet.has('usage') ? 1 : 0,
                    data: ordered.map((item) => item.valleyFlow),
                    itemStyle: { color: '#722ed1' },
                });
            }
            if (nightlyFieldSet.has('ratio')) {
                seriesList.push({
                    ...common,
                    name: '占日比例',
                    yAxisIndex: nightlyFieldSet.has('usage') ? 1 : 0,
                    data: ordered.map((item) => item.ratio),
                    itemStyle: { color: '#13c2c2' },
                });
            }
            series = seriesList.length ? seriesList : [{
                type: 'bar',
                name: TAB_LABELS.nightly,
                data: ordered.map((item) => item.nightlyUsage),
                barMaxWidth: 24,
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
            },
            legend: {
                bottom: 0,
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
                bottom: labelRotate ? 78 : 62,
            },
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
        if (activeTab === 'nightly') return `${TAB_LABELS.nightly}明细（${formatNightlyPeriod(nightlyConfig.period)}）`;
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
            headers = ['日期', '抄表时间', '日用水(m³)', '数据状态'];
            rows = records.map((item) => [item.date, item.readAt, item.dailyUsage, item.readAt === latestReadAt && meter.status === '离线' ? '数据中断' : '正常']);
        } else if (activeTab === 'monthly') {
            headers = ['月份', '月用水(m³)'];
            rows = monthlyRecords.map((item) => [item.month, item.monthlyUsage]);
        } else if (activeTab === 'hourly') {
            headers = ['时间', '时用水(m³)'];
            rows = hourlyRecords.map((item) => [item.readAt, item.hourlyUsage]);
        } else if (activeTab === 'nightly') {
            headers = ['日期', '统计时段'];
            if (nightlyFieldSet.has('usage')) headers.push('夜间用水(m³)');
            if (nightlyFieldSet.has('ratio')) headers.push('日用水(m³)', '占日比例(%)');
            else if (nightlyFieldSet.has('usage')) headers.push('日用水(m³)');
            if (nightlyFieldSet.has('peak')) headers.push('峰值流量(m³/h)', '峰值时刻');
            if (nightlyFieldSet.has('valley')) headers.push('谷值流量(m³/h)', '谷值时刻');
            headers.push('状态');
            rows = nightlyRecords.map((item) => {
                const row: Array<string | number> = [item.date, item.period];
                if (nightlyFieldSet.has('usage')) row.push(item.nightlyUsage);
                if (nightlyFieldSet.has('ratio')) row.push(item.dailyUsage, item.ratio);
                else if (nightlyFieldSet.has('usage')) row.push(item.dailyUsage);
                if (nightlyFieldSet.has('peak')) row.push(item.peakFlow, item.peakHour);
                if (nightlyFieldSet.has('valley')) row.push(item.valleyFlow, item.valleyHour);
                row.push(item.isAbnormal ? '夜间异常' : '正常');
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
        return `${range.start} 至 ${range.end}`;
    }, [activeTab, hourlyRange, monthlyRange, range]);

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
                <div className="crumb">大表中心 / 数据监测 / 设备数据</div>

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
                                <p className="wua-device-head__meta">{meter.code} · {meter.bodyNo} · {areaName}</p>
                            </div>

                            <dl className="wua-info-grid">
                                <div><dt>用户名称</dt><dd>{meter.userName || '—'}</dd></div>
                                <div><dt>用户号</dt><dd>{meter.userNo || '—'}</dd></div>
                                <div><dt>设备编号</dt><dd>{meter.code}</dd></div>
                                <div><dt>表身号</dt><dd>{meter.bodyNo || '—'}</dd></div>
                                <div><dt>表具厂家</dt><dd>{meter.manufacturer || '—'}</dd></div>
                                <div><dt>远传厂家</dt><dd>{resolveRemoteManufacturer(meter)}</dd></div>
                                <div><dt>设备功能</dt><dd>{meter.deviceFunction || '—'}</dd></div>
                                <div><dt>设备口径</dt><dd>{meter.caliber || '—'}</dd></div>
                                <div><dt>通讯码</dt><dd>{meter.communicationNo || '—'}</dd></div>
                                <div><dt>安装时间</dt><dd>{installTime || '—'}</dd></div>
                                <div><dt>具体地址</dt><dd>{meter.installAddress || '—'}</dd></div>
                                <div><dt>所属区域</dt><dd>{areaName || '—'}</dd></div>
                            </dl>
                        </div>

                        <div className="wua-device-col wua-device-col--side">
                            <DevicePointMap longitude={coordinates.lng} latitude={coordinates.lat} name={meter.name} />
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
                                        <div className="wua-date-filter"><span>数据时间</span><ElDateRangePicker size="medium" start={draftRange.start} end={draftRange.end} onChange={setDraftRange} /></div>
                                        <div className="wua-filter-actions">
                                            <button type="button" className="pm-btn pm-btn-primary" disabled={!draftRange.start || !draftRange.end} onClick={() => setRange(draftRange)}><Search size={14} />查询</button>
                                            <button type="button" className="pm-btn pm-btn-ghost" onClick={() => { setDraftRange(DEFAULT_RANGE); setRange(DEFAULT_RANGE); }}>重置</button>
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
                                            <h3>{TAB_LABELS[activeTab]}趋势</h3>
                                            <p>{rangeHint}{activeTab === 'hourly' ? ' · 逐时' : activeTab === 'nightly' ? ` · ${formatNightlyPeriod(nightlyConfig.period)}` : ''}</p>
                                        </div>
                                        <div className="wua-view-toggle" role="group" aria-label="内容视图">
                                            <button type="button" className={contentView === 'chart' ? 'is-active' : ''} onClick={() => setContentView('chart')}><TrendingUp size={14} />趋势图</button>
                                            <button type="button" className={contentView === 'detail' ? 'is-active' : ''} onClick={() => setContentView('detail')}><List size={14} />数据明细</button>
                                        </div>
                                    </div>

                                    <Chart option={chartOption} ariaLabel={`${TAB_LABELS[activeTab]}趋势`} />
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
                                                        <td>{alarm.space}</td>
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
                                                    <th className="col-status">数据状态</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(pagination.items as MonitorRecord[]).map((record) => (
                                                    <tr key={record.readAt}>
                                                        <td>{record.date}</td>
                                                        <td>{record.readAt}</td>
                                                        <td className="col-num">{formatNumber(record.dailyUsage)}</td>
                                                        <td className="col-status">
                                                            <span className={`wua-data-status ${record.readAt === latestReadAt && meter.status === '离线' ? 'is-error' : ''}`}>
                                                                {record.readAt === latestReadAt && meter.status === '离线' ? '数据中断' : '正常'}
                                                            </span>
                                                        </td>
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
                                                    <th>日期</th>
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
                                                    <th className="col-status">状态</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(pagination.items as NightlyRecord[]).map((record) => (
                                                    <tr key={`nightly-${record.date}`}>
                                                        <td>{record.date}</td>
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
                                                        <td className="col-status">
                                                            <span className={`wua-data-status ${record.isAbnormal ? 'is-error' : ''}`}>
                                                                {record.isAbnormal ? '夜间异常' : '正常'}
                                                            </span>
                                                        </td>
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
                onClose={() => setDetailModal(null)}
                onConfirmProcess={handleConfirmProcess}
                onViewWorkOrder={handleViewWorkOrder}
            />

            <ConvertWorkOrderModal
                open={convertModal !== null}
                alarm={convertAlarm}
                onClose={() => setConvertModal(null)}
                onConfirm={handleConfirmConvert}
            />

            <IotToast toast={toast} />
        </>
    );
}
