import React, { useEffect, useState } from 'react';
import '../device-access.css';

export type LargeMeterPageId =
    | 'data-monitor'
    | 'data-report'
    | 'area-config'
    | 'device-archive';

const SIDEBAR_ITEMS: { id: LargeMeterPageId; label: string }[] = [
    { id: 'data-monitor', label: '数据监测' },
    { id: 'data-report', label: '数据报表' },
    { id: 'area-config', label: '区域配置' },
    { id: 'device-archive', label: '大表档案' },
];

function MenuIcon({ type }: { type: string }) {
    const s = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.3, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
    switch (type) {
        case 'data-monitor':
            return (
                <svg className="da-sidebar-icon" viewBox="0 0 20 20" aria-hidden="true">
                    <rect x="2" y="2" width="16" height="16" rx="2" {...s} />
                    <polyline points="5,13 7.5,9 10,11.5 12.5,6.5 15,9" {...s} />
                </svg>
            );
        case 'data-report':
            return (
                <svg className="da-sidebar-icon" viewBox="0 0 20 20" aria-hidden="true">
                    <path d="M5 2h7l4 4v11a1.5 1.5 0 01-1.5 1.5h-9A1.5 1.5 0 014 17V3.5A1.5 1.5 0 015.5 2z" {...s} />
                    <path d="M12 2v4h4" {...s} />
                    <line x1="7" y1="10" x2="13" y2="10" {...s} />
                    <line x1="7" y1="13" x2="13" y2="13" {...s} />
                    <line x1="7" y1="16" x2="10" y2="16" {...s} />
                </svg>
            );
        case 'area-config':
            return (
                <svg className="da-sidebar-icon" viewBox="0 0 16 16" aria-hidden="true">
                    <rect x="2" y="2" width="12" height="12" rx="1.2" fill="none" stroke="currentColor" strokeWidth="1.2" />
                    <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="1.2" />
                </svg>
            );
        case 'device-archive':
            return (
                <svg className="da-sidebar-icon" viewBox="0 0 20 20" aria-hidden="true">
                    <rect x="3" y="2.5" width="14" height="6" rx="1.5" {...s} />
                    <rect x="3" y="11.5" width="14" height="6" rx="1.5" {...s} />
                    <circle cx="6.5" cy="5.5" r="0.9" fill="currentColor" stroke="none" />
                    <circle cx="6.5" cy="14.5" r="0.9" fill="currentColor" stroke="none" />
                    <line x1="9.5" y1="5.5" x2="14" y2="5.5" {...s} />
                    <line x1="9.5" y1="14.5" x2="14" y2="14.5" {...s} />
                </svg>
            );
        default:
            return null;
    }
}

type LargeMeterSidebarProps = {
    pageId: LargeMeterPageId;
    onNavigate: (pageId: LargeMeterPageId) => void;
};

export default function LargeMeterSidebar({
    pageId,
    onNavigate,
}: LargeMeterSidebarProps) {
    const [localActive, setLocalActive] = useState<string | null>(null);

    useEffect(() => {
        setLocalActive(null);
    }, [pageId]);

    const activeItem = localActive ?? pageId;

    return (
        <div className="da-sidebar-shell">
            <nav className="da-sidebar-nav">
                {SIDEBAR_ITEMS.map((item) => (
                    <button
                        key={item.id}
                        type="button"
                        className={`da-sidebar-top-item ${activeItem === item.id ? 'is-active' : ''}`}
                        onClick={() => {
                            onNavigate(item.id);
                            setLocalActive(null);
                        }}
                    >
                        <MenuIcon type={item.id} />
                        <span>{item.label}</span>
                    </button>
                ))}
            </nav>
        </div>
    );
}
