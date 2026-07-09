import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { type SystemParamRecord } from '../data/systemParams';
import ClearableInput from './ClearableInput';
import '../product-create.css';
import '../param-management.css';

export type ParamFormValue = {
    name: string;
    key: string;
    value: string;
    isSystemBuiltIn: boolean;
    remark: string;
};

type ParamFormDrawerProps = {
    open: boolean;
    mode: 'add' | 'edit';
    initialValue?: SystemParamRecord;
    onClose: () => void;
    onSubmit: (value: ParamFormValue) => void;
};

const EMPTY_FORM: ParamFormValue = {
    name: '',
    key: '',
    value: '',
    isSystemBuiltIn: true,
    remark: '',
};

export default function ParamFormDrawer({
    open,
    mode,
    initialValue,
    onClose,
    onSubmit,
}: ParamFormDrawerProps) {
    const [name, setName] = useState('');
    const [key, setKey] = useState('');
    const [value, setValue] = useState('');
    const [isSystemBuiltIn, setIsSystemBuiltIn] = useState(true);
    const [remark, setRemark] = useState('');
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
            setKey(initialValue.key);
            setValue(initialValue.value);
            setIsSystemBuiltIn(initialValue.isSystemBuiltIn);
            setRemark(initialValue.remark);
        } else {
            setName(EMPTY_FORM.name);
            setKey(EMPTY_FORM.key);
            setValue(EMPTY_FORM.value);
            setIsSystemBuiltIn(EMPTY_FORM.isSystemBuiltIn);
            setRemark(EMPTY_FORM.remark);
        }
        setTouched(false);
    }, [open, mode, initialValue]);

    if (!open) return null;

    const canSubmit = Boolean(name.trim() && key.trim() && value.trim());
    const showNameError = touched && !name.trim();
    const showKeyError = touched && !key.trim();
    const showValueError = touched && !value.trim();

    const handleConfirm = () => {
        setTouched(true);
        if (!canSubmit) return;
        onSubmit({
            name: name.trim(),
            key: key.trim(),
            value: value.trim(),
            isSystemBuiltIn,
            remark: remark.trim(),
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
                className="pcp-drawer pcp-drawer--form sp-form-drawer"
                role="dialog"
                aria-modal="true"
                aria-labelledby="sp-form-drawer-title"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <div className="pcp-drawer__head">
                    <h3 id="sp-form-drawer-title">{mode === 'add' ? '新增' : '编辑'}</h3>
                    <button type="button" className="pcp-drawer__close" onClick={onClose} aria-label="关闭">×</button>
                </div>

                <div className="pcp-drawer__body pcp-drawer__body--form">
                    <label className="pcp-drawer-field">
                        <span className="pcp-form-label"><em>*</em>参数名称：</span>
                        <ClearableInput
                            type="text"
                            className="pcp-form-input"
                            placeholder="请输入参数名称"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                        />
                        {showNameError ? (
                            <p className="sp-form-error">请输入参数名称</p>
                        ) : null}
                    </label>

                    <label className="pcp-drawer-field">
                        <span className="pcp-form-label"><em>*</em>参数键名：</span>
                        <ClearableInput
                            type="text"
                            className="pcp-form-input"
                            placeholder="请输入参数键名"
                            value={key}
                            onChange={(event) => setKey(event.target.value)}
                            disabled={mode === 'edit'}
                        />
                        {showKeyError ? (
                            <p className="sp-form-error">请输入参数键名</p>
                        ) : null}
                    </label>

                    <label className="pcp-drawer-field">
                        <span className="pcp-form-label"><em>*</em>参数键值：</span>
                        <ClearableInput
                            type="text"
                            className="pcp-form-input"
                            placeholder="请输入参数键值"
                            value={value}
                            onChange={(event) => setValue(event.target.value)}
                        />
                        {showValueError ? (
                            <p className="sp-form-error">请输入参数键值</p>
                        ) : null}
                    </label>

                    <div className="pcp-drawer-field">
                        <span className="pcp-form-label">系统内置：</span>
                        <div className="sp-radio-group">
                            <label className="sp-radio">
                                <input
                                    type="radio"
                                    className="sp-radio__input"
                                    name="isSystemBuiltIn"
                                    checked={isSystemBuiltIn}
                                    onChange={() => setIsSystemBuiltIn(true)}
                                />
                                是
                            </label>
                            <label className="sp-radio">
                                <input
                                    type="radio"
                                    className="sp-radio__input"
                                    name="isSystemBuiltIn"
                                    checked={!isSystemBuiltIn}
                                    onChange={() => setIsSystemBuiltIn(false)}
                                />
                                否
                            </label>
                        </div>
                    </div>

                    <label className="pcp-drawer-field">
                        <span className="pcp-form-label">备注：</span>
                        <textarea
                            className="sp-textarea"
                            placeholder="请输入内容"
                            value={remark}
                            onChange={(event) => setRemark(event.target.value)}
                            rows={4}
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
