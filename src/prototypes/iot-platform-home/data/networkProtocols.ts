export type NetworkProtocolType = 'Local' | 'Jar';

export type NetworkProtocolRecord = {
    id: string;
    name: string;
    description: string;
    serviceTypeId: string;
    networkComponentId: string;
    protocolOptionId: string;
    serviceName: string;
    protocolName: string;
    ipAddress: string;
    protocolType: NetworkProtocolType;
    createdAt: string;
};

export type NetworkProtocolServiceType = {
    id: string;
    label: string;
    serviceName: string;
};

export type NetworkProtocolComponent = {
    id: string;
    name: string;
    ipAddress: string;
};

export type NetworkProtocolOption = {
    id: string;
    protocolName: string;
    protocolType: NetworkProtocolType;
    ipAddress: string;
    serviceTypeIds: string[];
};

export const NETWORK_PROTOCOL_SERVICE_TYPES: NetworkProtocolServiceType[] = [
    { id: 'udp', label: 'UDP服务', serviceName: 'UDP服务' },
    { id: 'tcp', label: 'TCP服务', serviceName: 'TCP服务' },
    { id: 'http', label: 'HTTP服务', serviceName: 'HTTP服务' },
    { id: 'coap', label: 'CoAP服务', serviceName: 'CoAP服务' },
    { id: 'mqtt', label: 'MQTT服务', serviceName: 'MQTT服务' },
    { id: 'websocket', label: 'WebSocket服务', serviceName: 'WebSocket服务' },
    { id: 'custom', label: '自定义服务', serviceName: '自定义服务' },
];

export const NETWORK_PROTOCOL_COMPONENTS: NetworkProtocolComponent[] = [
    { id: 'water-meter', name: '水表网络', ipAddress: '127.0.0.1' },
    { id: 'electric-meter', name: '电表网络', ipAddress: '127.0.0.1' },
    { id: 'air-conditioner', name: '空调网络', ipAddress: '127.0.0.1' },
    { id: 'temp-humidity', name: '温湿度网络', ipAddress: '127.0.0.1' },
    { id: 'access-control', name: '门禁网络', ipAddress: '127.0.0.1' },
    { id: 'lighting', name: '照明网络', ipAddress: '127.0.0.1' },
    { id: 'fire-safety', name: '消防网络', ipAddress: '127.0.0.1' },
    { id: 'elevator', name: '梯控网络', ipAddress: '127.0.0.1' },
    { id: 'parking', name: '停车场网络', ipAddress: '127.0.0.1' },
    { id: 'video', name: '视频监控网络', ipAddress: '127.0.0.1' },
    { id: 'energy', name: '能耗监测网络', ipAddress: '127.0.0.1' },
    { id: 'pump', name: '水泵网络', ipAddress: '127.0.0.1' },
    { id: 'environment', name: '环境监测网络', ipAddress: '127.0.0.1' },
    { id: 'security', name: '安防报警网络', ipAddress: '127.0.0.1' },
    { id: 'building', name: '楼宇自控网络', ipAddress: '127.0.0.1' },
    { id: 'gateway', name: '园区网关网络', ipAddress: '127.0.0.1' },
];

export const NETWORK_PROTOCOL_OPTIONS: NetworkProtocolOption[] = [
    { id: 'mqtt-local', protocolName: 'MQTT协议', protocolType: 'Local', ipAddress: '192.168.1.102:1883', serviceTypeIds: ['mqtt'] },
    { id: 'mqtt-jar', protocolName: 'MQTT协议', protocolType: 'Jar', ipAddress: '192.168.1.102:1883', serviceTypeIds: ['mqtt'] },
    { id: 'mqtt-v5-local', protocolName: 'MQTT v5协议', protocolType: 'Local', ipAddress: '192.168.1.103:1883', serviceTypeIds: ['mqtt'] },
    { id: 'mqtt-v5-jar', protocolName: 'MQTT v5协议', protocolType: 'Jar', ipAddress: '192.168.1.103:1883', serviceTypeIds: ['mqtt'] },
    { id: 'http-local', protocolName: 'HTTP协议', protocolType: 'Local', ipAddress: '192.168.1.100:8080', serviceTypeIds: ['http'] },
    { id: 'http-jar', protocolName: 'HTTP协议', protocolType: 'Jar', ipAddress: '192.168.1.100:8080', serviceTypeIds: ['http'] },
    { id: 'http-rest-local', protocolName: 'HTTP REST协议', protocolType: 'Local', ipAddress: '192.168.1.101:8080', serviceTypeIds: ['http'] },
    { id: 'http-rest-jar', protocolName: 'HTTP REST协议', protocolType: 'Jar', ipAddress: '192.168.1.101:8080', serviceTypeIds: ['http'] },
    { id: 'coap-local', protocolName: 'CoAP协议', protocolType: 'Local', ipAddress: '192.168.1.100:5683', serviceTypeIds: ['coap'] },
    { id: 'coap-jar', protocolName: 'CoAP协议', protocolType: 'Jar', ipAddress: '192.168.1.100:5683', serviceTypeIds: ['coap'] },
    { id: 'coap-dtls-local', protocolName: 'CoAP DTLS协议', protocolType: 'Local', ipAddress: '192.168.1.104:5684', serviceTypeIds: ['coap'] },
    { id: 'coap-dtls-jar', protocolName: 'CoAP DTLS协议', protocolType: 'Jar', ipAddress: '192.168.1.104:5684', serviceTypeIds: ['coap'] },
    { id: 'udp-local', protocolName: 'UDP协议', protocolType: 'Local', ipAddress: '192.168.1.105:9000', serviceTypeIds: ['udp'] },
    { id: 'udp-jar', protocolName: 'UDP协议', protocolType: 'Jar', ipAddress: '192.168.1.105:9000', serviceTypeIds: ['udp'] },
    { id: 'udp-multicast-local', protocolName: 'UDP组播协议', protocolType: 'Local', ipAddress: '239.255.0.1:9001', serviceTypeIds: ['udp'] },
    { id: 'udp-multicast-jar', protocolName: 'UDP组播协议', protocolType: 'Jar', ipAddress: '239.255.0.1:9001', serviceTypeIds: ['udp'] },
    { id: 'tcp-local', protocolName: 'TCP协议', protocolType: 'Local', ipAddress: '192.168.1.106:9100', serviceTypeIds: ['tcp'] },
    { id: 'tcp-jar', protocolName: 'TCP协议', protocolType: 'Jar', ipAddress: '192.168.1.106:9100', serviceTypeIds: ['tcp'] },
    { id: 'tcp-modbus-local', protocolName: 'TCP Modbus协议', protocolType: 'Local', ipAddress: '192.168.1.107:502', serviceTypeIds: ['tcp'] },
    { id: 'tcp-modbus-jar', protocolName: 'TCP Modbus协议', protocolType: 'Jar', ipAddress: '192.168.1.107:502', serviceTypeIds: ['tcp'] },
    { id: 'websocket-local', protocolName: 'WebSocket协议', protocolType: 'Local', ipAddress: '192.168.1.101:8080', serviceTypeIds: ['websocket'] },
    { id: 'websocket-jar', protocolName: 'WebSocket协议', protocolType: 'Jar', ipAddress: '192.168.1.101:8080', serviceTypeIds: ['websocket'] },
    { id: 'websocket-stomp-local', protocolName: 'WebSocket STOMP协议', protocolType: 'Local', ipAddress: '192.168.1.108:8081', serviceTypeIds: ['websocket'] },
    { id: 'websocket-stomp-jar', protocolName: 'WebSocket STOMP协议', protocolType: 'Jar', ipAddress: '192.168.1.108:8081', serviceTypeIds: ['websocket'] },
    { id: 'custom-local', protocolName: '自定义协议', protocolType: 'Local', ipAddress: '192.168.1.109:9200', serviceTypeIds: ['custom'] },
    { id: 'custom-jar', protocolName: '自定义协议', protocolType: 'Jar', ipAddress: '192.168.1.109:9200', serviceTypeIds: ['custom'] },
    { id: 'custom-script-local', protocolName: '脚本扩展协议', protocolType: 'Local', ipAddress: '192.168.1.110:9201', serviceTypeIds: ['custom'] },
    { id: 'custom-script-jar', protocolName: '脚本扩展协议', protocolType: 'Jar', ipAddress: '192.168.1.110:9201', serviceTypeIds: ['custom'] },
];

export function getServiceTypeById(id: string) {
    return NETWORK_PROTOCOL_SERVICE_TYPES.find((item) => item.id === id);
}

export function getNetworkComponentById(id: string) {
    return NETWORK_PROTOCOL_COMPONENTS.find((item) => item.id === id);
}

export function getProtocolOptionById(id: string) {
    return NETWORK_PROTOCOL_OPTIONS.find((item) => item.id === id);
}

export function getProtocolOptionsForServiceType(serviceTypeId: string) {
    return NETWORK_PROTOCOL_OPTIONS.filter((item) => item.serviceTypeIds.includes(serviceTypeId));
}

export function buildNetworkProtocolRecord(input: {
    name: string;
    description: string;
    serviceTypeId: string;
    networkComponentId: string;
    protocolOptionId: string;
    id?: string;
    createdAt?: string;
}): NetworkProtocolRecord | null {
    const serviceType = getServiceTypeById(input.serviceTypeId);
    const protocolOption = getProtocolOptionById(input.protocolOptionId);
    if (!serviceType || !protocolOption) return null;

    const now = new Date();
    const pad = (value: number) => String(value).padStart(2, '0');
    const createdAt = input.createdAt ?? (
        `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} `
        + `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
    );

    return {
        id: input.id ?? generateNetworkProtocolId(),
        name: input.name,
        description: input.description,
        serviceTypeId: input.serviceTypeId,
        networkComponentId: input.networkComponentId,
        protocolOptionId: input.protocolOptionId,
        serviceName: serviceType.serviceName,
        protocolName: protocolOption.protocolName,
        ipAddress: protocolOption.ipAddress,
        protocolType: protocolOption.protocolType,
        createdAt,
    };
}

export function generateNetworkProtocolId(): string {
    const base = Date.now();
    const suffix = Math.floor(Math.random() * 1000);
    return String(base * 1000 + suffix);
}

export function createInitialNetworkProtocols(): NetworkProtocolRecord[] {
    const seeds = [
        { name: 'MQTT', serviceTypeId: 'mqtt', protocolOptionId: 'mqtt-local', description: '面向海量设备接入的发布订阅协议组件。' },
        { name: 'CoAP', serviceTypeId: 'coap', protocolOptionId: 'coap-local', description: '适用于低功耗终端的轻量级通信协议组件。' },
        { name: 'HTTP', serviceTypeId: 'http', protocolOptionId: 'http-local', description: '支持 REST 风格上报与回调的 HTTP 协议组件。' },
        { name: 'WebSocket', serviceTypeId: 'websocket', protocolOptionId: 'websocket-local', description: '用于实时双向通信的 WebSocket 协议组件。' },
        { name: 'UDP', serviceTypeId: 'udp', protocolOptionId: 'udp-local', description: '面向高频小包上报的 UDP 协议组件。' },
        { name: 'TCP', serviceTypeId: 'tcp', protocolOptionId: 'tcp-local', description: '提供可靠长连接的 TCP 协议组件。' },
    ];

    return seeds.map((seed, index) => buildNetworkProtocolRecord({
        name: seed.name,
        description: seed.description,
        serviceTypeId: seed.serviceTypeId,
        networkComponentId: NETWORK_PROTOCOL_COMPONENTS[index % NETWORK_PROTOCOL_COMPONENTS.length].id,
        protocolOptionId: seed.protocolOptionId,
        id: `183332843198437785${7 - index}`,
        createdAt: index === 0 ? '2024-09-10 10:15:34' : '2025-02-21 10:35:12',
    })).filter((item): item is NetworkProtocolRecord => item !== null);
}
