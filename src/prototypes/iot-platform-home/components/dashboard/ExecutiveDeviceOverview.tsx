import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
    ArrowDownRight,
    ArrowUpRight,
    Boxes,
    CheckCircle2,
    ChevronRight,
    Cpu,
    DatabaseZap,
    Download,
    Info,
    Network,
    PackagePlus,
    RefreshCw,
    Settings2,
    Wifi,
    X,
} from 'lucide-react';
import {
    createInitialDevices,
    resolveDeviceProduct,
    STATUS_LABEL,
    type DeviceRecord,
} from '../../data/devices';
import { createInitialProducts } from '../../data/products';
import {
    getExecutiveOverviewData,
    getOverviewFilterLabel,
    isSingleProductSelected,
    OVERVIEW_PERIODS,
    resolveAssetDimension,
    resolveOfflineDistributionHint,
    type AssetDimension,
    type DonutRow,
    type OverviewPeriod,
} from '../../data/deviceExecutiveOverview';
import {
    buildProductPickerTree,
    DEFAULT_PRODUCT_TREE_EXPANDED,
    itemMatchesProductFilter,
} from '../../data/productCategories';
import ElTreeSelect from '../ElTreeSelect';
import ListPagination from '../ListPagination';
import { DEFAULT_LIST_PAGE_SIZE, paginateItems } from '../../utils/listPagination';
import '../../device-executive-overview.css';
import '../../product-management.css';

type ExecutiveDeviceOverviewProps = {
    onNavigateDevices: () => void;
    onNavigateAlarms: () => void;
    onNavigateWorkOrders: () => void;
    onNavigateProductManagement?: () => void;
    onNavigateProtocolMgmt?: () => void;
    onNavigateCertificateMgmt?: () => void;
    onNavigateNetworkService?: () => void;
};

const DONUT_SEGMENT_COLORS = ['#5b8def', '#7da4ec', '#9bb9ef', '#bbcef2', '#d5e0f4'];

function polarToCartesian(cx: number, cy: number, radius: number, angleDeg: number) {
    const angleRad = (angleDeg * Math.PI) / 180;
    return {
        x: cx + radius * Math.cos(angleRad),
        y: cy + radius * Math.sin(angleRad),
    };
}

function describeDonutArc(cx: number, cy: number, outerR: number, innerR: number, startAngle: number, endAngle: number) {
    const startOuter = polarToCartesian(cx, cy, outerR, startAngle);
    const endOuter = polarToCartesian(cx, cy, outerR, endAngle);
    const startInner = polarToCartesian(cx, cy, innerR, endAngle);
    const endInner = polarToCartesian(cx, cy, innerR, startAngle);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    return [
        `M ${startOuter.x} ${startOuter.y}`,
        `A ${outerR} ${outerR} 0 ${largeArc} 1 ${endOuter.x} ${endOuter.y}`,
        `L ${startInner.x} ${startInner.y}`,
        `A ${innerR} ${innerR} 0 ${largeArc} 0 ${endInner.x} ${endInner.y}`,
        'Z',
    ].join(' ');
}

function buildDonutSegments(rows: DonutRow[], size = 148, innerInset = 16) {
    const cx = size / 2;
    const cy = size / 2;
    const outerR = size / 2;
    const innerR = outerR - innerInset;
    let startAngle = -90;

    return rows.map((row, index) => {
        const sweep = (row.ratio / 100) * 360;
        const endAngle = startAngle + sweep;
        const path = describeDonutArc(cx, cy, outerR, innerR, startAngle, endAngle);
        const midAngle = startAngle + sweep / 2;
        const tooltipAnchor = polarToCartesian(cx, cy, (outerR + innerR) / 2, midAngle);
        startAngle = endAngle;
        return { path, row, index, tooltipAnchor };
    });
}

function InteractiveDonut({
    rows,
    centerValue,
    centerLabel,
    colors = DONUT_SEGMENT_COLORS,
    ariaLabel,
    unit = '台',
    size = 148,
}: {
    rows: DonutRow[];
    centerValue: string;
    centerLabel: string;
    colors?: string[];
    ariaLabel: string;
    unit?: string;
    size?: number;
}) {
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const segments = useMemo(() => buildDonutSegments(rows, size), [rows, size]);
    const activeRow = activeIndex === null ? null : rows[activeIndex];
    const activeAnchor = activeIndex === null ? null : segments[activeIndex]?.tooltipAnchor;
    const center = size / 2;
    const innerCircleR = size / 2 - 16;

    return (
        <div
            className="edo-donut edo-donut--interactive"
            style={{ width: size, height: size }}
            aria-label={ariaLabel}
            onMouseLeave={() => setActiveIndex(null)}
        >
            <svg className="edo-donut-svg" viewBox={`0 0 ${size} ${size}`} width={size} height={size} aria-hidden="true">
                {segments.map((segment) => (
                    <path
                        key={segment.row.name}
                        d={segment.path}
                        fill={colors[segment.index % colors.length]}
                        className={`edo-donut-segment${activeIndex === null || activeIndex === segment.index ? ' is-active' : ' is-dimmed'}`}
                        onMouseEnter={() => setActiveIndex(segment.index)}
                        onFocus={() => setActiveIndex(segment.index)}
                        onBlur={() => setActiveIndex(null)}
                    />
                ))}
                <circle cx={center} cy={center} r={innerCircleR} fill="transparent" onMouseEnter={() => setActiveIndex(null)} />
            </svg>
            <span className="edo-donut-core"><strong>{centerValue}</strong><small>{centerLabel}</small></span>
            {activeRow && activeAnchor ? (
                <span
                    className="edo-donut-tooltip"
                    role="tooltip"
                    style={{ left: `${activeAnchor.x}px`, top: `${activeAnchor.y}px` }}
                >
                    <strong>{activeRow.name}</strong>
                    <span>{activeRow.value.toLocaleString()} {unit} · {activeRow.ratio}%</span>
                </span>
            ) : null}
        </div>
    );
}

const ALARM_STATUS_COLORS = ['#f05a45', '#5b8def', '#3fae7a'];
const WORK_ORDER_STATUS_COLORS = ['#5b8def', '#9bb9ef', '#f0a020', '#3fae7a'];

type SummaryDrilldownKey = 'assetInUse' | 'assetIdle' | 'onlineActive' | 'onlineOffline' | 'dataAnomaly' | 'alarmPending';

type DrilldownRow = {
    id: string;
    device: DeviceRecord;
    productName: string;
    location: string;
};

const DRILLDOWN_META: Record<SummaryDrilldownKey, { title: string; subtitle: string; exportName: string }> = {
    assetInUse: {
        title: '在用设备数据',
        subtitle: '展示当前筛选范围内的在用设备样例。',
        exportName: '在用设备数据',
    },
    assetIdle: {
        title: '闲置设备数据',
        subtitle: '展示当前筛选范围内的闲置、禁用及需盘点设备。',
        exportName: '闲置设备数据',
    },
    onlineActive: {
        title: '在线设备数据',
        subtitle: '展示当前在线设备，便于核对连接正常的设备清单。',
        exportName: '在线设备数据',
    },
    onlineOffline: {
        title: '离线设备信息',
        subtitle: '展示当前离线设备，优先定位长时间未恢复的设备。',
        exportName: '离线设备信息',
    },
    dataAnomaly: {
        title: '当前异常设备',
        subtitle: '展示此刻仍存在缺报、解析失败或非整点上报等数据异常的设备。',
        exportName: '当前异常设备',
    },
    alarmPending: {
        title: '待处理告警设备信息',
        subtitle: '展示待处理告警关联的设备数据。',
        exportName: '待处理告警设备信息',
    },
};

function getDrilldownRowLimit(key: SummaryDrilldownKey, total: number) {
    if (key === 'onlineOffline' || key === 'dataAnomaly' || key === 'alarmPending' || key === 'assetIdle') {
        return total;
    }
    return Math.min(total, 200);
}

function buildDetailRows(devices: DeviceRecord[], products = createInitialProducts()): DrilldownRow[] {
    return devices.map((device, index) => {
        const product = resolveDeviceProduct(device, products);

        return {
            id: `${device.id}-${index}`,
            device,
            productName: product.productName,
            location: device.installAddress?.trim() || device.mapAddress?.trim() || '未记录',
        };
    });
}

function expandDrilldownRows(rows: DrilldownRow[], targetCount: number) {
    if (!rows.length || targetCount <= rows.length) return rows.slice(0, targetCount);

    return Array.from({ length: targetCount }, (_, index) => {
        const source = rows[index % rows.length];
        const batch = Math.floor(index / rows.length);
        if (batch === 0) return source;
        const suffix = String(index + 1).padStart(4, '0');
        return {
            ...source,
            id: `${source.id}-copy-${index}`,
            device: {
                ...source.device,
                id: `${source.device.id}-copy-${index}`,
                code: `${source.device.code}-${suffix}`,
                name: `${source.device.name}-${suffix}`,
            },
        };
    });
}

function filterDevicesByProduct(
    devices: DeviceRecord[],
    productFilterId: string,
    products = createInitialProducts(),
) {
    if (productFilterId === 'all') return devices;
    return devices.filter((device) => itemMatchesProductFilter(productFilterId, device.productId, products));
}

function buildSummaryDrilldownRows(
    key: SummaryDrilldownKey,
    productFilterId: string,
    targetCount: number,
) {
    const products = createInitialProducts();
    const devices = filterDevicesByProduct(createInitialDevices(products), productFilterId, products);
    const fallbackDevices = devices.length ? devices : createInitialDevices(products);
    const rowLimit = getDrilldownRowLimit(key, targetCount);
    const expandRows = (matchedDevices: DeviceRecord[]) => expandDrilldownRows(buildDetailRows(matchedDevices, products), rowLimit);

    if (key === 'assetInUse') {
        return expandRows(fallbackDevices.filter((device) => device.enabled && device.status !== 'disabled'));
    }
    if (key === 'assetIdle') {
        return expandRows(fallbackDevices.filter((device) => !device.enabled || device.status === 'disabled'));
    }
    if (key === 'onlineActive') {
        return expandRows(fallbackDevices.filter((device) => device.status === 'online'));
    }
    if (key === 'onlineOffline') {
        return expandRows(fallbackDevices.filter((device) => device.status === 'offline'));
    }
    if (key === 'dataAnomaly') {
        return expandRows(fallbackDevices.filter((device) => device.status === 'fault' || device.status === 'offline'));
    }
    if (key === 'alarmPending') {
        return expandRows(fallbackDevices.filter((device) => device.status === 'fault' || device.status === 'offline'));
    }
    return [];
}

function csvEscape(value: string | number) {
    const text = String(value).replaceAll('"', '""');
    return `"${text}"`;
}

function buildDrilldownCsvHref(rows: DrilldownRow[]) {
    const headers = ['设备名称', '设备编号', '产品', '状态', '位置'];
    const body = rows.map((row) => [
        row.device.name,
        row.device.code,
        row.productName,
        STATUS_LABEL[row.device.status],
        row.location,
    ]);
    const csv = [headers, ...body].map((line) => line.map(csvEscape).join(',')).join('\n');
    return `data:text/csv;charset=utf-8,${encodeURIComponent(`\ufeff${csv}`)}`;
}

function SummaryDrilldownDialog({
    openKey,
    total,
    rows,
    onClose,
}: {
    openKey: SummaryDrilldownKey | null;
    total: number;
    rows: DrilldownRow[];
    onClose: () => void;
}) {
    const [pageSize, setPageSize] = useState(DEFAULT_LIST_PAGE_SIZE);
    const [currentPage, setCurrentPage] = useState(1);
    const [jumpPage, setJumpPage] = useState('1');

    useEffect(() => {
        if (!openKey) return undefined;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [openKey]);

    useEffect(() => {
        if (!openKey) return;
        setCurrentPage(1);
        setJumpPage('1');
    }, [openKey, rows.length, pageSize]);

    const pagination = useMemo(
        () => paginateItems(rows, currentPage, Number(pageSize)),
        [currentPage, pageSize, rows],
    );

    useEffect(() => {
        if (!openKey) return;
        setJumpPage(String(pagination.currentPage));
    }, [openKey, pagination.currentPage]);

    if (!openKey) return null;

    const meta = DRILLDOWN_META[openKey];
    if (!meta) return null;

    return createPortal(
        <div className="pcp-drawer-mask edo-detail-drawer-mask" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
            <aside className="pcp-drawer edo-detail-drawer" role="dialog" aria-modal="true" aria-labelledby="edo-detail-drawer-title" onMouseDown={(event) => event.stopPropagation()}>
                <div className="pcp-drawer__head">
                    <div>
                        <h3 id="edo-detail-drawer-title">{meta.title}</h3>
                        <p>{meta.subtitle}</p>
                    </div>
                    <button type="button" className="pcp-drawer__close" aria-label="关闭设备信息抽屉" onClick={onClose}>×</button>
                </div>
                <div className="pcp-drawer__body edo-detail-drawer__body">
                    <div className="edo-detail-drawer__stats">
                    <span><small>当前口径总数</small><strong>{total.toLocaleString()}</strong></span>
                    <span><small>列表数据量</small><strong>{rows.length.toLocaleString()}</strong></span>
                    <span><small>统计范围</small><strong>当前筛选</strong></span>
                    </div>
                    <div className="pm-table-wrap edo-detail-table">
                        <table className="pm-table edo-detail-table__inner" aria-label={meta.title}>
                            <thead>
                                <tr>
                                    <th>设备名称</th>
                                    <th>设备编号</th>
                                    <th>产品</th>
                                    <th>状态</th>
                                    <th>安装位置</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pagination.items.map((row) => (
                                    <tr key={row.id}>
                                        <td>{row.device.name}</td>
                                        <td>{row.device.code}</td>
                                        <td>{row.productName}</td>
                                        <td><span className="edo-detail-status"><i className={`is-${row.device.status}`} />{STATUS_LABEL[row.device.status]}</span></td>
                                        <td>{row.location}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="edo-detail-pagination">
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
                </div>
                <div className="pcp-drawer__foot">
                    <a
                        className="pm-btn pm-btn-ghost edo-detail-export"
                        href={buildDrilldownCsvHref(rows)}
                        download={`${meta.exportName}.csv`}
                    >
                        <Download size={14} />导出
                    </a>
                    <button type="button" className="pm-btn pm-btn-primary" onClick={onClose}>关闭</button>
                </div>
            </aside>
        </div>,
        document.body,
    );
}

function TrendBars({ values, tone = 'ink' }: { values: number[]; tone?: 'ink' | 'alert' }) {
    const max = Math.max(...values);
    const min = Math.min(...values);
    return (
        <div className={`edo-trend-bars edo-trend-bars--${tone}`} aria-label="趋势">
            {values.map((value, index) => {
                const height = 34 + ((value - min) / Math.max(max - min, 1)) * 56;
                return <span key={`${value}-${index}`} style={{ height: `${height}%` }} title={`${value}`} />;
            })}
        </div>
    );
}

function MetricIcon({ type }: { type: string }) {
    if (type === 'online') return <Wifi size={18} />;
    if (type === 'data') return <DatabaseZap size={18} />;
    return <CheckCircle2 size={18} />;
}

function comparisonLabel(period: OverviewPeriod) {
    if (period === '今日') return '较昨日';
    if (period === '近7天') return '较前7天';
    return '较前30天';
}

function ExecutiveDeviceOverview({
    onNavigateDevices,
    onNavigateAlarms,
    onNavigateWorkOrders,
    onNavigateProductManagement,
    onNavigateProtocolMgmt,
    onNavigateCertificateMgmt,
    onNavigateNetworkService,
}: ExecutiveDeviceOverviewProps) {
    const [period, setPeriod] = useState<OverviewPeriod>('近7天');
    const [dimension, setDimension] = useState<AssetDimension>('产品');
    const [productFilterId, setProductFilterId] = useState('all');
    const [refreshedAt, setRefreshedAt] = useState('2026-06-22 10:30');
    const [refreshing, setRefreshing] = useState(false);
    const [metricGuideOpen, setMetricGuideOpen] = useState(false);
    const [summaryDrilldownOpen, setSummaryDrilldownOpen] = useState<SummaryDrilldownKey | null>(null);
    const metricGuideRef = useRef<HTMLDivElement>(null);

    const products = useMemo(() => createInitialProducts(), []);
    const productTree = useMemo(() => buildProductPickerTree(products), [products]);
    const productFilterLabel = useMemo(
        () => getOverviewFilterLabel(productFilterId, products),
        [productFilterId, products],
    );

    const singleProduct = isSingleProductSelected(productFilterId);
    const effectiveDimension = resolveAssetDimension(productFilterId, dimension);
    const overviewData = useMemo(
        () => getExecutiveOverviewData(productFilterId, period, products),
        [productFilterId, period, products],
    );
    const comparisonText = comparisonLabel(period);

    const assetRows = useMemo(
        () => (effectiveDimension === '产品' ? overviewData.assetRowsByProduct : overviewData.assetRowsByGroup),
        [effectiveDimension, overviewData.assetRowsByGroup, overviewData.assetRowsByProduct],
    );
    const assetTotal = useMemo(() => assetRows.reduce((sum, row) => sum + row.value, 0), [assetRows]);
    const alarmTotal = useMemo(
        () => overviewData.alarmStatusRows.reduce((sum, row) => sum + row.value, 0),
        [overviewData.alarmStatusRows],
    );
    const workOrderTotal = useMemo(
        () => overviewData.workOrderStatusRows.reduce((sum, row) => sum + row.value, 0),
        [overviewData.workOrderStatusRows],
    );
    const drilldownTotal = useMemo(() => {
        if (summaryDrilldownOpen === 'assetInUse') return overviewData.assetSummary.inUse;
        if (summaryDrilldownOpen === 'assetIdle') return overviewData.assetSummary.idle;
        if (summaryDrilldownOpen === 'onlineActive') return overviewData.onlineRows[0]?.value ?? 0;
        if (summaryDrilldownOpen === 'onlineOffline') return overviewData.onlineRows[1]?.value ?? 0;
        if (summaryDrilldownOpen === 'dataAnomaly') return overviewData.anomaly.deviceCount;
        if (summaryDrilldownOpen === 'alarmPending') return overviewData.alarmStatusRows[0]?.value ?? 0;
        return 0;
    }, [overviewData, summaryDrilldownOpen]);
    const drilldownRows = useMemo(
        () => (summaryDrilldownOpen
            ? buildSummaryDrilldownRows(summaryDrilldownOpen, productFilterId, drilldownTotal)
            : []),
        [drilldownTotal, productFilterId, summaryDrilldownOpen],
    );

    useEffect(() => {
        if (singleProduct && dimension !== '分组') {
            setDimension('分组');
        }
    }, [singleProduct, dimension]);

    useEffect(() => {
        if (!metricGuideOpen) return undefined;
        const handleOutsideClick = (event: MouseEvent) => {
            if (metricGuideRef.current && !metricGuideRef.current.contains(event.target as Node)) {
                setMetricGuideOpen(false);
            }
        };
        document.addEventListener('mousedown', handleOutsideClick);
        return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, [metricGuideOpen]);

    const handleRefresh = () => {
        setRefreshing(true);
        window.setTimeout(() => {
            const now = new Date();
            setRefreshedAt(now.toLocaleString('zh-CN', { hour12: false }).replaceAll('/', '-'));
            setRefreshing(false);
        }, 650);
    };

    const assetDistributionHint = singleProduct
        ? `共 ${assetTotal.toLocaleString()} 台设备，按分组类型分布`
        : `共 ${assetTotal.toLocaleString()} 台设备，按${effectiveDimension}类型分布`;
    const offlineDistributionHint = useMemo(
        () => resolveOfflineDistributionHint(productFilterId, products),
        [productFilterId, products],
    );

    return (
        <div className="edo-page">
            <header className="edo-page-head">
                <div>
                    <div className="crumb">工作台 / 设备综合视图</div>
                    <div className="edo-title-row">
                        <h1>设备综合视图</h1>
                        <span className="edo-status"><i /> 数据运行正常</span>
                    </div>
                    <p>掌握设备资产、运行健康与处置闭环，快速定位需要关注的问题。</p>
                </div>
                <div className="edo-refresh">
                    <span>数据更新于 {refreshedAt}</span>
                    <button type="button" onClick={handleRefresh} disabled={refreshing} aria-label="刷新数据">
                        <RefreshCw size={14} className={refreshing ? 'is-spinning' : ''} />
                        {refreshing ? '更新中' : '刷新'}
                    </button>
                </div>
            </header>

            <section className="edo-filter-bar" aria-label="综合视图筛选">
                <div className="edo-periods">
                    {OVERVIEW_PERIODS.map((item) => (
                        <button key={item} type="button" className={period === item ? 'is-active' : ''} onClick={() => setPeriod(item)}>{item}</button>
                    ))}
                </div>
                <div className="pm-filter-field edo-filter-product">
                    <span className="pm-filter-label">产品</span>
                    <ElTreeSelect
                        className="el-select--medium edo-product-tree-select"
                        size="medium"
                        value={productFilterId}
                        tree={productTree}
                        defaultExpanded={DEFAULT_PRODUCT_TREE_EXPANDED}
                        placeholder="全部"
                        filterable
                        onChange={setProductFilterId}
                    />
                </div>
                <div className="edo-filter-help-wrap" ref={metricGuideRef}>
                    <button type="button" className="edo-filter-help" aria-expanded={metricGuideOpen} onClick={() => setMetricGuideOpen((open) => !open)}><Info size={14} /> 指标口径</button>
                    {metricGuideOpen ? (
                        <div className="edo-metric-guide" role="dialog" aria-label="指标口径说明">
                            <div className="edo-metric-guide__head"><strong>指标口径说明</strong><button type="button" aria-label="关闭指标口径说明" onClick={() => setMetricGuideOpen(false)}><X size={15} /></button></div>
                            <dl>
                                <div><dt>设备总量</dt><dd>当前已建档的全部设备数量。</dd></div>
                                <div><dt>设备在线率</dt><dd>在线设备数 ÷ 设备总量 × 100%。</dd></div>
                                <div><dt>数据正常率</dt><dd>正常接收并解析的数据条数 ÷ 应上报数据条数 × 100%。</dd></div>
                                <div><dt>告警处理率</dt><dd>已处理告警数 ÷ 告警总数 × 100%。</dd></div>
                            </dl>
                            <p>在线率、数据正常率、告警处理率及环比随时间范围变化。设备总量、当前在线/离线台数、当前异常设备、当前待处理告警为当前快照，切换今日/近7天/近30天不变。数据接收异常趋势图仍按所选周期展示历史波动。</p>
                        </div>
                    ) : null}
                </div>
            </section>

            <section className="edo-summary" aria-labelledby="edo-summary-title">
                <div className="edo-section-head">
                    <div><h2 id="edo-summary-title">设备运行概况</h2><p>{productFilterLabel} · {period}</p></div>
                </div>
                <div className="edo-overview-grid">
                    <article className="edo-asset-summary">
                        <div className="edo-overview-title">
                            <span className="edo-metric-icon"><Boxes size={18} /></span><span>设备资产</span>
                        </div>
                        <div className="edo-asset-summary__value">
                            <strong>{overviewData.assetSummary.total.toLocaleString()}</strong>
                            <span className={`is-${overviewData.assetSummary.totalChangeDirection}`}>
                                {overviewData.assetSummary.totalChangeDirection === 'up' ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                                {overviewData.assetSummary.totalChange}
                            </span>
                        </div>
                        <div className="edo-asset-summary__split">
                            <button type="button" onClick={() => setSummaryDrilldownOpen('assetInUse')} aria-label="查看在用设备数据">
                                <small>在用设备</small><b>{overviewData.assetSummary.inUse.toLocaleString()}</b><em>{overviewData.assetSummary.inUseRatio}%</em>
                            </button>
                            <button type="button" onClick={() => setSummaryDrilldownOpen('assetIdle')} aria-label="查看闲置设备数据">
                                <small>闲置设备</small><b>{overviewData.assetSummary.idle.toLocaleString()}</b><em>{overviewData.assetSummary.idleRatio}%</em>
                            </button>
                        </div>
                    </article>
                    {overviewData.summaryMetrics.map((metric) => (
                        <article className="edo-health-summary" key={metric.label}>
                            <div className="edo-overview-title">
                                <span className="edo-metric-icon"><MetricIcon type={metric.icon} /></span><span>{metric.label}</span>
                                <span className="edo-status-rule" tabIndex={0} aria-label={`${metric.label}当前状态${metric.status}，悬浮查看判断标准`}>
                                    <span className="edo-status-rule__state">{metric.status}</span>
                                    <span className="edo-status-rule__info" aria-hidden="true"><Info size={15} /></span>
                                    <span className="edo-status-rule__tooltip" role="tooltip">
                                        <strong>{metric.label}判断标准</strong>
                                        <span className="edo-threshold-chart" aria-hidden="true"><i className="is-error" /><i className="is-warning" /><i className="is-normal" /><b style={{ left: `${metric.marker}%` }} /></span>
                                        <span className="edo-threshold-current">当前 {metric.value}，状态为{metric.status}</span>
                                        <span className="edo-threshold-rules">{metric.rules.map(([label, range]) => <span key={label}><i className={`is-${label === '正常' ? 'normal' : label === '关注' ? 'warning' : 'error'}`} /><b>{label}</b><em>{range}</em></span>)}</span>
                                    </span>
                                </span>
                            </div>
                            <div className="edo-health-summary__value">
                                <strong>{metric.value}</strong>
                                <span className={`is-${metric.direction}`}>
                                    {metric.direction === 'up' ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                                    {comparisonText} {metric.change}
                                </span>
                            </div>
                            <div className="edo-health-summary__detail">
                                {metric.icon === 'online' ? (
                                    <>
                                        <button type="button" onClick={() => setSummaryDrilldownOpen('onlineActive')}>当前在线 {overviewData.onlineRows[0]?.value.toLocaleString() ?? '0'} 台</button>
                                        <span>，</span>
                                        <button type="button" onClick={() => setSummaryDrilldownOpen('onlineOffline')}>当前离线 {overviewData.onlineRows[1]?.value.toLocaleString() ?? '0'} 台</button>
                                    </>
                                ) : null}
                                {metric.icon === 'data' ? (
                                    <button type="button" onClick={() => setSummaryDrilldownOpen('dataAnomaly')}>{metric.detail}</button>
                                ) : null}
                                {metric.icon === 'closed' ? (
                                    <button type="button" onClick={() => setSummaryDrilldownOpen('alarmPending')}>{metric.detail}</button>
                                ) : null}
                            </div>
                        </article>
                    ))}
                </div>
            </section>

            <SummaryDrilldownDialog
                openKey={summaryDrilldownOpen}
                total={drilldownTotal}
                rows={drilldownRows}
                onClose={() => setSummaryDrilldownOpen(null)}
            />

            <div className="edo-two-column">
                <section className="edo-panel" aria-labelledby="edo-assets-title">
                    <div className="edo-section-head">
                        <div>
                            <h2 id="edo-assets-title">设备资产概况</h2>
                            <p>{assetDistributionHint}</p>
                        </div>
                        {!singleProduct ? (
                            <div className="edo-segment">
                                {(['产品', '分组'] as const).map((item) => (
                                    <button
                                        key={item}
                                        type="button"
                                        className={effectiveDimension === item ? 'is-active' : ''}
                                        onClick={() => setDimension(item)}
                                    >
                                        按{item}
                                    </button>
                                ))}
                            </div>
                        ) : null}
                    </div>
                    <div className="edo-proportion-layout edo-proportion-layout--asset">
                        <div className="edo-donut-block edo-donut-block--static">
                            <InteractiveDonut
                                rows={assetRows}
                                centerValue={assetTotal.toLocaleString()}
                                centerLabel={`${effectiveDimension}分布`}
                                ariaLabel={`各${effectiveDimension}类型设备占比`}
                            />
                        </div>
                        <div className="edo-share-list">
                            {assetRows.map((row, index) => (
                                <button type="button" key={row.name} onClick={onNavigateDevices}>
                                    <i className={`is-color-${index + 1}`} />
                                    <span>{row.name}</span>
                                    <strong>{row.value.toLocaleString()}</strong>
                                    <small>{row.ratio}%</small>
                                </button>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="edo-panel" aria-labelledby="edo-offline-title">
                    <div className="edo-section-head">
                        <div>
                            <h2 id="edo-offline-title">离线分析</h2>
                            <p>{offlineDistributionHint}</p>
                        </div>
                        <button className="edo-text-button" type="button" onClick={onNavigateDevices}>
                            查看设备 <ChevronRight size={14} />
                        </button>
                    </div>
                    <div className="edo-proportion-layout edo-proportion-layout--asset">
                        <div className="edo-donut-block edo-donut-block--static">
                            <InteractiveDonut
                                rows={overviewData.offlineRowsByProduct}
                                centerValue={(overviewData.onlineRows[1]?.value ?? 0).toLocaleString()}
                                centerLabel="离线设备"
                                ariaLabel={offlineDistributionHint}
                            />
                            <span className="edo-donut-legend edo-donut-legend--offline">
                                {overviewData.offlineRowsByProduct.map((row, index) => (
                                    <span key={row.name}>
                                        <i className={`is-color-${index + 1}`} />
                                        {row.name} <b>{row.value.toLocaleString()}</b>
                                    </span>
                                ))}
                            </span>
                        </div>
                        <div className="edo-share-list">
                            {overviewData.offlineRowsByProduct.map((row, index) => (
                                <button type="button" key={row.name} onClick={onNavigateDevices}>
                                    <i className={`is-color-${index + 1}`} />
                                    <span>{row.name}</span>
                                    <strong>{row.value.toLocaleString()}</strong>
                                    <small>{row.ratio}%</small>
                                </button>
                            ))}
                        </div>
                    </div>
                </section>
            </div>

            <div className="edo-two-column edo-two-column--lower">
                <section className="edo-panel" aria-labelledby="edo-data-title">
                    <div className="edo-section-head">
                        <div><h2 id="edo-data-title">数据接收异常</h2><p>当前异常设备快照；趋势按 {overviewData.anomaly.trendLabel} 展示历史波动</p></div>
                        <span className="edo-neutral-badge"><DatabaseZap size={13} />正常率 {overviewData.anomaly.normalRate.toFixed(1)}%</span>
                    </div>
                    <div className="edo-anomaly-layout">
                        <div className="edo-anomaly-total">
                            <span>当前异常设备</span>
                            <strong>{overviewData.anomaly.deviceCount.toLocaleString()}</strong>
                            <small>{overviewData.anomaly.totalChange}</small>
                            <TrendBars values={overviewData.anomaly.trendValues} tone="alert" />
                        </div>
                        <div className="edo-anomaly-types">
                            {overviewData.anomaly.types.map((row) => (
                                <div className="edo-anomaly-type-row" key={row.label}>
                                    <span>{row.label}<small>{row.ratio}%</small></span>
                                    <strong>{row.value.toLocaleString()}</strong>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="edo-panel" aria-labelledby="edo-loop-title">
                    <div className="edo-section-head"><div><h2 id="edo-loop-title">告警与工单</h2><p>按状态查看当前告警与工单分布</p></div><button className="edo-text-button" type="button" onClick={onNavigateAlarms}>查看告警 <ChevronRight size={14} /></button></div>
                    <div className="edo-proportion-layout edo-proportion-layout--loop">
                        <div
                            className="edo-donut-block"
                            role="button"
                            tabIndex={0}
                            onClick={onNavigateAlarms}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter' || event.key === ' ') {
                                    event.preventDefault();
                                    onNavigateAlarms();
                                }
                            }}
                            aria-label="查看告警各状态占比"
                        >
                            <InteractiveDonut
                                rows={overviewData.alarmStatusRows}
                                centerValue={alarmTotal.toLocaleString()}
                                centerLabel="告警总量"
                                colors={ALARM_STATUS_COLORS}
                                unit="条"
                                ariaLabel="告警各状态占比"
                            />
                            <div className="edo-status-metrics" aria-label="告警状态分布">
                                {overviewData.alarmStatusRows.map((row, index) => (
                                    <span key={row.name}>
                                        <i style={{ background: ALARM_STATUS_COLORS[index] }} />
                                        <small>{row.name}</small>
                                        <b>{row.value.toLocaleString()}</b>
                                        <em>{row.ratio}%</em>
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div className="edo-online-share">
                            <div
                                className="edo-donut-block edo-donut-block--nested"
                                role="button"
                                tabIndex={0}
                                onClick={onNavigateWorkOrders}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter' || event.key === ' ') {
                                        event.preventDefault();
                                        onNavigateWorkOrders();
                                    }
                                }}
                                aria-label="查看工单各状态占比"
                            >
                                <InteractiveDonut
                                    rows={overviewData.workOrderStatusRows}
                                    centerValue={workOrderTotal.toLocaleString()}
                                    centerLabel="工单总量"
                                    colors={WORK_ORDER_STATUS_COLORS}
                                    unit="单"
                                    ariaLabel="工单各状态占比"
                                />
                                <div className="edo-status-metrics edo-status-metrics--four" aria-label="工单状态分布">
                                    {overviewData.workOrderStatusRows.map((row, index) => (
                                        <span key={row.name}>
                                            <i style={{ background: WORK_ORDER_STATUS_COLORS[index] }} />
                                            <small>{row.name}</small>
                                            <b>{row.value.toLocaleString()}</b>
                                            <em>{row.ratio}%</em>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            <section className="edo-panel edo-access-flow-panel" aria-labelledby="edo-flow-title">
                <div className="edo-section-head">
                    <div>
                        <h2 id="edo-flow-title">设备接入流程</h2>
                        <p>按照以下步骤完成设备从零到在线的全流程接入</p>
                    </div>
                </div>
                <div className="edo-access-flow">
                    {[
                        {
                            step: 1,
                            label: '创建产品',
                            desc: '定义设备类型与通信参数',
                            icon: <PackagePlus size={20} />,
                            onClick: onNavigateProductManagement,
                        },
                        {
                            step: 2,
                            label: '定义物模型',
                            desc: '配置属性、事件与服务',
                            icon: <Cpu size={20} />,
                            onClick: onNavigateProductManagement,
                        },
                        {
                            step: 3,
                            label: '配置接入',
                            desc: '设置协议、证书与网络服务',
                            icon: <Settings2 size={20} />,
                            onClick: onNavigateProtocolMgmt,
                            subItems: [
                                { label: '协议管理', onClick: onNavigateProtocolMgmt },
                                { label: '证书管理', onClick: onNavigateCertificateMgmt },
                                { label: '网络服务', onClick: onNavigateNetworkService },
                            ],
                        },
                        {
                            step: 4,
                            label: '添加设备',
                            desc: '注册设备并绑定产品',
                            icon: <Network size={20} />,
                            onClick: onNavigateDevices,
                        },
                        {
                            step: 5,
                            label: '设备上线',
                            desc: '验证连接与数据上报',
                            icon: <Wifi size={20} />,
                            onClick: onNavigateDevices,
                        },
                    ].map((item, index, array) => (
                        <React.Fragment key={item.step}>
                            <button
                                type="button"
                                className="edo-access-flow__step"
                                onClick={item.onClick}
                                aria-label={`步骤 ${item.step}：${item.label} — ${item.desc}`}
                            >
                                <span className="edo-access-flow__step-num">{item.step}</span>
                                <span className="edo-access-flow__step-icon">{item.icon}</span>
                                <span className="edo-access-flow__step-label">{item.label}</span>
                                <span className="edo-access-flow__step-desc">{item.desc}</span>
                                {item.subItems ? (
                                    <span className="edo-access-flow__step-sub">
                                        {item.subItems.map((sub) => (
                                            <span
                                                key={sub.label}
                                                className="edo-access-flow__sub-tag"
                                                role="link"
                                                tabIndex={0}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    sub.onClick?.();
                                                }}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' || e.key === ' ') {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        sub.onClick?.();
                                                    }
                                                }}
                                            >
                                                {sub.label}
                                            </span>
                                        ))}
                                    </span>
                                ) : null}
                            </button>
                            {index < array.length - 1 ? (
                                <span className="edo-access-flow__arrow" aria-hidden="true">
                                    <svg viewBox="0 0 24 12" width="24" height="12" fill="none">
                                        <path d="M0 6h20M16 1.5l5 4.5-5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </span>
                            ) : null}
                        </React.Fragment>
                    ))}
                </div>
            </section>
        </div>
    );
}

export default ExecutiveDeviceOverview;
