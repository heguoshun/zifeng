export type PushSourceMessageType = 'device-alarm' | 'system-alarm' | 'msg-subscribe' | 'work-order';

export type PushSourcePlatform = 'dingtalk' | 'wecom' | 'sms' | 'email';

export type PushSourceConfigItem = {
    id: string;
    key: string;
    name: string;
    value: string;
    updatedAt: string;
};

export type PushSourceRecord = {
    id: string;
    name: string;
    platform: PushSourcePlatform;
    messageType: PushSourceMessageType;
    createdAt: string;
    configItems: PushSourceConfigItem[];
    recipientUserIds: string[];
};

export const PUSH_SOURCE_MESSAGE_TYPE_OPTIONS: { label: string; value: PushSourceMessageType }[] = [
    { label: '设备告警信息', value: 'device-alarm' },
    { label: '系统告警信息', value: 'system-alarm' },
    { label: '消息订阅推送', value: 'msg-subscribe' },
    { label: '工单处理信息', value: 'work-order' },
];

export const PUSH_SOURCE_MESSAGE_TYPE_FILTER_OPTIONS = [
    { label: '全部', value: 'all' },
    ...PUSH_SOURCE_MESSAGE_TYPE_OPTIONS,
];

export const PUSH_SOURCE_PLATFORM_OPTIONS: { label: string; value: PushSourcePlatform }[] = [
    { label: '钉钉', value: 'dingtalk' },
    { label: '企业微信', value: 'wecom' },
    { label: '短信', value: 'sms' },
    { label: '邮箱', value: 'email' },
];

export const PUSH_SOURCE_RECIPIENT_POOL = Array.from({ length: 14 }, (_, index) => ({
    id: `recipient-user-${index + 1}`,
    label: `用户名${index + 1}`,
}));

export const PUSH_SOURCE_ROLE_FILTER_OPTIONS = [
    { label: '请选择用户角色', value: '' },
    { label: '企业管理员', value: 'role-jiahuan-admin' },
    { label: '物联网角色', value: 'role-jiahuan-iot' },
    { label: '运维人员', value: 'role-jiahuan-ops' },
    { label: '审计员', value: 'role-jiahuan-auditor' },
];

const SMS_CONFIG_TEMPLATE: Omit<PushSourceConfigItem, 'id' | 'updatedAt'>[] = [
    { key: 'tmpId', name: '模板编码', value: 'SMS_472750121' },
    { key: 'appId', name: '应用id', value: 'SMS_472750121' },
    { key: 'appkey', name: '应用key', value: 'SMS_472750121' },
    { key: 'sign', name: '签名', value: 'SMS_472750121' },
    { key: 'smsType', name: '短信服务提供商', value: 'SMS_472750121' },
    { key: 'sender', name: '发送人号码', value: 'SMS_472750121' },
    { key: 'url', name: 'url', value: 'SMS_472750121' },
    { key: 'accessKeyId', name: 'accessKeyId', value: 'SMS_472750121' },
    { key: 'accessKeySecret', name: 'accessKeySecret', value: 'SMS_472750121' },
    { key: 't', name: 't', value: 'SMS_472750121' },
];

export function generatePushSourceId(): string {
    return `${Date.now()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
}

export function generatePushSourceConfigItemId(): string {
    return `psc-item-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

export function formatPushSourceNow(): string {
    const now = new Date();
    const pad = (value: number) => String(value).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} `
        + `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

export function getMessageTypeLabel(type: PushSourceMessageType): string {
    return PUSH_SOURCE_MESSAGE_TYPE_OPTIONS.find((item) => item.value === type)?.label ?? type;
}

export function getPlatformLabel(platform: PushSourcePlatform): string {
    return PUSH_SOURCE_PLATFORM_OPTIONS.find((item) => item.value === platform)?.label ?? platform;
}

function createConfigItems(
    template: Omit<PushSourceConfigItem, 'id' | 'updatedAt'>[],
    updatedAt: string,
): PushSourceConfigItem[] {
    return template.map((item) => ({
        ...item,
        id: generatePushSourceConfigItemId(),
        updatedAt,
    }));
}

export function createInitialPushSources(): PushSourceRecord[] {
    const createdAt = '2024-07-01 10:07:46';
    return [
        {
            id: '1838101162311388185',
            name: '设备告警信息推送',
            platform: 'dingtalk',
            messageType: 'device-alarm',
            createdAt,
            configItems: createConfigItems(SMS_CONFIG_TEMPLATE.slice(0, 6), createdAt),
            recipientUserIds: ['recipient-user-8', 'recipient-user-12', 'recipient-user-13', 'recipient-user-14'],
        },
        {
            id: '1838101162311388186',
            name: '系统告警信息推送',
            platform: 'wecom',
            messageType: 'system-alarm',
            createdAt,
            configItems: createConfigItems(SMS_CONFIG_TEMPLATE.slice(0, 5), createdAt),
            recipientUserIds: ['recipient-user-1', 'recipient-user-2'],
        },
        {
            id: '1838101162311388187',
            name: '消息订阅推送',
            platform: 'sms',
            messageType: 'msg-subscribe',
            createdAt,
            configItems: createConfigItems(SMS_CONFIG_TEMPLATE, createdAt),
            recipientUserIds: ['recipient-user-3', 'recipient-user-4', 'recipient-user-5'],
        },
        {
            id: '1838101162311388188',
            name: '工单处理信息推送',
            platform: 'email',
            messageType: 'work-order',
            createdAt,
            configItems: createConfigItems(SMS_CONFIG_TEMPLATE.slice(0, 4), createdAt),
            recipientUserIds: ['recipient-user-6', 'recipient-user-7'],
        },
    ];
}

export type PushSourceFormValue = {
    name: string;
    messageType: PushSourceMessageType | '';
    platform: PushSourcePlatform | '';
};

export function toPushSourceFormValue(record: PushSourceRecord): PushSourceFormValue {
    return {
        name: record.name,
        messageType: record.messageType,
        platform: record.platform,
    };
}
