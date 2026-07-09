import React from 'react';
import { Bell, LogOut } from 'lucide-react';
import { CURRENT_WORK_ORDER_USER } from '../../iot-platform-home/data/workOrders';

export type AppNotification = {
    id: string;
    title: string;
    content: string;
    time: string;
    read: boolean;
};

type ProfilePageProps = {
    notifications: AppNotification[];
    onMarkAllRead: () => void;
    onLogout: () => void;
};

export default function ProfilePage({ notifications, onMarkAllRead, onLogout }: ProfilePageProps) {
    const unreadCount = notifications.filter((item) => !item.read).length;

    return (
        <div className="dma-page-content dma-profile">
            <section className="dma-profile-hero">
                <div className="dma-avatar">{CURRENT_WORK_ORDER_USER.slice(0, 1)}</div>
                <div>
                    <strong>{CURRENT_WORK_ORDER_USER}</strong>
                    <p>现场运维 · 紫峰装备</p>
                </div>
            </section>

            <section className="dma-section-block">
                <div className="dma-section-head">
                    <h2 className="dma-section-title">消息通知{unreadCount ? ` · ${unreadCount}` : ''}</h2>
                    {unreadCount ? (
                        <button type="button" className="dma-text-btn" onClick={onMarkAllRead}>全部已读</button>
                    ) : null}
                </div>

                {notifications.length === 0 ? (
                    <div className="dma-empty">暂无消息</div>
                ) : (
                    notifications.map((item) => (
                        <article key={item.id} className={`dma-notice-item${item.read ? '' : ' unread'}`}>
                            <span className="dma-notice-icon"><Bell size={16} /></span>
                            <div>
                                <strong>{item.title}</strong>
                                <p>{item.content}</p>
                                <time>{item.time}</time>
                            </div>
                        </article>
                    ))
                )}
            </section>

            <button type="button" className="dma-btn dma-btn-ghost dma-btn-block dma-logout-btn" onClick={onLogout}>
                <LogOut size={16} />
                退出登录
            </button>
        </div>
    );
}
