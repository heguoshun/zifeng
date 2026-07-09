import React, { useState } from 'react';
import { Settings } from 'lucide-react';
import AppShell from '../components/AppShell';
import MessageCenterSidebar, { type MessageCenterPageId } from '../components/MessageCenterSidebar';
import PushTimeDialog from '../components/PushTimeDialog';
import IotToast, { type IotToastData, type IotToastType, triggerIotToast } from '../components/IotToast';
import type { MessagePushSettings, MessageSubscriptionItem } from '../data/messageSubscriptions';
import { handleSelectableRowClick } from '../../../common/selectableRow';
import '../device-access.css';
import '../product-management.css';
import '../message-subscribe.css';

type MessageSubscribePageProps = {
    subscriptions: MessageSubscriptionItem[];
    pushSettings: MessagePushSettings;
    onUpdateSubscriptions: React.Dispatch<React.SetStateAction<MessageSubscriptionItem[]>>;
    onUpdatePushSettings: React.Dispatch<React.SetStateAction<MessagePushSettings>>;
    onNavigateHome: () => void;
    onNavigateDeviceAccess: () => void;
    onNavigate: (pageId: MessageCenterPageId) => void;
};

export default function MessageSubscribePage({
    subscriptions,
    pushSettings,
    onUpdateSubscriptions,
    onUpdatePushSettings,
    onNavigateHome,
    onNavigateDeviceAccess,
    onNavigate,
}: MessageSubscribePageProps) {
    const [pushDialogOpen, setPushDialogOpen] = useState(false);
    const [toast, setToast] = useState<IotToastData | null>(null);

    const showToast = (message: string, type: IotToastType = 'warning') => {
        triggerIotToast(setToast, message, type);
    };

    const handleToggle = (id: string, enabled: boolean) => {
        onUpdateSubscriptions((prev) => prev.map((item) => (
            item.id === id ? { ...item, enabled } : item
        )));
        showToast(enabled ? '已开启订阅' : '已关闭订阅', 'success');
    };

    const handlePushSettingsConfirm = (settings: MessagePushSettings) => {
        onUpdatePushSettings(settings);
        setPushDialogOpen(false);
        showToast('推送时间设置已保存', 'success');
    };

    const sidebar = <MessageCenterSidebar pageId="msg-subscribe" onNavigate={onNavigate} />;

    return (
        <AppShell
            activeTopTab="消息中心"
            sidebar={sidebar}
            onTopTabChange={(tab) => {
                if (tab === '设备接入') onNavigateDeviceAccess();
            }}
        >
            <div className="ms-page">
                <div className="crumb">消息中心 / 消息订阅</div>

                <section className="panel ms-list-panel">
                    <div className="ms-table-head">
                        <h3>消息订阅</h3>
                        <button
                            type="button"
                            className="ms-settings-btn"
                            aria-label="推送时间设置"
                            onClick={() => setPushDialogOpen(true)}
                        >
                            <Settings size={16} />
                        </button>
                    </div>

                    <div className="ms-table-wrap">
                        <table className="ms-table">
                            <thead>
                                <tr>
                                    <th>消息类型</th>
                                    <th>说明</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {subscriptions.map((item) => (
                                    <tr
                                        key={item.id}
                                        className="iot-selectable-row"
                                        onClick={(event) => handleSelectableRowClick(
                                            event,
                                            () => handleToggle(item.id, !item.enabled),
                                        )}
                                    >
                                        <td>{item.name}</td>
                                        <td className="ms-desc-cell">{item.description}</td>
                                        <td>
                                            <label className="ms-switch">
                                                <input
                                                    type="checkbox"
                                                    checked={item.enabled}
                                                    onChange={(event) => handleToggle(item.id, event.target.checked)}
                                                    aria-label={`${item.name}订阅开关`}
                                                />
                                            </label>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>

            <PushTimeDialog
                open={pushDialogOpen}
                settings={pushSettings}
                onClose={() => setPushDialogOpen(false)}
                onConfirm={handlePushSettingsConfirm}
            />

            <IotToast toast={toast} />
        </AppShell>
    );
}
