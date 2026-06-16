import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { isElSelectPlaceholderOption, type ElSelectOption } from './ElSelect';

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
}: ElMultiSelectProps) {
    const [open, setOpen] = useState(false);
    const wrapRef = useRef<HTMLDivElement>(null);

    const selectableOptions = useMemo(
        () => options.filter((option) => !isElSelectPlaceholderOption(option)),
        [options],
    );

    const labelMap = useMemo(
        () => new Map(selectableOptions.map((option) => [option.value, option.label])),
        [selectableOptions],
    );

    const displayText = useMemo(() => {
        if (!value.length) return placeholder;
        if (value.length === 1) return labelMap.get(value[0]) ?? value[0];
        return `已选 ${value.length} 项`;
    }, [labelMap, placeholder, value]);

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

    return (
        <div
            className={`el-select el-multi-select ${size === 'medium' ? 'el-select--medium' : ''} ${open ? 'is-open' : ''} ${showTags ? 'el-multi-select--tags' : ''} ${showTags && value.length > 0 ? 'has-value' : ''} ${className}`.trim()}
            ref={wrapRef}
        >
            <button
                type="button"
                className="el-select__wrapper el-multi-select__wrapper"
                onClick={() => setOpen((prev) => !prev)}
            >
                {showTags && value.length > 0 ? (
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
                ) : (
                    <span className={`el-select__selected ${!value.length ? 'is-placeholder' : ''}`.trim()}>
                        {displayText}
                    </span>
                )}
                <ChevronDown size={12} className="el-select__caret" />
            </button>
            {open && (
                <div className="el-select-dropdown el-select-dropdown--left el-multi-select-dropdown">
                    <ul className="el-multi-select-list">
                        {showSelectAll && selectableOptions.length > 0 && (
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
                        {selectableOptions.map((option) => (
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
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
