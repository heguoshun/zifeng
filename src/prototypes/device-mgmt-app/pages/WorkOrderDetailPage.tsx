import React, { useState } from 'react';
import StatusBadge from '../components/StatusBadge';
import type { WorkOrderRecord } from '../../iot-platform-home/data/workOrders';
import { toMobileWorkOrderStatus } from '../data/appData';

type WorkOrderDetailPageProps = {
    workOrder: WorkOrderRecord;
    onAccept: (workOrderId: string) => void;
    onComplete: (workOrderId: string, result: string) => void;
    onOpenAlarm?: (alarmId: string) => void;
};

function statusLabel(workOrder: WorkOrderRecord) {
    const status = toMobileWorkOrderStatus(workOrder);
    if (status === 'pending') return '待接单';
    if (status === 'processing') return '处理中';
    return '已完成';
}

export default function WorkOrderDetailPage({
    workOrder,
    onAccept,
    onComplete,
    onOpenAlarm,
}: WorkOrderDetailPageProps) {
    const [result, setResult] = useState(workOrder.result || '');
    const mobileStatus = toMobileWorkOrderStatus(workOrder);
    const isCompleted = mobileStatus === 'completed';

    return (
        <div className="dma-page-content">
            <div style={{ marginBottom: 12 }}>
                <StatusBadge
                    label={statusLabel(workOrder)}
                    tone={mobileStatus === 'pending' ? 'warning' : mobileStatus === 'processing' ? 'primary' : 'success'}
                />
            </div>
                <section className="dma-detail-section">
                    <h2>工单信息</h2>
                    <dl>
                        <div className="dma-detail-row"><dt>工单类型</dt><dd>{workOrder.type}</dd></div>
                        <div className="dma-detail-row"><dt>告警等级</dt><dd>{workOrder.level}</dd></div>
                        <div className="dma-detail-row"><dt>位置</dt><dd>{workOrder.space}</dd></div>
                        <div className="dma-detail-row"><dt>创建时间</dt><dd>{workOrder.createdAt}</dd></div>
                        <div className="dma-detail-row"><dt>问题描述</dt><dd>{workOrder.content}</dd></div>
                        <div className="dma-detail-row"><dt>处理人</dt><dd>{workOrder.handler || workOrder.assignees.join('、')}</dd></div>
                    </dl>
                    {workOrder.alarmId && onOpenAlarm ? (
                        <button type="button" className="dma-btn dma-btn-ghost" onClick={() => onOpenAlarm(workOrder.alarmId!)}>
                            查看来源告警
                        </button>
                    ) : null}
                </section>

                {!isCompleted ? (
                    <section className="dma-detail-section">
                        <h2>处置操作</h2>
                        {mobileStatus === 'pending' ? (
                            <div className="dma-action-group">
                                <button type="button" className="dma-btn dma-btn-primary" onClick={() => onAccept(workOrder.id)}>
                                    接单
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="dma-field">
                                    <label htmlFor="wo-result">处理结果</label>
                                    <textarea
                                        id="wo-result"
                                        placeholder="填写现场处置结果"
                                        value={result}
                                        onChange={(event) => setResult(event.target.value)}
                                    />
                                </div>
                                <div className="dma-action-group">
                                    <button
                                        type="button"
                                        className="dma-btn dma-btn-primary"
                                        disabled={!result.trim()}
                                        onClick={() => onComplete(workOrder.id, result.trim())}
                                    >
                                        标记完结
                                    </button>
                                </div>
                            </>
                        )}
                    </section>
                ) : (
                    <section className="dma-detail-section">
                        <h2>处理结果</h2>
                        <p style={{ margin: 0, fontSize: 13, color: 'var(--dma-text-secondary)' }}>
                            {workOrder.result || '工单已完结'}
                        </p>
                    </section>
                )}
            </div>
    );
}
