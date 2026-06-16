import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Search } from 'lucide-react';
import ElSelect from './ElSelect';
import ListPagination from './ListPagination';
import {
    UPGRADE_DEVICE_SEARCH_FIELD_OPTIONS,
    UPGRADE_DEVICE_STATUS_OPTIONS,
    createMockDeviceDetailsForBatch,
    type UpgradeDeviceDetailRecord,
    type UpgradeTaskBatchRecord,
} from '../data/remoteUpgrade';
import { paginateItems } from '../utils/listPagination';
import '../device-create.css';
import '../product-create.css';
import '../remote-upgrade.css';

type UpgradeDeviceDetailDrawerProps = {
    open: boolean;
    batch: UpgradeTaskBatchRecord | null;
    deviceDetails: UpgradeDeviceDetailRecord[];
    onClose: () => void;
};

export default function UpgradeDeviceDetailDrawer({
    open,
    batch,
    deviceDetails,
    onClose,
}: UpgradeDeviceDetailDrawerProps) {
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchField, setSearchField] = useState('name');
    const [draftKeyword, setDraftKeyword] = useState('');
    const [keyword, setKeyword] = useState('');
    const [pageSize, setPageSize] = useState('10');
    const [currentPage, setCurrentPage] = useState(1);
    const [jumpPage, setJumpPage] = useState('1');

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
        setStatusFilter('all');
        setSearchField('name');
        setDraftKeyword('');
        setKeyword('');
        setPageSize('10');
        setCurrentPage(1);
        setJumpPage('1');
    }, [open, batch?.id]);

    const batchDevices = useMemo(() => {
        if (!batch) return [];
        const stored = deviceDetails.filter((item) => item.batchId === batch.id);
        if (stored.length) return stored;
        return createMockDeviceDetailsForBatch(batch, Math.max(batch.deviceCount, 10));
    }, [batch, deviceDetails]);

    const filteredDevices = useMemo(() => {
        const normalized = keyword.trim().toLowerCase();
        return batchDevices.filter((item) => {
            const statusMatch = statusFilter === 'all' || item.status === statusFilter;
            if (!statusMatch) return false;
            if (!normalized) return true;
            const fieldValue = searchField === 'code' ? item.deviceCode : item.deviceName;
            return fieldValue.toLowerCase().includes(normalized);
        });
    }, [batchDevices, keyword, searchField, statusFilter]);

    const pagination = useMemo(
        () => paginateItems(filteredDevices, currentPage, Number(pageSize)),
        [filteredDevices, currentPage, pageSize],
    );

    useEffect(() => {
        setCurrentPage(1);
        setJumpPage('1');
    }, [keyword, searchField, statusFilter, pageSize]);

    useEffect(() => {
        setJumpPage(String(pagination.currentPage));
    }, [pagination.currentPage]);

    if (!open || !batch) return null;

    const handleMaskMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
        if (event.target === event.currentTarget) {
            onClose();
        }
    };

    return createPortal(
        <div className="pcp-drawer-mask ru-drawer-mask" role="presentation" onMouseDown={handleMaskMouseDown}>
            <aside
                className="pcp-drawer ru-device-detail-drawer"
                role="dialog"
                aria-modal="true"
                aria-labelledby="ru-device-detail-title"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <div className="pcp-drawer__head">
                    <h3 id="ru-device-detail-title">设备升级详情</h3>
                    <button type="button" className="pcp-drawer__close" onClick={onClose} aria-label="关闭">×</button>
                </div>

                <div className="pcp-drawer__body ru-device-detail-body">
                    <div className="ru-device-detail-filter">
                        <ElSelect
                            className="el-select--medium ru-device-status-select"
                            size="medium"
                            value={statusFilter}
                            options={UPGRADE_DEVICE_STATUS_OPTIONS}
                            onChange={setStatusFilter}
                        />
                        <div className="ru-search-input-group">
                            <ElSelect
                                key={searchField}
                                className="el-select--medium ru-search-field-select"
                                size="medium"
                                value={searchField}
                                options={UPGRADE_DEVICE_SEARCH_FIELD_OPTIONS}
                                onChange={setSearchField}
                            />
                            <input
                                type="text"
                                className="pm-filter-input ru-search-keyword-input"
                                placeholder="请输入搜索内容"
                                value={draftKeyword}
                                onChange={(event) => setDraftKeyword(event.target.value)}
                            />
                        </div>
                        <button
                            type="button"
                            className="pm-btn pm-btn-primary"
                            onClick={() => {
                                setKeyword(draftKeyword);
                                setCurrentPage(1);
                                setJumpPage('1');
                            }}
                        >
                            <Search size={14} />
                            查询
                        </button>
                    </div>

                    <div className="pm-table-wrap ru-device-detail-table-wrap">
                        <table className="pm-table">
                            <thead>
                                <tr>
                                    <th>序号</th>
                                    <th>设备名称</th>
                                    <th>设备编号</th>
                                    <th>升级方式</th>
                                    <th>升级状态</th>
                                    <th>更新时间</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pagination.items.map((record, index) => (
                                    <tr key={record.id}>
                                        <td>{(pagination.currentPage - 1) * Number(pageSize) + index + 1}</td>
                                        <td>{record.deviceName}</td>
                                        <td>{record.deviceCode}</td>
                                        <td>{record.scheduleType}</td>
                                        <td>{record.status}</td>
                                        <td>{record.updatedAt}</td>
                                    </tr>
                                ))}
                                {!pagination.items.length && (
                                    <tr>
                                        <td colSpan={6} className="pc-empty-cell">暂无设备升级记录</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <ListPagination
                        total={pagination.total}
                        currentPage={pagination.currentPage}
                        totalPages={pagination.totalPages}
                        pageSize={pageSize}
                        jumpPage={jumpPage}
                        onPageChange={setCurrentPage}
                        onPageSizeChange={setPageSize}
                        onJumpPageChange={setJumpPage}
                    />
                </div>
            </aside>
        </div>,
        document.body,
    );
}
