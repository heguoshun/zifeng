import React from 'react';
import type { DeviceAlarmRecord } from '../data/deviceAlarms';

export function ReadStatusCell({ status }: { status: DeviceAlarmRecord['readStatus'] }) {
    return (
        <span>
            <i className={`dai-status-dot ${status === '未读' ? 'dai-status-dot--unread' : 'dai-status-dot--read'}`} />
            {status}
        </span>
    );
}

export function AlarmLevelCell({ level }: { level: DeviceAlarmRecord['level'] }) {
    return <span className="dai-level-tag">{level}</span>;
}

export function ProcessStatusCell({ status }: { status: DeviceAlarmRecord['processStatus'] }) {
    const statusClass = status === '未处理'
        ? 'dai-process-status--pending'
        : status === '处理中'
            ? 'dai-process-status--processing'
            : 'dai-process-status--done';

    return (
        <span className={`dai-process-status ${statusClass}`}>
            <i className="dai-process-status__icon" aria-hidden="true">
                {status === '未处理' && (
                    <svg viewBox="0 0 16 16" fill="none">
                        <circle cx="8" cy="8" r="7" fill="currentColor" />
                        <path d="M8 4.5V8l2.2 1.4" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                )}
                {status === '处理中' && (
                    <svg viewBox="0 0 16 16" fill="none">
                        <circle cx="8" cy="8" r="7" fill="currentColor" />
                        <path d="M6.5 5.2v5.6l4.8-2.8-4.8-2.8z" fill="#fff" />
                    </svg>
                )}
                {status === '已处理' && (
                    <svg viewBox="0 0 16 16" fill="none">
                        <circle cx="8" cy="8" r="7" fill="currentColor" />
                        <path d="M5 8.2l2 2 4.2-4.4" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                )}
            </i>
            {status}
        </span>
    );
}
