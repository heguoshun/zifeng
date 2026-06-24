import React, { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import TreeToggleIcon from './TreeToggleIcon';
import ClearableInput from './ClearableInput';
import {
    buildTenantPermissionTree,
    collectTreePermissionIds,
    flattenPermissionIds,
    type TenantPermissionTreeNode,
} from '../data/tenantMenus';

type PermissionTreePanelProps = {
    selectedIds: Set<string>;
    onChange: (ids: Set<string>) => void;
};

function buildDefaultExpanded(tree: TenantPermissionTreeNode[]): Record<string, boolean> {
    const expanded: Record<string, boolean> = {};
    const walk = (nodes: TenantPermissionTreeNode[]) => {
        nodes.forEach((node) => {
            if (node.nodeType === 'group' || node.nodeType === 'subgroup') {
                expanded[node.id] = true;
            }
            if (node.children?.length) walk(node.children);
        });
    };
    walk(tree);
    return expanded;
}

function flattenVisibleTreeNodes(
    nodes: TenantPermissionTreeNode[],
    expanded: Record<string, boolean>,
    depth = 0,
): { node: TenantPermissionTreeNode; depth: number }[] {
    return nodes.flatMap((node) => {
        const current = { node, depth };
        if (node.nodeType === 'module' || !node.children?.length || !(expanded[node.id] ?? true)) {
            return [current];
        }
        return [current, ...flattenVisibleTreeNodes(node.children, expanded, depth + 1)];
    });
}

function collectNodeLabels(node: TenantPermissionTreeNode): string[] {
    const labels = [node.label];
    node.children?.forEach((child) => {
        labels.push(...collectNodeLabels(child));
    });
    return labels;
}

function nodeMatchesKeyword(node: TenantPermissionTreeNode, keyword: string): boolean {
    const q = keyword.trim().toLowerCase();
    if (!q) return true;
    return collectNodeLabels(node).some((label) => label.toLowerCase().includes(q));
}

function isNodeChecked(node: TenantPermissionTreeNode, selectedIds: Set<string>) {
    const permissionIds = collectTreePermissionIds(node);
    return permissionIds.length > 0 && permissionIds.every((id) => selectedIds.has(id));
}

function isNodeIndeterminate(node: TenantPermissionTreeNode, selectedIds: Set<string>) {
    const permissionIds = collectTreePermissionIds(node);
    if (!permissionIds.length) return false;
    const selectedCount = permissionIds.filter((id) => selectedIds.has(id)).length;
    return selectedCount > 0 && selectedCount < permissionIds.length;
}

export default function PermissionTreePanel({ selectedIds, onChange }: PermissionTreePanelProps) {
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});
    const [keyword, setKeyword] = useState('');

    const permissionTree = useMemo(() => buildTenantPermissionTree(), []);
    const allPermissionIds = useMemo(() => flattenPermissionIds(), []);
    const visibleNodes = useMemo(
        () => flattenVisibleTreeNodes(permissionTree, expanded),
        [permissionTree, expanded],
    );

    const filteredNodes = useMemo(() => {
        const q = keyword.trim();
        if (!q) return visibleNodes;
        return visibleNodes.filter(({ node }) => nodeMatchesKeyword(node, q));
    }, [visibleNodes, keyword]);

    useEffect(() => {
        setExpanded(buildDefaultExpanded(permissionTree));
    }, [permissionTree]);

    const handleToggleExpand = (id: string) => {
        setExpanded((prev) => ({ ...prev, [id]: !(prev[id] ?? true) }));
    };

    const applyPermissionChange = (permissionIds: string[], checked: boolean) => {
        const next = new Set(selectedIds);
        permissionIds.forEach((id) => {
            if (checked) {
                next.add(id);
            } else {
                next.delete(id);
            }
        });
        onChange(next);
    };

    const handleToggleSelect = (node: TenantPermissionTreeNode, checked: boolean) => {
        applyPermissionChange(collectTreePermissionIds(node), checked);
    };

    const handleSelectAll = (checked: boolean) => {
        onChange(checked ? new Set(allPermissionIds) : new Set());
    };

    const allSelected = allPermissionIds.length > 0
        && allPermissionIds.every((id) => selectedIds.has(id));

    return (
        <div className="rm-permission-panel">
            <div className="rm-permission-toolbar">
                <div className="rm-permission-toolbar__left">
                    <label className="rm-permission-select-all">
                        <input
                            type="checkbox"
                            checked={allSelected}
                            onChange={(event) => handleSelectAll(event.target.checked)}
                        />
                        <span>全选</span>
                    </label>
                    <span className="rm-permission-count">
                        已选 <strong>{selectedIds.size}</strong> / {allPermissionIds.length}
                    </span>
                </div>
                <label className="rm-permission-search">
                    <Search size={14} aria-hidden="true" />
                    <ClearableInput
                        type="text"
                        className="rm-permission-search__input"
                        placeholder="搜索菜单或操作"
                        value={keyword}
                        onChange={(event) => setKeyword(event.target.value)}
                    />
                </label>
            </div>

            <div className="tm-menu-tree rm-permission-tree">
                {filteredNodes.length === 0 ? (
                    <p className="rm-permission-empty">未找到匹配的权限项</p>
                ) : (
                    filteredNodes.map(({ node, depth }) => {
                        const hasChildren = Boolean(node.children?.length);
                        const isExpanded = expanded[node.id] ?? true;
                        const moduleActions = node.moduleActions ?? [];

                        if (node.nodeType === 'module') {
                            const modulePermissionIds = moduleActions.map((action) => action.permissionId);
                            const moduleChecked = modulePermissionIds.length > 0
                                && modulePermissionIds.every((id) => selectedIds.has(id));
                            const moduleIndeterminate = !moduleChecked
                                && modulePermissionIds.some((id) => selectedIds.has(id));

                            return (
                                <div
                                    key={node.id}
                                    className="rm-permission-module-row"
                                    style={{ paddingLeft: `${depth * 18 + 12}px` }}
                                >
                                    <label className="rm-permission-module-row__name">
                                        <input
                                            type="checkbox"
                                            checked={moduleChecked}
                                            ref={(input) => {
                                                if (input) {
                                                    input.indeterminate = moduleIndeterminate;
                                                }
                                            }}
                                            onChange={(event) => applyPermissionChange(
                                                modulePermissionIds,
                                                event.target.checked,
                                            )}
                                        />
                                        <span>{node.label}</span>
                                    </label>
                                    <div className="rm-permission-action-list">
                                        {moduleActions.map((action) => (
                                            <label key={action.id} className="rm-permission-action-item">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.has(action.permissionId)}
                                                    onChange={(event) => applyPermissionChange(
                                                        [action.permissionId],
                                                        event.target.checked,
                                                    )}
                                                />
                                                <span>{action.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            );
                        }

                        return (
                            <div
                                key={node.id}
                                className={`tm-menu-node tm-menu-node--${node.nodeType}`}
                                style={{ paddingLeft: `${depth * 18}px` }}
                            >
                                {hasChildren ? (
                                    <button
                                        type="button"
                                        className="tm-menu-node__toggle"
                                        onClick={() => handleToggleExpand(node.id)}
                                        aria-label={isExpanded ? '收起' : '展开'}
                                    >
                                        <TreeToggleIcon expanded={isExpanded} />
                                    </button>
                                ) : (
                                    <span className="tm-menu-node__spacer" />
                                )}
                                <label className="tm-menu-node__label">
                                    <input
                                        type="checkbox"
                                        checked={isNodeChecked(node, selectedIds)}
                                        ref={(input) => {
                                            if (input) {
                                                input.indeterminate = isNodeIndeterminate(node, selectedIds);
                                            }
                                        }}
                                        onChange={(event) => handleToggleSelect(node, event.target.checked)}
                                    />
                                    <span>{node.label}</span>
                                </label>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
