import React from 'react';

type DeviceLogStatusCodeProps = {
    code: number;
};

export default function DeviceLogStatusCode({ code }: DeviceLogStatusCodeProps) {
    const isOk = code === 200;

    return (
        <span className={`device-log-status-code ${isOk ? 'device-log-sc--ok' : 'device-log-sc--fail'}`}>
            <i className="device-log-status-code__icon" aria-hidden="true">
                {isOk ? (
                    <svg viewBox="0 0 16 16" fill="none">
                        <circle cx="8" cy="8" r="7" fill="currentColor" />
                        <path
                            d="M5 8.2l2 2 4.2-4.4"
                            stroke="#fff"
                            strokeWidth="1.4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                ) : (
                    <svg viewBox="0 0 16 16" fill="none">
                        <circle cx="8" cy="8" r="7" fill="currentColor" />
                        <path
                            d="M5.5 5.5l5 5M10.5 5.5l-5 5"
                            stroke="#fff"
                            strokeWidth="1.4"
                            strokeLinecap="round"
                        />
                    </svg>
                )}
            </i>
            {code}
        </span>
    );
}
