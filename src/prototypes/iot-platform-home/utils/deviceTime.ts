export function formatDeviceDateTime(date: Date) {
    return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    }).replace(/\//g, '.');
}

export function parseDeviceDateTime(value: string) {
    if (!value.trim()) return null;

    const normalized = value.trim().replace(/\./g, '/');
    const parsed = new Date(normalized);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatOnlineDuration(from: Date, to: Date = new Date()) {
    const diffMs = Math.max(0, to.getTime() - from.getTime());
    const totalMinutes = Math.floor(diffMs / 60000);
    const days = Math.floor(totalMinutes / (24 * 60));
    const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
    const minutes = totalMinutes % 60;
    return `${days}天${hours}小时${minutes}分钟`;
}

export function resolveDeviceOnlineDuration(
    device: { enabled: boolean; enabledAt: string; onlineDuration: string },
    now: Date = new Date(),
) {
    if (!device.enabled) {
        return device.onlineDuration;
    }

    const enabledAt = parseDeviceDateTime(device.enabledAt);
    if (!enabledAt) {
        return device.onlineDuration;
    }

    return formatOnlineDuration(enabledAt, now);
}

export function applyDeviceEnableToggle(device: DeviceRecordLike, enabled: boolean, now = new Date()): DeviceRecordLike {
    if (enabled) {
        return {
            ...device,
            enabled: true,
            enabledAt: formatDeviceDateTime(now),
            status: 'online',
            onlineDuration: '0天0小时0分钟',
        };
    }

    const enabledAt = parseDeviceDateTime(device.enabledAt);
    return {
        ...device,
        enabled: false,
        status: 'disabled',
        onlineDuration: enabledAt ? formatOnlineDuration(enabledAt, now) : device.onlineDuration,
    };
}

type DeviceRecordLike = {
    enabled: boolean;
    enabledAt: string;
    onlineDuration: string;
    status: 'online' | 'offline' | 'fault' | 'disabled';
};
