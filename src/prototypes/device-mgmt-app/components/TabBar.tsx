import React from 'react';
import { Bell, ClipboardList, Gauge, Home, User } from 'lucide-react';

export type TabId = 'home' | 'devices' | 'alarms' | 'workorders' | 'profile';

type TabBarProps = {
    active: TabId;
    onChange: (tab: TabId) => void;
    badges: Partial<Record<TabId, number>>;
};

const TABS: Array<{ id: TabId; label: string; icon: React.ComponentType<{ size?: number; strokeWidth?: number }> }> = [
    { id: 'home', label: '首页', icon: Home },
    { id: 'devices', label: '设备', icon: Gauge },
    { id: 'alarms', label: '告警', icon: Bell },
    { id: 'workorders', label: '工单', icon: ClipboardList },
    { id: 'profile', label: '我的', icon: User },
];

export default function TabBar({ active, onChange, badges }: TabBarProps) {
    return (
        <nav className="dma-tabbar" aria-label="底部导航">
            {TABS.map((tab) => {
                const badge = badges[tab.id];
                const Icon = tab.icon;
                const isActive = active === tab.id;
                return (
                    <button
                        key={tab.id}
                        type="button"
                        className={isActive ? 'is-active' : ''}
                        onClick={() => onChange(tab.id)}
                        aria-current={isActive ? 'page' : undefined}
                    >
                        <span className="dma-tabbar-icon">
                            <Icon size={22} strokeWidth={isActive ? 2.4 : 2} />
                            {badge ? <span className="dma-tabbar-badge">{badge > 99 ? '99+' : badge}</span> : null}
                        </span>
                        <span className="dma-tabbar-label">{tab.label}</span>
                    </button>
                );
            })}
        </nav>
    );
}
