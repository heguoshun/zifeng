export type LargeMeterArea = {
    id: string;
    name: string;
    parentId: string | null;
    sort: number;
};

export type LargeMeterDevice = {
    id: string;
    name: string;
    code: string;
    areaId: string;
    groups: string[];
    status: '在线' | '离线' | '告警';
    alarmType: string;
    userNo: string;
    userName: string;
    bodyNo: string;
    // 读数数据
    currentReading: number;       // 累计读数
    forwardAccumulation: number;  // 日结累计正向流量
    reverseAccumulation: number;  // 日结累计逆向流量
    dailyUsage: number;           // 日用水
    monthlyUsage: number;         // 月用水
    hourlyUsage: number;          // 时用水
    nightlyUsage: number;         // 夜间用水
    maxFlow: number;              // 最大流量
    maxFlowTime: string;          // 最大流量上报时间
    dataTime: string;             // 数据时间
    receivedTime: string;         // 收到时间
    lastReportTime: string;       // 最后上报时间（兼容）
    installTime: string;          // 安装时间
    installAddress?: string;
    longitude?: number;
    latitude?: number;
    manufacturer?: string;
    remoteManufacturer?: string;
    deviceFunction?: string;
    caliber?: string;
    communicationNo?: string;
};

export const METER_MANUFACTURERS = ['紫峰装备', '宁水表业', '三川智慧', '新天科技', '威胜集团'] as const;
export const REMOTE_MANUFACTURERS = ['紫峰远传', '宁水远传', '三川智慧', '新天科技', '威胜信息'] as const;

export function resolveRemoteManufacturer(
    source: Pick<LargeMeterDevice, 'remoteManufacturer' | 'id'>,
): string {
    if (source.remoteManufacturer?.trim()) {
        return source.remoteManufacturer.trim();
    }
    const seed = source.id.split('').reduce((sum, character) => sum + character.charCodeAt(0), 0);
    return REMOTE_MANUFACTURERS[seed % REMOTE_MANUFACTURERS.length];
}

export type LargeMeterReading = {
    id: string;
    deviceId: string;
    date: string;
    forwardAccumulation: number;
    reverseAccumulation: number;
    reading: number;
    dailyUsage: number;
    hourlyUsage: number;
    nightlyUsage: number;
    flowRate: number;
};

export type DataReportType = '日报' | '月报' | '季报' | '年报';

export type DataReportRecord = {
    id: string;
    areaId: string;
    type: DataReportType;
    date: string;
    totalUsage: number;
    deviceCount: number;
    exported: boolean;
};

export function getMeterUsageByReportType(meter: LargeMeterDevice, reportType: DataReportType): number {
    switch (reportType) {
        case '日报':
            return meter.dailyUsage;
        case '月报':
            return meter.monthlyUsage;
        case '季报':
            return Math.round(meter.monthlyUsage * 3 * 10) / 10;
        case '年报':
            return Math.round(meter.monthlyUsage * 12 * 10) / 10;
        default:
            return meter.dailyUsage;
    }
}

export function getDefaultReportDate(reportType: DataReportType): string {
    switch (reportType) {
        case '日报':
            return '2026-06-17';
        case '月报':
            return '2026-06';
        case '季报':
            return '2026-Q2';
        case '年报':
            return '2026';
        default:
            return '2026-06-17';
    }
}

export function getReportDateLabel(reportType: DataReportType): string {
    switch (reportType) {
        case '日报':
            return '日期';
        case '月报':
            return '月份';
        case '季报':
            return '季度';
        case '年报':
            return '年份';
        default:
            return '日期';
    }
}

export function getReportPeriodLabel(reportType: DataReportType): string {
    switch (reportType) {
        case '日报':
            return '日度';
        case '月报':
            return '月度';
        case '季报':
            return '季度';
        case '年报':
            return '年度';
        default:
            return '日度';
    }
}

export function getReportUsageLabel(reportType: DataReportType): string {
    switch (reportType) {
        case '日报':
            return '日用水量(m³)';
        case '月报':
            return '月用水量(m³)';
        case '季报':
            return '季用水量(m³)';
        case '年报':
            return '年用水量(m³)';
        default:
            return '日用水量(m³)';
    }
}

export function getReportTotalUsageLabel(reportType: DataReportType): string {
    switch (reportType) {
        case '日报':
            return '日总用水量';
        case '月报':
            return '月总用水量';
        case '季报':
            return '季总用水量';
        case '年报':
            return '年总用水量';
        default:
            return '日总用水量';
    }
}

export const ALARM_TYPE_OPTIONS = ['反向流量', '低电压告警', '大流告警', '持续用水', '识别不一致', '连续三天未上报'];

/** 数据监测分析筛选项：离线 + 告警类型 */
export const DATA_MONITOR_FILTER_OPTIONS = ['离线', ...ALARM_TYPE_OPTIONS] as const;

export type MeterDisplayStatus = {
    label: string;
    tone: 'online' | 'offline' | 'alarm';
};

/** 状态仅展示一项：在线 / 离线 / 具体告警类型（不使用「告警」统称） */
export function getMeterDisplayStatus(
    meter: Pick<LargeMeterDevice, 'status' | 'alarmType'>,
): MeterDisplayStatus {
    if (meter.status === '在线') {
        return { label: '在线', tone: 'online' };
    }
    if (meter.status === '离线') {
        return { label: '离线', tone: 'offline' };
    }
    if (ALARM_TYPE_OPTIONS.includes(meter.alarmType as (typeof ALARM_TYPE_OPTIONS)[number])) {
        return { label: meter.alarmType, tone: 'alarm' };
    }
    return { label: meter.alarmType || '离线', tone: 'alarm' };
}

export function meterMatchesAlarmFilter(
    meter: Pick<LargeMeterDevice, 'status' | 'alarmType'>,
    filter: string,
): boolean {
    if (filter === '全部') return true;
    if (filter === '离线') return meter.status === '离线';
    return meter.alarmType === filter;
}

/** 未分配区域设备的虚拟区域 ID，用于一键筛选 */
export const UNASSIGNED_AREA_ID = '__unassigned__';

export function createInitialAreas(): LargeMeterArea[] {
    return [
        { id: 'area-csgls', name: '抄收管理所', parentId: null, sort: 1 },
        { id: 'area-jiangbei', name: '江北分公司', parentId: null, sort: 2 },
        { id: 'area-jb-camera', name: '江北摄像表', parentId: 'area-jiangbei', sort: 1 },
        { id: 'area-jb-pressure', name: '江北压力表', parentId: 'area-jiangbei', sort: 2 },
        { id: 'area-jb-em', name: '江北电磁表', parentId: 'area-jiangbei', sort: 3 },
        { id: 'area-jb-ultrasonic', name: '江北超声表', parentId: 'area-jiangbei', sort: 4 },
        { id: 'area-gaochun', name: '高淳分公司', parentId: null, sort: 3 },
        { id: 'area-banqiao', name: '板桥分公司', parentId: null, sort: 4 },
        { id: 'area-tangshan', name: '汤山分公司', parentId: null, sort: 5 },
        { id: 'area-banqiao-joint', name: '抄收板桥共管表', parentId: null, sort: 6 },
        { id: 'area-pipeline', name: '管线管理所', parentId: null, sort: 7 },
        { id: 'area-pmc', name: '项目管理中心', parentId: null, sort: 8 },
    ];
}

const METER_AREA_CONFIG: { areaId: string; prefix: string; count: number; groups: string[] }[] = [
    { areaId: 'area-jb-camera', prefix: '江北摄像表', count: 8, groups: ['大表', '江北', '摄像表'] },
    { areaId: 'area-jb-pressure', prefix: '江北压力表', count: 7, groups: ['大表', '江北', '压力表'] },
    { areaId: 'area-jb-em', prefix: '江北电磁表', count: 6, groups: ['大表', '江北', '电磁表'] },
    { areaId: 'area-jb-ultrasonic', prefix: '江北超声表', count: 8, groups: ['大表', '江北', '超声表'] },
    { areaId: 'area-gaochun', prefix: '高淳大表', count: 10, groups: ['大表', '高淳'] },
    { areaId: 'area-banqiao', prefix: '板桥大表', count: 8, groups: ['大表', '板桥'] },
    { areaId: 'area-tangshan', prefix: '汤山大表', count: 6, groups: ['大表', '汤山'] },
    { areaId: 'area-banqiao-joint', prefix: '板桥共管表', count: 5, groups: ['大表', '板桥', '共管'] },
    { areaId: 'area-csgls', prefix: '抄收大表', count: 5, groups: ['大表', '抄收'] },
    { areaId: 'area-pipeline', prefix: '管线大表', count: 6, groups: ['大表', '管线'] },
    { areaId: 'area-pmc', prefix: '项目大表', count: 5, groups: ['大表', '项目'] },
];

const METER_STATUSES: LargeMeterDevice['status'][] = ['在线', '在线', '在线', '在线', '在线', '告警', '离线'];
const METER_ALARM_BY_STATUS: Record<LargeMeterDevice['status'], string> = {
    在线: '',
    离线: '离线',
    告警: '',
};
const METER_ALARM_TYPES = ['反向流量', '低电压告警', '大流告警', '持续用水', '识别不一致', '连续三天未上报'];

const MOCK_USER_NAMES = [
    '张伟', '李秀英', '王建国', '南京水务集团', '华润燃气江北站',
    '鸡鸣寺片区', '龙江花园', '玄武湖公园', '南京大学', '鼓楼医院',
    '紫峰大厦', '河西万达广场', '仙林大学城', '江宁开发区', '浦口码头',
];

function pseudoRandom(seed: number): number {
    const x = Math.sin(seed * 9301 + 49297) * 233280;
    return x - Math.floor(x);
}

function buildMockMeter(index: number, areaId: string, prefix: string, seq: number, groups: string[]): LargeMeterDevice {
    const r1 = pseudoRandom(index * 13 + 1);
    const r2 = pseudoRandom(index * 17 + 2);
    const r3 = pseudoRandom(index * 23 + 3);
    const r4 = pseudoRandom(index * 29 + 4);
    const r5 = pseudoRandom(index * 31 + 5);
    const status = METER_STATUSES[Math.floor(r1 * METER_STATUSES.length)];
    const alarmType = status === '告警'
        ? METER_ALARM_TYPES[Math.floor(r2 * METER_ALARM_TYPES.length)]
        : METER_ALARM_BY_STATUS[status];
    const dailyUsage = status === '离线' ? 0 : Math.round((35 + r3 * 130) * 10) / 10;
    const suffix = String.fromCharCode(65 + (seq % 26));
    const codeNum = String(index).padStart(3, '0');
    const dataHour = status === '离线' ? 23 : Math.floor(r4 * 8) + 1;
    const dataMinute = Math.floor(r1 * 59);
    const dataSecond = Math.floor(r2 * 59);
    const recvMinute = Math.min(59, dataMinute + Math.floor(r5 * 5) + 1);
    const recvSecond = Math.min(59, dataSecond + Math.floor(r3 * 5) + 1);
    const dataTime = status === '离线'
        ? '2026-06-16 23:45:12'
        : `2026-06-17 ${String(dataHour).padStart(2, '0')}:${String(dataMinute).padStart(2, '0')}:${String(dataSecond).padStart(2, '0')}`;
    const receivedTime = status === '离线'
        ? '2026-06-16 23:50:08'
        : `2026-06-17 ${String(dataHour).padStart(2, '0')}:${String(recvMinute).padStart(2, '0')}:${String(recvSecond).padStart(2, '0')}`;
    const installYear = 2022 + Math.floor(r5 * 4);
    const installMonth = 1 + Math.floor(r1 * 12);
    const installDay = 1 + Math.floor(r2 * 28);
    const installHour = 8 + Math.floor(r3 * 10);
    const installTime = `${installYear}-${String(installMonth).padStart(2, '0')}-${String(installDay).padStart(2, '0')} ${String(installHour).padStart(2, '0')}:${String(Math.floor(r4 * 59)).padStart(2, '0')}:00`;

    return {
        id: `meter-${index}`,
        name: `${prefix}-${suffix}${seq > 25 ? seq : ''}`,
        code: `LMB${codeNum}`,
        areaId,
        groups,
        status,
        alarmType,
        userNo: `YH2026${String(index).padStart(5, '0')}`,
        userName: MOCK_USER_NAMES[index % MOCK_USER_NAMES.length],
        bodyNo: `BS${String(100000000000 + index * 137).slice(0, 12)}`,
        forwardAccumulation: Math.round(40000 + r1 * 180000),
        reverseAccumulation: Math.round(r2 * 800),
        currentReading: Math.round((400 + r3 * 1600) * 10) / 10,
        dailyUsage,
        monthlyUsage: Math.round(dailyUsage * (28 + r4 * 4)),
        hourlyUsage: Math.round((dailyUsage / 24 + r1 * 3) * 10) / 10,
        nightlyUsage: Math.round((dailyUsage * (0.08 + r2 * 0.2)) * 10) / 10,
        maxFlow: Math.round((6 + r3 * 18) * 10) / 10,
        maxFlowTime: status === '离线'
            ? '2026-06-16 23:50'
            : `2026-06-17 ${String(dataHour).padStart(2, '0')}:${String(dataMinute).padStart(2, '0')}`,
        dataTime,
        receivedTime,
        lastReportTime: receivedTime,
        installTime,
        installAddress: `${prefix}安装点`,
        manufacturer: METER_MANUFACTURERS[index % METER_MANUFACTURERS.length],
        remoteManufacturer: REMOTE_MANUFACTURERS[index % REMOTE_MANUFACTURERS.length],
        deviceFunction: '大用户表',
        caliber: 'DN100',
        communicationNo: `TX${String(index).padStart(8, '0')}`,
    };
}

export function createInitialLargeMeters(): LargeMeterDevice[] {
    const meters: LargeMeterDevice[] = [];
    let index = 1;

    METER_AREA_CONFIG.forEach(({ areaId, prefix, count, groups }) => {
        for (let seq = 1; seq <= count; seq += 1) {
            meters.push(buildMockMeter(index, areaId, prefix, seq, groups));
            index += 1;
        }
    });

    // 未分配区域的设备（areaId 为空，用于验证「未分配区域」一键查询功能）
    const unassignedDevices: { name: string; code: string; status: LargeMeterDevice['status']; alarmType: string }[] = [
        { name: '临时加装表-A', code: 'LMB901', status: '在线', alarmType: '' },
        { name: '待分配大表-B', code: 'LMB902', status: '告警', alarmType: '大流告警' },
        { name: '新装未分配-C', code: 'LMB903', status: '离线', alarmType: '连续三天未上报' },
        { name: '迁移待定表-D', code: 'LMB904', status: '在线', alarmType: '' },
        { name: '检修返装表-E', code: 'LMB905', status: '告警', alarmType: '低电压告警' },
    ];

    unassignedDevices.forEach((dev) => {
        const r1 = pseudoRandom(index * 13 + 1);
        const r2 = pseudoRandom(index * 17 + 2);
        const r3 = pseudoRandom(index * 23 + 3);
        const dataHour = dev.status === '离线' ? 23 : Math.floor(r1 * 8) + 1;
        const dataMinute = Math.floor(r2 * 59);
        const dataSecond = Math.floor(r3 * 59);
        const recvMinute = Math.min(59, dataMinute + Math.floor(r3 * 5) + 1);
        const recvSecond = Math.min(59, dataSecond + Math.floor(r1 * 5) + 1);
        const installYear = 2023 + Math.floor(r1 * 3);
        const installTime = `${installYear}-${String(1 + Math.floor(r2 * 12)).padStart(2, '0')}-${String(1 + Math.floor(r3 * 28)).padStart(2, '0')} ${String(9 + Math.floor(r1 * 8)).padStart(2, '0')}:${String(Math.floor(r2 * 59)).padStart(2, '0')}:00`;
        meters.push({
            id: `meter-unassigned-${index}`,
            name: dev.name,
            code: dev.code,
            areaId: '',
            groups: ['大表', '未分配'],
            status: dev.status,
            alarmType: dev.alarmType,
            userNo: `YH2026${String(index).padStart(5, '0')}`,
            userName: MOCK_USER_NAMES[index % MOCK_USER_NAMES.length],
            bodyNo: `BS${String(100000000000 + index * 137).slice(0, 12)}`,
            forwardAccumulation: Math.round(40000 + r1 * 180000),
            reverseAccumulation: Math.round(r2 * 800),
            currentReading: Math.round((400 + r3 * 1600) * 10) / 10,
            dailyUsage: dev.status === '离线' ? 0 : Math.round((35 + r3 * 130) * 10) / 10,
            monthlyUsage: 0,
            hourlyUsage: 0,
            nightlyUsage: 0,
            maxFlow: Math.round((6 + r3 * 18) * 10) / 10,
            maxFlowTime: dev.status === '离线' ? '2026-06-16 23:50' : `2026-06-17 ${String(dataHour).padStart(2, '0')}:${String(dataMinute).padStart(2, '0')}`,
            dataTime: dev.status === '离线' ? '2026-06-16 23:45:12' : `2026-06-17 ${String(dataHour).padStart(2, '0')}:${String(dataMinute).padStart(2, '0')}:${String(dataSecond).padStart(2, '0')}`,
            receivedTime: dev.status === '离线' ? '2026-06-16 23:50:08' : `2026-06-17 ${String(dataHour).padStart(2, '0')}:${String(recvMinute).padStart(2, '0')}:${String(recvSecond).padStart(2, '0')}`,
            lastReportTime: '',
            installTime,
            installAddress: '待完善安装地址',
            manufacturer: METER_MANUFACTURERS[index % METER_MANUFACTURERS.length],
            remoteManufacturer: REMOTE_MANUFACTURERS[index % REMOTE_MANUFACTURERS.length],
            deviceFunction: '大用户表',
            caliber: 'DN100',
            communicationNo: `TX${String(index).padStart(8, '0')}`,
        });
        index += 1;
    });

    return meters;
}

export function createInitialReadings(): LargeMeterReading[] {
    const readings: LargeMeterReading[] = [];
    const meters = createInitialLargeMeters();
    const onlineMeters = meters.filter((m) => m.status !== '离线').slice(0, 20);

    onlineMeters.forEach((meter, meterIdx) => {
        for (let d = 29; d >= 0; d -= 1) {
            const date = new Date(2026, 5, 17 - d);
            const r = pseudoRandom(meterIdx * 100 + d);
            readings.push({
                id: `reading-${meter.id}-${d}`,
                deviceId: meter.id,
                date: date.toISOString().slice(0, 10),
                forwardAccumulation: Math.round(500 + d * 25 + r * 100),
                reverseAccumulation: Math.round(r * 20),
                reading: Math.round((5 + r * 15) * 10) / 10,
                dailyUsage: Math.round((50 + r * 100) * 10) / 10,
                hourlyUsage: Math.round((2 + r * 5) * 10) / 10,
                nightlyUsage: Math.round((5 + r * 20) * 10) / 10,
                flowRate: Math.round((5 + r * 15) * 10) / 10,
            });
        }
    });
    return readings;
}

function countAreaMeters(meters: LargeMeterDevice[], areaId: string, areas: LargeMeterArea[]): number {
    return meters.filter((m) => meterMatchesAreaFilter(areaId, m.areaId, areas)).length;
}

export function createInitialDataReports(): DataReportRecord[] {
    const meters = createInitialLargeMeters();
    const areas = createInitialAreas();
    const samples: Array<{ areaId: string; type: DataReportType; date: string; exported: boolean }> = [
        { areaId: 'area-jiangbei', type: '日报', date: '2026-06-17', exported: true },
        { areaId: 'area-gaochun', type: '日报', date: '2026-06-17', exported: false },
        { areaId: 'area-banqiao', type: '月报', date: '2026-06', exported: false },
        { areaId: 'area-jiangbei', type: '季报', date: '2026-Q2', exported: true },
        { areaId: 'area-csgls', type: '年报', date: '2026', exported: false },
    ];

    return samples.map((sample, index) => {
        const scopedMeters = meters.filter((m) => meterMatchesAreaFilter(sample.areaId, m.areaId, areas));
        const totalUsage = Math.round(
            scopedMeters.reduce((sum, meter) => sum + getMeterUsageByReportType(meter, sample.type), 0) * 10,
        ) / 10;
        return {
            id: `report-${index + 1}`,
            areaId: sample.areaId,
            type: sample.type,
            date: sample.date,
            totalUsage,
            deviceCount: countAreaMeters(meters, sample.areaId, areas),
            exported: sample.exported,
        };
    });
}

export function buildAreaTree(areas: LargeMeterArea[]) {
    const rootNodes = areas.filter((a) => a.parentId === null).sort((a, b) => a.sort - b.sort);
    const childrenMap = new Map<string, LargeMeterArea[]>();
    areas.forEach((a) => {
        if (a.parentId) {
            const list = childrenMap.get(a.parentId) ?? [];
            list.push(a);
            childrenMap.set(a.parentId, list);
        }
    });
    return { rootNodes, childrenMap };
}

export function getAreaName(areas: LargeMeterArea[], areaId: string): string {
    return areas.find((a) => a.id === areaId)?.name ?? areaId;
}

/** 码表卡片展示用：取设备所属分公司名称 */
export function getMeterBranchName(areas: LargeMeterArea[], areaId: string): string {
    if (!areaId) return '未分配';
    const areaMap = new Map(areas.map((a) => [a.id, a]));
    let current = areaMap.get(areaId);
    if (!current) return '未分配';

    while (current.parentId) {
        const parent = areaMap.get(current.parentId);
        if (!parent) break;
        if (!parent.parentId) return parent.name;
        current = parent;
    }

    return current.name;
}

export function getAreaPath(areas: LargeMeterArea[], areaId: string): string {
    const parts: string[] = [];
    let current: string | null = areaId;
    const areaMap = new Map(areas.map((a) => [a.id, a]));
    while (current) {
        const area = areaMap.get(current);
        if (!area) break;
        parts.unshift(area.name);
        current = area.parentId;
    }
    return parts.join(' / ');
}

export type AreaSelectorNode = {
    id: string;
    label: string;
    count: number;
    children?: AreaSelectorNode[];
};

export function getAreaScopeIds(areas: LargeMeterArea[], areaId: string): string[] {
    if (areaId === 'all') return areas.map((a) => a.id);
    const ids = [areaId];
    const stack = [areaId];
    while (stack.length) {
        const current = stack.pop()!;
        areas
            .filter((a) => a.parentId === current)
            .forEach((child) => {
                ids.push(child.id);
                stack.push(child.id);
            });
    }
    return ids;
}

export function meterMatchesAreaFilter(
    activeAreaId: string,
    meterAreaId: string,
    areas: LargeMeterArea[],
): boolean {
    if (activeAreaId === 'all') return true;
    if (activeAreaId === UNASSIGNED_AREA_ID) {
        return !meterAreaId || !areas.some((a) => a.id === meterAreaId);
    }
    return getAreaScopeIds(areas, activeAreaId).includes(meterAreaId);
}

export function countMetersInArea(
    meters: LargeMeterDevice[],
    areas: LargeMeterArea[],
    areaId: string,
): number {
    return meters.filter((m) => meterMatchesAreaFilter(areaId, m.areaId, areas)).length;
}

export function buildAreaSelectorTree(
    areas: LargeMeterArea[],
    meters: LargeMeterDevice[],
): AreaSelectorNode[] {
    const { rootNodes, childrenMap } = buildAreaTree(areas);

    const buildNode = (area: LargeMeterArea): AreaSelectorNode => {
        const children = (childrenMap.get(area.id) ?? [])
            .sort((a, b) => a.sort - b.sort)
            .map(buildNode);
        return {
            id: area.id,
            label: area.name,
            count: countMetersInArea(meters, areas, area.id),
            children: children.length ? children : undefined,
        };
    };

    return [
        {
            id: 'all',
            label: '全部片区',
            count: meters.length,
        },
        ...rootNodes.map(buildNode),
    ];
}

export function buildAreaConfigTree(areas: LargeMeterArea[]): AreaSelectorNode[] {
    const { rootNodes, childrenMap } = buildAreaTree(areas);

    const buildNode = (area: LargeMeterArea): AreaSelectorNode => {
        const children = (childrenMap.get(area.id) ?? [])
            .sort((a, b) => a.sort - b.sort)
            .map(buildNode);
        return {
            id: area.id,
            label: area.name,
            count: 0,
            children: children.length ? children : undefined,
        };
    };

    return rootNodes.map(buildNode);
}

export function countDirectMetersInArea(meters: LargeMeterDevice[], areaId: string): number {
    return meters.filter((m) => m.areaId === areaId).length;
}

export function getChildAreas(areas: LargeMeterArea[], parentId: string): LargeMeterArea[] {
    return areas
        .filter((a) => a.parentId === parentId)
        .sort((a, b) => a.sort - b.sort);
}

export function getAreaDeleteBlockReason(
    areas: LargeMeterArea[],
    meters: LargeMeterDevice[],
    areaId: string,
): string | null {
    if (areas.some((a) => a.parentId === areaId)) {
        return '该区域下存在子片区，请先删除或移动子片区';
    }
    if (countDirectMetersInArea(meters, areaId) > 0) {
        return '该区域下仍有关联设备，请先解绑设备';
    }
    return null;
}

export function filterAreaConfigTree(
    nodes: AreaSelectorNode[],
    keyword: string,
): AreaSelectorNode[] {
    const normalized = keyword.trim();
    if (!normalized) return nodes;

    const filterNodes = (list: AreaSelectorNode[]): AreaSelectorNode[] => list.flatMap((node) => {
        const children = node.children ? filterNodes(node.children) : undefined;
        const selfMatch = node.label.includes(normalized);
        if (selfMatch || children?.length) {
            return [{ ...node, children }];
        }
        return [];
    });

    return filterNodes(nodes);
}

export const filterAreaSelectorTree = filterAreaConfigTree;

export type MeterGroupInfo = {
    name: string;
    count: number;
};

export function getMeterGroups(meters: LargeMeterDevice[]): MeterGroupInfo[] {
    const groupMap = new Map<string, number>();
    meters.forEach((m) => {
        m.groups.forEach((g) => {
            groupMap.set(g, (groupMap.get(g) ?? 0) + 1);
        });
    });
    return Array.from(groupMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);
}

export function getMetersByGroup(meters: LargeMeterDevice[], groupName: string): LargeMeterDevice[] {
    return meters.filter((m) => m.groups.includes(groupName));
}

export function getDefaultAreaTreeExpanded(areas: LargeMeterArea[]): Record<string, boolean> {
    const expanded: Record<string, boolean> = {};
    areas.filter((a) => a.parentId === null).forEach((area) => {
        expanded[area.id] = true;
    });
    return expanded;
}
