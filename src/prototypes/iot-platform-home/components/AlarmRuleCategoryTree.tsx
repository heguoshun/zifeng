import React from 'react';
import { MoreHorizontal } from 'lucide-react';
import TreeToggleIcon from './TreeToggleIcon';
import { buildCategoryTree, type AlarmRuleCategory, type AlarmRuleCategoryNode } from '../data/alarmRules';

type AlarmRuleCategoryTreeProps = {
    categories: AlarmRuleCategory[];
    expanded: Record<string, boolean>;
    activeId: string;
    onToggle: (id: string) => void;
    onSelect: (id: string) => void;
    onOpenMenu: (categoryId: string, event: React.MouseEvent<HTMLButtonElement>) => void;
};

function CategoryTreeNodes({
    nodes,
    expanded,
    activeId,
    depth,
    onToggle,
    onSelect,
    onOpenMenu,
}: {
    nodes: AlarmRuleCategoryNode[];
    expanded: Record<string, boolean>;
    activeId: string;
    depth: number;
    onToggle: (id: string) => void;
    onSelect: (id: string) => void;
    onOpenMenu: (categoryId: string, event: React.MouseEvent<HTMLButtonElement>) => void;
}) {
    return (
        <ul className={`arc-tree ${depth > 0 ? 'arc-tree--nested' : ''}`}>
            {nodes.map((node) => {
                const hasChildren = Boolean(node.children?.length);
                const isExpanded = expanded[node.id] ?? true;
                const isActive = activeId === node.id;

                return (
                    <li key={node.id} className="arc-tree-node">
                        <div
                            className={`arc-tree-item ${isActive ? 'is-active' : ''}`}
                            style={{ paddingLeft: `${8 + depth * 18}px` }}
                        >
                            {hasChildren ? (
                                <button
                                    type="button"
                                    className="arc-tree-toggle"
                                    aria-label={isExpanded ? '收起' : '展开'}
                                    onClick={() => onToggle(node.id)}
                                >
                                    <TreeToggleIcon expanded={isExpanded} />
                                </button>
                            ) : (
                                <span className="arc-tree-spacer" />
                            )}
                            <button
                                type="button"
                                className="arc-tree-label-btn"
                                onClick={() => onSelect(node.id)}
                            >
                                {node.name}
                            </button>
                            <button
                                type="button"
                                className="arc-tree-menu-btn"
                                aria-label="更多操作"
                                onClick={(event) => {
                                    event.stopPropagation();
                                    onOpenMenu(node.id, event);
                                }}
                            >
                                <MoreHorizontal size={14} />
                            </button>
                        </div>
                        {hasChildren && isExpanded && (
                            <CategoryTreeNodes
                                nodes={node.children ?? []}
                                expanded={expanded}
                                activeId={activeId}
                                depth={depth + 1}
                                onToggle={onToggle}
                                onSelect={onSelect}
                                onOpenMenu={onOpenMenu}
                            />
                        )}
                    </li>
                );
            })}
        </ul>
    );
}

export default function AlarmRuleCategoryTree({
    categories,
    expanded,
    activeId,
    onToggle,
    onSelect,
    onOpenMenu,
}: AlarmRuleCategoryTreeProps) {
    const treeNodes = buildCategoryTree(categories);

    return (
        <div className="arc-tree-body">
            <ul className="arc-tree">
                <li className="arc-tree-node">
                    <div
                        className={`arc-tree-item arc-tree-item--all ${activeId === 'all' ? 'is-active' : ''}`}
                        style={{ paddingLeft: '8px' }}
                    >
                        <span className="arc-tree-spacer" />
                        <button
                            type="button"
                            className="arc-tree-label-btn"
                            onClick={() => onSelect('all')}
                        >
                            全部分类
                        </button>
                    </div>
                </li>
            </ul>
            <CategoryTreeNodes
                nodes={treeNodes}
                expanded={expanded}
                activeId={activeId}
                depth={0}
                onToggle={onToggle}
                onSelect={onSelect}
                onOpenMenu={onOpenMenu}
            />
        </div>
    );
}
