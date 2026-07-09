import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { WorkOrderRecord } from '../data/workOrders';
import '../product-create.css';
import '../device-create.css';
import '../work-order-management.css';

const REMARK_MAX = 100;

export type WorkOrderAcceptResult = '通过' | '未通过';

export type WorkOrderAcceptPayload = {
    result: WorkOrderAcceptResult;
    remark: string;
};

type WorkOrderAcceptDialogProps = {
    open: boolean;
    workOrder: WorkOrderRecord | null;
    onClose: () => void;
    onConfirm: (payload: WorkOrderAcceptPayload) => void;
};

export default function WorkOrderAcceptDialog({
    open,
    workOrder,
    onClose,
    onConfirm,
}: WorkOrderAcceptDialogProps) {
    const [result, setResult] = useState<WorkOrderAcceptResult | ''>('');
    const [remark, setRemark] = useState('');

    useEffect(() => {
        if (!open) return;
        setResult('');
        setRemark('');
    }, [open, workOrder?.id]);

    if (!open || !workOrder) return null;

    const remarkRequired = result === '未通过';
    const canSubmit = result !== '' && (!remarkRequired || remark.trim().length > 0);

    const handleConfirm = () => {
        if (!canSubmit || result === '') return;
        onConfirm({
            result,
            remark: remark.trim(),
        });
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
                className="pcp-drawer pcp-drawer--form dcp-group-dialog wom-accept-drawer"
                role="dialog"
                aria-modal="true"
                aria-labelledby="wom-accept-drawer-title"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <div className="pcp-drawer__head">
                    <h3 id="wom-accept-drawer-title">工单验收</h3>
                    <button type="button" className="pcp-drawer__close" onClick={onClose} aria-label="关闭">×</button>
                </div>

                <div className="pcp-drawer__body pcp-drawer__body--form">
                    <div className="pcp-drawer-field wom-accept-drawer__field">
                        <span className="pcp-form-label"><em>*</em>验收结果</span>
                        <div className="pcp-radio-group">
                            <label className="pcp-radio">
                                <input
                                    type="radio"
                                    name="wom-accept-result"
                                    checked={result === '通过'}
                                    onChange={() => setResult('通过')}
                                />
                                通过
                            </label>
                            <label className="pcp-radio">
                                <input
                                    type="radio"
                                    name="wom-accept-result"
                                    checked={result === '未通过'}
                                    onChange={() => setResult('未通过')}
                                />
                                未通过
                            </label>
                        </div>
                    </div>

                    <label className="pcp-drawer-field wom-accept-drawer__field">
                        <span className="pcp-form-label">
                            {remarkRequired ? <em>*</em> : null}
                            备注
                        </span>
                        <div className="dai-textarea-wrap wom-accept-drawer__textarea-wrap">
                            <textarea
                                className="pcp-form-textarea wom-accept-drawer__textarea"
                                placeholder="请输入描述信息"
                                maxLength={REMARK_MAX}
                                value={remark}
                                onChange={(event) => setRemark(event.target.value)}
                            />
                            <span className="dai-textarea-counter">
                                {remark.length}/{REMARK_MAX}
                            </span>
                        </div>
                    </label>
                </div>

                <div className="pcp-drawer__foot">
                    <button type="button" className="pm-btn pm-btn-ghost" onClick={onClose}>取消</button>
                    <button
                        type="button"
                        className="pm-btn pm-btn-primary"
                        disabled={!canSubmit}
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
