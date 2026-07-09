import React from 'react';
import { Droplets, Gauge } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import type { MobileDevice } from '../data/appData';
import { getDeviceReading } from '../data/appData';

type DeviceDetailPageProps = {
    device: MobileDevice;
};

function statusTone(status: MobileDevice['status']) {
    if (status === 'online') return 'success';
    if (status === 'offline') return 'danger';
    if (status === 'fault') return 'warning';
    return 'muted';
}

function statusLabel(status: MobileDevice['status']) {
    if (status === 'online') return '在线';
    if (status === 'offline') return '离线';
    if (status === 'fault') return '故障';
    return '停用';
}

export default function DeviceDetailPage({ device }: DeviceDetailPageProps) {
    const freqUnit = device.collectFrequencyUnit === 'minute' ? '分钟' : device.collectFrequencyUnit === 'hour' ? '小时' : '秒';

    return (
        <div className="dma-page-content">
            <section className="dma-metric-hero">
                <span className="dma-metric-icon">
                    {device.displayType === '压力计' ? <Gauge size={22} /> : <Droplets size={22} />}
                </span>
                <div className="dma-metric-value">{getDeviceReading(device)}</div>
                <div className="dma-metric-meta">
                    <StatusBadge label={statusLabel(device.status)} tone={statusTone(device.status)} />
                    <span>采集频率 {device.collectFrequency} {freqUnit}</span>
                </div>
            </section>

            <section className="dma-detail-section">
                <h2>基本信息</h2>
                <dl>
                    <div className="dma-detail-row"><dt>设备类型</dt><dd>{device.displayType}</dd></div>
                    <div className="dma-detail-row"><dt>产品名称</dt><dd>{device.productName}</dd></div>
                    <div className="dma-detail-row"><dt>设备编号</dt><dd>{device.code}</dd></div>
                    <div className="dma-detail-row"><dt>安装地址</dt><dd>{device.installAddress || device.mapAddress || '-'}</dd></div>
                    {device.displayType === '水表' ? (
                        <>
                            <div className="dma-detail-row"><dt>用户号</dt><dd>{device.userNo || '-'}</dd></div>
                            <div className="dma-detail-row"><dt>表身号</dt><dd>{device.bodyNo || '-'}</dd></div>
                        </>
                    ) : (
                        <div className="dma-detail-row"><dt>通讯码</dt><dd>{device.communicationNo || '-'}</dd></div>
                    )}
                    <div className="dma-detail-row"><dt>在线时长</dt><dd>{device.onlineDuration || '-'}</dd></div>
                </dl>
            </section>
        </div>
    );
}
