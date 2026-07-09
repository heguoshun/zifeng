export const DEFAULT_LIST_PAGE_SIZE = '10';

export function paginateItems<T>(items: T[], page: number, pageSize: number) {
    const total = items.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const currentPage = Math.min(Math.max(1, page), totalPages);
    const start = (currentPage - 1) * pageSize;

    return {
        items: items.slice(start, start + pageSize),
        total,
        totalPages,
        currentPage,
    };
}

export function getVisiblePages(currentPage: number, totalPages: number): number[] {
    if (totalPages <= 9) {
        return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const start = Math.max(1, Math.min(currentPage - 4, totalPages - 8));
    return Array.from({ length: 9 }, (_, index) => start + index);
}

