import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ElSelect from './ElSelect';
import { PUSH_SOURCE_RECIPIENT_POOL, PUSH_SOURCE_ROLE_FILTER_OPTIONS } from '../data/pushSources';
import '../product-create.css';
import '../device-group.css';
import '../push-source-config.css';

type PushSourceRecipientDrawerProps = {
    open: boolean;
    selectedUserIds: string[];
    onClose: () => void;
    onConfirm: (userIds: string[]) => void;
};

export default function PushSourceRecipientDrawer({
    open,
    selectedUserIds,
    onClose,
    onConfirm,
}: PushSourceRecipientDrawerProps) {
    const [roleFilter, setRoleFilter] = useState('');
    const [selectedIds, setSelectedIds] = useState<string[]>(selectedUserIds);
    const [leftChecked, setLeftChecked] = useState<string[]>([]);
    const [rightChecked, setRightChecked] = useState<string[]>([]);

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
        setSelectedIds(selectedUserIds);
        setRoleFilter('');
        setLeftChecked([]);
        setRightChecked([]);
    }, [open, selectedUserIds]);

    const availableUsers = useMemo(
        () => PUSH_SOURCE_RECIPIENT_POOL.filter((user) => !selectedIds.includes(user.id)),
        [selectedIds],
    );

    const selectedUsers = useMemo(
        () => PUSH_SOURCE_RECIPIENT_POOL.filter((user) => selectedIds.includes(user.id)),
        [selectedIds],
    );

    if (!open) return null;

    const toggleLeftCheck = (userId: string) => {
        setLeftChecked((prev) => (
            prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
        ));
    };

    const toggleRightCheck = (userId: string) => {
        setRightChecked((prev) => (
            prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
        ));
    };

    const moveToRight = () => {
        if (!leftChecked.length) return;
        setSelectedIds((prev) => Array.from(new Set([...prev, ...leftChecked])));
        setLeftChecked([]);
    };

    const moveToLeft = () => {
        if (!rightChecked.length) return;
        setSelectedIds((prev) => prev.filter((id) => !rightChecked.includes(id)));
        setRightChecked([]);
    };

    const handleMaskMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
        if (event.target === event.currentTarget) {
            onClose();
        }
    };

    return createPortal(
        <div className="pcp-drawer-mask psc-drawer-mask" role="presentation" onMouseDown={handleMaskMouseDown}>
            <aside
                className="pcp-drawer psc-recipient-drawer"
                role="dialog"
                aria-modal="true"
                aria-labelledby="psc-recipient-title"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <div className="pcp-drawer__head">
                    <h3 id="psc-recipient-title">接受人配置</h3>
                    <button type="button" className="pcp-drawer__close" onClick={onClose} aria-label="关闭">×</button>
                </div>

                <div className="pcp-drawer__body psc-recipient-body">
                    <div className="dg-transfer">
                        <div className="dg-transfer-panel">
                            <div className="dg-transfer-panel__head">
                                <span>选择用户</span>
                            </div>
                            <div className="dg-transfer-panel__filter">
                                <ElSelect
                                    className="el-select--medium"
                                    size="medium"
                                    value={roleFilter}
                                    options={PUSH_SOURCE_ROLE_FILTER_OPTIONS}
                                    placeholder="请选择用户角色"
                                    onChange={setRoleFilter}
                                />
                            </div>
                            <div className="dg-transfer-panel__list">
                                <ul className="dg-transfer-list">
                                    {availableUsers.map((user) => (
                                        <li key={user.id}>
                                            <label className="dg-transfer-item">
                                                <input
                                                    type="checkbox"
                                                    checked={leftChecked.includes(user.id)}
                                                    onChange={() => toggleLeftCheck(user.id)}
                                                />
                                                <span>{user.label}</span>
                                            </label>
                                        </li>
                                    ))}
                                    {!availableUsers.length && (
                                        <li className="dg-transfer-empty">暂无可选用户</li>
                                    )}
                                </ul>
                            </div>
                        </div>

                        <div className="dg-transfer-actions">
                            <button
                                type="button"
                                className="dg-transfer-actions__btn"
                                disabled={!leftChecked.length}
                                aria-label="添加到已选"
                                onClick={moveToRight}
                            >
                                <ChevronRight size={16} />
                            </button>
                            <button
                                type="button"
                                className="dg-transfer-actions__btn"
                                disabled={!rightChecked.length}
                                aria-label="移出已选"
                                onClick={moveToLeft}
                            >
                                <ChevronLeft size={16} />
                            </button>
                        </div>

                        <div className="dg-transfer-panel">
                            <div className="dg-transfer-panel__head">
                                <span>已选择用户</span>
                                <span className="dg-transfer-panel__count">{selectedUsers.length}人</span>
                            </div>
                            <div className="dg-transfer-panel__filter">
                                <ElSelect
                                    className="el-select--medium"
                                    size="medium"
                                    value={roleFilter}
                                    options={PUSH_SOURCE_ROLE_FILTER_OPTIONS}
                                    placeholder="请选择用户角色"
                                    onChange={setRoleFilter}
                                />
                            </div>
                            <div className="dg-transfer-panel__list">
                                <ul className="dg-transfer-list">
                                    {selectedUsers.map((user) => (
                                        <li key={user.id}>
                                            <label className="dg-transfer-item">
                                                <input
                                                    type="checkbox"
                                                    checked={rightChecked.includes(user.id)}
                                                    onChange={() => toggleRightCheck(user.id)}
                                                />
                                                <span>{user.label}</span>
                                            </label>
                                        </li>
                                    ))}
                                    {!selectedUsers.length && (
                                        <li className="dg-transfer-empty">暂无已选用户</li>
                                    )}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pcp-drawer__foot">
                    <button type="button" className="pm-btn pm-btn-ghost" onClick={onClose}>取消</button>
                    <button type="button" className="pm-btn pm-btn-primary" onClick={() => onConfirm(selectedIds)}>确定</button>
                </div>
            </aside>
        </div>,
        document.body,
    );
}
