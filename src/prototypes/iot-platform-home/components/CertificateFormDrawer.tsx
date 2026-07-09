import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import ElSelect from './ElSelect';
import {
    CERTIFICATE_FILE_ACCEPT,
    CERTIFICATE_FILE_FORMAT_HINT,
    CERTIFICATE_STANDARD_OPTIONS,
    defaultCertificateFormValue,
    validateCertificateFile,
    type CertificateFormValue,
} from '../data/certificates';
import '../product-create.css';
import '../device-create.css';
import '../protocol-management.css';
import '../certificate-management.css';
import ClearableInput from './ClearableInput';

type CertificateFormDrawerProps = {
    open: boolean;
    mode: 'add' | 'edit';
    initialValue?: CertificateFormValue;
    onClose: () => void;
    onSubmit: (value: CertificateFormValue) => void;
};

export default function CertificateFormDrawer({
    open,
    mode,
    initialValue,
    onClose,
    onSubmit,
}: CertificateFormDrawerProps) {
    const [form, setForm] = useState<CertificateFormValue>(defaultCertificateFormValue());
    const [touched, setTouched] = useState(false);
    const [fileError, setFileError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!open) return;
        setForm(mode === 'edit' && initialValue ? initialValue : defaultCertificateFormValue());
        setTouched(false);
        setFileError(null);
    }, [open, mode, initialValue]);

    if (!open) return null;

    const canSubmit = Boolean(
        form.standard
        && form.name.trim()
        && form.fileName
        && form.privateKey.trim(),
    );

    const handleConfirm = () => {
        setTouched(true);
        if (!canSubmit) return;
        onSubmit({
            ...form,
            name: form.name.trim(),
            privateKey: form.privateKey.trim(),
            description: form.description.trim(),
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

        const error = validateCertificateFile(file);
        if (error) {
            setTouched(true);
            setFileError(error);
            return;
        }

        setFileError(null);
        setForm((prev) => ({ ...prev, fileName: file.name }));
        event.target.value = '';
    };

    return createPortal(
        <div
            className="pcp-drawer-mask dcp-group-dialog-mask"
            role="presentation"
            onMouseDown={handleMaskMouseDown}
        >
            <aside
                className="pcp-drawer pcp-drawer--form dcp-group-dialog cert-form-drawer"
                role="dialog"
                aria-modal="true"
                aria-labelledby="cert-form-drawer-title"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <div className="pcp-drawer__head">
                    <h3 id="cert-form-drawer-title">{mode === 'add' ? '新增' : '编辑'}</h3>
                    <button type="button" className="pcp-drawer__close" onClick={onClose} aria-label="关闭">×</button>
                </div>

                <div className="pcp-drawer__body pcp-drawer__body--form">
                    <div className="pcp-drawer-field">
                        <span className="pcp-form-label"><em>*</em>证书标准：</span>
                        <ElSelect
                            className="el-select--medium pcp-form-select"
                            size="medium"
                            value={form.standard}
                            options={[{ label: '请选择证书标准', value: '' }, ...CERTIFICATE_STANDARD_OPTIONS]}
                            onChange={(value) => setForm((prev) => ({
                                ...prev,
                                standard: value as CertificateFormValue['standard'],
                            }))}
                        />
                        {touched && !form.standard ? (
                            <span className="cert-field-error">请选择证书标准</span>
                        ) : null}
                    </div>

                    <label className="pcp-drawer-field">
                        <span className="pcp-form-label"><em>*</em>证书名称：</span>
                        <ClearableInput
                            type="text"
                            className="pcp-form-input"
                            placeholder="请输入证书名称"
                            value={form.name}
                            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                        />
                        {touched && !form.name.trim() ? (
                            <span className="cert-field-error">请输入证书名称</span>
                        ) : null}
                    </label>

                    <div className="pcp-drawer-field">
                        <span className="pcp-form-label"><em>*</em>证书文件：</span>
                        <input
                            ref={fileInputRef}
                            type="file"
                            className="pt-form-file-input"
                            accept={CERTIFICATE_FILE_ACCEPT}
                            onChange={handleFileChange}
                        />
                        <button
                            type="button"
                            className="pt-upload-file-btn cert-upload-btn"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            选择文件
                        </button>
                        {form.fileName ? (
                            <p className="pt-upload-file-name">{form.fileName}</p>
                        ) : null}
                        <p className="cert-upload-hint">
                            ① {CERTIFICATE_FILE_FORMAT_HINT}，文件大小不超过 100M
                        </p>
                        {fileError ? (
                            <span className="cert-field-error">{fileError}</span>
                        ) : null}
                        {touched && !form.fileName && !fileError ? (
                            <span className="cert-field-error">请上传证书文件</span>
                        ) : null}
                    </div>

                    <label className="pcp-drawer-field">
                        <span className="pcp-form-label"><em>*</em>证书私钥：</span>
                        <textarea
                            className="pcp-form-textarea"
                            placeholder="请输入证书私钥"
                            rows={4}
                            value={form.privateKey}
                            onChange={(event) => setForm((prev) => ({ ...prev, privateKey: event.target.value }))}
                        />
                        {touched && !form.privateKey.trim() ? (
                            <span className="cert-field-error">请输入证书私钥</span>
                        ) : null}
                    </label>

                    <label className="pcp-drawer-field">
                        <span className="pcp-form-label">说明：</span>
                        <textarea
                            className="pcp-form-textarea"
                            placeholder="请输入说明"
                            rows={3}
                            value={form.description}
                            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
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
                        确定
                    </button>
                </div>
            </aside>
        </div>,
        document.body,
    );
}
