import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { isElSelectPlaceholderOption, type ElSelectOption } from './ElSelect';
import { useOverlayCoordination } from './useOverlayCoordination';
import { useDismissOnOutsideMouseDown } from './useDismissOnOutsideMouseDown';

type ElMultiSelectProps = {
    value: string[];
    options: ElSelectOption[];
    onChange: (value: string[]) => void;
    className?: string;
    size?: 'small' | 'medium';
    placeholder?: string;
    showSelectAll?: boolean;
    showTags?: boolean;
    disabled?: boolean;
    filterable?: boolean;
};

export default function ElMultiSelect({
    value,
    options,
    onChange,
    className = '',
    size = 'small',
    placeholder = '请选择',
    showSelectAll = false,
    showTags = false,
    disabled = false,
    filterable = false,
}: ElMultiSelectProps) {
    const [open, setOpen] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const wrapRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const selectableOptions = useMemo(
        () => options.filter((option) => !isElSelectPlaceholderOption(option)),
        [options],
    );

    const filteredOptions = useMemo(() => {
        if (!open || !filterable || !inputValue.trim()) return selectableOptions;
        const keyword = inputValue.trim().toLowerCase();
        return selectableOptions.filter((option) => option.label.toLowerCase().includes(keyword));
    }, [selectableOptions, inputValue, open, filterable]);

    const labelMap = useMemo(
        () => new Map(selectableOptions.map((option) => [option.value, option.label])),
        [selectableOptions],
    );

    const displayText = useMemo(() => {
        if (!value.length) return placeholder;
        if (value.length === 1) return labelMap.get(value[0]) ?? value[0];
        return `已选 ${value.length} 项`;
    }, [labelMap, placeholder, value]);

    const handleClose = useCallback(() => {
        setOpen(false);
        setInputValue('');
    }, []);

    const { claim, release } = useOverlayCoordination('select', open, handleClose, 'el-multi-select');

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
            });
        }
    }, [open, filterable]);

    const optionValues = useMemo(
        () => selectableOptions.map((option) => option.value),
        [selectableOptions],
    );

    const allSelected = optionValues.length > 0
        && optionValues.every((optionValue) => value.includes(optionValue));
    const someSelected = value.length > 0 && !allSelected;

    const toggleValue = (optionValue: string) => {
        onChange(
            value.includes(optionValue)
                ? value.filter((item) => item !== optionValue)
                : [...value, optionValue],
        );
    };

    const toggleSelectAll = () => {
        onChange(allSelected ? [] : optionValues);
    };

    const removeValue = (optionValue: string, event: React.MouseEvent) => {
        event.stopPropagation();
        onChange(value.filter((item) => item !== optionValue));
    };

    if (disabled) {
        return (
            <div
                className={`el-select el-multi-select ${size === 'medium' ? 'el-select--medium' : ''} is-disabled ${className}`.trim()}
            >
                <div className="el-select__wrapper el-multi-select__wrapper" aria-disabled="true">
                    <span className={`el-select__selected ${!value.length ? 'is-placeholder' : ''}`.trim()}>
                        {displayText}
                    </span>
                    <ChevronDown size={12} className="el-select__caret" />
                </div>
            </div>
        );
    }

    const handleWrapperMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
        event.stopPropagation();

        const target = event.target as HTMLElement;
        if (target.closest('.el-multi-select__tag-remove')) {
            return;
        }
        if (open) {
            if (filterable && target.closest('.el-select__input')) {
                return;
            }
            return;
        }

        handleOpen();
    };

    const renderTags = () => (
        showTags && value.length > 0 ? (
            <span className="el-multi-select__tags">
                {value.map((optionValue) => (
                    <span key={optionValue} className="el-multi-select__tag">
                        <span className="el-multi-select__tag-label">
                            {labelMap.get(optionValue) ?? optionValue}
                        </span>
                        <button
                            type="button"
                            className="el-multi-select__tag-remove"
                            aria-label={`移除${labelMap.get(optionValue) ?? optionValue}`}
                            onClick={(event) => removeValue(optionValue, event)}
                        >
                            ×
                        </button>
                    </span>
                ))}
            </span>
        ) : null
    );

    return (
        <div
            className={`el-select el-multi-select ${size === 'medium' ? 'el-select--medium' : ''} ${open ? 'is-open' : ''} ${showTags ? 'el-multi-select--tags' : ''} ${showTags && value.length > 0 ? 'has-value' : ''} ${className}`.trim()}
            ref={wrapRef}
        >
            <div
                className={`el-select__wrapper el-multi-select__wrapper ${open && filterable ? 'el-select__wrapper--input is-editing' : ''}`.trim()}
                role="combobox"
                aria-expanded={open}
                onMouseDown={handleWrapperMouseDown}
            >
                {renderTags()}
                {open && filterable ? (
                    <input
                        ref={inputRef}
                        type="text"
                        className="el-select__input"
                        value={inputValue}
                        placeholder={showTags && value.length > 0 ? '' : (value.length ? displayText : placeholder)}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Escape') dismissSelect();
                        }}
                        onClick={(event) => event.stopPropagation()}
                    />
                ) : (
                    !showTags || value.length === 0 ? (
                        <span className={`el-select__selected ${!value.length ? 'is-placeholder' : ''}`.trim()}>
                            {displayText}
                        </span>
                    ) : null
                )}
                <ChevronDown
                    size={12}
                    className="el-select__caret"
                />
            </div>
            {open && (
                <div
                    className="el-select-dropdown el-select-dropdown--left el-multi-select-dropdown"
                    onMouseDown={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                    }}
                >
                    <ul className="el-multi-select-list">
                        {showSelectAll && filteredOptions.length > 0 && (
                            <li>
                                <label className="el-multi-select-item el-multi-select-item--all">
                                    <input
                                        type="checkbox"
                                        checked={allSelected}
                                        ref={(element) => {
                                            if (element) {
                                                element.indeterminate = someSelected;
                                            }
                                        }}
                                        onChange={toggleSelectAll}
                                    />
                                    <span>全选</span>
                                </label>
                            </li>
                        )}
                        {filteredOptions.length === 0 ? (
                            <li className="el-select-dropdown__empty">无匹配项</li>
                        ) : (
                            filteredOptions.map((option) => (
                                <li key={option.value}>
                                    <label className="el-multi-select-item">
                                        <input
                                            type="checkbox"
                                            checked={value.includes(option.value)}
                                            onChange={() => toggleValue(option.value)}
                                        />
                                        <span>{option.label}</span>
                                    </label>
                                </li>
                            ))
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
}
