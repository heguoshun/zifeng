import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { PropertyLogRecord, FunctionLogRecord, EventLogRecord } from '../data/deviceLogManagement';
import '../product-create.css';
import '../device-alarm-info.css';
import '../log-management.css';
import '../device-log-management.css';

type DetailState =
    | { kind: 'property'; record: PropertyLogRecord }
    | { kind: 'function'; record: FunctionLogRecord }
    | { kind: 'event'; record: EventLogRecord }
    | null;

type LogDetailDrawerProps = {
    open: boolean;
    detail: DetailState;
    onClose: () => void;
};

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="dai-detail-row">
            <div className="dai-detail-label">{label}</div>
            <div className="dai-detail-value">{children}</div>
        </div>
    );
}

export default function LogDetailDrawer({ open, detail, onClose }: LogDetailDrawerProps) {
    useEffect(() => {
        if (!open) return undefined;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [open]);

    if (!open || !detail) return null;

    const handleMaskMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
        if (event.target === event.currentTarget) {
            onClose();
        }
    };

    const title = detail.kind === 'property'
        ? '属性日志详情'
        : detail.kind === 'function'
            ? '功能日志详情'
            : '事件日志详情';

    const renderContent = () => {
        if (detail.kind === 'property') {
            const record = detail.record;
            return (
                <div className="dai-detail-table">
                    <DetailRow label="类型">{record.type}</DetailRow>
                    <DetailRow label="标识符"><code className="dlm-code">{record.identifier}</code></DetailRow>
                    <DetailRow label="时间">{record.time}</DetailRow>
                    <DetailRow label="内容">{record.content}</DetailRow>
                    <DetailRow label="详情">
                        <pre className="log-detail-code">{record.detail}</pre>
                    </DetailRow>
                </div>
            );
        }

        if (detail.kind === 'function') {
            const record = detail.record;
            return (
                <div className="dai-detail-table">
                    <DetailRow label="功能标识"><code className="dlm-code">{record.functionIdentifier}</code></DetailRow>
                    <DetailRow label="功能名称">{record.functionName}</DetailRow>
                    <DetailRow label="下发时间">{record.sendTime}</DetailRow>
                    <DetailRow label="参数"><pre className="log-detail-code">{record.params}</pre></DetailRow>
                    <DetailRow label="下发回复">
                        <span className={`dlm-reply ${record.reply === '1' ? 'dlm-reply--ok' : 'dlm-reply--fail'}`}>
                            {record.reply === '1' ? '成功 (1)' : '失败 (0)'}
                        </span>
                    </DetailRow>
                    <DetailRow label="详情">
                        <pre className="log-detail-code">{record.detail}</pre>
                    </DetailRow>
                </div>
            );
        }

        // event
        const record = detail.record;
        return (
            <div className="dai-detail-table">
                <DetailRow label="类型">
                    <span className={`dlm-event-tag dlm-event-tag--${record.type === '告警' ? 'warn' : record.type === '故障' ? 'fail' : 'info'}`}>
                        {record.type}
                    </span>
                </DetailRow>
                <DetailRow label="标识符"><code className="dlm-code">{record.identifier}</code></DetailRow>
                <DetailRow label="时间">{record.time}</DetailRow>
                <DetailRow label="内容">{record.content}</DetailRow>
                <DetailRow label="详情">
                    <pre className="log-detail-code">{record.detail}</pre>
                </DetailRow>
            </div>
        );
    };

    return createPortal(
        <div className="pcp-drawer-mask" role="presentation" onMouseDown={handleMaskMouseDown}>
            <aside
                className="pcp-drawer dlm-detail-drawer"
                role="dialog"
                aria-modal="true"
                aria-labelledby="log-detail-title"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <div className="pcp-drawer__head">
                    <h3 id="log-detail-title">{title}</h3>
                    <button type="button" className="pcp-drawer__close" onClick={onClose} aria-label="关闭">
                        ×
                    </button>
                </div>
                <div className="pcp-drawer__body dlm-detail-drawer__body">
                    {renderContent()}
                </div>
            </aside>
        </div>,
        document.body,
    );
}
