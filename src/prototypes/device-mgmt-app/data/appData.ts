import { createInitialDevices, type DeviceRecord } from '../../iot-platform-home/data/devices';
import { createInitialDeviceAlarms, type DeviceAlarmRecord } from '../../iot-platform-home/data/deviceAlarms';
import {
    createInitialWorkOrders,
    CURRENT_WORK_ORDER_USER,
    getVisibleWorkOrdersForViewer,
    type WorkOrderRecord,
} from '../../iot-platform-home/data/workOrders';
import { createInitialProducts } from '../../iot-platform-home/data/products';
import type { AppNotification } from '../pages/ProfilePage';

const TARGET_PRODUCT_NAMES = new Set(['大表', '户表', '压力计']);

export type MobileDevice = DeviceRecord & {
    productName: string;
    displayType: '水表' | '压力计';
};

export type MobileWorkOrderStatus = 'pending' | 'processing' | 'completed';

export type MobileAppBootstrap = {
    devices: MobileDevice[];
    alarms: DeviceAlarmRecord[];
    workOrders: WorkOrderRecord[];
    notifications: AppNotification[];
};

export function toMobileWorkOrderStatus(workOrder: WorkOrderRecord): MobileWorkOrderStatus {
    if (workOrder.status === '已结单') return 'completed';
    if (workOrder.status === '待验收' || workOrder.handler) return 'processing';
    return 'pending';
}

export function createMobileDevices(): MobileDevice[] {
    const products = createInitialProducts();
    const productMap = new Map(products.map((item) => [item.id, item]));

    return createInitialDevices(products)
        .map((device) => {
            const product = productMap.get(device.productId);
            const productName = product?.name || product?.category || '未知设备';
            const displayType: MobileDevice['displayType'] = productName === '压力计' ? '压力计' : '水表';
            return { ...device, productName, displayType };
        })
        .filter((device) => TARGET_PRODUCT_NAMES.has(device.productName) || device.displayType === '水表');
}

export function createMobileAlarms(devices = createMobileDevices()): DeviceAlarmRecord[] {
    const products = createInitialProducts();
    const deviceCodes = new Set(devices.map((item) => item.code));
    const allDevices = createInitialDevices(products);
    return createInitialDeviceAlarms(products, allDevices).filter((alarm) => deviceCodes.has(alarm.deviceCode));
}

export function createMobileWorkOrders(): WorkOrderRecord[] {
    return getVisibleWorkOrdersForViewer(createInitialWorkOrders(), 'assignee', CURRENT_WORK_ORDER_USER);
}

export function createInitialNotifications(
    alarms: DeviceAlarmRecord[],
    workOrders: WorkOrderRecord[],
): AppNotification[] {
    const alarmNotes = alarms
        .filter((item) => item.processStatus === '未处理')
        .slice(0, 3)
        .map((item) => ({
            id: `notice-alarm-${item.id}`,
            title: '新告警',
            content: `${item.deviceName}：${item.eventName}`,
            time: item.triggeredAt,
            read: false,
        }));
    const workOrderNotes = workOrders
        .filter((item) => item.status === '待处理')
        .slice(0, 2)
        .map((item) => ({
            id: `notice-wo-${item.id}`,
            title: '待办工单',
            content: item.name,
            time: item.createdAt,
            read: false,
        }));
    return [...alarmNotes, ...workOrderNotes];
}

/** 一次性初始化移动端 mock 数据，避免重复构造 products/devices。 */
export function createMobileAppBootstrap(): MobileAppBootstrap {
    const devices = createMobileDevices();
    const alarms = createMobileAlarms(devices);
    const workOrders = createMobileWorkOrders();
    return {
        devices,
        alarms,
        workOrders,
        notifications: createInitialNotifications(alarms, workOrders),
    };
}

export function countPendingAlarms(alarms: DeviceAlarmRecord[]): number {
    return alarms.filter((item) => item.processStatus === '未处理').length;
}

export function countPendingWorkOrders(workOrders: WorkOrderRecord[]): number {
    return workOrders.filter((item) => toMobileWorkOrderStatus(item) === 'pending').length;
}

export function countAbnormalDevices(devices: MobileDevice[]): number {
    return devices.filter((item) => item.status === 'offline' || item.status === 'fault').length;
}

export function getDeviceReading(device: MobileDevice): string {
    if (device.displayType === '压力计') {
        const seed = device.code.charCodeAt(device.code.length - 1) % 5;
        return `${(0.32 + seed * 0.08).toFixed(2)} MPa`;
    }
    const seed = device.code.charCodeAt(0) % 900;
    return `${(1200 + seed * 3.6).toFixed(1)} m³`;
}

export function findDeviceById(devices: MobileDevice[], deviceId: string): MobileDevice | undefined {
    return devices.find((item) => item.id === deviceId) || devices.find((item) => item.code === deviceId);
}
