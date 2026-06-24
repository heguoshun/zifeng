import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import ElSelect from './ElSelect';
import ElTreeSelect from './ElTreeSelect';
import {
    TENANT_REGION_OPTIONS,
    TENANT_REMARK_MAX,
    buildTenantParentSelectTree,
    buildTenantTreeExpanded,
    generateTenantPassword,
    getTenantById,
    type TenantRecord,
} from '../data/tenants';
import '../product-create.css';
import '../device-create.css';
import '../tenant-management.css';
import ClearableInput from './ClearableInput';

export type TenantFormValue = {
    parentId: string;
    name: string;
    region: string;
    address: string;
    adminName: string;
    phone: string;
    password: string;
    remark: string;
};

type TenantFormDrawerProps = {
    open: boolean;
    mode: 'add' | 'edit';
    tenants: TenantRecord[];
    editingTenant?: TenantRecord | null;
    initialValue?: TenantFormValue;
    onClose: () => void;
    onSubmit: (value: TenantFormValue) => void;
};

const EMPTY_FORM: TenantFormValue = {
    parentId: '',
    name: '',
    region: '',
    address: '',
    adminName: '',
    phone: '',
    password: '',
    remark: '',
};

const REGION_OPTIONS = TENANT_REGION_OPTIONS.map((item) => ({
    label: item.label,
    value: item.value,
}));

export function toTenantFormValue(tenant: TenantRecord): TenantFormValue {
    return {
        parentId: tenant.parentId ?? '',
        name: tenant.name,
        region: tenant.region,
        address: tenant.address,
        adminName: tenant.adminName,
        phone: tenant.phone,
        password: '',
        remark: tenant.remark,
    };
}

export default function TenantFormDrawer({
    open,
    mode,
    tenants,
    editingTenant,
    initialValue,
    onClose,
    onSubmit,
}: TenantFormDrawerProps) {
    const [form, setForm] = useState<TenantFormValue>(EMPTY_FORM);
    const [touched, setTouched] = useState(false);

    const parentTree = useMemo(() => buildTenantParentSelectTree(tenants), [tenants]);
    const parentTreeExpanded = useMemo(() => buildTenantTreeExpanded(tenants), [tenants]);

    const isSecondaryTenant = mode === 'edit'
        ? Boolean(editingTenant?.parentId)
        : Boolean(form.parentId);

    const parentTenant = useMemo(() => {
        const parentId = mode === 'edit' ? editingTenant?.parentId : form.parentId;
        return parentId ? getTenantById(tenants, parentId) : undefined;
    }, [editingTenant?.parentId, form.parentId, mode, tenants]);

    const parentDisplayName = parentTenant?.name ?? '无（一级租户）';

    useEffect(() => {
        if (!open) return;
        if (mode === 'edit' && initialValue) {
            setForm({ ...initialValue });
            return;
        }
        setForm(EMPTY_FORM);
        setTouched(false);
    }, [open, mode, initialValue]);

    if (!open) return null;

    const requiresAdminFields = mode === 'add' && !isSecondaryTenant;

    const canSubmit = form.name.trim()
        && form.region
        && form.address.trim()
        && (!requiresAdminFields || (
            form.adminName.trim()
            && form.phone.trim()
            && form.password.trim()
        ));

    const showAdminNameError = touched && requiresAdminFields && !form.adminName.trim();
    const showPhoneError = touched && requiresAdminFields && !form.phone.trim();
    const showPasswordError = touched && requiresAdminFields && !form.password.trim();

    const handleParentChange = (parentId: string) => {
        const parent = parentId ? getTenantById(tenants, parentId) : undefined;
        setForm((prev) => ({
            ...prev,
            parentId,
            adminName: parent ? parent.adminName : '',
            phone: parent ? parent.phone : '',
            password: parent ? '' : prev.password,
        }));
    };

    const handleConfirm = () => {
        setTouched(true);
        if (!canSubmit) return;
        onSubmit({
            parentId: form.parentId,
            name: form.name.trim(),
            region: form.region,
            address: form.address.trim(),
            adminName: form.adminName.trim(),
            phone: form.phone.trim(),
            password: form.password.trim(),
            remark: form.remark.trim(),
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
                className="pcp-drawer pcp-drawer--form tm-form-drawer"
                role="dialog"
                aria-modal="true"
                aria-labelledby="tm-form-drawer-title"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <div className="pcp-drawer__head">
                    <h3 id="tm-form-drawer-title">{mode === 'add' ? '新增租户' : '编辑租户'}</h3>
                    <button type="button" className="pcp-drawer__close" onClick={onClose} aria-label="关闭">×</button>
                </div>

                <div className="pcp-drawer__body pcp-drawer__body--form">
                    <div className="pcp-drawer-field">
                        <span className="pcp-form-label"><em>*</em>上级租户：</span>
                        {mode === 'add' ? (
                            <ElTreeSelect
                                className="el-select--medium"
                                size="medium"
                                value={form.parentId}
                                tree={parentTree}
                                placeholder="请选择上级租户"
                                showAllOption={false}
                                showNoneOption
                                noneLabel="无（一级租户）"
                                defaultExpanded={parentTreeExpanded}
                                onChange={handleParentChange}
                            />
                        ) : (
                            <input
                                type="text"
                                className="pcp-form-input is-readonly"
                                value={parentDisplayName}
                                readOnly
                                disabled
                            />
                        )}
                    </div>
                    <label className="pcp-drawer-field">
                        <span className="pcp-form-label"><em>*</em>租户名称：</span>
                        <ClearableInput
                            type="text"
                            className="pcp-form-input"
                            placeholder="请输入租户名称"
                            value={form.name}
                            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                        />
                    </label>
                    <div className="pcp-drawer-field">
                        <span className="pcp-form-label"><em>*</em>所在地区：</span>
                        <ElSelect
                            className="el-select--medium"
                            size="medium"
                            value={form.region}
                            placeholder="请选择地区"
                            options={REGION_OPTIONS}
                            onChange={(value) => setForm((prev) => ({ ...prev, region: value }))}
                        />
                    </div>
                    <label className="pcp-drawer-field">
                        <span className="pcp-form-label"><em>*</em>详细地址：</span>
                        <ClearableInput
                            type="text"
                            className="pcp-form-input"
                            placeholder="请输入详细地址"
                            value={form.address}
                            onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))}
                        />
                    </label>
                    <label className="pcp-drawer-field">
                        <span className="pcp-form-label">
                            {isSecondaryTenant ? '管理员：' : <><em>*</em>管理员：</>}
                        </span>
                        <ClearableInput
                            type="text"
                            className={`pcp-form-input ${isSecondaryTenant ? 'is-readonly' : ''}`.trim()}
                            placeholder={isSecondaryTenant ? '继承上级租户管理员' : '请输入管理员名称'}
                            value={form.adminName}
                            readOnly={isSecondaryTenant}
                            disabled={isSecondaryTenant}
                            onChange={(event) => setForm((prev) => ({ ...prev, adminName: event.target.value }))}
                        />
                        {showAdminNameError ? (
                            <p className="tm-form-error">请输入管理员名称</p>
                        ) : null}
                    </label>
                    <label className="pcp-drawer-field">
                        <span className="pcp-form-label">
                            {isSecondaryTenant ? '手机号码：' : <><em>*</em>手机号码：</>}
                        </span>
                        <ClearableInput
                            type="text"
                            className={`pcp-form-input ${isSecondaryTenant ? 'is-readonly' : ''}`.trim()}
                            placeholder={isSecondaryTenant ? '继承上级租户管理员手机' : '请输入手机号码'}
                            value={form.phone}
                            readOnly={isSecondaryTenant}
                            disabled={isSecondaryTenant}
                            onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                        />
                        {showPhoneError ? (
                            <p className="tm-form-error">请输入手机号码</p>
                        ) : null}
                    </label>
                    {mode === 'add' && !isSecondaryTenant ? (
                        <label className="pcp-drawer-field">
                            <span className="pcp-form-label"><em>*</em>登录密码：</span>
                            <div className="tm-password-field">
                                <input
                                    type="text"
                                    className="pcp-form-input"
                                    placeholder="请点击随机生成"
                                    value={form.password}
                                    readOnly
                                />
                                <button
                                    type="button"
                                    className="pm-btn pm-btn-primary tm-password-generate"
                                    onClick={() => setForm((prev) => ({
                                        ...prev,
                                        password: generateTenantPassword(),
                                    }))}
                                >
                                    随机生成
                                </button>
                            </div>
                            {showPasswordError ? (
                                <p className="tm-form-error">请随机生成登录密码</p>
                            ) : null}
                        </label>
                    ) : null}
                    <label className="pcp-drawer-field">
                        <span className="pcp-form-label">租户备注：</span>
                        <div className="dai-textarea-wrap">
                            <textarea
                                className="pcp-form-textarea"
                                placeholder="请输入备注信息"
                                maxLength={TENANT_REMARK_MAX}
                                rows={4}
                                value={form.remark}
                                onChange={(event) => setForm((prev) => ({ ...prev, remark: event.target.value }))}
                            />
                            <span className="dai-textarea-counter">
                                {form.remark.length}/{TENANT_REMARK_MAX}
                            </span>
                        </div>
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
