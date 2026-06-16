import React from 'react';
import { UserRound, KeyRound, LogOut } from 'lucide-react';

type ProfileDropdownProps = {
    open: boolean;
    onClose: () => void;
};

export default function ProfileDropdown({ open, onClose }: ProfileDropdownProps) {
    if (!open) return null;

    const items = [
        { icon: <UserRound size={14} />, label: '个人中心' },
        { icon: <KeyRound size={14} />, label: '修改密码' },
        { icon: <LogOut size={14} />, label: '退出登录' },
    ];

    return (
        <div className="profile-dropdown" role="menu">
            {items.map((item) => (
                <button
                    key={item.label}
                    type="button"
                    className="profile-dropdown__item"
                    onClick={onClose}
                >
                    {item.icon}
                    <span>{item.label}</span>
                </button>
            ))}
        </div>
    );
}
