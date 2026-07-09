import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import TreeToggleIcon from './TreeToggleIcon';
import type { TenantRecord } from '../data/tenants';
import {
    buildTenantPermissionTree,
    collectTreePermissionIds,
    flattenPermissionIds,
    resolveTenantPermissionIds,
    type TenantPermissionTreeNode,
} from '../data/tenantMenus';
import '../product-create.css';
import '../tenant-management.css';

type TenantAuthorizeDrawerProps = {
    open: boolean;
    tenant: TenantRecord | null;
    onClose: () => void;
    onConfirm: (permissionIds: string[]) => void;
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

export default function TenantAuthorizeDrawer({
    open,
    tenant,
    onClose,
    onConfirm,
}: TenantAuthorizeDrawerProps) {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});

    const permissionTree = useMemo(() => buildTenantPermissionTree(), []);
    const allPermissionIds = useMemo(() => flattenPermissionIds(), []);
    const visibleNodes = useMemo(
        () => flattenVisibleTreeNodes(permissionTree, expanded),
        [permissionTree, expanded],
    );

    useEffect(() => {
        if (!open || !tenant) return;
        setSelectedIds(new Set(resolveTenantPermissionIds(tenant)));
        setExpanded(buildDefaultExpanded(permissionTree));
    }, [open, tenant, permissionTree]);

    useEffect(() => {
        if (!open) return undefined;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [open]);

    if (!open || !tenant) return null;

    const handleToggleExpand = (id: string) => {
        setExpanded((prev) => ({ ...prev, [id]: !(prev[id] ?? true) }));
    };

    const handleToggleSelect = (node: TenantPermissionTreeNode, checked: boolean) => {
        const permissionIds = collectTreePermissionIds(node);
        setSelectedIds((prev) => {
            const next = new Set(prev);
            permissionIds.forEach((id) => {
                if (checked) {
                    next.add(id);
                } else {
                    next.delete(id);
                }
            });
            return next;
        });
    };

    const handleSelectAll = (checked: boolean) => {
        setSelectedIds(checked ? new Set(allPermissionIds) : new Set());
    };

    const handleConfirm = () => {
        onConfirm(Array.from(selectedIds));
    };

    const handleMaskMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
        if (event.target === event.currentTarget) {
            onClose();
        }
    };

    const allSelected = allPermissionIds.length > 0
        && allPermissionIds.every((id) => selectedIds.has(id));

    const isNodeChecked = (node: TenantPermissionTreeNode) => {
        const permissionIds = collectTreePermissionIds(node);
        return permissionIds.length > 0
            && permissionIds.every((id) => selectedIds.has(id));
    };

    return createPortal(
        <div className="pcp-drawer-mask" role="presentation" onMouseDown={handleMaskMouseDown}>
            <aside
                className="pcp-drawer tm-authorize-drawer"
                role="dialog"
                aria-modal="true"
                aria-labelledby="tm-authorize-drawer-title"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <div className="pcp-drawer__head">
                    <h3 id="tm-authorize-drawer-title">租户授权 - {tenant.name}</h3>
                    <button type="button" className="pcp-drawer__close" onClick={onClose} aria-label="关闭">×</button>
                </div>
                <div className="pcp-drawer__body">
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
                    <div className="tm-menu-tree">
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
                <div className="pcp-drawer__foot">
                    <button type="button" className="pm-btn pm-btn-ghost" onClick={onClose}>取消</button>
                    <button type="button" className="pm-btn pm-btn-primary" onClick={handleConfirm}>确定</button>
                </div>
            </aside>
        </div>,
        document.body,
    );
}
