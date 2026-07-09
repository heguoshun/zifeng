import React, { useEffect, useState } from 'react';

function formatTime(date: Date) {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

export default function StatusBar() {
    const [time, setTime] = useState(() => formatTime(new Date()));

    useEffect(() => {
        const timer = window.setInterval(() => setTime(formatTime(new Date())), 30000);
        return () => window.clearInterval(timer);
    }, []);

    return (
        <div className="dma-statusbar" aria-hidden="true">
            <span className="dma-statusbar-time">{time}</span>
            <div className="dma-statusbar-indicators">
                <span className="dma-statusbar-signal" />
                <span className="dma-statusbar-wifi" />
                <span className="dma-statusbar-battery">
                    <span className="dma-statusbar-battery-level" />
                </span>
            </div>
        </div>
    );
}
