import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import AppShell from '../components/AppShell';
import SystemManagementSidebar, { type SystemManagementPageId } from '../components/SystemManagementSidebar';
import ListPagination from '../components/ListPagination';
import AnnouncementFormDialog, { type AnnouncementFormValue } from '../components/AnnouncementFormDialog';
import ElSelect from '../components/ElSelect';
import { ConfirmDialog } from '../components/IotDialogs';
import IotToast, { type IotToastData, type IotToastType, triggerIotToast } from '../components/IotToast';
import {
    ANNOUNCEMENT_TYPE_OPTIONS,
    filterAnnouncements,
    formatAnnouncementNow,
    generateAnnouncementId,
    type AnnouncementType,
    type SystemAnnouncementRecord,
} from '../data/systemAnnouncements';
import { getPlatformSessionUser } from '../data/platformSession';
import { paginateItems } from '../utils/listPagination';
import '../device-access.css';
import '../product-management.css';
import '../notice-announcement.css';
import ClearableInput from '../components/ClearableInput';
import { useAnnouncementNotifications } from '../components/AnnouncementNotificationContext';

type FormMode = 'add' | 'edit' | null;

type NoticeAnnouncementPageProps = {
    onNavigateHome: () => void;
    onNavigateDeviceAccess: () => void;
    onNavigateMessageCenter: () => void;
    onNavigate: (pageId: SystemManagementPageId) => void;
};

function TypeTag({ type }: { type: AnnouncementType }) {
    const cls = type === '通知' ? 'na-type-tag--notice' : 'na-type-tag--announcement';
    return <span className={`na-type-tag ${cls}`}>{type}</span>;
}

function StatusTag({ status }: { status: SystemAnnouncementRecord['status'] }) {
    const cls = status === '发布' ? 'na-status-tag--published' : 'na-status-tag--draft';
    return <span className={`na-status-tag ${cls}`}>{status}</span>;
}

export default function NoticeAnnouncementPage({
    onNavigateHome,
    onNavigateDeviceAccess,
    onNavigateMessageCenter,
    onNavigate,
}: NoticeAnnouncementPageProps) {
    const {
        announcements,
        setAnnouncements,
        notifyAnnouncementPublished,
    } = useAnnouncementNotifications();
    const [draftTitle, setDraftTitle] = useState('');
    const [draftOperator, setDraftOperator] = useState('');
    const [draftType, setDraftType] = useState('全部');
    const [appliedTitle, setAppliedTitle] = useState('');
    const [appliedOperator, setAppliedOperator] = useState('');
    const [appliedType, setAppliedType] = useState('全部');

    const [pageSize, setPageSize] = useState('20');
    const [currentPage, setCurrentPage] = useState(1);
    const [jumpPage, setJumpPage] = useState('1');

    const [formMode, setFormMode] = useState<FormMode>(null);
    const [editingAnnouncement, setEditingAnnouncement] = useState<SystemAnnouncementRecord | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<SystemAnnouncementRecord | null>(null);
    const [toast, setToast] = useState<IotToastData | null>(null);

    const showToast = (message: string, type: IotToastType = 'warning') => {
        triggerIotToast(setToast, message, type);
    };

    const filtered = useMemo(
        () => filterAnnouncements(announcements, appliedTitle, appliedOperator, appliedType),
        [announcements, appliedTitle, appliedOperator, appliedType],
    );

    const pagination = useMemo(
        () => paginateItems(filtered, currentPage, Number(pageSize)),
        [filtered, currentPage, pageSize],
    );

    useEffect(() => {
        setCurrentPage(1);
        setJumpPage('1');
    }, [appliedTitle, appliedOperator, appliedType, pageSize]);

    useEffect(() => {
        setJumpPage(String(pagination.currentPage));
    }, [pagination.currentPage]);

    const handleSearch = () => {
        setAppliedTitle(draftTitle.trim());
        setAppliedOperator(draftOperator.trim());
        setAppliedType(draftType);
        setCurrentPage(1);
        setJumpPage('1');
    };

    const handleReset = () => {
        setDraftTitle('');
        setDraftOperator('');
        setDraftType('全部');
        setAppliedTitle('');
        setAppliedOperator('');
        setAppliedType('全部');
        setCurrentPage(1);
        setJumpPage('1');
    };

    const openAddDialog = () => {
        setEditingAnnouncement(null);
        setFormMode('add');
    };

    const openEditDialog = (record: SystemAnnouncementRecord) => {
        setEditingAnnouncement(record);
        setFormMode('edit');
    };

    const closeFormDialog = () => {
        setFormMode(null);
        setEditingAnnouncement(null);
    };

    const handleSubmit = (value: AnnouncementFormValue) => {
        const sessionUser = getPlatformSessionUser();

        if (formMode === 'add') {
            const next: SystemAnnouncementRecord = {
                id: generateAnnouncementId(),
                title: value.title,
                type: value.type as AnnouncementType,
                status: value.status,
                content: value.content,
                creator: sessionUser.account,
                createdAt: formatAnnouncementNow(),
            };
            setAnnouncements((prev) => [next, ...prev]);
            if (value.status === '发布') {
                notifyAnnouncementPublished(next.id);
            }
            showToast('公告新增成功', 'success');
            closeFormDialog();
            return;
        }

        if (formMode === 'edit' && editingAnnouncement) {
            const wasDraft = editingAnnouncement.status === '草稿';
            setAnnouncements((prev) => prev.map((item) =>
                item.id === editingAnnouncement.id
                    ? {
                        ...item,
                        title: value.title,
                        type: value.type as AnnouncementType,
                        status: value.status,
                        content: value.content,
                    }
                    : item,
            ));
            if (value.status === '发布' && wasDraft) {
                notifyAnnouncementPublished(editingAnnouncement.id);
            }
            showToast('公告保存成功', 'success');
            closeFormDialog();
        }
    };

    const handleDelete = () => {
        if (!deleteTarget) return;
        setAnnouncements((prev) => prev.filter((item) => item.id !== deleteTarget.id));
        showToast('公告已删除', 'success');
        setDeleteTarget(null);
    };

    const handlePublish = (record: SystemAnnouncementRecord) => {
        setAnnouncements((prev) => prev.map((item) =>
            item.id === record.id
                ? { ...item, status: '发布' as const }
                : item,
        ));
        notifyAnnouncementPublished(record.id);
        showToast('公告已发布', 'success');
    };

    const typeFilterOptions = ANNOUNCEMENT_TYPE_OPTIONS.map((item) => ({ label: item, value: item }));

    const sidebar = (
        <SystemManagementSidebar
            pageId="notice-announcement"
            onNavigate={onNavigate}
            onUnavailable={(label) => showToast(`${label}功能开发中`)}
        />
    );

    return (
        <AppShell
            activeTopTab="系统管理"
            sidebar={sidebar}
            onNavigateMessageCenter={onNavigateMessageCenter}
            onNavigateSystemManagement={() => onNavigate('notice-announcement')}
            onTopTabChange={(tab) => {
                if (tab === '设备接入') onNavigateDeviceAccess();
                if (tab === '消息中心') onNavigateMessageCenter();
            }}
        >
            <div className="na-page">
                <div className="crumb">系统管理 / 通知公告</div>

                <section className="panel na-filter-panel">
                    <div className="na-filter-row">
                        <div className="pm-filter-field">
                            <span className="pm-filter-label">公告标题</span>
                            <ClearableInput
                                type="text"
                                className="pm-filter-input"
                                placeholder="请输入公告标题"
                                value={draftTitle}
                                onChange={(event) => setDraftTitle(event.target.value)}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter') handleSearch();
                                }}
                            />
                        </div>
                        <div className="pm-filter-field">
                            <span className="pm-filter-label">操作人员</span>
                            <ClearableInput
                                type="text"
                                className="pm-filter-input"
                                placeholder="请输入操作人员"
                                value={draftOperator}
                                onChange={(event) => setDraftOperator(event.target.value)}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter') handleSearch();
                                }}
                            />
                        </div>
                        <div className="pm-filter-field">
                            <span className="pm-filter-label">公告类型</span>
                            <ElSelect
                                className="el-select--medium"
                                size="medium"
                                value={draftType}
                                options={typeFilterOptions}
                                onChange={(value) => setDraftType(value)}
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

                <section className="panel na-table-panel">
                    <div className="na-table-head">
                        <h3>通知公告</h3>
                        <button type="button" className="pm-btn pm-btn-primary" onClick={openAddDialog}>
                            <Plus size={14} />
                            新增
                        </button>
                    </div>

                    <div className="na-table-wrap">
                        <table className="na-table">
                            <thead>
                                <tr>
                                    <th style={{ width: 64 }}>序号</th>
                                    <th>公告标题</th>
                                    <th>公告类型</th>
                                    <th>状态</th>
                                    <th>创建者</th>
                                    <th>创建时间</th>
                                    <th style={{ width: 140 }}>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pagination.items.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px 12px' }}>
                                            暂无数据
                                        </td>
                                    </tr>
                                ) : (
                                    pagination.items.map((item, idx) => {
                                        const serial = (pagination.currentPage - 1) * Number(pageSize) + idx + 1;
                                        return (
                                            <tr key={item.id}>
                                                <td>{serial}</td>
                                                <td>{item.title}</td>
                                                <td><TypeTag type={item.type} /></td>
                                                <td><StatusTag status={item.status} /></td>
                                                <td>{item.creator}</td>
                                                <td>{item.createdAt}</td>
                                                <td>
                                                    <div className="na-table-actions">
                                                        <button type="button" onClick={() => openEditDialog(item)}>
                                                            编辑
                                                        </button>
                                                        {item.status === '草稿' && (
                                                            <button type="button" onClick={() => handlePublish(item)}>
                                                                发布
                                                            </button>
                                                        )}
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

            <AnnouncementFormDialog
                open={formMode !== null}
                mode={formMode === 'edit' ? 'edit' : 'add'}
                initialValue={editingAnnouncement ?? undefined}
                onClose={closeFormDialog}
                onSubmit={handleSubmit}
            />

            {deleteTarget ? (
                <ConfirmDialog
                    title="删除公告"
                    message={`确定删除公告「${deleteTarget.title}」吗？删除后不可恢复。`}
                    onClose={() => setDeleteTarget(null)}
                    onConfirm={handleDelete}
                />
            ) : null}

            <IotToast toast={toast} />
        </AppShell>
    );
}
