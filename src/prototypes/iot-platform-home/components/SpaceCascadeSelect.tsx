import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import type { SpaceMapNode } from '../data/spaceMapHierarchy';

type SpaceCascadeSelectProps = {
    options: SpaceMapNode[];
    valuePath: SpaceMapNode[];
    onChange: (path: SpaceMapNode[]) => void;
    disabled?: boolean;
};

function getColumns(options: SpaceMapNode[], path: SpaceMapNode[]) {
    const columns: SpaceMapNode[][] = [options];
    path.forEach((node) => {
        if (node.children?.length) {
            columns.push(node.children);
        }
    });
    return columns;
}

export default function SpaceCascadeSelect({
    options,
    valuePath,
    onChange,
    disabled = false,
}: SpaceCascadeSelectProps) {
    const wrapRef = useRef<HTMLDivElement>(null);
    const [open, setOpen] = useState(false);
    const [activePath, setActivePath] = useState<SpaceMapNode[]>(valuePath);

    useEffect(() => {
        setActivePath(valuePath);
    }, [valuePath]);

    useEffect(() => {
        if (!open) return undefined;

        const handleClickOutside = (event: MouseEvent) => {
            if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) {
                setOpen(false);
                setActivePath(valuePath);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [open, valuePath]);

    const columns = useMemo(() => getColumns(options, activePath), [options, activePath]);

    const handleSelect = (node: SpaceMapNode, columnIndex: number) => {
        const nextPath = [...activePath.slice(0, columnIndex), node];
        setActivePath(nextPath);
        onChange(nextPath);

        if (!node.children?.length) {
            setOpen(false);
        }
    };

    const displayLabel = valuePath.length
        ? valuePath.map((node) => node.label).join(' / ')
        : '请选择空间';

    return (
        <div className={`dcp-space-cascade ${open ? 'is-open' : ''}`.trim()} ref={wrapRef}>
            <button
                type="button"
                className="dcp-space-cascade__trigger"
                disabled={disabled}
                onClick={() => {
                    if (disabled) return;
                    setOpen((prev) => !prev);
                    setActivePath(valuePath);
                }}
            >
                <span className={valuePath.length ? '' : 'is-placeholder'}>{displayLabel}</span>
            </button>
            {open && (
                <div className="dcp-space-cascade__panel">
                    {columns.map((column, columnIndex) => (
                        <ul key={`${columnIndex}-${column.map((item) => item.id).join('-')}`} className="dcp-space-cascade__column">
                            {column.map((node) => {
                                const selected = activePath[columnIndex]?.id === node.id;
                                const hasChildren = Boolean(node.children?.length);
                                return (
                                    <li key={node.id}>
                                        <button
                                            type="button"
                                            className={`dcp-space-cascade__option ${selected ? 'is-selected' : ''}`.trim()}
                                            onClick={() => handleSelect(node, columnIndex)}
                                        >
                                            <span>{node.label}</span>
                                            {hasChildren && <ChevronRight size={14} aria-hidden />}
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    ))}
                </div>
            )}
        </div>
    );
}
