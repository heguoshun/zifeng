import React from 'react';
import { Check } from 'lucide-react';
import {
    ALARM_RULE_CATEGORY_SCOPES,
    ALARM_RULE_SCOPE_LABELS,
    DATA_DOMAIN_APPLY_MODULES,
    type AlarmRuleCategoryScope,
} from '../data/systemRoles';

type RoleDataScopePanelProps = {
    selectedScopes: Set<AlarmRuleCategoryScope>;
    onChange: (scopes: Set<AlarmRuleCategoryScope>) => void;
    disabled?: boolean;
    disabledHint?: string;
};

export default function RoleDataScopePanel({
    selectedScopes,
    onChange,
    disabled = false,
    disabledHint,
}: RoleDataScopePanelProps) {
    const allSelected = ALARM_RULE_CATEGORY_SCOPES.every((scope) => selectedScopes.has(scope));
    const isAllScopeMode = selectedScopes.size === 0;

    const handleToggleScope = (scope: AlarmRuleCategoryScope) => {
        if (disabled || isAllScopeMode) return;
        const next = new Set(selectedScopes);
        if (next.has(scope)) {
            next.delete(scope);
        } else {
            next.add(scope);
        }
        onChange(next);
    };

    const handleSelectAllScopes = (checked: boolean) => {
        onChange(checked ? new Set(ALARM_RULE_CATEGORY_SCOPES) : new Set());
    };

    const handleUseAllScopes = () => {
        onChange(new Set());
    };

    const handleUseCustomScopes = () => {
        if (isAllScopeMode) {
            onChange(new Set(['large-meter']));
        }
    };

    return (
        <div className={`rm-data-scope-panel ${disabled ? 'is-disabled' : ''}`.trim()}>
            <div className="rm-data-scope-segment" role="radiogroup" aria-label="数据域范围">
                <button
                    type="button"
                    role="radio"
                    aria-checked={isAllScopeMode}
                    className={`rm-data-scope-segment__item ${isAllScopeMode ? 'is-active' : ''}`.trim()}
                    disabled={disabled}
                    onClick={handleUseAllScopes}
                >
                    全部数据域
                </button>
                <button
                    type="button"
                    role="radio"
                    aria-checked={!isAllScopeMode}
                    className={`rm-data-scope-segment__item ${!isAllScopeMode ? 'is-active' : ''}`.trim()}
                    disabled={disabled}
                    onClick={handleUseCustomScopes}
                >
                    指定数据域
                </button>
            </div>

            {disabled && disabledHint ? (
                <div className="rm-form-callout rm-form-callout--info">{disabledHint}</div>
            ) : (
                <p className="rm-form-hint rm-form-hint--inline">
                    例如大表管理员仅查看与操作大表相关设备、告警与工单；户表管理员仅对应户表分类数据
                </p>
            )}

            {!disabled && (
                <div className="rm-data-scope-apply-list">
                    <span className="rm-data-scope-apply-list__label">生效范围</span>
                    <div className="rm-data-scope-apply-list__tags">
                        {DATA_DOMAIN_APPLY_MODULES.map((item) => (
                            <span key={item} className="rm-data-scope-apply-tag">{item}</span>
                        ))}
                    </div>
                </div>
            )}

            {!disabled && !isAllScopeMode && (
                <>
                    <div className="rm-data-scope-toolbar">
                        <span className="rm-data-scope-toolbar__label">选择产品分类</span>
                        <label className="rm-data-scope-select-all">
                            <input
                                type="checkbox"
                                checked={allSelected}
                                onChange={(event) => handleSelectAllScopes(event.target.checked)}
                            />
                            <span>全选</span>
                        </label>
                    </div>
                    <div className="rm-data-scope-grid">
                        {ALARM_RULE_CATEGORY_SCOPES.map((scope) => {
                            const checked = selectedScopes.has(scope);
                            return (
                                <button
                                    key={scope}
                                    type="button"
                                    className={`rm-data-scope-card ${checked ? 'is-selected' : ''}`.trim()}
                                    onClick={() => handleToggleScope(scope)}
                                >
                                    <span className="rm-data-scope-card__check" aria-hidden="true">
                                        {checked ? <Check size={14} strokeWidth={2.5} /> : null}
                                    </span>
                                    <span className="rm-data-scope-card__label">
                                        {ALARM_RULE_SCOPE_LABELS[scope]}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </>
            )}

            {!disabled && isAllScopeMode && (
                <div className="rm-data-scope-all-preview">
                    <span>当前角色可访问全部产品分类下的业务数据（含设备、告警、工单等）</span>
                </div>
            )}
        </div>
    );
}
