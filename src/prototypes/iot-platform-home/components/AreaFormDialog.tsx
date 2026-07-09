import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import ElSelect from './ElSelect';
import '../product-create.css';
import '../device-create.css';
import ClearableInput from './ClearableInput';

export type AreaFormValue = {
    name: string;
    parentId: string;
};

type AreaFormDialogProps = {
    open: boolean;
    mode: 'add' | 'edit';
    parentOptions: { label: string; value: string }[];
    initialValue?: AreaFormValue;
    onClose: () => void;
    onConfirm: (value: AreaFormValue) => void;
};

const EMPTY_FORM: AreaFormValue = {
    name: '',
    parentId: '',
};

export default function AreaFormDialog({
    open,
    mode,
    parentOptions,
    initialValue,
    onClose,
    onConfirm,
}: AreaFormDialogProps) {
    const [form, setForm] = useState<AreaFormValue>(EMPTY_FORM);

    useEffect(() => {
        if (!open) return;
        if (initialValue) {
            setForm({ ...initialValue });
            return;
        }
        setForm(EMPTY_FORM);
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
                aria-labelledby="lm-area-dialog-title"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <div className="pcp-drawer__head">
                    <h3 id="lm-area-dialog-title">
                        {mode === 'add' ? '新增片区' : '编辑片区'}
                    </h3>
                    <button type="button" className="pcp-drawer__close" onClick={onClose} aria-label="关闭">×</button>
                </div>
                <div className="pcp-drawer__body pcp-drawer__body--form">
                    <label className="pcp-drawer-field">
                        <span className="pcp-form-label"><em>*</em>片区名称：</span>
                        <ClearableInput
                            type="text"
                            className="pcp-form-input"
                            placeholder="请输入片区名称"
                            value={form.name}
                            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                        />
                    </label>
                    {mode === 'add' ? (
                        <div className="pcp-drawer-field">
                            <span className="pcp-form-label">上级片区：</span>
                            <ElSelect
                                className="el-select--medium pcp-form-select"
                                size="medium"
                                value={form.parentId}
                                options={[{ label: '无（顶级片区）', value: '' }, ...parentOptions]}
                                onChange={(value) => setForm((prev) => ({ ...prev, parentId: value }))}
                            />
                        </div>
                    ) : null}
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
