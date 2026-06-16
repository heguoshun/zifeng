export type ProductFormMode = 'create' | 'view' | 'edit';

const PRODUCT_VIEW_PREFIX = 'product-view--';
const PRODUCT_EDIT_PREFIX = 'product-edit--';

export function isProductFormPage(page: string): boolean {
    return page === 'product-create'
        || page.startsWith(PRODUCT_VIEW_PREFIX)
        || page.startsWith(PRODUCT_EDIT_PREFIX);
}

export function resolveProductFormRoute(
    page: string,
    hash = '',
): { mode: ProductFormMode; productId: string | null } {
    if (page.startsWith(PRODUCT_VIEW_PREFIX)) {
        const productId = page.slice(PRODUCT_VIEW_PREFIX.length);
        return productId ? { mode: 'view', productId } : { mode: 'create', productId: null };
    }

    if (page.startsWith(PRODUCT_EDIT_PREFIX)) {
        const productId = page.slice(PRODUCT_EDIT_PREFIX.length);
        return productId ? { mode: 'edit', productId } : { mode: 'create', productId: null };
    }

    if (page === 'product-create') {
        const params = new URLSearchParams(hash.replace(/^#/, ''));
        const modeParam = params.get('mode');
        const mode: ProductFormMode = modeParam === 'view' || modeParam === 'edit' ? modeParam : 'create';
        return { mode, productId: params.get('id') };
    }

    return { mode: 'create', productId: null };
}

export function parseProductFormRoute(hash: string): { mode: ProductFormMode; productId: string | null } {
    const params = new URLSearchParams(hash.replace(/^#/, ''));
    const page = params.get('page') ?? '';
    return resolveProductFormRoute(page, hash);
}

export function navigateProductForm(mode: ProductFormMode, productId?: string) {
    if (mode === 'create') {
        window.location.hash = 'page=product-create';
        return;
    }

    if (!productId) {
        return;
    }

    window.location.hash = mode === 'view'
        ? `page=${PRODUCT_VIEW_PREFIX}${productId}`
        : `page=${PRODUCT_EDIT_PREFIX}${productId}`;
}
