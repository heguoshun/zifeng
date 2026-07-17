import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import AppShell from '../components/AppShell';
import Breadcrumb from '../components/Breadcrumb';
import SystemManagementSidebar, { type SystemManagementPageId } from '../components/SystemManagementSidebar';
import ListPagination from '../components/ListPagination';
import { ConfirmDialog } from '../components/IotDialogs';
import IotToast, { type IotToastData, type IotToastType, triggerIotToast } from '../components/IotToast';
import DictFormDrawer, { type DictFormValue } from '../components/DictFormDrawer';
import DictItemListPanel from '../components/DictItemListPanel';
import {
    type DictItemRecord,
    type DictTypeRecord,
    generateDictTypeId,
    createInitialDictionaries,
} from '../data/systemDictionaries';
import { paginateItems } from '../utils/listPagination';
import '../device-access.css';
import '../product-management.css';
import '../tenant-management.css';
import '../dict-management.css';
import ClearableInput from '../components/ClearableInput';

type DictFormMode = 'add' | 'edit' | null;

// ── Dictionary Management Page ──

export type DictionaryManagementPageProps = {
    dictionaries: DictTypeRecord[];
    onUpdateDictionaries: React.Dispatch<React.SetStateAction<DictTypeRecord[]>>;
    onNavigateHome: () => void;
    onNavigateDeviceAccess: () => void;
    onNavigateMessageCenter: () => void;
    onNavigate: (pageId: SystemManagementPageId) => void;
};

export default function DictionaryManagementPage({
    dictionaries,
    onUpdateDictionaries,
    onNavigateHome,
    onNavigateDeviceAccess,
    onNavigateMessageCenter,
    onNavigate,
}: DictionaryManagementPageProps) {
    const [draftName, setDraftName] = useState('');
    const [draftCode, setDraftCode] = useState('');
    const [filterName, setFilterName] = useState('');
    const [filterCode, setFilterCode] = useState('');
    const [pageSize, setPageSize] = useState('20');
    const [currentPage, setCurrentPage] = useState(1);
    const [jumpPage, setJumpPage] = useState('1');

    const [formMode, setFormMode] = useState<DictFormMode>(null);
    const [editingDict, setEditingDict] = useState<DictTypeRecord | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<DictTypeRecord | null>(null);
    const [configTarget, setConfigTarget] = useState<DictTypeRecord | null>(null);
    const [toast, setToast] = useState<IotToastData | null>(null);

    const showToast = (message: string, type: IotToastType = 'warning') => {
        triggerIotToast(setToast, message, type);
    };

    // Filter dictionaries
    const filteredDicts = useMemo(() => {
        const nameQ = filterName.trim().toLowerCase();
        const codeQ = filterCode.trim().toLowerCase();
        if (!nameQ && !codeQ) return dictionaries;
        return dictionaries.filter((d) => {
            const matchName = !nameQ || d.name.toLowerCase().includes(nameQ);
            const matchCode = !codeQ || d.code.toLowerCase().includes(codeQ);
            return matchName && matchCode;
        });
    }, [dictionaries, filterName, filterCode]);

    const pagination = useMemo(
        () => paginateItems(filteredDicts, currentPage, Number(pageSize)),
        [filteredDicts, currentPage, pageSize],
    );

    useEffect(() => {
        setCurrentPage(1);
        setJumpPage('1');
    }, [filterName, filterCode, pageSize]);

    useEffect(() => {
        setJumpPage(String(pagination.currentPage));
    }, [pagination.currentPage]);

    // ── Search ──
    const handleSearch = () => {
        setFilterName(draftName.trim());
        setFilterCode(draftCode.trim());
    };

    const handleReset = () => {
        setDraftName('');
        setDraftCode('');
        setFilterName('');
        setFilterCode('');
        setCurrentPage(1);
        setJumpPage('1');
    };

    // ── CRUD (dict type) ──
    const openAddDrawer = () => {
        setEditingDict(null);
        setFormMode('add');
    };

    const openEditDrawer = (dict: DictTypeRecord) => {
        setEditingDict(dict);
        setFormMode('edit');
    };

    const closeFormDrawer = () => {
        setFormMode(null);
        setEditingDict(null);
    };

    const handleSubmit = (value: DictFormValue) => {
        if (formMode === 'add') {
            const next: DictTypeRecord = {
                id: generateDictTypeId(),
                name: value.name,
                code: value.code,
                description: value.description,
                items: [],
            };
            onUpdateDictionaries((prev) => [next, ...prev]);
            showToast('字典新增成功', 'success');
            closeFormDrawer();
            return;
        }

        if (formMode === 'edit' && editingDict) {
            onUpdateDictionaries((prev) =>
                prev.map((d) =>
                    d.id === editingDict.id
                        ? {
                            ...d,
                            name: value.name,
                            description: value.description,
                        }
                        : d,
                ),
            );
            showToast('字典保存成功', 'success');
            closeFormDrawer();
        }
    };

    const handleDelete = () => {
        if (!deleteTarget) return;
        onUpdateDictionaries((prev) => prev.filter((d) => d.id !== deleteTarget.id));
        showToast('字典已删除', 'success');
        setDeleteTarget(null);
    };

    // ── Dict config (items) ──
    const openConfig = (dict: DictTypeRecord) => {
        setConfigTarget(dict);
    };

    const closeConfig = () => {
        setConfigTarget(null);
    };

    const handleUpdateItems = (dictTypeId: string, items: DictItemRecord[]) => {
        onUpdateDictionaries((prev) =>
            prev.map((d) =>
                d.id === dictTypeId ? { ...d, items } : d,
            ),
        );
        // Refresh configTarget to show latest data
        setConfigTarget((prev) => {
            if (prev && prev.id === dictTypeId) {
                return { ...prev, items };
            }
            return prev;
        });
    };

    // ── Sidebar ──
    const sidebar = (
        <SystemManagementSidebar
            pageId="dict-mgmt"
            onNavigate={onNavigate}
            onUnavailable={(label) => showToast(`${label}功能开发中`)}
        />
    );

    // ── Render ──
    return (
        <AppShell
            activeTopTab="系统管理"
            sidebar={sidebar}
            onNavigateMessageCenter={onNavigateMessageCenter}
            onNavigateSystemManagement={() => onNavigate('dict-mgmt')}
            onTopTabChange={(tab) => {
                if (tab === '设备接入') onNavigateDeviceAccess();
                if (tab === '消息中心') onNavigateMessageCenter();
            }}
        >
            <div className="dm-page">
                <Breadcrumb items={[
                                    { label: '系统管理', pageId: 'tenant-mgmt' },
                                    { label: '字典管理' },
                                ]} onNavigate={(id) => onNavigate(id as SystemManagementPageId)} />

                {/* ── Filter ── */}
                <section className="panel dm-filter-panel">
                    <div className="dm-filter-row">
                        <div className="pm-filter-field">
                            <span className="pm-filter-label">字典名称</span>
                            <ClearableInput
                                type="text"
                                className="pm-filter-input"
                                placeholder="请输入字典名称"
                                value={draftName}
                                onChange={(e) => setDraftName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSearch();
                                }}
                            />
                        </div>
                        <div className="pm-filter-field">
                            <span className="pm-filter-label">字典编号</span>
                            <ClearableInput
                                type="text"
                                className="pm-filter-input"
                                placeholder="请输入字典编号"
                                value={draftCode}
                                onChange={(e) => setDraftCode(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSearch();
                                }}
                            />
                        </div>
                        <div className="pm-filter-actions">
                            <button type="button" className="pm-btn pm-btn-primary" onClick={handleSearch}>
                                <Search size={14} />
                                查询
                            </button>
                            <button type="button" className="pm-btn pm-btn-ghost" onClick={handleReset}>
                                重置
                            </button>
                        </div>
                    </div>
                </section>

                {/* ── Table ── */}
                <section className="panel dm-table-panel">
                    <div className="dm-table-head">
                        <h3>字典列表</h3>
                        <div className="dm-table-head-actions">
                            <button type="button" className="pm-btn pm-btn-primary" onClick={openAddDrawer}>
                                <Plus size={14} />
                                添加
                            </button>
                        </div>
                    </div>

                    <div className="dm-table-wrap">
                        <table className="dm-table">
                            <thead>
                                <tr>
                                    <th style={{ width: 64 }}>序号</th>
                                    <th>字典名称</th>
                                    <th>字典编号</th>
                                    <th>描述</th>
                                    <th style={{ width: 200 }}>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pagination.items.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px 12px' }}>
                                            暂无数据
                                        </td>
                                    </tr>
                                ) : (
                                    pagination.items.map((dict, idx) => {
                                        const serial = (pagination.currentPage - 1) * Number(pageSize) + idx + 1;
                                        return (
                                            <tr key={dict.id}>
                                                <td>{serial}</td>
                                                <td>{dict.name}</td>
                                                <td>{dict.code}</td>
                                                <td>{dict.description || '—'}</td>
                                                <td>
                                                    <div className="dm-table-actions">
                                                        <button type="button" onClick={() => openEditDrawer(dict)}>
                                                            编辑
                                                        </button>
                                                        <button type="button" onClick={() => openConfig(dict)}>
                                                            字典配置
                                                        </button>
                                                        <button type="button" onClick={() => setDeleteTarget(dict)}>
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

            {/* ── Form Drawer (add/edit dict type) ── */}
            <DictFormDrawer
                open={formMode !== null}
                mode={formMode === 'edit' ? 'edit' : 'add'}
                initialValue={editingDict ?? undefined}
                onClose={closeFormDrawer}
                onSubmit={handleSubmit}
            />

            {/* ── Dict Item List Panel ── */}
            {configTarget ? (
                <DictItemListPanel
                    dictType={configTarget}
                    onUpdateItems={handleUpdateItems}
                    onClose={closeConfig}
                />
            ) : null}

            {/* ── Delete Confirm ── */}
            {deleteTarget ? (
                <ConfirmDialog
                    title="删除字典"
                    message={`确定删除字典"${deleteTarget.name}"吗？删除后其下所有字典项也将一并删除，且不可恢复。`}
                    onClose={() => setDeleteTarget(null)}
                    onConfirm={handleDelete}
                />
            ) : null}

            {/* ── Toast ── */}
            <IotToast toast={toast} />
        </AppShell>
    );
}

export { createInitialDictionaries };
