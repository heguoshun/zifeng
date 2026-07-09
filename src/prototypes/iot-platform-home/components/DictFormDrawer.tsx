import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { type DictTypeRecord } from '../data/systemDictionaries';
import ClearableInput from './ClearableInput';
import '../product-create.css';
import '../dict-management.css';

export type DictFormValue = {
    name: string;
    code: string;
    description: string;
};

type DictFormDrawerProps = {
    open: boolean;
    mode: 'add' | 'edit';
    initialValue?: DictTypeRecord;
    onClose: () => void;
    onSubmit: (value: DictFormValue) => void;
};

const EMPTY_FORM: DictFormValue = {
    name: '',
    code: '',
    description: '',
};

export default function DictFormDrawer({
    open,
    mode,
    initialValue,
    onClose,
    onSubmit,
}: DictFormDrawerProps) {
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [description, setDescription] = useState('');
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
        if (mode === 'edit' && initialValue) {
            setName(initialValue.name);
            setCode(initialValue.code);
            setDescription(initialValue.description);
        } else {
            setName(EMPTY_FORM.name);
            setCode(EMPTY_FORM.code);
            setDescription(EMPTY_FORM.description);
        }
        setTouched(false);
    }, [open, mode, initialValue]);

    if (!open) return null;

    const canSubmit = Boolean(name.trim() && code.trim());
    const showNameError = touched && !name.trim();
    const showCodeError = touched && !code.trim();

    const handleConfirm = () => {
        setTouched(true);
        if (!canSubmit) return;
        onSubmit({
            name: name.trim(),
            code: code.trim(),
            description: description.trim(),
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
                className="pcp-drawer pcp-drawer--form dm-form-drawer"
                role="dialog"
                aria-modal="true"
                aria-labelledby="dm-form-drawer-title"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <div className="pcp-drawer__head">
                    <h3 id="dm-form-drawer-title">{mode === 'add' ? '添加字典' : '编辑字典'}</h3>
                    <button type="button" className="pcp-drawer__close" onClick={onClose} aria-label="关闭">×</button>
                </div>

                <div className="pcp-drawer__body pcp-drawer__body--form">
                    <label className="pcp-drawer-field">
                        <span className="pcp-form-label"><em>*</em>字典名称：</span>
                        <ClearableInput
                            type="text"
                            className="pcp-form-input"
                            placeholder="请输入字典名称"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                        />
                        {showNameError ? (
                            <p className="dm-form-error">请输入字典名称</p>
                        ) : null}
                    </label>

                    <label className="pcp-drawer-field">
                        <span className="pcp-form-label"><em>*</em>字典编号：</span>
                        <ClearableInput
                            type="text"
                            className="pcp-form-input"
                            placeholder="请输入字典编号"
                            value={code}
                            onChange={(event) => setCode(event.target.value)}
                            disabled={mode === 'edit'}
                        />
                        {showCodeError ? (
                            <p className="dm-form-error">请输入字典编号</p>
                        ) : null}
                    </label>

                    <label className="pcp-drawer-field">
                        <span className="pcp-form-label">描述：</span>
                        <ClearableInput
                            type="text"
                            className="pcp-form-input"
                            placeholder="请输入描述"
                            value={description}
                            onChange={(event) => setDescription(event.target.value)}
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
