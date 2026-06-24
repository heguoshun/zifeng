import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Upload } from 'lucide-react';
import ElTreeSelect from './ElTreeSelect';
import {
    buildDebugProductSelectTree,
    DEFAULT_PRODUCT_TREE_EXPANDED,
} from '../data/productCategories';
import type { ProductRecord } from '../data/products';
import {
    EMPTY_FIRMWARE_FORM,
    validateFirmwareFileName,
    type FirmwarePackageFormValue,
    type FirmwarePackageType,
} from '../data/remoteUpgrade';
import '../device-create.css';
import '../product-create.css';
import '../remote-upgrade.css';
import ClearableInput from './ClearableInput';

type FirmwarePackageFormDialogProps = {
    open: boolean;
    mode: 'add' | 'edit';
    initialValue?: FirmwarePackageFormValue;
    products: ProductRecord[];
    onClose: () => void;
    onSubmit: (value: FirmwarePackageFormValue) => void;
};

export default function FirmwarePackageFormDialog({
    open,
    mode,
    initialValue,
    products,
    onClose,
    onSubmit,
}: FirmwarePackageFormDialogProps) {
    const [form, setForm] = useState<FirmwarePackageFormValue>(EMPTY_FIRMWARE_FORM);
    const [touched, setTouched] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

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
        setForm(mode === 'edit' && initialValue ? initialValue : EMPTY_FIRMWARE_FORM);
        setTouched(false);
    }, [open, mode, initialValue]);

    const productTree = useMemo(
        () => buildDebugProductSelectTree(products),
        [products],
    );

    const productIds = useMemo(
        () => new Set(products.map((item) => item.id)),
        [products],
    );

    if (!open) return null;

    const fileError = validateFirmwareFileName(form.fileName);
    const showDiffVersion = form.type === '差分包';
    const canSubmit = Boolean(
        form.name.trim()
        && form.productId
        && form.version.trim()
        && (!showDiffVersion || form.baseVersion.trim())
        && !fileError,
    );

    const handleConfirm = () => {
        setTouched(true);
        if (!canSubmit) return;
        onSubmit({
            ...form,
            name: form.name.trim(),
            version: form.version.trim(),
            baseVersion: showDiffVersion ? form.baseVersion.trim() : '',
            description: form.description.trim(),
        });
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        setForm((prev) => ({ ...prev, fileName: file.name }));
    };

    const handleMaskMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
        if (event.target === event.currentTarget) {
            onClose();
        }
    };

    return createPortal(
        <div className="pcp-drawer-mask ru-drawer-mask" role="presentation" onMouseDown={handleMaskMouseDown}>
            <aside
                className="pcp-drawer pcp-drawer--form dcp-group-dialog ru-drawer"
                role="dialog"
                aria-modal="true"
                aria-labelledby="ru-firmware-drawer-title"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <div className="pcp-drawer__head">
                    <h3 id="ru-firmware-drawer-title">{mode === 'add' ? '添加固件包' : '编辑固件包'}</h3>
                    <button type="button" className="pcp-drawer__close" onClick={onClose} aria-label="关闭">×</button>
                </div>
                <div className="pcp-drawer__body pcp-drawer__body--form">
                    <div className="pcp-drawer-field">
                        <span className="pcp-form-label"><em>*</em>固件包类型</span>
                        <div className="pcp-radio-group">
                            {(['完整包', '差分包'] as FirmwarePackageType[]).map((option) => (
                                <label key={option} className="pcp-radio">
                                    <input
                                        type="radio"
                                        name="firmware-type"
                                        checked={form.type === option}
                                        onChange={() => setForm((prev) => ({
                                            ...prev,
                                            type: option,
                                            baseVersion: option === '完整包' ? '' : prev.baseVersion,
                                        }))}
                                    />
                                    <span>{option}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    <label className="pcp-drawer-field">
                        <span className="pcp-form-label"><em>*</em>固件包名称</span>
                        <ClearableInput
                            type="text"
                            className="pcp-form-input"
                            placeholder="请输入固件包名称"
                            value={form.name}
                            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                        />
                    </label>
                    <div className="pcp-drawer-field">
                        <span className="pcp-form-label"><em>*</em>所属产品</span>
                        <ElTreeSelect
                            className="el-select--medium pcp-form-select ru-product-tree-select"
                            size="medium"
                            value={form.productId}
                            tree={productTree}
                            placeholder="请选择产品"
                            showAllOption={false}
                            defaultExpanded={DEFAULT_PRODUCT_TREE_EXPANDED}
                            filterable
                            onChange={(productId) => {
                                if (!productIds.has(productId)) return;
                                setForm((prev) => ({ ...prev, productId }));
                            }}
                        />
                    </div>
                    <label className="pcp-drawer-field">
                        <span className="pcp-form-label"><em>*</em>固件包版本号</span>
                        <ClearableInput
                            type="text"
                            className="pcp-form-input"
                            placeholder="请输入版本号"
                            value={form.version}
                            onChange={(event) => setForm((prev) => ({ ...prev, version: event.target.value }))}
                        />
                    </label>
                    {showDiffVersion && (
                        <label className="pcp-drawer-field">
                            <span className="pcp-form-label"><em>*</em>开始版本号</span>
                            <ClearableInput
                                type="text"
                                className="pcp-form-input"
                                placeholder="请输入版本号"
                                value={form.baseVersion}
                                onChange={(event) => setForm((prev) => ({ ...prev, baseVersion: event.target.value }))}
                            />
                        </label>
                    )}
                    <label className="pcp-drawer-field">
                        <span className="pcp-form-label">固件包描述</span>
                        <div className="ru-textarea-wrap">
                            <textarea
                                className="pcp-form-textarea ru-form-textarea"
                                placeholder="请输入描述信息"
                                rows={4}
                                maxLength={100}
                                value={form.description}
                                onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                            />
                            <span className="ru-form-counter">{form.description.length}/100</span>
                        </div>
                    </label>
                    <div className="pcp-drawer-field">
                        <span className="pcp-form-label"><em>*</em>上传固件包</span>
                        <input
                            ref={fileInputRef}
                            type="file"
                            className="ru-file-input"
                            accept=".zip,.rar,.bin,.apk"
                            onChange={handleFileChange}
                        />
                        <button
                            type="button"
                            className="ru-upload-btn"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Upload size={14} />
                            上传文件
                        </button>
                        {form.fileName && <div className="ru-upload-file-name">{form.fileName}</div>}
                        <p className="ru-upload-hint">
                            支持扩展名：.zip .rar .bin .apk，文件大小不超过 100MB；文件名长度 1~20 个字符，支持英文、数字、点、横线或下划线
                        </p>
                        {touched && fileError && <p className="ru-form-error">{fileError}</p>}
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
