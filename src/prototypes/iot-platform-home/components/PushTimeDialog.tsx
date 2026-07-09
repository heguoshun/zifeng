import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Clock } from 'lucide-react';
import ElSelect from './ElSelect';
import {
    MESSAGE_PUSH_CYCLE_OPTIONS,
    type MessagePushCycle,
    type MessagePushSettings,
} from '../data/messageSubscriptions';
import '../product-create.css';
import '../message-subscribe.css';
import ClearableInput from './ClearableInput';

type PushTimeDialogProps = {
    open: boolean;
    settings: MessagePushSettings;
    onClose: () => void;
    onConfirm: (settings: MessagePushSettings) => void;
};

const CYCLE_OPTIONS = [
    { label: '请选择', value: '' },
    ...MESSAGE_PUSH_CYCLE_OPTIONS.map((item) => ({ label: item.label, value: item.value })),
];

export default function PushTimeDialog({
    open,
    settings,
    onClose,
    onConfirm,
}: PushTimeDialogProps) {
    const [pushTime, setPushTime] = useState(settings.pushTime);
    const [pushCycle, setPushCycle] = useState(settings.pushCycle);
    const [touched, setTouched] = useState(false);

    useEffect(() => {
        if (!open) return undefined;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [open]);

    useEffect(() => {
        if (!open) return;
        setPushTime(settings.pushTime);
        setPushCycle(settings.pushCycle);
        setTouched(false);
    }, [open, settings]);

    if (!open) return null;

    const canSubmit = Boolean(pushTime.trim() && pushCycle);

    const handleConfirm = () => {
        setTouched(true);
        if (!canSubmit) return;
        onConfirm({
            pushTime: pushTime.trim(),
            pushCycle: pushCycle as MessagePushCycle,
        });
    };

    const handleMaskMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
        if (event.target === event.currentTarget) {
            onClose();
        }
    };

    return createPortal(
        <div
            className="pcp-drawer-mask ms-push-drawer-mask"
            role="presentation"
            onMouseDown={handleMaskMouseDown}
        >
            <aside
                className="pcp-drawer pcp-drawer--form ms-push-drawer"
                role="dialog"
                aria-modal="true"
                aria-labelledby="ms-push-drawer-title"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <div className="pcp-drawer__head">
                    <h3 id="ms-push-drawer-title">推送时间</h3>
                    <button type="button" className="pcp-drawer__close" onClick={onClose} aria-label="关闭">×</button>
                </div>
                <div className="pcp-drawer__body pcp-drawer__body--form">
                    <label className="pcp-drawer-field">
                        <span className="pcp-form-label"><em>*</em>推送时间：</span>
                        <div className="ms-push-field">
                            <div className="ms-time-field">
                                <ClearableInput
                                    type="text"
                                    className="pcp-form-input"
                                    placeholder="06:00:00"
                                    value={pushTime}
                                    onChange={(event) => setPushTime(event.target.value)}
                                />
                                <span className="ms-time-icon" aria-hidden="true">
                                    <Clock size={14} />
                                </span>
                            </div>
                            {touched && !pushTime.trim() ? (
                                <span className="ms-field-error">请输入推送时间</span>
                            ) : null}
                        </div>
                    </label>
                    <div className="pcp-drawer-field">
                        <span className="pcp-form-label"><em>*</em>推送周期：</span>
                        <div className="ms-push-field">
                            <ElSelect
                                value={pushCycle}
                                options={CYCLE_OPTIONS}
                                placeholder="请选择"
                                onChange={setPushCycle}
                            />
                            {touched && !pushCycle ? (
                                <span className="ms-field-error">请选择推送周期</span>
                            ) : null}
                        </div>
                    </div>
                </div>
                <div className="pcp-drawer__foot">
                    <button type="button" className="pm-btn pm-btn-ghost" onClick={onClose}>取消</button>
                    <button
                        type="button"
                        className="pm-btn pm-btn-primary"
                        disabled={!canSubmit && touched}
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
