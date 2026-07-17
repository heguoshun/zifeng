import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MoreHorizontal, Plus, Search } from 'lucide-react';
import TreeToggleIcon from '../components/TreeToggleIcon';
import AppShell from '../components/AppShell';
import Breadcrumb from '../components/Breadcrumb';
import DeviceAccessSidebar, { type DeviceAccessPageId } from '../components/DeviceAccessSidebar';
import EntityCardPlaceholder from '../components/EntityCardPlaceholder';
import { ConfirmDialog } from '../components/IotDialogs';
import ModelLibraryCategoryDialog, {
    type ModelLibraryCategoryFormValue,
} from '../components/ModelLibraryCategoryDialog';
import IotToast, { type IotToastData, triggerIotToast } from '../components/IotToast';
import {
    addCategoryToTree,
    countModelsInCategory,
    findParentCategoryId,
    flattenCategoryTree,
    generateCategoryId,
    generateSectionId,
    getCategoryDescendantSectionIds,
    getCategorySectionId,
    getTopLevelParentOptions,
    getVisibleSectionsForCategory,
    isTopLevelCategory,
    moveCategoryInTree,
    removeCategoryFromTree,
    resolveThingModelCreateContext,
    updateCategoryInTree,
    type ThingModelCategoryNode,
    type ThingModelItem,
    type ThingModelSection,
    type ThingModelTabData,
    type ThingModelTabKey,
} from '../data/thingModels';
import { navigateThingModelForm, type ThingModelFormMode } from '../utils/modelLibraryRoute';
import '../model-library.css';
import ClearableInput from '../components/ClearableInput';

type TabKey = ThingModelTabKey;

type TreeContextMenuState = {
    categoryId: string;
    x: number;
    y: number;
} | null;

type CardContextMenuState = {
    modelId: string;
    x: number;
    y: number;
} | null;

type ModelLibraryPageProps = {
    onNavigateHome: () => void;
    onNavigate: (pageId: DeviceAccessPageId) => void;
    /** 仅超级管理员可新增、编辑、删除；租户只读 */
    canManage?: boolean;
    tabData: Record<TabKey, ThingModelTabData>;
    onTabDataChange: React.Dispatch<React.SetStateAction<Record<TabKey, ThingModelTabData>>>;
};

function CategoryTree({
    nodes,
    selectedId,
    expanded,
    canManage,
    onToggle,
    onSelect,
    onOpenMenu,
}: {
    nodes: ThingModelCategoryNode[];
    selectedId: string | null;
    expanded: Record<string, boolean>;
    canManage: boolean;
    onToggle: (id: string) => void;
    onSelect: (id: string) => void;
    onOpenMenu: (categoryId: string, event: React.MouseEvent<HTMLButtonElement>) => void;
}) {
    const renderNodes = (list: ThingModelCategoryNode[], depth: number) => (
        <ul className={`ml-tree ${depth > 0 ? 'ml-tree--nested' : ''}`}>
            {list.map((node) => {
                const hasChildren = Boolean(node.children?.length);
                const isExpanded = expanded[node.id] ?? true;
                const isActive = selectedId === node.id;

                return (
                    <li key={node.id} className="ml-tree-node">
                        <div
                            className={`ml-tree-item ${isActive ? 'is-active' : ''}`}
                            style={{ paddingLeft: `${8 + depth * 18}px` }}
                        >
                            {hasChildren ? (
                                <button
                                    type="button"
                                    className="ml-tree-toggle"
                                    aria-label={isExpanded ? '收起' : '展开'}
                                    onClick={() => onToggle(node.id)}
                                >
                                    <TreeToggleIcon expanded={isExpanded} />
                                </button>
                            ) : (
                                <span className="ml-tree-spacer" />
                            )}
                            <button
                                type="button"
                                className="ml-tree-label-btn"
                                onClick={() => onSelect(node.id)}
                            >
                                {node.name}
                            </button>
                            {canManage && (
                                <button
                                    type="button"
                                    className="ml-tree-menu-btn"
                                    aria-label="更多操作"
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        onOpenMenu(node.id, event);
                                    }}
                                >
                                    <MoreHorizontal size={14} />
                                </button>
                            )}
                        </div>
                        {hasChildren && isExpanded && renderNodes(node.children ?? [], depth + 1)}
                    </li>
                );
            })}
        </ul>
    );

    return <div className="ml-tree-body">{renderNodes(nodes, 0)}</div>;
}

function ModelCard({
    model,
    canManage,
    onOpenMenu,
}: {
    model: ThingModelItem;
    canManage: boolean;
    onOpenMenu: (modelId: string, event: React.MouseEvent<HTMLButtonElement>) => void;
}) {
    return (
        <article className="ml-card">
            {canManage && (
                <button
                    type="button"
                    className="ml-card-menu-btn"
                    aria-label="更多操作"
                    onClick={(event) => {
                        event.stopPropagation();
                        onOpenMenu(model.id, event);
                    }}
                >
                    <MoreHorizontal size={14} />
                </button>
            )}
            <div className="ml-card__icon">
                <EntityCardPlaceholder />
            </div>
            <div className="ml-card__name">{model.name}</div>
        </article>
    );
}

function AddModelCard({ label, onClick }: { label: string; onClick: () => void }) {
    return (
        <button type="button" className="ml-card ml-card--add" onClick={onClick}>
            <Plus size={24} strokeWidth={1.5} />
            <span>{label}</span>
        </button>
    );
}

function buildVisibleSections(
    sections: ThingModelSection[],
    models: ThingModelItem[],
    selectedCategoryId: string | null,
    categoryTree: ThingModelCategoryNode[],
): ThingModelSection[] {
    const sectionsWithModels = sections.filter((section) =>
        models.some((model) => model.sectionId === section.id));

    if (!selectedCategoryId) return sectionsWithModels;

    const descendantSectionIds = getCategoryDescendantSectionIds(categoryTree, selectedCategoryId);
    if (descendantSectionIds.length > 0) {
        const allowedIds = new Set(descendantSectionIds);
        return sectionsWithModels.filter((section) => allowedIds.has(section.id));
    }

    const anchorSectionId = getCategorySectionId(categoryTree, selectedCategoryId);
    if (!anchorSectionId) return sectionsWithModels;

    const anchorIndex = sections.findIndex((section) => section.id === anchorSectionId);
    if (anchorIndex < 0) return sectionsWithModels;

    const allowedIds = new Set(sections.slice(anchorIndex).map((section) => section.id));
    return sectionsWithModels.filter((section) => allowedIds.has(section.id));
}

export default function ModelLibraryPage({
    onNavigateHome,
    onNavigate,
    canManage = false,
    tabData,
    onTabDataChange,
}: ModelLibraryPageProps) {
    const [activeTab, setActiveTab] = useState<TabKey>('standard');
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>('cat-water');
    const [keyword, setKeyword] = useState('');
    const [expanded, setExpanded] = useState<Record<string, boolean>>({
        'cat-infra': true,
        'cat-park': true,
        'cat-iot-access': true,
        'mfr-feituo': true,
        'mfr-aliyun': true,
        'mfr-dahua': true,
        'mfr-siemens': true,
    });
    const [treeContextMenu, setTreeContextMenu] = useState<TreeContextMenuState>(null);
    const [cardContextMenu, setCardContextMenu] = useState<CardContextMenuState>(null);
    const [toast, setToast] = useState<IotToastData | null>(null);

    const [categoryDialogMode, setCategoryDialogMode] = useState<'add' | 'edit' | null>(null);
    const [categoryDialogInitial, setCategoryDialogInitial] = useState<ModelLibraryCategoryFormValue>({
        name: '',
        parentId: '',
    });
    const [categoryDialogParentDisabled, setCategoryDialogParentDisabled] = useState(false);
    const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
    const [deleteCategoryTargetId, setDeleteCategoryTargetId] = useState<string | null>(null);
    const [deleteModelTarget, setDeleteModelTarget] = useState<ThingModelItem | null>(null);

    const treeMenuRef = useRef<HTMLDivElement>(null);
    const cardMenuRef = useRef<HTMLDivElement>(null);

    const { categoryTree, sectionOrder, models } = tabData[activeTab];

    const parentOptions = useMemo(() => {
        const excludeId = categoryDialogMode === 'edit' ? editingCategoryId : null;
        return getTopLevelParentOptions(categoryTree).filter((item) => item.value !== excludeId);
    }, [categoryTree, categoryDialogMode, editingCategoryId]);

    const filteredModels = useMemo(() => {
        const kw = keyword.trim().toLowerCase();
        if (!kw) return models;
        return models.filter((model) => model.name.toLowerCase().includes(kw));
    }, [models, keyword]);

    const groupedSections = useMemo(() => {
        const visibleSections = keyword.trim()
            ? buildVisibleSections(sectionOrder, filteredModels, selectedCategoryId, categoryTree)
            : getVisibleSectionsForCategory(sectionOrder, selectedCategoryId, categoryTree);

        return visibleSections.map((section) => ({
            section,
            models: filteredModels.filter((model) => model.sectionId === section.id),
        }));
    }, [sectionOrder, filteredModels, selectedCategoryId, categoryTree, keyword]);

    const updateActiveTabData = (updater: (current: ThingModelTabData) => ThingModelTabData) => {
        onTabDataChange((prev) => ({
            ...prev,
            [activeTab]: updater(prev[activeTab]),
        }));
    };

    const openThingModelForm = (options: {
        mode?: ThingModelFormMode;
        categoryId?: string | null;
        sectionId?: string | null;
        modelId?: string;
    }) => {
        if (!canManage) return;

        const context = resolveThingModelCreateContext(
            activeTab,
            categoryTree,
            sectionOrder,
            options.categoryId ?? selectedCategoryId,
            options.sectionId ?? null,
            selectedCategoryId,
        );

        if (!context) {
            triggerIotToast(setToast, '请选择具体分类后再添加产品物模型', 'warning');
            return;
        }

        navigateThingModelForm({
            mode: options.mode ?? 'create',
            tab: activeTab,
            sectionId: context.sectionId,
            categoryId: context.categoryId,
            modelId: options.modelId,
        });
    };

    useEffect(() => {
        const closeMenus = (event: MouseEvent) => {
            const target = event.target as Node;
            if (treeMenuRef.current && !treeMenuRef.current.contains(target)) {
                setTreeContextMenu(null);
            }
            if (cardMenuRef.current && !cardMenuRef.current.contains(target)) {
                setCardContextMenu(null);
            }
        };

        document.addEventListener('mousedown', closeMenus);
        return () => document.removeEventListener('mousedown', closeMenus);
    }, []);

    const handleTabChange = (tab: TabKey) => {
        setActiveTab(tab);
        setSelectedCategoryId(tab === 'standard' ? 'cat-water' : 'mfr-feituo-encoder');
        setKeyword('');
        setTreeContextMenu(null);
        setCardContextMenu(null);
        setCategoryDialogMode(null);
        setDeleteCategoryTargetId(null);
        setDeleteModelTarget(null);
    };

    const resolvePresetParentId = (categoryId?: string | null) => {
        if (!categoryId) return '';
        if (isTopLevelCategory(categoryTree, categoryId)) return categoryId;
        const parentId = findParentCategoryId(categoryTree, categoryId);
        return parentId ?? '';
    };

    const openAddCategoryDialog = (presetParentId?: string | null) => {
        if (!canManage) return;
        setCategoryDialogMode('add');
        setEditingCategoryId(null);
        setCategoryDialogParentDisabled(false);
        setCategoryDialogInitial({
            name: '',
            parentId: resolvePresetParentId(presetParentId ?? selectedCategoryId),
        });
    };

    const openEditCategoryDialog = (categoryId: string) => {
        if (!canManage) return;
        const category = flattenCategoryTree(categoryTree).find((item) => item.id === categoryId);
        if (!category) return;

        const parentId = findParentCategoryId(categoryTree, categoryId);
        const isTopLevel = isTopLevelCategory(categoryTree, categoryId);

        setCategoryDialogMode('edit');
        setEditingCategoryId(categoryId);
        setCategoryDialogParentDisabled(isTopLevel);
        setCategoryDialogInitial({
            name: category.name,
            parentId: parentId ?? '',
        });
        setTreeContextMenu(null);
    };

    const handleCategoryDialogConfirm = (value: ModelLibraryCategoryFormValue) => {
        if (!canManage) return;
        const name = value.name.trim();
        if (!name) return;

        if (categoryDialogMode === 'add') {
            if (value.parentId) {
                const sectionId = generateSectionId();
                const categoryId = generateCategoryId();
                updateActiveTabData((current) => ({
                    ...current,
                    categoryTree: addCategoryToTree(current.categoryTree, value.parentId, {
                        id: categoryId,
                        name,
                        sectionId,
                    }),
                    sectionOrder: [...current.sectionOrder, { id: sectionId, name }],
                }));
                setExpanded((prev) => ({ ...prev, [value.parentId]: true }));
                setSelectedCategoryId(categoryId);
            } else {
                const categoryId = generateCategoryId();
                updateActiveTabData((current) => ({
                    ...current,
                    categoryTree: addCategoryToTree(current.categoryTree, null, {
                        id: categoryId,
                        name,
                        children: [],
                    }),
                }));
                setExpanded((prev) => ({ ...prev, [categoryId]: true }));
                setSelectedCategoryId(categoryId);
            }
            triggerIotToast(setToast, `已新建目录「${name}」`, 'success');
        }

        if (categoryDialogMode === 'edit' && editingCategoryId) {
            const editingNode = flattenCategoryTree(categoryTree).find((item) => item.id === editingCategoryId);
            const sectionId = editingNode?.sectionId;

            updateActiveTabData((current) => {
                let nextTree = updateCategoryInTree(current.categoryTree, editingCategoryId, (node) => ({
                    ...node,
                    name,
                }));

                const currentParentId = findParentCategoryId(current.categoryTree, editingCategoryId) ?? '';
                if (!isTopLevelCategory(current.categoryTree, editingCategoryId)
                    && value.parentId !== currentParentId) {
                    nextTree = moveCategoryInTree(nextTree, editingCategoryId, value.parentId || null);
                }

                const nextSections = sectionId
                    ? current.sectionOrder.map((section) => (
                        section.id === sectionId ? { ...section, name } : section
                    ))
                    : current.sectionOrder;

                return {
                    ...current,
                    categoryTree: nextTree,
                    sectionOrder: nextSections,
                };
            });
            triggerIotToast(setToast, `已更新目录「${name}」`, 'success');
        }

        setCategoryDialogMode(null);
        setEditingCategoryId(null);
    };

    const requestDeleteCategory = (categoryId: string) => {
        if (!canManage) return;
        const category = flattenCategoryTree(categoryTree).find((item) => item.id === categoryId);
        if (!category) return;

        const productCount = countModelsInCategory(categoryTree, models, categoryId);
        setTreeContextMenu(null);

        if (productCount > 0) {
            triggerIotToast(setToast, '请先移除产品', 'warning');
            return;
        }

        setDeleteCategoryTargetId(categoryId);
    };

    const collectDescendantCategoryIds = (
        node: ThingModelCategoryNode,
    ): string[] => {
        const ids = [node.id];
        node.children?.forEach((child) => {
            ids.push(...collectDescendantCategoryIds(child));
        });
        return ids;
    };

    const confirmDeleteCategory = () => {
        if (!canManage || !deleteCategoryTargetId) return;

        const targetNode = flattenCategoryTree(categoryTree)
            .find((item) => item.id === deleteCategoryTargetId);
        if (!targetNode) {
            setDeleteCategoryTargetId(null);
            return;
        }

        const sectionIds = new Set(getCategoryDescendantSectionIds(categoryTree, deleteCategoryTargetId));
        const removedCategoryIds = new Set(collectDescendantCategoryIds(targetNode));
        const nextTree = removeCategoryFromTree(categoryTree, deleteCategoryTargetId);

        updateActiveTabData((current) => ({
            categoryTree: nextTree,
            sectionOrder: current.sectionOrder.filter((section) => !sectionIds.has(section.id)),
            models: current.models.filter((model) => !sectionIds.has(model.sectionId)),
        }));

        if (selectedCategoryId && removedCategoryIds.has(selectedCategoryId)) {
            const remaining = flattenCategoryTree(nextTree);
            setSelectedCategoryId(remaining[0]?.id ?? null);
        }

        triggerIotToast(setToast, '目录已删除', 'success');
        setDeleteCategoryTargetId(null);
    };

    const handleTreeAction = (action: 'edit' | 'add-child' | 'delete', categoryId: string) => {
        if (!canManage) return;
        if (action === 'edit') {
            openEditCategoryDialog(categoryId);
            return;
        }
        if (action === 'add-child') {
            openThingModelForm({ categoryId });
            setTreeContextMenu(null);
            return;
        }
        requestDeleteCategory(categoryId);
    };

    const handleCardAction = (action: 'edit' | 'delete', modelId: string) => {
        if (!canManage) return;
        const model = models.find((item) => item.id === modelId);
        if (!model) return;

        setCardContextMenu(null);

        if (action === 'edit') {
            openThingModelForm({
                mode: 'edit',
                modelId: model.id,
                sectionId: model.sectionId,
            });
            return;
        }

        setDeleteModelTarget(model);
    };

    const confirmDeleteModel = () => {
        if (!canManage || !deleteModelTarget) return;

        updateActiveTabData((current) => ({
            ...current,
            models: current.models.filter((model) => model.id !== deleteModelTarget.id),
        }));

        triggerIotToast(
            setToast,
            `已删除产品「${deleteModelTarget.name}」，已接入设备物模型不受影响`,
            'success',
        );
        setDeleteModelTarget(null);
    };

    const sidebar = <DeviceAccessSidebar pageId="model-library" onNavigate={onNavigate} />;

    return (
        <AppShell
            activeTopTab="设备接入"
            sidebar={sidebar}
            onTopTabChange={(tab) => {
                if (tab === '设备接入') onNavigate('home');
            }}
        >
            <div className="ml-page">
                <Breadcrumb items={[
                                    { label: '设备接入', pageId: 'home' },
                                    { label: '物模型库', pageId: 'model-library' },
                                    { label: '物模型库' },
                                ]} onNavigate={(id) => onNavigate(id as DeviceAccessPageId)} />

                <section className="panel ml-tab-bar">
                    <button
                        type="button"
                        className={`ml-tab ${activeTab === 'standard' ? 'is-active' : ''}`}
                        onClick={() => handleTabChange('standard')}
                    >
                        标准物模型
                    </button>
                    <button
                        type="button"
                        className={`ml-tab ${activeTab === 'manufacturer' ? 'is-active' : ''}`}
                        onClick={() => handleTabChange('manufacturer')}
                    >
                        厂家物模型
                    </button>
                    <div className="ml-tab-spacer" />
                    <div className="ml-search-box">
                        <Search size={14} />
                        <ClearableInput
                            type="text"
                            placeholder="请输入产品名称"
                            value={keyword}
                            onChange={(event) => setKeyword(event.target.value)}
                        />
                    </div>
                </section>

                <div className="panel ml-body">
                    <aside className="ml-left-tree">
                        <div className="ml-left-tree__head">
                            <span>{activeTab === 'standard' ? '场景目录' : '厂家列表'}</span>
                            {canManage && (
                                <button
                                    type="button"
                                    className="ml-left-tree__add"
                                    onClick={() => openAddCategoryDialog()}
                                >
                                    <Plus size={14} />
                                    新建
                                </button>
                            )}
                        </div>
                        <CategoryTree
                            nodes={categoryTree}
                            selectedId={selectedCategoryId}
                            expanded={expanded}
                            canManage={canManage}
                            onToggle={(id) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))}
                            onSelect={setSelectedCategoryId}
                            onOpenMenu={(categoryId, event) => {
                                if (!canManage) return;
                                const rect = event.currentTarget.getBoundingClientRect();
                                setCardContextMenu(null);
                                setTreeContextMenu({
                                    categoryId,
                                    x: rect.right + 4,
                                    y: rect.top,
                                });
                            }}
                        />
                    </aside>

                    <section className="ml-right-cards">
                        {groupedSections.length === 0 ? (
                            <div className="ml-empty">
                                <p>{keyword ? '未找到匹配的物模型' : '该分类下暂无物模型'}</p>
                            </div>
                        ) : (
                            groupedSections.map((group) => (
                                <section key={group.section.id} className="ml-section">
                                    <h3 className="ml-section__title">{group.section.name}</h3>
                                    <div className="ml-card-grid">
                                        {canManage && (
                                            <AddModelCard
                                                label="添加产品物模型"
                                                onClick={() => openThingModelForm({
                                                    sectionId: group.section.id,
                                                })}
                                            />
                                        )}
                                        {group.models.map((model) => (
                                            <ModelCard
                                                key={model.id}
                                                model={model}
                                                canManage={canManage}
                                                onOpenMenu={(modelId, event) => {
                                                    if (!canManage) return;
                                                    const rect = event.currentTarget.getBoundingClientRect();
                                                    setTreeContextMenu(null);
                                                    setCardContextMenu({
                                                        modelId,
                                                        x: rect.right - 8,
                                                        y: rect.bottom + 4,
                                                    });
                                                }}
                                            />
                                        ))}
                                    </div>
                                </section>
                            ))
                        )}
                    </section>
                </div>
            </div>

            {canManage && treeContextMenu && (
                <div
                    ref={treeMenuRef}
                    className="ml-context-menu ml-context-menu--dark"
                    style={{ left: treeContextMenu.x, top: treeContextMenu.y }}
                    onMouseDown={(event) => event.stopPropagation()}
                >
                    <button type="button" onClick={() => handleTreeAction('edit', treeContextMenu.categoryId)}>
                        编辑
                    </button>
                    <button type="button" onClick={() => handleTreeAction('add-child', treeContextMenu.categoryId)}>
                        添加子产品
                    </button>
                    <button
                        type="button"
                        className="is-danger"
                        onClick={() => handleTreeAction('delete', treeContextMenu.categoryId)}
                    >
                        删除
                    </button>
                </div>
            )}

            {canManage && cardContextMenu && (
                <div
                    ref={cardMenuRef}
                    className="ml-context-menu"
                    style={{ left: cardContextMenu.x, top: cardContextMenu.y }}
                    onMouseDown={(event) => event.stopPropagation()}
                >
                    <button type="button" onClick={() => handleCardAction('edit', cardContextMenu.modelId)}>
                        编辑
                    </button>
                    <button
                        type="button"
                        className="is-danger"
                        onClick={() => handleCardAction('delete', cardContextMenu.modelId)}
                    >
                        删除
                    </button>
                </div>
            )}

            <ModelLibraryCategoryDialog
                open={canManage && categoryDialogMode !== null}
                mode={categoryDialogMode ?? 'add'}
                parentOptions={parentOptions}
                initialValue={categoryDialogInitial}
                parentDisabled={categoryDialogParentDisabled}
                showRootOption={categoryDialogMode === 'add'}
                onClose={() => {
                    setCategoryDialogMode(null);
                    setEditingCategoryId(null);
                }}
                onConfirm={handleCategoryDialogConfirm}
            />

            {canManage && deleteCategoryTargetId && (
                <ConfirmDialog
                    title="删除目录"
                    message="是否确定删除？"
                    onClose={() => setDeleteCategoryTargetId(null)}
                    onConfirm={confirmDeleteCategory}
                />
            )}

            {canManage && deleteModelTarget && (
                <ConfirmDialog
                    title="删除产品"
                    message="删除后，已接入设备将保留原有物模型，不受影响。是否确定删除？"
                    onClose={() => setDeleteModelTarget(null)}
                    onConfirm={confirmDeleteModel}
                />
            )}

            <IotToast toast={toast} />
        </AppShell>
    );
}
