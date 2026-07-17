import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, X } from 'lucide-react';
import { formatDateValue } from './ElDatePicker';
import { useDismissOnOutsideMouseDown } from './useDismissOnOutsideMouseDown';

type ElDateTimePickerProps = {
    value: string;
    onChange: (value: string) => void;
    className?: string;
    size?: 'small' | 'medium';
    placeholder?: string;
};

type PanelMode = 'date' | 'time';

const WEEK_LABELS = ['日', '一', '二', '三', '四', '五', '六'];

function pad(value: number) {
    return String(value).padStart(2, '0');
}

export function formatDateTimeValue(date: Date) {
    return `${formatDateValue(date)} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export function parseDateTimeValue(value: string): Date | null {
    if (!value.trim()) return null;

    const normalized = value.trim().replace('T', ' ');
    const match = normalized.match(/^(\d{4})-(\d{2})-(\d{2})(?:\s+(\d{2}):(\d{2})(?::(\d{2}))?)?$/);
    if (!match) return null;

    const year = Number(match[1]);
    const month = Number(match[2]) - 1;
    const day = Number(match[3]);
    const hours = Number(match[4] ?? '0');
    const minutes = Number(match[5] ?? '0');
    const seconds = Number(match[6] ?? '0');
    const date = new Date(year, month, day, hours, minutes, seconds);

    if (
        date.getFullYear() !== year
        || date.getMonth() !== month
        || date.getDate() !== day
        || date.getHours() !== hours
        || date.getMinutes() !== minutes
        || date.getSeconds() !== seconds
    ) {
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

function buildRange(max: number) {
    return Array.from({ length: max }, (_, index) => pad(index));
}

export default function ElDateTimePicker({
    value,
    onChange,
    className = '',
    size = 'medium',
    placeholder = '请选择',
}: ElDateTimePickerProps) {
    const committedDate = useMemo(() => parseDateTimeValue(value), [value]);
    const [open, setOpen] = useState(false);
    const [panelMode, setPanelMode] = useState<PanelMode>('date');
    const [draftDate, setDraftDate] = useState<Date>(() => committedDate ?? new Date());
    const [viewYear, setViewYear] = useState(() => (committedDate ?? new Date()).getFullYear());
    const [viewMonth, setViewMonth] = useState(() => (committedDate ?? new Date()).getMonth());
    const [draftHour, setDraftHour] = useState(() => pad((committedDate ?? new Date()).getHours()));
    const [draftMinute, setDraftMinute] = useState(() => pad((committedDate ?? new Date()).getMinutes()));
    const [draftSecond, setDraftSecond] = useState(() => pad((committedDate ?? new Date()).getSeconds()));
    const wrapRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return undefined;
        const base = committedDate ?? new Date();
        setPanelMode('date');
        setDraftDate(base);
        setViewYear(base.getFullYear());
        setViewMonth(base.getMonth());
        setDraftHour(pad(base.getHours()));
        setDraftMinute(pad(base.getMinutes()));
        setDraftSecond(pad(base.getSeconds()));
    }, [open, committedDate]);

    useDismissOnOutsideMouseDown(open, wrapRef, () => setOpen(false));

    const monthCells = useMemo(
        () => buildMonthCells(viewYear, viewMonth),
        [viewMonth, viewYear],
    );

    const draftDateValue = formatDateValue(draftDate);
    const displayValue = value.trim();

    const shiftMonth = (offset: number) => {
        const next = new Date(viewYear, viewMonth + offset, 1);
        setViewYear(next.getFullYear());
        setViewMonth(next.getMonth());
    };

    const handleSelectDay = (day: number, monthOffset: -1 | 0 | 1) => {
        const next = new Date(viewYear, viewMonth + monthOffset, day);
        setDraftDate(next);
    };

    const handleConfirm = () => {
        const next = new Date(
            draftDate.getFullYear(),
            draftDate.getMonth(),
            draftDate.getDate(),
            Number(draftHour),
            Number(draftMinute),
            Number(draftSecond),
        );
        onChange(formatDateTimeValue(next));
        setOpen(false);
    };

    const handleClear = () => {
        onChange('');
        setOpen(false);
    };

    const handleClearInput = (event: React.MouseEvent) => {
        event.stopPropagation();
        onChange('');
    };

    return (
        <div
            className={`el-select el-date-picker el-datetime-picker ${size === 'medium' ? 'el-select--medium' : ''} ${open ? 'is-open' : ''} ${className}`.trim()}
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
                <span className={`el-select__selected ${displayValue ? '' : 'is-placeholder'}`.trim()}>
                    {displayValue || placeholder}
                </span>
                {displayValue && (
                    <span
                        className="el-date-picker__clear"
                        role="button"
                        tabIndex={0}
                        aria-label="清空时间"
                        onClick={handleClearInput}
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
                    className="el-select-dropdown el-date-picker-dropdown el-datetime-picker-dropdown el-select-dropdown--left"
                    onMouseDown={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                    }}
                >
                    {panelMode === 'date' ? (
                        <div className="el-date-picker-panel">
                            <div className="el-date-picker-panel__head">
                                <button type="button" aria-label="上一年" onClick={() => setViewYear((year) => year - 1)}>
                                    <ChevronsLeft size={14} />
                                </button>
                                <button type="button" aria-label="上一月" onClick={() => shiftMonth(-1)}>
                                    <ChevronLeft size={14} />
                                </button>
                                <strong>{viewYear}年 {pad(viewMonth + 1)}月</strong>
                                <button type="button" aria-label="下一月" onClick={() => shiftMonth(1)}>
                                    <ChevronRight size={14} />
                                </button>
                                <button type="button" aria-label="下一年" onClick={() => setViewYear((year) => year + 1)}>
                                    <ChevronsRight size={14} />
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
                                    const isSelected = draftDateValue === cellValue;
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
                    ) : (
                        <div className="el-datetime-picker-time">
                            <div className="el-datetime-picker-time__columns">
                                <ul className="el-datetime-picker-time__column">
                                    {buildRange(24).map((item) => (
                                        <li key={`h-${item}`}>
                                            <button
                                                type="button"
                                                className={draftHour === item ? 'is-selected' : ''}
                                                onClick={() => setDraftHour(item)}
                                            >
                                                {item}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                                <ul className="el-datetime-picker-time__column">
                                    {buildRange(60).map((item) => (
                                        <li key={`m-${item}`}>
                                            <button
                                                type="button"
                                                className={draftMinute === item ? 'is-selected' : ''}
                                                onClick={() => setDraftMinute(item)}
                                            >
                                                {item}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                                <ul className="el-datetime-picker-time__column">
                                    {buildRange(60).map((item) => (
                                        <li key={`s-${item}`}>
                                            <button
                                                type="button"
                                                className={draftSecond === item ? 'is-selected' : ''}
                                                onClick={() => setDraftSecond(item)}
                                            >
                                                {item}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}
                    <div className="el-datetime-picker-panel__foot">
                        <button
                            type="button"
                            className="el-datetime-picker-panel__foot-link"
                            onClick={() => setPanelMode((prev) => (prev === 'date' ? 'time' : 'date'))}
                        >
                            {panelMode === 'date' ? '选择时间' : '选择日期'}
                        </button>
                        <div className="el-datetime-picker-panel__foot-actions">
                            <button type="button" className="pm-btn pm-btn-ghost el-datetime-picker-panel__btn" onClick={handleClear}>
                                清空
                            </button>
                            <button type="button" className="pm-btn pm-btn-primary el-datetime-picker-panel__btn" onClick={handleConfirm}>
                                确定
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
