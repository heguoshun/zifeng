import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Calendar, ChevronDown, ChevronLeft, ChevronRight, X } from 'lucide-react';

type ElDatePickerProps = {
    value: string;
    onChange: (value: string) => void;
    className?: string;
    size?: 'small' | 'medium';
    placeholder?: string;
};

const WEEK_LABELS = ['日', '一', '二', '三', '四', '五', '六'];

function pad(value: number) {
    return String(value).padStart(2, '0');
}

export function formatDateValue(date: Date) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function parseDateValue(value: string): Date | null {
    if (!value) return null;
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return null;
    const year = Number(match[1]);
    const month = Number(match[2]) - 1;
    const day = Number(match[3]);
    const date = new Date(year, month, day);
    if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) {
        return null;
    }
    return date;
}

function buildMonthCells(year: number, month: number) {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    const cells: Array<{ day: number; monthOffset: -1 | 0 | 1 }> = [];

    for (let index = 0; index < 42; index += 1) {
        if (index < firstDay) {
            cells.push({
                day: daysInPrevMonth - firstDay + index + 1,
                monthOffset: -1,
            });
            continue;
        }
        if (index < firstDay + daysInMonth) {
            cells.push({
                day: index - firstDay + 1,
                monthOffset: 0,
            });
            continue;
        }
        cells.push({
            day: index - firstDay - daysInMonth + 1,
            monthOffset: 1,
        });
    }

    return cells;
}

export default function ElDatePicker({
    value,
    onChange,
    className = '',
    size = 'medium',
    placeholder = '请选择日期',
}: ElDatePickerProps) {
    const selectedDate = parseDateValue(value);
    const [open, setOpen] = useState(false);
    const [viewYear, setViewYear] = useState(() => (selectedDate ?? new Date()).getFullYear());
    const [viewMonth, setViewMonth] = useState(() => (selectedDate ?? new Date()).getMonth());
    const wrapRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return undefined;
        const base = selectedDate ?? new Date();
        setViewYear(base.getFullYear());
        setViewMonth(base.getMonth());
    }, [open, selectedDate]);

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

    const monthCells = useMemo(
        () => buildMonthCells(viewYear, viewMonth),
        [viewMonth, viewYear],
    );

    const shiftMonth = (offset: number) => {
        const next = new Date(viewYear, viewMonth + offset, 1);
        setViewYear(next.getFullYear());
        setViewMonth(next.getMonth());
    };

    const handleSelectDay = (day: number, monthOffset: -1 | 0 | 1) => {
        const next = new Date(viewYear, viewMonth + monthOffset, day);
        onChange(formatDateValue(next));
        setOpen(false);
    };

    const handleClear = (event: React.MouseEvent) => {
        event.stopPropagation();
        onChange('');
    };

    return (
        <div
            className={`el-select el-date-picker ${size === 'medium' ? 'el-select--medium' : ''} ${open ? 'is-open' : ''} ${className}`.trim()}
            ref={wrapRef}
        >
            <button
                type="button"
                className="el-select__wrapper el-date-picker__wrapper"
                onClick={() => setOpen((prev) => !prev)}
            >
                <Calendar size={14} className="el-date-picker__icon" />
                <span className={`el-select__selected ${value ? '' : 'is-placeholder'}`.trim()}>
                    {value || placeholder}
                </span>
                {value && (
                    <span
                        className="el-date-picker__clear"
                        role="button"
                        tabIndex={0}
                        aria-label="清空日期"
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
                <ChevronDown size={12} className="el-select__caret" />
            </button>
            {open && (
                <div className="el-select-dropdown el-date-picker-dropdown el-select-dropdown--left">
                    <div className="el-date-picker-panel">
                        <div className="el-date-picker-panel__head">
                            <button type="button" aria-label="上一年" onClick={() => setViewYear((year) => year - 1)}>
                                <ChevronLeft size={14} />
                            </button>
                            <button type="button" aria-label="上一月" onClick={() => shiftMonth(-1)}>
                                <ChevronLeft size={14} />
                            </button>
                            <strong>{viewYear}年 {pad(viewMonth + 1)}月</strong>
                            <button type="button" aria-label="下一月" onClick={() => shiftMonth(1)}>
                                <ChevronRight size={14} />
                            </button>
                            <button type="button" aria-label="下一年" onClick={() => setViewYear((year) => year + 1)}>
                                <ChevronRight size={14} />
                            </button>
                        </div>
                        <div className="el-date-picker-panel__week">
                            {WEEK_LABELS.map((label) => (
                                <span key={label}>{label}</span>
                            ))}
                        </div>
                        <div className="el-date-picker-panel__grid">
                            {monthCells.map((cell, index) => {
                                const cellDate = new Date(viewYear, viewMonth + cell.monthOffset, cell.day);
                                const cellValue = formatDateValue(cellDate);
                                const isSelected = value === cellValue;
                                const isToday = cellValue === formatDateValue(new Date());
                                const isOutside = cell.monthOffset !== 0;

                                return (
                                    <button
                                        key={`${cellValue}-${index}`}
                                        type="button"
                                        className={[
                                            'el-date-picker-day',
                                            isOutside ? 'is-outside' : '',
                                            isSelected ? 'is-selected' : '',
                                            isToday ? 'is-today' : '',
                                        ].filter(Boolean).join(' ')}
                                        onClick={() => handleSelectDay(cell.day, cell.monthOffset)}
                                    >
                                        {cell.day}
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
