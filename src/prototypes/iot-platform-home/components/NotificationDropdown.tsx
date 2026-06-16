import React, { useState } from 'react';

type NotificationType = 'alarm' | 'work-order';

export type NotificationFilter = {
    keyword?: string;
    status?: string;
};

type NotificationItem = {
    id: string;
    type: NotificationType;
    title: string;
    description: string;
    read: boolean;
    filter: NotificationFilter;
};

const DEFAULT_NOTIFICATIONS: NotificationItem[] = [
    {
        id: 'notif-1',
        type: 'alarm',
        title: '设备离线告警',
        description: '设备在 / 离线状态 = 离线',
        read: false,
        filter: { keyword: '离线' },
    },
    {
        id: 'notif-2',
        type: 'alarm',
        title: '设备故障告警',
        description: '设备上报故障代码(alert=2)',
        read: false,
        filter: { keyword: '故障' },
    },
    {
        id: 'notif-3',
        type: 'work-order',
        title: '工单验收通知',
        description: '您有一个工单已处理，待验收。',
        read: false,
        filter: { status: '待验收' },
    },
    {
        id: 'notif-4',
        type: 'work-order',
        title: '工单处理通知',
        description: '您有一个工单待处理，请尽快处理。',
        read: false,
        filter: { status: '待处理' },
    },
];

type NotificationDropdownProps = {
    open: boolean;
    onClose: () => void;
    onNavigateMessageCenter?: (filter?: NotificationFilter) => void;
    onNavigateOmManagement?: (filter?: NotificationFilter) => void;
};

export default function NotificationDropdown({
    open,
    onClose,
    onNavigateMessageCenter,
    onNavigateOmManagement,
}: NotificationDropdownProps) {
    const [items, setItems] = useState<NotificationItem[]>(DEFAULT_NOTIFICATIONS);

    if (!open) return null;

    const unreadCount = items.filter((i) => !i.read).length;

    const handleItemClick = (item: NotificationItem) => {
        // Mark as read
        setItems((prev) => prev.map((n) => (n.id === item.id ? { ...n, read: true } : n)));

        // Navigate with filter
        if (item.type === 'alarm' && onNavigateMessageCenter) {
            onNavigateMessageCenter(item.filter);
        } else if (item.type === 'work-order' && onNavigateOmManagement) {
            onNavigateOmManagement(item.filter);
        }
        onClose();
    };

    const handleMarkAllRead = () => {
        setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    };

    return (
        <div className="notif-dropdown" role="menu">
            <div className="notif-dropdown__head">
                <span className="notif-dropdown__title">消息通知</span>
                {unreadCount > 0 && (
                    <button
                        type="button"
                        className="notif-dropdown__mark-all"
                        onClick={handleMarkAllRead}
                    >
                        全部已读
                    </button>
                )}
            </div>
            <div className="notif-dropdown__list">
                {items.length === 0 ? (
                    <div className="notif-dropdown__empty">暂无消息</div>
                ) : (
                    items.map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            className={`notif-dropdown__item ${item.read ? 'is-read' : ''}`}
                            onClick={() => handleItemClick(item)}
                        >
                            <div className="notif-dropdown__item-content">
                                <span className="notif-dropdown__item-title">{item.title}</span>
                                <span className="notif-dropdown__item-desc">{item.description}</span>
                            </div>
                            {!item.read && <span className="notif-dropdown__badge">未读</span>}
                        </button>
                    ))
                )}
            </div>
        </div>
    );
}
