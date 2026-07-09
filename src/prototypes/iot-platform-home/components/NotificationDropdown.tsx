import React, { useEffect, useMemo, useState } from 'react';
import {
    stripAnnouncementHtml,
    useAnnouncementNotifications,
} from './AnnouncementNotificationContext';

type NotificationType = 'alarm' | 'work-order' | 'announcement';

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
    filter?: NotificationFilter;
    announcementId?: string;
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
    onNavigateAlarmWorkOrder?: (filter?: NotificationFilter) => void;
    onOtherUnreadCountChange?: (count: number) => void;
};

export default function NotificationDropdown({
    open,
    onClose,
    onNavigateMessageCenter,
    onNavigateAlarmWorkOrder,
    onOtherUnreadCountChange,
}: NotificationDropdownProps) {
    const [items, setItems] = useState<NotificationItem[]>(DEFAULT_NOTIFICATIONS);
    const {
        publishedAnnouncements,
        isAnnouncementUnread,
        markAnnouncementRead,
        markAllAnnouncementsRead,
        openAnnouncement,
    } = useAnnouncementNotifications();

    const announcementItems = useMemo<NotificationItem[]>(
        () => publishedAnnouncements.map((item) => ({
            id: `announcement-${item.id}`,
            type: 'announcement',
            title: `【${item.type}】${item.title}`,
            description: stripAnnouncementHtml(item.content) || '点击查看公告详情',
            read: !isAnnouncementUnread(item.id),
            announcementId: item.id,
        })),
        [publishedAnnouncements, isAnnouncementUnread],
    );

    const mergedItems = useMemo(
        () => [...announcementItems, ...items],
        [announcementItems, items],
    );

    const unreadCount = mergedItems.filter((item) => !item.read).length;

    useEffect(() => {
        onOtherUnreadCountChange?.(items.filter((item) => !item.read).length);
    }, [items, onOtherUnreadCountChange]);

    if (!open) return null;

    const handleItemClick = (item: NotificationItem) => {
        if (item.type === 'announcement' && item.announcementId) {
            markAnnouncementRead(item.announcementId);
            openAnnouncement(item.announcementId);
            onClose();
            return;
        }

        setItems((prev) => prev.map((n) => (n.id === item.id ? { ...n, read: true } : n)));

        if (item.type === 'alarm' && onNavigateMessageCenter) {
            onNavigateMessageCenter(item.filter);
        } else if (item.type === 'work-order' && onNavigateAlarmWorkOrder) {
            onNavigateAlarmWorkOrder(item.filter);
        }
        onClose();
    };

    const handleMarkAllRead = () => {
        setItems((prev) => prev.map((n) => ({ ...n, read: true })));
        markAllAnnouncementsRead();
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
                {mergedItems.length === 0 ? (
                    <div className="notif-dropdown__empty">暂无消息</div>
                ) : (
                    mergedItems.map((item) => (
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
