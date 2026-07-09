import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Search, Upload } from 'lucide-react';
import ElDateRangePicker from './ElDateRangePicker';
import ListPagination from './ListPagination';
import IotToast, { type IotToastData, type IotToastType, triggerIotToast } from './IotToast';
import type { DebugPropertyField } from '../data/deviceDebugging';
import {
    buildPropertyHistoryRecords,
    filterPropertyHistoryRecords,
    getDefaultPropertyDateRange,
    type PropertyDateRange,
} from '../data/devicePropertyData';
import { paginateItems, DEFAULT_LIST_PAGE_SIZE } from '../utils/listPagination';
import '../product-create.css';
import '../product-management.css';

type DevicePropertyHistoryDrawerProps = {
    open: boolean;
    field: DebugPropertyField | null;
    deviceKey: string;
    onClose: () => void;
};

export default function DevicePropertyHistoryDrawer({
    open,
    field,
    deviceKey,
    onClose,
}: DevicePropertyHistoryDrawerProps) {
    const defaultRange = useMemo(() => getDefaultPropertyDateRange(), []);
    const [draftRange, setDraftRange] = useState<PropertyDateRange>(defaultRange);
    const [range, setRange] = useState<PropertyDateRange>(defaultRange);
    const [pageSize, setPageSize] = useState('20');
    const [currentPage, setCurrentPage] = useState(1);
    const [jumpPage, setJumpPage] = useState('1');
    const [toast, setToast] = useState<IotToastData | null>(null);

    useEffect(() => {
        if (!open) return undefined;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const nextRange = getDefaultPropertyDateRange();
        setDraftRange(nextRange);
        setRange(nextRange);
        setCurrentPage(1);
        setJumpPage('1');
    }, [open, field?.id]);

    const records = useMemo(() => {
        if (!field || !deviceKey) return [];
        const allRecords = buildPropertyHistoryRecords(field, deviceKey, range);
        return filterPropertyHistoryRecords(allRecords, range);
    }, [field, deviceKey, range]);

    const pagination = useMemo(
        () => paginateItems(records, currentPage, Number(pageSize) || 10),
        [records, currentPage, pageSize],
    );

    useEffect(() => {
        setCurrentPage((prev) => Math.min(prev, pagination.totalPages));
        setJumpPage(String(Math.min(currentPage, pagination.totalPages)));
    }, [pagination.totalPages, currentPage]);

    const showToast = (message: string, type: IotToastType = 'success') => {
        triggerIotToast(setToast, message, type);
    };

    if (!open || !field) return null;

    const handleMaskMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
        if (event.target === event.currentTarget) {
            onClose();
        }
    };

    return createPortal(
        <>
            <div className="pcp-drawer-mask" role="presentation" onMouseDown={handleMaskMouseDown}>
                <aside
                    className="pcp-drawer dcp-prop-drawer"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="dcp-prop-history-title"
                    onMouseDown={(event) => event.stopPropagation()}
                >
                    <div className="pcp-drawer__head">
                        <h3 id="dcp-prop-history-title">{field.name} - 历史数据</h3>
                        <button type="button" className="pcp-drawer__close" onClick={onClose} aria-label="关闭">
                            ×
                        </button>
                    </div>
                    <div className="pcp-drawer__body dcp-prop-drawer__body">
                        <div className="dcp-prop-drawer-filter">
                            <div className="dcp-prop-drawer-filter__field">
                                <span>时间范围</span>
                                <ElDateRangePicker
                                    size="medium"
                                    start={draftRange.start}
                                    end={draftRange.end}
                                    onChange={(nextRange) => setDraftRange(nextRange)}
                                />
                            </div>
                            <div className="dcp-prop-drawer-filter__actions">
                                <button
                                    type="button"
                                    className="pm-btn pm-btn-primary"
                                    onClick={() => {
                                        setRange(draftRange);
                                        setCurrentPage(1);
                                        setJumpPage('1');
                                    }}
                                >
                                    <Search size={14} />
                                    查询
                                </button>
                                <button
                                    type="button"
                                    className="pm-btn pm-btn-ghost"
                                    onClick={() => {
                                        const nextRange = getDefaultPropertyDateRange();
                                        setDraftRange(nextRange);
                                        setRange(nextRange);
                                        setCurrentPage(1);
                                        setJumpPage('1');
                                    }}
                                >
                                    重置
                                </button>
                            </div>
                        </div>

                        <div className="dcp-prop-history-toolbar">
                            <button
                                type="button"
                                className="pm-btn pm-btn-ghost dcp-prop-history-export"
                                onClick={() => showToast('历史数据导出成功', 'success')}
                            >
                                <Upload size={14} />
                                导出
                            </button>
                        </div>

                        <div className="pm-table-wrap dcp-prop-history-table">
                            <table className="pm-table">
                                <thead>
                                    <tr>
                                        <th>上报时间</th>
                                        <th>属性值</th>
                                        <th>单位</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pagination.items.map((record) => (
                                        <tr key={record.id}>
                                            <td>{record.reportedAt}</td>
                                            <td>{record.value}</td>
                                            <td>{record.unit || '—'}</td>
                                        </tr>
                                    ))}
                                    {!pagination.items.length && (
                                        <tr>
                                            <td colSpan={3} className="pcp-empty-cell">所选时间范围内暂无数据</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {records.length > 0 && (
                            <div className="dcp-prop-history-pagination">
                                <ListPagination
                                    total={pagination.total}
                                    currentPage={pagination.currentPage}
                                    totalPages={pagination.totalPages}
                                    pageSize={pageSize}
                                    jumpPage={jumpPage}
                                    onPageChange={(page) => {
                                        setCurrentPage(page);
                                        setJumpPage(String(page));
                                    }}
                                    onPageSizeChange={(value) => {
                                        setPageSize(value);
                                        setCurrentPage(1);
                                        setJumpPage('1');
                                    }}
                                    onJumpPageChange={setJumpPage}
                                />
                            </div>
                        )}
                    </div>
                </aside>
            </div>
            <IotToast toast={toast} />
        </>,
        document.body,
    );
}
