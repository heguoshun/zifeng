import React from 'react';
import { UserRound, KeyRound, LogOut } from 'lucide-react';

type ProfileDropdownProps = {
    open: boolean;
    onClose: () => void;
    onLogout?: () => void;
};

export default function ProfileDropdown({ open, onClose, onLogout }: ProfileDropdownProps) {
    if (!open) return null;

    const items = [
        { icon: <UserRound size={14} />, label: '个人中心', action: onClose },
        { icon: <KeyRound size={14} />, label: '修改密码', action: onClose },
        { icon: <LogOut size={14} />, label: '退出登录', action: () => {
            onClose();
            onLogout?.();
        } },
    ];

    return (
        <div className="profile-dropdown" role="menu">
            {items.map((item) => (
                <button
                    key={item.label}
                    type="button"
                    className="profile-dropdown__item"
                    onClick={item.action}
                >
                    {item.icon}
                    <span>{item.label}</span>
                </button>
            ))}
        </div>
    );
}
