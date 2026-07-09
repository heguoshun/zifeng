export type ProtocolType = 'Local' | 'Jar';

export type ProtocolRecord = {
    id: string;
    name: string;
    description: string;
    type: ProtocolType;
    localAddress?: string;
    jarFileName?: string;
    createdAt: string;
};

export const PROTOCOL_TYPE_OPTIONS = ['全部', 'Local', 'Jar'] as const;

export function generateProtocolId(): string {
    const base = Date.now();
    const suffix = Math.floor(Math.random() * 1000);
    return String(base * 1000 + suffix);
}

export function createInitialProtocols(): ProtocolRecord[] {
    return [
        {
            id: '1833328431984377857',
            name: 'CoAP协议',
            description: '适用于低功耗传感器接入，支持 UDP 组播与资源发现，常用于抄表与环境监测场景。',
            type: 'Local',
            localAddress: '192.168.1.100:5683',
            createdAt: '2024-09-10 10:15:34',
        },
        {
            id: '1833328431984377856',
            name: 'HTTP协议',
            description: '基于 RESTful 接口的设备数据上报与指令下发，兼容第三方平台 HTTP 回调。',
            type: 'Jar',
            jarFileName: 'http-protocol.jar',
            createdAt: '2025-02-21 10:35:12',
        },
        {
            id: '1833328431984377855',
            name: 'WebSocket协议',
            description: '支持设备与平台之间的长连接双向通信，适用于实时告警推送与状态订阅。',
            type: 'Local',
            localAddress: '192.168.1.101:8080',
            createdAt: '2025-02-21 10:35:12',
        },
        {
            id: '1833328431984377854',
            name: 'TCP协议',
            description: '面向工业网关的可靠字节流传输，支持自定义报文编解码与心跳保活机制。',
            type: 'Jar',
            jarFileName: 'tcp-protocol.jar',
            createdAt: '2025-02-21 10:35:12',
        },
        {
            id: '1833328431984377853',
            name: 'UDP协议',
            description: '无连接轻量传输协议，适合高频小数据包上报，如定位终端与能耗采集设备。',
            type: 'Jar',
            jarFileName: 'udp-protocol.jar',
            createdAt: '2025-02-21 10:35:12',
        },
        {
            id: '1833328431984377852',
            name: 'MQTT协议',
            description: '物联网主流消息协议，支持主题订阅与 QoS 分级，广泛用于智能设备上下行数据通道。',
            type: 'Local',
            localAddress: '192.168.1.102:1883',
            createdAt: '2025-02-21 10:35:12',
        },
    ];
}
