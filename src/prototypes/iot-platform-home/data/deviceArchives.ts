import type { DeviceRecord } from './devices';
import { isLargeMeterDevice } from './devices';
import type { ProductRecord } from './products';

export type DeviceArchiveType =
    | 'installation'
    | 'accessory'
    | 'user-change'
    | 'location-change'
    | 'maintenance'
    | 'calibration'
    | 'status-change'
    | 'other';

export type DeviceArchiveSource = '系统自动' | '人工补录';

export type DeviceArchiveRecord = {
    id: string;
    deviceId: string;
    type: DeviceArchiveType;
    occurredAt: string;
    title: string;
    summary: string;
    beforeValue?: string;
    afterValue?: string;
    operator: string;
    source: DeviceArchiveSource;
    remark?: string;
    attachmentCount?: number;
};

export const DEVICE_ARCHIVE_TYPE_LABELS: Record<DeviceArchiveType, string> = {
    installation: '安装投运',
    accessory: '配件更换',
    'user-change': '用户变更',
    'location-change': '位置变更',
    maintenance: '维修保养',
    calibration: '检定校准',
    'status-change': '启停变更',
    other: '其他记录',
};

export const DEVICE_ARCHIVE_TYPE_OPTIONS = (Object.keys(DEVICE_ARCHIVE_TYPE_LABELS) as DeviceArchiveType[])
    .map((value) => ({ value, label: DEVICE_ARCHIVE_TYPE_LABELS[value] }));

function formatNow() {
    const date = new Date();
    const pad = (value: number) => String(value).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function formatArchiveDate(value?: string) {
    if (!value) return formatNow();
    return value.replace('T', ' ');
}

function buildLocation(device: DeviceRecord) {
    const address = device.mapAddress?.trim() || device.installAddress?.trim();
    if (address) return address;
    if (Number.isFinite(device.longitude) && Number.isFinite(device.latitude)) {
        return `${device.longitude.toFixed(6)}, ${device.latitude.toFixed(6)}`;
    }
    return '未记录';
}

function buildUser(device: DeviceRecord) {
    if (!device.userName && !device.userNo) return '未绑定用户';
    return [device.userName, device.userNo].filter(Boolean).join('（') + (device.userName && device.userNo ? '）' : '');
}

export function createDeviceArchiveRecord(
    input: Omit<DeviceArchiveRecord, 'id'> & { id?: string },
): DeviceArchiveRecord {
    return {
        ...input,
        id: input.id ?? `archive-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
    };
}

export function createInitialDeviceArchiveRecords(
    devices: DeviceRecord[],
    products: ProductRecord[],
): DeviceArchiveRecord[] {
    return devices
        .filter((device) => isLargeMeterDevice(device, products))
        .flatMap((device, index) => {
            const installation: DeviceArchiveRecord = createDeviceArchiveRecord({
                id: `archive-seed-${device.id}-installation`,
                deviceId: device.id,
                type: 'installation',
                occurredAt: formatArchiveDate(device.installTime || device.enabledAt),
                title: '设备安装投运',
                summary: `设备安装于${device.installAddress || buildLocation(device)}，完成初始用户和点位登记。`,
                afterValue: `${buildUser(device)}；${buildLocation(device)}`,
                operator: '系统管理员',
                source: '系统自动',
            });

            const records = [installation];
            if (index % 4 === 0) {
                records.push(createDeviceArchiveRecord({
                    id: `archive-seed-${device.id}-maintenance`,
                    deviceId: device.id,
                    type: 'maintenance',
                    occurredAt: '2026-05-18 10:20:00',
                    title: '例行巡检保养',
                    summary: '完成表体、接线和通讯状态检查，设备运行正常。',
                    operator: '王工',
                    source: '人工补录',
                    remark: '现场无渗漏，铅封完整。',
                }));
            }
            if (index % 7 === 0) {
                records.push(createDeviceArchiveRecord({
                    id: `archive-seed-${device.id}-accessory`,
                    deviceId: device.id,
                    type: 'accessory',
                    occurredAt: '2026-04-26 14:35:00',
                    title: '通讯模块更换',
                    summary: '更换老化的 NB-IoT 通讯模块并完成上线验证。',
                    beforeValue: 'NB-IoT 模块 SN-A24018',
                    afterValue: 'NB-IoT 模块 SN-B26047',
                    operator: '李工',
                    source: '人工补录',
                    attachmentCount: 2,
                }));
            }
            return records;
        })
        .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
}

type ChangeRecordOptions = {
    operator?: string;
    includeInstallation?: boolean;
};

export function createArchiveRecordsFromDeviceChange(
    before: DeviceRecord,
    after: DeviceRecord,
    options: ChangeRecordOptions = {},
): DeviceArchiveRecord[] {
    const occurredAt = formatNow();
    const operator = options.operator ?? 'superadmin';
    const records: DeviceArchiveRecord[] = [];

    if (options.includeInstallation) {
        records.push(createDeviceArchiveRecord({
            deviceId: after.id,
            type: 'installation',
            occurredAt: formatArchiveDate(after.installTime),
            title: '设备绑定并完成安装登记',
            summary: `设备完成区域绑定，安装地址为${after.installAddress || buildLocation(after)}。`,
            afterValue: `${buildUser(after)}；${buildLocation(after)}`,
            operator,
            source: '系统自动',
        }));
    }

    if (before.userName !== after.userName || before.userNo !== after.userNo) {
        records.push(createDeviceArchiveRecord({
            deviceId: after.id,
            type: 'user-change',
            occurredAt,
            title: '变更设备用户',
            summary: '设备关联用户信息发生变更。',
            beforeValue: buildUser(before),
            afterValue: buildUser(after),
            operator,
            source: '系统自动',
        }));
    }

    const locationChanged = before.longitude !== after.longitude
        || before.latitude !== after.latitude
        || before.mapAddress !== after.mapAddress
        || before.installAddress !== after.installAddress;
    if (locationChanged) {
        records.push(createDeviceArchiveRecord({
            deviceId: after.id,
            type: 'location-change',
            occurredAt,
            title: '变更设备安装点位',
            summary: '设备安装地址或地图点位发生变更。',
            beforeValue: buildLocation(before),
            afterValue: buildLocation(after),
            operator,
            source: '系统自动',
        }));
    }

    if (before.enabled !== after.enabled || before.status !== after.status) {
        records.push(createDeviceArchiveRecord({
            deviceId: after.id,
            type: 'status-change',
            occurredAt,
            title: after.enabled ? '启用设备' : '停用设备',
            summary: `设备状态变更为${after.enabled ? '已启用' : '已停用'}。`,
            beforeValue: before.enabled ? '已启用' : '已停用',
            afterValue: after.enabled ? '已启用' : '已停用',
            operator,
            source: '系统自动',
        }));
    }

    return records;
}
