import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
    formatPushSourceNow,
    type PushSourceConfigItem,
} from '../data/pushSources';
import '../product-create.css';
import '../push-source-config.css';
import ClearableInput from './ClearableInput';

export type PushSourceConfigItemFormValue = {
    name: string;
    key: string;
    value: string;
};

type PushSourceConfigItemDrawerProps = {
    open: boolean;
    mode: 'add' | 'edit';
    initialValue?: PushSourceConfigItemFormValue;
    onClose: () => void;
    onSubmit: (value: PushSourceConfigItemFormValue) => void;
};

const EMPTY_FORM: PushSourceConfigItemFormValue = {
    name: '',
    key: '',
    value: '',
};

export default function PushSourceConfigItemDrawer({
    open,
    mode,
    initialValue,
    onClose,
    onSubmit,
}: PushSourceConfigItemDrawerProps) {
    const [form, setForm] = useState<PushSourceConfigItemFormValue>(EMPTY_FORM);
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

    const canSubmit = Boolean(form.key.trim());

    const handleConfirm = () => {
        setTouched(true);
        if (!canSubmit) return;
        onSubmit({
            name: form.name.trim(),
            key: form.key.trim(),
            value: form.value.trim(),
        });
    };

    const handleMaskMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
        if (event.target === event.currentTarget) {
            onClose();
        }
    };

    return createPortal(
        <div className="pcp-drawer-mask psc-nested-drawer-mask" role="presentation" onMouseDown={handleMaskMouseDown}>
            <aside
                className="pcp-drawer pcp-drawer--form psc-config-item-drawer"
                role="dialog"
                aria-modal="true"
                aria-labelledby="psc-config-item-title"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <div className="pcp-drawer__head">
                    <h3 id="psc-config-item-title">{mode === 'add' ? '新增配置项' : '编辑配置项'}</h3>
                    <button type="button" className="pcp-drawer__close" onClick={onClose} aria-label="关闭">×</button>
                </div>
                <div className="pcp-drawer__body pcp-drawer__body--form">
                    <label className="pcp-drawer-field">
                        <span className="pcp-form-label">名称：</span>
                        <ClearableInput
                            type="text"
                            className="pcp-form-input"
                            placeholder="请输入名称"
                            value={form.name}
                            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                        />
                    </label>
                    <label className="pcp-drawer-field">
                        <span className="pcp-form-label"><em>*</em>键：</span>
                        <ClearableInput
                            type="text"
                            className="pcp-form-input"
                            placeholder="请输入键"
                            value={form.key}
                            onChange={(event) => setForm((prev) => ({ ...prev, key: event.target.value }))}
                        />
                        {touched && !form.key.trim() ? (
                            <span className="psc-field-error">请输入键</span>
                        ) : null}
                    </label>
                    <label className="pcp-drawer-field">
                        <span className="pcp-form-label">值：</span>
                        <ClearableInput
                            type="text"
                            className="pcp-form-input"
                            placeholder="请输入值"
                            value={form.value}
                            onChange={(event) => setForm((prev) => ({ ...prev, value: event.target.value }))}
                        />
                    </label>
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

export function toConfigItemFormValue(item: PushSourceConfigItem): PushSourceConfigItemFormValue {
    return {
        name: item.name,
        key: item.key,
        value: item.value,
    };
}

export function buildConfigItemFromForm(
    value: PushSourceConfigItemFormValue,
    existing?: PushSourceConfigItem,
): PushSourceConfigItem {
    const updatedAt = formatPushSourceNow();
    if (existing) {
        return {
            ...existing,
            name: value.name,
            key: value.key,
            value: value.value,
            updatedAt,
        };
    }
    return {
        id: `psc-item-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        name: value.name,
        key: value.key,
        value: value.value,
        updatedAt,
    };
}
