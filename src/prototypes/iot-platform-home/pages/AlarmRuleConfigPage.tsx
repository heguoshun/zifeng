import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, Trash2 } from 'lucide-react';
import AppShell from '../components/AppShell';
import MessageCenterSidebar, { type MessageCenterPageId } from '../components/MessageCenterSidebar';
import ElSelect from '../components/ElSelect';
import ElMultiSelect from '../components/ElMultiSelect';
import ListPagination from '../components/ListPagination';
import AlarmRuleCategoryTree from '../components/AlarmRuleCategoryTree';
import AlarmRuleCategoryDialog, { type AlarmRuleCategoryFormValue } from '../components/AlarmRuleCategoryDialog';
import AlarmRuleFormDrawer, { type AlarmRuleFormValue } from '../components/AlarmRuleFormDrawer';
import { ConfirmDialog } from '../components/IotDialogs';
import IotToast, { type IotToastData, type IotToastType, triggerIotToast } from '../components/IotToast';
import { paginateItems } from '../utils/listPagination';
import {
    ALARM_RULE_STATUS_OPTIONS,
    ALARM_RULE_TRIGGER_FILTER_OPTIONS,
    buildCategoryOptions,
    formatAlarmRuleNow,
    generateAlarmRuleCategoryId,
    generateAlarmRuleId,
    categoryContainsAlarmRules,
    getCategoryDescendantIds,
    getCategoryInvalidParentIds,
    isDuplicateCategoryName,
    CATEGORY_DELETE_BLOCKED_BY_RULES,
    formatTriggerMethods,
    ruleMatchesTriggerFilter,
    truncateRuleDescription,
    createDefaultAlarmRuleConditionSettings,
    createDefaultAlarmRuleSqlSettings,
    syncAlarmRuleConditionSettings,
    syncAlarmRuleSqlSettings,
    isAlarmRuleConditionSettingsValid,
    isAlarmRuleSqlSettingsValid,
    type AlarmRuleCategory,
    type AlarmRuleRecord,
} from '../data/alarmRules';
import type { AlarmTriggerMethod } from '../data/deviceAlarms';
import type { AlarmLevelRecord } from '../data/alarmLevels';
import type { DeviceRecord } from '../data/devices';
import type { ProductRecord } from '../data/products';
import '../device-access.css';
import '../product-management.css';
import '../alarm-rule-config.css';

const STATUS_OPTIONS = ALARM_RULE_STATUS_OPTIONS.map((item) => ({ label: item, value: item }));
const TRIGGER_FILTER_OPTIONS = ALARM_RULE_TRIGGER_FILTER_OPTIONS
    .filter((item) => item !== '全部')
    .map((item) => ({ label: item, value: item }));

type FilterState = {
    status: string;
    triggerMethods: AlarmTriggerMethod[];
    keyword: string;
};

const DEFAULT_FILTERS: FilterState = {
    status: '全部',
    triggerMethods: [],
    keyword: '',
};

type ContextMenuState = {
    categoryId: string;
    x: number;
    y: number;
} | null;

type DrawerMode = 'add' | 'edit' | null;

type AlarmRuleConfigPageProps = {
    categories: AlarmRuleCategory[];
    rules: AlarmRuleRecord[];
    products: ProductRecord[];
    devices: DeviceRecord[];
    alarmLevels: AlarmLevelRecord[];
    onUpdateCategories: React.Dispatch<React.SetStateAction<AlarmRuleCategory[]>>;
    onUpdateRules: React.Dispatch<React.SetStateAction<AlarmRuleRecord[]>>;
    onNavigateHome: () => void;
    onNavigateDeviceAccess: () => void;
    onNavigate: (pageId: MessageCenterPageId) => void;
};

export default function AlarmRuleConfigPage({
    categories,
    rules,
    products,
    devices,
    alarmLevels,
    onUpdateCategories,
    onUpdateRules,
    onNavigateHome,
    onNavigateDeviceAccess,
    onNavigate,
}: AlarmRuleConfigPageProps) {
    const [activeCategoryId, setActiveCategoryId] = useState('all');
    const [expanded, setExpanded] = useState<Record<string, boolean>>({
        'cat-pressure': true,
        'cat-meter': true,
        'cat-water': true,
    });
    const [contextMenu, setContextMenu] = useState<ContextMenuState>(null);
    const [categoryDialogMode, setCategoryDialogMode] = useState<'add' | 'edit' | null>(null);
    const [editingCategory, setEditingCategory] = useState<AlarmRuleCategory | null>(null);
    const [deleteCategoryTarget, setDeleteCategoryTarget] = useState<AlarmRuleCategory | null>(null);

    const [draftFilters, setDraftFilters] = useState<FilterState>(DEFAULT_FILTERS);
    const [appliedFilters, setAppliedFilters] = useState<FilterState>(DEFAULT_FILTERS);
    const [selectedRuleIds, setSelectedRuleIds] = useState<string[]>([]);
    const [pageSize, setPageSize] = useState('10');
    const [currentPage, setCurrentPage] = useState(1);
    const [jumpPage, setJumpPage] = useState('1');

    const [ruleDrawerMode, setRuleDrawerMode] = useState<DrawerMode>(null);
    const [editingRule, setEditingRule] = useState<AlarmRuleRecord | null>(null);
    const [deleteRuleTarget, setDeleteRuleTarget] = useState<AlarmRuleRecord | null>(null);
    const [batchDeleteOpen, setBatchDeleteOpen] = useState(false);

    const [toast, setToast] = useState<IotToastData | null>(null);
    const contextMenuRef = useRef<HTMLDivElement>(null);

    const showToast = (message: string, type: IotToastType = 'success') => {
        triggerIotToast(setToast, message, type);
    };

    const categoryOptions = useMemo(() => buildCategoryOptions(categories), [categories]);

    const alarmLevelKey = useMemo(
        () => alarmLevels.map((level) => level.id).join(','),
        [alarmLevels],
    );

    useEffect(() => {
        onUpdateRules((prev) => prev.map((rule) => {
            if (!rule.conditionSettings) return rule;
            return {
                ...rule,
                conditionSettings: syncAlarmRuleConditionSettings(rule.conditionSettings, alarmLevels),
            };
        }));
    }, [alarmLevelKey, alarmLevels, onUpdateRules]);

    const filteredRules = useMemo(() => rules.filter((rule) => {
        const matchCategory = activeCategoryId === 'all'
            || getCategoryDescendantIds(categories, activeCategoryId).includes(rule.categoryId);
        const matchStatus = appliedFilters.status === '全部'
            || (appliedFilters.status === '启用' ? rule.enabled : !rule.enabled);
        const matchTrigger = ruleMatchesTriggerFilter(rule, appliedFilters.triggerMethods);
        const keyword = appliedFilters.keyword.trim();
        const matchKeyword = !keyword || rule.name.includes(keyword);
        return matchCategory && matchStatus && matchTrigger && matchKeyword;
    }), [activeCategoryId, appliedFilters, categories, rules]);

    const pagination = useMemo(
        () => paginateItems(filteredRules, currentPage, Number(pageSize)),
        [currentPage, filteredRules, pageSize],
    );

    useEffect(() => {
        setCurrentPage(1);
        setJumpPage('1');
    }, [activeCategoryId, appliedFilters, pageSize]);

    useEffect(() => {
        setJumpPage(String(pagination.currentPage));
    }, [pagination.currentPage]);

    useEffect(() => {
        if (!contextMenu) return undefined;

        const handleClickOutside = (event: MouseEvent) => {
            if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
                setContextMenu(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [contextMenu]);

    const pageRuleIds = pagination.items.map((item) => item.id);
    const allPageSelected = pageRuleIds.length > 0
        && pageRuleIds.every((id) => selectedRuleIds.includes(id));

    const toggleSelectAll = () => {
        if (allPageSelected) {
            setSelectedRuleIds((prev) => prev.filter((id) => !pageRuleIds.includes(id)));
            return;
        }
        setSelectedRuleIds((prev) => Array.from(new Set([...prev, ...pageRuleIds])));
    };

    const toggleSelectRule = (ruleId: string) => {
        setSelectedRuleIds((prev) => (
            prev.includes(ruleId)
                ? prev.filter((id) => id !== ruleId)
                : [...prev, ruleId]
        ));
    };

    const handleSearch = () => {
        setAppliedFilters({
            ...draftFilters,
            keyword: draftFilters.keyword.trim(),
        });
    };

    const handleReset = () => {
        setDraftFilters(DEFAULT_FILTERS);
        setAppliedFilters(DEFAULT_FILTERS);
    };

    const categoryParentOptions = useMemo(() => {
        if (!editingCategory) return categoryOptions;

        const invalidIds = new Set(getCategoryInvalidParentIds(categories, editingCategory.id));
        return categoryOptions.filter((item) => !invalidIds.has(item.value));
    }, [categories, categoryOptions, editingCategory]);

    const addCategoryInitialValue = useMemo<AlarmRuleCategoryFormValue | undefined>(() => {
        if (categoryDialogMode !== 'add') return undefined;
        return {
            name: '',
            parentId: activeCategoryId !== 'all' ? activeCategoryId : '',
        };
    }, [activeCategoryId, categoryDialogMode]);

    const openAddCategory = () => {
        setContextMenu(null);
        setEditingCategory(null);
        setCategoryDialogMode('add');
    };

    const openEditCategory = (category: AlarmRuleCategory) => {
        setContextMenu(null);
        setEditingCategory(category);
        setCategoryDialogMode('edit');
    };

    const openDeleteCategory = (category: AlarmRuleCategory) => {
        setContextMenu(null);

        if (categoryContainsAlarmRules(categories, rules, category.id)) {
            showToast(CATEGORY_DELETE_BLOCKED_BY_RULES, 'warning');
            return;
        }

        setDeleteCategoryTarget(category);
    };

    const handleCategoryConfirm = (value: AlarmRuleCategoryFormValue) => {
        const name = value.name.trim();
        if (!name) {
            showToast('请输入分类名称', 'warning');
            return;
        }

        const parentId = value.parentId || null;

        if (categoryDialogMode === 'edit' && editingCategory) {
            const invalidParents = new Set(getCategoryInvalidParentIds(categories, editingCategory.id));
            if (parentId && invalidParents.has(parentId)) {
                showToast('不能选择自身或子分类作为上级', 'warning');
                return;
            }

            if (isDuplicateCategoryName(categories, name, editingCategory.id)) {
                showToast('分类名称已存在', 'warning');
                return;
            }

            onUpdateCategories((prev) => prev.map((item) => (
                item.id === editingCategory.id
                    ? { ...item, name, parentId }
                    : item
            )));

            if (parentId) {
                setExpanded((prev) => ({ ...prev, [parentId]: true }));
            }

            showToast('分类已更新');
        } else {
            if (isDuplicateCategoryName(categories, name)) {
                showToast('分类名称已存在', 'warning');
                return;
            }

            const id = generateAlarmRuleCategoryId();
            onUpdateCategories((prev) => [...prev, {
                id,
                name,
                parentId,
            }]);

            if (parentId) {
                setExpanded((prev) => ({ ...prev, [parentId]: true }));
            }

            showToast('分类已新增');
        }

        setCategoryDialogMode(null);
        setEditingCategory(null);
    };

    const handleDeleteCategory = () => {
        if (!deleteCategoryTarget) return;

        const hasChildren = categories.some((item) => item.parentId === deleteCategoryTarget.id);
        if (hasChildren) {
            showToast('请先删除子分类', 'warning');
            setDeleteCategoryTarget(null);
            return;
        }

        if (categoryContainsAlarmRules(categories, rules, deleteCategoryTarget.id)) {
            showToast(CATEGORY_DELETE_BLOCKED_BY_RULES, 'warning');
            setDeleteCategoryTarget(null);
            return;
        }

        onUpdateCategories((prev) => prev.filter((item) => item.id !== deleteCategoryTarget.id));

        if (activeCategoryId === deleteCategoryTarget.id
            || getCategoryDescendantIds(categories, deleteCategoryTarget.id).includes(activeCategoryId)) {
            setActiveCategoryId('all');
        }

        showToast('分类已删除');
        setDeleteCategoryTarget(null);
    };

    const openAddRuleDrawer = () => {
        setEditingRule(null);
        setRuleDrawerMode('add');
    };

    const openEditRuleDrawer = (rule: AlarmRuleRecord) => {
        setEditingRule(rule);
        setRuleDrawerMode('edit');
    };

    const closeRuleDrawer = () => {
        setRuleDrawerMode(null);
        setEditingRule(null);
    };

    const handleRuleSubmit = (value: AlarmRuleFormValue) => {
        const name = value.name.trim();
        if (!name || !value.categoryId || !value.editMode || !value.triggerMethods.length) {
            showToast('请完善必填信息', 'warning');
            return;
        }

        if (value.createWorkOrder && !value.workOrderAssignees.length) {
            showToast('请选择工单指派人', 'warning');
            return;
        }

        if (value.editMode === '触发条件设置' && !isAlarmRuleConditionSettingsValid(
            value.conditionSettings,
            alarmLevels,
            value.triggerMethods,
        )) {
            showToast('请完善条件配置', 'warning');
            return;
        }

        if (value.editMode === 'SQL语句编辑' && !isAlarmRuleSqlSettingsValid(
            value.sqlSettings,
            alarmLevels,
        )) {
            showToast('请完善 SQL 语句', 'warning');
            return;
        }

        if (ruleDrawerMode === 'edit' && editingRule) {
            onUpdateRules((prev) => prev.map((item) => (
                item.id === editingRule.id
                    ? {
                        ...item,
                        name,
                        categoryId: value.categoryId,
                        description: value.description,
                        editMode: value.editMode,
                        triggerMethods: value.triggerMethods,
                        notifyAlarm: value.notifyAlarm,
                        createWorkOrder: value.createWorkOrder,
                        workOrderAssignees: value.createWorkOrder ? value.workOrderAssignees : [],
                        conditionSettings: value.editMode === '触发条件设置'
                            ? value.conditionSettings
                            : undefined,
                        sqlSettings: value.editMode === 'SQL语句编辑'
                            ? value.sqlSettings
                            : undefined,
                    }
                    : item
            )));
            showToast('规则已更新');
        } else {
            onUpdateRules((prev) => [...prev, {
                id: generateAlarmRuleId(),
                categoryId: value.categoryId,
                name,
                description: value.description,
                editMode: value.editMode,
                triggerMethods: value.triggerMethods.slice(0, 1),
                notifyAlarm: value.notifyAlarm,
                createWorkOrder: value.createWorkOrder,
                workOrderAssignees: value.createWorkOrder ? value.workOrderAssignees : [],
                conditionSettings: value.editMode === '触发条件设置'
                    ? value.conditionSettings
                    : undefined,
                sqlSettings: value.editMode === 'SQL语句编辑'
                    ? value.sqlSettings
                    : undefined,
                enabled: true,
                createdAt: formatAlarmRuleNow(),
            }]);
            showToast('规则已新增');
        }

        closeRuleDrawer();
    };

    const handleDeleteRule = () => {
        if (!deleteRuleTarget) return;
        onUpdateRules((prev) => prev.filter((item) => item.id !== deleteRuleTarget.id));
        setSelectedRuleIds((prev) => prev.filter((id) => id !== deleteRuleTarget.id));
        showToast('规则已删除');
        setDeleteRuleTarget(null);
    };

    const handleBatchDelete = () => {
        if (!selectedRuleIds.length) return;
        onUpdateRules((prev) => prev.filter((item) => !selectedRuleIds.includes(item.id)));
        showToast(`已删除 ${selectedRuleIds.length} 条规则`);
        setSelectedRuleIds([]);
        setBatchDeleteOpen(false);
    };

    const toggleRuleEnabled = (ruleId: string, enabled: boolean) => {
        onUpdateRules((prev) => prev.map((item) => (
            item.id === ruleId ? { ...item, enabled } : item
        )));
        showToast(enabled ? '规则已启用' : '规则已禁用', 'success');
    };

    const sidebar = <MessageCenterSidebar pageId="alarm-rule-config" onNavigate={onNavigate} />;

    const editingCategoryForm: AlarmRuleCategoryFormValue | undefined = editingCategory
        ? { name: editingCategory.name, parentId: editingCategory.parentId ?? '' }
        : undefined;

    const editingRuleForm: AlarmRuleFormValue | undefined = editingRule
        ? {
            name: editingRule.name,
            categoryId: editingRule.categoryId,
            description: editingRule.description,
            editMode: editingRule.editMode ?? '触发条件设置',
            triggerMethods: editingRule.triggerMethods,
            notifyAlarm: editingRule.notifyAlarm ?? true,
            createWorkOrder: editingRule.createWorkOrder ?? false,
            workOrderAssignees: editingRule.workOrderAssignees ?? [],
            conditionSettings: editingRule.conditionSettings
                ? syncAlarmRuleConditionSettings(editingRule.conditionSettings, alarmLevels)
                : createDefaultAlarmRuleConditionSettings(alarmLevels),
            sqlSettings: editingRule.sqlSettings
                ? syncAlarmRuleSqlSettings(editingRule.sqlSettings, alarmLevels)
                : createDefaultAlarmRuleSqlSettings(alarmLevels),
        }
        : undefined;

    return (
        <AppShell
            activeTopTab="消息中心"
            sidebar={sidebar}
            onTopTabChange={(tab) => {
                if (tab === '设备接入') onNavigateDeviceAccess();
            }}
        >
            <div className="arc-page">
                <div className="crumb">消息中心 / 告警消息 / 告警规则配置</div>

                <div className="arc-layout">
                    <aside className="arc-category-panel panel">
                        <div className="arc-category-panel__head">
                            <h3>规则分类</h3>
                            <button type="button" className="arc-category-panel__add" onClick={openAddCategory}>
                                + 新增
                            </button>
                        </div>
                        <AlarmRuleCategoryTree
                            categories={categories}
                            expanded={expanded}
                            activeId={activeCategoryId}
                            onToggle={(id) => setExpanded((prev) => ({ ...prev, [id]: !(prev[id] ?? true) }))}
                            onSelect={setActiveCategoryId}
                            onOpenMenu={(categoryId, event) => {
                                const rect = event.currentTarget.getBoundingClientRect();
                                setContextMenu({
                                    categoryId,
                                    x: rect.right + 4,
                                    y: rect.top,
                                });
                            }}
                        />
                    </aside>

                    <section className="arc-list-panel panel">
                        <div className="arc-filter-row">
                            <label className="pm-filter-field">
                                <span className="pm-filter-label">规则状态</span>
                                <ElSelect
                                    className="el-select--medium"
                                    size="medium"
                                    value={draftFilters.status}
                                    options={STATUS_OPTIONS}
                                    onChange={(value) => setDraftFilters((prev) => ({ ...prev, status: value }))}
                                />
                            </label>
                            <label className="pm-filter-field">
                                <span className="pm-filter-label">触发方式</span>
                                <ElMultiSelect
                                    className="el-select--medium"
                                    size="medium"
                                    placeholder="全部"
                                    value={draftFilters.triggerMethods}
                                    options={TRIGGER_FILTER_OPTIONS}
                                    onChange={(value) => setDraftFilters((prev) => ({
                                        ...prev,
                                        triggerMethods: value as AlarmTriggerMethod[],
                                    }))}
                                />
                            </label>
                            <label className="pm-filter-field">
                                <span className="pm-filter-label">规则名称</span>
                                <input
                                    type="text"
                                    className="pm-filter-input"
                                    placeholder="请输入规则名称"
                                    value={draftFilters.keyword}
                                    onChange={(event) => setDraftFilters((prev) => ({ ...prev, keyword: event.target.value }))}
                                />
                            </label>
                            <button type="button" className="pm-btn pm-btn-primary" onClick={handleSearch}>
                                <Search size={14} />
                                查询
                            </button>
                            <button type="button" className="pm-btn pm-btn-ghost" onClick={handleReset}>
                                重置
                            </button>
                        </div>

                        <div className="arc-table-head">
                            <div className="arc-table-title">
                                <h3>规则列表</h3>
                            </div>
                            <div className="arc-table-actions">
                                <button
                                    type="button"
                                    className="pm-btn pm-btn-ghost"
                                    disabled={!selectedRuleIds.length}
                                    onClick={() => setBatchDeleteOpen(true)}
                                >
                                    <Trash2 size={14} />
                                    批量删除
                                </button>
                                <button type="button" className="pm-btn pm-btn-primary" onClick={openAddRuleDrawer}>
                                    新增
                                </button>
                            </div>
                        </div>

                        <div className="arc-table-wrap pm-table-wrap">
                            <table className="pm-table">
                                <thead>
                                    <tr>
                                        <th>
                                            <input
                                                type="checkbox"
                                                aria-label="全选"
                                                checked={allPageSelected}
                                                onChange={toggleSelectAll}
                                            />
                                        </th>
                                        <th>规则名称</th>
                                        <th>规则描述</th>
                                        <th>触发方式</th>
                                        <th>创建时间</th>
                                        <th>状态</th>
                                        <th>操作</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pagination.items.map((rule) => (
                                        <tr key={rule.id}>
                                            <td>
                                                <input
                                                    type="checkbox"
                                                    aria-label={`选择 ${rule.name}`}
                                                    checked={selectedRuleIds.includes(rule.id)}
                                                    onChange={() => toggleSelectRule(rule.id)}
                                                />
                                            </td>
                                            <td>{rule.name}</td>
                                            <td
                                                className="arc-desc-cell"
                                                title={rule.description.length > 20 ? rule.description : undefined}
                                            >
                                                {truncateRuleDescription(rule.description)}
                                            </td>
                                            <td>{formatTriggerMethods(rule.triggerMethods)}</td>
                                            <td>{rule.createdAt}</td>
                                            <td>
                                                <label className="arc-status-switch">
                                                    <input
                                                        type="checkbox"
                                                        checked={rule.enabled}
                                                        onChange={(event) => toggleRuleEnabled(rule.id, event.target.checked)}
                                                    />
                                                </label>
                                            </td>
                                            <td>
                                                <div className="pm-table-actions">
                                                    <button type="button" onClick={() => openEditRuleDrawer(rule)}>编辑</button>
                                                    <button type="button" onClick={() => setDeleteRuleTarget(rule)}>删除</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {!pagination.items.length && (
                                        <tr>
                                            <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                                                暂无规则数据
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <ListPagination
                            total={pagination.total}
                            currentPage={pagination.currentPage}
                            totalPages={pagination.totalPages}
                            pageSize={pageSize}
                            jumpPage={jumpPage}
                            onPageChange={setCurrentPage}
                            onPageSizeChange={setPageSize}
                            onJumpPageChange={setJumpPage}
                        />
                    </section>
                </div>
            </div>

            {contextMenu && (
                <div
                    ref={contextMenuRef}
                    className="arc-context-menu"
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                    onMouseDown={(event) => event.stopPropagation()}
                >
                    <button
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => {
                            const category = categories.find((item) => item.id === contextMenu.categoryId);
                            if (category) openEditCategory(category);
                        }}
                    >
                        编辑
                    </button>
                    <button
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => {
                            const category = categories.find((item) => item.id === contextMenu.categoryId);
                            if (category) openDeleteCategory(category);
                        }}
                    >
                        删除
                    </button>
                </div>
            )}

            <AlarmRuleCategoryDialog
                open={categoryDialogMode !== null}
                mode={categoryDialogMode ?? 'add'}
                parentOptions={categoryParentOptions}
                initialValue={categoryDialogMode === 'edit' ? editingCategoryForm : addCategoryInitialValue}
                onClose={() => {
                    setCategoryDialogMode(null);
                    setEditingCategory(null);
                }}
                onConfirm={handleCategoryConfirm}
            />

            <AlarmRuleFormDrawer
                open={ruleDrawerMode !== null}
                mode={ruleDrawerMode ?? 'add'}
                categories={categories}
                alarmLevels={alarmLevels}
                products={products}
                devices={devices}
                initialValue={ruleDrawerMode === 'edit'
                    ? editingRuleForm
                    : {
                        name: '',
                        categoryId: activeCategoryId !== 'all' ? activeCategoryId : '',
                        description: '',
                        editMode: '触发条件设置',
                        triggerMethods: ['设备状态触发'],
                        notifyAlarm: true,
                        createWorkOrder: false,
                        workOrderAssignees: [],
                        conditionSettings: createDefaultAlarmRuleConditionSettings(alarmLevels),
                    }}
                onClose={closeRuleDrawer}
                onSubmit={handleRuleSubmit}
            />

            {deleteCategoryTarget && (
                <ConfirmDialog
                    title="删除分类"
                    message={`确定删除分类「${deleteCategoryTarget.name}」吗？`}
                    onClose={() => setDeleteCategoryTarget(null)}
                    onConfirm={handleDeleteCategory}
                />
            )}

            {deleteRuleTarget && (
                <ConfirmDialog
                    title="删除规则"
                    message={`确定删除规则「${deleteRuleTarget.name}」吗？`}
                    onClose={() => setDeleteRuleTarget(null)}
                    onConfirm={handleDeleteRule}
                />
            )}

            {batchDeleteOpen && (
                <ConfirmDialog
                    title="批量删除"
                    message={`确定删除选中的 ${selectedRuleIds.length} 条规则吗？`}
                    onClose={() => setBatchDeleteOpen(false)}
                    onConfirm={handleBatchDelete}
                />
            )}

            <IotToast toast={toast} />
        </AppShell>
    );
}
