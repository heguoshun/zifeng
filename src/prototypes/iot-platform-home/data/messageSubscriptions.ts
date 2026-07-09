export type MessageSubscriptionItem = {
    id: string;
    name: string;
    description: string;
    enabled: boolean;
};

export type MessagePushCycle = 'weekly-monday' | 'monthly-1';

export type MessagePushSettings = {
    pushTime: string;
    pushCycle: MessagePushCycle | '';
};

export const MESSAGE_PUSH_CYCLE_OPTIONS: { label: string; value: MessagePushCycle }[] = [
    { label: '每周一', value: 'weekly-monday' },
    { label: '每月1号', value: 'monthly-1' },
];

export function createInitialMessageSubscriptions(): MessageSubscriptionItem[] {
    return [
        {
            id: 'device-runtime',
            name: '设备运行情况分析',
            description: '包括当前设备总数、在线设备数、离线设备数',
            enabled: true,
        },
        {
            id: 'device-alarm',
            name: '设备告警消息分析',
            description: '包括当前设备报警总数，各等级告警数、已处理和未处理数据统计',
            enabled: true,
        },
        {
            id: 'system-runtime',
            name: '系统运行情况分析',
            description: '包括当前系统CPU、内存、磁盘使用率情况',
            enabled: true,
        },
        {
            id: 'system-alarm',
            name: '系统告警消息分析',
            description: '包括当前系统报警总数，各等级告警数、已处理和未处理数据统计',
            enabled: true,
        },
        {
            id: 'work-order',
            name: '工单处理情况分析',
            description: '包括当前工单总数，各等级工单数、已处理和未处理工单数据统计',
            enabled: true,
        },
    ];
}

export function createInitialMessagePushSettings(): MessagePushSettings {
    return {
        pushTime: '06:00:00',
        pushCycle: '',
    };
}

export function formatPushCycleLabel(cycle: MessagePushCycle | ''): string {
    if (!cycle) return '—';
    return MESSAGE_PUSH_CYCLE_OPTIONS.find((item) => item.value === cycle)?.label ?? cycle;
}
