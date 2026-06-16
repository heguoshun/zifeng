import React, { useEffect, useState } from 'react';
import '../device-access.css';

export type SystemManagementPageId =
    | 'tenant-mgmt'
    | 'user-mgmt'
    | 'role-mgmt'
    | 'dept-mgmt'
    | 'menu-mgmt';

const SIDEBAR_ITEMS: { id: SystemManagementPageId; label: string }[] = [
    { id: 'tenant-mgmt', label: '租户管理' },
    { id: 'user-mgmt', label: '用户管理' },
    { id: 'role-mgmt', label: '角色管理' },
    { id: 'dept-mgmt', label: '部门管理' },
    { id: 'menu-mgmt', label: '菜单管理' },
];

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

    useEffect(() => {
        setLocalActive(null);
    }, [pageId]);

    const activeItem = localActive ?? pageId;

    const handleItemClick = (itemId: SystemManagementPageId) => {
        if (
            itemId === 'tenant-mgmt'
            || itemId === 'user-mgmt'
            || itemId === 'role-mgmt'
            || itemId === 'dept-mgmt'
            || itemId === 'menu-mgmt'
        ) {
            onNavigate(itemId);
            setLocalActive(null);
            return;
        }
        const item = SIDEBAR_ITEMS.find((entry) => entry.id === itemId);
        onUnavailable?.(item?.label ?? '该功能');
        setLocalActive(itemId);
    };

    return (
        <div className="da-sidebar-shell">
            <nav className="da-sidebar-nav">
                {SIDEBAR_ITEMS.map((item) => (
                    <button
                        key={item.id}
                        type="button"
                        className={`da-sidebar-top-item ${activeItem === item.id ? 'is-active' : ''}`}
                        onClick={() => handleItemClick(item.id)}
                    >
                        <span>{item.label}</span>
                    </button>
                ))}
            </nav>
        </div>
    );
}
