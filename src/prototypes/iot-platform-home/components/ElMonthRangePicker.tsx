import React, { useEffect, useRef, useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { formatMonthValue } from './ElMonthPicker';
import { useDismissOnOutsideMouseDown } from './useDismissOnOutsideMouseDown';

type ElMonthRangePickerProps = {
    start: string;
    end: string;
    onChange: (range: { start: string; end: string }) => void;
    className?: string;
    size?: 'small' | 'medium';
    placeholder?: string;
};

const MONTH_LABELS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

function parseMonthValue(value: string): { year: number; month: number } | null {
    if (!value) return null;
    const match = value.match(/^(\d{4})-(\d{2})$/);
    if (!match) return null;
    const year = Number(match[1]);
    const month = Number(match[2]) - 1;
    if (month < 0 || month > 11) return null;
    return { year, month };
}

type MonthPanelProps = {
    year: number;
    selectedStart: string;
    selectedEnd: string;
    onSelect: (value: string) => void;
    onShiftYear: (offset: number) => void;
};

function MonthPanel({
    year,
    selectedStart,
    selectedEnd,
    onSelect,
    onShiftYear,
}: MonthPanelProps) {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    return (
        <div className="el-date-picker-panel el-month-picker-panel">
            <div className="el-date-picker-panel__head el-month-picker-panel__head">
                <button type="button" aria-label="上一年" onClick={() => onShiftYear(-1)}>
                    <ChevronLeft size={14} />
                </button>
                <strong>{year}年</strong>
                <button type="button" aria-label="下一年" onClick={() => onShiftYear(1)}>
                    <ChevronRight size={14} />
                </button>
            </div>
            <div className="el-month-picker-grid">
                {MONTH_LABELS.map((label, month) => {
                    const monthValue = formatMonthValue(year, month);
                    const isSelected = monthValue === selectedStart || monthValue === selectedEnd;
                    const isInRange = selectedStart && selectedEnd
                        && monthValue >= selectedStart
                        && monthValue <= selectedEnd;
                    const isCurrent = year === currentYear && month === currentMonth;

                    return (
                        <button
                            key={monthValue}
                            type="button"
                            className={[
                                'el-date-picker-day',
                                isSelected ? 'is-selected' : '',
                                isInRange ? 'is-in-range' : '',
                                isCurrent ? 'is-today' : '',
                            ].filter(Boolean).join(' ')}
                            onClick={() => onSelect(monthValue)}
                        >
                            {label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export default function ElMonthRangePicker({
    start,
    end,
    onChange,
    className = '',
    size = 'medium',
    placeholder = '请选择月份范围',
}: ElMonthRangePickerProps) {
    const startMonth = parseMonthValue(start);
    const endMonth = parseMonthValue(end);
    const [open, setOpen] = useState(false);
    const [startYear, setStartYear] = useState(() => (startMonth?.year ?? new Date().getFullYear()));
    const [endYear, setEndYear] = useState(() => (endMonth?.year ?? startMonth?.year ?? new Date().getFullYear()));
    const wrapRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return undefined;
        setStartYear(startMonth?.year ?? new Date().getFullYear());
        setEndYear(endMonth?.year ?? startMonth?.year ?? new Date().getFullYear());
    }, [endMonth, open, startMonth]);

    useDismissOnOutsideMouseDown(open, wrapRef, () => setOpen(false));

    const displayText = start && end ? `${start} ~ ${end}` : '';

    const handleSelectMonth = (value: string) => {
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

    return (
        <div
            className={`el-select el-date-picker el-month-range-picker ${size === 'medium' ? 'el-select--medium' : ''} ${open ? 'is-open' : ''} ${className}`.trim()}
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
                <span className={`el-select__selected ${displayText ? '' : 'is-placeholder'}`.trim()}>
                    {displayText || placeholder}
                </span>
                {displayText && (
                    <span
                        className="el-date-picker__clear"
                        role="button"
                        tabIndex={0}
                        aria-label="清空月份范围"
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
                <Calendar size={14} className="el-date-picker__icon" />
            </button>
            {open && (
                <div
                    className="el-select-dropdown el-month-range-picker-dropdown el-select-dropdown--left"
                    onMouseDown={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                    }}
                >
                    <div className="el-month-range-picker-panels">
                        <MonthPanel
                            year={startYear}
                            selectedStart={start}
                            selectedEnd={end}
                            onSelect={handleSelectMonth}
                            onShiftYear={(offset) => setStartYear((year) => year + offset)}
                        />
                        <MonthPanel
                            year={endYear}
                            selectedStart={start}
                            selectedEnd={end}
                            onSelect={handleSelectMonth}
                            onShiftYear={(offset) => setEndYear((year) => year + offset)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
