import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Image } from 'lucide-react';
import {
    resolveWorkOrderDetailView,
    type WorkOrderAlarmCondition,
    type WorkOrderProcessRecordItem,
} from '../data/workOrderDetails';
import type { WorkOrderRecord, WorkOrderRelatedDeviceGroup } from '../data/workOrders';
import '../product-create.css';
import '../device-create.css';
import '../device-alarm-info.css';
import '../work-order-management.css';

type WorkOrderDetailTab = 'basic' | 'result' | 'records';

type WorkOrderDetailDrawerProps = {
    open: boolean;
    workOrder: WorkOrderRecord | null;
    onClose: () => void;
    onAccept?: (workOrder: WorkOrderRecord) => void;
};

const TABS: { id: WorkOrderDetailTab; label: string }[] = [
    { id: 'basic', label: '基本信息' },
    { id: 'result', label: '处理结果' },
    { id: 'records', label: '处理记录' },
];

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="dai-detail-row">
            <div className="dai-detail-label">{label}</div>
            <div className="dai-detail-value">{children}</div>
        </div>
    );
}

function ReadStatusText({ status }: { status: WorkOrderRecord['readStatus'] }) {
    const statusClass = status === '未读' ? 'wom-read-status--unread' : 'wom-read-status--read';

    return (
        <span className={`wom-read-status wom-detail-read-status ${statusClass}`}>
            <i className="wom-read-status__icon" aria-hidden="true">
                {status === '未读' ? (
                    <svg viewBox="0 0 16 16" fill="none">
                        <circle cx="8" cy="8" r="7" fill="currentColor" />
                        <path d="M8 4.5V8l2.2 1.4" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                ) : (
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

function ConditionDetailTable({ index, condition }: { index: number; condition: WorkOrderAlarmCondition }) {
    const rows = [
        ['触发设备：', condition.deviceCode],
        ['所属产品：', condition.productName],
        ['所属空间：', condition.space],
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

function RelatedDeviceContent({ groups }: { groups: WorkOrderRelatedDeviceGroup[] }) {
    if (!groups.length) return <span>—</span>;

    return (
        <div className="wom-related-devices">
            {groups.map((group) => (
                <div className="wom-related-devices__group" key={`${group.productName}-${group.space}`}>
                    <div className="wom-related-devices__meta">
                        <span>{group.productName}</span>
                        <span>{group.space}</span>
                    </div>
                    <p className="wom-related-devices__names">
                        设备名称：
                        {group.deviceNames.join('、')}
                    </p>
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

function ProcessRecordTimeline({
    records,
    onAccept,
}: {
    records: WorkOrderProcessRecordItem[];
    onAccept?: () => void;
}) {
    if (!records.length) {
        return <p className="wom-detail-empty">暂无处理记录</p>;
    }

    return (
        <div className="wom-process-timeline">
            {records.map((record, index) => (
                <article className="wom-process-timeline__item" key={record.id}>
                    <div className="wom-process-timeline__axis">
                        <span className="wom-process-timeline__dot" />
                        {index < records.length - 1 && <span className="wom-process-timeline__line" />}
                    </div>
                    <div className="wom-process-timeline__content">
                        <div className="wom-process-timeline__head">
                            <strong>{record.title}</strong>
                            {record.time ? <time>{record.time}</time> : null}
                        </div>
                        <div className="wom-process-timeline__body">
                            {record.lines.map((line) => (
                                <p key={`${record.id}-${line.label ?? line.value}`}>
                                    {line.label ? (
                                        <>
                                            {line.label}：
                                            <span className={`wom-process-timeline__value wom-process-timeline__value--${line.tone ?? 'default'}`}>
                                                {line.value}
                                            </span>
                                        </>
                                    ) : line.value}
                                </p>
                            ))}
                            {record.attachmentCount ? (
                                <AttachmentThumbnails count={record.attachmentCount} />
                            ) : null}
                            {record.showAcceptButton && onAccept ? (
                                <button type="button" className="pm-btn pm-btn-primary wom-process-accept-btn" onClick={onAccept}>
                                    工单验收
                                </button>
                            ) : null}
                        </div>
                    </div>
                </article>
            ))}
        </div>
    );
}

export default function WorkOrderDetailDrawer({
    open,
    workOrder,
    onClose,
    onAccept,
}: WorkOrderDetailDrawerProps) {
    const [activeTab, setActiveTab] = useState<WorkOrderDetailTab>('basic');

    useEffect(() => {
        if (!open) return;
        setActiveTab('basic');
    }, [open, workOrder?.id]);

    const detail = useMemo(
        () => (workOrder ? resolveWorkOrderDetailView(workOrder) : null),
        [workOrder],
    );

    const handleMaskMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
        if (event.target === event.currentTarget) {
            onClose();
        }
    };

    if (!open || !workOrder || !detail) return null;

    return createPortal(
        <div
            className="pcp-drawer-mask dcp-group-dialog-mask"
            role="presentation"
            onMouseDown={handleMaskMouseDown}
        >
            <aside
                className="pcp-drawer dcp-group-dialog wom-detail-drawer"
                role="dialog"
                aria-modal="true"
                aria-labelledby="wom-detail-drawer-title"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <div className="pcp-drawer__head">
                    <h3 id="wom-detail-drawer-title">工单详情</h3>
                    <button type="button" className="pcp-drawer__close" onClick={onClose} aria-label="关闭">×</button>
                </div>

                <div className="wom-detail-tabs" role="tablist" aria-label="工单详情标签">
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            role="tab"
                            aria-selected={activeTab === tab.id}
                            className={activeTab === tab.id ? 'is-active' : ''}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="pcp-drawer__body wom-detail-drawer__body">
                    {activeTab === 'basic' && (
                        <>
                            <section className="dai-detail-section">
                                <h4 className="dai-detail-section-title">工单信息</h4>
                                <div className="dai-detail-table">
                                    <DetailRow label="工单编号">{workOrder.id}</DetailRow>
                                    <DetailRow label="工单名称">{workOrder.name}</DetailRow>
                                    <DetailRow label="工单类型">{detail.typeLabel}</DetailRow>
                                    <DetailRow label="工单状态">{workOrder.status}</DetailRow>
                                    <DetailRow label="生成时间">{workOrder.createdAt}</DetailRow>
                                    <DetailRow label="工单等级">{workOrder.level}</DetailRow>
                                    {workOrder.type === '告警工单' && (
                                        <DetailRow label="工单内容">{workOrder.content}</DetailRow>
                                    )}
                                    <DetailRow label={workOrder.type === '其他工单' ? '所属站点' : '所属空间'}>
                                        {workOrder.space}
                                    </DetailRow>
                                    <DetailRow label="处理人员">{detail.processor}</DetailRow>
                                    <DetailRow label="阅读状态">
                                        <ReadStatusText status={workOrder.readStatus} />
                                    </DetailRow>
                                    <DetailRow label="验收人员">{detail.acceptor}</DetailRow>
                                    <DetailRow label="结单时间">{workOrder.closedAt ?? '—'}</DetailRow>
                                </div>
                            </section>

                            {detail.taskContent && (
                                <section className="dai-detail-section">
                                    <h4 className="dai-detail-section-title">任务内容</h4>
                                    <div className="dai-detail-table">
                                        <DetailRow label="关联设备">
                                            <RelatedDeviceContent groups={detail.taskContent.relatedDevices} />
                                        </DetailRow>
                                        <DetailRow label="工单内容">{detail.taskContent.content}</DetailRow>
                                        <DetailRow label="附件">
                                            <AttachmentThumbnails count={detail.taskContent.attachmentCount} />
                                        </DetailRow>
                                    </div>
                                </section>
                            )}

                            {detail.alarm && (
                                <section className="dai-detail-section">
                                    <h4 className="dai-detail-section-title">关联告警信息</h4>
                                    <div className="dai-detail-table">
                                        <DetailRow label="事件名称">{detail.alarm.eventName}</DetailRow>
                                        <DetailRow label="触发时间">{detail.alarm.triggeredAt}</DetailRow>
                                        <DetailRow label="告警等级">{detail.alarm.level}</DetailRow>
                                        <DetailRow label="触发信息">
                                            <div className="dai-trigger-info">
                                                <div className="dai-trigger-method">
                                                    触发方式：
                                                    {detail.alarm.triggerMethod}
                                                </div>
                                                {detail.alarm.conditions.map((condition, index) => (
                                                    <ConditionDetailTable
                                                        key={`${condition.deviceCode}-${index}`}
                                                        index={index}
                                                        condition={condition}
                                                    />
                                                ))}
                                            </div>
                                        </DetailRow>
                                    </div>
                                </section>
                            )}
                        </>
                    )}

                    {activeTab === 'result' && (
                        <section className="dai-detail-section">
                            <div className="dai-detail-table">
                                <DetailRow label="处理反馈">{workOrder.result ?? '—'}</DetailRow>
                                <DetailRow label="处理人员">{workOrder.handler ?? '—'}</DetailRow>
                                <DetailRow label="处理时间">{workOrder.handledAt ?? '—'}</DetailRow>
                                <DetailRow label="附件">
                                    <AttachmentThumbnails count={detail.attachmentCount} />
                                </DetailRow>
                                <DetailRow label="验收状态">{detail.acceptanceStatus}</DetailRow>
                            </div>
                        </section>
                    )}

                    {activeTab === 'records' && (
                        <section className="dai-detail-section">
                            <ProcessRecordTimeline
                                records={detail.records}
                                onAccept={workOrder.status === '待验收' && onAccept
                                    ? () => onAccept(workOrder)
                                    : undefined}
                            />
                        </section>
                    )}
                </div>

                <div className="pcp-drawer__foot">
                    <button type="button" className="pm-btn pm-btn-primary" onClick={onClose}>关闭</button>
                </div>
            </aside>
        </div>,
        document.body,
    );
}
