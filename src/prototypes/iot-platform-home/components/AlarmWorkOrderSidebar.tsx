import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import '../device-access.css';

export type AlarmWorkOrderPageId =
    | 'awo-device-alarm-info'
    | 'awo-alarm-rule-config'
    | 'awo-alarm-level-mgmt'
    | 'awo-work-order-management'
    | 'work-order-management'
    | 'work-order-detail'
    | 'work-order-create';

type SidebarMenuGroupData = {
    id: 'alarm' | 'work-order';
    label: string;
    items: { id: string; label: string }[];
};

const sidebarMenuGroups: SidebarMenuGroupData[] = [
    {
        id: 'alarm',
        label: '设备告警',
        items: [
            { id: 'awo-device-alarm-info', label: '设备告警信息' },
            { id: 'awo-alarm-rule-config', label: '告警规则配置' },
            { id: 'awo-alarm-level-mgmt', label: '告警等级管理' },
        ],
    },
    {
        id: 'work-order',
        label: '工单管理',
        items: [
            { id: 'awo-work-order-management', label: '工单管理' },
        ],
    },
];

function SidebarMenuIcon({ type }: { type: 'alarm' | 'work-order' }) {
    if (type === 'work-order') {
        return (
            <svg className="da-sidebar-icon" viewBox="0 0 16 16" aria-hidden="true">
                <rect x="3" y="2" width="10" height="12" rx="1.2" fill="none" stroke="currentColor" strokeWidth="1.2" />
                <path d="M5.5 5.5h5M5.5 8h5M5.5 10.5h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
        );
    }

    return (
        <svg className="da-sidebar-icon" viewBox="0 0 16 16" aria-hidden="true">
            <path d="M8 2.2l5.2 9H2.8L8 2.2z" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
            <path d="M8 6.2v2.6M8 10.8h.01" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
    );
}

type AlarmWorkOrderSidebarProps = {
    pageId: AlarmWorkOrderPageId;
    onNavigate: (pageId: AlarmWorkOrderPageId) => void;
};

export default function AlarmWorkOrderSidebar({ pageId, onNavigate }: AlarmWorkOrderSidebarProps) {
    const [menuExpanded, setMenuExpanded] = useState({
        alarm: true,
        'work-order': true,
    });

    useEffect(() => {
        setMenuExpanded({ alarm: true, 'work-order': true });
    }, [pageId]);

    const routeActive = pageId === 'work-order-detail' || pageId === 'work-order-create'
        ? 'awo-work-order-management'
        : pageId;
    const activeItem = routeActive;

    const handleItemClick = (itemId: string) => {
        if (itemId === 'awo-work-order-management') {
            onNavigate('work-order-management');
            return;
        }
        onNavigate(itemId as AlarmWorkOrderPageId);
    };

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
