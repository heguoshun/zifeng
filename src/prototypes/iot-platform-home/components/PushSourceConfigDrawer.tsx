import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Plus } from 'lucide-react';
import ListPagination from './ListPagination';
import PushSourceConfigItemDrawer, {
    buildConfigItemFromForm,
    toConfigItemFormValue,
    type PushSourceConfigItemFormValue,
} from './PushSourceConfigItemDrawer';
import { ConfirmDialog } from './IotDialogs';
import type { PushSourceConfigItem } from '../data/pushSources';
import { paginateItems } from '../utils/listPagination';
import '../product-create.css';
import '../product-management.css';
import '../product-category.css';
import '../push-source-config.css';

type PushSourceConfigDrawerProps = {
    open: boolean;
    configItems: PushSourceConfigItem[];
    onClose: () => void;
    onConfirm: (items: PushSourceConfigItem[]) => void;
};

type ItemDrawerMode = 'add' | 'edit' | null;

export default function PushSourceConfigDrawer({
    open,
    configItems,
    onClose,
    onConfirm,
}: PushSourceConfigDrawerProps) {
    const [items, setItems] = useState<PushSourceConfigItem[]>(configItems);
    const [pageSize, setPageSize] = useState('10');
    const [currentPage, setCurrentPage] = useState(1);
    const [jumpPage, setJumpPage] = useState('1');
    const [itemDrawerMode, setItemDrawerMode] = useState<ItemDrawerMode>(null);
    const [editingItem, setEditingItem] = useState<PushSourceConfigItem | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<PushSourceConfigItem | null>(null);

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
        setItems(configItems);
        setCurrentPage(1);
        setJumpPage('1');
    }, [open, configItems]);

    const pagination = useMemo(
        () => paginateItems(items, currentPage, Number(pageSize)),
        [items, currentPage, pageSize],
    );

    useEffect(() => {
        setJumpPage(String(pagination.currentPage));
    }, [pagination.currentPage]);

    if (!open) return null;

    const openAddItem = () => {
        setEditingItem(null);
        setItemDrawerMode('add');
    };

    const openEditItem = (item: PushSourceConfigItem) => {
        setEditingItem(item);
        setItemDrawerMode('edit');
    };

    const closeItemDrawer = () => {
        setItemDrawerMode(null);
        setEditingItem(null);
    };

    const handleItemSubmit = (value: PushSourceConfigItemFormValue) => {
        if (itemDrawerMode === 'edit' && editingItem) {
            setItems((prev) => prev.map((item) => (
                item.id === editingItem.id ? buildConfigItemFromForm(value, editingItem) : item
            )));
        } else {
            setItems((prev) => [...prev, buildConfigItemFromForm(value)]);
        }
        closeItemDrawer();
    };

    const handleDeleteItem = () => {
        if (!deleteTarget) return;
        setItems((prev) => prev.filter((item) => item.id !== deleteTarget.id));
        setDeleteTarget(null);
    };

    const handleMaskMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
        if (event.target === event.currentTarget) {
            onClose();
        }
    };

    return createPortal(
        <>
            <div className="pcp-drawer-mask psc-drawer-mask" role="presentation" onMouseDown={handleMaskMouseDown}>
                <aside
                    className="pcp-drawer psc-config-drawer"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="psc-config-drawer-title"
                    onMouseDown={(event) => event.stopPropagation()}
                >
                    <div className="pcp-drawer__head">
                        <h3 id="psc-config-drawer-title">推送源配置</h3>
                        <button type="button" className="pcp-drawer__close" onClick={onClose} aria-label="关闭">×</button>
                    </div>

                    <div className="pcp-drawer__body psc-config-drawer__body">
                        <div className="psc-config-drawer__toolbar">
                            <button type="button" className="pm-btn pm-btn-primary" onClick={openAddItem}>
                                <Plus size={14} />
                                新增
                            </button>
                        </div>

                        <div className="pm-table-wrap psc-config-drawer__table-wrap">
                            <table className="pm-table">
                                <thead>
                                    <tr>
                                        <th>序号</th>
                                        <th>键</th>
                                        <th>名称</th>
                                        <th>值</th>
                                        <th>更新时间</th>
                                        <th>操作</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pagination.items.map((item, index) => (
                                        <tr key={item.id}>
                                            <td>{(pagination.currentPage - 1) * Number(pageSize) + index + 1}</td>
                                            <td>{item.key}</td>
                                            <td>{item.name || '—'}</td>
                                            <td>{item.value || '—'}</td>
                                            <td>{item.updatedAt}</td>
                                            <td>
                                                <div className="pm-table-actions">
                                                    <button type="button" onClick={() => openEditItem(item)}>编辑</button>
                                                    <button type="button" onClick={() => setDeleteTarget(item)}>删除</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {!pagination.items.length && (
                                        <tr>
                                            <td colSpan={6} className="pc-empty-cell">暂无配置项</td>
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
                    </div>

                    <div className="pcp-drawer__foot">
                        <button type="button" className="pm-btn pm-btn-ghost" onClick={onClose}>取消</button>
                        <button type="button" className="pm-btn pm-btn-primary" onClick={() => onConfirm(items)}>确定</button>
                    </div>
                </aside>
            </div>

            <PushSourceConfigItemDrawer
                open={itemDrawerMode !== null}
                mode={itemDrawerMode === 'edit' ? 'edit' : 'add'}
                initialValue={editingItem ? toConfigItemFormValue(editingItem) : undefined}
                onClose={closeItemDrawer}
                onSubmit={handleItemSubmit}
            />

            {deleteTarget ? (
                <ConfirmDialog
                    title="删除配置项"
                    message={`确定删除配置项「${deleteTarget.key}」吗？`}
                    onClose={() => setDeleteTarget(null)}
                    onConfirm={handleDeleteItem}
                />
            ) : null}
        </>,
        document.body,
    );
}
