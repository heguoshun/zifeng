export type NetworkServiceType =
    | 'UDP服务'
    | 'TCP服务'
    | 'WebSocket服务'
    | 'HTTP服务'
    | 'MQTT服务'
    | 'CoAP服务';

export type NetworkServicePacketRule =
    | '不处理'
    | '分隔符'
    | '固定长度'
    | '长度字段';

export type NetworkServiceDiscardDelimiter = '是' | '否';

export type NetworkServiceLengthFieldEndian = '大端' | '小端';

export type NetworkServiceComponentSource = '系统内置' | '自定义服务';

export type NetworkServiceNetworkScope = '本地网络' | '公共网络';

export type NetworkServiceDtlsEnabled = '是' | '否';

export type NetworkServiceRecord = {
    id: string;
    name: string;
    componentSource: NetworkServiceComponentSource;
    serviceType?: NetworkServiceType;
    sdkFileName?: string;
    packetRule?: NetworkServicePacketRule;
    delimiter?: string;
    discardDelimiter?: NetworkServiceDiscardDelimiter;
    fixedLength?: string;
    byteCount?: string;
    endOffset?: string;
    subsequentLength?: string;
    firstByteCount?: string;
    lengthFieldValue?: NetworkServiceLengthFieldEndian;
    clusterAddress?: string;
    mqttUsername?: string;
    mqttPassword?: string;
    messageQuality?: string;
    timeout?: string;
    keepAlive?: string;
    networkScope: NetworkServiceNetworkScope;
    ipAddress: string;
    port: string;
    enableDtls?: NetworkServiceDtlsEnabled;
    certificateId?: string;
    privateKeyAlias?: string;
    createdAt: string;
};

export const NETWORK_SERVICE_PACKET_RULE_OPTIONS = [
    { label: '不处理', value: '不处理' },
    { label: '分隔符', value: '分隔符' },
    { label: '固定长度', value: '固定长度' },
    { label: '长度字段', value: '长度字段' },
] as const;

export const NETWORK_SERVICE_DISCARD_DELIMITER_OPTIONS = [
    { label: '是', value: '是' },
    { label: '否', value: '否' },
] as const;

export const NETWORK_SERVICE_LENGTH_FIELD_VALUE_OPTIONS = [
    { label: '大端', value: '大端' },
    { label: '小端', value: '小端' },
] as const;

export const NETWORK_SERVICE_DTLS_ENABLED_OPTIONS = [
    { label: '是', value: '是' },
    { label: '否', value: '否' },
] as const;

export const NETWORK_SERVICE_TYPE_OPTIONS = [
    '全部',
    'UDP服务',
    'TCP服务',
    'WebSocket服务',
    'HTTP服务',
    'MQTT服务',
    'CoAP服务',
] as const;

export const NETWORK_SERVICE_TYPE_FORM_OPTIONS = NETWORK_SERVICE_TYPE_OPTIONS
    .filter((item): item is NetworkServiceType => item !== '全部')
    .map((item) => ({ label: item, value: item }));

export function getNetworkServiceTypeLabel(service: NetworkServiceRecord): string {
    if (service.componentSource === '自定义服务') return '自定义服务';
    return service.serviceType ?? '—';
}

export function generateNetworkServiceId(): string {
    const base = Date.now();
    const suffix = Math.floor(Math.random() * 1000);
    return String(base * 1000 + suffix);
}

export function createInitialNetworkServices(): NetworkServiceRecord[] {
    return [
        {
            id: '1833328431984377857',
            name: 'CoAP服务组件',
            componentSource: '系统内置',
            serviceType: 'CoAP服务',
            networkScope: '本地网络',
            ipAddress: '192.168.1.100',
            port: '5683',
            enableDtls: '是',
            certificateId: 'cert-0003',
            privateKeyAlias: 'coap-dtls',
            createdAt: '2024-09-10 10:15:34',
        },
        {
            id: '1833328431984377856',
            name: 'HTTP服务组件',
            componentSource: '系统内置',
            serviceType: 'HTTP服务',
            networkScope: '公共网络',
            ipAddress: '10.20.30.40',
            port: '8080',
            createdAt: '2025-02-21 10:35:12',
        },
        {
            id: '1833328431984377855',
            name: 'WebSocket服务组件',
            componentSource: '系统内置',
            serviceType: 'WebSocket服务',
            networkScope: '本地网络',
            ipAddress: '192.168.1.101',
            port: '9001',
            createdAt: '2025-02-21 10:35:12',
        },
        {
            id: '1833328431984377854',
            name: 'UDP接入服务',
            componentSource: '系统内置',
            serviceType: 'UDP服务',
            networkScope: '本地网络',
            ipAddress: '192.168.1.102',
            port: '5000',
            createdAt: '2025-02-21 10:35:12',
        },
        {
            id: '1833328431984377853',
            name: 'TCP转发服务',
            componentSource: '系统内置',
            serviceType: 'TCP服务',
            packetRule: '分隔符',
            delimiter: '\\r\\n',
            discardDelimiter: '否',
            networkScope: '公共网络',
            ipAddress: '10.20.30.41',
            port: '502',
            createdAt: '2025-02-21 10:35:12',
        },
        {
            id: '1833328431984377852',
            name: 'MQTT代理服务',
            componentSource: '系统内置',
            serviceType: 'MQTT服务',
            clusterAddress: 'mqtt://192.168.1.103:1883',
            mqttUsername: 'admin',
            mqttPassword: '******',
            messageQuality: '1',
            timeout: '30',
            keepAlive: '60',
            networkScope: '本地网络',
            ipAddress: '192.168.1.103',
            port: '1883',
            createdAt: '2025-02-21 10:35:12',
        },
    ];
}
