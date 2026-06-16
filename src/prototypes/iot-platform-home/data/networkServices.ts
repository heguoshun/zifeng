export type NetworkServiceType =
    | 'UDP服务'
    | 'TCP服务'
    | 'WebSocket服务'
    | 'HTTP服务'
    | 'MQTT服务'
    | 'CoAP服务';

export type NetworkServiceComponentSource = '系统内置' | '自定义服务';

export type NetworkServiceNetworkScope = '本地网络' | '公共网络';

export type NetworkServiceRecord = {
    id: string;
    name: string;
    componentSource: NetworkServiceComponentSource;
    serviceType?: NetworkServiceType;
    sdkFileName?: string;
    networkScope: NetworkServiceNetworkScope;
    ipAddress: string;
    port: string;
    createdAt: string;
};

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
            networkScope: '本地网络',
            ipAddress: '192.168.1.103',
            port: '1883',
            createdAt: '2025-02-21 10:35:12',
        },
    ];
}
