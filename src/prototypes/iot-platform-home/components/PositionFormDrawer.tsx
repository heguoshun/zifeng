import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import ElSelect from './ElSelect';
import { SYSTEM_POSITION_STATUS_OPTIONS, type SystemPositionRecord, type SystemPositionStatus } from '../data/systemPositions';
import '../product-create.css';
import '../device-create.css';
import ClearableInput from './ClearableInput';

export type PositionFormValue = {
    positionCode: string;
    name: string;
    sort: string;
    status: SystemPositionStatus;
};

type PositionFormDrawerProps = {
    open: boolean;
    mode: 'add' | 'edit';
    initialValue?: SystemPositionRecord;
    onClose: () => void;
    onSubmit: (value: PositionFormValue) => void;
};

const EMPTY_FORM: PositionFormValue = {
    positionCode: '',
    name: '',
    sort: '',
    status: '正常',
};

const STATUS_OPTIONS = SYSTEM_POSITION_STATUS_OPTIONS
    .filter((s) => s !== '全部')
    .map((item) => ({ label: item, value: item }));

export function toPositionFormValue(position: SystemPositionRecord): PositionFormValue {
    return {
        positionCode: position.positionCode,
        name: position.name,
        sort: String(position.sort),
        status: position.status,
    };
}

export default function PositionFormDrawer({
    open,
    mode,
    initialValue,
    onClose,
    onSubmit,
}: PositionFormDrawerProps) {
    const [form, setForm] = useState<PositionFormValue>(EMPTY_FORM);

    useEffect(() => {
        if (!open) return;
        if (mode === 'edit' && initialValue) {
            setForm(toPositionFormValue(initialValue));
            return;
        }
        setForm(EMPTY_FORM);
    }, [open, mode, initialValue]);

    if (!open) return null;

    const canSubmit = form.name.trim() !== '' && form.positionCode.trim() !== '';

    const handleConfirm = () => {
        if (!canSubmit) return;
        onSubmit({
            positionCode: form.positionCode.trim(),
            name: form.name.trim(),
            sort: form.sort.trim(),
            status: form.status,
        });
    };

    const handleMaskMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
        if (event.target === event.currentTarget) {
            onClose();
        }
    };

    return createPortal(
        <div className="pcp-drawer-mask" role="presentation" onMouseDown={handleMaskMouseDown}>
            <aside
                className="pcp-drawer pcp-drawer--form"
                role="dialog"
                aria-modal="true"
                aria-labelledby="pos-form-drawer-title"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <div className="pcp-drawer__head">
                    <h3 id="pos-form-drawer-title">
                        {mode === 'add' ? '新增岗位' : '编辑岗位'}
                    </h3>
                    <button type="button" className="pcp-drawer__close" onClick={onClose} aria-label="关闭">×</button>
                </div>

                <div className="pcp-drawer__body pcp-drawer__body--form">
                    <label className="pcp-drawer-field">
                        <span className="pcp-form-label"><em>*</em>岗位编码：</span>
                        <ClearableInput
                            type="text"
                            className="pcp-form-input"
                            placeholder="请输入岗位编码"
                            value={form.positionCode}
                            onChange={(event) => setForm((prev) => ({ ...prev, positionCode: event.target.value }))}
                        />
                    </label>
                    <label className="pcp-drawer-field">
                        <span className="pcp-form-label"><em>*</em>岗位名称：</span>
                        <ClearableInput
                            type="text"
                            className="pcp-form-input"
                            placeholder="请输入岗位名称"
                            value={form.name}
                            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                        />
                    </label>
                    <label className="pcp-drawer-field">
                        <span className="pcp-form-label">岗位排序：</span>
                        <ClearableInput
                            type="number"
                            className="pcp-form-input"
                            placeholder="请输入排序号"
                            value={form.sort}
                            onChange={(event) => setForm((prev) => ({ ...prev, sort: event.target.value }))}
                        />
                    </label>
                    <div className="pcp-drawer-field">
                        <span className="pcp-form-label"><em>*</em>岗位状态：</span>
                        <ElSelect
                            className="el-select--medium"
                            size="medium"
                            value={form.status}
                            options={STATUS_OPTIONS}
                            onChange={(value) => setForm((prev) => ({ ...prev, status: value as SystemPositionStatus }))}
                        />
                    </div>
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
