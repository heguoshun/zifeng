import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import ElSelect from './ElSelect';
import ClearableInput from './ClearableInput';

export type DeviceGroupType = 'type' | 'area' | 'pipeline';

export type DeviceGroupDialogValue = {
    name: string;
    type: DeviceGroupType | '';
};

type DeviceGroupDialogProps = {
    open: boolean;
    typeOptions: { label: string; value: DeviceGroupType }[];
    onClose: () => void;
    onConfirm: (value: { name: string; type: DeviceGroupType }) => void;
};

const EMPTY_FORM: DeviceGroupDialogValue = {
    name: '',
    type: '',
};

export default function DeviceGroupDialog({
    open,
    typeOptions,
    onClose,
    onConfirm,
}: DeviceGroupDialogProps) {
    const [form, setForm] = useState<DeviceGroupDialogValue>(EMPTY_FORM);

    useEffect(() => {
        if (!open) return;
        setForm(EMPTY_FORM);
    }, [open]);

    if (!open) return null;

    const handleConfirm = () => {
        const name = form.name.trim();
        if (!name || !form.type) return;
        onConfirm({ name, type: form.type });
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
                aria-labelledby="dcp-group-dialog-title"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <div className="pcp-drawer__head">
                    <h3 id="dcp-group-dialog-title">新增分组</h3>
                    <button type="button" className="pcp-drawer__close" onClick={onClose} aria-label="关闭">×</button>
                </div>
                <div className="pcp-drawer__body pcp-drawer__body--form">
                    <label className="pcp-drawer-field">
                        <span className="pcp-form-label"><em>*</em>分组名称：</span>
                        <ClearableInput
                            type="text"
                            className="pcp-form-input"
                            placeholder="请输入标签名称"
                            value={form.name}
                            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                        />
                    </label>
                    <div className="pcp-drawer-field">
                        <span className="pcp-form-label"><em>*</em>所属类型：</span>
                        <ElSelect
                            className="el-select--medium pcp-form-select"
                            size="medium"
                            value={form.type}
                            options={[{ label: '请选择', value: '' }, ...typeOptions]}
                            onChange={(value) => setForm((prev) => ({
                                ...prev,
                                type: value as DeviceGroupType | '',
                            }))}
                        />
                    </div>
                </div>
                <div className="pcp-drawer__foot">
                    <button type="button" className="pm-btn pm-btn-ghost" onClick={onClose}>取消</button>
                    <button
                        type="button"
                        className="pm-btn pm-btn-primary"
                        disabled={!form.name.trim() || !form.type}
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
