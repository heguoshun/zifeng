import React, { useEffect, useRef, useState } from 'react';
import { Bell, ChevronDown, UserRound } from 'lucide-react';
import NotificationDropdown, { type NotificationFilter } from './NotificationDropdown';
import ProfileDropdown from './ProfileDropdown';

const TOP_TABS = ['设备接入', '消息中心', '运维管理', '系统管理'] as const;
const MESSAGE_CENTER_PAGE_ID = 'device-alarm-info';
const OM_MANAGEMENT_PAGE_ID = 'work-order-management';
const SYSTEM_MANAGEMENT_PAGE_ID = 'tenant-mgmt';

type AppShellProps = {
    activeTopTab?: typeof TOP_TABS[number];
    sidebar: React.ReactNode;
    children: React.ReactNode;
    onTopTabChange: (tab: typeof TOP_TABS[number]) => void;
    onNavigateMessageCenter?: (filter?: NotificationFilter) => void;
    onNavigateOmManagement?: (filter?: NotificationFilter) => void;
    onNavigateSystemManagement?: () => void;
};

function navigateToMessageCenter(onNavigateMessageCenter?: (filter?: NotificationFilter) => void, filter?: NotificationFilter) {
    if (onNavigateMessageCenter) {
        onNavigateMessageCenter(filter);
        return;
    }
    const nextHash = `page=${MESSAGE_CENTER_PAGE_ID}`;
    if (window.location.hash.replace(/^#/, '') !== nextHash) {
        window.location.hash = nextHash;
    }
}

function navigateToOmManagement(onNavigateOmManagement?: (filter?: NotificationFilter) => void, filter?: NotificationFilter) {
    if (onNavigateOmManagement) {
        onNavigateOmManagement(filter);
        return;
    }
    const nextHash = `page=${OM_MANAGEMENT_PAGE_ID}`;
    if (window.location.hash.replace(/^#/, '') !== nextHash) {
        window.location.hash = nextHash;
    }
}

function navigateToSystemManagement(onNavigateSystemManagement?: () => void) {
    if (onNavigateSystemManagement) {
        onNavigateSystemManagement();
        return;
    }
    const nextHash = `page=${SYSTEM_MANAGEMENT_PAGE_ID}`;
    if (window.location.hash.replace(/^#/, '') !== nextHash) {
        window.location.hash = nextHash;
    }
}

export default function AppShell({
    activeTopTab,
    sidebar,
    children,
    onTopTabChange,
    onNavigateMessageCenter,
    onNavigateOmManagement,
    onNavigateSystemManagement,
}: AppShellProps) {
    const [notifOpen, setNotifOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);

    const bellRef = useRef<HTMLSpanElement>(null);
    const userAreaRef = useRef<HTMLDivElement>(null);

    // Close dropdowns on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as Node;

            if (
                notifOpen &&
                bellRef.current &&
                !bellRef.current.contains(target)
            ) {
                setNotifOpen(false);
            }

            if (
                profileOpen &&
                userAreaRef.current &&
                !userAreaRef.current.contains(target)
            ) {
                setProfileOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [notifOpen, profileOpen]);

    const handleTabClick = (tab: typeof TOP_TABS[number]) => {
        if (tab === '消息中心') {
            navigateToMessageCenter(onNavigateMessageCenter);
            return;
        }
        if (tab === '运维管理') {
            navigateToOmManagement(onNavigateOmManagement);
            return;
        }
        if (tab === '系统管理') {
            navigateToSystemManagement(onNavigateSystemManagement);
            return;
        }
        onTopTabChange(tab);
    };

    const handleBellClick = () => {
        setNotifOpen((prev) => !prev);
        setProfileOpen(false);
    };

    const handleUserAreaClick = () => {
        setProfileOpen((prev) => !prev);
        setNotifOpen(false);
    };

    return (
        <main className="iot-page" aria-label="紫峰装备智慧化管理平台">
            <header className="topbar">
                <div className="brand">
                    <span className="brand-mark" />
                    <strong>紫峰装备智慧化管理平台</strong>
                </div>
                <div className="top-tabs">
                    {TOP_TABS.map((tab) => (
                        <button
                            className={activeTopTab && tab === activeTopTab ? 'tab-active' : ''}
                            key={tab}
                            type="button"
                            onClick={() => handleTabClick(tab)}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
                <div className="user-area">
                    <span
                        ref={bellRef}
                        className={`bell-wrap ${notifOpen ? 'is-active' : ''}`}
                        onClick={handleBellClick}
                        role="button"
                        tabIndex={0}
                    >
                        <Bell size={16} />
                        <i className="bell-dot" />
                        {notifOpen && (
                            <NotificationDropdown
                                open={notifOpen}
                                onClose={() => setNotifOpen(false)}
                                onNavigateMessageCenter={onNavigateMessageCenter}
                                onNavigateOmManagement={onNavigateOmManagement}
                            />
                        )}
                    </span>

                    <div
                        ref={userAreaRef}
                        className={`user-area__profile ${profileOpen ? 'is-active' : ''}`}
                        onClick={handleUserAreaClick}
                        role="button"
                        tabIndex={0}
                    >
                        <span className="avatar">
                            <UserRound size={16} />
                        </span>
                        <span className="username">superadmin</span>
                        <ChevronDown size={12} />
                        {profileOpen && (
                            <ProfileDropdown
                                open={profileOpen}
                                onClose={() => setProfileOpen(false)}
                            />
                        )}
                    </div>
                </div>
            </header>

            <div className="page-body">
                <aside className="sidebar">
                    {sidebar}
                    <div className="sidebar-art" aria-hidden="true" />
                </aside>
                <section className="main-shell">{children}</section>
            </div>
        </main>
    );
}

export { TOP_TABS, MESSAGE_CENTER_PAGE_ID, OM_MANAGEMENT_PAGE_ID, SYSTEM_MANAGEMENT_PAGE_ID };
export type { NotificationFilter };
