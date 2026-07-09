import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import ElSelect from './ElSelect';
import {
    PUSH_SOURCE_MESSAGE_TYPE_OPTIONS,
    PUSH_SOURCE_PLATFORM_OPTIONS,
    type PushSourceFormValue,
    type PushSourcePlatform,
    type PushSourceMessageType,
} from '../data/pushSources';
import '../product-create.css';
import '../push-source-config.css';
import ClearableInput from './ClearableInput';

type PushSourceFormDrawerProps = {
    open: boolean;
    mode: 'add' | 'edit';
    initialValue?: PushSourceFormValue;
    onClose: () => void;
    onSubmit: (value: PushSourceFormValue) => void;
};

const EMPTY_FORM: PushSourceFormValue = {
    name: '',
    messageType: '',
    platform: '',
};

const MESSAGE_TYPE_OPTIONS = [
    { label: '请选择', value: '' },
    ...PUSH_SOURCE_MESSAGE_TYPE_OPTIONS.map((item) => ({ label: item.label, value: item.value })),
];

const PLATFORM_OPTIONS = [
    { label: '请选择', value: '' },
    ...PUSH_SOURCE_PLATFORM_OPTIONS.map((item) => ({ label: item.label, value: item.value })),
];

export default function PushSourceFormDrawer({
    open,
    mode,
    initialValue,
    onClose,
    onSubmit,
}: PushSourceFormDrawerProps) {
    const [form, setForm] = useState<PushSourceFormValue>(EMPTY_FORM);
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
        setForm(mode === 'edit' && initialValue ? initialValue : EMPTY_FORM);
        setTouched(false);
    }, [open, mode, initialValue]);

    if (!open) return null;

    const canSubmit = Boolean(form.name.trim() && form.messageType && form.platform);

    const handleConfirm = () => {
        setTouched(true);
        if (!canSubmit) return;
        onSubmit({
            name: form.name.trim(),
            messageType: form.messageType as PushSourceMessageType,
            platform: form.platform as PushSourcePlatform,
        });
    };

    const handleMaskMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
        if (event.target === event.currentTarget) {
            onClose();
        }
    };

    return createPortal(
        <div className="pcp-drawer-mask psc-drawer-mask" role="presentation" onMouseDown={handleMaskMouseDown}>
            <aside
                className="pcp-drawer pcp-drawer--form psc-form-drawer"
                role="dialog"
                aria-modal="true"
                aria-labelledby="psc-form-drawer-title"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <div className="pcp-drawer__head">
                    <h3 id="psc-form-drawer-title">{mode === 'add' ? '新增' : '编辑'}</h3>
                    <button type="button" className="pcp-drawer__close" onClick={onClose} aria-label="关闭">×</button>
                </div>
                <div className="pcp-drawer__body pcp-drawer__body--form">
                    <label className="pcp-drawer-field">
                        <span className="pcp-form-label"><em>*</em>名称：</span>
                        <ClearableInput
                            type="text"
                            className="pcp-form-input"
                            placeholder="请输入名称"
                            value={form.name}
                            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                        />
                        {touched && !form.name.trim() ? (
                            <span className="psc-field-error">请输入名称</span>
                        ) : null}
                    </label>
                    <div className="pcp-drawer-field">
                        <span className="pcp-form-label"><em>*</em>消息类型：</span>
                        <ElSelect
                            value={form.messageType}
                            options={MESSAGE_TYPE_OPTIONS}
                            placeholder="请选择"
                            onChange={(value) => setForm((prev) => ({
                                ...prev,
                                messageType: value as PushSourceMessageType | '',
                            }))}
                        />
                        {touched && !form.messageType ? (
                            <span className="psc-field-error">请选择消息类型</span>
                        ) : null}
                    </div>
                    <div className="pcp-drawer-field">
                        <span className="pcp-form-label"><em>*</em>推送源平台：</span>
                        <ElSelect
                            value={form.platform}
                            options={PLATFORM_OPTIONS}
                            placeholder="请选择"
                            onChange={(value) => setForm((prev) => ({
                                ...prev,
                                platform: value as PushSourcePlatform | '',
                            }))}
                        />
                        {touched && !form.platform ? (
                            <span className="psc-field-error">请选择推送源平台</span>
                        ) : null}
                    </div>
                </div>
                <div className="pcp-drawer__foot">
                    <button type="button" className="pm-btn pm-btn-ghost" onClick={onClose}>取消</button>
                    <button type="button" className="pm-btn pm-btn-primary" onClick={handleConfirm}>确定</button>
                </div>
            </aside>
        </div>,
        document.body,
    );
}
