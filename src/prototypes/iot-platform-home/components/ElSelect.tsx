import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';
import { useOverlayCoordination } from './useOverlayCoordination';
import { useDismissOnOutsideMouseDown } from './useDismissOnOutsideMouseDown';

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
    dropdownDirection?: 'down' | 'up';
    disabled?: boolean;
    usePortal?: boolean;
    placeholder?: string;
    filterable?: boolean;
};

export default function ElSelect({
    value,
    options,
    onChange,
    className = '',
    size = 'small',
    dropdownAlign = 'left',
    dropdownDirection = 'down',
    disabled = false,
    usePortal = false,
    placeholder,
    filterable = false,
}: ElSelectProps) {
    const [open, setOpen] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
    const wrapRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const placeholderOption = options.find(isElSelectPlaceholderOption);
    const resolvedPlaceholder = placeholder ?? placeholderOption?.label ?? '请选择';
    const dropdownOptions = useMemo(
        () => options.filter((option) => !isElSelectPlaceholderOption(option)),
        [options],
    );

    const filteredOptions = useMemo(() => {
        if (!open || !filterable || !inputValue.trim()) return dropdownOptions;
        const keyword = inputValue.trim().toLowerCase();
        return dropdownOptions.filter((option) => option.label.toLowerCase().includes(keyword));
    }, [dropdownOptions, inputValue, open, filterable]);

    const selected = options.find((option) => option.value === value);
    const isPlaceholder = !value || isElSelectPlaceholderOption(selected ?? { label: '', value: value });
    const displayLabel = isPlaceholder ? resolvedPlaceholder : (selected?.label ?? value);

    const handleClose = useCallback(() => {
        setOpen(false);
        setInputValue('');
    }, []);

    const { claim, release } = useOverlayCoordination('select', open, handleClose, 'el-select');

    const dismissSelect = useCallback(() => {
        release();
        handleClose();
    }, [release, handleClose]);

    const handleOpen = useCallback(() => {
        claim();
        setOpen(true);
        setInputValue('');
    }, [claim]);

    const ignorePortalDropdown = useCallback(
        (target: HTMLElement) => usePortal && Boolean(target.closest('.el-select-dropdown')),
        [usePortal],
    );
    useDismissOnOutsideMouseDown(open, wrapRef, dismissSelect, ignorePortalDropdown);

    useEffect(() => {
        if (open && filterable) {
            requestAnimationFrame(() => {
                inputRef.current?.focus();
                inputRef.current?.select();
            });
        }
    }, [open, filterable]);

    useEffect(() => {
        if (!open || !usePortal || !wrapRef.current) return undefined;

        const updatePosition = () => {
            if (!wrapRef.current) return;
            const rect = wrapRef.current.getBoundingClientRect();
            setDropdownStyle({
                position: 'fixed',
                top: dropdownDirection === 'up' ? 'auto' : rect.bottom + 6,
                bottom: dropdownDirection === 'up' ? window.innerHeight - rect.top + 6 : 'auto',
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
    }, [open, usePortal, dropdownAlign, dropdownDirection]);

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

    const dropdown = open ? (
        <div
            className={`el-select-dropdown ${dropdownAlign === 'left' ? 'el-select-dropdown--left' : ''} ${dropdownDirection === 'up' ? 'el-select-dropdown--up' : ''}`}
            style={usePortal ? dropdownStyle : undefined}
            onMouseDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
            }}
        >
            <ul className="el-select-dropdown__list">
                {filteredOptions.length === 0 ? (
                    <li className="el-select-dropdown__empty">无匹配项</li>
                ) : (
                    filteredOptions.map((option) => (
                        <li key={option.value}>
                            <button
                                type="button"
                                className={option.value === value ? 'is-selected' : ''}
                                onClick={() => {
                                    onChange(option.value);
                                    dismissSelect();
                                }}
                            >
                                {option.label}
                            </button>
                        </li>
                    ))
                )}
            </ul>
        </div>
    ) : null;

    return (
        <div
            className={`el-select ${size === 'medium' ? 'el-select--medium' : ''} ${open ? 'is-open' : ''} ${className}`.trim()}
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
                        placeholder={resolvedPlaceholder}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Escape') dismissSelect();
                            if (e.key === 'Enter' && filteredOptions.length > 0) {
                                onChange(filteredOptions[0].value);
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
            {usePortal && dropdown ? createPortal(dropdown, document.body) : dropdown}
        </div>
    );
}
