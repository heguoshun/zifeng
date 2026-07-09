export type DeviceFormMode = 'create' | 'view' | 'edit';

export type DeviceFormRoute = {
    mode: DeviceFormMode;
    deviceId: string | null;
    productId: string | null;
    tab: string | null;
};

const DEVICE_VIEW_PREFIX = 'device-view--';
const DEVICE_EDIT_PREFIX = 'device-edit--';
const DEVICE_CREATE_PRODUCT_PREFIX = 'device-create--p-';

let pendingDeviceFormRoute: DeviceFormRoute | null = null;

export function isDeviceFormPage(page: string): boolean {
    return page === 'device-create'
        || page === 'device-edit'
        || page === 'device-view'
        || page.startsWith(DEVICE_VIEW_PREFIX)
        || page.startsWith(DEVICE_EDIT_PREFIX)
        || page.startsWith(DEVICE_CREATE_PRODUCT_PREFIX);
}

export function parseDeviceManagementRoute(hash: string): { productId: string | null; groupId: string | null } {
    const params = new URLSearchParams(hash.replace(/^#/, ''));
    return {
        productId: params.get('productId'),
        groupId: params.get('groupId'),
    };
}

export function navigateDeviceManagement(options?: { productId?: string; groupId?: string }) {
    const params = new URLSearchParams({ page: 'device-management' });
    if (options?.productId) {
        params.set('productId', options.productId);
    }
    if (options?.groupId) {
        params.set('groupId', options.groupId);
    }
    window.location.hash = params.toString();
}

export function resolveDeviceFormRoute(
    page: string,
    hash = '',
): {
    mode: DeviceFormMode;
    deviceId: string | null;
    productId: string | null;
    tab: string | null;
} {
    const hashParams = new URLSearchParams(hash.replace(/^#/, ''));

    if (page === 'device-view' || page.startsWith(DEVICE_VIEW_PREFIX)) {
        const deviceId = page === 'device-view'
            ? hashParams.get('id')
            : page.slice(DEVICE_VIEW_PREFIX.length);
        return { mode: 'view', deviceId: deviceId || null, productId: null, tab: hashParams.get('tab') };
    }

    if (page === 'device-edit' || page.startsWith(DEVICE_EDIT_PREFIX)) {
        const deviceId = page === 'device-edit'
            ? hashParams.get('id')
            : page.slice(DEVICE_EDIT_PREFIX.length);
        return { mode: 'edit', deviceId: deviceId || null, productId: null, tab: hashParams.get('tab') };
    }

    if (page.startsWith(DEVICE_CREATE_PRODUCT_PREFIX)) {
        const productId = page.slice(DEVICE_CREATE_PRODUCT_PREFIX.length);
        return { mode: 'create', deviceId: null, productId: productId || null, tab: hashParams.get('tab') };
    }

    if (page === 'device-create') {
        const modeParam = hashParams.get('mode');
        const mode: DeviceFormMode = modeParam === 'view' || modeParam === 'edit' ? modeParam : 'create';
        return {
            mode,
            deviceId: hashParams.get('id'),
            productId: hashParams.get('productId'),
            tab: hashParams.get('tab'),
        };
    }

    return { mode: 'create', deviceId: null, productId: null, tab: null };
}

export function parseDeviceFormRoute(hash: string): DeviceFormRoute {
    const params = new URLSearchParams(hash.replace(/^#/, ''));
    const page = params.get('page') ?? '';
    const result = resolveDeviceFormRoute(page, hash);

    // tab 也可能在顶层 query string 中（如 navigateDeviceForm 写入的情况）
    const tab = result.tab ?? params.get('tab');
    return { ...result, tab };
}

export function mergeDeviceFormRoute(previous: DeviceFormRoute, hash: string): DeviceFormRoute {
    if (pendingDeviceFormRoute) {
        const pending = pendingDeviceFormRoute;
        pendingDeviceFormRoute = null;
        const parsed = parseDeviceFormRoute(hash);
        return {
            mode: pending.mode,
            deviceId: pending.deviceId ?? parsed.deviceId,
            productId: pending.productId ?? parsed.productId,
            tab: pending.tab ?? parsed.tab,
        };
    }

    const parsed = parseDeviceFormRoute(hash);
    const page = new URLSearchParams(hash.replace(/^#/, '')).get('page') ?? '';

    if (!isDeviceFormPage(page)) {
        return parsed;
    }

    return {
        mode: parsed.mode,
        deviceId: parsed.deviceId ?? (
            page === 'device-edit' || page === 'device-view' ? previous.deviceId : null
        ),
        productId: parsed.productId ?? (page === 'device-create' ? previous.productId : null),
        tab: parsed.tab ?? previous.tab,
    };
}

export function navigateDeviceForm(mode: DeviceFormMode, options?: { deviceId?: string; productId?: string; tab?: string }) {
    pendingDeviceFormRoute = {
        mode,
        deviceId: options?.deviceId ?? null,
        productId: options?.productId && options.productId !== 'all' ? options.productId : null,
        tab: options?.tab ?? null,
    };

    const params = new URLSearchParams();

    if (mode === 'create') {
        params.set('page', 'device-create');
        if (options?.productId && options.productId !== 'all') {
            params.set('productId', options.productId);
        }
    } else {
        if (!options?.deviceId) {
            return;
        }
        params.set('page', mode === 'view' ? 'device-view' : 'device-edit');
        params.set('id', options.deviceId);
    }

    if (options?.tab) {
        params.set('tab', options.tab);
    }

    window.location.hash = params.toString();
}
