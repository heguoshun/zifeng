import { BAIDU_MAP_DEFAULT_ZOOM } from '../config/baiduMap';
import type { DeviceRecord } from '../data/devices';

export const MAP_MIN_ZOOM = 3;
export const MAP_MAX_ZOOM = 19;
/** 达到该缩放级别后，区域内设备自动展开为单点 */
export const CLUSTER_AUTO_EXPAND_ZOOM = 17;
export const CLUSTER_ZOOM_STEP = 2;
export const MAP_VIEWPORT_MARGINS: [number, number, number, number] = [80, 80, 80, 324];

/** 低缩放：大网格，聚合更粗 */
const CLUSTER_MAX_GRID = 108;
/** 临近自动展开阈值：小网格，为放大后拆分做准备 */
const CLUSTER_MIN_GRID = 36;
/** 自动展开模式下，仅用于检测重叠点位的蜘蛛网分组 */
const CLUSTER_OVERLAP_GRID = 22;

export type DeviceMapCluster = {
    key: string;
    lng: number;
    lat: number;
    devices: DeviceRecord[];
};

export type DeviceMarkerGroup = DeviceMapCluster & {
    displayMode: 'single' | 'cluster' | 'spiderfy';
};

export function getClusterKey(devices: DeviceRecord[]): string {
    return devices.map((item) => item.id).sort().join('|');
}

export function shouldAutoExpandDevices(zoom: number): boolean {
    return zoom >= CLUSTER_AUTO_EXPAND_ZOOM;
}

/** 缩放越小网格越大，聚合越明显；缩放越大网格越小，便于拆分 */
export function getClusterGridSize(zoom: number): number {
    if (shouldAutoExpandDevices(zoom)) {
        return CLUSTER_OVERLAP_GRID;
    }

    const span = CLUSTER_AUTO_EXPAND_ZOOM - MAP_MIN_ZOOM;
    const ratio = span <= 0
        ? 1
        : Math.max(0, Math.min(1, (CLUSTER_AUTO_EXPAND_ZOOM - zoom) / span));

    return Math.round(CLUSTER_MIN_GRID + ratio * (CLUSTER_MAX_GRID - CLUSTER_MIN_GRID));
}

export function clusterDevicesByPixel(
    map: BMap.Map,
    devices: DeviceRecord[],
    gridSize: number,
): DeviceMapCluster[] {
    if (!devices.length || !window.BMap || gridSize <= 0) return [];

    const buckets = new Map<string, DeviceRecord[]>();

    devices.forEach((device) => {
        const pixel = map.pointToPixel(new BMap.Point(device.longitude, device.latitude));
        const cellX = Math.floor(pixel.x / gridSize);
        const cellY = Math.floor(pixel.y / gridSize);
        const key = `${cellX}_${cellY}`;
        const list = buckets.get(key) ?? [];
        list.push(device);
        buckets.set(key, list);
    });

    return Array.from(buckets.values()).map((group) => ({
        key: getClusterKey(group),
        lng: group.reduce((sum, item) => sum + item.longitude, 0) / group.length,
        lat: group.reduce((sum, item) => sum + item.latitude, 0) / group.length,
        devices: group,
    }));
}

export function resolveDeviceMarkerGroups(
    map: BMap.Map,
    devices: DeviceRecord[],
): DeviceMarkerGroup[] {
    const zoom = map.getZoom();

    if (shouldAutoExpandDevices(zoom)) {
        return clusterDevicesByPixel(map, devices, CLUSTER_OVERLAP_GRID).map((group) => ({
            ...group,
            displayMode: group.devices.length === 1 ? 'single' : 'spiderfy',
        }));
    }

    const gridSize = getClusterGridSize(zoom);
    return clusterDevicesByPixel(map, devices, gridSize).map((group) => ({
        ...group,
        displayMode: group.devices.length === 1 ? 'single' : 'cluster',
    }));
}

export function getSpiderfyPoint(
    cluster: DeviceMapCluster,
    device: DeviceRecord,
    index: number,
    zoom: number,
): BMap.Point {
    if (cluster.devices.length <= 1) {
        return new BMap.Point(device.longitude, device.latitude);
    }

    const angle = (Math.PI * 2 * index) / cluster.devices.length;
    const radius = 0.00016 * 2 ** Math.max(0, MAP_MAX_ZOOM - zoom);
    return new BMap.Point(
        device.longitude + Math.cos(angle) * radius,
        device.latitude + Math.sin(angle) * radius,
    );
}

export function zoomIntoCluster(map: BMap.Map, cluster: DeviceMapCluster): void {
    const points = cluster.devices.map(
        (device) => new BMap.Point(device.longitude, device.latitude),
    );
    const center = new BMap.Point(cluster.lng, cluster.lat);
    const currentZoom = map.getZoom();

    if (points.length === 1) {
        map.centerAndZoom(center, Math.min(currentZoom + CLUSTER_ZOOM_STEP, MAP_MAX_ZOOM));
        return;
    }

    map.setViewport(points, { margins: [100, 100, 100, 100] });
    const fittedZoom = map.getZoom();

    if (fittedZoom < CLUSTER_AUTO_EXPAND_ZOOM && fittedZoom <= currentZoom && currentZoom < MAP_MAX_ZOOM) {
        map.centerAndZoom(center, Math.min(currentZoom + CLUSTER_ZOOM_STEP, MAP_MAX_ZOOM));
    }
}

export function fitDevicesInView(
    map: BMap.Map,
    devices: DeviceRecord[],
    margins: [number, number, number, number] = MAP_VIEWPORT_MARGINS,
): void {
    if (!devices.length || !window.BMap) return;

    const points = devices.map(
        (device) => new BMap.Point(device.longitude, device.latitude),
    );

    if (points.length === 1) {
        map.centerAndZoom(points[0], Math.max(map.getZoom(), BAIDU_MAP_DEFAULT_ZOOM));
        return;
    }

    map.setViewport(points, { margins });
}
