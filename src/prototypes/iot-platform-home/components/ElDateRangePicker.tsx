import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Calendar, ChevronDown, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { formatDateValue } from './ElDatePicker';

type ElDateRangePickerProps = {
    start: string;
    end: string;
    onChange: (range: { start: string; end: string }) => void;
    className?: string;
    size?: 'small' | 'medium';
    placeholder?: string;
};

const WEEK_LABELS = ['日', '一', '二', '三', '四', '五', '六'];

function pad(value: number) {
    return String(value).padStart(2, '0');
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

type DatePanelProps = {
    year: number;
    month: number;
    selectedStart: string;
    selectedEnd: string;
    onSelect: (value: string) => void;
    onShiftMonth: (offset: number) => void;
    onShiftYear: (offset: number) => void;
};

function DatePanel({
    year,
    month,
    selectedStart,
    selectedEnd,
    onSelect,
    onShiftMonth,
    onShiftYear,
}: DatePanelProps) {
    const monthCells = useMemo(
        () => buildMonthCells(year, month),
        [month, year],
    );

    return (
        <div className="el-date-picker-panel">
            <div className="el-date-picker-panel__head">
                <button type="button" aria-label="上一年" onClick={() => onShiftYear(-1)}>
                    <ChevronLeft size={14} />
                </button>
                <button type="button" aria-label="上一月" onClick={() => onShiftMonth(-1)}>
                    <ChevronLeft size={14} />
                </button>
                <strong>{year}年 {pad(month + 1)}月</strong>
                <button type="button" aria-label="下一月" onClick={() => onShiftMonth(1)}>
                    <ChevronRight size={14} />
                </button>
                <button type="button" aria-label="下一年" onClick={() => onShiftYear(1)}>
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
                    const cellDate = new Date(year, month + cell.monthOffset, cell.day);
                    const cellValue = formatDateValue(cellDate);
                    const isSelected = cellValue === selectedStart || cellValue === selectedEnd;
                    const isInRange = selectedStart && selectedEnd
                        && cellValue >= selectedStart
                        && cellValue <= selectedEnd;
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
                                isInRange ? 'is-in-range' : '',
                                isToday ? 'is-today' : '',
                            ].filter(Boolean).join(' ')}
                            onClick={() => onSelect(cellValue)}
                        >
                            {cell.day}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export default function ElDateRangePicker({
    start,
    end,
    onChange,
    className = '',
    size = 'medium',
    placeholder = '请选择日期范围',
}: ElDateRangePickerProps) {
    const startDate = parseDateValue(start);
    const endDate = parseDateValue(end);
    const [open, setOpen] = useState(false);
    const [startYear, setStartYear] = useState(() => (startDate ?? new Date()).getFullYear());
    const [startMonth, setStartMonth] = useState(() => (startDate ?? new Date()).getMonth());
    const [endYear, setEndYear] = useState(() => (endDate ?? startDate ?? new Date()).getFullYear());
    const [endMonth, setEndMonth] = useState(() => (endDate ?? startDate ?? new Date()).getMonth());
    const wrapRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return undefined;
        const baseStart = startDate ?? new Date();
        const baseEnd = endDate ?? startDate ?? new Date();
        setStartYear(baseStart.getFullYear());
        setStartMonth(baseStart.getMonth());
        setEndYear(baseEnd.getFullYear());
        setEndMonth(baseEnd.getMonth());
    }, [endDate, open, startDate]);

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

    const displayText = start && end ? `${start} ~ ${end}` : '';

    const handleSelectDay = (value: string) => {
        if (!start || (start && end)) {
            onChange({ start: value, end: '' });
            return;
        }

        if (value < start) {
            onChange({ start: value, end: start });
        } else {
            onChange({ start, end: value });
        }
        setOpen(false);
    };

    const handleClear = (event: React.MouseEvent) => {
        event.stopPropagation();
        onChange({ start: '', end: '' });
    };

    const shiftStartMonth = (offset: number) => {
        const next = new Date(startYear, startMonth + offset, 1);
        setStartYear(next.getFullYear());
        setStartMonth(next.getMonth());
    };

    const shiftEndMonth = (offset: number) => {
        const next = new Date(endYear, endMonth + offset, 1);
        setEndYear(next.getFullYear());
        setEndMonth(next.getMonth());
    };

    return (
        <div
            className={`el-select el-date-picker el-date-range-picker ${size === 'medium' ? 'el-select--medium' : ''} ${open ? 'is-open' : ''} ${className}`.trim()}
            ref={wrapRef}
        >
            <button
                type="button"
                className="el-select__wrapper el-date-picker__wrapper"
                onClick={() => setOpen((prev) => !prev)}
            >
                <Calendar size={14} className="el-date-picker__icon" />
                <span className={`el-select__selected ${displayText ? '' : 'is-placeholder'}`.trim()}>
                    {displayText || placeholder}
                </span>
                {displayText && (
                    <span
                        className="el-date-picker__clear"
                        role="button"
                        tabIndex={0}
                        aria-label="清空日期范围"
                        onClick={handleClear}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                onChange({ start: '', end: '' });
                            }
                        }}
                    >
                        <X size={12} />
                    </span>
                )}
                <ChevronDown size={12} className="el-select__caret" />
            </button>
            {open && (
                <div className="el-select-dropdown el-date-range-picker-dropdown el-select-dropdown--left">
                    <div className="el-date-range-picker-panels">
                        <DatePanel
                            year={startYear}
                            month={startMonth}
                            selectedStart={start}
                            selectedEnd={end}
                            onSelect={handleSelectDay}
                            onShiftMonth={shiftStartMonth}
                            onShiftYear={(offset) => setStartYear((year) => year + offset)}
                        />
                        <DatePanel
                            year={endYear}
                            month={endMonth}
                            selectedStart={start}
                            selectedEnd={end}
                            onSelect={handleSelectDay}
                            onShiftMonth={shiftEndMonth}
                            onShiftYear={(offset) => setEndYear((year) => year + offset)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
