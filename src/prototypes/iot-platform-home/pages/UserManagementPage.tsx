import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Plus, Search, Upload, UserRound } from 'lucide-react';
import AppShell from '../components/AppShell';
import SystemManagementSidebar, { type SystemManagementPageId } from '../components/SystemManagementSidebar';
import ElSelect from '../components/ElSelect';
import ElTreeSelect from '../components/ElTreeSelect';
import ListPagination from '../components/ListPagination';
import UserFormDrawer, { toUserFormValue, type UserFormValue } from '../components/UserFormDrawer';
import UserDetailDrawer from '../components/UserDetailDrawer';
import UserPasswordDialog from '../components/UserPasswordDialog';
import { ConfirmDialog } from '../components/IotDialogs';
import IotToast, { type IotToastData, type IotToastType, triggerIotToast } from '../components/IotToast';
import { getRoleLabel, getRolesByTenant, isRoleBelongsToTenant, type SystemRoleRecord } from '../data/systemRoles';
import {
    SYSTEM_USER_STATUS_OPTIONS,
    formatSystemUserNow,
    generateSystemUserId,
    type SystemUserRecord,
    type SystemUserStatus,
} from '../data/systemUsers';
import type { TenantRecord } from '../data/tenants';
import { buildTenantSelectTree, buildTenantTreeExpanded } from '../data/tenants';
import { matchesTreeSelection } from '../data/orgHierarchy';
import { paginateItems } from '../utils/listPagination';
import '../device-access.css';
import '../product-management.css';
import '../user-management.css';

type DrawerMode = 'add' | 'edit' | null;

type FilterState = {
    tenantId: string;
    roleId: string;
    status: string;
    keyword: string;
};

const DEFAULT_FILTERS: FilterState = {
    tenantId: 'all',
    roleId: '',
    status: '全部',
    keyword: '',
};

const STATUS_OPTIONS = SYSTEM_USER_STATUS_OPTIONS.map((item) => ({
    label: item,
    value: item,
}));

type UserManagementPageProps = {
    users: SystemUserRecord[];
    tenants: TenantRecord[];
    roles: SystemRoleRecord[];
    onUpdateUsers: React.Dispatch<React.SetStateAction<SystemUserRecord[]>>;
    onNavigateHome: () => void;
    onNavigateDeviceAccess: () => void;
    onNavigateMessageCenter: () => void;
    onNavigateOmManagement: () => void;
    onNavigate: (pageId: SystemManagementPageId) => void;
};

function UserStatusTag({ status }: { status: SystemUserStatus }) {
    const className = status === '正常' ? 'um-status-tag--normal' : 'um-status-tag--frozen';
    return <span className={`um-status-tag ${className}`}>{status}</span>;
}

function resolveTenantName(tenants: TenantRecord[], tenantId: string): string {
    return tenants.find((item) => item.id === tenantId)?.name ?? '—';
}

export default function UserManagementPage({
    users,
    tenants,
    roles,
    onUpdateUsers,
    onNavigateHome,
    onNavigateDeviceAccess,
    onNavigateMessageCenter,
    onNavigateOmManagement,
    onNavigate,
}: UserManagementPageProps) {
    const [draftFilters, setDraftFilters] = useState<FilterState>(DEFAULT_FILTERS);
    const [appliedFilters, setAppliedFilters] = useState<FilterState>(DEFAULT_FILTERS);
    const [pageSize, setPageSize] = useState('10');
    const [currentPage, setCurrentPage] = useState(1);
    const [jumpPage, setJumpPage] = useState('1');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [drawerMode, setDrawerMode] = useState<DrawerMode>(null);
    const [editingUser, setEditingUser] = useState<SystemUserRecord | null>(null);
    const [detailUser, setDetailUser] = useState<SystemUserRecord | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<SystemUserRecord | null>(null);
    const [passwordTarget, setPasswordTarget] = useState<SystemUserRecord | null>(null);
    const [bulkMenuOpen, setBulkMenuOpen] = useState(false);
    const [toast, setToast] = useState<IotToastData | null>(null);
    const bulkMenuRef = useRef<HTMLDivElement>(null);

    const showToast = (message: string, type: IotToastType = 'success') => {
        triggerIotToast(setToast, message, type);
    };

    const tenantTree = useMemo(() => buildTenantSelectTree(tenants), [tenants]);
    const tenantTreeExpanded = useMemo(() => buildTenantTreeExpanded(tenants), [tenants]);

    const draftRoleOptions = useMemo(() => {
        if (!draftFilters.tenantId || draftFilters.tenantId === 'all') {
            return [{ label: '请先选择租户', value: '' }];
        }
        const tenantRoles = getRolesByTenant(roles, draftFilters.tenantId);
        if (!tenantRoles.length) {
            return [{ label: '该租户暂无角色', value: '' }];
        }
        return [
            { label: '全部', value: '' },
            ...tenantRoles.map((item) => ({ label: item.name, value: item.id })),
        ];
    }, [draftFilters.tenantId, roles]);

    const filteredUsers = useMemo(() => users.filter((item) => {
        if (appliedFilters.tenantId && appliedFilters.tenantId !== 'all') {
            if (!matchesTreeSelection(appliedFilters.tenantId, item.tenantId, tenantTree)) return false;
        }
        if (appliedFilters.roleId && item.roleId !== appliedFilters.roleId) return false;
        if (appliedFilters.status !== '全部' && item.status !== appliedFilters.status) return false;
        const keyword = appliedFilters.keyword.trim().toLowerCase();
        if (!keyword) return true;
        return item.displayName.toLowerCase().includes(keyword)
            || item.account.toLowerCase().includes(keyword)
            || item.phone.includes(keyword);
    }), [appliedFilters, users, tenantTree]);

    const pagination = useMemo(
        () => paginateItems(filteredUsers, currentPage, Number(pageSize)),
        [currentPage, filteredUsers, pageSize],
    );

    const pageIds = pagination.items.map((item) => item.id);
    const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));

    useEffect(() => {
        setCurrentPage(1);
        setJumpPage('1');
    }, [appliedFilters, pageSize]);

    useEffect(() => {
        setJumpPage(String(pagination.currentPage));
    }, [pagination.currentPage]);

    useEffect(() => {
        if (!bulkMenuOpen) return undefined;
        const handleClickOutside = (event: MouseEvent) => {
            if (!bulkMenuRef.current?.contains(event.target as Node)) {
                setBulkMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [bulkMenuOpen]);

    const updateDraft = (patch: Partial<FilterState>) => {
        setDraftFilters((prev) => {
            const next = { ...prev, ...patch };
            if (patch.tenantId !== undefined && patch.tenantId !== prev.tenantId) {
                next.roleId = '';
            }
            if (patch.tenantId === 'all') {
                next.roleId = '';
            }
            return next;
        });
    };

    const handleSearch = () => {
        setAppliedFilters(draftFilters);
        setCurrentPage(1);
        setJumpPage('1');
    };

    const handleReset = () => {
        setDraftFilters(DEFAULT_FILTERS);
        setAppliedFilters(DEFAULT_FILTERS);
        setCurrentPage(1);
        setJumpPage('1');
    };

    const toggleSelectAll = () => {
        if (allPageSelected) {
            setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
            return;
        }
        setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    };

    const toggleSelect = (id: string) => {
        setSelectedIds((prev) => (
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        ));
    };

    const openAddDrawer = () => {
        setEditingUser(null);
        setDrawerMode('add');
    };

    const openEditDrawer = (user: SystemUserRecord) => {
        setEditingUser(user);
        setDrawerMode('edit');
    };

    const closeFormDrawer = () => {
        setDrawerMode(null);
        setEditingUser(null);
    };

    const handleSubmit = (value: UserFormValue) => {
        if (!isRoleBelongsToTenant(roles, value.roleId, value.tenantId)) {
            showToast('所选角色不属于当前租户', 'warning');
            return;
        }

        if (drawerMode === 'add') {
            const duplicated = users.some((item) => item.account === value.account);
            if (duplicated) {
                showToast('用户账号已存在', 'warning');
                return;
            }
            const next: SystemUserRecord = {
                id: generateSystemUserId(),
                tenantId: value.tenantId,
                displayName: value.displayName,
                account: value.account,
                password: value.password,
                phone: value.phone,
                roleId: value.roleId,
                departmentId: value.departmentId,
                avatar: value.avatar || undefined,
                gender: value.gender,
                birthday: value.birthday,
                email: value.email || undefined,
                status: '正常',
                createdAt: formatSystemUserNow(),
            };
            onUpdateUsers((prev) => [next, ...prev]);
            showToast('用户新增成功');
            closeFormDrawer();
            return;
        }

        if (drawerMode === 'edit' && editingUser) {
            const duplicated = users.some((item) => item.id !== editingUser.id && item.account === value.account);
            if (duplicated) {
                showToast('用户账号已存在', 'warning');
                return;
            }
            onUpdateUsers((prev) => prev.map((item) => (
                item.id === editingUser.id
                    ? {
                        ...item,
                        tenantId: value.tenantId,
                        displayName: value.displayName,
                        account: value.account,
                        phone: value.phone,
                        roleId: value.roleId,
                        departmentId: value.departmentId,
                        avatar: value.avatar || undefined,
                        gender: value.gender,
                        birthday: value.birthday,
                        email: value.email || undefined,
                    }
                    : item
            )));
            showToast('用户编辑成功');
            closeFormDrawer();
        }
    };

    const handleDelete = () => {
        if (!deleteTarget) return;
        onUpdateUsers((prev) => prev.filter((item) => item.id !== deleteTarget.id));
        setSelectedIds((prev) => prev.filter((id) => id !== deleteTarget.id));
        showToast('用户已删除');
        setDeleteTarget(null);
    };

    const handleBulkDelete = () => {
        if (!selectedIds.length) {
            showToast('请先选择用户', 'warning');
            setBulkMenuOpen(false);
            return;
        }
        onUpdateUsers((prev) => prev.filter((item) => !selectedIds.includes(item.id)));
        showToast(`已删除 ${selectedIds.length} 个用户`);
        setSelectedIds([]);
        setBulkMenuOpen(false);
    };

    const handleBulkFreeze = () => {
        if (!selectedIds.length) {
            showToast('请先选择用户', 'warning');
            setBulkMenuOpen(false);
            return;
        }
        onUpdateUsers((prev) => prev.map((item) => (
            selectedIds.includes(item.id) ? { ...item, status: '冻结' } : item
        )));
        showToast(`已冻结 ${selectedIds.length} 个用户`);
        setBulkMenuOpen(false);
    };

    const handleToggleFreeze = (user: SystemUserRecord) => {
        if (user.account === 'superadmin') {
            showToast('不能冻结超级管理员账号', 'warning');
            return;
        }
        const nextStatus: SystemUserStatus = user.status === '正常' ? '冻结' : '正常';
        onUpdateUsers((prev) => prev.map((item) => (
            item.id === user.id ? { ...item, status: nextStatus } : item
        )));
        showToast(nextStatus === '冻结' ? `用户「${user.displayName}」已冻结` : `用户「${user.displayName}」已解冻`);
    };

    const handlePasswordConfirm = (password: string) => {
        if (!passwordTarget) return;
        onUpdateUsers((prev) => prev.map((item) => (
            item.id === passwordTarget.id ? { ...item, password } : item
        )));
        showToast(`用户「${passwordTarget.displayName}」密码已更新`);
        setPasswordTarget(null);
    };

    const sidebar = (
        <SystemManagementSidebar
            pageId="user-mgmt"
            onNavigate={onNavigate}
        />
    );

    return (
        <AppShell
            activeTopTab="系统管理"
            sidebar={sidebar}
            onNavigateMessageCenter={onNavigateMessageCenter}
            onNavigateOmManagement={onNavigateOmManagement}
            onNavigateSystemManagement={() => onNavigate('user-mgmt')}
            onTopTabChange={(tab) => {
                if (tab === '设备接入') onNavigateDeviceAccess();
                if (tab === '消息中心') onNavigateMessageCenter();
                if (tab === '运维管理') onNavigateOmManagement();
            }}
        >
            <div className="um-page">
                <div className="crumb">系统管理 / 用户管理</div>

                <section className="panel um-filter-panel">
                    <div className="um-filter-row">
                        <label className="pm-filter-field">
                            <span className="pm-filter-label">所属租户</span>
                            <ElTreeSelect
                                className="el-select--medium um-filter-tree-select"
                                size="medium"
                                value={draftFilters.tenantId || 'all'}
                                tree={tenantTree}
                                defaultExpanded={tenantTreeExpanded}
                                placeholder="全部"
                                onChange={(value) => updateDraft({ tenantId: value })}
                            />
                        </label>
                        <label className="pm-filter-field">
                            <span className="pm-filter-label">所属角色</span>
                            <ElSelect
                                className="el-select--medium um-filter-select"
                                size="medium"
                                value={draftFilters.roleId}
                                options={draftRoleOptions}
                                disabled={!draftFilters.tenantId || draftFilters.tenantId === 'all'}
                                onChange={(value) => updateDraft({ roleId: value })}
                            />
                        </label>
                        <label className="pm-filter-field">
                            <span className="pm-filter-label">用户状态</span>
                            <ElSelect
                                className="el-select--medium um-filter-select"
                                size="medium"
                                value={draftFilters.status}
                                options={STATUS_OPTIONS}
                                onChange={(value) => updateDraft({ status: value })}
                            />
                        </label>
                        <label className="pm-filter-field">
                            <span className="pm-filter-label">用户名称</span>
                            <input
                                type="text"
                                className="pm-filter-input"
                                placeholder="请输入用户名称/手机号码"
                                value={draftFilters.keyword}
                                onChange={(event) => updateDraft({ keyword: event.target.value })}
                            />
                        </label>
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

                <section className="panel um-table-panel">
                    <div className="um-table-head">
                        <h3>用户列表</h3>
                        <div className="um-table-head__actions">
                            <button type="button" className="pm-btn pm-btn-primary" onClick={openAddDrawer}>
                                <Plus size={14} />
                                添加用户
                            </button>
                            <button
                                type="button"
                                className="pm-btn pm-btn-ghost"
                                onClick={() => showToast('已提交批量导入任务')}
                            >
                                <Upload size={14} />
                                批量导入
                            </button>
                            <div className="um-bulk-menu" ref={bulkMenuRef}>
                                <button
                                    type="button"
                                    className="pm-btn pm-btn-ghost"
                                    onClick={() => setBulkMenuOpen((prev) => !prev)}
                                >
                                    批量操作
                                    <ChevronDown size={14} />
                                </button>
                                {bulkMenuOpen ? (
                                    <div className="um-bulk-menu__panel">
                                        <button type="button" onClick={handleBulkDelete}>批量删除</button>
                                        <button type="button" onClick={handleBulkFreeze}>批量冻结</button>
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    </div>

                    <div className="um-table-wrap">
                        <table className="um-table">
                            <thead>
                                <tr>
                                    <th className="um-table__check">
                                        <input
                                            type="checkbox"
                                            checked={allPageSelected}
                                            onChange={toggleSelectAll}
                                            aria-label="全选当前页"
                                        />
                                    </th>
                                    <th className="um-table__index">序号</th>
                                    <th>用户名称</th>
                                    <th>用户账号</th>
                                    <th>角色</th>
                                    <th>所属租户</th>
                                    <th>头像</th>
                                    <th>性别</th>
                                    <th>生日</th>
                                    <th>手机号码</th>
                                    <th>状态</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pagination.items.map((user, index) => (
                                    <tr key={user.id}>
                                        <td className="um-table__check">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(user.id)}
                                                onChange={() => toggleSelect(user.id)}
                                                aria-label={`选择${user.displayName}`}
                                            />
                                        </td>
                                        <td>{(pagination.currentPage - 1) * Number(pageSize) + index + 1}</td>
                                        <td>{user.displayName}</td>
                                        <td>{user.account}</td>
                                        <td>{getRoleLabel(roles, user.roleId)}</td>
                                        <td>{resolveTenantName(tenants, user.tenantId)}</td>
                                        <td>
                                            {user.avatar ? (
                                                <img src={user.avatar} alt={user.displayName} className="um-avatar" />
                                            ) : (
                                                <span className="um-avatar um-avatar--placeholder">
                                                    <UserRound size={14} />
                                                </span>
                                            )}
                                        </td>
                                        <td>{user.gender}</td>
                                        <td>{user.birthday || '—'}</td>
                                        <td>{user.phone}</td>
                                        <td><UserStatusTag status={user.status} /></td>
                                        <td>
                                            <div className="um-table-actions">
                                                <button type="button" onClick={() => openEditDrawer(user)}>编辑</button>
                                                <button type="button" onClick={() => setDetailUser(user)}>详情</button>
                                                <button type="button" onClick={() => setDeleteTarget(user)}>删除</button>
                                                <button type="button" onClick={() => setPasswordTarget(user)}>修改密码</button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleFreeze(user)}
                                                    disabled={user.account === 'superadmin'}
                                                    className={user.account === 'superadmin' ? 'is-disabled' : ''}
                                                >
                                                    {user.status === '正常' ? '冻结' : '解冻'}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
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

            <UserFormDrawer
                open={drawerMode !== null}
                mode={drawerMode === 'edit' ? 'edit' : 'add'}
                tenants={tenants}
                roles={roles}
                initialValue={editingUser ? toUserFormValue(editingUser) : undefined}
                onClose={closeFormDrawer}
                onSubmit={handleSubmit}
            />

            <UserDetailDrawer
                open={detailUser !== null}
                user={detailUser}
                tenants={tenants}
                roles={roles}
                onClose={() => setDetailUser(null)}
            />

            <UserPasswordDialog
                open={passwordTarget !== null}
                onClose={() => setPasswordTarget(null)}
                onConfirm={handlePasswordConfirm}
                onCopySuccess={() => showToast('密码已复制')}
            />

            {deleteTarget ? (
                <ConfirmDialog
                    title="删除用户"
                    message={`确定删除用户「${deleteTarget.displayName}」吗？`}
                    onClose={() => setDeleteTarget(null)}
                    onConfirm={handleDelete}
                />
            ) : null}

            <IotToast toast={toast} />
        </AppShell>
    );
}
