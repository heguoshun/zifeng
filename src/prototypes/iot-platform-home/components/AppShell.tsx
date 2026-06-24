import React, { useEffect, useRef, useState } from 'react';
import { Bell, ChevronDown, UserRound } from 'lucide-react';
import platformLogo from '../assets/platform-logo.png';
import sidebarBg from '../assets/sidebar-bg.png';
import NotificationDropdown, { type NotificationFilter } from './NotificationDropdown';
import ProfileDropdown from './ProfileDropdown';
import { useOptionalPlatformAuth } from './PlatformAuthContext';
import { useAnnouncementNotifications } from './AnnouncementNotificationContext';

const TOP_TABS = ['设备接入', '大表中心', '告警工单', '消息中心', '系统管理'] as const;
const LARGE_METER_PAGE_ID = 'data-monitor';
const MESSAGE_CENTER_PAGE_ID = 'msg-subscribe';
const ALARM_WORK_ORDER_PAGE_ID = 'awo-device-alarm-info';
const SYSTEM_MANAGEMENT_PAGE_ID = 'tenant-mgmt';

type AppShellProps = {
    activeTopTab?: typeof TOP_TABS[number];
    sidebar: React.ReactNode;
    children: React.ReactNode;
    onTopTabChange: (tab: typeof TOP_TABS[number]) => void;
    onNavigateLargeMeterCenter?: () => void;
    onNavigateMessageCenter?: (filter?: NotificationFilter) => void;
    onNavigateAlarmWorkOrder?: (filter?: NotificationFilter) => void;
    onNavigateSystemManagement?: () => void;
};

function navigateToLargeMeterCenter(onNavigateLargeMeterCenter?: () => void) {
    if (onNavigateLargeMeterCenter) {
        onNavigateLargeMeterCenter();
        return;
    }
    const nextHash = `page=${LARGE_METER_PAGE_ID}`;
    if (window.location.hash.replace(/^#/, '') !== nextHash) {
        window.location.hash = nextHash;
    }
}

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

function navigateToAlarmWorkOrder(onNavigateAlarmWorkOrder?: (filter?: NotificationFilter) => void, filter?: NotificationFilter) {
    if (onNavigateAlarmWorkOrder) {
        onNavigateAlarmWorkOrder(filter);
        return;
    }
    const nextHash = `page=${ALARM_WORK_ORDER_PAGE_ID}`;
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
    onNavigateLargeMeterCenter,
    onNavigateMessageCenter,
    onNavigateAlarmWorkOrder,
    onNavigateSystemManagement,
}: AppShellProps) {
    const auth = useOptionalPlatformAuth();
    const [notifOpen, setNotifOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const [otherUnreadCount, setOtherUnreadCount] = useState(4);
    const { unreadAnnouncementCount } = useAnnouncementNotifications();
    const displayName = auth?.user.displayName || auth?.user.account || 'superadmin';
    const hasUnread = unreadAnnouncementCount > 0 || otherUnreadCount > 0;

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
        if (tab === '大表中心') {
            navigateToLargeMeterCenter(onNavigateLargeMeterCenter);
            return;
        }
        if (tab === '告警工单') {
            navigateToAlarmWorkOrder(onNavigateAlarmWorkOrder);
            return;
        }
        if (tab === '消息中心') {
            navigateToMessageCenter(onNavigateMessageCenter);
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
                    <img className="brand-mark" src={platformLogo} alt="紫峰装备" />
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
                        {hasUnread ? <i className="bell-dot" /> : null}
                        {notifOpen && (
                            <NotificationDropdown
                                open={notifOpen}
                                onClose={() => setNotifOpen(false)}
                                onNavigateMessageCenter={onNavigateMessageCenter}
                                onNavigateAlarmWorkOrder={onNavigateAlarmWorkOrder}
                                onOtherUnreadCountChange={setOtherUnreadCount}
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
                        <span className="username">{displayName}</span>
                        <ChevronDown size={12} />
                        {profileOpen && (
                            <ProfileDropdown
                                open={profileOpen}
                                onClose={() => setProfileOpen(false)}
                                onLogout={auth?.logout}
                            />
                        )}
                    </div>
                </div>
            </header>

            <div className="page-body">
                <aside className="sidebar">
                    <div className="sidebar-bg" style={{ backgroundImage: `url(${sidebarBg})` }} aria-hidden="true" />
                    {sidebar}
                </aside>
                <section className="main-shell">{children}</section>
            </div>
        </main>
    );
}

export { TOP_TABS, LARGE_METER_PAGE_ID, MESSAGE_CENTER_PAGE_ID, ALARM_WORK_ORDER_PAGE_ID, SYSTEM_MANAGEMENT_PAGE_ID };
export type { NotificationFilter };
