import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Search } from 'lucide-react';
import {
    type DictItemRecord,
    type DictTypeRecord,
    generateDictItemId,
} from '../data/systemDictionaries';
import { paginateItems } from '../utils/listPagination';
import DictItemFormDialog, { type DictItemFormValue } from './DictItemFormDialog';
import { ConfirmDialog } from './IotDialogs';
import IotToast, { type IotToastData, type IotToastType, triggerIotToast } from './IotToast';
import ClearableInput from './ClearableInput';
import '../dict-management.css';

type DictItemFormMode = 'add' | 'edit' | null;

type DictItemListPanelProps = {
    dictType: DictTypeRecord;
    onUpdateItems: (dictTypeId: string, items: DictItemRecord[]) => void;
    onClose: () => void;
};

export default function DictItemListPanel({
    dictType,
    onUpdateItems,
    onClose,
}: DictItemListPanelProps) {
    const [draftName, setDraftName] = useState('');
    const [keyword, setKeyword] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

    const [formMode, setFormMode] = useState<DictItemFormMode>(null);
    const [editingItem, setEditingItem] = useState<DictItemRecord | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<DictItemRecord | null>(null);
    const [toast, setToast] = useState<IotToastData | null>(null);

    const showToast = (message: string, type: IotToastType = 'warning') => {
        triggerIotToast(setToast, message, type);
    };

    useEffect(() => {
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, []);

    // Reset state when dictType changes
    useEffect(() => {
        setDraftName('');
        setKeyword('');
        setCurrentPage(1);
    }, [dictType.id]);

    const items = dictType.items;

    const filteredItems = useMemo(() => {
        const q = keyword.trim().toLowerCase();
        if (!q) return items;
        return items.filter((item) => item.name.toLowerCase().includes(q));
    }, [items, keyword]);

    const pagination = useMemo(
        () => paginateItems(filteredItems, currentPage, pageSize),
        [filteredItems, currentPage, pageSize],
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [keyword]);

    const handleSearch = () => {
        setKeyword(draftName.trim());
    };

    const handleReset = () => {
        setDraftName('');
        setKeyword('');
        setCurrentPage(1);
    };

    // ── CRUD ──
    const openAddForm = () => {
        setEditingItem(null);
        setFormMode('add');
    };

    const openEditForm = (item: DictItemRecord) => {
        setEditingItem(item);
        setFormMode('edit');
    };

    const closeForm = () => {
        setFormMode(null);
        setEditingItem(null);
    };

    const handleSubmit = (value: DictItemFormValue) => {
        if (formMode === 'add') {
            const newItem: DictItemRecord = {
                id: generateDictItemId(),
                name: value.name,
                dataValue: value.dataValue,
                description: value.description,
                sort: value.sort,
                enabled: value.enabled,
            };
            const nextItems = [...items, newItem].sort((a, b) => a.sort - b.sort);
            onUpdateItems(dictType.id, nextItems);
            showToast('字典项新增成功', 'success');
            closeForm();
            return;
        }

        if (formMode === 'edit' && editingItem) {
            const nextItems = items
                .map((item) =>
                    item.id === editingItem.id
                        ? {
                            ...item,
                            name: value.name,
                            dataValue: value.dataValue,
                            description: value.description,
                            sort: value.sort,
                            enabled: value.enabled,
                        }
                        : item,
                )
                .sort((a, b) => a.sort - b.sort);
            onUpdateItems(dictType.id, nextItems);
            showToast('字典项保存成功', 'success');
            closeForm();
        }
    };

    const handleDelete = () => {
        if (!deleteTarget) return;
        const nextItems = items.filter((item) => item.id !== deleteTarget.id);
        onUpdateItems(dictType.id, nextItems);
        showToast('字典项已删除', 'success');
        setDeleteTarget(null);
    };

    const handleToggleEnabled = (item: DictItemRecord) => {
        const willEnable = !item.enabled;
        const nextItems = items.map((i) =>
            i.id === item.id ? { ...i, enabled: willEnable } : i,
        );
        onUpdateItems(dictType.id, nextItems);
        showToast(
            willEnable ? `"${item.name}"已启用` : `"${item.name}"已停用`,
            'success',
        );
    };

    const handleMaskMouseDown = () => {
        onClose();
    };

    const totalPages = pagination.totalPages;
    const visiblePages = Array.from({ length: totalPages }, (_, i) => i + 1);

    return createPortal(
        <div className="dm-item-panel-mask" role="presentation" onMouseDown={handleMaskMouseDown}>
            <div
                className="dm-item-panel"
                role="dialog"
                aria-modal="true"
                onMouseDown={(event) => event.stopPropagation()}
            >
                {/* ── Head ── */}
                <div className="dm-item-panel__head">
                    <h3>字典列表 - {dictType.name}</h3>
                    <button type="button" className="dm-item-panel__close" onClick={onClose} aria-label="关闭">×</button>
                </div>

                {/* ── Body ── */}
                <div className="dm-item-panel__body">
                    {/* Filter */}
                    <div className="dm-item-filter-row">
                        <div className="pm-filter-field">
                            <span className="pm-filter-label">名称：</span>
                            <ClearableInput
                                type="text"
                                className="pm-filter-input"
                                placeholder="请输入名称"
                                value={draftName}
                                onChange={(e) => setDraftName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSearch();
                                }}
                            />
                        </div>
                        <div className="dm-item-filter-actions">
                            <button type="button" className="pm-btn pm-btn-primary" onClick={handleSearch}>
                                <Search size={14} />
                                搜索
                            </button>
                            <button type="button" className="pm-btn pm-btn-ghost" onClick={handleReset}>
                                重置
                            </button>
                        </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 8 }}>
                        <button type="button" className="pm-btn pm-btn-primary" onClick={openAddForm}>
                            <Plus size={14} />
                            新增
                        </button>
                    </div>

                    {/* Table */}
                    <div className="dm-item-table-wrap">
                        <table className="dm-item-table">
                            <thead>
                                <tr>
                                    <th style={{ width: 56 }}>序号</th>
                                    <th>名称</th>
                                    <th>数据值</th>
                                    <th style={{ width: 80 }}>启用</th>
                                    <th style={{ width: 120 }}>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pagination.items.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted, #8c9bab)', padding: '24px 12px' }}>
                                            暂无数据
                                        </td>
                                    </tr>
                                ) : (
                                    pagination.items.map((item, idx) => {
                                        const serial = (pagination.currentPage - 1) * pageSize + idx + 1;
                                        return (
                                            <tr key={item.id}>
                                                <td>{serial}</td>
                                                <td>{item.name}</td>
                                                <td>{item.dataValue}</td>
                                                <td>
                                                    <div className="dm-item-enabled">
                                                        <button
                                                            type="button"
                                                            className={`dm-item-toggle ${item.enabled ? 'is-on' : ''}`}
                                                            onClick={() => handleToggleEnabled(item)}
                                                            aria-pressed={item.enabled}
                                                            aria-label={item.enabled ? '启用' : '禁用'}
                                                        />
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="dm-item-actions">
                                                        <button type="button" onClick={() => openEditForm(item)}>
                                                            编辑
                                                        </button>
                                                        <span style={{ color: 'var(--border, #e8edf3)' }}>|</span>
                                                        <button type="button" onClick={() => setDeleteTarget(item)}>
                                                            删除
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="dm-item-pagination">
                        <span className="dm-item-pagination__total">共 {pagination.total} 条记录</span>
                        <div className="dm-item-pagination__controls">
                            <button
                                type="button"
                                className="dm-item-pagination__btn"
                                disabled={currentPage <= 1}
                                onClick={() => setCurrentPage((p) => p - 1)}
                            >
                                {'<'}
                            </button>
                            {visiblePages.map((p) => (
                                <button
                                    key={p}
                                    type="button"
                                    className={`dm-item-pagination__btn ${p === pagination.currentPage ? 'dm-item-pagination__btn--active' : ''}`}
                                    onClick={() => setCurrentPage(p)}
                                >
                                    {p}
                                </button>
                            ))}
                            <button
                                type="button"
                                className="dm-item-pagination__btn"
                                disabled={currentPage >= totalPages}
                                onClick={() => setCurrentPage((p) => p + 1)}
                            >
                                {'>'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Item Form Dialog ── */}
            <DictItemFormDialog
                open={formMode !== null}
                mode={formMode === 'edit' ? 'edit' : 'add'}
                initialValue={editingItem ?? undefined}
                onClose={closeForm}
                onSubmit={handleSubmit}
            />

            {/* ── Delete Confirm ── */}
            {deleteTarget ? (
                <ConfirmDialog
                    title="删除字典项"
                    message={`确定删除字典项"${deleteTarget.name}"吗？删除后不可恢复。`}
                    onClose={() => setDeleteTarget(null)}
                    onConfirm={handleDelete}
                />
            ) : null}

            {/* ── Toast ── */}
            <IotToast toast={toast} />
        </div>,
        document.body,
    );
}
