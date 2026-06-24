import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Image, Plus } from 'lucide-react';
import {
    resolveAlarmTriggerConditions,
    resolveAlarmWorkOrder,
    resolveAutoRecoveryProcessTime,
    resolveAutoRecoveryResult,
    resolveConditionProductName,
    shouldShowReleaseTimeInAlarmInfo,
    shouldShowWorkOrderSection,
    type AlarmTriggerCondition,
    type AlarmWorkOrder,
    type DeviceAlarmRecord,
} from '../data/deviceAlarms';
import type { ProductRecord } from '../data/products';
import '../product-create.css';
import '../device-create.css';
import '../device-alarm-info.css';

const PROCESS_RESULT_MAX = 100;

type AlarmDetailModalMode = 'process' | 'view';

type AlarmDetailModalProps = {
    open: boolean;
    mode: AlarmDetailModalMode;
    alarm: DeviceAlarmRecord | null;
    products: ProductRecord[];
    onClose: () => void;
    onConfirmProcess?: (result: string) => void;
    onViewWorkOrder?: (workOrder: AlarmWorkOrder) => void;
};

function ReadStatusBadge({ status }: { status: DeviceAlarmRecord['readStatus'] }) {
    return (
        <span className="dai-detail-status">
            <i className={`dai-status-dot ${status === '未读' ? 'dai-status-dot--unread' : 'dai-status-dot--read'}`} />
            {status}
        </span>
    );
}

function ProcessStatusBadge({ status }: { status: DeviceAlarmRecord['processStatus'] }) {
    const statusClass = status === '未处理'
        ? 'dai-process-status--pending'
        : status === '处理中'
            ? 'dai-process-status--processing'
            : 'dai-process-status--done';

    return (
        <span className={`dai-process-status ${statusClass}`}>
            <i className="dai-process-status__icon" aria-hidden="true">
                {status === '未处理' && (
                    <svg viewBox="0 0 16 16" fill="none">
                        <circle cx="8" cy="8" r="7" fill="currentColor" />
                        <path d="M8 4.5V8l2.2 1.4" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                )}
                {status === '处理中' && (
                    <svg viewBox="0 0 16 16" fill="none">
                        <circle cx="8" cy="8" r="7" fill="currentColor" />
                        <path d="M6.5 5.2v5.6l4.8-2.8-4.8-2.8z" fill="#fff" />
                    </svg>
                )}
                {status === '已处理' && (
                    <svg viewBox="0 0 16 16" fill="none">
                        <circle cx="8" cy="8" r="7" fill="currentColor" />
                        <path d="M5 8.2l2 2 4.2-4.4" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                )}
            </i>
            {status}
        </span>
    );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="dai-detail-row">
            <div className="dai-detail-label">{label}</div>
            <div className="dai-detail-value">{children}</div>
        </div>
    );
}

function ConditionDetailTable({
    index,
    condition,
    products,
}: {
    index: number;
    condition: AlarmTriggerCondition;
    products: ProductRecord[];
}) {
    const rows = [
        ['触发设备：', condition.deviceCode],
        ['所属产品：', resolveConditionProductName(condition, products)],
        ['所属片区：', condition.space],
        ['触发条件：', condition.condition],
    ] as const;

    return (
        <div className="dai-condition-table">
            <div className="dai-condition-table__head">
                <span>条件{index + 1}</span>
                <span>详情</span>
            </div>
            {rows.map(([label, value]) => (
                <div key={label} className="dai-condition-table__row">
                    <span>{label}</span>
                    <span>{value}</span>
                </div>
            ))}
        </div>
    );
}

function AttachmentThumbnails({ count }: { count: number }) {
    if (!count) return <span>—</span>;

    return (
        <div className="dai-attachment-list">
            {Array.from({ length: count }, (_, index) => (
                <div key={index} className="dai-attachment-thumb" aria-hidden="true">
                    <Image size={20} strokeWidth={1.5} />
                </div>
            ))}
        </div>
    );
}

function WorkOrderSection({
    workOrder,
    onViewWorkOrder,
}: {
    workOrder: AlarmWorkOrder;
    onViewWorkOrder?: (workOrder: AlarmWorkOrder) => void;
}) {
    return (
        <section className="dai-detail-section">
            <h4 className="dai-detail-section-title">工单信息</h4>
            <div className="dai-detail-table">
                <DetailRow label="生成时间">{workOrder.createdAt}</DetailRow>
                <DetailRow label="工单编号">
                    <span className="dai-work-order-id">
                        {workOrder.id}
                        <button
                            type="button"
                            className="dai-link-btn"
                            onClick={() => onViewWorkOrder?.(workOrder)}
                        >
                            查看
                        </button>
                    </span>
                </DetailRow>
                <DetailRow label="工单名称">{workOrder.name}</DetailRow>
                <DetailRow label="工单等级">{workOrder.level}</DetailRow>
                <DetailRow label="工单内容">{workOrder.content}</DetailRow>
                <DetailRow label="指派人员">
                    {workOrder.assignees.length ? workOrder.assignees.join('、') : '—'}
                </DetailRow>
                <DetailRow label="处理人员">{workOrder.handler ?? '—'}</DetailRow>
                <DetailRow label="处理时间">{workOrder.handledAt ?? '—'}</DetailRow>
                <DetailRow label="处理结果">{workOrder.result ?? '—'}</DetailRow>
                <DetailRow label="附件">
                    <AttachmentThumbnails count={workOrder.attachmentCount ?? 0} />
                </DetailRow>
            </div>
        </section>
    );
}

export default function AlarmDetailModal({
    open,
    mode,
    alarm,
    products,
    onClose,
    onConfirmProcess,
    onViewWorkOrder,
}: AlarmDetailModalProps) {
    const [processResult, setProcessResult] = useState('');

    useEffect(() => {
        if (open) {
            setProcessResult('');
        }
    }, [open, alarm?.id]);

    const triggerConditions = useMemo(
        () => (alarm ? resolveAlarmTriggerConditions(alarm) : []),
        [alarm],
    );

    const showProcessInfo = alarm && alarm.processStatus !== '未处理';
    const workOrder = alarm ? resolveAlarmWorkOrder(alarm) : null;
    const showWorkOrderSection = mode === 'view' && alarm && shouldShowWorkOrderSection(alarm) && workOrder;
    const levelClass = alarm?.level === '紧急' ? 'dai-level-tag dai-level-tag--urgent' : 'dai-level-tag';

    if (!open || !alarm) return null;

    const handleConfirm = () => {
        const trimmed = processResult.trim();
        if (!trimmed) return;
        onConfirmProcess?.(trimmed);
    };

    const handleMaskMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
        if (event.target === event.currentTarget) {
            onClose();
        }
    };

    return createPortal(
        <div
            className="pcp-drawer-mask dcp-group-dialog-mask"
            role="presentation"
            onMouseDown={handleMaskMouseDown}
        >
            <aside
                className="pcp-drawer dcp-group-dialog dai-alarm-detail-drawer"
                role="dialog"
                aria-modal="true"
                aria-labelledby="dai-alarm-detail-title"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <div className="pcp-drawer__head">
                    <h3 id="dai-alarm-detail-title">告警详情</h3>
                    <button type="button" className="pcp-drawer__close" onClick={onClose} aria-label="关闭">×</button>
                </div>

                <div className="pcp-drawer__body dai-alarm-detail-body">
                    <section className="dai-detail-section">
                        <h4 className="dai-detail-section-title">告警信息</h4>
                        <div className="dai-detail-table">
                            <DetailRow label="事件名称">{alarm.eventName}</DetailRow>
                            <DetailRow label="触发时间">{alarm.triggeredAt}</DetailRow>
                            <DetailRow label="告警等级">
                                <span className={levelClass}>{alarm.level}</span>
                            </DetailRow>
                            <DetailRow label="阅读状态">
                                <ReadStatusBadge status={alarm.readStatus} />
                            </DetailRow>
                            <DetailRow label="告警状态">
                                <ProcessStatusBadge status={alarm.processStatus} />
                            </DetailRow>
                            <DetailRow label="触发信息">
                                <div className="dai-trigger-info">
                                    <div className="dai-trigger-method">
                                        触发方式：
                                        {alarm.triggerMethod}
                                    </div>
                                    {triggerConditions.map((condition, index) => (
                                        <ConditionDetailTable
                                            key={`${condition.deviceCode}-${index}`}
                                            index={index}
                                            condition={condition}
                                            products={products}
                                        />
                                    ))}
                                </div>
                            </DetailRow>
                            {showProcessInfo && (
                                <>
                                    <DetailRow label="处理方式">{alarm.processMethod}</DetailRow>
                                    {shouldShowReleaseTimeInAlarmInfo(alarm) && (
                                        <DetailRow label="告警解除时间">{alarm.releaseTime}</DetailRow>
                                    )}
                                </>
                            )}
                        </div>
                    </section>

                    {mode === 'process' && (
                        <section className="dai-detail-section">
                            <h4 className="dai-detail-section-title">告警处理</h4>
                            <div className="dai-detail-table">
                                <DetailRow label="处理结果">
                                    <div className="dai-process-form">
                                        <div className="dai-textarea-wrap">
                                            <textarea
                                                className="pcp-form-textarea dai-process-textarea"
                                                placeholder="请输入处理结果"
                                                value={processResult}
                                                maxLength={PROCESS_RESULT_MAX}
                                                onChange={(event) => setProcessResult(event.target.value)}
                                            />
                                            <span className="dai-textarea-counter">
                                                {processResult.length}/{PROCESS_RESULT_MAX}
                                            </span>
                                        </div>
                                    </div>
                                </DetailRow>
                                <DetailRow label="附件">
                                    <div className="pcp-upload-wrap dai-upload-wrap">
                                        <button type="button" className="pcp-upload-box" aria-label="上传附件">
                                            <Plus size={18} />
                                            上传
                                        </button>
                                        <p className="pcp-upload-tip dai-upload-tip">
                                            支持文件格式：jpg、png单个文件不超过10M
                                        </p>
                                    </div>
                                </DetailRow>
                            </div>
                        </section>
                    )}

                    {mode === 'view' && alarm.processStatus === '已处理' && alarm.processMethod === '自动恢复' && (
                        <section className="dai-detail-section">
                            <h4 className="dai-detail-section-title">告警处理</h4>
                            <div className="dai-detail-table">
                                <DetailRow label="处理时间">{resolveAutoRecoveryProcessTime(alarm)}</DetailRow>
                                <DetailRow label="处理结果">{resolveAutoRecoveryResult(alarm)}</DetailRow>
                            </div>
                        </section>
                    )}

                    {mode === 'view' && alarm.processStatus === '已处理' && alarm.processMethod === '直接处理' && (
                        <section className="dai-detail-section">
                            <h4 className="dai-detail-section-title">告警处理</h4>
                            <div className="dai-detail-table">
                                <DetailRow label="处理人员">{alarm.processHandler ?? '—'}</DetailRow>
                                <DetailRow label="处理时间">{alarm.processTime ?? '—'}</DetailRow>
                                <DetailRow label="处理结果">{alarm.processResult ?? '—'}</DetailRow>
                                <DetailRow label="附件">
                                    <AttachmentThumbnails count={alarm.processAttachmentCount ?? 0} />
                                </DetailRow>
                            </div>
                        </section>
                    )}

                    {showWorkOrderSection && (
                        <WorkOrderSection
                            workOrder={workOrder!}
                            onViewWorkOrder={onViewWorkOrder}
                        />
                    )}
                </div>

                <div className="pcp-drawer__foot">
                    {mode === 'process' ? (
                        <>
                            <button type="button" className="pm-btn pm-btn-ghost" onClick={onClose}>取消</button>
                            <button
                                type="button"
                                className="pm-btn pm-btn-primary"
                                disabled={!processResult.trim()}
                                onClick={handleConfirm}
                            >
                                确定
                            </button>
                        </>
                    ) : (
                        <button type="button" className="pm-btn pm-btn-primary" onClick={onClose}>关闭</button>
                    )}
                </div>
            </aside>
        </div>,
        document.body,
    );
}
