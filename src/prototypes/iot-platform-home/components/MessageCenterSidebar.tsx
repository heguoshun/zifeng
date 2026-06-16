import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import '../device-access.css';

export type MessageCenterPageId =
    | 'device-alarm-info'
    | 'alarm-rule-config'
    | 'alarm-level-mgmt'
    | 'msg-subscribe'
    | 'push-source-config'
    | 'msg-template'
    | 'history-msg';

type SidebarMenuGroupData = {
    id: 'alarm' | 'config' | 'history';
    label: string;
    items: { id: string; label: string }[];
};

const sidebarMenuGroups: SidebarMenuGroupData[] = [
    {
        id: 'alarm',
        label: '设备告警',
        items: [
            { id: 'device-alarm-info', label: '设备告警信息' },
            { id: 'alarm-rule-config', label: '告警规则配置' },
            { id: 'alarm-level-mgmt', label: '告警等级管理' },
        ],
    },
    {
        id: 'config',
        label: '消息配置',
        items: [
            { id: 'msg-subscribe', label: '消息订阅' },
            { id: 'push-source-config', label: '推送源配置' },
            { id: 'msg-template', label: '消息模板' },
        ],
    },
    {
        id: 'history',
        label: '历史消息',
        items: [
            { id: 'history-msg', label: '历史消息' },
        ],
    },
];

function SidebarMenuIcon({ type }: { type: 'alarm' | 'config' | 'history' }) {
    if (type === 'alarm') {
        return (
            <svg className="da-sidebar-icon" viewBox="0 0 16 16" aria-hidden="true">
                <path d="M8 2.2l5.2 9H2.8L8 2.2z" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
                <path d="M8 6.2v2.6M8 10.8h.01" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
        );
    }

    if (type === 'config') {
        return (
            <svg className="da-sidebar-icon" viewBox="0 0 16 16" aria-hidden="true">
                <rect x="2" y="3" width="12" height="10" rx="1.4" fill="none" stroke="currentColor" strokeWidth="1.2" />
                <path d="M5 6.5h6M5 9h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
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

type MessageCenterSidebarProps = {
    pageId: MessageCenterPageId;
    onNavigate: (pageId: MessageCenterPageId) => void;
};

export default function MessageCenterSidebar({ pageId, onNavigate }: MessageCenterSidebarProps) {
    const [menuExpanded, setMenuExpanded] = useState({
        alarm: pageId === 'device-alarm-info' || pageId === 'alarm-rule-config' || pageId === 'alarm-level-mgmt',
        config: pageId === 'msg-subscribe' || pageId === 'push-source-config' || pageId === 'msg-template',
        history: pageId === 'history-msg',
    });
    const [localActive, setLocalActive] = useState<string | null>(null);

    useEffect(() => {
        setLocalActive(null);
        if (pageId === 'msg-subscribe' || pageId === 'push-source-config' || pageId === 'msg-template') {
            setMenuExpanded((prev) => ({ ...prev, config: true }));
        }
        if (pageId === 'history-msg') {
            setMenuExpanded((prev) => ({ ...prev, history: true }));
        }
    }, [pageId]);

    const navigablePages: MessageCenterPageId[] = [
        'device-alarm-info',
        'alarm-rule-config',
        'alarm-level-mgmt',
        'msg-subscribe',
        'push-source-config',
        'msg-template',
        'history-msg',
    ];
    const activeItem = localActive ?? pageId;

    const handleItemClick = (itemId: string) => {
        if (navigablePages.includes(itemId as MessageCenterPageId)) {
            onNavigate(itemId as MessageCenterPageId);
            setLocalActive(null);
            return;
        }
        setLocalActive(itemId);
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
