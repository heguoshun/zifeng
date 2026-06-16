import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import '../device-access.css';

export type DeviceAccessPageId =
    | 'home'
    | 'product-management'
    | 'product-category'
    | 'product-create'
    | 'model-library'
    | 'device-management'
    | 'device-create'
    | 'device-group'
    | 'device-map'
    | 'remote-upgrade'
    | 'protocol-mgmt'
    | 'network-service'
    | 'network-protocol'
    | 'network-protocol-create'
    | 'network-protocol-edit';

type SidebarMenuGroupData = {
    id: 'dev' | 'device' | 'map' | 'om';
    label: string;
    items: { id: string; label: string }[];
};

const sidebarMenuGroups: SidebarMenuGroupData[] = [
    {
        id: 'dev',
        label: '产品开发',
        items: [
            { id: 'product-mgmt', label: '产品管理' },
        ],
    },
    {
        id: 'device',
        label: '设备管理',
        items: [
            { id: 'device-mgmt', label: '设备管理' },
            { id: 'device-group', label: '设备分组' },
        ],
    },
    {
        id: 'map',
        label: '设备地图',
        items: [
            { id: 'device-map', label: '设备地图' },
        ],
    },
    {
        id: 'om',
        label: '设备运维',
        items: [
            { id: 'remote-upgrade', label: '远程升级' },
            { id: 'network-protocol', label: '网络协议' },
            { id: 'network-service', label: '网络服务' },
            { id: 'protocol-mgmt', label: '协议管理' },
        ],
    },
];

function SidebarMenuIcon({ type }: { type: 'overview' | 'dev' | 'device' | 'map' | 'om' }) {
    if (type === 'overview') {
        return (
            <svg className="da-sidebar-icon" viewBox="0 0 16 16" aria-hidden="true">
                <rect x="2" y="2" width="12" height="12" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
                <path d="M5 11V8.5M8 11V6M11 11V9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
        );
    }

    if (type === 'dev') {
        return (
            <svg className="da-sidebar-icon" viewBox="0 0 16 16" aria-hidden="true">
                <rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1.2" fill="none" stroke="currentColor" strokeWidth="1.2" />
                <rect x="9" y="1.5" width="5.5" height="5.5" rx="1.2" fill="none" stroke="currentColor" strokeWidth="1.2" />
                <rect x="1.5" y="9" width="5.5" height="5.5" rx="1.2" fill="none" stroke="currentColor" strokeWidth="1.2" />
                <rect x="9" y="9" width="5.5" height="5.5" rx="1.2" fill="none" stroke="currentColor" strokeWidth="1.2" />
            </svg>
        );
    }

    if (type === 'device') {
        return (
            <svg className="da-sidebar-icon" viewBox="0 0 16 16" aria-hidden="true">
                <rect x="2" y="3" width="12" height="8.5" rx="1.4" fill="none" stroke="currentColor" strokeWidth="1.2" />
                <path d="M5 12.5h6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                <path d="M8 12.5V14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                <circle cx="8" cy="7.2" r="2" fill="none" stroke="currentColor" strokeWidth="1.2" />
                <path d="M8 5.7V4.8M8 9.7v.9M6.1 7.2H5.2M10.8 7.2H9.9" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
            </svg>
        );
    }

    if (type === 'map') {
        return (
            <svg className="da-sidebar-icon" viewBox="0 0 16 16" aria-hidden="true">
                <path d="M2.5 4.5l4.5-1.8 4 1.8 4.5-1.8V12l-4.5 1.8-4-1.8-4.5 1.8V4.5z" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
                <path d="M7 2.7v10.6M11 4.5v10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
        );
    }

    if (type === 'om') {
        return (
            <svg className="da-sidebar-icon" viewBox="0 0 16 16" aria-hidden="true">
                <rect x="2" y="3" width="12" height="8.5" rx="1.4" fill="none" stroke="currentColor" strokeWidth="1.2" />
                <path d="M5 12.5h6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                <circle cx="8" cy="7.2" r="2" fill="none" stroke="currentColor" strokeWidth="1.2" />
            </svg>
        );
    }

    return null;
}

type DeviceAccessSidebarProps = {
    pageId: DeviceAccessPageId;
    onNavigate: (pageId: DeviceAccessPageId) => void;
};

export default function DeviceAccessSidebar({ pageId, onNavigate }: DeviceAccessSidebarProps) {
    const [menuExpanded, setMenuExpanded] = useState({
        dev: true,
        device: true,
        map: true,
        om: true,
    });
    const [localActive, setLocalActive] = useState<string | null>(null);

    useEffect(() => {
        setLocalActive(null);
    }, [pageId]);

    const routeActive = pageId === 'home'
        ? 'home'
        : pageId === 'device-management' || pageId === 'device-create'
            ? 'device-mgmt'
            : pageId === 'device-group'
                ? 'device-group'
                : pageId === 'device-map'
                    ? 'device-map'
                    : pageId === 'network-protocol-create' || pageId === 'network-protocol-edit'
                            ? 'network-protocol'
                            : pageId === 'remote-upgrade'
                                || pageId === 'protocol-mgmt'
                                || pageId === 'network-service'
                                || pageId === 'network-protocol'
                                ? pageId
                                : 'product-mgmt';
    const activeItem = localActive ?? routeActive;

    const handleItemClick = (itemId: string) => {
        if (itemId === 'home') {
            onNavigate('home');
            setLocalActive(null);
            return;
        }
        if (itemId === 'product-mgmt') {
            onNavigate('product-management');
            setLocalActive(null);
            return;
        }
        if (itemId === 'device-mgmt') {
            onNavigate('device-management');
            setLocalActive(null);
            return;
        }
        if (itemId === 'device-group') {
            onNavigate('device-group');
            setLocalActive(null);
            return;
        }
        if (itemId === 'device-map') {
            onNavigate('device-map');
            setLocalActive(null);
            return;
        }
        if (itemId === 'remote-upgrade') {
            onNavigate('remote-upgrade');
            setLocalActive(null);
            return;
        }
        if (itemId === 'network-protocol') {
            onNavigate('network-protocol');
            setLocalActive(null);
            return;
        }
        if (itemId === 'network-service') {
            onNavigate('network-service');
            setLocalActive(null);
            return;
        }
        if (itemId === 'protocol-mgmt') {
            onNavigate('protocol-mgmt');
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
                    className={`da-sidebar-top-item ${activeItem === 'home' ? 'is-active' : ''}`}
                    onClick={() => handleItemClick('home')}
                >
                    <SidebarMenuIcon type="overview" />
                    <span>设备综合视图</span>
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
