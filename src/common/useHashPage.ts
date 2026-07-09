/**
 * 多页面原型的轻量 hash 路由 hook。
 *
 * URL 格式: #page=<pageId>
 * pageId 仅允许小写字母、数字、连字符（a-z 0-9 -）。
 *
 * 用法：
 *   const { page, setPage } = useHashPage('home');
 *   const route = defineHashPageRoute([
 *     { id: 'dashboard', title: '工作台' },
 *   ], { defaultPageId: 'dashboard' });
 *   const { page, setPage, pages } = useHashPage(route);
 */
import { useCallback, useEffect, useState } from 'react';

export interface HashPageRoutePage {
    id: string;
    title: string;
    /** 为 false 时不出现在 Make 页面菜单（如新增、编辑、详情等子页面） */
    showInMenu?: boolean;
}

export interface HashPageRoute {
    pages: HashPageRoutePage[];
    defaultPageId: string;
}

const PAGE_ID_RE = /^[a-z0-9-]+$/u;

function normalizePageId(value: unknown): string {
    const id = typeof value === 'string' ? value.trim() : '';
    return PAGE_ID_RE.test(id) ? id : '';
}

function normalizeRoutePages(pages: HashPageRoutePage[]): HashPageRoutePage[] {
    if (!Array.isArray(pages)) {
        return [];
    }
    return pages
        .map((page) => {
            const id = normalizePageId(page?.id);
            const title = typeof page?.title === 'string' ? page.title.trim() : '';
            if (!id || !title) {
                return null;
            }
            const normalized: HashPageRoutePage = { id, title };
            if (page?.showInMenu === false) {
                normalized.showInMenu = false;
            }
            return normalized;
        })
        .filter((page): page is HashPageRoutePage => Boolean(page));
}

function getHostRoutePages(pages: HashPageRoutePage[]): Array<{ id: string; title: string; showInMenu?: boolean }> {
    return pages.map(({ id, title, showInMenu }) => {
        const entry: { id: string; title: string; showInMenu?: boolean } = { id, title };
        if (showInMenu === false) {
            entry.showInMenu = false;
        }
        return entry;
    });
}

function getMenuRoutePages(pages: HashPageRoutePage[]): Array<{ id: string; title: string }> {
    return pages
        .filter((page) => page.showInMenu !== false)
        .map(({ id, title }) => ({ id, title }));
}

function isMenuPageId(pageId: string, pages: HashPageRoutePage[]): boolean {
    const entry = pages.find((page) => page.id === pageId);
    return entry ? entry.showInMenu !== false : false;
}

function resolveHostActivePageId(
    pageId: string,
    pages: HashPageRoutePage[],
    defaultPageId: string,
): string {
    if (isMenuPageId(pageId, pages)) {
        return pageId;
    }
    const menuPages = getMenuRoutePages(pages);
    if (menuPages.some((page) => page.id === defaultPageId)) {
        return defaultPageId;
    }
    return menuPages[0]?.id ?? defaultPageId;
}

export function parseHashPage(hash: string): string | null {
    const rawHash = String(hash || '').replace(/^#/, '');
    const pageId = new URLSearchParams(rawHash).get('page');
    return normalizePageId(pageId) || null;
}

export function parseSearchPage(search: string): string | null {
    const rawSearch = String(search || '').replace(/^\?/, '');
    const pageId = new URLSearchParams(rawSearch).get('page');
    return normalizePageId(pageId) || null;
}

export function defineHashPageRoute(
    pages: HashPageRoutePage[],
    options?: { defaultPageId?: string },
): HashPageRoute {
    const normalizedPages = normalizeRoutePages(pages);
    const defaultPageId = normalizePageId(options?.defaultPageId);
    return {
        pages: normalizedPages,
        defaultPageId: normalizedPages.some((page) => page.id === defaultPageId)
            ? defaultPageId
            : normalizedPages[0]?.id || 'home',
    };
}

function normalizeRouteInput(routeOrDefault?: HashPageRoute | string): HashPageRoute {
    if (routeOrDefault && typeof routeOrDefault === 'object') {
        return defineHashPageRoute(routeOrDefault.pages, { defaultPageId: routeOrDefault.defaultPageId });
    }
    const defaultPageId = normalizePageId(routeOrDefault) || 'home';
    return {
        pages: [],
        defaultPageId,
    };
}

function notifyHostPrototypePageChange(pageId: string) {
    if (typeof window === 'undefined' || window.parent === window) {
        return;
    }
    window.parent.postMessage({
        type: 'AXHUB_PROTOTYPE_PAGE_CHANGE',
        pageId,
    }, '*');
}

function notifyHostPrototypeRouteInfo(
    pages: HashPageRoutePage[],
    defaultPageId: string,
    activePageId: string,
) {
    if (
        pages.length === 0
        || typeof window === 'undefined'
        || window.parent === window
    ) {
        return;
    }
    const menuPages = getMenuRoutePages(pages);
    window.parent.postMessage({
        type: 'AXHUB_PROTOTYPE_ROUTE_INFO',
        // Make 页面目录读取 pages / menuPages，仅同步菜单导航项
        pages: menuPages,
        menuPages,
        // 完整路由表供后续扩展；子页面跳转在 iframe 内完成，不通知宿主以避免被重置
        routePages: getHostRoutePages(pages),
        defaultPageId,
        activePageId: resolveHostActivePageId(activePageId, pages, defaultPageId),
    }, '*');
}

export function useHashPage(routeOrDefault: HashPageRoute | string = 'home') {
    const route = normalizeRouteInput(routeOrDefault);
    const { pages, defaultPageId } = route;
    const routeSignature = `${defaultPageId}:${pages.map((routePage) => `${routePage.id}=${routePage.title}:${routePage.showInMenu === false ? '0' : '1'}`).join('|')}`;
    const [page, setPageState] = useState<string>(() => {
        if (typeof window === 'undefined') {
            return defaultPageId;
        }
        return parseHashPage(window.location.hash) ?? parseSearchPage(window.location.search) ?? defaultPageId;
    });

    useEffect(() => {
        notifyHostPrototypeRouteInfo(pages, defaultPageId, page);
    }, [routeSignature]);

    useEffect(() => {
        if (!isMenuPageId(page, pages)) {
            return;
        }
        notifyHostPrototypeRouteInfo(pages, defaultPageId, page);
        notifyHostPrototypePageChange(page);
    }, [page, pages, defaultPageId]);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return undefined;
        }

        const onHashChange = () => {
            const next = parseHashPage(window.location.hash) ?? parseSearchPage(window.location.search);
            const nextPageId = next ?? defaultPageId;
            setPageState(nextPageId);
        };

        window.addEventListener('hashchange', onHashChange);
        return () => window.removeEventListener('hashchange', onHashChange);
    }, [defaultPageId]);

    const setPage = useCallback((pageId: string) => {
        const nextPageId = normalizePageId(pageId);
        if (!nextPageId || typeof window === 'undefined') {
            return;
        }
        window.location.hash = `page=${nextPageId}`;
    }, []);

    return { page, setPage, pages, defaultPageId };
}
