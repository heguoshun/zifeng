import React, { useMemo, useState } from 'react';
import {
    ArrowLeft,
    FileText,
    Folder,
    Search,
} from 'lucide-react';
import AppShell from '../components/AppShell';
import Breadcrumb from '../components/Breadcrumb';
import TreeToggleIcon from '../components/TreeToggleIcon';
import DeviceAccessSidebar, { type DeviceAccessPageId } from '../components/DeviceAccessSidebar';
import ElSelect from '../components/ElSelect';
import { ConfirmDialog, ViewDrawer } from '../components/IotDialogs';
import IotToast, { type IotToastData, type IotToastType, triggerIotToast } from '../components/IotToast';
import type { DictTypeRecord } from '../data/systemDictionaries';
import '../device-access.css';
import '../product-management.css';
import '../product-category.css';
import ClearableInput from '../components/ClearableInput';

export type CategoryRecord = {
    id: string;
    parentId: string | null;
    name: string;
    code: string;
    businessType: string;
    updatedAt: string;
    remark: string;
};

const INITIAL_CATEGORIES: CategoryRecord[] = [
    { id: 'water', parentId: null, name: '水务设备', code: 'P25uk', businessType: '', updatedAt: '2024-7-9 15:47:34', remark: '水务监测与计量设备分类' },
    { id: 'dabiao', parentId: 'water', name: '大表', code: 'P25uk', businessType: 'large_meter', updatedAt: '2024-7-9 15:47:34', remark: 'DN50及以上管网大口径水表' },
    { id: 'dabiao-em', parentId: 'dabiao', name: '电磁表', code: 'P25em', businessType: 'large_meter', updatedAt: '2024-7-9 15:47:34', remark: '电磁感应原理大口径水表' },
    { id: 'dabiao-mech', parentId: 'dabiao', name: '机械表', code: 'P25mc', businessType: 'large_meter', updatedAt: '2024-7-9 15:47:34', remark: '机械传动大口径水表' },
    { id: 'dabiao-ultra', parentId: 'dabiao', name: '超声表', code: 'P25us', businessType: 'large_meter', updatedAt: '2024-7-9 15:47:34', remark: '超声波非接触大口径水表' },
    { id: 'dabiao-flow', parentId: 'dabiao', name: '流量计', code: 'P25fl', businessType: 'large_meter', updatedAt: '2024-7-9 15:47:34', remark: '管网流量计产品' },
    { id: 'hubiao', parentId: 'water', name: '户表', code: 'P25uk', businessType: 'household_meter', updatedAt: '2024-7-9 15:47:34', remark: '居民及商业户用远传水表' },
    { id: 'yaliji', parentId: 'water', name: '压力计', code: 'P25uk', businessType: 'pressure_gauge', updatedAt: '2024-7-9 15:47:34', remark: '管网压力监测设备' },
    { id: 'shuizhiyi', parentId: 'water', name: '水质仪', code: 'P25uk', businessType: 'water_quality', updatedAt: '2024-7-9 15:47:34', remark: '水质在线监测设备' },
    { id: 'zhihuishuizhan', parentId: 'water', name: '智慧水站', code: 'P25uk', businessType: 'smart_station', updatedAt: '2024-7-9 15:47:34', remark: '集成监测与供水的智慧水站' },
];

type CategoryFormState = {
    name: string;
    parentId: string;
    businessType: string;
    remark: string;
};

type ProductCategoryPageProps = {
    dictionaries: DictTypeRecord[];
    onNavigateHome: () => void;
    onNavigate: (pageId: DeviceAccessPageId) => void;
};

function generateCategoryCode(existing: CategoryRecord[]): string {
    const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = '';
    do {
        const digits = String(Math.floor(1000 + Math.random() * 9000));
        const letter = letters[Math.floor(Math.random() * letters.length)];
        code = `PC${digits}${letter}`;
    } while (existing.some((item) => item.code === code));
    return code;
}

function formatNow(): string {
    const now = new Date();
    const pad = (value: number) => String(value).padStart(2, '0');
    return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

function buildTreeRows(
    categories: CategoryRecord[],
    expanded: Record<string, boolean>,
    keyword: string,
): { item: CategoryRecord; depth: number; hasChildren: boolean }[] {
    const normalizedKeyword = keyword.trim().toLowerCase();
    const childrenMap = new Map<string | null, CategoryRecord[]>();

    categories.forEach((item) => {
        const list = childrenMap.get(item.parentId) ?? [];
        list.push(item);
        childrenMap.set(item.parentId, list);
    });

    const matchesKeyword = (item: CategoryRecord) => {
        if (!normalizedKeyword) return true;
        return item.name.toLowerCase().includes(normalizedKeyword)
            || item.code.toLowerCase().includes(normalizedKeyword);
    };

    const hasMatchingDescendant = (item: CategoryRecord): boolean => {
        const children = childrenMap.get(item.id) ?? [];
        return children.some((child) => matchesKeyword(child) || hasMatchingDescendant(child));
    };

    const shouldShow = (item: CategoryRecord) => {
        if (!normalizedKeyword) return true;
        return matchesKeyword(item) || hasMatchingDescendant(item);
    };

    const rows: { item: CategoryRecord; depth: number; hasChildren: boolean }[] = [];

    const walk = (parentId: string | null, depth: number) => {
        const nodes = childrenMap.get(parentId) ?? [];
        nodes.forEach((item) => {
            if (!shouldShow(item)) return;
            const children = childrenMap.get(item.id) ?? [];
            const hasChildren = children.length > 0;
            rows.push({ item, depth, hasChildren });
            if (hasChildren && (expanded[item.id] ?? true)) {
                walk(item.id, depth + 1);
            }
        });
    };

    walk(null, 0);
    return rows;
}

function CategoryFormDialog({
    title,
    form,
    parentOptions,
    businessTypeOptions,
    onChange,
    onParentChange,
    onClose,
    onSubmit,
    submitLabel,
}: {
    title: string;
    form: CategoryFormState;
    parentOptions: { label: string; value: string }[];
    businessTypeOptions: { label: string; value: string }[];
    onChange: (next: CategoryFormState) => void;
    onParentChange: (parentId: string) => void;
    onClose: () => void;
    onSubmit: () => void;
    submitLabel: string;
}) {
    return (
        <div className="pc-dialog-mask pc-dialog-mask--drawer" role="presentation" onClick={onClose}>
            <div
                className="pc-dialog pc-dialog--drawer"
                role="dialog"
                aria-modal="true"
                aria-labelledby="pc-dialog-title"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="pc-dialog__head">
                    <h4 id="pc-dialog-title">{title}</h4>
                    <button type="button" className="pc-dialog__close" onClick={onClose} aria-label="关闭">×</button>
                </div>
                <div className="pc-dialog__body">
                    <label className="pc-form-field">
                        <span className="pc-form-label"><em>*</em>产品分类名称</span>
                        <ClearableInput
                            type="text"
                            className="pc-form-input"
                            placeholder="请输入产品分类名称"
                            value={form.name}
                            onChange={(event) => onChange({ ...form, name: event.target.value })}
                        />
                    </label>
                    <div className="pc-form-field">
                        <span className="pc-form-label">上级分类</span>
                        <ElSelect
                            className="el-select--medium pc-form-select"
                            size="medium"
                            value={form.parentId}
                            options={parentOptions}
                            onChange={onParentChange}
                        />
                    </div>
                    <div className="pc-form-field">
                        <span className="pc-form-label">业务类型</span>
                        <ElSelect
                            className="el-select--medium pc-form-select"
                            size="medium"
                            value={form.businessType}
                            options={businessTypeOptions}
                            onChange={(value) => onChange({ ...form, businessType: value })}
                        />
                    </div>
                    <label className="pc-form-field">
                        <span className="pc-form-label">备注</span>
                        <textarea
                            className="pc-form-textarea"
                            placeholder="请输入备注"
                            rows={3}
                            value={form.remark}
                            onChange={(event) => onChange({ ...form, remark: event.target.value })}
                        />
                    </label>
                </div>
                <div className="pc-dialog__foot">
                    <button type="button" className="pm-btn pm-btn-ghost" onClick={onClose}>取消</button>
                    <button type="button" className="pm-btn pm-btn-primary" onClick={onSubmit}>{submitLabel}</button>
                </div>
            </div>
        </div>
    );
}

export default function ProductCategoryPage({ dictionaries, onNavigateHome, onNavigate }: ProductCategoryPageProps) {
    const [categories, setCategories] = useState<CategoryRecord[]>(INITIAL_CATEGORIES);
    const [keyword, setKeyword] = useState('');
    const [draftKeyword, setDraftKeyword] = useState('');
    const [expanded, setExpanded] = useState<Record<string, boolean>>({
        meter: true,
        sensor: true,
        water: true,
    });
    const [dialogMode, setDialogMode] = useState<'add' | 'edit' | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<CategoryRecord | null>(null);
    const [viewTarget, setViewTarget] = useState<CategoryRecord | null>(null);
    const [form, setForm] = useState<CategoryFormState>({ name: '', parentId: '', businessType: '', remark: '' });
    const [toast, setToast] = useState<IotToastData | null>(null);

    const businessTypeOptions = useMemo(() => {
        const dict = dictionaries.find((item) => item.code === 'business_type');
        const options = dict?.items
            .filter((item) => item.enabled)
            .sort((left, right) => left.sort - right.sort)
            .map((item) => ({ label: item.name, value: item.dataValue })) ?? [];
        return [{ label: '不指定', value: '' }, ...options];
    }, [dictionaries]);

    const getBusinessTypeName = (businessType: string) => (
        businessTypeOptions.find((option) => option.value === businessType)?.label ?? '不指定'
    );

    const resolveCategoryBusinessType = (categoryId: string) => (
        categories.find((item) => item.id === categoryId)?.businessType ?? ''
    );

    const parentOptions = useMemo(() => {
        const excludeIds = new Set<string>();
        if (dialogMode === 'edit' && editingId) {
            const collect = (id: string) => {
                excludeIds.add(id);
                categories.filter((item) => item.parentId === id).forEach((child) => collect(child.id));
            };
            collect(editingId);
        }

        return [
            { label: '无（顶级分类）', value: '' },
            ...categories
                .filter((item) => !excludeIds.has(item.id))
                .map((item) => ({ label: item.name, value: item.id })),
        ];
    }, [categories, dialogMode, editingId]);

    const tableRows = useMemo(
        () => buildTreeRows(categories, expanded, keyword),
        [categories, expanded, keyword],
    );

    const showToast = (message: string, type: IotToastType = 'warning') => {
        triggerIotToast(setToast, message, type);
    };

    const openAddDialog = () => {
        setForm({ name: '', parentId: '', businessType: '', remark: '' });
        setEditingId(null);
        setDialogMode('add');
    };

    const openEditDialog = (item: CategoryRecord) => {
        setForm({
            name: item.name,
            parentId: item.parentId ?? '',
            businessType: item.businessType,
            remark: item.remark,
        });
        setEditingId(item.id);
        setDialogMode('edit');
    };

    const closeDialog = () => {
        setDialogMode(null);
        setEditingId(null);
    };

    const handleSubmit = () => {
        const name = form.name.trim();
        if (!name) {
            showToast('请输入产品分类名称');
            return;
        }

        if (dialogMode === 'add') {
            const id = `cat-${Date.now()}`;
            const next: CategoryRecord = {
                id,
                parentId: form.parentId || null,
                name,
                code: generateCategoryCode(categories),
                businessType: form.businessType || resolveCategoryBusinessType(form.parentId),
                updatedAt: formatNow(),
                remark: form.remark.trim() || '—',
            };
            setCategories((prev) => [...prev, next]);
            if (form.parentId) {
                setExpanded((prev) => ({ ...prev, [form.parentId]: true }));
            }
            showToast('分类新增成功', 'success');
            closeDialog();
            return;
        }

        if (dialogMode === 'edit' && editingId) {
            setCategories((prev) => prev.map((item) => (
                item.id === editingId
                    ? {
                        ...item,
                        name,
                        parentId: form.parentId || null,
                        businessType: form.businessType,
                        remark: form.remark.trim() || '—',
                        updatedAt: formatNow(),
                    }
                    : item
            )));
            showToast('分类保存成功', 'success');
            closeDialog();
        }
    };

    const handleDelete = () => {
        if (!deleteTarget) return;
        const hasChildren = categories.some((item) => item.parentId === deleteTarget.id);
        if (hasChildren) {
            showToast('请先删除子分类');
            setDeleteTarget(null);
            return;
        }
        setCategories((prev) => prev.filter((item) => item.id !== deleteTarget.id));
        showToast('分类已删除', 'success');
        setDeleteTarget(null);
    };

    const sidebar = <DeviceAccessSidebar pageId="product-category" onNavigate={onNavigate} />;

    return (
        <AppShell
            activeTopTab="设备接入"
            sidebar={sidebar}
            onTopTabChange={(tab) => {
                if (tab === '设备接入') onNavigate('home');
            }}
        >
            <div className="pc-page">
                <Breadcrumb items={[
                                    { label: '设备接入', pageId: 'home' },
                                    { label: '产品管理', pageId: 'product-management' },
                                    { label: '产品分类' },
                                ]} onNavigate={(id) => onNavigate(id as DeviceAccessPageId)} />

                <button
                    type="button"
                    className="pc-back-btn"
                    onClick={() => onNavigate('product-management')}
                >
                    <ArrowLeft size={14} />
                    返回
                </button>

                <section className="panel pc-filter-panel">
                    <div className="pc-filter-row">
                        <div className="pm-filter-field">
                            <span className="pm-filter-label">产品分类</span>
                            <ClearableInput
                                type="text"
                                className="pm-filter-input"
                                placeholder="请输入产品分类名称/编号"
                                value={draftKeyword}
                                onChange={(event) => setDraftKeyword(event.target.value)}
                            />
                        </div>
                        <button
                            type="button"
                            className="pm-btn pm-btn-primary"
                            onClick={() => setKeyword(draftKeyword.trim())}
                        >
                            <Search size={14} />
                            查询
                        </button>
                    </div>
                </section>

                <section className="panel pc-table-panel">
                    <div className="pc-table-head">
                        <div className="pc-table-title">
                            <h3>产品分类列表</h3>

                        </div>
                        <div className="pc-table-actions">
                            <button
                                type="button"
                                className="pm-btn pm-btn-ghost"
                                onClick={() => showToast('导出任务已提交', 'success')}
                            >
                                导出
                            </button>
                            <button type="button" className="pm-btn pm-btn-primary" onClick={openAddDialog}>
                                新增分类
                            </button>
                        </div>
                    </div>

                    <div className="pc-table-wrap">
                        <table className="pc-table">
                            <thead>
                                <tr>
                                    <th>产品分类名称</th>
                                    <th>类别编号</th>
                                    <th>业务类型</th>
                                    <th>更新时间</th>
                                    <th>备注</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tableRows.map(({ item, depth, hasChildren }) => {
                                    const isExpanded = expanded[item.id] ?? true;
                                    return (
                                        <tr key={item.id}>
                                            <td>
                                                <div
                                                    className="pc-tree-cell"
                                                    style={{ paddingLeft: `${depth * 20}px` }}
                                                >
                                                    {hasChildren ? (
                                                        <button
                                                            type="button"
                                                            className="pc-tree-toggle"
                                                            aria-label={isExpanded ? '收起' : '展开'}
                                                            onClick={() => setExpanded((prev) => ({
                                                                ...prev,
                                                                [item.id]: !isExpanded,
                                                            }))}
                                                        >
                                                            <TreeToggleIcon expanded={isExpanded} />
                                                        </button>
                                                    ) : (
                                                        <span className="pc-tree-spacer" />
                                                    )}
                                                    {hasChildren
                                                        ? <Folder size={14} className="pc-tree-icon pc-tree-icon--folder" />
                                                        : <FileText size={14} className="pc-tree-icon" />}
                                                    <span>{item.name}</span>
                                                </div>
                                            </td>
                                            <td>{item.code}</td>
                                            <td>{getBusinessTypeName(item.businessType)}</td>
                                            <td>{item.updatedAt}</td>
                                            <td className="pc-remark-cell">{item.remark}</td>
                                            <td>
                                                <div className="pc-row-actions">
                                                    <button type="button" onClick={() => setViewTarget(item)}>查看</button>
                                                    <button type="button" onClick={() => openEditDialog(item)}>编辑</button>
                                                    <button type="button" onClick={() => setDeleteTarget(item)}>删除</button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {tableRows.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="pc-empty-cell">暂无匹配的分类数据</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>

            {dialogMode && (
                <CategoryFormDialog
                    title={dialogMode === 'add' ? '新增分类' : '编辑分类'}
                    form={form}
                    parentOptions={parentOptions}
                    businessTypeOptions={businessTypeOptions}
                    onChange={setForm}
                    onParentChange={(parentId) => setForm((previous) => ({
                        ...previous,
                        parentId,
                        businessType: previous.businessType || resolveCategoryBusinessType(parentId),
                    }))}
                    onClose={closeDialog}
                    onSubmit={handleSubmit}
                    submitLabel={dialogMode === 'add' ? '新增' : '保存'}
                />
            )}

            {deleteTarget && (
                <ConfirmDialog
                    title="删除分类"
                    message={`确定删除分类「${deleteTarget.name}」吗？删除后不可恢复。`}
                    onClose={() => setDeleteTarget(null)}
                    onConfirm={handleDelete}
                />
            )}

            <ViewDrawer
                title="查看分类"
                open={Boolean(viewTarget)}
                onClose={() => setViewTarget(null)}
	                items={viewTarget ? [
	                    { label: '分类名称', value: viewTarget.name },
	                    { label: '类别编号', value: viewTarget.code },
	                    { label: '业务类型', value: getBusinessTypeName(viewTarget.businessType) },
	                    { label: '更新时间', value: viewTarget.updatedAt },
	                    { label: '备注', value: viewTarget.remark },
	                ] : []}
            />

            <IotToast toast={toast} />
        </AppShell>
    );
}
