import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Plus } from 'lucide-react';
import '../product-create.css';
import '../device-create.css';
import '../device-alarm-info.css';

const PROCESS_RESULT_MAX = 100;

type BatchProcessAlarmsModalProps = {
    open: boolean;
    count: number;
    onClose: () => void;
    onConfirm: (result: string) => void;
};

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="dai-detail-row">
            <div className="dai-detail-label">{label}</div>
            <div className="dai-detail-value">{children}</div>
        </div>
    );
}

export default function BatchProcessAlarmsModal({
    open,
    count,
    onClose,
    onConfirm,
}: BatchProcessAlarmsModalProps) {
    const [processResult, setProcessResult] = useState('');

    useEffect(() => {
        if (!open) return;
        setProcessResult('');
    }, [open, count]);

    if (!open || count <= 0) return null;

    const handleConfirm = () => {
        const trimmed = processResult.trim();
        if (!trimmed) return;
        onConfirm(trimmed);
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
                aria-labelledby="dai-batch-process-title"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <div className="pcp-drawer__head">
                    <h3 id="dai-batch-process-title">批量处理</h3>
                    <button type="button" className="pcp-drawer__close" onClick={onClose} aria-label="关闭">×</button>
                </div>

                <div className="pcp-drawer__body dai-alarm-detail-body">
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
                </div>

                <div className="pcp-drawer__foot">
                    <button type="button" className="pm-btn pm-btn-ghost" onClick={onClose}>取消</button>
                    <button
                        type="button"
                        className="pm-btn pm-btn-primary"
                        disabled={!processResult.trim()}
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
