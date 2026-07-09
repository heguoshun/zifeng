import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { ShieldCheck } from 'lucide-react';
import ElSelect from './ElSelect';
import PermissionTreePanel from './PermissionTreePanel';
import RoleDataScopePanel from './RoleDataScopePanel';
import {
    DATA_DOMAIN_APPLY_SCOPE_TEXT,
    resolveRolePermissionIds,
    type AlarmRuleCategoryScope,
    type SystemRoleRecord,
} from '../data/systemRoles';
import { getProductCategoryLabel } from '../data/productCategories';
import { flattenPermissionIds } from '../data/tenantMenus';
import type { TenantRecord } from '../data/tenants';
import '../product-create.css';
import '../tenant-management.css';
import '../role-management.css';
import ClearableInput from './ClearableInput';

export type RoleFormValue = {
    name: string;
    tenantId: string;
    permissionIds: string[];
    alarmRuleCategoryScopes: AlarmRuleCategoryScope[];
    remark?: string;
};

type RoleFormDrawerProps = {
    open: boolean;
    mode: 'add' | 'edit';
    tenants: TenantRecord[];
    initialValue?: SystemRoleRecord;
    onClose: () => void;
    onSubmit: (value: RoleFormValue) => void;
};

type AuthTab = 'menu' | 'scope';

const EMPTY_FORM: RoleFormValue = {
    name: '',
    tenantId: '',
    permissionIds: [],
    alarmRuleCategoryScopes: [],
    remark: '',
};

function formatScopeSummary(scopes: Set<AlarmRuleCategoryScope>): string {
    if (scopes.size === 0) return '全部数据域';
    return Array.from(scopes)
        .map((id) => getProductCategoryLabel(id))
        .join('、');
}

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
    const [alarmRuleCategoryScopes, setAlarmRuleCategoryScopes] = useState<Set<AlarmRuleCategoryScope>>(new Set());
    const [authTab, setAuthTab] = useState<AuthTab>('menu');
    const [touched, setTouched] = useState(false);
    const [remark, setRemark] = useState('');

    const allPermissionCount = useMemo(() => flattenPermissionIds().length, []);

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
            setAlarmRuleCategoryScopes(new Set(initialValue.alarmRuleCategoryScopes ?? []));
            setRemark(initialValue.remark || '');
        } else {
            setName(EMPTY_FORM.name);
            setTenantId(EMPTY_FORM.tenantId);
            setPermissionIds(new Set());
            setAlarmRuleCategoryScopes(new Set());
            setRemark(EMPTY_FORM.remark || '');
        }
        setAuthTab('menu');
        setTouched(false);
    }, [open, mode, initialValue]);

    const isTenantAdmin = Boolean(mode === 'edit' && initialValue?.isTenantAdmin);

    if (!open) return null;

    const canSubmit = Boolean(name.trim() && tenantId);
    const showTenantError = touched && !tenantId;
    const showNameError = touched && !name.trim();
    const selectedPermissionCount = permissionIds.size;
    const scopeSummary = formatScopeSummary(alarmRuleCategoryScopes);

    const handleConfirm = () => {
        setTouched(true);
        if (!canSubmit) return;
        onSubmit({
            name: name.trim(),
            tenantId,
            permissionIds: Array.from(permissionIds),
            alarmRuleCategoryScopes: isTenantAdmin ? [] : Array.from(alarmRuleCategoryScopes),
            remark: remark.trim() || undefined,
        });
    };

    const handleScopeChange = (scopes: Set<AlarmRuleCategoryScope>) => {
        setAlarmRuleCategoryScopes(scopes);
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
                <div className="pcp-drawer__head rm-form-drawer__head">
                    <div className="rm-form-drawer__title-wrap">
                        <div className="rm-form-drawer__title-icon" aria-hidden="true">
                            <ShieldCheck size={18} />
                        </div>
                        <div>
                            <h3 id="rm-form-drawer-title">{mode === 'add' ? '新建角色' : '编辑角色'}</h3>
                            <p className="rm-form-drawer__subtitle">
                                {mode === 'add'
                                    ? '填写基本信息，并配置菜单权限与数据域'
                                    : '修改角色信息与授权范围'}
                            </p>
                        </div>
                    </div>
                    <button type="button" className="pcp-drawer__close" onClick={onClose} aria-label="关闭">×</button>
                </div>

                <div className="pcp-drawer__body pcp-drawer__body--form rm-form-drawer__body">
                    <section className="rm-form-section rm-form-section--basic">
                        <div className="rm-form-section__head">
                            <h4>基本信息</h4>
                        </div>
                        <div className="rm-form-grid">
                            <div className="pcp-drawer-field">
                                <span className="pcp-form-label"><em>*</em>所属租户</span>
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
                            </div>

                            <label className="pcp-drawer-field">
                                <span className="pcp-form-label"><em>*</em>角色名称</span>
                                <ClearableInput
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
                        </div>

                        {mode === 'edit' && initialValue ? (
                            <label className="pcp-drawer-field rm-form-grid__full">
                                <span className="pcp-form-label">角色编号</span>
                                <input
                                    type="text"
                                    className="pcp-form-input is-readonly"
                                    value={initialValue.roleCode}
                                    readOnly
                                    disabled
                                />
                            </label>
                        ) : null}

                        <label className="pcp-drawer-field rm-form-grid__full" style={{ marginTop: '8px', boxSizing: 'border-box' }}>
                            <span className="pcp-form-label">角色说明：</span>
                            <div className="dai-textarea-wrap" style={{ width: '100%', boxSizing: 'border-box' }}>
                                <textarea
                                    className="pcp-form-textarea"
                                    style={{ width: '100%', boxSizing: 'border-box', maxWidth: '100%' }}
                                    placeholder="请输入角色说明"
                                    maxLength={200}
                                    rows={3}
                                    value={remark}
                                    onChange={(event) => setRemark(event.target.value)}
                                />
                                <span className="dai-textarea-counter">
                                    {remark.length}/200
                                </span>
                            </div>
                        </label>
                    </section>

                    <section className="rm-form-section rm-form-section--auth">
                        <div className="rm-form-section__head">
                            <h4>角色授权</h4>
                            <div className="rm-auth-tabs" role="tablist" aria-label="授权类型">
                                <button
                                    type="button"
                                    role="tab"
                                    className={`rm-auth-tab ${authTab === 'menu' ? 'is-active' : ''}`.trim()}
                                    aria-selected={authTab === 'menu'}
                                    onClick={() => setAuthTab('menu')}
                                >
                                    菜单权限
                                    <span className="rm-auth-tab__badge">{selectedPermissionCount}</span>
                                </button>
                                <button
                                    type="button"
                                    role="tab"
                                    className={`rm-auth-tab ${authTab === 'scope' ? 'is-active' : ''}`.trim()}
                                    aria-selected={authTab === 'scope'}
                                    onClick={() => setAuthTab('scope')}
                                >
                                    数据域
                                </button>
                            </div>
                        </div>

                        {authTab === 'menu' ? (
                            <div className="rm-auth-block" role="tabpanel">
                                <div className="rm-auth-block__intro">
                                    <strong>菜单权限</strong>
                                    <span>控制顶部导航与侧边栏可访问页面，以及页面内操作按钮</span>
                                </div>
                                <PermissionTreePanel
                                    selectedIds={permissionIds}
                                    onChange={setPermissionIds}
                                />
                            </div>
                        ) : (
                            <div className="rm-auth-block" role="tabpanel">
                                <div className="rm-auth-block__intro">
                                    <strong>数据域</strong>
                                    <span>
                                        按产品分类限制角色可见与可操作的业务数据范围，作用于
                                        {DATA_DOMAIN_APPLY_SCOPE_TEXT}
                                    </span>
                                </div>
                                <RoleDataScopePanel
                                    selectedIds={alarmRuleCategoryScopes}
                                    onChange={handleScopeChange}
                                    disabled={isTenantAdmin}
                                    disabledHint="企业管理员默认拥有全部数据域"
                                />
                            </div>
                        )}
                    </section>
                </div>

                <div className="pcp-drawer__foot rm-form-drawer__foot">
                    <div className="rm-form-drawer__summary">
                        <span>已选 <strong>{selectedPermissionCount}</strong> / {allPermissionCount} 项菜单权限</span>
                        <span className="rm-form-drawer__summary-divider" aria-hidden="true">·</span>
                        <span>数据域：<strong>{scopeSummary}</strong></span>
                    </div>
                    <div className="rm-form-drawer__actions">
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
                </div>
            </aside>
        </div>,
        document.body,
    );
}
