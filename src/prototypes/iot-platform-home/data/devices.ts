import type { ProductRecord } from './products';
import { findTreeNode, getTreeNodeLabel, DEPARTMENT_TREE, SPACE_TREE } from './orgHierarchy';
import { BAIDU_MAP_DEFAULT_CENTER } from '../config/baiduMap';
import { formatDeviceDateTime, formatOnlineDuration } from '../utils/deviceTime';

export type DeviceStatus = 'online' | 'offline' | 'fault' | 'disabled';

export type DeviceRecord = {
    id: string;
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
};

const LOCATIONS = ['主管网', '配水站', '泵站', '小区一号', '小区二号', '工业园区', '商业区', '供水厂', '二供泵房', '监测点'];

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

function buildDeviceCode(product: ProductRecord, seq: number) {
    const prefix = DEVICE_CODE_PREFIX[product.categoryId] ?? 'DEV';
    return `${prefix}${String(seq).padStart(6, '0')}`;
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
        collectFrequency: device.collectFrequency || '1440',
        positioning: hasCoords ? 'manual' : 'auto',
        registrationCode: device.registrationCode || '',
        enabled: device.enabled,
        statusChangedAt: device.enabledAt || '',
        mapLongitude: hasCoords ? String(device.longitude) : '',
        mapLatitude: hasCoords ? String(device.latitude) : '',
        mapLocation: hasCoords ? `${device.longitude.toFixed(6)}, ${device.latitude.toFixed(6)}` : '',
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

    const typeCounters: Record<string, number> = {};

    return Array.from({ length: MOCK_DEVICE_TOTAL }, (_, index) => {
        const product = products[index % products.length];
        const seq = (typeCounters[product.categoryId] ?? 0) + 1;
        typeCounters[product.categoryId] = seq;

        const location = LOCATIONS[index % LOCATIONS.length];
        const tags = buildDeviceTags(product, index);
        const groups = buildDeviceGroups(tags);
        const { longitude, latitude } = buildDeviceCoordinates(index);
        const enabled = index % 13 !== 6;
        const enabledAtDate = buildDeviceEnabledAt(index, now);

        return {
            id: String(index + 1),
            code: buildDeviceCode(product, seq),
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
            registrationCode: `reg${String(index + 1).padStart(3, '0')}`,
        };
    });
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
