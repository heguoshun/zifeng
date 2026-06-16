import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import AppShell from '../components/AppShell';
import MessageCenterSidebar, { type MessageCenterPageId } from '../components/MessageCenterSidebar';
import ElSelect from '../components/ElSelect';
import ListPagination from '../components/ListPagination';
import PushSourceFormDrawer from '../components/PushSourceFormDrawer';
import PushSourceConfigDrawer from '../components/PushSourceConfigDrawer';
import PushSourceRecipientDrawer from '../components/PushSourceRecipientDrawer';
import { ConfirmDialog } from '../components/IotDialogs';
import IotToast, { type IotToastData, type IotToastType, triggerIotToast } from '../components/IotToast';
import {
    PUSH_SOURCE_MESSAGE_TYPE_FILTER_OPTIONS,
    formatPushSourceNow,
    generatePushSourceId,
    getMessageTypeLabel,
    getPlatformLabel,
    toPushSourceFormValue,
    type PushSourceFormValue,
    type PushSourceRecord,
} from '../data/pushSources';
import { paginateItems } from '../utils/listPagination';
import '../device-access.css';
import '../product-management.css';
import '../product-category.css';
import '../push-source-config.css';

type FormMode = 'add' | 'edit' | null;

type PushSourceConfigPageProps = {
    pushSources: PushSourceRecord[];
    onUpdatePushSources: React.Dispatch<React.SetStateAction<PushSourceRecord[]>>;
    onNavigateHome: () => void;
    onNavigateDeviceAccess: () => void;
    onNavigate: (pageId: MessageCenterPageId) => void;
};

export default function PushSourceConfigPage({
    pushSources,
    onUpdatePushSources,
    onNavigateHome,
    onNavigateDeviceAccess,
    onNavigate,
}: PushSourceConfigPageProps) {
    const [draftMessageType, setDraftMessageType] = useState('all');
    const [draftKeyword, setDraftKeyword] = useState('');
    const [messageTypeFilter, setMessageTypeFilter] = useState('all');
    const [keyword, setKeyword] = useState('');
    const [pageSize, setPageSize] = useState('10');
    const [currentPage, setCurrentPage] = useState(1);
    const [jumpPage, setJumpPage] = useState('1');
    const [formMode, setFormMode] = useState<FormMode>(null);
    const [editingRecord, setEditingRecord] = useState<PushSourceRecord | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<PushSourceRecord | null>(null);
    const [configTarget, setConfigTarget] = useState<PushSourceRecord | null>(null);
    const [recipientTarget, setRecipientTarget] = useState<PushSourceRecord | null>(null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [toast, setToast] = useState<IotToastData | null>(null);

    const showToast = (message: string, type: IotToastType = 'warning') => {
        triggerIotToast(setToast, message, type);
    };

    const filteredRecords = useMemo(() => {
        const normalizedKeyword = keyword.trim().toLowerCase();
        return pushSources.filter((item) => {
            const matchesType = messageTypeFilter === 'all' || item.messageType === messageTypeFilter;
            const matchesKeyword = !normalizedKeyword || item.name.toLowerCase().includes(normalizedKeyword);
            return matchesType && matchesKeyword;
        });
    }, [pushSources, messageTypeFilter, keyword]);

    const pagination = useMemo(
        () => paginateItems(filteredRecords, currentPage, Number(pageSize)),
        [filteredRecords, currentPage, pageSize],
    );

    useEffect(() => {
        setCurrentPage(1);
        setJumpPage('1');
    }, [messageTypeFilter, keyword, pageSize]);

    useEffect(() => {
        setJumpPage(String(pagination.currentPage));
    }, [pagination.currentPage]);

    const allPageSelected = pagination.items.length > 0
        && pagination.items.every((record) => selectedIds.includes(record.id));

    const toggleSelect = (id: string) => {
        setSelectedIds((prev) => (
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        ));
    };

    const toggleSelectAll = () => {
        const pageIds = pagination.items.map((record) => record.id);
        if (allPageSelected) {
            setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
            return;
        }
        setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    };

    const openAddDrawer = () => {
        setEditingRecord(null);
        setFormMode('add');
    };

    const openEditDrawer = (record: PushSourceRecord) => {
        setEditingRecord(record);
        setFormMode('edit');
    };

    const closeFormDrawer = () => {
        setFormMode(null);
        setEditingRecord(null);
    };

    const handleSearch = () => {
        setMessageTypeFilter(draftMessageType);
        setKeyword(draftKeyword.trim());
        setCurrentPage(1);
        setJumpPage('1');
    };

    const handleReset = () => {
        setDraftMessageType('all');
        setDraftKeyword('');
        setMessageTypeFilter('all');
        setKeyword('');
        setCurrentPage(1);
        setJumpPage('1');
    };

    const handleSubmit = (value: PushSourceFormValue) => {
        if (formMode === 'add') {
            const createdAt = formatPushSourceNow();
            const next: PushSourceRecord = {
                id: generatePushSourceId(),
                name: value.name,
                platform: value.platform as PushSourceRecord['platform'],
                messageType: value.messageType as PushSourceRecord['messageType'],
                createdAt,
                configItems: [],
                recipientUserIds: [],
            };
            onUpdatePushSources((prev) => [next, ...prev]);
            showToast('推送源新增成功', 'success');
            closeFormDrawer();
            return;
        }

        if (formMode === 'edit' && editingRecord) {
            onUpdatePushSources((prev) => prev.map((item) => (
                item.id === editingRecord.id
                    ? {
                        ...item,
                        name: value.name,
                        platform: value.platform as PushSourceRecord['platform'],
                        messageType: value.messageType as PushSourceRecord['messageType'],
                    }
                    : item
            )));
            showToast('推送源保存成功', 'success');
            closeFormDrawer();
        }
    };

    const handleDelete = () => {
        if (!deleteTarget) return;
        onUpdatePushSources((prev) => prev.filter((item) => item.id !== deleteTarget.id));
        setSelectedIds((prev) => prev.filter((id) => id !== deleteTarget.id));
        setDeleteTarget(null);
        showToast('推送源已删除', 'success');
    };

    const handleConfigConfirm = (configItems: PushSourceRecord['configItems']) => {
        if (!configTarget) return;
        onUpdatePushSources((prev) => prev.map((item) => (
            item.id === configTarget.id ? { ...item, configItems } : item
        )));
        setConfigTarget(null);
        showToast('配置项保存成功', 'success');
    };

    const handleRecipientConfirm = (recipientUserIds: string[]) => {
        if (!recipientTarget) return;
        onUpdatePushSources((prev) => prev.map((item) => (
            item.id === recipientTarget.id ? { ...item, recipientUserIds } : item
        )));
        setRecipientTarget(null);
        showToast('接受人配置已保存', 'success');
    };

    const handleExport = () => {
        showToast('导出成功', 'success');
    };

    const sidebar = <MessageCenterSidebar pageId="push-source-config" onNavigate={onNavigate} />;

    return (
        <AppShell
            activeTopTab="消息中心"
            sidebar={sidebar}
            onTopTabChange={(tab) => {
                if (tab === '设备接入') onNavigateDeviceAccess();
            }}
        >
            <div className="pm-page psc-page">
                <div className="crumb">消息中心 / 推送源配置</div>

                <section className="panel pm-filter-panel">
                    <div className="pm-filter-row">
                        <label className="pm-filter-field">
                            <span className="pm-filter-label">消息类型</span>
                            <ElSelect
                                className="el-select--medium"
                                size="medium"
                                value={draftMessageType}
                                options={PUSH_SOURCE_MESSAGE_TYPE_FILTER_OPTIONS}
                                onChange={setDraftMessageType}
                            />
                        </label>
                        <label className="pm-filter-field">
                            <span className="pm-filter-label">搜索</span>
                            <input
                                type="text"
                                className="pm-filter-input"
                                placeholder="请输入推送源名称"
                                value={draftKeyword}
                                onChange={(event) => setDraftKeyword(event.target.value)}
                            />
                        </label>
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

                <section className="panel pm-list-panel">
                    <div className="pm-section-head">
                        <h3>推送源列表</h3>
                        <div className="psc-table-head-actions">
                            <button type="button" className="pm-btn pm-btn-primary" onClick={openAddDrawer}>
                                <Plus size={14} />
                                新增
                            </button>
                            <button type="button" className="pm-btn pm-btn-ghost" onClick={handleExport}>
                                导出
                            </button>
                        </div>
                    </div>

                    <div className="pm-table-wrap">
                        <table className="pm-table psc-main-table">
                            <thead>
                                <tr>
                                    <th className="psc-table__check">
                                        <input
                                            type="checkbox"
                                            checked={allPageSelected}
                                            onChange={toggleSelectAll}
                                            aria-label="全选当前页"
                                        />
                                    </th>
                                    <th className="psc-table__index">序号</th>
                                    <th>ID</th>
                                    <th>名称</th>
                                    <th>推送源</th>
                                    <th>消息类型</th>
                                    <th>创建时间</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pagination.items.map((record, index) => (
                                    <tr key={record.id}>
                                        <td className="psc-table__check">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(record.id)}
                                                onChange={() => toggleSelect(record.id)}
                                                aria-label={`选择${record.name}`}
                                            />
                                        </td>
                                        <td className="psc-table__index">{(pagination.currentPage - 1) * Number(pageSize) + index + 1}</td>
                                        <td>{record.id}</td>
                                        <td>{record.name}</td>
                                        <td>{getPlatformLabel(record.platform)}</td>
                                        <td>{getMessageTypeLabel(record.messageType)}</td>
                                        <td>{record.createdAt}</td>
                                        <td>
                                            <div className="pm-table-actions">
                                                <button type="button" onClick={() => openEditDrawer(record)}>编辑</button>
                                                <button type="button" onClick={() => setRecipientTarget(record)}>接受人</button>
                                                <button type="button" onClick={() => setConfigTarget(record)}>配置</button>
                                                <button type="button" onClick={() => setDeleteTarget(record)}>删除</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {!pagination.items.length && (
                                    <tr>
                                        <td colSpan={8} className="pc-empty-cell">暂无推送源数据</td>
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

            <PushSourceFormDrawer
                open={formMode !== null}
                mode={formMode === 'edit' ? 'edit' : 'add'}
                initialValue={editingRecord ? toPushSourceFormValue(editingRecord) : undefined}
                onClose={closeFormDrawer}
                onSubmit={handleSubmit}
            />

            <PushSourceConfigDrawer
                open={configTarget !== null}
                configItems={configTarget?.configItems ?? []}
                onClose={() => setConfigTarget(null)}
                onConfirm={handleConfigConfirm}
            />

            <PushSourceRecipientDrawer
                open={recipientTarget !== null}
                selectedUserIds={recipientTarget?.recipientUserIds ?? []}
                onClose={() => setRecipientTarget(null)}
                onConfirm={handleRecipientConfirm}
            />

            {deleteTarget ? (
                <ConfirmDialog
                    title="删除推送源"
                    message={`确定删除推送源「${deleteTarget.name}」吗？`}
                    onClose={() => setDeleteTarget(null)}
                    onConfirm={handleDelete}
                />
            ) : null}

            <IotToast toast={toast} />
        </AppShell>
    );
}
