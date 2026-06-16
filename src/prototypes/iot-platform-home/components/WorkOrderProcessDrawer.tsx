import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Plus } from 'lucide-react';
import type { WorkOrderRecord } from '../data/workOrders';
import '../product-create.css';
import '../device-create.css';
import '../work-order-management.css';

const PROCESS_RESULT_MAX = 100;

export type WorkOrderProcessPayload = {
    result: string;
    attachmentCount: number;
};

type WorkOrderProcessDrawerProps = {
    open: boolean;
    workOrder: WorkOrderRecord | null;
    onClose: () => void;
    onConfirm: (payload: WorkOrderProcessPayload) => void;
};

export default function WorkOrderProcessDrawer({
    open,
    workOrder,
    onClose,
    onConfirm,
}: WorkOrderProcessDrawerProps) {
    const [result, setResult] = useState('');
    const [attachmentCount, setAttachmentCount] = useState(0);

    useEffect(() => {
        if (!open) return;
        setResult('');
        setAttachmentCount(0);
    }, [open, workOrder?.id]);

    if (!open || !workOrder) return null;

    const handleConfirm = () => {
        const trimmed = result.trim();
        if (!trimmed) return;
        onConfirm({ result: trimmed, attachmentCount });
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
                className="pcp-drawer pcp-drawer--form dcp-group-dialog wom-process-drawer"
                role="dialog"
                aria-modal="true"
                aria-labelledby="wom-process-drawer-title"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <div className="pcp-drawer__head">
                    <h3 id="wom-process-drawer-title">工单处理</h3>
                    <button type="button" className="pcp-drawer__close" onClick={onClose} aria-label="关闭">×</button>
                </div>

                <div className="pcp-drawer__body pcp-drawer__body--form">
                    <label className="pcp-drawer-field wom-process-drawer__field">
                        <span className="pcp-form-label"><em>*</em>处理结果</span>
                        <div className="dai-textarea-wrap wom-process-drawer__textarea-wrap">
                            <textarea
                                className="pcp-form-textarea wom-process-drawer__textarea"
                                placeholder="请输入处理结果"
                                maxLength={PROCESS_RESULT_MAX}
                                value={result}
                                onChange={(event) => setResult(event.target.value)}
                            />
                            <span className="dai-textarea-counter">
                                {result.length}/{PROCESS_RESULT_MAX}
                            </span>
                        </div>
                    </label>

                    <div className="pcp-drawer-field wom-process-drawer__field">
                        <span className="pcp-form-label">附件</span>
                        <div className="pcp-upload-wrap dai-upload-wrap">
                            <button
                                type="button"
                                className="pcp-upload-box"
                                aria-label="上传图片"
                                onClick={() => setAttachmentCount((count) => Math.min(count + 1, 3))}
                            >
                                <Plus size={18} />
                                上传图片
                            </button>
                            <p className="pcp-upload-tip dai-upload-tip">
                                支持文件格式：jpg、png单个文件不超过2 M
                            </p>
                        </div>
                    </div>
                </div>

                <div className="pcp-drawer__foot">
                    <button type="button" className="pm-btn pm-btn-ghost" onClick={onClose}>取消</button>
                    <button
                        type="button"
                        className="pm-btn pm-btn-primary"
                        disabled={!result.trim()}
                        onClick={handleConfirm}
                    >
                        确定
                    </button>
                </div>
            </aside>
        </div>,
        document.body,
    );
}
