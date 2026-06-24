import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import '../device-access.css';

type SidebarMenuGroupData = {
    id: 'system-monitor';
    label: string;
    items: { id: string; label: string }[];
};

const sidebarMenuGroups: SidebarMenuGroupData[] = [
    {
        id: 'system-monitor',
        label: '系统监控',
        items: [
            { id: 'system-alarm-info', label: '系统告警信息' },
            { id: 'platform-status', label: '平台状态监控' },
            { id: 'system-alarm-rules', label: '系统告警规则' },
        ],
    },
];

function SidebarMenuIcon() {
    return (
        <svg className="da-sidebar-icon" viewBox="0 0 16 16" aria-hidden="true">
            <path d="M8 2.2l5.2 9H2.8L8 2.2z" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
            <path d="M8 6.2v2.6M8 10.8h.01" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
    );
}

type OmManagementSidebarProps = {
    activeItemId?: string;
};

export default function OmManagementSidebar({ activeItemId }: OmManagementSidebarProps) {
    const [menuExpanded, setMenuExpanded] = useState({ 'system-monitor': true });
    const [localActive, setLocalActive] = useState<string | null>(null);

    useEffect(() => {
        setLocalActive(null);
    }, [activeItemId]);

    const activeItem = localActive ?? activeItemId ?? null;

    return (
        <div className="da-sidebar-shell">
            <nav className="da-sidebar-nav">
                {sidebarMenuGroups.map((group) => {
                    const isOpen = menuExpanded[group.id];
                    return (
                        <div className="da-sidebar-block" key={group.id}>
                            <button
                                type="button"
                                className="da-sidebar-group__head"
                                onClick={() => setMenuExpanded((prev) => ({ ...prev, [group.id]: !prev[group.id] }))}
                            >
                                <SidebarMenuIcon />
                                <span className="da-sidebar-group__label">{group.label}</span>
                                {isOpen ? <ChevronDown size={12} className="da-sidebar-group__arrow" /> : <ChevronRight size={12} className="da-sidebar-group__arrow" />}
                            </button>
                            {isOpen && (
                                <ul className="da-sidebar-children">
                                    {group.items.map((item) => (
                                        <li key={item.id}>
                                            <button
                                                type="button"
                                                className={`da-sidebar-link ${activeItem === item.id ? 'is-active' : ''}`}
                                                onClick={() => setLocalActive(item.id)}
                                            >
                                                {item.label}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    );
                })}
            </nav>
        </div>
    );
}
