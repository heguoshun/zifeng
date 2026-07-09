import React, { useEffect, useRef, useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useDismissOnOutsideMouseDown } from './useDismissOnOutsideMouseDown';

type ElMonthPickerProps = {
    value: string;
    onChange: (value: string) => void;
    className?: string;
    size?: 'small' | 'medium';
    placeholder?: string;
};

const MONTH_LABELS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

function pad(value: number) {
    return String(value).padStart(2, '0');
}

export function formatMonthValue(year: number, month: number) {
    return `${year}-${pad(month + 1)}`;
}

function parseMonthValue(value: string): { year: number; month: number } | null {
    if (!value) return null;
    const match = value.match(/^(\d{4})-(\d{2})$/);
    if (!match) return null;
    const year = Number(match[1]);
    const month = Number(match[2]) - 1;
    if (month < 0 || month > 11) return null;
    return { year, month };
}

export default function ElMonthPicker({
    value,
    onChange,
    className = '',
    size = 'medium',
    placeholder = '请选择月份',
}: ElMonthPickerProps) {
    const selectedMonth = parseMonthValue(value);
    const [open, setOpen] = useState(false);
    const [viewYear, setViewYear] = useState(() => (selectedMonth?.year ?? new Date().getFullYear()));
    const wrapRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return undefined;
        setViewYear(selectedMonth?.year ?? new Date().getFullYear());
    }, [open, selectedMonth]);

    useDismissOnOutsideMouseDown(open, wrapRef, () => setOpen(false));

    const handleSelectMonth = (month: number) => {
        onChange(formatMonthValue(viewYear, month));
        setOpen(false);
    };

    const handleClear = (event: React.MouseEvent) => {
        event.stopPropagation();
        onChange('');
    };

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    return (
        <div
            className={`el-select el-date-picker el-month-picker ${size === 'medium' ? 'el-select--medium' : ''} ${open ? 'is-open' : ''} ${className}`.trim()}
            ref={wrapRef}
        >
            <button
                type="button"
                className="el-select__wrapper el-date-picker__wrapper"
                onMouseDown={(event) => {
                    event.stopPropagation();
                    const target = event.target as HTMLElement;
                    if (target.closest('.el-date-picker__clear')) return;
                    if (!open) setOpen(true);
                }}
            >
                <span className={`el-select__selected ${value ? '' : 'is-placeholder'}`.trim()}>
                    {value || placeholder}
                </span>
                {value && (
                    <span
                        className="el-date-picker__clear"
                        role="button"
                        tabIndex={0}
                        aria-label="清空月份"
                        onClick={handleClear}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                onChange('');
                            }
                        }}
                    >
                        <X size={12} />
                    </span>
                )}
                <Calendar size={14} className="el-date-picker__icon" />
            </button>
            {open && (
                <div
                    className="el-select-dropdown el-date-picker-dropdown el-select-dropdown--left"
                    onMouseDown={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                    }}
                >
                    <div className="el-date-picker-panel el-month-picker-panel">
                        <div className="el-date-picker-panel__head el-month-picker-panel__head">
                            <button type="button" aria-label="上一年" onClick={() => setViewYear((year) => year - 1)}>
                                <ChevronLeft size={14} />
                            </button>
                            <strong>{viewYear}年</strong>
                            <button type="button" aria-label="下一年" onClick={() => setViewYear((year) => year + 1)}>
                                <ChevronRight size={14} />
                            </button>
                        </div>
                        <div className="el-month-picker-grid">
                            {MONTH_LABELS.map((label, month) => {
                                const monthValue = formatMonthValue(viewYear, month);
                                const isSelected = value === monthValue;
                                const isCurrent = viewYear === currentYear && month === currentMonth;

                                return (
                                    <button
                                        key={monthValue}
                                        type="button"
                                        className={[
                                            'el-date-picker-day',
                                            isSelected ? 'is-selected' : '',
                                            isCurrent ? 'is-today' : '',
                                        ].filter(Boolean).join(' ')}
                                        onClick={() => handleSelectMonth(month)}
                                    >
                                        {label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
