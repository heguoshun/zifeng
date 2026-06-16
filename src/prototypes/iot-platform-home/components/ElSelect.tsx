import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';

export type ElSelectOption = {
    label: string;
    value: string;
};

export function isElSelectPlaceholderOption(option: ElSelectOption) {
    return option.value === '' && option.label.startsWith('请选择');
}

type ElSelectProps = {
    value: string;
    options: ElSelectOption[];
    onChange: (value: string) => void;
    className?: string;
    size?: 'small' | 'medium';
    dropdownAlign?: 'left' | 'right';
    disabled?: boolean;
    usePortal?: boolean;
    placeholder?: string;
};

export default function ElSelect({
    value,
    options,
    onChange,
    className = '',
    size = 'small',
    dropdownAlign = 'left',
    disabled = false,
    usePortal = false,
    placeholder,
}: ElSelectProps) {
    const [open, setOpen] = useState(false);
    const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
    const wrapRef = useRef<HTMLDivElement>(null);
    const placeholderOption = options.find(isElSelectPlaceholderOption);
    const resolvedPlaceholder = placeholder ?? placeholderOption?.label ?? '请选择';
    const dropdownOptions = options.filter((option) => !isElSelectPlaceholderOption(option));
    const selected = options.find((option) => option.value === value);
    const isPlaceholder = !value || isElSelectPlaceholderOption(selected ?? { label: '', value: value });
    const displayLabel = isPlaceholder ? resolvedPlaceholder : (selected?.label ?? value);

    useEffect(() => {
        if (!open) return undefined;

        const handleClickOutside = (event: MouseEvent) => {
            if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) {
                const target = event.target as HTMLElement;
                if (usePortal && target.closest('.el-select-dropdown')) {
                    return;
                }
                setOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [open, usePortal]);

    useEffect(() => {
        if (!open || !usePortal || !wrapRef.current) return undefined;

        const updatePosition = () => {
            if (!wrapRef.current) return;
            const rect = wrapRef.current.getBoundingClientRect();
            setDropdownStyle({
                position: 'fixed',
                top: rect.bottom + 6,
                left: dropdownAlign === 'left' ? rect.left : undefined,
                right: dropdownAlign === 'right' ? window.innerWidth - rect.right : undefined,
                minWidth: rect.width,
                zIndex: 10000,
            });
        };

        updatePosition();
        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition, true);
        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
        };
    }, [open, usePortal, dropdownAlign]);

    if (disabled) {
        return (
            <div
                className={`el-select ${size === 'medium' ? 'el-select--medium' : ''} is-disabled ${className}`.trim()}
            >
                <div className="el-select__wrapper" aria-disabled="true">
                    <span className={`el-select__selected ${isPlaceholder ? 'is-placeholder' : ''}`.trim()}>
                        {displayLabel}
                    </span>
                    <ChevronDown size={12} className="el-select__caret" />
                </div>
            </div>
        );
    }

    const dropdown = open ? (
        <div
            className={`el-select-dropdown ${dropdownAlign === 'left' ? 'el-select-dropdown--left' : ''}`}
            style={usePortal ? dropdownStyle : undefined}
        >
            <ul className="el-select-dropdown__list">
                {dropdownOptions.map((option) => (
                    <li key={option.value}>
                        <button
                            type="button"
                            className={option.value === value ? 'is-selected' : ''}
                            onClick={() => {
                                onChange(option.value);
                                setOpen(false);
                            }}
                        >
                            {option.label}
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    ) : null;

    return (
        <div
            className={`el-select ${size === 'medium' ? 'el-select--medium' : ''} ${open ? 'is-open' : ''} ${className}`.trim()}
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
            {usePortal && dropdown ? createPortal(dropdown, document.body) : dropdown}
        </div>
    );
}
