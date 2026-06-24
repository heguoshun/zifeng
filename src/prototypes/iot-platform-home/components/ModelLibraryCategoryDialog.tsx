import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import ElSelect from './ElSelect';
import '../product-create.css';
import '../device-create.css';
import ClearableInput from './ClearableInput';

export type ModelLibraryCategoryFormValue = {
    name: string;
    parentId: string;
};

type ModelLibraryCategoryDialogProps = {
    open: boolean;
    mode: 'add' | 'edit';
    parentOptions: { label: string; value: string }[];
    initialValue?: ModelLibraryCategoryFormValue;
    parentDisabled?: boolean;
    showRootOption?: boolean;
    onClose: () => void;
    onConfirm: (value: ModelLibraryCategoryFormValue) => void;
};

const EMPTY_FORM: ModelLibraryCategoryFormValue = {
    name: '',
    parentId: '',
};

export default function ModelLibraryCategoryDialog({
    open,
    mode,
    parentOptions,
    initialValue,
    parentDisabled = false,
    showRootOption = true,
    onClose,
    onConfirm,
}: ModelLibraryCategoryDialogProps) {
    const [form, setForm] = useState<ModelLibraryCategoryFormValue>(EMPTY_FORM);

    useEffect(() => {
        if (!open) return;
        setForm(initialValue ? { ...initialValue } : EMPTY_FORM);
    }, [open, mode, initialValue?.name, initialValue?.parentId]);

    if (!open) return null;

    const handleConfirm = () => {
        const name = form.name.trim();
        if (!name) return;
        onConfirm({ name, parentId: form.parentId });
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
                className="pcp-drawer pcp-drawer--form dcp-group-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="ml-category-dialog-title"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <div className="pcp-drawer__head">
                    <h3 id="ml-category-dialog-title">
                        {mode === 'add' ? '新建目录' : '编辑目录'}
                    </h3>
                    <button type="button" className="pcp-drawer__close" onClick={onClose} aria-label="关闭">×</button>
                </div>
                <div className="pcp-drawer__body pcp-drawer__body--form">
                    <label className="pcp-drawer-field">
                        <span className="pcp-form-label"><em>*</em>目录名称：</span>
                        <ClearableInput
                            type="text"
                            className="pcp-form-input"
                            placeholder="请输入，不超过20字符"
                            maxLength={20}
                            value={form.name}
                            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                        />
                    </label>
                    <div className="pcp-drawer-field">
                        <span className="pcp-form-label">父级目录：</span>
                        <ElSelect
                            className="el-select--medium pcp-form-select"
                            size="medium"
                            disabled={parentDisabled}
                            value={form.parentId}
                            placeholder="请选择父级目录"
                            options={[
                                ...(showRootOption ? [{ label: '无（顶级目录）', value: '' }] : []),
                                ...parentOptions,
                            ]}
                            onChange={(value) => setForm((prev) => ({ ...prev, parentId: value }))}
                        />
                    </div>
                </div>
                <div className="pcp-drawer__foot">
                    <button type="button" className="pm-btn pm-btn-ghost" onClick={onClose}>取消</button>
                    <button
                        type="button"
                        className="pm-btn pm-btn-primary"
                        disabled={!form.name.trim()}
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
