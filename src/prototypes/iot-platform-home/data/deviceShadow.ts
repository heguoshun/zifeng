export type DeviceShadowData = {
    productId: string;
    deviceName: string;
    status: string;
    properties: {
        reported: Record<string, number | string>;
        desired: Record<string, number | string>;
        delta: Record<string, number>;
    };
};

const MOCK_SHADOW_MAP: Record<string, DeviceShadowData> = {};

function buildDefaultShadow(deviceKey: string, productId: string, deviceName: string): DeviceShadowData {
    return {
        productId,
        deviceName,
        status: 'inactive',
        properties: {
            reported: {
                temperature: 25.3,
                humidity: 60,
                battery: 98,
            },
            desired: {
                temperature: 24.0,
                humidity: 55,
            },
            delta: {
                temperature: -1.3,
                humidity: -5,
            },
        },
    };
}

export function getDeviceShadow(deviceKey: string, productId: string, deviceName: string): DeviceShadowData {
    if (!MOCK_SHADOW_MAP[deviceKey]) {
        MOCK_SHADOW_MAP[deviceKey] = buildDefaultShadow(deviceKey, productId, deviceName);
    }
    return MOCK_SHADOW_MAP[deviceKey];
}

export function refreshDeviceShadow(deviceKey: string, productId: string, deviceName: string): DeviceShadowData {
    const base = getDeviceShadow(deviceKey, productId, deviceName);
    const reported = { ...base.properties.reported };
    // Simulate slight value fluctuation
    Object.keys(reported).forEach((key) => {
        const val = Number(reported[key]);
        if (!Number.isNaN(val)) {
            const fluctuation = (Math.random() - 0.5) * 2;
            reported[key] = Math.round((val + fluctuation) * 10) / 10;
        }
    });

    const delta: Record<string, number> = {};
    Object.keys(base.properties.desired).forEach((key) => {
        const rep = Number(reported[key]);
        const des = Number(base.properties.desired[key]);
        if (!Number.isNaN(rep) && !Number.isNaN(des)) {
            delta[key] = Math.round((rep - des) * 10) / 10;
        }
    });

    MOCK_SHADOW_MAP[deviceKey] = {
        ...base,
        properties: {
            ...base.properties,
            reported,
            delta,
        },
    };

    return MOCK_SHADOW_MAP[deviceKey];
}

export function updateDeviceShadowDesired(
    deviceKey: string,
    productId: string,
    deviceName: string,
    desired: Record<string, number>,
): DeviceShadowData {
    return updateDeviceShadowFullDesired(deviceKey, productId, deviceName, desired);
}

export function updateDeviceShadowFullDesired(
    deviceKey: string,
    productId: string,
    deviceName: string,
    desired: Record<string, number>,
): DeviceShadowData {
    const base = getDeviceShadow(deviceKey, productId, deviceName);

    // 全量替换 desired
    const newDesired: Record<string, number> = {};
    for (const [key, value] of Object.entries(desired)) {
        newDesired[key] = value;
    }

    const delta: Record<string, number> = {};
    for (const [key, value] of Object.entries(newDesired)) {
        const rep = Number(base.properties.reported[key]);
        if (!Number.isNaN(rep) && !Number.isNaN(value)) {
            delta[key] = Math.round((rep - value) * 10) / 10;
        }
    }

    MOCK_SHADOW_MAP[deviceKey] = {
        ...base,
        properties: {
            ...base.properties,
            desired: newDesired,
            delta,
        },
    };

    return MOCK_SHADOW_MAP[deviceKey];
}

export function formatShadowJson(data: DeviceShadowData): string {
    return JSON.stringify(data, null, 2);
}
