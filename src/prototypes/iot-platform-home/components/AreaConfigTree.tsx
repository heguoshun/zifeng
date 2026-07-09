import React from 'react';
import TreeToggleIcon from './TreeToggleIcon';
import type { AreaSelectorNode } from '../data/largeMeters';

type AreaConfigTreeProps = {
    nodes: AreaSelectorNode[];
    expanded: Record<string, boolean>;
    activeId: string | null;
    depth?: number;
    onToggle: (id: string) => void;
    onSelect: (id: string) => void;
};

export default function AreaConfigTree({
    nodes,
    expanded,
    activeId,
    depth = 0,
    onToggle,
    onSelect,
}: AreaConfigTreeProps) {
    return (
        <ul className={`pm-category-tree ${depth > 0 ? 'pm-category-tree--nested' : ''}`}>
            {nodes.map((node) => {
                const hasChildren = Boolean(node.children?.length);
                const isExpanded = expanded[node.id] ?? true;
                const isActive = activeId === node.id;

                return (
                    <li key={node.id} className="pm-category-node">
                        <div
                            className={`pm-category-item ${isActive ? 'is-active' : ''}`}
                            style={{ paddingLeft: `${8 + depth * 18}px` }}
                        >
                            {hasChildren ? (
                                <button
                                    type="button"
                                    className="pm-category-toggle"
                                    aria-label={isExpanded ? '收起' : '展开'}
                                    onClick={() => onToggle(node.id)}
                                >
                                    <TreeToggleIcon expanded={isExpanded} />
                                </button>
                            ) : (
                                <span className="pm-category-spacer" />
                            )}
                            <button
                                type="button"
                                className="pm-category-label-btn"
                                onClick={() => onSelect(node.id)}
                            >
                                <span className="pm-category-label">{node.label}</span>
                            </button>
                        </div>
                        {hasChildren && isExpanded && (
                            <AreaConfigTree
                                nodes={node.children ?? []}
                                expanded={expanded}
                                activeId={activeId}
                                depth={depth + 1}
                                onToggle={onToggle}
                                onSelect={onSelect}
                            />
                        )}
                    </li>
                );
            })}
        </ul>
    );
}
