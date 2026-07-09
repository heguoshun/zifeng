import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import ElSelect from './ElSelect';
import SpaceImageUpload from './SpaceImageUpload';
import '../product-create.css';
import '../device-create.css';
import '../space-config.css';
import ClearableInput from './ClearableInput';

export type EditSpaceFormValue = {
    name: string;
    department: string;
    description: string;
    imageUrl: string;
};

type EditSpaceDrawerProps = {
    open: boolean;
    parentLabel: string;
    spaceTypeLabel: string;
    initialValue: EditSpaceFormValue;
    departmentOptions: { label: string; value: string }[];
    onClose: () => void;
    onConfirm: (value: EditSpaceFormValue) => void;
};

export default function EditSpaceDrawer({
    open,
    parentLabel,
    spaceTypeLabel,
    initialValue,
    departmentOptions,
    onClose,
    onConfirm,
}: EditSpaceDrawerProps) {
    const [form, setForm] = useState<EditSpaceFormValue>(initialValue);

    useEffect(() => {
        if (!open) return;
        setForm(initialValue);
    }, [open, initialValue.name, initialValue.department, initialValue.description, initialValue.imageUrl]);

    if (!open) return null;

    const descriptionLength = form.description.length;

    const handleConfirm = () => {
        const name = form.name.trim();
        if (!name || !form.department) return;
        onConfirm({
            name,
            department: form.department,
            description: form.description.trim(),
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
                className="pcp-drawer pcp-drawer--form dcp-group-dialog sc-space-drawer"
                role="dialog"
                aria-modal="true"
                aria-labelledby="sc-edit-drawer-title"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <div className="pcp-drawer__head">
                    <h3 id="sc-edit-drawer-title">编辑空间</h3>
                    <button type="button" className="pcp-drawer__close" onClick={onClose} aria-label="关闭">×</button>
                </div>
                <div className="pcp-drawer__body pcp-drawer__body--form">
                    <label className="pcp-drawer-field">
                        <span className="pcp-form-label"><em>*</em>空间名称：</span>
                        <ClearableInput
                            type="text"
                            className="pcp-form-input"
                            placeholder="请输入空间名称"
                            value={form.name}
                            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                        />
                    </label>
                    <label className="pcp-drawer-field">
                        <span className="pcp-form-label"><em>*</em>上级空间：</span>
                        <input type="text" className="pcp-form-input is-readonly" value={parentLabel} readOnly />
                    </label>
                    <label className="pcp-drawer-field">
                        <span className="pcp-form-label"><em>*</em>空间类型：</span>
                        <input type="text" className="pcp-form-input is-readonly" value={spaceTypeLabel} readOnly />
                    </label>
                    <div className="pcp-drawer-field">
                        <span className="pcp-form-label"><em>*</em>所属部门：</span>
                        <ElSelect
                            className="el-select--medium pcp-form-select"
                            size="medium"
                            value={form.department}
                            options={[{ label: '请选择', value: '' }, ...departmentOptions]}
                            onChange={(value) => setForm((prev) => ({ ...prev, department: value }))}
                        />
                    </div>
                    <label className="pcp-drawer-field">
                        <span className="pcp-form-label">空间描述：</span>
                        <div className="sc-space-drawer__textarea-wrap">
                            <textarea
                                className="pcp-form-textarea"
                                placeholder="请输入"
                                maxLength={100}
                                value={form.description}
                                onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                            />
                            <span className="sc-space-drawer__counter">{descriptionLength}/100</span>
                        </div>
                    </label>
                    <div className="pcp-drawer-field">
                        <span className="pcp-form-label">空间图片：</span>
                        <SpaceImageUpload
                            value={form.imageUrl}
                            onChange={(imageUrl) => setForm((prev) => ({ ...prev, imageUrl }))}
                        />
                    </div>
                </div>
                <div className="pcp-drawer__foot">
                    <button type="button" className="pm-btn pm-btn-ghost" onClick={onClose}>取消</button>
                    <button
                        type="button"
                        className="pm-btn pm-btn-primary"
                        disabled={!form.name.trim() || !form.department}
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
