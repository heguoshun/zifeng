import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import AppShell from '../components/AppShell';
import SystemManagementSidebar, { type SystemManagementPageId } from '../components/SystemManagementSidebar';
import ListPagination from '../components/ListPagination';
import { ConfirmDialog } from '../components/IotDialogs';
import IotToast, { type IotToastData, type IotToastType, triggerIotToast } from '../components/IotToast';
import ParamFormDrawer, { type ParamFormValue } from '../components/ParamFormDrawer';
import ElSelect from '../components/ElSelect';
import {
    type SystemParamRecord,
    generateParamId,
    createInitialParams,
} from '../data/systemParams';
import { paginateItems } from '../utils/listPagination';
import '../device-access.css';
import '../product-management.css';
import '../tenant-management.css';
import '../param-management.css';
import ClearableInput from '../components/ClearableInput';

type ParamFormMode = 'add' | 'edit' | null;

const SYSTEM_BUILT_IN_OPTIONS = [
    { label: '全部', value: '' },
    { label: '是', value: 'true' },
    { label: '否', value: 'false' },
];

// ── Parameter Management Page ──

export type ParamManagementPageProps = {
    params: SystemParamRecord[];
    onUpdateParams: React.Dispatch<React.SetStateAction<SystemParamRecord[]>>;
    onNavigateHome: () => void;
    onNavigateDeviceAccess: () => void;
    onNavigateMessageCenter: () => void;
    onNavigate: (pageId: SystemManagementPageId) => void;
};

export default function ParamManagementPage({
    params,
    onUpdateParams,
    onNavigateHome,
    onNavigateDeviceAccess,
    onNavigateMessageCenter,
    onNavigate,
}: ParamManagementPageProps) {
    const [draftName, setDraftName] = useState('');
    const [draftKey, setDraftKey] = useState('');
    const [draftBuiltIn, setDraftBuiltIn] = useState('');
    const [filterName, setFilterName] = useState('');
    const [filterKey, setFilterKey] = useState('');
    const [filterBuiltIn, setFilterBuiltIn] = useState('');
    const [pageSize, setPageSize] = useState('20');
    const [currentPage, setCurrentPage] = useState(1);
    const [jumpPage, setJumpPage] = useState('1');

    const [formMode, setFormMode] = useState<ParamFormMode>(null);
    const [editingParam, setEditingParam] = useState<SystemParamRecord | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<SystemParamRecord | null>(null);
    const [toast, setToast] = useState<IotToastData | null>(null);

    const showToast = (message: string, type: IotToastType = 'warning') => {
        triggerIotToast(setToast, message, type);
    };

    // Filter params
    const filteredParams = useMemo(() => {
        const nameQ = filterName.trim().toLowerCase();
        const keyQ = filterKey.trim().toLowerCase();
        const builtInFilter = filterBuiltIn;
        return params.filter((p) => {
            const matchName = !nameQ || p.name.toLowerCase().includes(nameQ);
            const matchKey = !keyQ || p.key.toLowerCase().includes(keyQ);
            const matchBuiltIn = !builtInFilter || String(p.isSystemBuiltIn) === builtInFilter;
            return matchName && matchKey && matchBuiltIn;
        });
    }, [params, filterName, filterKey, filterBuiltIn]);

    const pagination = useMemo(
        () => paginateItems(filteredParams, currentPage, Number(pageSize)),
        [filteredParams, currentPage, pageSize],
    );

    useEffect(() => {
        setCurrentPage(1);
        setJumpPage('1');
    }, [filterName, filterKey, filterBuiltIn, pageSize]);

    useEffect(() => {
        setJumpPage(String(pagination.currentPage));
    }, [pagination.currentPage]);

    // ── Search ──
    const handleSearch = () => {
        setFilterName(draftName.trim());
        setFilterKey(draftKey.trim());
        setFilterBuiltIn(draftBuiltIn);
    };

    const handleReset = () => {
        setDraftName('');
        setDraftKey('');
        setDraftBuiltIn('');
        setFilterName('');
        setFilterKey('');
        setFilterBuiltIn('');
        setCurrentPage(1);
        setJumpPage('1');
    };

    // ── CRUD ──
    const openAddDrawer = () => {
        setEditingParam(null);
        setFormMode('add');
    };

    const openEditDrawer = (param: SystemParamRecord) => {
        setEditingParam(param);
        setFormMode('edit');
    };

    const closeFormDrawer = () => {
        setFormMode(null);
        setEditingParam(null);
    };

    const handleSubmit = (value: ParamFormValue) => {
        if (formMode === 'add') {
            const now = new Date();
            const pad = (n: number) => String(n).padStart(2, '0');
            const createdAt = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
            const next: SystemParamRecord = {
                id: generateParamId(params.map((p) => p.id)),
                name: value.name,
                key: value.key,
                value: value.value,
                isSystemBuiltIn: value.isSystemBuiltIn,
                remark: value.remark,
                createdAt,
            };
            onUpdateParams((prev) => [next, ...prev]);
            showToast('参数新增成功', 'success');
            closeFormDrawer();
            return;
        }

        if (formMode === 'edit' && editingParam) {
            onUpdateParams((prev) =>
                prev.map((p) =>
                    p.id === editingParam.id
                        ? {
                            ...p,
                            name: value.name,
                            value: value.value,
                            isSystemBuiltIn: value.isSystemBuiltIn,
                            remark: value.remark,
                        }
                        : p,
                ),
            );
            showToast('参数保存成功', 'success');
            closeFormDrawer();
        }
    };

    const handleDelete = () => {
        if (!deleteTarget) return;
        onUpdateParams((prev) => prev.filter((p) => p.id !== deleteTarget.id));
        showToast('参数已删除', 'success');
        setDeleteTarget(null);
    };

    const handleRefreshCache = () => {
        showToast('缓存刷新成功', 'success');
    };

    // ── Sidebar ──
    const sidebar = (
        <SystemManagementSidebar
            pageId="param-mgmt"
            onNavigate={onNavigate}
            onUnavailable={(label) => showToast(`${label}功能开发中`)}
        />
    );

    // ── Render ──
    return (
        <AppShell
            activeTopTab="系统管理"
            sidebar={sidebar}
            onNavigateMessageCenter={onNavigateMessageCenter}
            onNavigateSystemManagement={() => onNavigate('param-mgmt')}
            onTopTabChange={(tab) => {
                if (tab === '设备接入') onNavigateDeviceAccess();
                if (tab === '消息中心') onNavigateMessageCenter();
            }}
        >
            <div className="sp-page">
                <div className="crumb">系统管理 / 参数管理</div>

                {/* ── Filter ── */}
                <section className="panel sp-filter-panel">
                    <div className="sp-filter-row">
                        <div className="pm-filter-field">
                            <span className="pm-filter-label">参数名称</span>
                            <ClearableInput
                                type="text"
                                className="pm-filter-input"
                                placeholder="请输入参数名称"
                                value={draftName}
                                onChange={(e) => setDraftName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSearch();
                                }}
                            />
                        </div>
                        <div className="pm-filter-field">
                            <span className="pm-filter-label">参数键名</span>
                            <ClearableInput
                                type="text"
                                className="pm-filter-input"
                                placeholder="请输入参数键名"
                                value={draftKey}
                                onChange={(e) => setDraftKey(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSearch();
                                }}
                            />
                        </div>
                        <div className="pm-filter-field">
                            <span className="pm-filter-label">系统内置</span>
                            <ElSelect
                                className="el-select--medium"
                                size="medium"
                                value={draftBuiltIn}
                                placeholder="请选择系统内置"
                                options={SYSTEM_BUILT_IN_OPTIONS}
                                onChange={setDraftBuiltIn}
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

                {/* ── Table ── */}
                <section className="panel sp-table-panel">
                    <div className="sp-table-head">
                        <h3>参数列表</h3>
                        <div className="sp-table-head-actions">
                            <button type="button" className="pm-btn pm-btn-primary" onClick={openAddDrawer}>
                                <Plus size={14} />
                                新增
                            </button>
                            <button type="button" className="pm-btn pm-btn-ghost" onClick={handleRefreshCache}>
                                刷新缓存
                            </button>
                        </div>
                    </div>

                    <div className="sp-table-wrap">
                        <table className="sp-table">
                            <thead>
                                <tr>
                                    <th style={{ width: 72 }}>参数主键</th>
                                    <th>参数名称</th>
                                    <th>参数键名</th>
                                    <th>参数值</th>
                                    <th style={{ width: 80 }}>系统内置</th>
                                    <th>备注</th>
                                    <th style={{ width: 160 }}>创建时间</th>
                                    <th style={{ width: 120 }}>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pagination.items.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px 12px' }}>
                                            暂无数据
                                        </td>
                                    </tr>
                                ) : (
                                    pagination.items.map((param) => (
                                        <tr key={param.id}>
                                            <td>{param.id}</td>
                                            <td title={param.name}>{param.name}</td>
                                            <td title={param.key}>{param.key}</td>
                                            <td>{param.value}</td>
                                            <td>{param.isSystemBuiltIn ? '是' : '否'}</td>
                                            <td title={param.remark}>{param.remark || '—'}</td>
                                            <td>{param.createdAt}</td>
                                            <td>
                                                <div className="sp-table-actions">
                                                    <button type="button" onClick={() => openEditDrawer(param)}>
                                                        编辑
                                                    </button>
                                                    <button type="button" onClick={() => setDeleteTarget(param)}>
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

            {/* ── Form Drawer (add/edit) ── */}
            <ParamFormDrawer
                open={formMode !== null}
                mode={formMode === 'edit' ? 'edit' : 'add'}
                initialValue={editingParam ?? undefined}
                onClose={closeFormDrawer}
                onSubmit={handleSubmit}
            />

            {/* ── Delete Confirm ── */}
            {deleteTarget ? (
                <ConfirmDialog
                    title="删除参数"
                    message={`确定删除参数"${deleteTarget.name}"吗？删除后不可恢复。`}
                    onClose={() => setDeleteTarget(null)}
                    onConfirm={handleDelete}
                />
            ) : null}

            {/* ── Toast ── */}
            <IotToast toast={toast} />
        </AppShell>
    );
}

export { createInitialParams };
