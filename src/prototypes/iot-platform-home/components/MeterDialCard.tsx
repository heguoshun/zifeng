import React, { useEffect, useRef, useState } from 'react';
import type { LargeMeterDevice } from '../data/largeMeters';

const ODOMETER_DIGIT_COUNT = 11;
const TICK_MS = 10000;
const DIGIT_HEIGHT = 30;

type MeterDialCardProps = {
    meter: LargeMeterDevice;
    onClick?: () => void;
};

function getOdometerDigits(reading: number): number[] {
    const intValue = Math.max(0, Math.floor(reading));
    return String(intValue)
        .padStart(ODOMETER_DIGIT_COUNT, '0')
        .slice(-ODOMETER_DIGIT_COUNT)
        .split('')
        .map((char) => Number(char));
}

function formatPreciseReading(reading: number): string {
    return reading.toLocaleString('zh-CN', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
    });
}

function formatDateTime(date: Date): string {
    const pad = (value: number) => String(value).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function OdometerDigit({ value }: { value: number }) {
    const digit = Math.min(9, Math.max(0, value));
    const prevDigitRef = useRef(digit);
    const [offset, setOffset] = useState(digit);
    const [disableTransition, setDisableTransition] = useState(false);

    useEffect(() => {
        const prev = prevDigitRef.current;
        if (digit === prev) return;

        if (digit < prev) {
            setOffset(10 + digit);
        } else {
            setOffset(digit);
        }
        prevDigitRef.current = digit;
    }, [digit]);

    const handleTransitionEnd = () => {
        if (offset < 10) return;

        setDisableTransition(true);
        setOffset(digit);
        requestAnimationFrame(() => {
            requestAnimationFrame(() => setDisableTransition(false));
        });
    };

    return (
        <span className="lm-meter-dial__digit-window">
            <span
                className={`lm-meter-dial__digit-roll ${disableTransition ? 'is-instant' : ''}`}
                style={{ transform: `translateY(-${offset * DIGIT_HEIGHT}px)` }}
                onTransitionEnd={handleTransitionEnd}
            >
                {Array.from({ length: 20 }, (_, index) => (
                    <span key={index} className="lm-meter-dial__digit-num">
                        {index % 10}
                    </span>
                ))}
            </span>
        </span>
    );
}

export default function MeterDialCard({ meter, onClick }: MeterDialCardProps) {
    const [displayReading, setDisplayReading] = useState(meter.currentReading);
    const [displayTime, setDisplayTime] = useState(meter.dataTime);
    const digits = getOdometerDigits(displayReading);
    const isLive = meter.status !== '离线';

    useEffect(() => {
        setDisplayReading(meter.currentReading);
        setDisplayTime(meter.dataTime);
    }, [meter.id, meter.currentReading, meter.dataTime]);

    useEffect(() => {
        if (!isLive) return undefined;

        const timer = window.setInterval(() => {
            setDisplayReading((prev) => Math.round((prev + 0.1 + Math.random() * 0.4) * 10) / 10);
            setDisplayTime(formatDateTime(new Date()));
        }, TICK_MS);

        return () => window.clearInterval(timer);
    }, [isLive, meter.id]);

    return (
        <article
            className={`lm-meter-dial-card ${meter.status === '离线' ? 'is-offline' : ''} ${onClick ? 'is-clickable' : ''}`}
            onClick={onClick}
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
            onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
        >
            <div className="lm-meter-dial-card__name">{meter.userName}</div>

            <div className="lm-meter-dial" aria-label={`累计读数 ${displayReading}`}>
                {digits.map((digit, index) => (
                    <OdometerDigit key={`${meter.id}-digit-${index}`} value={digit} />
                ))}
            </div>

            <div className="lm-meter-dial-card__meta">
                {meter.userNo}
                {' '}
                (
                {formatPreciseReading(displayReading)}
                )
            </div>

            <time className="lm-meter-dial-card__time" dateTime={displayTime}>
                {displayTime}
            </time>
        </article>
    );
}
