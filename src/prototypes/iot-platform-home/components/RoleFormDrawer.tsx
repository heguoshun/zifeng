import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import ElSelect from './ElSelect';
import PermissionTreePanel from './PermissionTreePanel';
import { resolveRolePermissionIds, type SystemRoleRecord } from '../data/systemRoles';
import type { TenantRecord } from '../data/tenants';
import '../product-create.css';
import '../tenant-management.css';
import '../role-management.css';

export type RoleFormValue = {
    name: string;
    tenantId: string;
    permissionIds: string[];
};

type RoleFormDrawerProps = {
    open: boolean;
    mode: 'add' | 'edit';
    tenants: TenantRecord[];
    initialValue?: SystemRoleRecord;
    onClose: () => void;
    onSubmit: (value: RoleFormValue) => void;
};

const EMPTY_FORM: RoleFormValue = {
    name: '',
    tenantId: '',
    permissionIds: [],
};

export default function RoleFormDrawer({
    open,
    mode,
    tenants,
    initialValue,
    onClose,
    onSubmit,
}: RoleFormDrawerProps) {
    const [name, setName] = useState('');
    const [tenantId, setTenantId] = useState('');
    const [permissionIds, setPermissionIds] = useState<Set<string>>(new Set());
    const [touched, setTouched] = useState(false);

    const tenantOptions = useMemo(
        () => tenants.map((item) => ({ label: item.name, value: item.id })),
        [tenants],
    );

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
            setTenantId(initialValue.tenantId);
            setPermissionIds(new Set(resolveRolePermissionIds(initialValue)));
        } else {
            setName(EMPTY_FORM.name);
            setTenantId(EMPTY_FORM.tenantId);
            setPermissionIds(new Set());
        }
        setTouched(false);
    }, [open, mode, initialValue]);

    if (!open) return null;

    const canSubmit = Boolean(name.trim() && tenantId);
    const showTenantError = touched && !tenantId;
    const showNameError = touched && !name.trim();

    const handleConfirm = () => {
        setTouched(true);
        if (!canSubmit) return;
        onSubmit({
            name: name.trim(),
            tenantId,
            permissionIds: Array.from(permissionIds),
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
                className="pcp-drawer pcp-drawer--form rm-form-drawer rm-form-drawer--with-auth"
                role="dialog"
                aria-modal="true"
                aria-labelledby="rm-form-drawer-title"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <div className="pcp-drawer__head">
                    <h3 id="rm-form-drawer-title">{mode === 'add' ? '新建角色' : '编辑角色'}</h3>
                    <button type="button" className="pcp-drawer__close" onClick={onClose} aria-label="关闭">×</button>
                </div>

                <div className="pcp-drawer__body pcp-drawer__body--form">
                    <label className="pcp-drawer-field">
                        <span className="pcp-form-label"><em>*</em>所属租户：</span>
                        <ElSelect
                            className="el-select--medium"
                            size="medium"
                            value={tenantId}
                            placeholder="请选择租户"
                            options={tenantOptions}
                            onChange={setTenantId}
                        />
                        {showTenantError ? (
                            <p className="rm-form-error">请选择所属租户</p>
                        ) : null}
                    </label>

                    <label className="pcp-drawer-field">
                        <span className="pcp-form-label"><em>*</em>角色名称：</span>
                        <input
                            type="text"
                            className="pcp-form-input"
                            placeholder="请输入角色名称"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                        />
                        {showNameError ? (
                            <p className="rm-form-error">请输入角色名称</p>
                        ) : null}
                    </label>

                    {mode === 'edit' && initialValue ? (
                        <label className="pcp-drawer-field">
                            <span className="pcp-form-label">角色编号：</span>
                            <input
                                type="text"
                                className="pcp-form-input is-readonly"
                                value={initialValue.roleCode}
                                readOnly
                                disabled
                            />
                        </label>
                    ) : (
                        <p className="rm-form-hint">角色编号将由系统自动生成，无需手动填写</p>
                    )}

                    <div className="pcp-drawer-field rm-auth-field">
                        <span className="pcp-form-label">角色授权：</span>
                        <PermissionTreePanel
                            selectedIds={permissionIds}
                            onChange={setPermissionIds}
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
