export function parseHashParams(hash: string): URLSearchParams {
    const raw = String(hash || '').replace(/^#/, '');
    return new URLSearchParams(raw);
}

export function getHashParam(hash: string, key: string): string {
    return parseHashParams(hash).get(key)?.trim() || '';
}

export function buildHashPage(pageId: string, params?: Record<string, string>): string {
    const search = new URLSearchParams({ page: pageId });
    if (params) {
        Object.entries(params).forEach(([key, value]) => {
            if (value) search.set(key, value);
        });
    }
    return `#${search.toString()}`;
}
