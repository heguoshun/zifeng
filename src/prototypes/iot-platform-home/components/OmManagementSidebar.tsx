import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import '../device-access.css';

export type OmManagementPageId =
    | 'work-order-management'
    | 'work-order-detail'
    | 'work-order-create'
    | 'login-log'
    | 'operation-log';

type SidebarMenuGroupData = {
    id: 'system-monitor' | 'log-mgmt';
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
    {
        id: 'log-mgmt',
        label: '日志管理',
        items: [
            { id: 'login-log', label: '登录日志' },
            { id: 'operation-log', label: '操作日志' },
        ],
    },
];

function SidebarMenuIcon({ type }: { type: 'work-order' | 'system-monitor' | 'log-mgmt' }) {
    if (type === 'work-order') {
        return (
            <svg className="da-sidebar-icon" viewBox="0 0 16 16" aria-hidden="true">
                <rect x="3" y="2" width="10" height="12" rx="1.2" fill="none" stroke="currentColor" strokeWidth="1.2" />
                <path d="M5.5 5.5h5M5.5 8h5M5.5 10.5h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
        );
    }

    if (type === 'system-monitor') {
        return (
            <svg className="da-sidebar-icon" viewBox="0 0 16 16" aria-hidden="true">
                <path d="M8 2.2l5.2 9H2.8L8 2.2z" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
                <path d="M8 6.2v2.6M8 10.8h.01" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
        );
    }

    return (
        <svg className="da-sidebar-icon" viewBox="0 0 16 16" aria-hidden="true">
            <circle cx="8" cy="8" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
            <path d="M8 5v3.2l2 1.2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

type OmManagementSidebarProps = {
    pageId: OmManagementPageId;
    onNavigate: (pageId: OmManagementPageId) => void;
};

export default function OmManagementSidebar({ pageId, onNavigate }: OmManagementSidebarProps) {
    const [menuExpanded, setMenuExpanded] = useState({
        'system-monitor': false,
        'log-mgmt': pageId === 'login-log' || pageId === 'operation-log',
    });
    const [localActive, setLocalActive] = useState<string | null>(null);

    useEffect(() => {
        setLocalActive(null);
    }, [pageId]);

    const routeActive = pageId === 'work-order-management'
        || pageId === 'work-order-detail'
        || pageId === 'work-order-create'
        ? 'work-order-management'
        : pageId;
    const activeItem = localActive ?? routeActive;

    const handleItemClick = (itemId: string) => {
        if (itemId === 'work-order-management') {
            onNavigate('work-order-management');
            setLocalActive(null);
            return;
        }
        if (itemId === 'login-log') {
            onNavigate('login-log');
            setLocalActive(null);
            return;
        }
        if (itemId === 'operation-log') {
            onNavigate('operation-log');
            setLocalActive(null);
            return;
        }
        setLocalActive(itemId);
    };

    return (
        <div className="da-sidebar-shell">
            <nav className="da-sidebar-nav">
                <button
                    type="button"
                    className={`da-sidebar-top-item ${activeItem === 'work-order-management' ? 'is-active' : ''}`}
                    onClick={() => handleItemClick('work-order-management')}
                >
                    <SidebarMenuIcon type="work-order" />
                    <span>工单管理</span>
                </button>
                {sidebarMenuGroups.map((group) => {
                    const isOpen = menuExpanded[group.id];
                    return (
                        <div className="da-sidebar-block" key={group.id}>
                            <button
                                type="button"
                                className="da-sidebar-group__head"
                                onClick={() => setMenuExpanded((prev) => ({ ...prev, [group.id]: !prev[group.id] }))}
                            >
                                <SidebarMenuIcon type={group.id} />
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
                                                onClick={() => handleItemClick(item.id)}
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
