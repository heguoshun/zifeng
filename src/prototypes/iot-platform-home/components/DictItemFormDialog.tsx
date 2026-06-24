import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { type DictItemRecord } from '../data/systemDictionaries';
import ClearableInput from './ClearableInput';
import '../product-create.css';
import '../dict-management.css';

export type DictItemFormValue = {
    name: string;
    dataValue: string;
    description: string;
    sort: number;
    enabled: boolean;
};

type DictItemFormDialogProps = {
    open: boolean;
    mode: 'add' | 'edit';
    initialValue?: DictItemRecord;
    onClose: () => void;
    onSubmit: (value: DictItemFormValue) => void;
};

const DEFAULT_SORT = 1;

const EMPTY_FORM: DictItemFormValue = {
    name: '',
    dataValue: '',
    description: '',
    sort: DEFAULT_SORT,
    enabled: true,
};

export default function DictItemFormDialog({
    open,
    mode,
    initialValue,
    onClose,
    onSubmit,
}: DictItemFormDialogProps) {
    const [name, setName] = useState('');
    const [dataValue, setDataValue] = useState('');
    const [description, setDescription] = useState('');
    const [sort, setSort] = useState(String(DEFAULT_SORT));
    const [enabled, setEnabled] = useState(true);
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
            setDataValue(initialValue.dataValue);
            setDescription(initialValue.description);
            setSort(String(initialValue.sort));
            setEnabled(initialValue.enabled);
        } else {
            setName(EMPTY_FORM.name);
            setDataValue(EMPTY_FORM.dataValue);
            setDescription(EMPTY_FORM.description);
            setSort(String(DEFAULT_SORT));
            setEnabled(EMPTY_FORM.enabled);
        }
        setTouched(false);
    }, [open, mode, initialValue]);

    if (!open) return null;

    const canSubmit = Boolean(name.trim() && dataValue.trim());
    const showNameError = touched && !name.trim();
    const showDataValueError = touched && !dataValue.trim();

    const handleConfirm = () => {
        setTouched(true);
        if (!canSubmit) return;
        const parsedSort = parseInt(sort, 10);
        onSubmit({
            name: name.trim(),
            dataValue: dataValue.trim(),
            description: description.trim(),
            sort: Number.isFinite(parsedSort) ? parsedSort : DEFAULT_SORT,
            enabled,
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
                className="pcp-drawer pcp-drawer--form dm-item-form-drawer"
                role="dialog"
                aria-modal="true"
                aria-labelledby="dm-item-form-title"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <div className="pcp-drawer__head">
                    <h3 id="dm-item-form-title">{mode === 'add' ? '新增字典项' : '编辑字典项'}</h3>
                    <button type="button" className="pcp-drawer__close" onClick={onClose} aria-label="关闭">×</button>
                </div>

                <div className="pcp-drawer__body pcp-drawer__body--form">
                    <label className="pcp-drawer-field">
                        <span className="pcp-form-label"><em>*</em>名称：</span>
                        <ClearableInput
                            type="text"
                            className="pcp-form-input"
                            placeholder="请输入名称"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                        />
                        {showNameError ? (
                            <p className="dm-form-error">请输入名称</p>
                        ) : null}
                    </label>

                    <label className="pcp-drawer-field">
                        <span className="pcp-form-label"><em>*</em>数据值：</span>
                        <ClearableInput
                            type="text"
                            className="pcp-form-input"
                            placeholder="请输入数据值"
                            value={dataValue}
                            onChange={(event) => setDataValue(event.target.value)}
                        />
                        {showDataValueError ? (
                            <p className="dm-form-error">请输入数据值</p>
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

                    <label className="pcp-drawer-field">
                        <span className="pcp-form-label">排序值：</span>
                        <input
                            type="number"
                            className="pcp-form-input"
                            value={sort}
                            min={1}
                            onChange={(event) => setSort(event.target.value)}
                            style={{ width: 80 }}
                        />
                        <p className="dm-sort-hint">值越小越靠前</p>
                    </label>

                    <div className="pcp-drawer-field">
                        <span className="pcp-form-label">是否启用：</span>
                        <div className="dm-toggle-field">
                            <button
                                type="button"
                                className={`dm-item-toggle ${enabled ? 'is-on' : ''}`}
                                onClick={() => setEnabled((prev) => !prev)}
                                aria-pressed={enabled}
                                aria-label={enabled ? '启用' : '禁用'}
                            />
                            <span className="dm-toggle-field-label">{enabled ? '启用' : '禁用'}</span>
                        </div>
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
