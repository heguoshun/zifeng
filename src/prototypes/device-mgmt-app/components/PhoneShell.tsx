import React from 'react';
import NavBar, { type NavBarProps } from './NavBar';
import StatusBar from './StatusBar';
import TabBar, { type TabId } from './TabBar';

type PhoneShellProps = {
    children: React.ReactNode;
    showChrome?: boolean;
    navBar?: NavBarProps | null;
    showTabBar?: boolean;
    activeTab?: TabId;
    onTabChange?: (tab: TabId) => void;
    tabBadges?: Partial<Record<TabId, number>>;
};

export function PhoneShell({
    children,
    showChrome = true,
    navBar = null,
    showTabBar = false,
    activeTab = 'home',
    onTabChange,
    tabBadges = {},
}: PhoneShellProps) {
    return (
        <div className="dma-app">
            <div className="dma-screen">
                {showChrome ? (
                    <div className="dma-chrome">
                        <StatusBar />
                        {navBar ? <NavBar {...navBar} /> : null}
                    </div>
                ) : null}
                <div className="dma-screen-body">{children}</div>
                {showTabBar && onTabChange ? (
                    <TabBar active={activeTab} onChange={onTabChange} badges={tabBadges} />
                ) : null}
            </div>
        </div>
    );
}
