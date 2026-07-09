import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { OperationLogRecord } from '../data/operationLogs';
import '../product-create.css';
import '../log-management.css';

type OperationLogDetailDrawerProps = {
    open: boolean;
    record: OperationLogRecord | null;
    onClose: () => void;
};

function DetailField({ label, children, fullWidth = false }: {
    label: string;
    children: React.ReactNode;
    fullWidth?: boolean;
}) {
    return (
        <div className={`log-detail-field ${fullWidth ? 'log-detail-field--full' : ''}`}>
            <span className="log-detail-field__label">{label}：</span>
            <div className="log-detail-field__value">{children}</div>
        </div>
    );
}

export default function OperationLogDetailDrawer({
    open,
    record,
    onClose,
}: OperationLogDetailDrawerProps) {
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
                aria-labelledby="operation-log-detail-title"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <div className="pcp-drawer__head">
                    <h3 id="operation-log-detail-title">日志详情</h3>
                    <button type="button" className="pcp-drawer__close" onClick={onClose} aria-label="关闭">
                        ×
                    </button>
                </div>
                <div className="pcp-drawer__body log-detail-drawer__body">
                    <div className="log-detail-dialog__grid">
                        <DetailField label="操作模块">{record.module}</DetailField>
                        <DetailField label="请求地址">{record.requestUrl ?? '—'}</DetailField>
                        <DetailField label="登录信息">{record.operator}</DetailField>
                        <DetailField label="请求方式">{record.requestMethod}</DetailField>
                        <DetailField label="操作方法" fullWidth>
                            {record.operationMethod ?? '—'}
                        </DetailField>
                        <DetailField label="请求参数" fullWidth>
                            <pre className="log-detail-code">{record.requestParams ?? '—'}</pre>
                        </DetailField>
                        <DetailField label="返回参数" fullWidth>
                            <pre className="log-detail-code">{record.responseParams ?? record.responseMessage ?? '—'}</pre>
                        </DetailField>
                        <DetailField label="操作状态">{record.status}</DetailField>
                        <DetailField label="操作时间">{record.operationTime}</DetailField>
                    </div>
                </div>
            </aside>
        </div>,
        document.body,
    );
}
