import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CloudUpload } from 'lucide-react';
import type { ProtocolRecord, ProtocolType } from '../data/protocols';
import '../product-create.css';
import '../device-create.css';
import '../protocol-management.css';
import ClearableInput from './ClearableInput';

export type ProtocolFormValue = {
    name: string;
    description: string;
    type: ProtocolType;
    localAddress: string;
    jarFileName: string;
};

type ProtocolFormDrawerProps = {
    open: boolean;
    mode: 'add' | 'edit';
    initialValue?: ProtocolFormValue;
    onClose: () => void;
    onSubmit: (value: ProtocolFormValue) => void;
};

const EMPTY_FORM: ProtocolFormValue = {
    name: '',
    description: '',
    type: 'Jar',
    localAddress: '',
    jarFileName: '',
};

export function toProtocolFormValue(protocol: ProtocolRecord): ProtocolFormValue {
    return {
        name: protocol.name,
        description: protocol.description,
        type: protocol.type,
        localAddress: protocol.localAddress ?? '',
        jarFileName: protocol.jarFileName ?? '',
    };
}

export default function ProtocolFormDrawer({
    open,
    mode,
    initialValue,
    onClose,
    onSubmit,
}: ProtocolFormDrawerProps) {
    const [form, setForm] = useState<ProtocolFormValue>(EMPTY_FORM);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!open) return;

        if (mode === 'edit' && initialValue) {
            setForm({ ...initialValue });
            return;
        }

        setForm(EMPTY_FORM);
    }, [open, mode, initialValue]);

    if (!open) return null;

    const isJar = form.type === 'Jar';
    const canSubmit = form.name.trim() && (
        isJar ? Boolean(form.jarFileName) : form.localAddress.trim().length > 0
    );

    const handleConfirm = () => {
        if (!canSubmit) return;
        onSubmit({
            name: form.name.trim(),
            description: form.description.trim(),
            type: form.type,
            localAddress: form.localAddress.trim(),
            jarFileName: form.jarFileName,
        });
    };

    const handleMaskMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
        if (event.target === event.currentTarget) {
            onClose();
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        setForm((prev) => ({ ...prev, jarFileName: file.name }));
        event.target.value = '';
    };

    return createPortal(
        <div
            className="pcp-drawer-mask dcp-group-dialog-mask"
            role="presentation"
            onMouseDown={handleMaskMouseDown}
        >
            <aside
                className="pcp-drawer pcp-drawer--form dcp-group-dialog pt-form-drawer"
                role="dialog"
                aria-modal="true"
                aria-labelledby="pt-form-drawer-title"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <div className="pcp-drawer__head">
                    <h3 id="pt-form-drawer-title">{mode === 'add' ? '新增协议' : '编辑协议'}</h3>
                    <button type="button" className="pcp-drawer__close" onClick={onClose} aria-label="关闭">×</button>
                </div>

                <div className="pcp-drawer__body pcp-drawer__body--form">
                    <label className="pcp-drawer-field">
                        <span className="pcp-form-label"><em>*</em>协议名称：</span>
                        <ClearableInput
                            type="text"
                            className="pcp-form-input"
                            placeholder="请输入协议名称"
                            value={form.name}
                            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                        />
                    </label>

                    <div className="pcp-drawer-field">
                        <span className="pcp-form-label"><em>*</em>协议类型：</span>
                        <div className="pcp-radio-group pt-form-radio-group">
                            <label className="pcp-radio">
                                <input
                                    type="radio"
                                    name="pt-protocol-type"
                                    checked={form.type === 'Jar'}
                                    onChange={() => setForm((prev) => ({ ...prev, type: 'Jar' }))}
                                />
                                jar
                            </label>
                            <label className="pcp-radio">
                                <input
                                    type="radio"
                                    name="pt-protocol-type"
                                    checked={form.type === 'Local'}
                                    onChange={() => setForm((prev) => ({ ...prev, type: 'Local' }))}
                                />
                                Local
                            </label>
                        </div>
                    </div>

                    {isJar ? (
                        <div className="pcp-drawer-field">
                            <span className="pcp-form-label pt-form-label-row">
                                <span><em>*</em>协议文件：</span>
                                <span className="pt-form-label-hint">请上传不超过100M，格式为jar文件</span>
                            </span>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".jar"
                                className="pt-form-file-input"
                                onChange={handleFileChange}
                            />
                            <button
                                type="button"
                                className="pt-upload-file-btn"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <CloudUpload size={16} />
                                选择上传文件
                            </button>
                            {form.jarFileName ? (
                                <p className="pt-upload-file-name">{form.jarFileName}</p>
                            ) : null}
                        </div>
                    ) : (
                        <label className="pcp-drawer-field">
                            <span className="pcp-form-label"><em>*</em>本机地址：</span>
                            <ClearableInput
                                type="text"
                                className="pcp-form-input"
                                placeholder="请输入本机地址"
                                value={form.localAddress}
                                onChange={(event) => setForm((prev) => ({
                                    ...prev,
                                    localAddress: event.target.value,
                                }))}
                            />
                        </label>
                    )}

                    <label className="pcp-drawer-field">
                        <span className="pcp-form-label">协议说明：</span>
                        <textarea
                            className="pcp-form-textarea"
                            placeholder="请输入说明"
                            rows={4}
                            value={form.description}
                            onChange={(event) => setForm((prev) => ({
                                ...prev,
                                description: event.target.value,
                            }))}
                        />
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
                        {mode === 'add' ? '新增' : '保存'}
                    </button>
                </div>
            </aside>
        </div>,
        document.body,
    );
}
