import type { ProductRecord } from './products';
import { isLargeMeterProduct } from './productCategories';
import type { LargeMeterArea, LargeMeterDevice } from './largeMeters';
import { getAreaScopeIds, LARGE_METER_AREA_IDS, METER_MANUFACTURERS, REMOTE_MANUFACTURERS } from './largeMeters';
import {
    createInitialDeviceGroups,
    createInitialGroupTypes,
    deviceMatchesGroup,
    type DeviceGroupRecord,
    type DeviceGroupTypeItem,
} from './deviceGroups';
import { findTreeNode, getTreeNodeLabel, DEPARTMENT_TREE, SPACE_TREE } from './orgHierarchy';
import { BAIDU_MAP_DEFAULT_CENTER } from '../config/baiduMap';
import { formatDeviceDateTime, formatOnlineDuration } from '../utils/deviceTime';

export type DeviceStatus = 'online' | 'offline' | 'fault' | 'disabled';

export type DeviceRecord = {
    id: string;
    gatewayId?: string;
    code: string;
    name: string;
    productId: string;
    status: DeviceStatus;
    spaceId: string;
    departmentId: string;
    groups: string[];
    tags: string[];
    enabled: boolean;
    enabledAt: string;
    onlineDuration: string;
    longitude: number;
    latitude: number;
    collectFrequency: string;
    registrationCode: string;
    /** 大表中心片区绑定 ID，空表示未绑定 */
    largeMeterAreaId?: string;
    /** 用户号 */
    userNo?: string;
    /** 用户名称 */
    userName?: string;
    /** 表身号 */
    bodyNo?: string;
    /** 安装时间 */
    installTime?: string;
    /** 安装地址 */
    installAddress?: string;
    /** 设备管理地图选点生成的位置描述 */
    mapAddress?: string;
    /** 采集频率单位，默认秒；历史数据未设置时按分钟理解 */
    collectFrequencyUnit?: CollectFrequencyUnit;
    /** 安装阶段补充的表具厂家 */
    manufacturer?: string;
    /** 安装阶段补充的远传厂家 */
    remoteManufacturer?: string;
    /** 安装阶段补充的设备功能 */
    deviceFunction?: string;
    /** 设备口径 */
    caliber?: string;
    /** 通讯码 */
    communicationNo?: string;
};

export type CollectFrequencyUnit = 'second' | 'minute' | 'hour';

export const COLLECT_FREQUENCY_UNIT_OPTIONS: { label: string; value: CollectFrequencyUnit }[] = [
    { label: '秒', value: 'second' },
    { label: '分钟', value: 'minute' },
    { label: '小时', value: 'hour' },
];

export const DEFAULT_COLLECT_FREQUENCY_UNIT: CollectFrequencyUnit = 'second';

export function resolveCollectFrequencyUnit(unit?: CollectFrequencyUnit | string): CollectFrequencyUnit {
    if (unit === 'second' || unit === 'minute' || unit === 'hour') {
        return unit;
    }
    return 'minute';
}

export function collectFrequencyToMinutes(value: string, unit?: CollectFrequencyUnit | string): number {
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric <= 0) {
        return 1440;
    }
    const resolved = resolveCollectFrequencyUnit(unit);
    if (resolved === 'second') {
        return numeric / 60;
    }
    if (resolved === 'hour') {
        return numeric * 60;
    }
    return numeric;
}

export function formatCollectFrequencyDisplay(value: string, unit?: CollectFrequencyUnit | string): string {
    const trimmed = value.trim();
    if (!trimmed) {
        return '—';
    }
    const label = COLLECT_FREQUENCY_UNIT_OPTIONS.find(
        (option) => option.value === resolveCollectFrequencyUnit(unit),
    )?.label ?? '分钟';
    return `${trimmed}${label}/次`;
}

const LOCATIONS = ['主管网', '配水站', '泵站', '小区一号', '小区二号', '工业园区', '商业区', '供水厂', '二供泵房', '监测点'];

const MOCK_USER_NAMES = ['张伟', '李秀英', '王建国', '南京水务集团', '华润燃气江北站', '龙江花园', '玄武湖公园', '南京大学', '鼓楼医院', '紫峰大厦'];

const MOCK_INSTALL_ADDRESSES = [
    '南京市鼓楼区中山北路200号',
    '南京市江宁区秣周东路9号',
    '南京市浦口区浦滨路88号',
    '南京市栖霞区仙林大道163号',
    '南京市建山区河西大街66号',
    '南京市玄武区北京东路1号',
    '南京市秦淮区中华路50号',
    '南京市雨花台区软件大道18号',
    '南京市六合区雄州南路99号',
    '南京市高淳区淳溪镇宝塔路33号',
];

const STATUSES: DeviceStatus[] = ['online', 'offline', 'online', 'online', 'fault', 'online', 'disabled', 'online', 'offline', 'online'];

const DEPARTMENT_IDS = ['dept-jiahuan-1', 'dept-jiahuan-2', 'dept-jiahuan-3', 'dept-jiahuan-4', 'dept-jiahuan-5', 'dept-jiahuan-6', 'dept-jiahuan-1-1', 'dept-jiahuan-1-2', 'dept-jiahuan-1-3', 'dept-shuiwu-1'];
const SPACE_IDS = ['room-201', 'room-202', 'room-501', 'room-201', 'room-202', 'room-501', 'room-502', 'room-201', 'room-202', 'room-101'];

const DEVICE_CODE_PREFIX: Record<string, string> = {
    dabiao: 'DB',
    hubiao: 'HB',
    yaliji: 'YL',
    shuizhiyi: 'SZY',
    zhuishuizhan: 'ZHSZ',
};

const MOCK_DEVICE_TOTAL = 280;

/** 基于 index 的伪随机数，保证坐标稳定可复现 */
function seededRandom(seed: number) {
    const value = Math.sin(seed * 12.9898 + seed * 78.233) * 43758.5453;
    return value - Math.floor(value);
}

/** 在默认中心附近随机分布坐标 */
export function buildDeviceCoordinates(index: number) {
    const lngSpread = 0.045;
    const latSpread = 0.032;
    const lngOffset = (seededRandom(index * 2 + 1) - 0.5) * 2 * lngSpread;
    const latOffset = (seededRandom(index * 2 + 2) - 0.5) * 2 * latSpread;
    return {
        longitude: BAIDU_MAP_DEFAULT_CENTER.longitude + lngOffset,
        latitude: BAIDU_MAP_DEFAULT_CENTER.latitude + latOffset,
    };
}

function buildDeviceTags(product: ProductRecord, index: number) {
    const typeTag = `类型:${product.category}`;
    const areaTags = ['区域:城东', '区域:城西', '区域:城南', '区域:城北'];
    const pipelineTags = ['管网:主管网', '管网:配水管', '管网:支管网'];
    const tags = [typeTag];

    if (index % 3 === 0) tags.push(areaTags[index % areaTags.length]);
    if (index % 4 === 0) tags.push(pipelineTags[index % pipelineTags.length]);

    return tags;
}

function buildDeviceGroups(tags: string[]) {
    return tags
        .map((tag) => tag.split(':')[1])
        .filter(Boolean);
}

function buildDeviceName(product: ProductRecord, location: string, seq: number) {
    return `${product.category}-${location}-${String(seq).padStart(3, '0')}`;
}

const DEVICE_CODE_COUNTERS: Record<string, number> = {};

function resolveDeviceCodePrefix(categoryId: string): string {
    if (categoryId.startsWith('dabiao')) return 'DB';
    return DEVICE_CODE_PREFIX[categoryId] ?? 'DEV';
}

function buildDeviceCode(product: ProductRecord): string {
    const prefix = resolveDeviceCodePrefix(product.categoryId);
    if (!DEVICE_CODE_COUNTERS[prefix]) {
        DEVICE_CODE_COUNTERS[prefix] = 0;
    }
    DEVICE_CODE_COUNTERS[prefix] += 1;
    return `${prefix}${String(DEVICE_CODE_COUNTERS[prefix]).padStart(6, '0')}`;
}

const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000;

function buildDeviceEnabledAt(index: number, now: Date) {
    const offsetMs = seededRandom(index * 3 + 7) * ONE_MONTH_MS;
    return new Date(now.getTime() - offsetMs);
}

function buildDeviceOnlineDuration(index: number, enabledAt: Date, enabled: boolean, now: Date) {
    const maxActiveMs = Math.max(0, now.getTime() - enabledAt.getTime());
    if (!enabled) {
        const activeMs = maxActiveMs * (0.2 + seededRandom(index * 5 + 11) * 0.8);
        return formatOnlineDuration(enabledAt, new Date(enabledAt.getTime() + activeMs));
    }
    return formatOnlineDuration(enabledAt, now);
}

export function buildDeviceTagsFromGroups(groups: string[]): string[] {
    return groups.flatMap((group) => {
        if (['大表', '户表', '压力计', '水质仪', '智慧水站'].includes(group)) {
            return [`类型:${group}`];
        }
        if (['城东', '城西', '城南', '城北'].includes(group)) {
            return [`区域:${group}`];
        }
        if (['主管网', '配水管', '支管网'].includes(group)) {
            return [`管网:${group}`];
        }
        return [];
    });
}

export type DeviceGroupFormKey = 'type' | 'area' | 'pipeline';

export function parseDeviceGroupForm(tags: string[]): Record<DeviceGroupFormKey, string[]> {
    const groups: Record<DeviceGroupFormKey, string[]> = {
        type: [],
        area: [],
        pipeline: [],
    };

    tags.forEach((tag) => {
        const [prefix, name] = tag.split(':');
        if (!name) return;
        if (prefix === '类型') groups.type.push(name);
        if (prefix === '区域') groups.area.push(name);
        if (prefix === '管网') groups.pipeline.push(name);
    });

    return groups;
}

export function buildDeviceFormTags(groups: Record<DeviceGroupFormKey, string[]>): string[] {
    return [
        ...groups.type.map((item) => `类型:${item}`),
        ...groups.area.map((item) => `区域:${item}`),
        ...groups.pipeline.map((item) => `管网:${item}`),
    ];
}

export function deviceRecordToFormState(device: DeviceRecord) {
    const hasCoords = Number.isFinite(device.longitude)
        && Number.isFinite(device.latitude)
        && (device.longitude !== 0 || device.latitude !== 0);
    return {
        name: device.name,
        productId: device.productId,
        collectFrequency: device.collectFrequency || '',
        collectFrequencyUnit: resolveCollectFrequencyUnit(device.collectFrequencyUnit),
        positioning: hasCoords ? 'manual' : 'auto',
        registrationCode: device.registrationCode || '',
        enabled: device.enabled,
        statusChangedAt: device.enabledAt || '',
        mapLongitude: hasCoords ? String(device.longitude) : '',
        mapLatitude: hasCoords ? String(device.latitude) : '',
        mapLocation: device.mapAddress?.trim()
            || (hasCoords ? `${device.longitude.toFixed(6)}, ${device.latitude.toFixed(6)}` : ''),
        spaceX: '',
        spaceY: '',
        spaceName: resolveDeviceOrg(device).spacePath,
        groups: parseDeviceGroupForm(device.tags),
        code: device.code,
        status: device.status,
    };
}

export function createInitialDevices(products: ProductRecord[], now = new Date()): DeviceRecord[] {
    if (!products.length) return [];

    const assignableProducts = products.filter((product) => product.nodeType !== '网关子设备');
    if (!assignableProducts.length) return [];

    // Reset global device code counters before generating devices
    Object.keys(DEVICE_CODE_COUNTERS).forEach((key) => {
        DEVICE_CODE_COUNTERS[key] = 0;
    });

    const baseDevices = Array.from({ length: MOCK_DEVICE_TOTAL }, (_, index) => {
        const product = assignableProducts[index % assignableProducts.length];
        const location = LOCATIONS[index % LOCATIONS.length];
        const tags = buildDeviceTags(product, index);
        const groups = buildDeviceGroups(tags);
        const { longitude, latitude } = buildDeviceCoordinates(index);
        const enabled = index % 13 !== 6;
        const enabledAtDate = buildDeviceEnabledAt(index, now);
        const seq = index + 1;

        return {
            id: String(index + 1),
            code: buildDeviceCode(product),
            name: buildDeviceName(product, location, seq),
            productId: product.id,
            status: STATUSES[index % STATUSES.length] ?? 'online',
            departmentId: DEPARTMENT_IDS[index % DEPARTMENT_IDS.length],
            spaceId: SPACE_IDS[index % SPACE_IDS.length],
            groups: groups.length ? groups : [product.category],
            tags,
            enabled,
            enabledAt: formatDeviceDateTime(enabledAtDate),
            onlineDuration: buildDeviceOnlineDuration(index, enabledAtDate, enabled, now),
            longitude,
            latitude,
            collectFrequency: '1440',
            collectFrequencyUnit: 'minute',
            registrationCode: `reg${String(index + 1).padStart(3, '0')}`,
            userNo: `YH2026${String(index + 1).padStart(5, '0')}`,
            userName: MOCK_USER_NAMES[index % MOCK_USER_NAMES.length],
            bodyNo: `BS${String(100000000000 + index * 137).slice(0, 12)}`,
            installTime: formatDeviceDateTime(new Date(enabledAtDate.getTime() - 7 * 24 * 60 * 60 * 1000)),
            installAddress: MOCK_INSTALL_ADDRESSES[index % MOCK_INSTALL_ADDRESSES.length],
            mapAddress: MOCK_INSTALL_ADDRESSES[index % MOCK_INSTALL_ADDRESSES.length],
            ...(isLargeMeterProduct(product) ? {
                manufacturer: product.vendor || METER_MANUFACTURERS[index % METER_MANUFACTURERS.length],
                remoteManufacturer: REMOTE_MANUFACTURERS[index % REMOTE_MANUFACTURERS.length],
                deviceFunction: '大用户表',
                caliber: `DN${[80, 100, 150, 200][index % 4]}`,
                communicationNo: `TX${String(index + 1).padStart(8, '0')}`,
            } : {}),
        };
    });

    return [...baseDevices, ...createGatewaySubDevices(baseDevices, products, now)];
}

const SUB_DEVICE_STATUSES: DeviceStatus[] = ['online', 'online', 'offline', 'online', 'fault', 'online'];

const SUB_DEVICE_CODE_PREFIX: Record<string, string> = {
    dabiao: 'DBS',
    hubiao: 'HBS',
    yaliji: 'YLS',
    shuizhiyi: 'SZYS',
};

function createGatewaySubDevices(
    baseDevices: DeviceRecord[],
    products: ProductRecord[],
    now: Date,
): DeviceRecord[] {
    const gatewayProductIds = new Set(
        products.filter((product) => product.nodeType === '网关设备').map((product) => product.id),
    );
    const subProducts = products.filter((product) => product.nodeType === '网关子设备');
    if (!gatewayProductIds.size || !subProducts.length) return [];

    const gateways = baseDevices
        .filter((device) => gatewayProductIds.has(device.productId))
        .slice(0, 3);

    const subDevices: DeviceRecord[] = [];
    let subIndex = 1;

    gateways.forEach((gateway, gatewayIndex) => {
        subProducts.forEach((product, productIndex) => {
            const slot = subIndex - 1;
            const enabled = slot % 5 !== 2;
            const enabledAtDate = buildDeviceEnabledAt(1000 + slot, now);
            const { longitude, latitude } = buildDeviceCoordinates(500 + slot);
            const tags = buildDeviceTags(product, slot);
            const groups = buildDeviceGroups(tags);
            const prefix = product.categoryId.startsWith('dabiao') ? 'DBS' : (SUB_DEVICE_CODE_PREFIX[product.categoryId] ?? 'SUB');
            
            // Use global counter for sub-device codes to ensure uniqueness
            if (!DEVICE_CODE_COUNTERS[prefix]) {
                DEVICE_CODE_COUNTERS[prefix] = 0;
            }
            DEVICE_CODE_COUNTERS[prefix] += 1;
            const uniqueSeq = DEVICE_CODE_COUNTERS[prefix];

            subDevices.push({
                id: `demo-sub-${String(subIndex).padStart(3, '0')}`,
                gatewayId: gateway.id,
                code: `${prefix}${String(uniqueSeq).padStart(4, '0')}`,
                name: `${gateway.name}-子设备-${product.category}${String(productIndex + 1).padStart(2, '0')}`,
                productId: product.id,
                status: SUB_DEVICE_STATUSES[slot % SUB_DEVICE_STATUSES.length] ?? 'online',
                departmentId: gateway.departmentId,
                spaceId: gateway.spaceId,
                groups: groups.length ? groups : [product.category, '网关子设备'],
                tags: [...tags, '接入:网关子设备'],
                enabled,
                enabledAt: formatDeviceDateTime(enabledAtDate),
                onlineDuration: buildDeviceOnlineDuration(slot, enabledAtDate, enabled, now),
                longitude,
                latitude,
                collectFrequency: '60',
                collectFrequencyUnit: 'minute',
                registrationCode: `sub-reg${String(subIndex).padStart(3, '0')}`,
                userNo: `YH2026${String(1000 + subIndex).padStart(5, '0')}`,
                userName: MOCK_USER_NAMES[subIndex % MOCK_USER_NAMES.length],
                bodyNo: `BS${String(200000000000 + subIndex * 137).slice(0, 12)}`,
                installTime: formatDeviceDateTime(new Date(enabledAtDate.getTime() - 3 * 24 * 60 * 60 * 1000)),
                installAddress: MOCK_INSTALL_ADDRESSES[subIndex % MOCK_INSTALL_ADDRESSES.length],
                mapAddress: MOCK_INSTALL_ADDRESSES[subIndex % MOCK_INSTALL_ADDRESSES.length],
                ...(isLargeMeterProduct(product) ? {
                    manufacturer: product.vendor || METER_MANUFACTURERS[slot % METER_MANUFACTURERS.length],
                    remoteManufacturer: REMOTE_MANUFACTURERS[slot % REMOTE_MANUFACTURERS.length],
                    deviceFunction: '大用户表',
                    caliber: `DN${[80, 100, 150, 200][slot % 4]}`,
                    communicationNo: `TX${String(1000 + subIndex).padStart(8, '0')}`,
                } : {}),
            });
            subIndex += 1;
        });
    });

    return subDevices;
}

export function getGatewaySubDevices(
    gatewayDeviceId: string,
    devices: DeviceRecord[],
): DeviceRecord[] {
    return devices.filter((device) => device.gatewayId === gatewayDeviceId);
}

export function isGatewaySubDevice(device: DeviceRecord, products: ProductRecord[]): boolean {
    const product = products.find((item) => item.id === device.productId);
    return product?.nodeType === '网关子设备';
}

export const STATUS_LABEL: Record<DeviceStatus, string> = {
    online: '在线',
    offline: '离线',
    fault: '故障',
    disabled: '禁用',
};

export function countByStatus(devices: DeviceRecord[]) {
    return {
        online: devices.filter((item) => item.status === 'online').length,
        offline: devices.filter((item) => item.status === 'offline').length,
        fault: devices.filter((item) => item.status === 'fault').length,
        disabled: devices.filter((item) => item.status === 'disabled').length,
    };
}

export function ensureDeviceCoordinates(device: DeviceRecord, index = 0): DeviceRecord {
    const slot = Number(device.id);
    const withCoords = Number.isFinite(device.longitude) && Number.isFinite(device.latitude)
        ? device
        : { ...device, ...buildDeviceCoordinates(Number.isFinite(slot) ? slot - 1 : index) };
    return {
        ...withCoords,
        collectFrequency: withCoords.collectFrequency ?? '1440',
        registrationCode: withCoords.registrationCode ?? `reg${device.code.slice(-4).toLowerCase()}`,
    };
}

export function isLargeMeterDevice(device: DeviceRecord, products: ProductRecord[]): boolean {
    const product = products.find((entry) => entry.id === device.productId);
    if (!product) return false;
    return isLargeMeterProduct(product);
}

type GroupAreaSeedRule = {
    groupId: string;
    areaId: string;
    every: number;
    offset?: number;
};

/** 预置片区绑定，演示分组内「大表设备」与「可绑定大表」数量差异 */
const LARGE_METER_AREA_SEED_RULES: GroupAreaSeedRule[] = [
    { groupId: 'group-area-east', areaId: LARGE_METER_AREA_IDS.jbCamera, every: 2 },
    { groupId: 'group-area-east', areaId: LARGE_METER_AREA_IDS.gaochun, every: 5, offset: 1 },
    { groupId: 'group-area-west', areaId: LARGE_METER_AREA_IDS.banqiao, every: 2, offset: 1 },
    { groupId: 'group-area-south', areaId: LARGE_METER_AREA_IDS.tangshan, every: 3 },
    { groupId: 'group-area-north', areaId: LARGE_METER_AREA_IDS.jbUltrasonic, every: 2 },
    { groupId: 'group-pipeline-main', areaId: LARGE_METER_AREA_IDS.jbEm, every: 3, offset: 1 },
    { groupId: 'group-pipeline-dist', areaId: LARGE_METER_AREA_IDS.jbPressure, every: 4 },
    { groupId: 'group-type-dabiao', areaId: LARGE_METER_AREA_IDS.csgls, every: 4, offset: 2 },
];

function clearLargeMeterInstallationInfo(device: DeviceRecord): DeviceRecord {
    const {
        largeMeterAreaId,
        userNo,
        userName,
        bodyNo,
        installTime,
        installAddress,
        mapAddress,
        manufacturer,
        remoteManufacturer,
        deviceFunction,
        caliber,
        communicationNo,
        ...rest
    } = device;
    return rest;
}

export function seedInitialLargeMeterAreaBindings(
    devices: DeviceRecord[],
    products: ProductRecord[],
    areas: LargeMeterArea[],
    deviceGroups: DeviceGroupRecord[] = createInitialDeviceGroups(),
    groupTypes: DeviceGroupTypeItem[] = createInitialGroupTypes(),
): DeviceRecord[] {
    const areaIds = new Set(areas.map((area) => area.id));
    const groupMap = new Map(deviceGroups.map((group) => [group.id, group]));
    const ruleCounters = new Map<string, number>();

    return devices.map((device) => {
        if (!isLargeMeterDevice(device, products)) {
            return device;
        }

        for (const rule of LARGE_METER_AREA_SEED_RULES) {
            if (!areaIds.has(rule.areaId)) continue;

            const group = groupMap.get(rule.groupId);
            if (!group || !deviceMatchesGroup(device, groupTypes, group)) {
                continue;
            }

            const counterKey = `${rule.groupId}:${rule.areaId}`;
            const count = ruleCounters.get(counterKey) ?? 0;
            ruleCounters.set(counterKey, count + 1);

            const offset = rule.offset ?? 0;
            if ((count + offset) % rule.every === 0) {
                return { ...device, largeMeterAreaId: rule.areaId };
            }
            break;
        }

        return clearLargeMeterInstallationInfo(device);
    });
}

export function countDirectDevicesInArea(
    devices: DeviceRecord[],
    areaId: string,
    products?: ProductRecord[],
): number {
    return devices.filter((device) => {
        if (device.largeMeterAreaId !== areaId) return false;
        return products ? isLargeMeterDevice(device, products) : true;
    }).length;
}

export function countDevicesInLargeMeterArea(
    devices: DeviceRecord[],
    areas: LargeMeterArea[],
    areaId: string,
    products?: ProductRecord[],
): number {
    const scopeIds = new Set(getAreaScopeIds(areas, areaId));
    return devices.filter((device) => {
        if (!device.largeMeterAreaId || !scopeIds.has(device.largeMeterAreaId)) return false;
        return products ? isLargeMeterDevice(device, products) : true;
    }).length;
}

export function getLargeMeterAreaDeleteBlockReason(
    areas: LargeMeterArea[],
    devices: DeviceRecord[],
    areaId: string,
    products?: ProductRecord[],
): string | null {
    if (areas.some((area) => area.parentId === areaId)) {
        return '该区域下存在子片区，请先删除或移动子片区';
    }
    if (countDirectDevicesInArea(devices, areaId, products) > 0) {
        return '该区域下仍有关联设备，请先解绑设备';
    }
    return null;
}

/** 大表中心设备与平台设备通过用户号关联，编号以平台设备管理为准 */
export function findPlatformDeviceForLargeMeter(
    meter: Pick<LargeMeterDevice, 'code' | 'userNo'>,
    devices: DeviceRecord[],
): DeviceRecord | undefined {
    if (meter.userNo) {
        const byUserNo = devices.find((device) => device.userNo === meter.userNo);
        if (byUserNo) return byUserNo;
    }
    return devices.find((device) => device.code === meter.code);
}

export function syncLargeMeterDeviceCodes(
    meters: LargeMeterDevice[],
    devices: DeviceRecord[],
    products: ProductRecord[] = [],
): LargeMeterDevice[] {
    const usedCodes = new Set(meters.filter((meter) => !meter.id.startsWith('meter-unassigned-')).map((meter) => meter.code));
    const unboundLargeMeterDevices = devices.filter((device) => (
        isLargeMeterDevice(device, products) && !device.largeMeterAreaId && !usedCodes.has(device.code)
    ));
    let unassignedIndex = 0;
    return meters.map((meter) => {
        const linked = findPlatformDeviceForLargeMeter(meter, devices);
        if (!linked && meter.id.startsWith('meter-unassigned-')) {
            const unbound = unboundLargeMeterDevices[unassignedIndex];
            unassignedIndex += 1;
            return unbound ? { ...meter, code: unbound.code } : meter;
        }
        if (!linked) return meter;
        return {
            ...meter,
            code: linked.code,
        };
    });
}

export function resolveDeviceProduct(device: DeviceRecord, products: ProductRecord[]) {
    const product = products.find((entry) => entry.id === device.productId);
    return {
        productName: product?.name ?? '—',
        nodeType: product?.nodeType ?? '—',
        category: product?.category ?? '—',
    };
}

export function resolveDeviceOrg(device: DeviceRecord) {
    const departmentNode = findTreeNode(DEPARTMENT_TREE, device.departmentId);
    const spaceNode = findTreeNode(SPACE_TREE, device.spaceId);
    return {
        department: departmentNode?.label ?? '—',
        space: spaceNode?.label ?? '—',
        departmentPath: getTreeNodeLabel(DEPARTMENT_TREE, device.departmentId),
        spacePath: getTreeNodeLabel(SPACE_TREE, device.spaceId),
    };
}
