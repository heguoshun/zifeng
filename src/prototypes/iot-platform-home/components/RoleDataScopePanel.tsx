import React, { useMemo } from 'react';
import { Check, Minus } from 'lucide-react';
import TreeToggleIcon from './TreeToggleIcon';
import {
    DATA_DOMAIN_APPLY_MODULES,
    DATA_DOMAIN_CATEGORY_TREE,
    DATA_DOMAIN_LEAF_IDS,
    type ProductCategoryNode,
} from '../data/systemRoles';

type RoleDataScopePanelProps = {
    selectedIds: Set<string>;
    onChange: (ids: Set<string>) => void;
    disabled?: boolean;
    disabledHint?: string;
};

/** 收集节点及其所有后代 ID */
function collectDescendantIds(node: ProductCategoryNode): string[] {
    const ids = [node.id];
    if (node.children?.length) {
        node.children.forEach((child) => {
            ids.push(...collectDescendantIds(child));
        });
    }
    return ids;
}

/** 判断节点选中状态：'all' | 'some' | 'none' */
function getNodeCheckState(
    node: ProductCategoryNode,
    selectedIds: Set<string>,
): 'all' | 'some' | 'none' {
    const allIds = collectDescendantIds(node);
    const selectedCount = allIds.filter((id) => selectedIds.has(id)).length;
    if (selectedCount === 0) return 'none';
    if (selectedCount === allIds.length) return 'all';
    return 'some';
}

function CategoryTreeNodes({
    nodes,
    selectedIds,
    expanded,
    depth,
    onToggleExpand,
    onToggleCheck,
    disabled,
}: {
    nodes: ProductCategoryNode[];
    selectedIds: Set<string>;
    expanded: Record<string, boolean>;
    depth: number;
    onToggleExpand: (id: string) => void;
    onToggleCheck: (node: ProductCategoryNode) => void;
    disabled: boolean;
}) {
    return (
        <ul className={`pm-category-tree ${depth > 0 ? 'pm-category-tree--nested' : ''}`}>
            {nodes.map((node) => {
                const hasChildren = Boolean(node.children?.length);
                const isExpanded = expanded[node.id] ?? true;
                const checkState = getNodeCheckState(node, selectedIds);

                return (
                    <li key={node.id} className="pm-category-node">
                        <div
                            className="pm-category-item"
                            style={{ paddingLeft: `${8 + depth * 18}px` }}
                        >
                            {hasChildren ? (
                                <button
                                    type="button"
                                    className="pm-category-toggle"
                                    aria-label={isExpanded ? '收起' : '展开'}
                                    onClick={() => onToggleExpand(node.id)}
                                >
                                    <TreeToggleIcon expanded={isExpanded} />
                                </button>
                            ) : (
                                <span className="pm-category-spacer" />
                            )}
                            <label className="pm-category-checkbox-wrap" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: disabled ? 'not-allowed' : 'pointer', flex: 1, minWidth: 0 }}>
                                <span
                                    className={`pm-category-checkbox ${checkState === 'all' ? 'is-checked' : ''} ${checkState === 'some' ? 'is-indeterminate' : ''}`.trim()}
                                    onClick={(event) => {
                                        event.preventDefault();
                                        if (!disabled) onToggleCheck(node);
                                    }}
                                >
                                    {checkState === 'all' ? <Check size={14} strokeWidth={2.5} /> : null}
                                    {checkState === 'some' ? <Minus size={14} strokeWidth={2.5} /> : null}
                                </span>
                                <span className="pm-category-label" style={{ fontSize: '13px', color: 'var(--text)', userSelect: 'none' }}>{node.label}</span>
                            </label>
                        </div>
                        {hasChildren && isExpanded && (
                            <CategoryTreeNodes
                                nodes={node.children ?? []}
                                selectedIds={selectedIds}
                                expanded={expanded}
                                depth={depth + 1}
                                onToggleExpand={onToggleExpand}
                                onToggleCheck={onToggleCheck}
                                disabled={disabled}
                            />
                        )}
                    </li>
                );
            })}
        </ul>
    );
}

export default function RoleDataScopePanel({
    selectedIds,
    onChange,
    disabled = false,
    disabledHint,
}: RoleDataScopePanelProps) {
    const allLeafSelected = DATA_DOMAIN_LEAF_IDS.every((id) => selectedIds.has(id));
    const isAllScopeMode = selectedIds.size === 0;

    const [expanded, setExpanded] = React.useState<Record<string, boolean>>({
        water: true,
        dabiao: true,
    });

    const handleToggleExpand = (id: string) => {
        setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const handleToggleCheck = (node: ProductCategoryNode) => {
        if (disabled || isAllScopeMode) return;
        const allIds = collectDescendantIds(node);
        const checkState = getNodeCheckState(node, selectedIds);
        const next = new Set(selectedIds);
        if (checkState === 'all') {
            // 取消全选：移除该节点及所有后代
            allIds.forEach((id) => next.delete(id));
        } else {
            // 全选：添加该节点及所有后代
            allIds.forEach((id) => next.add(id));
        }
        onChange(next);
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            onChange(new Set(DATA_DOMAIN_LEAF_IDS));
        } else {
            onChange(new Set());
        }
    };

    const handleUseAllScopes = () => {
        onChange(new Set());
    };

    const handleUseCustomScopes = () => {
        if (isAllScopeMode) {
            onChange(new Set(['dabiao-em']));
        }
    };

    const treeNodes = useMemo(() => DATA_DOMAIN_CATEGORY_TREE, []);

    return (
        <div className={`rm-data-scope-panel ${disabled ? 'is-disabled' : ''}`.trim()}>
            <div className="rm-data-scope-segment" role="radiogroup" aria-label="数据域范围">
                <button
                    type="button"
                    role="radio"
                    aria-checked={isAllScopeMode}
                    className={`rm-data-scope-segment__item ${isAllScopeMode ? 'is-active' : ''}`.trim()}
                    disabled={disabled}
                    onClick={handleUseAllScopes}
                >
                    全部数据域
                </button>
                <button
                    type="button"
                    role="radio"
                    aria-checked={!isAllScopeMode}
                    className={`rm-data-scope-segment__item ${!isAllScopeMode ? 'is-active' : ''}`.trim()}
                    disabled={disabled}
                    onClick={handleUseCustomScopes}
                >
                    指定数据域
                </button>
            </div>

            {disabled && disabledHint ? (
                <div className="rm-form-callout rm-form-callout--info">{disabledHint}</div>
            ) : (
                <p className="rm-form-hint rm-form-hint--inline">
                    例如大表管理员仅查看与操作大表相关设备、告警与工单；户表管理员仅对应户表分类数据
                </p>
            )}

            {!disabled && (
                <div className="rm-data-scope-apply-list">
                    <span className="rm-data-scope-apply-list__label">生效范围</span>
                    <div className="rm-data-scope-apply-list__tags">
                        {DATA_DOMAIN_APPLY_MODULES.map((item) => (
                            <span key={item} className="rm-data-scope-apply-tag">{item}</span>
                        ))}
                    </div>
                </div>
            )}

            {!disabled && !isAllScopeMode && (
                <>
                    <div className="rm-data-scope-toolbar">
                        <span className="rm-data-scope-toolbar__label">选择产品分类</span>
                        <label className="rm-data-scope-select-all">
                            <input
                                type="checkbox"
                                checked={allLeafSelected}
                                onChange={(event) => handleSelectAll(event.target.checked)}
                            />
                            <span>全选</span>
                        </label>
                    </div>
                    <div style={{ maxHeight: '280px', overflow: 'auto', padding: '4px 0' }}>
                        <CategoryTreeNodes
                            nodes={treeNodes}
                            selectedIds={selectedIds}
                            expanded={expanded}
                            depth={0}
                            onToggleExpand={handleToggleExpand}
                            onToggleCheck={handleToggleCheck}
                            disabled={disabled}
                        />
                    </div>
                </>
            )}

            {!disabled && isAllScopeMode && (
                <div className="rm-data-scope-all-preview">
                    <span>当前角色可访问全部产品分类下的业务数据（含设备、告警、工单等）</span>
                </div>
            )}
        </div>
    );
}
