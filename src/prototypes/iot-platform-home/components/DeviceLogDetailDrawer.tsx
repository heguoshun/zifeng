import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import DeviceLogStatusCode from './DeviceLogStatusCode';
import type { DeviceLogRecord } from '../data/deviceLogs';
import '../product-create.css';
import '../device-alarm-info.css';
import '../log-management.css';
import '../device-log.css';

type DeviceLogDetailDrawerProps = {
    open: boolean;
    record: DeviceLogRecord | null;
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

export default function DeviceLogDetailDrawer({
    open,
    record,
    onClose,
}: DeviceLogDetailDrawerProps) {
    useEffect(() => {
        if (!open) return undefined;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [open]);

    if (!open || !record) return null;

    const handleMaskMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
        if (event.target === event.currentTarget) {
            onClose();
        }
    };

    return createPortal(
        <div className="pcp-drawer-mask" role="presentation" onMouseDown={handleMaskMouseDown}>
            <aside
                className="pcp-drawer log-detail-drawer"
                role="dialog"
                aria-modal="true"
                aria-labelledby="device-log-detail-title"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <div className="pcp-drawer__head">
                    <h3 id="device-log-detail-title">日志详情</h3>
                    <button type="button" className="pcp-drawer__close" onClick={onClose} aria-label="关闭">
                        ×
                    </button>
                </div>
                <div className="pcp-drawer__body log-detail-drawer__body">
                    <div className="dai-detail-table">
                        <DetailRow label="日志时间">{record.eventTime}</DetailRow>
                        <DetailRow label="设备编号">{record.deviceCode}</DetailRow>
                        <DetailRow label="设备名称">{record.deviceName}</DetailRow>
                        <DetailRow label="所属产品">{record.productName}</DetailRow>
                        <DetailRow label="链路ID">{record.linkId}</DetailRow>
                        <DetailRow label="消息ID">{record.messageId}</DetailRow>
                        <DetailRow label="业务类型">{record.bizType}</DetailRow>
                        <DetailRow label="日志状态">
                            <DeviceLogStatusCode code={record.statusCode} />
                        </DetailRow>
                        <DetailRow label="内容详情">
                            <pre className="log-detail-code">{record.contentDetail}</pre>
                        </DetailRow>
                    </div>
                </div>
            </aside>
        </div>,
        document.body,
    );
}
