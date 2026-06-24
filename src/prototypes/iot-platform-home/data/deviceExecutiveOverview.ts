import { getProductCategoryLabel } from './productCategories';
import { createInitialProducts, type ProductRecord } from './products';

export type OverviewPeriod = '今日' | '近7天' | '近30天';
export type OverviewProductFilter = string;
export type AssetDimension = '产品' | '分组';

export const OVERVIEW_PERIODS: OverviewPeriod[] = ['今日', '近7天', '近30天'];

export type DonutRow = { name: string; value: number; ratio: number };

export type SummaryMetric = {
    label: string;
    value: string;
    change: string;
    detail: string;
    direction: 'up' | 'down';
    status: '正常' | '关注' | '异常';
    icon: 'online' | 'data' | 'closed';
    marker: number;
    rules: [string, string][];
};

export type OfflineDurationRow = { label: string; value: number; ratio: number };

export type AnomalyTypeRow = { label: string; value: number; ratio: number };

export type ExecutiveOverviewData = {
    assetSummary: {
        total: number;
        totalChange: string;
        totalChangeDirection: 'up' | 'down';
        inUse: number;
        inUseRatio: number;
        idle: number;
        idleRatio: number;
    };
    summaryMetrics: SummaryMetric[];
    assetRowsByProduct: DonutRow[];
    assetRowsByGroup: DonutRow[];
    onlineRows: DonutRow[];
    onlineRate: number;
    onlineRateChange: number;
    onlineRateChangeDirection: 'up' | 'down';
    offlineDuration: OfflineDurationRow[];
    anomaly: {
        deviceCount: number;
        totalChange: string;
        trendValues: number[];
        trendLabel: string;
        normalRate: number;
        types: AnomalyTypeRow[];
    };
    alarmStatusRows: DonutRow[];
    workOrderStatusRows: DonutRow[];
};

type OverviewScope = {
    filterId: string;
    label: string;
    categoryId?: string;
    isAll: boolean;
};

function hashSeed(input: string) {
    let hash = 0;
    for (let i = 0; i < input.length; i += 1) {
        hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
    }
    return hash;
}

function seededFloat(seed: number, min: number, max: number) {
    const value = Math.sin(seed * 12.9898 + seed * 78.233) * 43758.5453;
    const normalized = value - Math.floor(value);
    return min + normalized * (max - min);
}

function roundRatio(rows: Array<{ name: string; value: number }>): DonutRow[] {
    const total = rows.reduce((sum, row) => sum + row.value, 0);
    if (!total) return rows.map((row) => ({ ...row, ratio: 0 }));

    const withRatio = rows.map((row) => ({
        ...row,
        ratio: Math.round((row.value / total) * 1000) / 10,
    }));
    const ratioSum = withRatio.reduce((sum, row) => sum + row.ratio, 0);
    if (withRatio.length && Math.abs(ratioSum - 100) > 0.01) {
        withRatio[0] = {
            ...withRatio[0],
            ratio: Math.round((withRatio[0].ratio + (100 - ratioSum)) * 10) / 10,
        };
    }
    return withRatio;
}

const CATEGORY_TOTALS: Record<string, number> = {
    dabiao: 28360,
    hubiao: 24672,
    yaliji: 17480,
    shuizhiyi: 11642,
    zhuishuizhan: 8200,
};

const ALL_PRODUCT_ROWS: DonutRow[] = roundRatio(
    Object.entries(CATEGORY_TOTALS).map(([id, value]) => ({
        name: getProductCategoryLabel(id),
        value,
    })),
);

const ALL_GROUP_ROWS: DonutRow[] = roundRatio([
    { name: '城北运维组', value: 25148 },
    { name: '城南运维组', value: 23220 },
    { name: '重点客户组', value: 19676 },
    { name: '管网监测组', value: 14202 },
    { name: '其他分组', value: 9812 },
]);

const GROUP_ROWS_BY_CATEGORY: Record<string, DonutRow[]> = {
    dabiao: roundRatio([
        { name: '城北运维组', value: 8420 },
        { name: '城南运维组', value: 7680 },
        { name: '重点客户组', value: 6120 },
        { name: '管网监测组', value: 4180 },
        { name: '其他分组', value: 1960 },
    ]),
    hubiao: roundRatio([
        { name: '重点客户组', value: 9860 },
        { name: '城南运维组', value: 7120 },
        { name: '城北运维组', value: 3680 },
        { name: '管网监测组', value: 2412 },
        { name: '其他分组', value: 1600 },
    ]),
    yaliji: roundRatio([
        { name: '管网监测组', value: 6820 },
        { name: '城北运维组', value: 4280 },
        { name: '城南运维组', value: 3560 },
        { name: '重点客户组', value: 1820 },
        { name: '其他分组', value: 1000 },
    ]),
    shuizhiyi: roundRatio([
        { name: '管网监测组', value: 4680 },
        { name: '城北运维组', value: 2860 },
        { name: '城南运维组', value: 2140 },
        { name: '重点客户组', value: 1280 },
        { name: '其他分组', value: 682 },
    ]),
    zhuishuizhan: roundRatio([
        { name: '管网监测组', value: 3280 },
        { name: '城北运维组', value: 2160 },
        { name: '城南运维组', value: 1540 },
        { name: '重点客户组', value: 920 },
        { name: '其他分组', value: 300 },
    ]),
    water: ALL_GROUP_ROWS,
};

function resolveOverviewScope(filterId: string, products: ProductRecord[]): OverviewScope {
    if (filterId === 'all') {
        return { filterId, label: '全部产品', isAll: true };
    }

    const product = products.find((item) => item.id === filterId);
    if (product) {
        return {
            filterId,
            label: product.name,
            categoryId: product.categoryId,
            isAll: false,
        };
    }

    return {
        filterId,
        label: getProductCategoryLabel(filterId) || filterId,
        categoryId: filterId,
        isAll: false,
    };
}

function resolveCategoryTotal(categoryId: string): number {
    if (categoryId === 'water') {
        return Object.values(CATEGORY_TOTALS).reduce((sum, value) => sum + value, 0);
    }
    return CATEGORY_TOTALS[categoryId] ?? 12000;
}

function resolveAssetTotal(filterId: string, products: ProductRecord[]): number {
    const scope = resolveOverviewScope(filterId, products);
    if (scope.isAll) {
        return ALL_PRODUCT_ROWS.reduce((sum, row) => sum + row.value, 0);
    }

    const product = products.find((item) => item.id === filterId);
    if (!product) {
        return resolveCategoryTotal(scope.categoryId ?? filterId);
    }

    const categoryTotal = resolveCategoryTotal(product.categoryId);
    const siblings = products.filter((item) => item.categoryId === product.categoryId);
    return Math.max(1, Math.round(categoryTotal / Math.max(siblings.length, 1)));
}

function resolveGroupRows(filterId: string, products: ProductRecord[]): DonutRow[] {
    const scope = resolveOverviewScope(filterId, products);
    if (scope.isAll) return ALL_GROUP_ROWS;

    const categoryId = scope.categoryId ?? filterId;
    return GROUP_ROWS_BY_CATEGORY[categoryId] ?? ALL_GROUP_ROWS;
}

function resolveProductRows(filterId: string, products: ProductRecord[], assetTotal: number): DonutRow[] {
    const scope = resolveOverviewScope(filterId, products);
    if (scope.isAll) return ALL_PRODUCT_ROWS;
    return roundRatio([{ name: scope.label, value: assetTotal }]);
}

function buildTrendValues(period: OverviewPeriod, filterId: string, baseCount: number) {
    const seed = hashSeed(`${period}-${filterId}-trend`);
    if (period === '今日') {
        return Array.from({ length: 24 }, (_, index) => {
            const hourFactor = index < 6 ? 0.35 : index < 18 ? 1 : 0.55;
            return Math.max(1, Math.round(baseCount * 0.004 * hourFactor * seededFloat(seed + index, 0.82, 1.18)));
        });
    }
    if (period === '近7天') {
        return Array.from({ length: 7 }, (_, index) => (
            Math.max(1, Math.round(baseCount * 0.05 * seededFloat(seed + index, 0.78, 1.12)))
        ));
    }
    return Array.from({ length: 30 }, (_, index) => (
        Math.max(1, Math.round(baseCount * 0.045 * seededFloat(seed + index, 0.72, 1.08)))
    ));
}

function buildMetricStatus(value: number, normal: number, warning: number): '正常' | '关注' | '异常' {
    if (value >= normal) return '正常';
    if (value >= warning) return '关注';
    return '异常';
}

function formatPercent(value: number, digits = 1) {
    return `${value.toFixed(digits)}%`;
}

function comparisonLabel(period: OverviewPeriod) {
    if (period === '今日') return '较昨日';
    if (period === '近7天') return '较前7天';
    return '较前30天';
}

export function getOverviewFilterLabel(
    productFilterId: string,
    products: ProductRecord[] = createInitialProducts(),
): string {
    return resolveOverviewScope(productFilterId, products).label;
}

export function isSingleProductSelected(productFilterId: string) {
    return productFilterId !== 'all';
}

export function resolveAssetDimension(
    productFilterId: string,
    dimension: AssetDimension,
): AssetDimension {
    return isSingleProductSelected(productFilterId) ? '分组' : dimension;
}

export function getExecutiveOverviewData(
    productFilterId: string,
    period: OverviewPeriod,
    products: ProductRecord[] = createInitialProducts(),
): ExecutiveOverviewData {
    const scope = resolveOverviewScope(productFilterId, products);
    const seed = hashSeed(`${productFilterId}-${period}`);
    const assetTotal = resolveAssetTotal(productFilterId, products);
    const scale = assetTotal / 92058;

    const inUseRatio = seededFloat(seed + 1, 94.5, 97.2);
    const inUse = Math.round(assetTotal * (inUseRatio / 100));
    const idle = assetTotal - inUse;
    const idleRatio = Math.round((idle / assetTotal) * 1000) / 10;

    const onlineRate = seededFloat(seed + 2, scope.categoryId === 'yaliji' ? 94.2 : 95.8, 98.2);
    const onlineCount = Math.round(assetTotal * (onlineRate / 100));
    const offlineCount = assetTotal - onlineCount;

    const dataNormalRate = seededFloat(seed + 3, 96.8, 99.2);
    const anomalyDeviceCount = Math.max(1, Math.round(assetTotal * ((100 - dataNormalRate) / 100)));
    const alarmHandleRate = seededFloat(seed + 4, 84.5, 94.8);

    const onlineRateChange = seededFloat(seed + 5, 0.4, 2.6);
    const onlineRateChangeDirection: 'up' | 'down' = seededFloat(seed + 6, 0, 1) > 0.45 ? 'down' : 'up';
    const dataRateChange = seededFloat(seed + 7, 0.2, 1.8);
    const dataRateChangeDirection: 'up' | 'down' = seededFloat(seed + 8, 0, 1) > 0.5 ? 'down' : 'up';
    const alarmRateChange = seededFloat(seed + 9, 0.8, 3.6);
    const alarmRateChangeDirection: 'up' | 'down' = seededFloat(seed + 10, 0, 1) > 0.35 ? 'up' : 'down';
    const assetTotalChange = seededFloat(seed + 11, 0.6, 2.4);
    const assetTotalChangeDirection: 'up' | 'down' = seededFloat(seed + 12, 0, 1) > 0.4 ? 'up' : 'down';

    const pendingAlarms = Math.max(1, Math.round(47 * scale * seededFloat(seed + 13, 0.7, 1.4)));
    const alarmTotal = Math.max(pendingAlarms + 20, Math.round(562 * scale * seededFloat(seed + 14, 0.75, 1.25)));
    const alarmProcessing = Math.max(1, Math.round(alarmTotal * seededFloat(seed + 15, 0.1, 0.16)));
    const alarmHandled = Math.max(0, alarmTotal - pendingAlarms - alarmProcessing);

    const workOrderTotal = Math.max(1, Math.round(487 * scale * seededFloat(seed + 16, 0.72, 1.28)));
    const workOrderPending = Math.max(1, Math.round(workOrderTotal * seededFloat(seed + 17, 0.2, 0.28)));
    const workOrderReview = Math.max(1, Math.round(workOrderTotal * seededFloat(seed + 18, 0.14, 0.2)));
    const workOrderRejected = Math.max(0, Math.round(workOrderTotal * seededFloat(seed + 19, 0.02, 0.05)));
    const workOrderClosed = Math.max(0, workOrderTotal - workOrderPending - workOrderReview - workOrderRejected);

    const offlineDurationBase = offlineCount || 1;
    const offlineDuration = roundRatio([
        { name: '1小时内', value: Math.round(offlineDurationBase * seededFloat(seed + 20, 0.55, 0.68)) },
        { name: '1–24小时', value: Math.round(offlineDurationBase * seededFloat(seed + 21, 0.18, 0.28)) },
        { name: '1–3天', value: Math.round(offlineDurationBase * seededFloat(seed + 22, 0.08, 0.14)) },
        { name: '超过3天', value: Math.max(1, Math.round(offlineDurationBase * seededFloat(seed + 23, 0.004, 0.02))) },
    ]).map((row) => ({ label: row.name, value: row.value, ratio: row.ratio }));

    const parseFail = Math.round(anomalyDeviceCount * seededFloat(seed + 24, 0.28, 0.38));
    const missingReport = Math.round(anomalyDeviceCount * seededFloat(seed + 25, 0.38, 0.48));
    const offHourReport = Math.max(0, anomalyDeviceCount - parseFail - missingReport);
    const anomalyTypes = roundRatio([
        { name: '解析失败', value: parseFail },
        { name: '缺报', value: missingReport },
        { name: '非整点上报', value: offHourReport },
    ]).map((row) => ({ label: row.name, value: row.value, ratio: row.ratio }));

    const trendValues = buildTrendValues(period, productFilterId, anomalyDeviceCount);
    const trendDelta = period === '今日'
        ? Math.round(seededFloat(seed + 26, 18, 58))
        : period === '近7天'
            ? Math.round(seededFloat(seed + 27, 120, 240))
            : Math.round(seededFloat(seed + 28, 380, 620));
    const trendDirection = seededFloat(seed + 29, 0, 1) > 0.42 ? '减少' : '增加';

    const cmpLabel = comparisonLabel(period);
    const trendLabel = period === '今日' ? '今日逐小时' : period === '近7天' ? '近七日逐日' : '近三十日逐日';

    const onlineStatus = buildMetricStatus(onlineRate, 98, 95);
    const dataStatus = buildMetricStatus(dataNormalRate, 99, 97);
    const alarmStatus = buildMetricStatus(alarmHandleRate, 95, 85);

    const onlineMarker = Math.min(92, Math.max(8, ((onlineRate - 90) / 10) * 100));
    const dataMarker = Math.min(92, Math.max(8, ((dataNormalRate - 94) / 6) * 100));
    const alarmMarker = Math.min(92, Math.max(8, ((alarmHandleRate - 80) / 20) * 100));

    return {
        assetSummary: {
            total: assetTotal,
            totalChange: `${cmpLabel} ${assetTotalChange.toFixed(1)}%`,
            totalChangeDirection: assetTotalChangeDirection,
            inUse,
            inUseRatio: Math.round(inUseRatio * 10) / 10,
            idle,
            idleRatio,
        },
        summaryMetrics: [
            {
                label: '设备在线率',
                value: formatPercent(onlineRate),
                change: `${onlineRateChange.toFixed(1)}%`,
                detail: `在线 ${onlineCount.toLocaleString()} 台，离线 ${offlineCount.toLocaleString()} 台`,
                direction: onlineRateChangeDirection,
                status: onlineStatus,
                icon: 'online',
                marker: onlineMarker,
                rules: [['正常', '≥ 98%'], ['关注', '95%～98%'], ['异常', '< 95%']],
            },
            {
                label: '数据正常率',
                value: formatPercent(dataNormalRate),
                change: `${dataRateChange.toFixed(1)}%`,
                detail: `异常设备 ${anomalyDeviceCount.toLocaleString()} 台`,
                direction: dataRateChangeDirection,
                status: dataStatus,
                icon: 'data',
                marker: dataMarker,
                rules: [['正常', '≥ 99%'], ['关注', '97%～99%'], ['异常', '< 97%']],
            },
            {
                label: '告警处理率',
                value: formatPercent(alarmHandleRate),
                change: `${alarmRateChange.toFixed(1)}%`,
                detail: `待处理告警 ${pendingAlarms.toLocaleString()} 条`,
                direction: alarmRateChangeDirection,
                status: alarmStatus,
                icon: 'closed',
                marker: alarmMarker,
                rules: [['正常', '≥ 95%'], ['关注', '85%～95%'], ['异常', '< 85%']],
            },
        ],
        assetRowsByProduct: resolveProductRows(productFilterId, products, assetTotal),
        assetRowsByGroup: resolveGroupRows(productFilterId, products),
        onlineRows: roundRatio([
            { name: '在线', value: onlineCount },
            { name: '离线', value: offlineCount },
        ]),
        onlineRate,
        onlineRateChange,
        onlineRateChangeDirection,
        offlineDuration,
        anomaly: {
            deviceCount: anomalyDeviceCount,
            totalChange: `${cmpLabel}${trendDirection} ${trendDelta.toLocaleString()} 台`,
            trendValues,
            trendLabel,
            normalRate: dataNormalRate,
            types: anomalyTypes,
        },
        alarmStatusRows: roundRatio([
            { name: '未处理', value: pendingAlarms },
            { name: '处理中', value: alarmProcessing },
            { name: '已处理', value: alarmHandled },
        ]),
        workOrderStatusRows: roundRatio([
            { name: '待处理', value: workOrderPending },
            { name: '待验收', value: workOrderReview },
            { name: '退回', value: workOrderRejected },
            { name: '已结单', value: workOrderClosed },
        ]),
    };
}
