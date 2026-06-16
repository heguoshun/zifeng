import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import ElSelect from './ElSelect';
import ElDatePicker from './ElDatePicker';
import SpaceImageUpload from './SpaceImageUpload';
import { DEFAULT_USER_AVATAR } from '../data/userAvatars';
import { getDepartmentsByTenant } from '../data/systemDepartments';
import { getRolesByTenant, type SystemRoleRecord } from '../data/systemRoles';
import {
    SYSTEM_USER_GENDER_OPTIONS,
    generateSystemUserPassword,
    type SystemUserGender,
    type SystemUserRecord,
} from '../data/systemUsers';
import type { TenantRecord } from '../data/tenants';
import '../product-create.css';
import '../device-create.css';
import '../tenant-management.css';
import '../user-management.css';

export type UserFormValue = {
    tenantId: string;
    displayName: string;
    account: string;
    password: string;
    phone: string;
    roleId: string;
    departmentId: string;
    avatar: string;
    gender: SystemUserGender;
    birthday: string;
    email: string;
};

type UserFormDrawerProps = {
    open: boolean;
    mode: 'add' | 'edit';
    tenants: TenantRecord[];
    roles: SystemRoleRecord[];
    initialValue?: UserFormValue;
    onClose: () => void;
    onSubmit: (value: UserFormValue) => void;
};

const EMPTY_FORM: UserFormValue = {
    tenantId: '',
    displayName: '',
    account: '',
    password: '',
    phone: '',
    roleId: '',
    departmentId: '',
    avatar: '',
    gender: '男',
    birthday: '',
    email: '',
};

const GENDER_OPTIONS = SYSTEM_USER_GENDER_OPTIONS.map((item) => ({
    label: item,
    value: item,
}));

export function toUserFormValue(user: SystemUserRecord): UserFormValue {
    return {
        tenantId: user.tenantId,
        displayName: user.displayName,
        account: user.account,
        password: '',
        phone: user.phone,
        roleId: user.roleId,
        departmentId: user.departmentId,
        avatar: user.avatar ?? '',
        gender: user.gender,
        birthday: user.birthday,
        email: user.email ?? '',
    };
}

export default function UserFormDrawer({
    open,
    mode,
    tenants,
    roles,
    initialValue,
    onClose,
    onSubmit,
}: UserFormDrawerProps) {
    const [form, setForm] = useState<UserFormValue>(EMPTY_FORM);

    const tenantOptions = useMemo(
        () => tenants.map((item) => ({ label: item.name, value: item.id })),
        [tenants],
    );

    const roleOptions = useMemo(() => {
        if (!form.tenantId) {
            return [{ label: '请先选择租户', value: '' }];
        }
        const tenantRoles = getRolesByTenant(roles, form.tenantId);
        if (!tenantRoles.length) {
            return [{ label: '该租户暂无角色', value: '' }];
        }
        return tenantRoles.map((item) => ({ label: item.name, value: item.id }));
    }, [form.tenantId, roles]);

    const departmentOptions = useMemo(
        () => getDepartmentsByTenant(form.tenantId).map((item) => ({ label: item.name, value: item.id })),
        [form.tenantId],
    );

    useEffect(() => {
        if (!open) return;
        if (mode === 'edit' && initialValue) {
            setForm({ ...initialValue });
            return;
        }
        setForm({
            ...EMPTY_FORM,
            avatar: DEFAULT_USER_AVATAR,
        });
    }, [open, mode, initialValue]);

    useEffect(() => {
        if (!open || mode === 'edit') return;
        if (!form.tenantId && tenantOptions.length) {
            setForm((prev) => ({ ...prev, tenantId: tenantOptions[0].value }));
        }
    }, [open, mode, form.tenantId, tenantOptions]);

    useEffect(() => {
        if (!open || !form.tenantId) return;
        const validRoleIds = new Set(getRolesByTenant(roles, form.tenantId).map((item) => item.id));
        if (form.roleId && !validRoleIds.has(form.roleId)) {
            setForm((prev) => ({ ...prev, roleId: '' }));
        }
    }, [open, form.tenantId, form.roleId, roles]);

    if (!open) return null;

    const canSubmit = form.tenantId
        && form.displayName.trim()
        && form.account.trim()
        && form.phone.trim()
        && form.roleId
        && form.departmentId
        && getRolesByTenant(roles, form.tenantId).some((item) => item.id === form.roleId)
        && (mode === 'edit' || form.password.trim());

    const handleConfirm = () => {
        if (!canSubmit) return;
        onSubmit({
            tenantId: form.tenantId,
            displayName: form.displayName.trim(),
            account: form.account.trim(),
            password: form.password.trim(),
            phone: form.phone.trim(),
            roleId: form.roleId,
            departmentId: form.departmentId,
            avatar: form.avatar,
            gender: form.gender,
            birthday: form.birthday,
            email: form.email.trim(),
        });
    };

    const handleMaskMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
        if (event.target === event.currentTarget) {
            onClose();
        }
    };

    const handleTenantChange = (tenantId: string) => {
        setForm((prev) => ({
            ...prev,
            tenantId,
            roleId: '',
            departmentId: '',
        }));
    };

    return createPortal(
        <div className="pcp-drawer-mask" role="presentation" onMouseDown={handleMaskMouseDown}>
            <aside
                className="pcp-drawer pcp-drawer--form um-form-drawer"
                role="dialog"
                aria-modal="true"
                aria-labelledby="um-form-drawer-title"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <div className="pcp-drawer__head">
                    <h3 id="um-form-drawer-title">{mode === 'add' ? '新增用户' : '编辑用户'}</h3>
                    <button type="button" className="pcp-drawer__close" onClick={onClose} aria-label="关闭">×</button>
                </div>

                <div className="pcp-drawer__body pcp-drawer__body--form">
                    <label className="pcp-drawer-field">
                        <span className="pcp-form-label"><em>*</em>所属租户：</span>
                        <ElSelect
                            className="el-select--medium"
                            size="medium"
                            value={form.tenantId}
                            placeholder="请选择租户"
                            options={tenantOptions}
                            onChange={handleTenantChange}
                        />
                    </label>
                    <label className="pcp-drawer-field">
                        <span className="pcp-form-label"><em>*</em>用户名称：</span>
                        <input
                            type="text"
                            className="pcp-form-input"
                            placeholder="请输入"
                            value={form.displayName}
                            onChange={(event) => setForm((prev) => ({ ...prev, displayName: event.target.value }))}
                        />
                    </label>
                    <label className="pcp-drawer-field">
                        <span className="pcp-form-label"><em>*</em>用户账号：</span>
                        <input
                            type="text"
                            className="pcp-form-input"
                            placeholder="请输入字母、数字"
                            value={form.account}
                            onChange={(event) => setForm((prev) => ({ ...prev, account: event.target.value }))}
                        />
                    </label>
                    {mode === 'add' ? (
                        <label className="pcp-drawer-field">
                            <span className="pcp-form-label"><em>*</em>登录密码：</span>
                            <div className="tm-password-field">
                                <input
                                    type="text"
                                    className="pcp-form-input"
                                    placeholder="请随机生成"
                                    value={form.password}
                                    readOnly
                                />
                                <button
                                    type="button"
                                    className="pm-btn pm-btn-primary tm-password-generate"
                                    onClick={() => setForm((prev) => ({
                                        ...prev,
                                        password: generateSystemUserPassword(),
                                    }))}
                                >
                                    随机生成
                                </button>
                            </div>
                        </label>
                    ) : null}
                    <label className="pcp-drawer-field">
                        <span className="pcp-form-label"><em>*</em>手机号码：</span>
                        <input
                            type="text"
                            className="pcp-form-input"
                            placeholder="请输入手机号码"
                            value={form.phone}
                            onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                        />
                    </label>
                    <label className="pcp-drawer-field">
                        <span className="pcp-form-label"><em>*</em>所属角色：</span>
                        <ElSelect
                            className="el-select--medium"
                            size="medium"
                            value={form.roleId}
                            placeholder={
                                !form.tenantId
                                    ? '请先选择租户'
                                    : roleOptions.length ? '请选择' : '该租户暂无角色'
                            }
                            options={roleOptions}
                            disabled={!form.tenantId || !getRolesByTenant(roles, form.tenantId).length}
                            onChange={(value) => setForm((prev) => ({ ...prev, roleId: value }))}
                        />
                    </label>
                    <label className="pcp-drawer-field">
                        <span className="pcp-form-label"><em>*</em>所属部门：</span>
                        <ElSelect
                            className="el-select--medium"
                            size="medium"
                            value={form.departmentId}
                            placeholder={form.tenantId ? '请选择' : '请先选择租户'}
                            options={departmentOptions}
                            disabled={!form.tenantId}
                            onChange={(value) => setForm((prev) => ({ ...prev, departmentId: value }))}
                        />
                    </label>
                    <div className="pcp-drawer-field">
                        <span className="pcp-form-label">头像：</span>
                        <SpaceImageUpload
                            value={form.avatar}
                            onChange={(avatar) => setForm((prev) => ({ ...prev, avatar }))}
                        />
                    </div>
                    <label className="pcp-drawer-field">
                        <span className="pcp-form-label">性别：</span>
                        <ElSelect
                            className="el-select--medium"
                            size="medium"
                            value={form.gender}
                            options={GENDER_OPTIONS}
                            onChange={(value) => setForm((prev) => ({
                                ...prev,
                                gender: value as SystemUserGender,
                            }))}
                        />
                    </label>
                    <label className="pcp-drawer-field">
                        <span className="pcp-form-label">生日：</span>
                        <ElDatePicker
                            className="el-select--medium"
                            size="medium"
                            value={form.birthday}
                            placeholder="请选择日期"
                            onChange={(value) => setForm((prev) => ({ ...prev, birthday: value }))}
                        />
                    </label>
                    <label className="pcp-drawer-field">
                        <span className="pcp-form-label">邮箱：</span>
                        <input
                            type="email"
                            className="pcp-form-input"
                            placeholder="请输入邮箱"
                            value={form.email}
                            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
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
