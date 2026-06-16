import React, { useEffect, useMemo, useState } from 'react';
import { Settings } from 'lucide-react';
import ElTreeSelect from './ElTreeSelect';
import {
    MENU_TYPE_OPTIONS,
    OPEN_TYPE_OPTIONS,
    buildMenuParentSelectTree,
    defaultMenuFormValue,
    type MenuFormValue,
    type SystemMenuOpenType,
    type SystemMenuRecord,
    type SystemMenuType,
} from '../data/systemMenus';
import '../menu-management.css';

type MenuFormDialogProps = {
    open: boolean;
    mode: 'add' | 'edit' | 'add-child';
    menus: SystemMenuRecord[];
    initialValue?: MenuFormValue;
    parentId?: string | null;
    onClose: () => void;
    onSubmit: (value: MenuFormValue) => void;
};

function BoolRadioGroup({
    value,
    onChange,
}: {
    value: boolean;
    onChange: (value: boolean) => void;
}) {
    return (
        <div className="mm-bool-radio">
            <label className="mm-bool-radio__item">
                <input type="radio" checked={value} onChange={() => onChange(true)} />
                <span>是</span>
            </label>
            <label className="mm-bool-radio__item">
                <input type="radio" checked={!value} onChange={() => onChange(false)} />
                <span>否</span>
            </label>
        </div>
    );
}

export default function MenuFormDialog({
    open,
    mode,
    menus,
    initialValue,
    parentId,
    onClose,
    onSubmit,
}: MenuFormDialogProps) {
    const [form, setForm] = useState<MenuFormValue>(defaultMenuFormValue());
    const [touched, setTouched] = useState(false);

    const parentTree = useMemo(() => buildMenuParentSelectTree(menus), [menus]);
    const title = mode === 'edit' ? '编辑' : '新增';

    useEffect(() => {
        if (!open) return;
        if (mode === 'edit' && initialValue) {
            setForm(initialValue);
        } else if (mode === 'add-child' && parentId) {
            setForm(defaultMenuFormValue(parentId));
        } else {
            setForm(defaultMenuFormValue());
        }
        setTouched(false);
    }, [open, mode, initialValue, parentId]);

    if (!open) return null;

    const isRootType = form.menuType === 'root';
    const showParent = form.menuType !== 'root';
    const canSubmit = Boolean(
        form.name.trim()
        && form.path.trim()
        && (form.menuType === 'button' || form.component.trim())
        && (!showParent || form.parentId),
    );

    const handleMenuTypeChange = (menuType: SystemMenuType) => {
        if (menuType === 'root') {
            setForm((prev) => ({
                ...prev,
                menuType,
                parentId: null,
                component: 'layouts/RouteView',
                alwaysShow: true,
            }));
            return;
        }
        setForm((prev) => ({
            ...prev,
            menuType,
            parentId: prev.parentId ?? parentId ?? menus.find((item) => item.parentId === null)?.id ?? null,
            alwaysShow: false,
            component: menuType === 'button' ? '' : prev.component,
        }));
    };

    const handleConfirm = () => {
        setTouched(true);
        if (!canSubmit) return;
        onSubmit({
            ...form,
            name: form.name.trim(),
            path: form.path.trim(),
            component: form.component.trim(),
            redirect: form.redirect?.trim() || '',
            icon: form.icon?.trim() || '',
            parentId: form.menuType === 'root' ? null : form.parentId,
        });
    };

    return (
        <div className="iot-dialog-mask" role="presentation" onClick={onClose}>
            <div
                className="iot-dialog mm-form-dialog"
                role="dialog"
                aria-modal="true"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="iot-dialog__head">
                    <h3>{title}</h3>
                    <button type="button" className="iot-dialog__close" onClick={onClose} aria-label="关闭">×</button>
                </div>
                <div className="iot-dialog__body mm-form-body">
                    <div className="mm-form-row">
                        <span className="mm-form-label">菜单类型：</span>
                        <div className="mm-form-control">
                            <div className="mm-type-radio">
                                {MENU_TYPE_OPTIONS.map((option) => (
                                    <label key={option.value} className="mm-type-radio__item">
                                        <input
                                            type="radio"
                                            checked={form.menuType === option.value}
                                            onChange={() => handleMenuTypeChange(option.value)}
                                            disabled={mode === 'edit' && option.value === 'root' && form.menuType !== 'root'}
                                        />
                                        <span>{option.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    {showParent ? (
                        <div className="mm-form-row">
                            <span className="mm-form-label"><em className="mm-required">*</em>上级菜单：</span>
                            <div className="mm-form-control">
                                <ElTreeSelect
                                    value={form.parentId ?? ''}
                                    tree={parentTree}
                                    placeholder="请选择上级菜单"
                                    onChange={(value) => setForm((prev) => ({ ...prev, parentId: value || null }))}
                                />
                                {touched && !form.parentId ? (
                                    <span className="mm-field-error">请选择上级菜单</span>
                                ) : null}
                            </div>
                        </div>
                    ) : null}

                    <div className="mm-form-row">
                        <span className="mm-form-label"><em className="mm-required">*</em>菜单名称：</span>
                        <div className="mm-form-control">
                            <input
                                type="text"
                                className="mm-form-input"
                                placeholder="请输入菜单名称"
                                value={form.name}
                                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                            />
                            {touched && !form.name.trim() ? (
                                <span className="mm-field-error">请输入菜单名称</span>
                            ) : null}
                        </div>
                    </div>

                    <div className="mm-form-row">
                        <span className="mm-form-label"><em className="mm-required">*</em>菜单路径：</span>
                        <div className="mm-form-control">
                            <input
                                type="text"
                                className="mm-form-input"
                                placeholder="请输入菜单路径"
                                value={form.path}
                                onChange={(event) => setForm((prev) => ({ ...prev, path: event.target.value }))}
                            />
                            {touched && !form.path.trim() ? (
                                <span className="mm-field-error">请输入菜单路径</span>
                            ) : null}
                        </div>
                    </div>

                    {form.menuType !== 'button' ? (
                        <div className="mm-form-row">
                            <span className="mm-form-label"><em className="mm-required">*</em>前端组件：</span>
                            <div className="mm-form-control">
                                <input
                                    type="text"
                                    className="mm-form-input"
                                    placeholder="请输入前端组件路径"
                                    value={form.component}
                                    onChange={(event) => setForm((prev) => ({ ...prev, component: event.target.value }))}
                                />
                                {touched && !form.component.trim() ? (
                                    <span className="mm-field-error">请输入前端组件</span>
                                ) : null}
                            </div>
                        </div>
                    ) : null}

                    <div className="mm-form-row">
                        <span className="mm-form-label">默认跳转地址：</span>
                        <div className="mm-form-control">
                            <input
                                type="text"
                                className="mm-form-input"
                                placeholder="请输入路由参数 redirect"
                                value={form.redirect ?? ''}
                                onChange={(event) => setForm((prev) => ({ ...prev, redirect: event.target.value }))}
                            />
                        </div>
                    </div>

                    <div className="mm-form-row">
                        <span className="mm-form-label">菜单图标：</span>
                        <div className="mm-form-control">
                            <div className="mm-icon-field">
                                <input
                                    type="text"
                                    className="mm-form-input"
                                    placeholder="点击选择图标"
                                    value={form.icon ?? ''}
                                    onChange={(event) => setForm((prev) => ({ ...prev, icon: event.target.value }))}
                                />
                                <button type="button" className="mm-icon-btn" aria-label="选择图标">
                                    <Settings size={14} />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="mm-form-row">
                        <span className="mm-form-label">排序：</span>
                        <div className="mm-form-control">
                            <input
                                type="number"
                                className="mm-form-input mm-form-input--sort"
                                min={1}
                                value={form.sort}
                                onChange={(event) => setForm((prev) => ({
                                    ...prev,
                                    sort: Number(event.target.value) || 1,
                                }))}
                            />
                        </div>
                    </div>

                    <div className="mm-form-row">
                        <span className="mm-form-label">是否路由菜单：</span>
                        <div className="mm-form-control">
                            <BoolRadioGroup
                                value={form.isRoute}
                                onChange={(value) => setForm((prev) => ({ ...prev, isRoute: value }))}
                            />
                        </div>
                    </div>

                    <div className="mm-form-row">
                        <span className="mm-form-label">隐藏路由：</span>
                        <div className="mm-form-control">
                            <BoolRadioGroup
                                value={form.hidden}
                                onChange={(value) => setForm((prev) => ({ ...prev, hidden: value }))}
                            />
                        </div>
                    </div>

                    <div className="mm-form-row">
                        <span className="mm-form-label">是否缓存路由：</span>
                        <div className="mm-form-control">
                            <BoolRadioGroup
                                value={form.keepAlive}
                                onChange={(value) => setForm((prev) => ({ ...prev, keepAlive: value }))}
                            />
                        </div>
                    </div>

                    {isRootType ? (
                        <div className="mm-form-row">
                            <span className="mm-form-label">聚合路由：</span>
                            <div className="mm-form-control">
                                <BoolRadioGroup
                                    value={form.alwaysShow}
                                    onChange={(value) => setForm((prev) => ({ ...prev, alwaysShow: value }))}
                                />
                            </div>
                        </div>
                    ) : null}

                    <div className="mm-form-row">
                        <span className="mm-form-label"><em className="mm-required">*</em>打开方式：</span>
                        <div className="mm-form-control">
                            <div className="mm-type-radio">
                                {OPEN_TYPE_OPTIONS.map((option) => (
                                    <label key={option.value} className="mm-type-radio__item">
                                        <input
                                            type="radio"
                                            checked={form.openType === option.value}
                                            onChange={() => setForm((prev) => ({
                                                ...prev,
                                                openType: option.value as SystemMenuOpenType,
                                            }))}
                                        />
                                        <span>{option.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="iot-dialog__foot">
                    <button type="button" className="pm-btn pm-btn-ghost" onClick={onClose}>取消</button>
                    <button type="button" className="pm-btn pm-btn-primary" onClick={handleConfirm}>确定</button>
                </div>
            </div>
        </div>
    );
}
