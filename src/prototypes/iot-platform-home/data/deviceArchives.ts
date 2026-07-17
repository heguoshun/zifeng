import type { DeviceRecord } from './devices';
import { isLargeMeterDevice } from './devices';
import type { ProductRecord } from './products';

export type DeviceArchiveType =
    | 'access'
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
    beforeLongitude?: number;
    beforeLatitude?: number;
    afterLongitude?: number;
    afterLatitude?: number;
    operator: string;
    source: DeviceArchiveSource;
    remark?: string;
    attachmentCount?: number;
};

export const DEVICE_ARCHIVE_TYPE_LABELS: Record<DeviceArchiveType, string> = {
    access: '设备接入',
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

export const SYSTEM_GENERATED_ARCHIVE_TYPES: ReadonlySet<DeviceArchiveType> = new Set([
    'access',
    'installation',
    'status-change',
]);

export const MANUAL_DEVICE_ARCHIVE_TYPE_OPTIONS = DEVICE_ARCHIVE_TYPE_OPTIONS
    .filter((option) => !SYSTEM_GENERATED_ARCHIVE_TYPES.has(option.value));

function formatNow() {
    const date = new Date();
    const pad = (value: number) => String(value).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function parseArchiveDate(value?: string) {
    const normalized = value?.trim().replace('T', ' ').replace(/[./]/g, '-') ?? '';
    const match = normalized.match(/^(\d{4})-(\d{1,2})-(\d{1,2})\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?/);
    if (!match) return null;
    const [, year, month, day, hour, minute, second = '0'] = match;
    const date = new Date(
        Number(year),
        Number(month) - 1,
        Number(day),
        Number(hour),
        Number(minute),
        Number(second),
    );
    return Number.isNaN(date.getTime()) ? null : date;
}

function formatArchiveDate(value?: string) {
    if (!value) return formatNow();
    const date = parseArchiveDate(value);
    if (!date) return value.replace('T', ' ');
    const pad = (part: number) => String(part).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function offsetArchiveDate(value: string | undefined, days: number, hours = 0, minutes = 0) {
    if (!value) return formatNow();
    const date = parseArchiveDate(value);
    if (!date) return formatArchiveDate(value);
    date.setDate(date.getDate() + days);
    date.setHours(date.getHours() + hours);
    date.setMinutes(date.getMinutes() + minutes);
    const pad = (part: number) => String(part).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
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

function hasInstallationInfo(device: DeviceRecord) {
    return Boolean(
        device.largeMeterAreaId
        && device.userName?.trim()
        && device.userNo?.trim()
        && device.installTime?.trim()
        && device.installAddress?.trim(),
    );
}

export function createDeviceArchiveRecord(
    input: Omit<DeviceArchiveRecord, 'id'> & { id?: string },
): DeviceArchiveRecord {
    return {
        ...input,
        id: input.id ?? `archive-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
    };
}

export function createDeviceAccessArchiveRecord(
    device: DeviceRecord,
    operator = '系统管理员',
    id?: string,
): DeviceArchiveRecord {
    return createDeviceArchiveRecord({
        id,
        deviceId: device.id,
        type: 'access',
        occurredAt: device.installTime
            ? offsetArchiveDate(device.installTime, -7, -4, -25)
            : formatArchiveDate(device.enabledAt),
        title: '设备接入建档',
        summary: '设备已接入平台，生成基础设备档案，待绑定区域后完善安装和用户信息。',
        operator,
        source: '系统自动',
    });
}

export function createInitialDeviceArchiveRecords(
    devices: DeviceRecord[],
    products: ProductRecord[],
): DeviceArchiveRecord[] {
    return devices
        .filter((device) => isLargeMeterDevice(device, products))
        .flatMap((device, index) => {
            const access = createDeviceAccessArchiveRecord(
                device,
                '系统管理员',
                `archive-seed-${device.id}-access`,
            );
            if (!hasInstallationInfo(device)) {
                return [access];
            }
            const installation: DeviceArchiveRecord = createDeviceArchiveRecord({
                id: `archive-seed-${device.id}-installation`,
                deviceId: device.id,
                type: 'installation',
                occurredAt: formatArchiveDate(device.installTime || device.enabledAt),
                title: '设备安装投运',
                summary: `设备安装于${device.installAddress || buildLocation(device)}，完成初始用户和点位登记。`,
                operator: '系统管理员',
                source: '系统自动',
            });

            const originalUser = `原用户${String(index + 1).padStart(2, '0')}（YH2025${String(index + 1).padStart(5, '0')}）`;
            const originalLocation = `${device.installAddress || buildLocation(device)}旧点位`;
            const records: DeviceArchiveRecord[] = [
                access,
                installation,
                createDeviceArchiveRecord({
                    id: `archive-seed-${device.id}-maintenance`,
                    deviceId: device.id,
                    type: 'maintenance',
                    occurredAt: offsetArchiveDate(device.installTime, 1, -8, 15),
                    title: '例行巡检保养',
                    summary: '完成表体、接线、阀门和通讯状态检查，设备运行正常。',
                    operator: '王工',
                    source: '人工补录',
                    remark: '现场无渗漏，铅封完整，下次巡检按季度计划执行。',
                    attachmentCount: 1,
                }),
                createDeviceArchiveRecord({
                    id: `archive-seed-${device.id}-accessory`,
                    deviceId: device.id,
                    type: 'accessory',
                    occurredAt: offsetArchiveDate(device.installTime, 2, -5, 40),
                    title: '通讯模块更换',
                    summary: '更换老化的 NB-IoT 通讯模块并完成上线验证。',
                    beforeValue: 'NB-IoT 模块 SN-A24018',
                    afterValue: 'NB-IoT 模块 SN-B26047',
                    operator: '李工',
                    source: '人工补录',
                    remark: '更换后信号稳定，数据上报正常。',
                    attachmentCount: 2,
                }),
                createDeviceArchiveRecord({
                    id: `archive-seed-${device.id}-user-change`,
                    deviceId: device.id,
                    type: 'user-change',
                    occurredAt: offsetArchiveDate(device.installTime, 3, -7, 5),
                    title: '用户变更',
                    summary: '因用水账户过户，完成设备关联用户变更。',
                    beforeValue: originalUser,
                    afterValue: buildUser(device),
                    operator: '赵敏',
                    source: '人工补录',
                    remark: '过户资料已核验。',
                }),
                createDeviceArchiveRecord({
                    id: `archive-seed-${device.id}-location-change`,
                    deviceId: device.id,
                    type: 'location-change',
                    occurredAt: offsetArchiveDate(device.installTime, 4, -4, 20),
                    title: '位置变更',
                    summary: '因管线改造调整设备安装点位，现场复核后更新位置。',
                    beforeValue: originalLocation,
                    afterValue: buildLocation(device),
                    beforeLongitude: device.longitude - 0.0012,
                    beforeLatitude: device.latitude - 0.0008,
                    afterLongitude: device.longitude,
                    afterLatitude: device.latitude,
                    operator: '陈工',
                    source: '人工补录',
                    remark: '新点位便于巡检，周边无明显遮挡。',
                    attachmentCount: 1,
                }),
                createDeviceArchiveRecord({
                    id: `archive-seed-${device.id}-calibration`,
                    deviceId: device.id,
                    type: 'calibration',
                    occurredAt: offsetArchiveDate(device.installTime, 5, -6, 35),
                    title: '周期检定校准',
                    summary: '按计量检定规程完成示值误差、重复性和密封性检查，检定结果合格。',
                    afterValue: '合格，示值误差和重复性符合检定规程要求',
                    operator: '周工',
                    source: '人工补录',
                    remark: '检定证书编号：JD-2026-0715，有效期一年。',
                    attachmentCount: 1,
                }),
                createDeviceArchiveRecord({
                    id: `archive-seed-${device.id}-status-change`,
                    deviceId: device.id,
                    type: 'status-change',
                    occurredAt: offsetArchiveDate(device.installTime, 6, -3, 10),
                    title: '设备恢复启用',
                    summary: '检定完成后恢复设备运行，平台通信和数据采集正常。',
                    beforeValue: '停用',
                    afterValue: '启用',
                    operator: '系统管理员',
                    source: '系统自动',
                }),
                createDeviceArchiveRecord({
                    id: `archive-seed-${device.id}-other`,
                    deviceId: device.id,
                    type: 'other',
                    occurredAt: offsetArchiveDate(device.installTime, 7, -5, 50),
                    title: '现场资料补充',
                    summary: '补充设备铭牌、安装环境和管线走向等现场资料。',
                    operator: '孙工',
                    source: '人工补录',
                    remark: '资料已归档，可用于后续巡检和维修定位。',
                    attachmentCount: 2,
                }),
            ];
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

    if (options.includeInstallation && hasInstallationInfo(after)) {
        records.push(createDeviceArchiveRecord({
            deviceId: after.id,
            type: 'installation',
            occurredAt: formatArchiveDate(after.installTime),
            title: '设备绑定并完成安装登记',
            summary: `设备完成区域绑定，安装地址为${after.installAddress || buildLocation(after)}。`,
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
            beforeLongitude: before.longitude,
            beforeLatitude: before.latitude,
            afterLongitude: after.longitude,
            afterLatitude: after.latitude,
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
