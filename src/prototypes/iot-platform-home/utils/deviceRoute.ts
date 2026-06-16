export type DeviceFormMode = 'create' | 'view' | 'edit';

const DEVICE_VIEW_PREFIX = 'device-view--';
const DEVICE_EDIT_PREFIX = 'device-edit--';
const DEVICE_CREATE_PRODUCT_PREFIX = 'device-create--p-';

export function isDeviceFormPage(page: string): boolean {
    return page === 'device-create'
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
} {
    if (page.startsWith(DEVICE_VIEW_PREFIX)) {
        const deviceId = page.slice(DEVICE_VIEW_PREFIX.length);
        return { mode: 'view', deviceId: deviceId || null, productId: null };
    }

    if (page.startsWith(DEVICE_EDIT_PREFIX)) {
        const deviceId = page.slice(DEVICE_EDIT_PREFIX.length);
        return { mode: 'edit', deviceId: deviceId || null, productId: null };
    }

    if (page.startsWith(DEVICE_CREATE_PRODUCT_PREFIX)) {
        const productId = page.slice(DEVICE_CREATE_PRODUCT_PREFIX.length);
        return { mode: 'create', deviceId: null, productId: productId || null };
    }

    if (page === 'device-create') {
        const params = new URLSearchParams(hash.replace(/^#/, ''));
        const modeParam = params.get('mode');
        const mode: DeviceFormMode = modeParam === 'view' || modeParam === 'edit' ? modeParam : 'create';
        return {
            mode,
            deviceId: params.get('id'),
            productId: params.get('productId'),
        };
    }

    return { mode: 'create', deviceId: null, productId: null };
}

export function parseDeviceFormRoute(hash: string): {
    mode: DeviceFormMode;
    deviceId: string | null;
    productId: string | null;
} {
    const params = new URLSearchParams(hash.replace(/^#/, ''));
    const page = params.get('page') ?? '';
    return resolveDeviceFormRoute(page, hash);
}

export function navigateDeviceForm(mode: DeviceFormMode, options?: { deviceId?: string; productId?: string }) {
    if (mode === 'create') {
        if (options?.productId && options.productId !== 'all') {
            window.location.hash = `page=${DEVICE_CREATE_PRODUCT_PREFIX}${options.productId}`;
            return;
        }
        window.location.hash = 'page=device-create';
        return;
    }

    if (!options?.deviceId) {
        return;
    }

    window.location.hash = mode === 'view'
        ? `page=${DEVICE_VIEW_PREFIX}${options.deviceId}`
        : `page=${DEVICE_EDIT_PREFIX}${options.deviceId}`;
}
