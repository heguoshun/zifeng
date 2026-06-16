export type DeviceLogBizType = '设备行为' | '上行消息' | '下行消息' | '业务处理';

export type DeviceLogRecord = {
    id: string;
    eventTime: string;
    deviceCode: string;
    deviceName: string;
    productName: string;
    messageId: string;
    bizType: DeviceLogBizType;
    statusCode: number;
    linkId: string;
    contentDetail: string;
};

/* ── Filter option arrays ── */

export const DEVICE_LOG_PRODUCT_OPTIONS = [
    '全部',
    '智阳电表',
    '智能网关',
    '水质监测仪',
    '流量计',
    '压力计',
] as const;

export const DEVICE_LOG_BIZ_TYPE_OPTIONS = [
    '全部',
    '设备行为',
    '上行消息',
    '下行消息',
    '业务处理',
] as const;

export const DEVICE_LOG_STATUS_OPTIONS = [
    '全部',
    '200',
    '301',
    '401',
    '1022',
] as const;

/* ── Mock seed data ── */

function randomHex(length: number): string {
    const chars = '0123456789abcdef';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
}

const DEVICE_LOG_SEEDS: Omit<DeviceLogRecord, 'id' | 'linkId' | 'messageId'>[] = [
    {
        eventTime: '2025-07-01 10:07:46',
        deviceCode: 'DB_E_1501',
        deviceName: 'DB_E_1502电-四楼',
        productName: '智阳电表',
        bizType: '设备行为',
        statusCode: 200,
        contentDetail: JSON.stringify({ protocol: 'MQTT', topic: '$sys/DB_E_1501/thing/event/online', desc: 'device online' }, null, 2),
    },
    {
        eventTime: '2025-07-01 10:07:46',
        deviceCode: 'DB_E_1502',
        deviceName: 'DB_E_1502电-四楼',
        productName: '智阳电表',
        bizType: '上行消息',
        statusCode: 200,
        contentDetail: JSON.stringify({ protocol: 'MQTT', topic: '$sys/DB_E_1502/thing/property/post', desc: 'power_read=1234.56kWh' }, null, 2),
    },
    {
        eventTime: '2025-07-01 10:07:46',
        deviceCode: 'DB_W_0102',
        deviceName: 'DB_E_1502电-四楼',
        productName: '智阳电表',
        bizType: '下行消息',
        statusCode: 200,
        contentDetail: JSON.stringify({ protocol: 'MQTT', topic: '$sys/DB_W_0102/thing/service/set', desc: 'remote config push' }, null, 2),
    },
    {
        eventTime: '2025-07-01 10:07:46',
        deviceCode: 'DB_E_1201',
        deviceName: 'DB_E_1502电-四楼',
        productName: '智阳电表',
        bizType: '业务处理',
        statusCode: 200,
        contentDetail: JSON.stringify({ protocol: 'MQTT', topic: '$sys/DB_E_1201/thing/service/invoke', desc: 'business process completed' }, null, 2),
    },
    {
        eventTime: '2025-07-01 10:07:46',
        deviceCode: 'DB_W_0101',
        deviceName: 'DB_E_1502电-四楼',
        productName: '智阳电表',
        bizType: '设备行为',
        statusCode: 200,
        contentDetail: JSON.stringify({ protocol: 'MQTT', topic: '$sys/DB_W_0101/thing/event/heartbeat', desc: 'heartbeat ok' }, null, 2),
    },
    {
        eventTime: '2025-07-01 10:07:46',
        deviceCode: 'DB_E_1301',
        deviceName: 'DB_E_1502电-四楼',
        productName: '智阳电表',
        bizType: '上行消息',
        statusCode: 301,
        contentDetail: JSON.stringify({ protocol: 'MQTT', topic: '$sys/DB_E_1301/thing/property/post', desc: 'payload too large, truncated' }, null, 2),
    },
    {
        eventTime: '2025-07-01 10:07:46',
        deviceCode: 'DB_E_1401',
        deviceName: 'DB_E_1502电-四楼',
        productName: '智阳电表',
        bizType: '下行消息',
        statusCode: 401,
        contentDetail: JSON.stringify({ protocol: 'MQTT', topic: '$sys/DB_E_1401/thing/service/set', desc: 'unauthorized access attempt' }, null, 2),
    },
    {
        eventTime: '2025-07-01 10:07:46',
        deviceCode: 'DB_E_1503',
        deviceName: 'DB_E_1502电-四楼',
        productName: '智阳电表',
        bizType: '业务处理',
        statusCode: 1022,
        contentDetail: JSON.stringify({ protocol: 'MQTT', topic: '$sys/DB_E_1503/thing/service/invoke', desc: 'internal processing error' }, null, 2),
    },
    {
        eventTime: '2025-07-01 10:07:46',
        deviceCode: 'DB_E_1601',
        deviceName: 'DB_E_1502电-四楼',
        productName: '智阳电表',
        bizType: '设备行为',
        statusCode: 200,
        contentDetail: JSON.stringify({ protocol: 'MQTT', topic: '$sys/DB_E_1601/thing/event/offline', desc: 'device offline detected' }, null, 2),
    },
    {
        eventTime: '2025-07-01 10:07:46',
        deviceCode: 'DB_E_1701',
        deviceName: 'DB_E_1502电-四楼',
        productName: '智阳电表',
        bizType: '上行消息',
        statusCode: 200,
        contentDetail: JSON.stringify({ protocol: 'MQTT', topic: '$sys/DB_E_1701/thing/property/post', desc: 'voltage=220.3V, current=5.2A' }, null, 2),
    },
];

export function createInitialDeviceLogs(): DeviceLogRecord[] {
    return DEVICE_LOG_SEEDS.map((seed, index) => ({
        ...seed,
        id: `DL${String(index + 1).padStart(6, '0')}`,
        linkId: randomHex(16),
        messageId: randomHex(18),
    }));
}
