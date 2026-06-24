import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import '../device-access.css';

export type SystemManagementPageId =
    | 'tenant-mgmt'
    | 'user-mgmt'
    | 'role-mgmt'
    | 'dept-mgmt'
    | 'position-mgmt'
    | 'menu-mgmt'
    | 'dict-mgmt'
    | 'param-mgmt'
    | 'notice-announcement'
    | 'file-mgmt'
    | 'login-log'
    | 'operation-log';

const SIDEBAR_ITEMS_BEFORE_LOG: { id: SystemManagementPageId; label: string }[] = [
    { id: 'tenant-mgmt', label: '租户管理' },
    { id: 'user-mgmt', label: '用户管理' },
    { id: 'role-mgmt', label: '角色管理' },
    { id: 'dept-mgmt', label: '部门管理' },
    { id: 'position-mgmt', label: '岗位管理' },
];

const SIDEBAR_ITEMS_AFTER_LOG: { id: SystemManagementPageId; label: string }[] = [
    { id: 'menu-mgmt', label: '菜单管理' },
    { id: 'dict-mgmt', label: '字典管理' },
    { id: 'param-mgmt', label: '参数管理' },
    { id: 'notice-announcement', label: '通知公告' },
    { id: 'file-mgmt', label: '文件管理' },
];

const LOG_MENU_ITEMS: { id: SystemManagementPageId; label: string }[] = [
    { id: 'login-log', label: '登录日志' },
    { id: 'operation-log', label: '操作日志' },
];

function MenuIcon({ type }: { type: string }) {
    switch (type) {
        case 'tenant-mgmt':
            return (
                <svg className="da-sidebar-icon" viewBox="0 0 16 16" aria-hidden="true">
                    <rect x="1.5" y="5" width="5" height="9.5" rx="0.8" fill="none" stroke="currentColor" strokeWidth="1.2" />
                    <rect x="9.5" y="2" width="5" height="12.5" rx="0.8" fill="none" stroke="currentColor" strokeWidth="1.2" />
                    <path d="M4 13.5h8" stroke="currentColor" strokeWidth="1.2" />
                </svg>
            );
        case 'user-mgmt':
            return (
                <svg className="da-sidebar-icon" viewBox="0 0 16 16" aria-hidden="true">
                    <circle cx="8" cy="5" r="3" fill="none" stroke="currentColor" strokeWidth="1.2" />
                    <path d="M2.5 14c0-3.3 2.5-5.5 5.5-5.5s5.5 2.2 5.5 5.5" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
            );
        case 'role-mgmt':
            return (
                <svg className="da-sidebar-icon" viewBox="0 0 16 16" aria-hidden="true">
                    <path d="M8 1.5L2.5 4v4.5c0 3 2.3 5.5 5.5 6 3.2-.5 5.5-3 5.5-6V4L8 1.5z" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
                    <path d="M6 8l1.5 1.5L10 7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            );
        case 'dept-mgmt':
            return (
                <svg className="da-sidebar-icon" viewBox="0 0 16 16" aria-hidden="true">
                    <rect x="5.5" y="1.5" width="5" height="4" rx="0.8" fill="none" stroke="currentColor" strokeWidth="1.2" />
                    <rect x="1.5" y="8.5" width="5" height="4" rx="0.8" fill="none" stroke="currentColor" strokeWidth="1.2" />
                    <rect x="9.5" y="8.5" width="5" height="4" rx="0.8" fill="none" stroke="currentColor" strokeWidth="1.2" />
                    <path d="M8 5.5v3M5.5 8.5H4M11.5 8.5H12" stroke="currentColor" strokeWidth="1.2" />
                </svg>
            );
        case 'menu-mgmt':
            return (
                <svg className="da-sidebar-icon" viewBox="0 0 16 16" aria-hidden="true">
                    <path d="M2.5 4h11M2.5 8h11M2.5 12h7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
            );
        case 'position-mgmt':
            return (
                <svg className="da-sidebar-icon" viewBox="0 0 16 16" aria-hidden="true">
                    <rect x="3.5" y="1.5" width="9" height="5" rx="0.8" fill="none" stroke="currentColor" strokeWidth="1.2" />
                    <path d="M5.5 6.5v3c0 .6.4 1 1 1h3c.6 0 1-.4 1-1v-3" fill="none" stroke="currentColor" strokeWidth="1.2" />
                    <circle cx="8" cy="11.5" r="1.2" fill="none" stroke="currentColor" strokeWidth="1.2" />
                    <line x1="8" y1="12.7" x2="8" y2="14.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
            );
        case 'dict-mgmt':
            return (
                <svg className="da-sidebar-icon" viewBox="0 0 16 16" aria-hidden="true">
                    <rect x="2.5" y="2" width="11" height="12" rx="1.2" fill="none" stroke="currentColor" strokeWidth="1.2" />
                    <path d="M5 5.5h6M5 8h6M5 10.5h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
            );
        case 'param-mgmt':
            return (
                <svg className="da-sidebar-icon" viewBox="0 0 16 16" aria-hidden="true">
                    <circle cx="8" cy="8" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
                    <path d="M6.5 6.5h3M6.5 9.5h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                    <path d="M8 4v8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
            );
        case 'notice-announcement':
            return (
                <svg className="da-sidebar-icon" viewBox="0 0 16 16" aria-hidden="true">
                    <path d="M3 3.5h10v9H3z" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
                    <path d="M5.5 6.5h5M5.5 9h3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                    <path d="M6.5 12.5h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
            );
        case 'file-mgmt':
            return (
                <svg className="da-sidebar-icon" viewBox="0 0 16 16" aria-hidden="true">
                    <path d="M4 2.5h5.5L13 6v7.5H4z" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
                    <path d="M9.5 2.5V6H13" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
                    <path d="M6 9h4M6 11.5h2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
            );
        default:
            return null;
    }
}

type SystemManagementSidebarProps = {
    pageId: SystemManagementPageId;
    onNavigate: (pageId: SystemManagementPageId) => void;
    onUnavailable?: (label: string) => void;
};

export default function SystemManagementSidebar({
    pageId,
    onNavigate,
    onUnavailable,
}: SystemManagementSidebarProps) {
    const [localActive, setLocalActive] = useState<string | null>(null);
    const [logExpanded, setLogExpanded] = useState(
        pageId === 'login-log' || pageId === 'operation-log',
    );

    useEffect(() => {
        setLocalActive(null);
    }, [pageId]);

    useEffect(() => {
        if (pageId === 'login-log' || pageId === 'operation-log') {
            setLogExpanded(true);
        }
    }, [pageId]);

    const activeItem = localActive ?? pageId;

    const handleItemClick = (itemId: SystemManagementPageId) => {
        if (
            itemId === 'tenant-mgmt'
            || itemId === 'user-mgmt'
            || itemId === 'role-mgmt'
            || itemId === 'dept-mgmt'
            || itemId === 'position-mgmt'
            || itemId === 'menu-mgmt'
            || itemId === 'dict-mgmt'
            || itemId === 'param-mgmt'
            || itemId === 'notice-announcement'
            || itemId === 'file-mgmt'
            || itemId === 'login-log'
            || itemId === 'operation-log'
        ) {
            onNavigate(itemId);
            setLocalActive(null);
            return;
        }
        const item = [...SIDEBAR_ITEMS_BEFORE_LOG, ...SIDEBAR_ITEMS_AFTER_LOG, ...LOG_MENU_ITEMS]
            .find((entry) => entry.id === itemId);
        onUnavailable?.(item?.label ?? '该功能');
        setLocalActive(itemId);
    };

    return (
        <div className="da-sidebar-shell">
            <nav className="da-sidebar-nav">
                {SIDEBAR_ITEMS_BEFORE_LOG.map((item) => (
                    <button
                        key={item.id}
                        type="button"
                        className={`da-sidebar-top-item ${activeItem === item.id ? 'is-active' : ''}`}
                        onClick={() => handleItemClick(item.id)}
                    >
                        <MenuIcon type={item.id} />
                        <span>{item.label}</span>
                    </button>
                ))}

                <div className="da-sidebar-block">
                    <button
                        type="button"
                        className="da-sidebar-group__head"
                        onClick={() => setLogExpanded((prev) => !prev)}
                    >
                        <svg className="da-sidebar-icon" viewBox="0 0 16 16" aria-hidden="true">
                            <circle cx="8" cy="8" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
                            <path d="M8 5v3.2l2 1.2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span className="da-sidebar-group__label">日志管理</span>
                        {logExpanded
                            ? <ChevronDown size={12} className="da-sidebar-group__arrow" />
                            : <ChevronRight size={12} className="da-sidebar-group__arrow" />}
                    </button>
                    {logExpanded && (
                        <ul className="da-sidebar-children">
                            {LOG_MENU_ITEMS.map((item) => (
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

                {SIDEBAR_ITEMS_AFTER_LOG.map((item) => (
                    <button
                        key={item.id}
                        type="button"
                        className={`da-sidebar-top-item ${activeItem === item.id ? 'is-active' : ''}`}
                        onClick={() => handleItemClick(item.id)}
                    >
                        <MenuIcon type={item.id} />
                        <span>{item.label}</span>
                    </button>
                ))}
            </nav>
        </div>
    );
}
