import React from 'react';
import ElSelect from './ElSelect';
import { getVisiblePages, DEFAULT_LIST_PAGE_SIZE } from '../utils/listPagination';

const PAGE_SIZE_OPTIONS = [
    { label: '10条/页', value: DEFAULT_LIST_PAGE_SIZE },
    { label: '20条/页', value: '20' },
    { label: '50条/页', value: '50' },
];

type ListPaginationProps = {
    total: number;
    currentPage: number;
    totalPages: number;
    pageSize: string;
    jumpPage: string;
    onPageChange: (page: number) => void;
    onPageSizeChange: (pageSize: string) => void;
    onJumpPageChange: (value: string) => void;
};

export default function ListPagination({
    total,
    currentPage,
    totalPages,
    pageSize,
    jumpPage,
    onPageChange,
    onPageSizeChange,
    onJumpPageChange,
}: ListPaginationProps) {
    const visiblePages = getVisiblePages(currentPage, totalPages);

    const handleJump = () => {
        const nextPage = Number(jumpPage);
        if (!Number.isFinite(nextPage) || nextPage < 1 || nextPage > totalPages) return;
        onPageChange(nextPage);
    };

    return (
        <div className="pm-pagination">
            <span className="pm-pagination__total">共 {total} 条记录</span>
            <div className="pm-pagination__controls">
                <button
                    type="button"
                    className="pm-pagination__btn pm-pagination__btn--nav"
                    disabled={currentPage <= 1}
                    onClick={() => onPageChange(currentPage - 1)}
                >
                    {'<'}
                </button>
                {visiblePages.map((page) => (
                    <button
                        key={page}
                        type="button"
                        className={`pm-pagination__btn ${page === currentPage ? 'pm-pagination__btn--active' : ''}`}
                        onClick={() => onPageChange(page)}
                    >
                        {page}
                    </button>
                ))}
                <button
                    type="button"
                    className="pm-pagination__btn pm-pagination__btn--nav"
                    disabled={currentPage >= totalPages}
                    onClick={() => onPageChange(currentPage + 1)}
                >
                    {'>'}
                </button>
                <ElSelect
                    className="el-select--compact"
                    value={pageSize}
                    options={PAGE_SIZE_OPTIONS}
                    onChange={(value) => {
                        onPageSizeChange(value);
                        onPageChange(1);
                    }}
                    dropdownAlign="right"
                    dropdownDirection="up"
                    usePortal
                />
                <label className="pm-pagination__jump">
                    跳至
                    <input
                        type="text"
                        className="pm-pagination__jump-input"
                        value={jumpPage}
                        onChange={(event) => onJumpPageChange(event.target.value)}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter') handleJump();
                        }}
                    />
                    页
                </label>
            </div>
        </div>
    );
}
