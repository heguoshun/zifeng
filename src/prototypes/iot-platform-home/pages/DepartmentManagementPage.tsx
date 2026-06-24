import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Search, Trash2 } from 'lucide-react';
import TreeToggleIcon from '../components/TreeToggleIcon';
import AppShell from '../components/AppShell';
import SystemManagementSidebar, { type SystemManagementPageId } from '../components/SystemManagementSidebar';
import ElTreeSelect from '../components/ElTreeSelect';
import ListPagination from '../components/ListPagination';
import { type TreeSelectNode } from '../data/orgHierarchy';
import { ConfirmDialog } from '../components/IotDialogs';
import IotToast, { type IotToastData, type IotToastType, triggerIotToast } from '../components/IotToast';
import {
    createInitialDepartments,
    generateDeptCode,
    generateDeptId,
    type SystemDepartmentRecord,
} from '../data/systemDepartments';
import { type TenantRecord } from '../data/tenants';
import { type SystemUserRecord } from '../data/systemUsers';
import { getRoleLabel, SYSTEM_ROLES } from '../data/systemRoles';
import { paginateItems, DEFAULT_LIST_PAGE_SIZE } from '../utils/listPagination';
import '../device-access.css';
import '../product-management.css';
import '../department-management.css';
import ClearableInput from '../components/ClearableInput';

// ── Tree Node type ──
interface TreeNode {
    record: SystemDepartmentRecord;
    children: TreeNode[];
    depth: number;
}

// ── Department Management Page ──

export type DepartmentManagementPageProps = {
    departments: SystemDepartmentRecord[];
    tenants: TenantRecord[];
    users: SystemUserRecord[];
    onUpdateDepartments: React.Dispatch<React.SetStateAction<SystemDepartmentRecord[]>>;
    onNavigateHome: () => void;
    onNavigateDeviceAccess: () => void;
    onNavigateMessageCenter: () => void;
    onNavigate: (pageId: SystemManagementPageId) => void;
};

const EMPTY_FORM = {
    name: '',
    parentId: '',
    code: '',
    type: 'department' as 'company' | 'department',
    head: '',
    phone: '',
    notes: '',
};

export default function DepartmentManagementPage({
    departments,
    tenants,
    users,
    onUpdateDepartments,
    onNavigateHome,
    onNavigateDeviceAccess,
    onNavigateMessageCenter,
    onNavigate,
}: DepartmentManagementPageProps) {
    // ── state ──
    const [treeKeyword, setTreeKeyword] = useState('');
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(['dept-jiahuan-root']));
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [deleteTarget, setDeleteTarget] = useState<SystemDepartmentRecord | null>(null);
    const [toast, setToast] = useState<IotToastData | null>(null);
    const [addMode, setAddMode] = useState(false);
    const [pickerOpen, setPickerOpen] = useState(false);
    const [pickerDraftKeyword, setPickerDraftKeyword] = useState('');
    const [pickerKeyword, setPickerKeyword] = useState('');
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [pickerPage, setPickerPage] = useState(1);
    const [pickerPageSize, setPickerPageSize] = useState('10');
    const [pickerJumpPage, setPickerJumpPage] = useState('1');

    const showToast = (message: string, type: IotToastType = 'warning') => {
        triggerIotToast(setToast, message, type);
    };

    // ── Build tree ──
    const buildTree = useCallback(
        (items: SystemDepartmentRecord[], parentId: string | null, depth: number): TreeNode[] => {
            return items
                .filter((d) => d.parentId === parentId)
                .sort((a, b) => {
                    // sort: companies first, then departments
                    if (a.type !== b.type) return a.type === 'company' ? -1 : 1;
                    return a.name.localeCompare(b.name, 'zh');
                })
                .map((d) => ({
                    record: d,
                    children: buildTree(items, d.id, depth + 1),
                    depth,
                }));
        },
        [],
    );

    // Filter by keyword
    const matchesKeyword = useCallback(
        (dept: SystemDepartmentRecord, kw: string): boolean => {
            if (!kw) return true;
            return dept.name.toLowerCase().includes(kw);
        },
        [],
    );

    // Collect all IDs that should be visible when filtered
    const visibleIds = useMemo(() => {
        const kw = treeKeyword.trim().toLowerCase();
        if (!kw) return null; // null = show all, no filter
        const ids = new Set<string>();
        const collect = (dept: SystemDepartmentRecord) => {
            if (dept.name.toLowerCase().includes(kw)) {
                // Mark self and all ancestors as visible
                let current: SystemDepartmentRecord | undefined = dept;
                while (current) {
                    ids.add(current.id);
                    current = departments.find((d) => d.id === current!.parentId);
                }
                // Mark all descendants
                const markDescendants = (parentId: string) => {
                    departments.filter((d) => d.parentId === parentId).forEach((child) => {
                        ids.add(child.id);
                        markDescendants(child.id);
                    });
                };
                markDescendants(dept.id);
            }
        };
        departments.forEach(collect);
        return ids;
    }, [treeKeyword, departments]);

    // Filter actual tree nodes
    const filterNode = useCallback(
        (node: TreeNode, kw: string): TreeNode | null => {
            if (!kw) return node;
            const filteredChildren = node.children
                .map((c) => filterNode(c, kw))
                .filter((c): c is TreeNode => c !== null);
            const selfMatches = node.record.name.toLowerCase().includes(kw);
            if (selfMatches || filteredChildren.length > 0) {
                return { ...node, children: filteredChildren };
            }
            return null;
        },
        [],
    );

    const treeRoots = useMemo(() => {
        const kw = treeKeyword.trim().toLowerCase();
        const roots = buildTree(departments, null, 0);
        if (!kw) return roots;
        return roots
            .map((r) => filterNode(r, kw))
            .filter((r): r is TreeNode => r !== null);
    }, [departments, buildTree, filterNode, treeKeyword]);

    // Auto-expand when searching
    useEffect(() => {
        if (treeKeyword.trim()) {
            // Expand all visible
            setExpandedIds((prev) => {
                const next = new Set(prev);
                const addAll = (nodes: TreeNode[]) => {
                    nodes.forEach((n) => {
                        if (n.children.length > 0) next.add(n.record.id);
                        addAll(n.children);
                    });
                };
                addAll(treeRoots);
                return next;
            });
        }
    }, [treeKeyword]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Default select first root department ──
    useEffect(() => {
        if (!selectedId && departments.length > 0) {
            const firstRoot = departments.find((d) => d.parentId === null);
            if (firstRoot) {
                setSelectedId(firstRoot.id);
            }
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Selected department ──
    const selectedDept = useMemo(
        () => departments.find((d) => d.id === selectedId) ?? null,
        [departments, selectedId],
    );

    // Build parent tree (exclude self + descendants to avoid circular ref)
    const parentTree = useMemo((): TreeSelectNode[] => {
        // Collect self + all descendant IDs
        const excludeIds = new Set<string>();
        if (selectedId) {
            const stack = [selectedId];
            while (stack.length) {
                const id = stack.pop()!;
                excludeIds.add(id);
                departments.filter((d) => d.parentId === id).forEach((d) => stack.push(d.id));
            }
        }

        const build = (parentId: string | null): TreeSelectNode[] =>
            departments
                .filter((d) => d.parentId === parentId && !excludeIds.has(d.id))
                .sort((a, b) => a.name.localeCompare(b.name, 'zh'))
                .map((d) => ({
                    id: d.id,
                    label: d.name,
                    children: build(d.id),
                }));

        return build(null);
    }, [departments, selectedId]);

    // Users in the same tenant as the selected department
    const tenantUsers = useMemo(() => {
        if (!selectedDept) return [];
        return users.filter((u) => u.tenantId === selectedDept.tenantId);
    }, [users, selectedDept]);

    const filteredTenantUsers = useMemo(() => {
        const kw = pickerKeyword.trim().toLowerCase();
        if (!kw) return tenantUsers;
        return tenantUsers.filter(
            (u) => u.displayName.toLowerCase().includes(kw),
        );
    }, [tenantUsers, pickerKeyword]);

    const pickerPagination = useMemo(
        () => paginateItems(filteredTenantUsers, pickerPage, Number(pickerPageSize)),
        [filteredTenantUsers, pickerPage, pickerPageSize],
    );

    useEffect(() => {
        setPickerPage(1);
        setPickerJumpPage('1');
    }, [pickerKeyword, pickerPageSize]);

    useEffect(() => {
        setPickerJumpPage(String(pickerPagination.currentPage));
    }, [pickerPagination.currentPage]);

    const handlePickerSearch = () => {
        setPickerKeyword(pickerDraftKeyword.trim());
    };

    const handleSelectUser = (user: SystemUserRecord) => {
        setForm((prev) => ({ ...prev, head: user.displayName, phone: user.phone }));
        setPickerOpen(false);
        setPickerDraftKeyword('');
        setPickerKeyword('');
        setSelectedUserId(null);
        setPickerPage(1);
    };

    // Load form from selected department
    useEffect(() => {
        if (selectedDept && !addMode) {
            setForm({
                name: selectedDept.name,
                parentId: selectedDept.parentId ?? '',
                code: selectedDept.code,
                type: selectedDept.type,
                head: selectedDept.head,
                phone: selectedDept.phone,
                notes: selectedDept.notes,
            });
            setIsEditing(false);
        }
    }, [selectedDept, addMode]);

    // ── Tree actions ──
    const handleSelect = (id: string) => {
        setSelectedId(id);
        setAddMode(false);
        setIsEditing(false);
    };

    const toggleExpand = (id: string) => {
        setExpandedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleAddChild = () => {
        setAddMode(true);
        setIsEditing(true);
        const parentDept = selectedDept;
        setForm({
            ...EMPTY_FORM,
            parentId: parentDept?.id ?? '',
            code: generateDeptCode(),
        });
    };

    const handleAddRoot = () => {
        setAddMode(true);
        setIsEditing(true);
        setSelectedId(null);
        setForm({
            ...EMPTY_FORM,
            code: generateDeptCode(),
            type: 'company',
        });
    };

    const handleEdit = () => {
        setIsEditing(true);
        // form already loaded from selectedDept
    };

    const handleCancelEdit = () => {
        if (addMode) {
            // If adding, revert to previous selection
            setAddMode(false);
            setIsEditing(false);
            if (selectedDept) {
                setForm({
                    name: selectedDept.name,
                    parentId: selectedDept.parentId ?? '',
                    code: selectedDept.code,
                    type: selectedDept.type,
                    head: selectedDept.head,
                    phone: selectedDept.phone,
                    notes: selectedDept.notes,
                });
            } else {
                setSelectedId(departments[0]?.id ?? null);
            }
            return;
        }
        // Cancel editing, revert
        setIsEditing(false);
        if (selectedDept) {
            setForm({
                name: selectedDept.name,
                parentId: selectedDept.parentId ?? '',
                code: selectedDept.code,
                type: selectedDept.type,
                head: selectedDept.head,
                phone: selectedDept.phone,
                notes: selectedDept.notes,
            });
        }
    };

    const handleSave = () => {
        if (!form.name.trim()) {
            showToast('请输入机构名称');
            return;
        }
        if (!form.code.trim()) {
            showToast('请输入机构编码');
            return;
        }

        if (addMode) {
            const newDept: SystemDepartmentRecord = {
                id: generateDeptId(),
                tenantId: form.parentId
                    ? departments.find((d) => d.id === form.parentId)?.tenantId ?? 'tenant-jiahuan'
                    : 'tenant-jiahuan',
                parentId: form.parentId || null,
                name: form.name.trim(),
                code: form.code.trim(),
                type: form.type,
                head: form.head.trim(),
                phone: form.phone.trim(),
                notes: form.notes.trim(),
            };
            onUpdateDepartments((prev) => [...prev, newDept]);
            showToast('部门新增成功', 'success');
            setAddMode(false);
            setIsEditing(false);
            setSelectedId(newDept.id);
            // Auto-expand parent
            if (newDept.parentId) {
                setExpandedIds((prev) => new Set(prev).add(newDept.parentId!));
            }
            return;
        }

        if (selectedDept) {
            onUpdateDepartments((prev) =>
                prev.map((d) =>
                    d.id === selectedDept.id
                        ? {
                              ...d,
                              name: form.name.trim(),
                              parentId: form.parentId || null,
                              code: form.code.trim(),
                              type: form.type,
                              head: form.head.trim(),
                              phone: form.phone.trim(),
                              notes: form.notes.trim(),
                          }
                        : d,
                ),
            );
            showToast('部门保存成功', 'success');
            setIsEditing(false);
        }
    };

    const handleDelete = () => {
        if (!deleteTarget) return;
        // Check children
        const hasChildren = departments.some((d) => d.parentId === deleteTarget.id);
        if (hasChildren) {
            showToast('请先删除子部门');
            setDeleteTarget(null);
            return;
        }
        onUpdateDepartments((prev) => prev.filter((d) => d.id !== deleteTarget.id));
        if (selectedId === deleteTarget.id) {
            setSelectedId(null);
        }
        showToast('部门已删除', 'success');
        setDeleteTarget(null);
    };

    const handleDeleteClick = () => {
        if (!selectedDept) {
            showToast('请先选择一个部门');
            return;
        }
        setDeleteTarget(selectedDept);
    };

    // ── Tree rendering ──
    const renderTreeNode = (node: TreeNode): React.ReactNode => {
        const isExpanded = expandedIds.has(node.record.id);
        const isSelected = selectedId === node.record.id;
        const hasChildren = node.children.length > 0;

        return (
            <li key={node.record.id}>
                <div
                    className={`dm-tree-node ${isSelected ? 'is-active' : ''}`}
                    style={{ paddingLeft: `${node.depth * 16 + 4}px` }}
                    onClick={() => handleSelect(node.record.id)}
                >
                    {hasChildren ? (
                        <button
                            type="button"
                            className="dm-tree-toggle"
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleExpand(node.record.id);
                            }}
                            aria-label={isExpanded ? '收起' : '展开'}
                        >
                            <TreeToggleIcon expanded={isExpanded} />
                        </button>
                    ) : (
                        <span className="dm-tree-spacer" />
                    )}
                    <span className="dm-tree-name">{node.record.name}</span>
                </div>
                {isExpanded && hasChildren && (
                    <ul className="dm-tree-list">
                        {node.children.map((child) => renderTreeNode(child))}
                    </ul>
                )}
            </li>
        );
    };

    // ── Render form field ──
    const renderField = (
        label: string,
        required: boolean,
        content: React.ReactNode,
    ) => (
        <div className="dm-form-row">
            <label className="dm-form-label">
                {required && <span className="dm-required">*</span>}
                {label}
            </label>
            <div className="dm-form-control">{content}</div>
        </div>
    );

    // ── Sidebar ──
    const sidebar = (
        <SystemManagementSidebar
            pageId="dept-mgmt"
            onNavigate={onNavigate}
            onUnavailable={(label) => showToast(`${label}功能开发中`)}
        />
    );

    // ── Readonly display ──
    const parentName = selectedDept?.parentId
        ? departments.find((d) => d.id === selectedDept.parentId)?.name ?? '—'
        : '无';

    const typeLabel = selectedDept?.type === 'company' ? '公司' : '部门';

    // ── Main render ──
    return (
        <AppShell
            activeTopTab="系统管理"
            sidebar={sidebar}
            onNavigateMessageCenter={onNavigateMessageCenter}
            onNavigateSystemManagement={() => onNavigate('dept-mgmt')}
            onTopTabChange={(tab) => {
                if (tab === '设备接入') onNavigateDeviceAccess();
                if (tab === '消息中心') onNavigateMessageCenter();
            }}
        >
            <div className="dm-page">
                <div className="crumb">系统管理 / 部门管理</div>

                <div className="dm-split">
                    {/* ── Left: Tree ── */}
                    <section className="panel dm-tree-panel">
                        <div className="dm-tree-search">
                            <ClearableInput
                                type="text"
                                placeholder="请输入部门名称"
                                value={treeKeyword}
                                onChange={(e) => setTreeKeyword(e.target.value)}
                            />
                            <Search size={14} className="dm-tree-search-icon" />
                        </div>

                        <div className="dm-tree-toolbar">
                            <button type="button" className="pm-btn pm-btn-primary" onClick={handleAddRoot}>
                                <Plus size={14} />
                                添加
                            </button>
                            <button type="button" className="pm-btn pm-btn-ghost" onClick={handleDeleteClick}>
                                <Trash2 size={14} />
                                删除
                            </button>
                        </div>

                        <div className="dm-tree-body">
                            {treeRoots.length === 0 ? (
                                <p className="dm-tree-empty">
                                    {treeKeyword ? '无匹配部门' : '暂无部门'}
                                </p>
                            ) : (
                                <ul className="dm-tree-list">
                                    {treeRoots.map((root) => renderTreeNode(root))}
                                </ul>
                            )}
                        </div>
                    </section>

                    {/* ── Right: Detail ── */}
                    <section className="panel dm-detail-panel">
                        <h3>基本信息</h3>

                        {!selectedDept && !addMode ? (
                            <div className="dm-detail-empty">
                                请在左侧选择部门查看详情
                            </div>
                        ) : (
                            <div className="dm-form">
                                <div className="dm-form-fields">
                                    {renderField('机构名称', isEditing,
                                        isEditing ? (
                                            <ClearableInput
                                                type="text"
                                                placeholder="请输入机构名称"
                                                value={form.name}
                                                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                                            />
                                        ) : (
                                            <span>{selectedDept?.name ?? '—'}</span>
                                        ),
                                    )}

                                    {renderField('上级机构', false,
                                        isEditing ? (
                                            <ElTreeSelect
                                                value={form.parentId}
                                                tree={parentTree}
                                                placeholder="无"
                                                showAllOption={false}
                                                size="medium"
                                                onChange={(v: string) => setForm((prev) => ({ ...prev, parentId: v }))}
                                            />
                                        ) : (
                                            <span>{parentName}</span>
                                        ),
                                    )}

                                    {renderField('机构编码', isEditing,
                                        isEditing ? (
                                            <input
                                                type="text"
                                                placeholder="系统自动生成"
                                                value={form.code}
                                                readOnly
                                                disabled
                                                className="is-readonly"
                                            />
                                        ) : (
                                            <span>{selectedDept?.code ?? '—'}</span>
                                        ),
                                    )}

                                    {renderField('机构类型', isEditing,
                                        isEditing ? (
                                            <div className="dm-radio-group">
                                                <label className="dm-radio">
                                                    <input
                                                        type="radio"
                                                        name="deptType"
                                                        checked={form.type === 'company'}
                                                        onChange={() => setForm((prev) => ({ ...prev, type: 'company' }))}
                                                    />
                                                    公司
                                                </label>
                                                <label className="dm-radio">
                                                    <input
                                                        type="radio"
                                                        name="deptType"
                                                        checked={form.type === 'department'}
                                                        onChange={() => setForm((prev) => ({ ...prev, type: 'department' }))}
                                                    />
                                                    部门
                                                </label>
                                            </div>
                                        ) : (
                                            <span>{typeLabel}</span>
                                        ),
                                    )}

                                    {renderField('机构负责人', isEditing,
                                        isEditing ? (
                                            <div className="dm-head-picker">
                                                <input
                                                    type="text"
                                                    placeholder="请选择负责人"
                                                    value={form.head}
                                                    readOnly
                                                    className="is-readonly"
                                                />
                                                <button
                                                    type="button"
                                                    className="dm-select-btn"
                                                    onClick={() => {
                                                        setPickerDraftKeyword('');
                                                        setPickerKeyword('');
                                                        setSelectedUserId(null);
                                                        setPickerPage(1);
                                                        setPickerPageSize('10');
                                                        setPickerOpen(true);
                                                    }}
                                                >
                                                    选择
                                                </button>
                                            </div>
                                        ) : (
                                            <span>{selectedDept?.head || '—'}</span>
                                        ),
                                    )}

                                    {renderField('手机号码', isEditing,
                                        isEditing ? (
                                            <ClearableInput
                                                type="text"
                                                placeholder="请输入手机号码"
                                                value={form.phone}
                                                onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                                            />
                                        ) : (
                                            <span>{selectedDept?.phone || '—'}</span>
                                        ),
                                    )}

                                    {renderField('备注', false,  // not required in screenshot but has asterisk
                                        isEditing ? (
                                            <ClearableInput
                                                type="text"
                                                placeholder="请输入备注"
                                                value={form.notes}
                                                onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                                            />
                                        ) : (
                                            <span>{selectedDept?.notes || '—'}</span>
                                        ),
                                    )}
                                </div>

                                <div className="dm-form-actions">
                                    {isEditing ? (
                                        <>
                                            <button type="button" className="pm-btn pm-btn-ghost" onClick={handleCancelEdit}>
                                                取消
                                            </button>
                                            <button type="button" className="pm-btn pm-btn-primary" onClick={handleSave}>
                                                保存
                                            </button>
                                        </>
                                    ) : (
                                        <button type="button" className="pm-btn pm-btn-primary" onClick={handleEdit}>
                                            编辑
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </section>
                </div>
            </div>

            {/* ── User Picker Drawer ── */}
            {pickerOpen && (
                <div
                    className="iot-dialog-mask"
                    role="presentation"
                    onClick={() => {
                        setPickerOpen(false);
                        setPickerDraftKeyword('');
                        setPickerKeyword('');
                        setSelectedUserId(null);
                        setPickerPage(1);
                    }}
                >
                    <aside
                        className="iot-view-drawer dm-picker-drawer"
                        role="dialog"
                        aria-modal="true"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="iot-dialog__head">
                            <h3>选择部门负责人</h3>
                            <button
                                type="button"
                                className="iot-dialog__close"
                                onClick={() => {
                                    setPickerOpen(false);
                                    setPickerDraftKeyword('');
                                    setPickerKeyword('');
                                    setSelectedUserId(null);
                                    setPickerPage(1);
                                }}
                                aria-label="关闭"
                            >
                                ×
                            </button>
                        </div>
                        <div className="iot-view-drawer__body">
                            <div className="dm-picker-search">
                                <div className="pm-filter-field">
                                    <span className="pm-filter-label">用户名称：</span>
                                    <ClearableInput
                                        type="text"
                                        className="pm-filter-input"
                                        placeholder="请输入用户名称"
                                        value={pickerDraftKeyword}
                                        onChange={(e) => setPickerDraftKeyword(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handlePickerSearch();
                                        }}
                                    />
                                </div>
                                <button type="button" className="pm-btn pm-btn-primary" onClick={handlePickerSearch}>
                                    <Search size={14} />
                                    查询
                                </button>
                            </div>

                            <table className="rm-table" style={{ marginTop: 12 }}>
                                <thead>
                                    <tr>
                                        <th>用户名称</th>
                                        <th>手机号码</th>
                                        <th>所属角色</th>
                                        <th>所属部门</th>
                                        <th style={{ width: 64 }}>选择</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pickerPagination.items.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px 12px' }}>
                                                暂无匹配用户
                                            </td>
                                        </tr>
                                    ) : (
                                        pickerPagination.items.map((u) => {
                                            const deptName = departments.find((d) => d.id === u.departmentId)?.name ?? '—';
                                            return (
                                                <tr
                                                    key={u.id}
                                                    className="dm-picker-row"
                                                    onClick={() => setSelectedUserId(u.id)}
                                                >
                                                    <td>{u.displayName}</td>
                                                    <td>{u.phone}</td>
                                                    <td>{getRoleLabel(SYSTEM_ROLES, u.roleId)}</td>
                                                    <td>{deptName}</td>
                                                    <td style={{ textAlign: 'center' }}>
                                                        <input
                                                            type="radio"
                                                            name="pickerUser"
                                                            checked={selectedUserId === u.id}
                                                            onChange={() => setSelectedUserId(u.id)}
                                                        />
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>

                            <ListPagination
                                total={pickerPagination.total}
                                currentPage={pickerPagination.currentPage}
                                totalPages={pickerPagination.totalPages}
                                pageSize={pickerPageSize}
                                jumpPage={pickerJumpPage}
                                onPageChange={setPickerPage}
                                onPageSizeChange={setPickerPageSize}
                                onJumpPageChange={setPickerJumpPage}
                            />
                        </div>
                        <div className="iot-dialog__foot">
                            <button
                                type="button"
                                className="pm-btn pm-btn-ghost"
                                onClick={() => {
                                    setPickerOpen(false);
                                    setPickerDraftKeyword('');
                                    setPickerKeyword('');
                                    setSelectedUserId(null);
                                    setPickerPage(1);
                                }}
                            >
                                取消
                            </button>
                            <button
                                type="button"
                                className="pm-btn pm-btn-primary"
                                disabled={!selectedUserId}
                                onClick={() => {
                                    const user = users.find((u) => u.id === selectedUserId);
                                    if (user) handleSelectUser(user);
                                }}
                            >
                                确定
                            </button>
                        </div>
                    </aside>
                </div>
            )}

            {/* ── Delete Confirm ── */}
            {deleteTarget ? (
                <ConfirmDialog
                    title="删除部门"
                    message={`确定删除部门"${deleteTarget.name}"吗？若该部门下存在子部门，请先删除子部门。`}
                    onClose={() => setDeleteTarget(null)}
                    onConfirm={handleDelete}
                />
            ) : null}

            {/* ── Toast ── */}
            <IotToast toast={toast} />
        </AppShell>
    );
}

export { createInitialDepartments };
