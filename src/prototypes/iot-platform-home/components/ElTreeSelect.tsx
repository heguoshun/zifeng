import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import TreeToggleIcon from './TreeToggleIcon';
import { useOverlayCoordination } from './useOverlayCoordination';
import { useDismissOnOutsideMouseDown } from './useDismissOnOutsideMouseDown';
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
    filterable?: boolean;
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
    filterable = false,
}: ElTreeSelectProps) {
    const [open, setOpen] = useState(false);
    const [expanded, setExpanded] = useState(defaultExpanded);
    const [inputValue, setInputValue] = useState('');
    const wrapRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const displayLabel = useMemo(() => {
        if (value === '' && showNoneOption) return noneLabel;
        if (!value || value === 'all') return placeholder;
        return getTreeNodeLabel(tree, value);
    }, [noneLabel, placeholder, showNoneOption, tree, value]);

    const isPlaceholder = value === '' ? !showNoneOption : (!value || value === 'all');

    const flatMatches = useMemo(() => {
        if (!inputValue.trim()) return [];
        const keyword = inputValue.trim().toLowerCase();
        const result: { id: string; label: string }[] = [];
        const walk = (nodes: TreeSelectNode[]) => {
            for (const node of nodes) {
                if (node.label.toLowerCase().includes(keyword) && node.selectable !== false) {
                    result.push({ id: node.id, label: node.label });
                }
                if (node.children?.length) walk(node.children);
            }
        };
        walk(tree);
        return result;
    }, [tree, inputValue]);

    const isSearching = filterable && inputValue.trim().length > 0;

    const handleClose = useCallback(() => {
        setOpen(false);
        setInputValue('');
    }, []);

    const { claim, release } = useOverlayCoordination('select', open, handleClose, 'el-tree-select');

    const dismissSelect = useCallback(() => {
        release();
        handleClose();
    }, [release, handleClose]);

    const handleOpen = useCallback(() => {
        claim();
        setOpen(true);
    }, [claim]);

    useDismissOnOutsideMouseDown(open, wrapRef, dismissSelect);

    useEffect(() => {
        if (open && filterable) {
            requestAnimationFrame(() => {
                inputRef.current?.focus();
                inputRef.current?.select();
            });
        }
    }, [open, filterable]);

    const handleWrapperMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
        event.stopPropagation();

        const target = event.target as HTMLElement;
        if (open) {
            if (filterable && target.closest('.el-select__input')) {
                return;
            }
            return;
        }

        handleOpen();
    };

    return (
        <div
            className={`el-select el-tree-select ${size === 'medium' ? 'el-select--medium' : ''} ${open ? 'is-open' : ''} ${className}`.trim()}
            ref={wrapRef}
        >
            <div
                className={`el-select__wrapper ${open && filterable ? 'el-select__wrapper--input is-editing' : ''}`.trim()}
                role="combobox"
                aria-expanded={open}
                onMouseDown={handleWrapperMouseDown}
            >
                {open && filterable ? (
                    <input
                        ref={inputRef}
                        type="text"
                        className="el-select__input"
                        value={inputValue}
                        placeholder={isPlaceholder ? placeholder : displayLabel}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Escape') dismissSelect();
                            if (e.key === 'Enter' && flatMatches.length > 0) {
                                onChange(flatMatches[0].id);
                                dismissSelect();
                            }
                        }}
                        onClick={(event) => event.stopPropagation()}
                    />
                ) : (
                    <span className={`el-select__selected ${isPlaceholder ? 'is-placeholder' : ''}`.trim()}>
                        {displayLabel}
                    </span>
                )}
                <ChevronDown
                    size={12}
                    className="el-select__caret"
                />
            </div>
            {open && (
                <div
                    className={`el-select-dropdown el-tree-select-dropdown ${dropdownAlign === 'left' ? 'el-select-dropdown--left' : ''}`}
                    onMouseDown={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                    }}
                >
                    <ul className="el-tree-select-list">
                        {isSearching ? (
                            flatMatches.length === 0 ? (
                                <li className="el-select-dropdown__empty">无匹配项</li>
                            ) : (
                                flatMatches.map((item) => (
                                    <li key={item.id}>
                                        <button
                                            type="button"
                                            className={`el-tree-select-node__label ${value === item.id ? 'is-selected' : ''}`}
                                            style={{ paddingLeft: '28px' }}
                                            onClick={() => {
                                                onChange(item.id);
                                                dismissSelect();
                                            }}
                                        >
                                            {item.label}
                                        </button>
                                    </li>
                                ))
                            )
                        ) : (
                            <>
                                {showNoneOption ? (
                                    <li>
                                        <button
                                            type="button"
                                            className={`el-tree-select-all ${value === '' ? 'is-selected' : ''}`}
                                            onClick={() => {
                                                onChange('');
                                                dismissSelect();
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
                                                dismissSelect();
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
                                        dismissSelect();
                                    }}
                                />
                            </>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
}
