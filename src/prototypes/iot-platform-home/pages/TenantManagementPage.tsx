import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import TreeToggleIcon from '../components/TreeToggleIcon';
import AppShell from '../components/AppShell';
import SystemManagementSidebar, { type SystemManagementPageId } from '../components/SystemManagementSidebar';
import ListPagination from '../components/ListPagination';
import TenantFormDrawer, { toTenantFormValue, type TenantFormValue } from '../components/TenantFormDrawer';
import TenantDetailDrawer from '../components/TenantDetailDrawer';
import TenantAuthorizeDrawer from '../components/TenantAuthorizeDrawer';
import { ConfirmDialog } from '../components/IotDialogs';
import IotToast, { type IotToastData, type IotToastType, triggerIotToast } from '../components/IotToast';
import { DEFAULT_TENANT_PERMISSION_IDS } from '../data/tenantMenus';
import {
    buildTenantSubtreeRows,
    formatTenantNow,
    generateTenantId,
    getFilteredRootTenants,
    getTenantById,
    type TenantRecord,
} from '../data/tenants';
import { paginateItems } from '../utils/listPagination';
import '../device-access.css';
import '../product-management.css';
import '../tenant-management.css';

type DrawerMode = 'add' | 'edit' | null;

type TenantManagementPageProps = {
    tenants: TenantRecord[];
    onUpdateTenants: React.Dispatch<React.SetStateAction<TenantRecord[]>>;
    onNavigateHome: () => void;
    onNavigateDeviceAccess: () => void;
    onNavigateMessageCenter: () => void;
    onNavigateOmManagement: () => void;
    onNavigate: (pageId: SystemManagementPageId) => void;
};

export default function TenantManagementPage({
    tenants,
    onUpdateTenants,
    onNavigateHome,
    onNavigateDeviceAccess,
    onNavigateMessageCenter,
    onNavigateOmManagement,
    onNavigate,
}: TenantManagementPageProps) {
    const [draftKeyword, setDraftKeyword] = useState('');
    const [keyword, setKeyword] = useState('');
    const [expanded, setExpanded] = useState<Record<string, boolean>>({
        'tenant-jiahuan': true,
    });
    const [pageSize, setPageSize] = useState('10');
    const [currentPage, setCurrentPage] = useState(1);
    const [jumpPage, setJumpPage] = useState('1');
    const [drawerMode, setDrawerMode] = useState<DrawerMode>(null);
    const [editingTenant, setEditingTenant] = useState<TenantRecord | null>(null);
    const [detailTenant, setDetailTenant] = useState<TenantRecord | null>(null);
    const [authorizeTenant, setAuthorizeTenant] = useState<TenantRecord | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<TenantRecord | null>(null);
    const [toast, setToast] = useState<IotToastData | null>(null);

    const showToast = (message: string, type: IotToastType = 'warning') => {
        triggerIotToast(setToast, message, type);
    };

    const rootTenants = useMemo(
        () => getFilteredRootTenants(tenants, keyword),
        [tenants, keyword],
    );

    const pagination = useMemo(
        () => paginateItems(rootTenants, currentPage, Number(pageSize)),
        [rootTenants, currentPage, pageSize],
    );

    const tableRows = useMemo(
        () => pagination.items.flatMap((root) => buildTenantSubtreeRows(tenants, root, expanded)),
        [pagination.items, tenants, expanded],
    );

    useEffect(() => {
        setCurrentPage(1);
        setJumpPage('1');
    }, [keyword, pageSize]);

    useEffect(() => {
        setJumpPage(String(pagination.currentPage));
    }, [pagination.currentPage]);

    const openAddDrawer = () => {
        setEditingTenant(null);
        setDrawerMode('add');
    };

    const openEditDrawer = (tenant: TenantRecord) => {
        setEditingTenant(tenant);
        setDrawerMode('edit');
    };

    const closeFormDrawer = () => {
        setDrawerMode(null);
        setEditingTenant(null);
    };

    const handleSearch = () => {
        setKeyword(draftKeyword.trim());
        setCurrentPage(1);
        setJumpPage('1');
    };

    const handleReset = () => {
        setDraftKeyword('');
        setKeyword('');
        setCurrentPage(1);
        setJumpPage('1');
    };

    const handleSubmit = (value: TenantFormValue) => {
        const parentId = value.parentId || null;
        const parentTenant = parentId ? getTenantById(tenants, parentId) : undefined;
        const isSecondary = parentId !== null;

        if (drawerMode === 'add') {
            const next: TenantRecord = {
                id: generateTenantId(),
                parentId,
                name: value.name,
                region: value.region,
                address: value.address,
                adminName: isSecondary
                    ? (parentTenant?.adminName ?? value.adminName)
                    : value.adminName,
                phone: isSecondary
                    ? (parentTenant?.phone ?? value.phone)
                    : value.phone,
                password: isSecondary ? undefined : (value.password || undefined),
                remark: value.remark,
                createdAt: formatTenantNow(),
                authorizedPermissionIds: [...DEFAULT_TENANT_PERMISSION_IDS],
            };
            onUpdateTenants((prev) => [next, ...prev]);
            if (parentId) {
                setExpanded((prev) => ({ ...prev, [parentId]: true }));
            }
            showToast('租户新增成功', 'success');
            closeFormDrawer();
            return;
        }

        if (drawerMode === 'edit' && editingTenant) {
            const keepAdminFields = Boolean(editingTenant.parentId);
            onUpdateTenants((prev) => prev.map((item) => (
                item.id === editingTenant.id
                    ? {
                        ...item,
                        name: value.name,
                        region: value.region,
                        address: value.address,
                        adminName: keepAdminFields ? item.adminName : value.adminName,
                        phone: keepAdminFields ? item.phone : value.phone,
                        remark: value.remark,
                    }
                    : item
            )));
            showToast('租户保存成功', 'success');
            closeFormDrawer();
        }
    };

    const handleDelete = () => {
        if (!deleteTarget) return;
        const hasChildren = tenants.some((item) => item.parentId === deleteTarget.id);
        if (hasChildren) {
            showToast('请先删除子租户');
            setDeleteTarget(null);
            return;
        }
        onUpdateTenants((prev) => prev.filter((item) => item.id !== deleteTarget.id));
        showToast('租户已删除', 'success');
        setDeleteTarget(null);
    };

    const handleAuthorize = (permissionIds: string[]) => {
        if (!authorizeTenant) return;
        onUpdateTenants((prev) => prev.map((item) => (
            item.id === authorizeTenant.id
                ? { ...item, authorizedPermissionIds: permissionIds }
                : item
        )));
        showToast(`租户「${authorizeTenant.name}」授权成功`, 'success');
        setAuthorizeTenant(null);
    };

    const sidebar = (
        <SystemManagementSidebar
            pageId="tenant-mgmt"
            onNavigate={onNavigate}
            onUnavailable={(label) => showToast(`${label}功能开发中`)}
        />
    );

    return (
        <AppShell
            activeTopTab="系统管理"
            sidebar={sidebar}
            onNavigateMessageCenter={onNavigateMessageCenter}
            onNavigateOmManagement={onNavigateOmManagement}
            onNavigateSystemManagement={() => onNavigate('tenant-mgmt')}
            onTopTabChange={(tab) => {
                if (tab === '设备接入') onNavigateDeviceAccess();
                if (tab === '消息中心') onNavigateMessageCenter();
                if (tab === '运维管理') onNavigateOmManagement();
            }}
        >
            <div className="tm-page">
                <div className="crumb">系统管理 / 租户管理</div>

                <section className="panel tm-filter-panel">
                    <div className="tm-filter-row">
                        <label className="pm-filter-field">
                            <span className="pm-filter-label">租户名称</span>
                            <input
                                type="text"
                                className="pm-filter-input"
                                placeholder="请输入租户名称"
                                value={draftKeyword}
                                onChange={(event) => setDraftKeyword(event.target.value)}
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

                <section className="panel tm-table-panel">
                    <div className="tm-table-head">
                        <h3>租户列表</h3>
                        <button type="button" className="pm-btn pm-btn-primary" onClick={openAddDrawer}>
                            <Plus size={14} />
                            添加租户
                        </button>
                    </div>

                    <div className="tm-table-wrap">
                        <table className="tm-table">
                            <thead>
                                <tr>
                                    <th>租户名称</th>
                                    <th>所在地区</th>
                                    <th>详细位置</th>
                                    <th>管理员</th>
                                    <th>手机号码</th>
                                    <th>创建时间</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tableRows.map(({ item, depth, hasChildren }) => {
                                    const isExpanded = expanded[item.id] ?? true;
                                    return (
                                        <tr key={item.id}>
                                            <td>
                                                <div
                                                    className="tm-tree-cell"
                                                    style={{ paddingLeft: `${depth * 18}px` }}
                                                >
                                                    {hasChildren ? (
                                                        <button
                                                            type="button"
                                                            className="tm-tree-toggle"
                                                            onClick={() => setExpanded((prev) => ({
                                                                ...prev,
                                                                [item.id]: !isExpanded,
                                                            }))}
                                                            aria-label={isExpanded ? '收起' : '展开'}
                                                        >
                                                            <TreeToggleIcon expanded={isExpanded} />
                                                        </button>
                                                    ) : (
                                                        <span className="tm-tree-spacer" />
                                                    )}
                                                    <span>{item.name}</span>
                                                </div>
                                            </td>
                                            <td>{item.region}</td>
                                            <td>{item.address}</td>
                                            <td>{item.adminName}</td>
                                            <td>{item.phone}</td>
                                            <td>{item.createdAt}</td>
                                            <td>
                                                <div className="tm-table-actions">
                                                    <button type="button" onClick={() => setAuthorizeTenant(item)}>
                                                        授权
                                                    </button>
                                                    <button type="button" onClick={() => openEditDrawer(item)}>
                                                        编辑
                                                    </button>
                                                    <button type="button" onClick={() => setDetailTenant(item)}>
                                                        详情
                                                    </button>
                                                    <button type="button" onClick={() => setDeleteTarget(item)}>
                                                        删除
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
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

            <TenantFormDrawer
                open={drawerMode !== null}
                mode={drawerMode === 'edit' ? 'edit' : 'add'}
                tenants={tenants}
                editingTenant={editingTenant}
                initialValue={editingTenant ? toTenantFormValue(editingTenant) : undefined}
                onClose={closeFormDrawer}
                onSubmit={handleSubmit}
            />

            <TenantDetailDrawer
                open={detailTenant !== null}
                tenant={detailTenant}
                onClose={() => setDetailTenant(null)}
            />

            <TenantAuthorizeDrawer
                open={authorizeTenant !== null}
                tenant={authorizeTenant}
                onClose={() => setAuthorizeTenant(null)}
                onConfirm={handleAuthorize}
            />

            {deleteTarget ? (
                <ConfirmDialog
                    title="删除租户"
                    message={`确定删除租户「${deleteTarget.name}」吗？`}
                    onClose={() => setDeleteTarget(null)}
                    onConfirm={handleDelete}
                />
            ) : null}

            <IotToast toast={toast} />
        </AppShell>
    );
}
