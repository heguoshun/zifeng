import React from 'react';
import { AlertTriangle, Bell, ChevronRight, ClipboardList, Droplets, Gauge } from 'lucide-react';
import { CURRENT_WORK_ORDER_USER } from '../../iot-platform-home/data/workOrders';

type HomePageProps = {
    pendingAlarms: number;
    pendingWorkOrders: number;
    abnormalDevices: number;
    onOpenAlarms: () => void;
    onOpenWorkOrders: () => void;
    onOpenDevices: () => void;
    onQuickNavigate: (target: 'devices' | 'alarms' | 'workorders') => void;
};

const QUICK_LINKS = [
    { id: 'devices' as const, label: '设备列表', desc: '水表 / 压力计', icon: Gauge, tone: 'blue' },
    { id: 'alarms' as const, label: '告警列表', desc: '待处理事件', icon: Bell, tone: 'red' },
    { id: 'workorders' as const, label: '工单列表', desc: '我的待办', icon: ClipboardList, tone: 'amber' },
];

export default function HomePage({
    pendingAlarms,
    pendingWorkOrders,
    abnormalDevices,
    onOpenAlarms,
    onOpenWorkOrders,
    onOpenDevices,
    onQuickNavigate,
}: HomePageProps) {
    return (
        <div className="dma-page-content dma-home">
            <section className="dma-hero">
                <p className="dma-hero-kicker">现场运维工作台</p>
                <h2 className="dma-hero-title">你好，{CURRENT_WORK_ORDER_USER}</h2>
                <p className="dma-hero-desc">今日待办已汇总，优先处理告警与工单。</p>
            </section>

            <section className="dma-summary-grid">
                <button type="button" className="dma-summary-card tone-danger" onClick={onOpenAlarms}>
                    <span className="dma-summary-icon"><Bell size={18} /></span>
                    <strong>{pendingAlarms}</strong>
                    <span>待处理告警</span>
                </button>
                <button type="button" className="dma-summary-card tone-warning" onClick={onOpenWorkOrders}>
                    <span className="dma-summary-icon"><ClipboardList size={18} /></span>
                    <strong>{pendingWorkOrders}</strong>
                    <span>待办工单</span>
                </button>
                <button type="button" className="dma-summary-card tone-info" onClick={onOpenDevices}>
                    <span className="dma-summary-icon"><AlertTriangle size={18} /></span>
                    <strong>{abnormalDevices}</strong>
                    <span>异常设备</span>
                </button>
            </section>

            <section className="dma-section-block">
                <div className="dma-section-head">
                    <h2 className="dma-section-title">快捷入口</h2>
                    <span className="dma-section-meta">常用功能</span>
                </div>
                <div className="dma-quick-list">
                    {QUICK_LINKS.map((item) => {
                        const Icon = item.icon;
                        return (
                            <button
                                key={item.id}
                                type="button"
                                className={`dma-quick-item tone-${item.tone}`}
                                onClick={() => onQuickNavigate(item.id)}
                            >
                                <span className="dma-quick-item-icon"><Icon size={20} /></span>
                                <span className="dma-quick-item-text">
                                    <strong>{item.label}</strong>
                                    <small>{item.desc}</small>
                                </span>
                                <ChevronRight size={18} className="dma-quick-item-arrow" />
                            </button>
                        );
                    })}
                </div>
            </section>

            <section className="dma-tip-card">
                <span className="dma-tip-icon"><Droplets size={18} /></span>
                <div>
                    <strong>运维提示</strong>
                    <p>优先处理「紧急 / 重要」告警，转工单后可在工单页跟踪闭环。</p>
                </div>
            </section>
        </div>
    );
}
