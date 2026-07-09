import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Trash2 } from 'lucide-react';
import {
    generateGroupTypeId,
    type DeviceGroupTypeItem,
} from '../data/deviceGroups';
import '../product-create.css';
import '../device-create.css';
import '../device-group.css';
import ClearableInput from './ClearableInput';

type EditableGroupType = DeviceGroupTypeItem & {
    isNew?: boolean;
};

type DeviceGroupTypeDialogProps = {
    open: boolean;
    groupTypes: DeviceGroupTypeItem[];
    onClose: () => void;
    onConfirm: (types: DeviceGroupTypeItem[]) => void;
};

function cloneTypes(types: DeviceGroupTypeItem[]): EditableGroupType[] {
    return types.map((item) => ({ ...item }));
}

export default function DeviceGroupTypeDialog({
    open,
    groupTypes,
    onClose,
    onConfirm,
}: DeviceGroupTypeDialogProps) {
    const [draftTypes, setDraftTypes] = useState<EditableGroupType[]>([]);

    useEffect(() => {
        if (!open) return;
        setDraftTypes([
            ...cloneTypes(groupTypes),
            {
                id: generateGroupTypeId(),
                label: '',
                tagPrefix: '',
                isNew: true,
            },
        ]);
    }, [open, groupTypes]);

    if (!open) return null;

    const handleAddType = () => {
        setDraftTypes((prev) => [
            ...prev,
            {
                id: generateGroupTypeId(),
                label: '',
                tagPrefix: '',
                isNew: true,
            },
        ]);
    };

    const handleRemoveType = (typeId: string) => {
        setDraftTypes((prev) => prev.filter((item) => item.id !== typeId));
    };

    const handleLabelChange = (typeId: string, label: string) => {
        setDraftTypes((prev) => prev.map((item) => {
            if (item.id !== typeId) return item;
            return {
                ...item,
                label,
                tagPrefix: item.isNew ? label : item.tagPrefix,
            };
        }));
    };

    const handleConfirm = () => {
        const normalized = draftTypes
            .map((item) => ({
                id: item.id,
                label: item.label.trim(),
                tagPrefix: item.tagPrefix.trim() || item.label.trim(),
            }))
            .filter((item) => item.label);

        if (!normalized.length) return;

        const labels = normalized.map((item) => item.label);
        if (new Set(labels).size !== labels.length) return;

        onConfirm(normalized);
    };

    const normalizedPreview = draftTypes
        .map((item) => item.label.trim())
        .filter(Boolean);
    const hasDuplicateLabel = new Set(normalizedPreview).size !== normalizedPreview.length;

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
                className="pcp-drawer pcp-drawer--form dcp-group-dialog dg-type-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="dg-type-dialog-title"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <div className="pcp-drawer__head">
                    <h3 id="dg-type-dialog-title">新增类型</h3>
                    <button type="button" className="pcp-drawer__close" onClick={onClose} aria-label="关闭">×</button>
                </div>
                <div className="pcp-drawer__body pcp-drawer__body--form dg-type-dialog__body">
                    {draftTypes.map((item) => (
                        <div className="dg-type-dialog__row" key={item.id}>
                            <label className="pcp-drawer-field dg-type-dialog__field">
                                <span className="pcp-form-label">
                                    类型名称
                                    <em>*</em>
                                </span>
                                <ClearableInput
                                    type="text"
                                    className="pcp-form-input"
                                    placeholder="请输入类型名称"
                                    value={item.label}
                                    onChange={(event) => handleLabelChange(item.id, event.target.value)}
                                />
                            </label>
                            {draftTypes.length > 1 && (
                                <button
                                    type="button"
                                    className="dg-type-dialog__remove"
                                    aria-label={`删除类型 ${item.label || ''}`}
                                    onClick={() => handleRemoveType(item.id)}
                                >
                                    <Trash2 size={14} />
                                </button>
                            )}
                        </div>
                    ))}
                    <button type="button" className="dg-type-dialog__add" onClick={handleAddType}>
                        <Plus size={14} />
                        添加类型
                    </button>
                </div>
                <div className="pcp-drawer__foot">
                    <button type="button" className="pm-btn pm-btn-ghost" onClick={onClose}>取消</button>
                    <button
                        type="button"
                        className="pm-btn pm-btn-primary"
                        disabled={!normalizedPreview.length || hasDuplicateLabel}
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
