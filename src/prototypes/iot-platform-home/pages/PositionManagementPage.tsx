import React, { useEffect, useMemo, useState } from 'react';
import { Download, Plus, Search } from 'lucide-react';
import AppShell from '../components/AppShell';
import SystemManagementSidebar, { type SystemManagementPageId } from '../components/SystemManagementSidebar';
import ListPagination from '../components/ListPagination';
import PositionFormDrawer, { toPositionFormValue, type PositionFormValue } from '../components/PositionFormDrawer';
import ElSelect from '../components/ElSelect';
import { ConfirmDialog } from '../components/IotDialogs';
import IotToast, { type IotToastData, type IotToastType, triggerIotToast } from '../components/IotToast';
import {
    filterPositions,
    formatPositionNow,
    generatePositionId,
    SYSTEM_POSITION_STATUS_OPTIONS,
    type SystemPositionRecord,
} from '../data/systemPositions';
import { paginateItems, DEFAULT_LIST_PAGE_SIZE } from '../utils/listPagination';
import '../device-access.css';
import '../product-management.css';
import '../position-management.css';
import ClearableInput from '../components/ClearableInput';

type DrawerMode = 'add' | 'edit' | null;

type PositionManagementPageProps = {
    positions: SystemPositionRecord[];
    onUpdatePositions: React.Dispatch<React.SetStateAction<SystemPositionRecord[]>>;
    onNavigateHome: () => void;
    onNavigateDeviceAccess: () => void;
    onNavigateMessageCenter: () => void;
    onNavigate: (pageId: SystemManagementPageId) => void;
};

function StatusTag({ status }: { status: SystemPositionRecord['status'] }) {
    const cls = status === '正常' ? 'pos-status-tag--normal' : 'pos-status-tag--disabled';
    return <span className={`pos-status-tag ${cls}`}>{status}</span>;
}

export default function PositionManagementPage({
    positions,
    onUpdatePositions,
    onNavigateHome,
    onNavigateDeviceAccess,
    onNavigateMessageCenter,
    onNavigate,
}: PositionManagementPageProps) {
    // Filter state
    const [draftCode, setDraftCode] = useState('');
    const [draftName, setDraftName] = useState('');
    const [draftStatus, setDraftStatus] = useState('全部');
    const [appliedCode, setAppliedCode] = useState('');
    const [appliedName, setAppliedName] = useState('');
    const [appliedStatus, setAppliedStatus] = useState('全部');

    // Pagination
    const [pageSize, setPageSize] = useState('20');
    const [currentPage, setCurrentPage] = useState(1);
    const [jumpPage, setJumpPage] = useState('1');

    // Drawer & dialogs
    const [drawerMode, setDrawerMode] = useState<DrawerMode>(null);
    const [editingPosition, setEditingPosition] = useState<SystemPositionRecord | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<SystemPositionRecord | null>(null);
    const [toast, setToast] = useState<IotToastData | null>(null);

    const showToast = (message: string, type: IotToastType = 'warning') => {
        triggerIotToast(setToast, message, type);
    };

    const filtered = useMemo(
        () => filterPositions(positions, appliedCode, appliedName, appliedStatus),
        [positions, appliedCode, appliedName, appliedStatus],
    );

    const pagination = useMemo(
        () => paginateItems(filtered, currentPage, Number(pageSize)),
        [filtered, currentPage, pageSize],
    );

    useEffect(() => {
        setCurrentPage(1);
        setJumpPage('1');
    }, [appliedCode, appliedName, appliedStatus, pageSize]);

    useEffect(() => {
        setJumpPage(String(pagination.currentPage));
    }, [pagination.currentPage]);

    const handleSearch = () => {
        setAppliedCode(draftCode.trim());
        setAppliedName(draftName.trim());
        setAppliedStatus(draftStatus);
        setCurrentPage(1);
        setJumpPage('1');
    };

    const handleReset = () => {
        setDraftCode('');
        setDraftName('');
        setDraftStatus('全部');
        setAppliedCode('');
        setAppliedName('');
        setAppliedStatus('全部');
        setCurrentPage(1);
        setJumpPage('1');
    };

    const openAddDrawer = () => {
        setEditingPosition(null);
        setDrawerMode('add');
    };

    const openEditDrawer = (position: SystemPositionRecord) => {
        setEditingPosition(position);
        setDrawerMode('edit');
    };

    const closeFormDrawer = () => {
        setDrawerMode(null);
        setEditingPosition(null);
    };

    const handleSubmit = (value: PositionFormValue) => {
        if (drawerMode === 'add') {
            const next: SystemPositionRecord = {
                id: generatePositionId(),
                positionCode: value.positionCode,
                name: value.name,
                sort: Number(value.sort) || 0,
                status: value.status,
                createdAt: formatPositionNow(),
            };
            onUpdatePositions((prev) => [...prev, next]);
            showToast('岗位新增成功', 'success');
            closeFormDrawer();
            return;
        }

        if (drawerMode === 'edit' && editingPosition) {
            onUpdatePositions((prev) => prev.map((item) =>
                item.id === editingPosition.id
                    ? {
                        ...item,
                        positionCode: value.positionCode,
                        name: value.name,
                        sort: Number(value.sort) || 0,
                        status: value.status,
                    }
                    : item,
            ));
            showToast('岗位保存成功', 'success');
            closeFormDrawer();
        }
    };

    const handleDelete = () => {
        if (!deleteTarget) return;
        onUpdatePositions((prev) => prev.filter((item) => item.id !== deleteTarget.id));
        showToast('岗位已删除', 'success');
        setDeleteTarget(null);
    };

    const handleExport = () => {
        showToast('导出功能开发中');
    };

    const sidebar = (
        <SystemManagementSidebar
            pageId="position-mgmt"
            onNavigate={onNavigate}
            onUnavailable={(label) => showToast(`${label}功能开发中`)}
        />
    );

    const STATUS_FILTER_OPTIONS = SYSTEM_POSITION_STATUS_OPTIONS.map((s) => ({ label: s, value: s }));

    return (
        <AppShell
            activeTopTab="系统管理"
            sidebar={sidebar}
            onNavigateMessageCenter={onNavigateMessageCenter}
            onNavigateSystemManagement={() => onNavigate('position-mgmt')}
            onTopTabChange={(tab) => {
                if (tab === '设备接入') onNavigateDeviceAccess();
                if (tab === '消息中心') onNavigateMessageCenter();
            }}
        >
            <div className="pos-page">
                <div className="crumb">系统管理 / 岗位管理</div>

                <section className="panel pos-filter-panel">
                    <div className="pos-filter-row">
                        <div className="pm-filter-field">
                            <span className="pm-filter-label">岗位编码</span>
                            <ClearableInput
                                type="text"
                                className="pm-filter-input"
                                placeholder="请输入岗位编码"
                                value={draftCode}
                                onChange={(event) => setDraftCode(event.target.value)}
                            />
                        </div>
                        <div className="pm-filter-field">
                            <span className="pm-filter-label">岗位名称</span>
                            <ClearableInput
                                type="text"
                                className="pm-filter-input"
                                placeholder="请输入岗位名称"
                                value={draftName}
                                onChange={(event) => setDraftName(event.target.value)}
                            />
                        </div>
                        <div className="pm-filter-field">
                            <span className="pm-filter-label">岗位状态</span>
                            <ElSelect
                                className="el-select--medium"
                                size="medium"
                                value={draftStatus}
                                options={STATUS_FILTER_OPTIONS}
                                onChange={(value) => setDraftStatus(value)}
                            />
                        </div>
                        <div className="pm-filter-actions">
                            <button type="button" className="pm-btn pm-btn-primary" onClick={handleSearch}>
                                <Search size={14} />
                                查询
                            </button>
                            <button type="button" className="pm-btn pm-btn-ghost" onClick={handleReset}>
                                重置
                            </button>
                        </div>
                    </div>
                </section>

                <section className="panel pos-table-panel">
                    <div className="pos-table-head">
                        <h3>岗位列表</h3>
                        <div className="pos-table-head-actions">
                            <button type="button" className="pm-btn pm-btn-primary" onClick={openAddDrawer}>
                                <Plus size={14} />
                                新增
                            </button>
                            <button type="button" className="pm-btn pm-btn-ghost" onClick={handleExport}>
                                <Download size={14} />
                                导出
                            </button>
                        </div>
                    </div>

                    <div className="pos-table-wrap">
                        <table className="pos-table">
                            <thead>
                                <tr>
                                    <th>岗位编号</th>
                                    <th>岗位编码</th>
                                    <th>岗位名称</th>
                                    <th>岗位排序</th>
                                    <th>状态</th>
                                    <th>创建时间</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pagination.items.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                                            暂无数据
                                        </td>
                                    </tr>
                                ) : (
                                    pagination.items.map((item) => (
                                        <tr key={item.id}>
                                            <td>{item.id}</td>
                                            <td>{item.positionCode}</td>
                                            <td>{item.name}</td>
                                            <td>{item.sort}</td>
                                            <td><StatusTag status={item.status} /></td>
                                            <td>{item.createdAt}</td>
                                            <td>
                                                <div className="pos-table-actions">
                                                    <button type="button" onClick={() => openEditDrawer(item)}>
                                                        编辑
                                                    </button>
                                                    <button type="button" onClick={() => setDeleteTarget(item)}>
                                                        删除
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
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
                </section>
            </div>

            <PositionFormDrawer
                open={drawerMode !== null}
                mode={drawerMode === 'edit' ? 'edit' : 'add'}
                initialValue={editingPosition ?? undefined}
                onClose={closeFormDrawer}
                onSubmit={handleSubmit}
            />

            {deleteTarget ? (
                <ConfirmDialog
                    title="删除岗位"
                    message={`确定删除岗位「${deleteTarget.name}」吗？`}
                    onClose={() => setDeleteTarget(null)}
                    onConfirm={handleDelete}
                />
            ) : null}

            <IotToast toast={toast} />
        </AppShell>
    );
}
