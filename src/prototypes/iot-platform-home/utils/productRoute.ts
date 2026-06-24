export type ProductFormMode = 'create' | 'view' | 'edit';

export type ProductFormRoute = {
    mode: ProductFormMode;
    productId: string | null;
};

const PRODUCT_VIEW_PREFIX = 'product-view--';
const PRODUCT_EDIT_PREFIX = 'product-edit--';

let pendingProductFormRoute: ProductFormRoute | null = null;

export function isProductFormPage(page: string): boolean {
    return page === 'product-create'
        || page === 'product-edit'
        || page === 'product-view'
        || page.startsWith(PRODUCT_VIEW_PREFIX)
        || page.startsWith(PRODUCT_EDIT_PREFIX);
}

function isProductViewPage(page: string): boolean {
    return page === 'product-view' || page.startsWith(PRODUCT_VIEW_PREFIX);
}

function isProductEditPage(page: string): boolean {
    return page === 'product-edit' || page.startsWith(PRODUCT_EDIT_PREFIX);
}

function resolveProductIdFromPage(page: string, hash: string): string | null {
    if (page.startsWith(PRODUCT_VIEW_PREFIX)) {
        return page.slice(PRODUCT_VIEW_PREFIX.length) || null;
    }
    if (page.startsWith(PRODUCT_EDIT_PREFIX)) {
        return page.slice(PRODUCT_EDIT_PREFIX.length) || null;
    }

    const params = new URLSearchParams(hash.replace(/^#/, ''));
    return params.get('id');
}

export function resolveProductFormRoute(
    page: string,
    hash = '',
): ProductFormRoute {
    const params = new URLSearchParams(hash.replace(/^#/, ''));
    const productId = resolveProductIdFromPage(page, hash);

    if (isProductViewPage(page)) {
        return { mode: 'view', productId };
    }

    if (isProductEditPage(page)) {
        return { mode: 'edit', productId };
    }

    if (page === 'product-create') {
        const modeParam = params.get('mode');
        const mode: ProductFormMode = modeParam === 'view' || modeParam === 'edit' ? modeParam : 'create';
        return { mode, productId: params.get('id') };
    }

    return { mode: 'create', productId: null };
}

export function parseProductFormRoute(hash: string): ProductFormRoute {
    const page = new URLSearchParams(hash.replace(/^#/, '')).get('page') ?? '';
    return resolveProductFormRoute(page, hash);
}

export function mergeProductFormRoute(previous: ProductFormRoute, hash: string): ProductFormRoute {
    if (pendingProductFormRoute) {
        const pending = pendingProductFormRoute;
        pendingProductFormRoute = null;
        const parsed = parseProductFormRoute(hash);
        return {
            mode: pending.mode,
            productId: pending.productId ?? parsed.productId,
        };
    }

    const parsed = parseProductFormRoute(hash);
    const page = new URLSearchParams(hash.replace(/^#/, '')).get('page') ?? '';

    if (!isProductFormPage(page)) {
        return parsed;
    }

    const shouldKeepPreviousProductId = isProductViewPage(page) || isProductEditPage(page);

    return {
        mode: parsed.mode,
        productId: parsed.productId ?? (shouldKeepPreviousProductId ? previous.productId : null),
    };
}

export function navigateProductForm(mode: ProductFormMode, productId?: string) {
    pendingProductFormRoute = {
        mode,
        productId: productId ?? null,
    };

    const params = new URLSearchParams();

    if (mode === 'create') {
        params.set('page', 'product-create');
    } else {
        if (!productId) {
            return;
        }
        params.set('page', mode === 'view' ? 'product-view' : 'product-edit');
        params.set('id', productId);
    }

    window.location.hash = params.toString();
}

/** 将旧版 page=product-view--{id} 格式纠正为 Axhub 可识别的标准路由 */
export function normalizeProductFormHash(): boolean {
    if (typeof window === 'undefined') {
        return false;
    }

    const raw = window.location.hash.replace(/^#/, '');
    const params = new URLSearchParams(raw);
    const page = params.get('page') ?? '';

    if (page.startsWith(PRODUCT_VIEW_PREFIX)) {
        const id = page.slice(PRODUCT_VIEW_PREFIX.length);
        if (!id) {
            return false;
        }
        params.set('page', 'product-view');
        params.set('id', id);
        window.location.hash = params.toString();
        return true;
    }

    if (page.startsWith(PRODUCT_EDIT_PREFIX)) {
        const id = page.slice(PRODUCT_EDIT_PREFIX.length);
        if (!id) {
            return false;
        }
        params.set('page', 'product-edit');
        params.set('id', id);
        window.location.hash = params.toString();
        return true;
    }

    return false;
}
