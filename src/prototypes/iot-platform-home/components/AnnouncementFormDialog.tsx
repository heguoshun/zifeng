import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import ElSelect from './ElSelect';
import RichTextEditor from './RichTextEditor';
import {
    ANNOUNCEMENT_STATUS_OPTIONS,
    ANNOUNCEMENT_TYPE_OPTIONS,
    type AnnouncementStatus,
    type AnnouncementType,
    type SystemAnnouncementRecord,
} from '../data/systemAnnouncements';
import '../product-create.css';
import '../notice-announcement.css';
import ClearableInput from './ClearableInput';

export type AnnouncementFormValue = {
    title: string;
    type: AnnouncementType | '';
    status: AnnouncementStatus;
    content: string;
};

type AnnouncementFormDialogProps = {
    open: boolean;
    mode: 'add' | 'edit';
    initialValue?: SystemAnnouncementRecord;
    onClose: () => void;
    onSubmit: (value: AnnouncementFormValue) => void;
};

const EMPTY_FORM: AnnouncementFormValue = {
    title: '',
    type: '',
    status: '正常',
    content: '',
};

const TYPE_OPTIONS = ANNOUNCEMENT_TYPE_OPTIONS
    .filter((item) => item !== '全部')
    .map((item) => ({ label: item, value: item }));

export function toAnnouncementFormValue(record: SystemAnnouncementRecord): AnnouncementFormValue {
    return {
        title: record.title,
        type: record.type,
        status: record.status,
        content: record.content,
    };
}

export default function AnnouncementFormDialog({
    open,
    mode,
    initialValue,
    onClose,
    onSubmit,
}: AnnouncementFormDialogProps) {
    const [form, setForm] = useState<AnnouncementFormValue>(EMPTY_FORM);
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
            setForm(toAnnouncementFormValue(initialValue));
        } else {
            setForm(EMPTY_FORM);
        }
        setTouched(false);
    }, [open, mode, initialValue]);

    if (!open) return null;

    const canSubmit = form.title.trim() !== '' && form.type !== '';
    const showTitleError = touched && !form.title.trim();
    const showTypeError = touched && !form.type;

    const handleConfirm = () => {
        setTouched(true);
        if (!canSubmit) return;
        onSubmit({
            title: form.title.trim(),
            type: form.type,
            status: form.status,
            content: form.content,
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
                className="pcp-drawer pcp-drawer--form na-form-drawer"
                role="dialog"
                aria-modal="true"
                aria-labelledby="na-form-drawer-title"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <div className="pcp-drawer__head">
                    <h3 id="na-form-drawer-title">
                        {mode === 'add' ? '新增公告' : '编辑公告'}
                    </h3>
                    <button type="button" className="pcp-drawer__close" onClick={onClose} aria-label="关闭">×</button>
                </div>

                <div className="pcp-drawer__body pcp-drawer__body--form">
                    <label className="pcp-drawer-field">
                        <span className="pcp-form-label"><em>*</em>公告标题：</span>
                        <ClearableInput
                            type="text"
                            className="pcp-form-input"
                            placeholder="请输入公告标题"
                            value={form.title}
                            onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                        />
                        {showTitleError ? (
                            <p className="na-form-error">请输入公告标题</p>
                        ) : null}
                    </label>

                    <div className="pcp-drawer-field">
                        <span className="pcp-form-label"><em>*</em>公告类型：</span>
                        <ElSelect
                            className="el-select--medium pcp-form-select"
                            size="medium"
                            value={form.type}
                            placeholder="请选择公告类型"
                            options={TYPE_OPTIONS}
                            onChange={(value) => setForm((prev) => ({ ...prev, type: value as AnnouncementType }))}
                        />
                        {showTypeError ? (
                            <p className="na-form-error">请选择公告类型</p>
                        ) : null}
                    </div>

                    <div className="pcp-drawer-field">
                        <span className="pcp-form-label">状态：</span>
                        <div className="na-radio-group">
                            {ANNOUNCEMENT_STATUS_OPTIONS.map((status) => (
                                <label key={status} className="na-radio">
                                    <input
                                        type="radio"
                                        className="na-radio__input"
                                        name="announcement-status"
                                        checked={form.status === status}
                                        onChange={() => setForm((prev) => ({ ...prev, status }))}
                                    />
                                    {status}
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="pcp-drawer-field na-form-content-field">
                        <span className="pcp-form-label">内容：</span>
                        <RichTextEditor
                            value={form.content}
                            onChange={(content) => setForm((prev) => ({ ...prev, content }))}
                            placeholder="请输入公告内容"
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
