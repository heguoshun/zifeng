import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import TreeToggleIcon from './TreeToggleIcon';
import {
    DEFAULT_TREE_EXPANDED,
    getTreeNodeLabel,
    type TreeSelectNode,
} from '../data/orgHierarchy';

type ElTreeSelectProps = {
    value: string;
    tree: TreeSelectNode[];
    onChange: (value: string) => void;
    className?: string;
    size?: 'small' | 'medium';
    placeholder?: string;
    dropdownAlign?: 'left' | 'right';
    defaultExpanded?: Record<string, boolean>;
    showAllOption?: boolean;
    showNoneOption?: boolean;
    noneLabel?: string;
};

function TreeOptions({
    nodes,
    depth,
    value,
    expanded,
    onToggle,
    onSelect,
}: {
    nodes: TreeSelectNode[];
    depth: number;
    value: string;
    expanded: Record<string, boolean>;
    onToggle: (id: string) => void;
    onSelect: (id: string) => void;
}) {
    return (
        <>
            {nodes.map((node) => {
                const hasChildren = Boolean(node.children?.length);
                const isExpanded = expanded[node.id];
                const isSelected = value === node.id;
                const isDisabled = node.selectable === false;

                return (
                    <React.Fragment key={node.id}>
                        <li>
                            <div
                                className={`el-tree-select-node ${isSelected ? 'is-selected' : ''} ${isDisabled ? 'is-disabled' : ''}`.trim()}
                                style={{ paddingLeft: `${12 + depth * 16}px` }}
                            >
                                {hasChildren ? (
                                    <button
                                        type="button"
                                        className="el-tree-select-node__toggle"
                                        aria-label={isExpanded ? '收起' : '展开'}
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            onToggle(node.id);
                                        }}
                                    >
                                        <TreeToggleIcon expanded={isExpanded} />
                                    </button>
                                ) : (
                                    <span className="el-tree-select-node__spacer" />
                                )}
                                <button
                                    type="button"
                                    className="el-tree-select-node__label"
                                    disabled={isDisabled}
                                    onClick={() => {
                                        if (isDisabled) return;
                                        onSelect(node.id);
                                    }}
                                >
                                    {node.label}
                                </button>
                            </div>
                        </li>
                        {hasChildren && isExpanded && (
                            <TreeOptions
                                nodes={node.children ?? []}
                                depth={depth + 1}
                                value={value}
                                expanded={expanded}
                                onToggle={onToggle}
                                onSelect={onSelect}
                            />
                        )}
                    </React.Fragment>
                );
            })}
        </>
    );
}

export default function ElTreeSelect({
    value,
    tree,
    onChange,
    className = '',
    size = 'small',
    placeholder = '全部',
    dropdownAlign = 'left',
    defaultExpanded = DEFAULT_TREE_EXPANDED,
    showAllOption = true,
    showNoneOption = false,
    noneLabel = '无',
}: ElTreeSelectProps) {
    const [open, setOpen] = useState(false);
    const [expanded, setExpanded] = useState(defaultExpanded);
    const wrapRef = useRef<HTMLDivElement>(null);

    const displayLabel = useMemo(() => {
        if (value === '' && showNoneOption) return noneLabel;
        if (!value || value === 'all') return placeholder;
        return getTreeNodeLabel(tree, value);
    }, [noneLabel, placeholder, showNoneOption, tree, value]);

    const isPlaceholder = value === '' ? !showNoneOption : (!value || value === 'all');

    useEffect(() => {
        if (!open) return undefined;

        const handleClickOutside = (event: MouseEvent) => {
            if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [open]);

    return (
        <div
            className={`el-select el-tree-select ${size === 'medium' ? 'el-select--medium' : ''} ${open ? 'is-open' : ''} ${className}`.trim()}
            ref={wrapRef}
        >
            <button
                type="button"
                className="el-select__wrapper"
                onClick={() => setOpen((prev) => !prev)}
            >
                <span className={`el-select__selected ${isPlaceholder ? 'is-placeholder' : ''}`.trim()}>
                    {displayLabel}
                </span>
                <ChevronDown size={12} className="el-select__caret" />
            </button>
            {open && (
                <div className={`el-select-dropdown el-tree-select-dropdown ${dropdownAlign === 'left' ? 'el-select-dropdown--left' : ''}`}>
                    <ul className="el-tree-select-list">
                        {showNoneOption ? (
                            <li>
                                <button
                                    type="button"
                                    className={`el-tree-select-all ${value === '' ? 'is-selected' : ''}`}
                                    onClick={() => {
                                        onChange('');
                                        setOpen(false);
                                    }}
                                >
                                    {noneLabel}
                                </button>
                            </li>
                        ) : null}
                        {showAllOption && (
                            <li>
                                <button
                                    type="button"
                                    className={`el-tree-select-all ${value === 'all' ? 'is-selected' : ''}`}
                                    onClick={() => {
                                        onChange('all');
                                        setOpen(false);
                                    }}
                                >
                                    全部
                                </button>
                            </li>
                        )}
                        <TreeOptions
                            nodes={tree}
                            depth={0}
                            value={value}
                            expanded={expanded}
                            onToggle={(id) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))}
                            onSelect={(id) => {
                                onChange(id);
                                setOpen(false);
                            }}
                        />
                    </ul>
                </div>
            )}
        </div>
    );
}
