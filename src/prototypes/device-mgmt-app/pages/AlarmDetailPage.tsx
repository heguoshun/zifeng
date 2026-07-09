import React, { useState } from 'react';
import StatusBadge from '../components/StatusBadge';
import type { DeviceAlarmRecord } from '../../iot-platform-home/data/deviceAlarms';

type AlarmDetailPageProps = {
    alarm: DeviceAlarmRecord;
    onConfirm: (alarmId: string) => void;
    onClose: (alarmId: string) => void;
    onTransfer: (alarmId: string) => void;
    onOpenDevice: (deviceCode: string) => void;
};

function levelTone(level: DeviceAlarmRecord['level']) {
    if (level === '紧急') return 'danger';
    if (level === '重要') return 'warning';
    return 'primary';
}

export default function AlarmDetailPage({
    alarm,
    onConfirm,
    onClose,
    onTransfer,
    onOpenDevice,
}: AlarmDetailPageProps) {
    const [message, setMessage] = useState('');
    const isDone = alarm.processStatus === '已处理';

    return (
        <div className="dma-page-content">
            <div style={{ marginBottom: 12, display: 'flex', gap: 8 }}>
                <StatusBadge label={alarm.level} tone={levelTone(alarm.level)} />
                <StatusBadge label={alarm.processStatus} tone={alarm.processStatus === '未处理' ? 'danger' : alarm.processStatus === '处理中' ? 'warning' : 'success'} />
            </div>
                <section className="dma-detail-section">
                    <h2>告警信息</h2>
                    <dl>
                        <div className="dma-detail-row"><dt>关联设备</dt><dd>{alarm.deviceName}</dd></div>
                        <div className="dma-detail-row"><dt>设备编号</dt><dd>{alarm.deviceCode}</dd></div>
                        <div className="dma-detail-row"><dt>位置</dt><dd>{alarm.space}</dd></div>
                        <div className="dma-detail-row"><dt>触发时间</dt><dd>{alarm.triggeredAt}</dd></div>
                        <div className="dma-detail-row"><dt>告警内容</dt><dd>{alarm.content}</dd></div>
                    </dl>
                    <button type="button" className="dma-btn dma-btn-ghost" onClick={() => onOpenDevice(alarm.deviceCode)}>
                        查看关联设备
                    </button>
                </section>

                {!isDone ? (
                    <section className="dma-detail-section">
                        <h2>处置操作</h2>
                        <div className="dma-field">
                            <label htmlFor="alarm-note">处理说明（可选）</label>
                            <textarea
                                id="alarm-note"
                                placeholder="填写现场情况或处置备注"
                                value={message}
                                onChange={(event) => setMessage(event.target.value)}
                            />
                        </div>
                        <div className="dma-action-group">
                            {alarm.processStatus === '未处理' ? (
                                <button type="button" className="dma-btn dma-btn-primary" onClick={() => onConfirm(alarm.id)}>
                                    确认已知晓
                                </button>
                            ) : null}
                            <button type="button" className="dma-btn dma-btn-ghost" onClick={() => onClose(alarm.id)}>
                                关闭告警
                            </button>
                            <button type="button" className="dma-btn dma-btn-primary" onClick={() => onTransfer(alarm.id)}>
                                转工单
                            </button>
                        </div>
                    </section>
                ) : (
                    <section className="dma-detail-section">
                        <h2>处理结果</h2>
                        <p style={{ margin: 0, fontSize: 13, color: 'var(--dma-text-secondary)' }}>
                            {alarm.processResult || '告警已处理完成'}
                        </p>
                    </section>
                )}
            </div>
    );
}
