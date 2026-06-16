import React, { useEffect, useMemo, useState } from 'react';
import TreeToggleIcon from './TreeToggleIcon';
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
            expanded[node.id] = true;
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
        const children = node.children ?? [];
        if (!children.length || !(expanded[node.id] ?? true)) {
            return [current];
        }
        return [current, ...flattenVisibleTreeNodes(children, expanded, depth + 1)];
    });
}

export default function PermissionTreePanel({ selectedIds, onChange }: PermissionTreePanelProps) {
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});

    const permissionTree = useMemo(() => buildTenantPermissionTree(), []);
    const allPermissionIds = useMemo(() => flattenPermissionIds(), []);
    const visibleNodes = useMemo(
        () => flattenVisibleTreeNodes(permissionTree, expanded),
        [permissionTree, expanded],
    );

    useEffect(() => {
        setExpanded(buildDefaultExpanded(permissionTree));
    }, [permissionTree]);

    const handleToggleExpand = (id: string) => {
        setExpanded((prev) => ({ ...prev, [id]: !(prev[id] ?? true) }));
    };

    const handleToggleSelect = (node: TenantPermissionTreeNode, checked: boolean) => {
        const permissionIds = collectTreePermissionIds(node);
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

    const handleSelectAll = (checked: boolean) => {
        onChange(checked ? new Set(allPermissionIds) : new Set());
    };

    const allSelected = allPermissionIds.length > 0
        && allPermissionIds.every((id) => selectedIds.has(id));

    const isNodeChecked = (node: TenantPermissionTreeNode) => {
        const permissionIds = collectTreePermissionIds(node);
        return permissionIds.length > 0
            && permissionIds.every((id) => selectedIds.has(id));
    };

    return (
        <div className="rm-permission-panel">
            <div className="tm-authorize-toolbar">
                <label className="tm-menu-node__label">
                    <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={(event) => handleSelectAll(event.target.checked)}
                    />
                    <span>全选</span>
                </label>
                <span className="tm-authorize-hint">按功能树勾选查看、新增、编辑、删除、导出等操作权限</span>
            </div>
            <div className="tm-menu-tree rm-permission-tree">
                {visibleNodes.map(({ node, depth }) => {
                    const hasChildren = Boolean(node.children?.length);
                    const isExpanded = expanded[node.id] ?? true;
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
                                    checked={isNodeChecked(node)}
                                    onChange={(event) => handleToggleSelect(node, event.target.checked)}
                                />
                                <span>{node.label}</span>
                            </label>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
