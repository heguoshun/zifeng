import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import TreeToggleIcon from '../components/TreeToggleIcon';
import AppShell from '../components/AppShell';
import SystemManagementSidebar, { type SystemManagementPageId } from '../components/SystemManagementSidebar';
import ListPagination from '../components/ListPagination';
import MenuFormDialog from '../components/MenuFormDialog';
import { ConfirmDialog, ViewDrawer } from '../components/IotDialogs';
import IotToast, { type IotToastData, type IotToastType, triggerIotToast } from '../components/IotToast';
import {
    buildDefaultMenuExpanded,
    buildMenuSubtreeRows,
    collectDescendantIds,
    formatMenuTypeLabel,
    generateMenuId,
    getFilteredRootMenus,
    toMenuFormValue,
    type MenuFormValue,
    type SystemMenuRecord,
} from '../data/systemMenus';
import { paginateItems } from '../utils/listPagination';
import '../device-access.css';
import '../product-management.css';
import '../tenant-management.css';
import '../menu-management.css';

type FormMode = 'add' | 'edit' | 'add-child' | null;

export type MenuManagementPageProps = {
    menus: SystemMenuRecord[];
    onUpdateMenus: React.Dispatch<React.SetStateAction<SystemMenuRecord[]>>;
    onNavigateHome: () => void;
    onNavigateDeviceAccess: () => void;
    onNavigateMessageCenter: () => void;
    onNavigateOmManagement: () => void;
    onNavigate: (pageId: SystemManagementPageId) => void;
};

export default function MenuManagementPage({
    menus,
    onUpdateMenus,
    onNavigateHome,
    onNavigateDeviceAccess,
    onNavigateMessageCenter,
    onNavigateOmManagement,
    onNavigate,
}: MenuManagementPageProps) {
    const [expanded, setExpanded] = useState<Record<string, boolean>>(() => buildDefaultMenuExpanded(menus));
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [pageSize, setPageSize] = useState('10');
    const [currentPage, setCurrentPage] = useState(1);
    const [jumpPage, setJumpPage] = useState('1');
    const [formMode, setFormMode] = useState<FormMode>(null);
    const [editingMenu, setEditingMenu] = useState<SystemMenuRecord | null>(null);
    const [childParentId, setChildParentId] = useState<string | null>(null);
    const [detailMenu, setDetailMenu] = useState<SystemMenuRecord | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<SystemMenuRecord | null>(null);
    const [moreMenuId, setMoreMenuId] = useState<string | null>(null);
    const [toast, setToast] = useState<IotToastData | null>(null);
    const moreMenuRef = useRef<HTMLDivElement | null>(null);

    const showToast = (message: string, type: IotToastType = 'warning') => {
        triggerIotToast(setToast, message, type);
    };

    const rootMenus = useMemo(() => getFilteredRootMenus(menus, ''), [menus]);

    const pagination = useMemo(
        () => paginateItems(rootMenus, currentPage, Number(pageSize)),
        [rootMenus, currentPage, pageSize],
    );

    const tableRows = useMemo(
        () => pagination.items.flatMap((root) => buildMenuSubtreeRows(menus, root, expanded)),
        [pagination.items, menus, expanded],
    );

    useEffect(() => {
        setExpanded((prev) => {
            const next = { ...prev };
            menus.forEach((item) => {
                if (!(item.id in next)) next[item.id] = true;
            });
            return next;
        });
    }, [menus]);

    useEffect(() => {
        setJumpPage(String(pagination.currentPage));
    }, [pagination.currentPage]);

    useEffect(() => {
        if (!moreMenuId) return undefined;
        const handleClickOutside = (event: MouseEvent) => {
            if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
                setMoreMenuId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [moreMenuId]);

    const openAddDialog = () => {
        setEditingMenu(null);
        setChildParentId(null);
        setFormMode('add');
    };

    const openEditDialog = (menu: SystemMenuRecord) => {
        setEditingMenu(menu);
        setChildParentId(null);
        setFormMode('edit');
        setMoreMenuId(null);
    };

    const openAddChildDialog = (parentId: string) => {
        setEditingMenu(null);
        setChildParentId(parentId);
        setFormMode('add-child');
        setMoreMenuId(null);
    };

    const closeFormDialog = () => {
        setFormMode(null);
        setEditingMenu(null);
        setChildParentId(null);
    };

    const handleSubmit = (value: MenuFormValue) => {
        if (formMode === 'edit' && editingMenu) {
            onUpdateMenus((prev) => prev.map((item) => (
                item.id === editingMenu.id ? { ...item, ...value } : item
            )));
            showToast('菜单已更新', 'success');
            closeFormDialog();
            return;
        }

        const next: SystemMenuRecord = {
            id: generateMenuId(),
            ...value,
        };
        onUpdateMenus((prev) => [...prev, next]);
        if (next.parentId) {
            setExpanded((prev) => ({ ...prev, [next.parentId!]: true }));
        }
        showToast('菜单已新增', 'success');
        closeFormDialog();
    };

    const handleDelete = () => {
        if (!deleteTarget) return;
        const removeIds = new Set([deleteTarget.id, ...collectDescendantIds(menus, deleteTarget.id)]);
        onUpdateMenus((prev) => prev.filter((item) => !removeIds.has(item.id)));
        setSelectedIds((prev) => {
            const next = new Set(prev);
            removeIds.forEach((id) => next.delete(id));
            return next;
        });
        setDeleteTarget(null);
        showToast('菜单已删除', 'success');
    };

    const toggleSelect = (id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const toggleSelectAll = () => {
        const visibleIds = tableRows.map((row) => row.item.id);
        const allSelected = visibleIds.every((id) => selectedIds.has(id));
        if (allSelected) {
            setSelectedIds((prev) => {
                const next = new Set(prev);
                visibleIds.forEach((id) => next.delete(id));
                return next;
            });
            return;
        }
        setSelectedIds((prev) => {
            const next = new Set(prev);
            visibleIds.forEach((id) => next.add(id));
            return next;
        });
    };

    const sidebar = (
        <SystemManagementSidebar
            pageId="menu-mgmt"
            onNavigate={onNavigate}
        />
    );

    const allVisibleSelected = tableRows.length > 0
        && tableRows.every((row) => selectedIds.has(row.item.id));

    return (
        <AppShell
            activeTopTab="系统管理"
            sidebar={sidebar}
            onNavigateMessageCenter={onNavigateMessageCenter}
            onNavigateOmManagement={onNavigateOmManagement}
            onNavigateSystemManagement={() => onNavigate('menu-mgmt')}
            onTopTabChange={(tab) => {
                if (tab === '设备接入') onNavigateDeviceAccess();
                if (tab === '消息中心') onNavigateMessageCenter();
                if (tab === '运维管理') onNavigateOmManagement();
            }}
        >
            <div className="mm-page">
                <div className="crumb">系统管理 / 菜单管理</div>

                <section className="panel mm-table-panel">
                    <div className="mm-table-head">
                        <h3>菜单管理</h3>
                        <button type="button" className="pm-btn pm-btn-primary" onClick={openAddDialog}>
                            <Plus size={14} />
                            新增
                        </button>
                    </div>

                    <div className="mm-table-wrap">
                        <table className="mm-table">
                            <thead>
                                <tr>
                                    <th>
                                        <input
                                            type="checkbox"
                                            checked={allVisibleSelected}
                                            onChange={toggleSelectAll}
                                            aria-label="全选"
                                        />
                                    </th>
                                    <th>序号</th>
                                    <th>菜单名称</th>
                                    <th>icon</th>
                                    <th>组件</th>
                                    <th>路径</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tableRows.map(({ item, depth, hasChildren, rootIndex }) => {
                                    const isExpanded = expanded[item.id] ?? true;
                                    const isSelected = selectedIds.has(item.id);
                                    const showIndex = depth === 0;

                                    return (
                                        <tr
                                            key={item.id}
                                            className={isSelected ? 'is-selected' : ''}
                                        >
                                            <td>
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => toggleSelect(item.id)}
                                                    aria-label={`选择 ${item.name}`}
                                                />
                                            </td>
                                            <td>{showIndex ? rootIndex : ''}</td>
                                            <td>
                                                <div
                                                    className="mm-tree-cell"
                                                    style={{ paddingLeft: `${depth * 18}px` }}
                                                >
                                                    {hasChildren ? (
                                                        <button
                                                            type="button"
                                                            className="mm-tree-toggle"
                                                            onClick={() => setExpanded((prev) => ({
                                                                ...prev,
                                                                [item.id]: !isExpanded,
                                                            }))}
                                                            aria-label={isExpanded ? '收起' : '展开'}
                                                        >
                                                            <TreeToggleIcon expanded={isExpanded} />
                                                        </button>
                                                    ) : (
                                                        <span className="mm-tree-spacer" />
                                                    )}
                                                    <span>{item.name}</span>
                                                </div>
                                            </td>
                                            <td>{item.icon || '—'}</td>
                                            <td>{item.component || '—'}</td>
                                            <td>{item.path}</td>
                                            <td>
                                                <div className="mm-table-actions">
                                                    <button type="button" onClick={() => openEditDialog(item)}>
                                                        编辑
                                                    </button>
                                                    <div
                                                        className="mm-more-wrap"
                                                        ref={moreMenuId === item.id ? moreMenuRef : null}
                                                    >
                                                        <button
                                                            type="button"
                                                            onClick={() => setMoreMenuId(
                                                                moreMenuId === item.id ? null : item.id,
                                                            )}
                                                        >
                                                            更多
                                                        </button>
                                                        {moreMenuId === item.id ? (
                                                            <div className="mm-more-menu">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setDetailMenu(item);
                                                                        setMoreMenuId(null);
                                                                    }}
                                                                >
                                                                    详情
                                                                </button>
                                                                {item.menuType !== 'button' ? (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => openAddChildDialog(item.id)}
                                                                    >
                                                                        添加下级
                                                                    </button>
                                                                ) : null}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setDeleteTarget(item);
                                                                        setMoreMenuId(null);
                                                                    }}
                                                                >
                                                                    删除
                                                                </button>
                                                            </div>
                                                        ) : null}
                                                    </div>
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

            <MenuFormDialog
                open={formMode !== null}
                mode={formMode === 'edit' ? 'edit' : formMode === 'add-child' ? 'add-child' : 'add'}
                menus={menus}
                initialValue={editingMenu ? toMenuFormValue(editingMenu) : undefined}
                parentId={childParentId}
                onClose={closeFormDialog}
                onSubmit={handleSubmit}
            />

            <ViewDrawer
                title="菜单详情"
                open={detailMenu !== null}
                items={detailMenu ? [
                    { label: '菜单名称', value: detailMenu.name },
                    { label: '菜单类型', value: formatMenuTypeLabel(detailMenu.menuType) },
                    { label: '菜单路径', value: detailMenu.path },
                    { label: '前端组件', value: detailMenu.component || '—' },
                    { label: '默认跳转', value: detailMenu.redirect || '—' },
                    { label: '菜单图标', value: detailMenu.icon || '—' },
                    { label: '排序', value: String(detailMenu.sort) },
                    { label: '是否路由菜单', value: detailMenu.isRoute ? '是' : '否' },
                    { label: '隐藏路由', value: detailMenu.hidden ? '是' : '否' },
                    { label: '是否缓存路由', value: detailMenu.keepAlive ? '是' : '否' },
                    { label: '聚合路由', value: detailMenu.alwaysShow ? '是' : '否' },
                    { label: '打开方式', value: detailMenu.openType === 'internal' ? '内部' : '外部' },
                ] : []}
                onClose={() => setDetailMenu(null)}
            />

            {deleteTarget ? (
                <ConfirmDialog
                    title="删除菜单"
                    message={`确定删除菜单「${deleteTarget.name}」及其下级菜单吗？`}
                    onClose={() => setDeleteTarget(null)}
                    onConfirm={handleDelete}
                />
            ) : null}

            <IotToast toast={toast} />
        </AppShell>
    );
}
