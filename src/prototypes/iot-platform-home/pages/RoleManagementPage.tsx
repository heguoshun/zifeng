import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import AppShell from '../components/AppShell';
import Breadcrumb from '../components/Breadcrumb';
import SystemManagementSidebar, { type SystemManagementPageId } from '../components/SystemManagementSidebar';
import ListPagination from '../components/ListPagination';
import { ConfirmDialog } from '../components/IotDialogs';
import IotToast, { type IotToastData, type IotToastType, triggerIotToast } from '../components/IotToast';
import RoleFormDrawer, { type RoleFormValue } from '../components/RoleFormDrawer';
import {
    createInitialRoles,
    formatAlarmRuleScopeSummary,
    generateRoleCode,
    generateRoleId,
    formatRoleNow,
    type SystemRoleRecord,
} from '../data/systemRoles';
import { type TenantRecord } from '../data/tenants';
import { paginateItems, DEFAULT_LIST_PAGE_SIZE } from '../utils/listPagination';
import '../device-access.css';
import '../product-management.css';
import '../tenant-management.css';
import '../role-management.css';
import ClearableInput from '../components/ClearableInput';

type RoleFormMode = 'add' | 'edit' | null;

// ── Role Management Page ──

export type RoleManagementPageProps = {
    roles: SystemRoleRecord[];
    tenants: TenantRecord[];
    onUpdateRoles: React.Dispatch<React.SetStateAction<SystemRoleRecord[]>>;
    onNavigateHome: () => void;
    onNavigateDeviceAccess: () => void;
    onNavigateMessageCenter: () => void;
    onNavigate: (pageId: SystemManagementPageId) => void;
};

export default function RoleManagementPage({
    roles,
    tenants,
    onUpdateRoles,
    onNavigateHome,
    onNavigateDeviceAccess,
    onNavigateMessageCenter,
    onNavigate,
}: RoleManagementPageProps) {
    const [draftKeyword, setDraftKeyword] = useState('');
    const [keyword, setKeyword] = useState('');
    const [pageSize, setPageSize] = useState('20');
    const [currentPage, setCurrentPage] = useState(1);
    const [jumpPage, setJumpPage] = useState('1');
    const [formMode, setFormMode] = useState<RoleFormMode>(null);
    const [editingRole, setEditingRole] = useState<SystemRoleRecord | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<SystemRoleRecord | null>(null);
    const [toast, setToast] = useState<IotToastData | null>(null);

    const showToast = (message: string, type: IotToastType = 'warning') => {
        triggerIotToast(setToast, message, type);
    };

    // Build a tenant lookup map
    const tenantMap = useMemo(() => {
        const map = new Map<string, string>();
        tenants.forEach((t) => map.set(t.id, t.name));
        return map;
    }, [tenants]);

    // Filter roles by keyword (match role name)
    const filteredRoles = useMemo(() => {
        const q = keyword.trim().toLowerCase();
        if (!q) return roles;
        return roles.filter((r) => r.name.toLowerCase().includes(q));
    }, [roles, keyword]);

    const pagination = useMemo(
        () => paginateItems(filteredRoles, currentPage, Number(pageSize)),
        [filteredRoles, currentPage, pageSize],
    );

    useEffect(() => {
        setCurrentPage(1);
        setJumpPage('1');
    }, [keyword, pageSize]);

    useEffect(() => {
        setJumpPage(String(pagination.currentPage));
    }, [pagination.currentPage]);

    // ── Search ──
    const handleSearch = () => {
        setKeyword(draftKeyword.trim());
    };

    const handleReset = () => {
        setDraftKeyword('');
        setKeyword('');
        setCurrentPage(1);
        setJumpPage('1');
    };

    // ── CRUD ──
    const openAddDrawer = () => {
        setEditingRole(null);
        setFormMode('add');
    };

    const openEditDrawer = (role: SystemRoleRecord) => {
        setEditingRole(role);
        setFormMode('edit');
    };

    const closeFormDrawer = () => {
        setFormMode(null);
        setEditingRole(null);
    };

    const handleSubmit = (value: RoleFormValue) => {
        if (formMode === 'add') {
            const next: SystemRoleRecord = {
                id: generateRoleId(),
                tenantId: value.tenantId,
                name: value.name,
                roleCode: generateRoleCode(),
                createdAt: formatRoleNow(),
                authorizedPermissionIds: value.permissionIds,
                alarmRuleCategoryScopes: value.alarmRuleCategoryScopes.length
                    ? value.alarmRuleCategoryScopes
                    : undefined,
            };
            onUpdateRoles((prev) => [next, ...prev]);
            showToast('角色新增成功', 'success');
            closeFormDrawer();
            return;
        }

        if (formMode === 'edit' && editingRole) {
            onUpdateRoles((prev) =>
                prev.map((r) =>
                    r.id === editingRole.id
                        ? {
                            ...r,
                            name: value.name,
                            tenantId: value.tenantId,
                            authorizedPermissionIds: value.permissionIds,
                            alarmRuleCategoryScopes: r.isTenantAdmin
                                ? undefined
                                : (value.alarmRuleCategoryScopes.length
                                    ? value.alarmRuleCategoryScopes
                                    : undefined),
                        }
                        : r,
                ),
            );
            showToast('角色保存成功', 'success');
            closeFormDrawer();
        }
    };

    const handleDelete = () => {
        if (!deleteTarget) return;
        onUpdateRoles((prev) => prev.filter((r) => r.id !== deleteTarget.id));
        showToast('角色已删除', 'success');
        setDeleteTarget(null);
    };

    // ── Sidebar ──
    const sidebar = (
        <SystemManagementSidebar
            pageId="role-mgmt"
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
            onNavigateSystemManagement={() => onNavigate('role-mgmt')}
            onTopTabChange={(tab) => {
                if (tab === '设备接入') onNavigateDeviceAccess();
                if (tab === '消息中心') onNavigateMessageCenter();
            }}
        >
            <div className="rm-page">
                <Breadcrumb items={[
                                    { label: '系统管理', pageId: 'tenant-mgmt' },
                                    { label: '角色管理' },
                                ]} onNavigate={(id) => onNavigate(id as SystemManagementPageId)} />

                {/* ── Filter ── */}
                <section className="panel rm-filter-panel">
                    <div className="rm-filter-row">
                        <div className="pm-filter-field">
                            <span className="pm-filter-label">角色名称</span>
                            <ClearableInput
                                type="text"
                                className="pm-filter-input"
                                placeholder="请输入角色名称"
                                value={draftKeyword}
                                onChange={(e) => setDraftKeyword(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSearch();
                                }}
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
                <section className="panel rm-table-panel">
                    <div className="rm-table-head">
                        <h3>角色列表</h3>
                        <button type="button" className="pm-btn pm-btn-primary" onClick={openAddDrawer}>
                            <Plus size={14} />
                            新建角色
                        </button>
                    </div>

                    <div className="rm-table-wrap">
                        <table className="rm-table">
                            <thead>
                                <tr>
                                    <th style={{ width: 64 }}>序号</th>
                                    <th>所属租户</th>
                                    <th>角色编号</th>
                                    <th>角色名称</th>
                                    <th>数据域</th>
                                    <th>角色说明</th>
                                    <th>创建时间</th>
                                    <th style={{ width: 140 }}>操作</th>
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
                                    pagination.items.map((role, idx) => {
                                        const serial = (pagination.currentPage - 1) * Number(pageSize) + idx + 1;
                                        const tenantName = tenantMap.get(role.tenantId) ?? '—';
                                        return (
                                            <tr key={role.id}>
                                                <td>{serial}</td>
                                                <td>{tenantName}</td>
                                                <td>{role.roleCode}</td>
                                                <td>{role.name}</td>
                                                <td>{formatAlarmRuleScopeSummary(role.alarmRuleCategoryScopes, { isTenantAdmin: role.isTenantAdmin })}</td>
                                                <td title={role.remark}>{role.remark ?? '—'}</td>
                                                <td>{role.createdAt}</td>
                                                <td>
                                                    <div className="rm-table-actions">
                                                        <button type="button" onClick={() => openEditDrawer(role)}>
                                                            编辑
                                                        </button>
                                                        <button type="button" onClick={() => setDeleteTarget(role)}>
                                                            删除
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
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

            {/* ── Form Drawer ── */}
            <RoleFormDrawer
                open={formMode !== null}
                mode={formMode === 'edit' ? 'edit' : 'add'}
                tenants={tenants}
                initialValue={editingRole ?? undefined}
                onClose={closeFormDrawer}
                onSubmit={handleSubmit}
            />

            {/* ── Delete Confirm ── */}
            {deleteTarget ? (
                <ConfirmDialog
                    title="删除角色"
                    message={`确定删除角色"${deleteTarget.name}"吗？删除后不可恢复。`}
                    onClose={() => setDeleteTarget(null)}
                    onConfirm={handleDelete}
                />
            ) : null}

            {/* ── Toast ── */}
            <IotToast toast={toast} />
        </AppShell>
    );
}

export { createInitialRoles };
