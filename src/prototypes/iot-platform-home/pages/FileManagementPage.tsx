import React, { useEffect, useMemo, useState } from 'react';
import { FileText, Search, Upload } from 'lucide-react';
import AppShell from '../components/AppShell';
import Breadcrumb from '../components/Breadcrumb';
import SystemManagementSidebar, { type SystemManagementPageId } from '../components/SystemManagementSidebar';
import ListPagination from '../components/ListPagination';
import FileUploadDrawer from '../components/FileUploadDrawer';
import { ConfirmDialog } from '../components/IotDialogs';
import IotToast, { type IotToastData, type IotToastType, triggerIotToast } from '../components/IotToast';
import {
    createSystemFileFromUpload,
    filterSystemFiles,
    type SystemFileRecord,
} from '../data/systemFiles';
import { getPlatformSessionUser } from '../data/platformSession';
import { paginateItems } from '../utils/listPagination';
import { handleSelectableRowClick } from '../../../common/selectableRow';
import '../device-access.css';
import '../product-management.css';
import '../file-management.css';
import ClearableInput from '../components/ClearableInput';

type FileManagementPageProps = {
    files: SystemFileRecord[];
    onUpdateFiles: React.Dispatch<React.SetStateAction<SystemFileRecord[]>>;
    onNavigateHome: () => void;
    onNavigateDeviceAccess: () => void;
    onNavigateMessageCenter: () => void;
    onNavigate: (pageId: SystemManagementPageId) => void;
};

function FilePreviewCell({ file }: { file: SystemFileRecord }) {
    if (file.previewType === 'image') {
        return (
            <span className="fm-file-preview">
                <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
                    <rect x="3" y="5" width="18" height="14" rx="2" fill="#e6f4ff" stroke="#91caff" />
                    <circle cx="9" cy="10" r="2" fill="#69b1ff" />
                    <path d="M3 16l5-5 4 4 3-3 6 6" stroke="#4096ff" strokeWidth="1.5" fill="none" />
                </svg>
            </span>
        );
    }

    return (
        <span className="fm-file-preview">
            <FileText size={22} aria-hidden="true" />
        </span>
    );
}

export default function FileManagementPage({
    files,
    onUpdateFiles,
    onNavigateHome,
    onNavigateDeviceAccess,
    onNavigateMessageCenter,
    onNavigate,
}: FileManagementPageProps) {
    const [draftFileName, setDraftFileName] = useState('');
    const [draftOriginalName, setDraftOriginalName] = useState('');
    const [draftSuffix, setDraftSuffix] = useState('');
    const [appliedFileName, setAppliedFileName] = useState('');
    const [appliedOriginalName, setAppliedOriginalName] = useState('');
    const [appliedSuffix, setAppliedSuffix] = useState('');

    const [pageSize, setPageSize] = useState('20');
    const [currentPage, setCurrentPage] = useState(1);
    const [jumpPage, setJumpPage] = useState('1');

    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [uploadOpen, setUploadOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<SystemFileRecord | null>(null);
    const [toast, setToast] = useState<IotToastData | null>(null);

    const showToast = (message: string, type: IotToastType = 'warning') => {
        triggerIotToast(setToast, message, type);
    };

    const filtered = useMemo(
        () => filterSystemFiles(files, appliedFileName, appliedOriginalName, appliedSuffix),
        [files, appliedFileName, appliedOriginalName, appliedSuffix],
    );

    const pagination = useMemo(
        () => paginateItems(filtered, currentPage, Number(pageSize)),
        [filtered, currentPage, pageSize],
    );

    const pageIds = useMemo(
        () => new Set(pagination.items.map((item) => item.id)),
        [pagination.items],
    );

    const allPageSelected = pagination.items.length > 0
        && pagination.items.every((item) => selectedIds.has(item.id));

    useEffect(() => {
        setCurrentPage(1);
        setJumpPage('1');
    }, [appliedFileName, appliedOriginalName, appliedSuffix, pageSize]);

    useEffect(() => {
        setJumpPage(String(pagination.currentPage));
    }, [pagination.currentPage]);

    useEffect(() => {
        setSelectedIds((prev) => {
            const next = new Set([...prev].filter((id) => pageIds.has(id)));
            return next.size === prev.size ? prev : next;
        });
    }, [pageIds]);

    const handleSearch = () => {
        setAppliedFileName(draftFileName.trim());
        setAppliedOriginalName(draftOriginalName.trim());
        setAppliedSuffix(draftSuffix.trim());
        setCurrentPage(1);
        setJumpPage('1');
    };

    const handleReset = () => {
        setDraftFileName('');
        setDraftOriginalName('');
        setDraftSuffix('');
        setAppliedFileName('');
        setAppliedOriginalName('');
        setAppliedSuffix('');
        setCurrentPage(1);
        setJumpPage('1');
    };

    const toggleSelectAll = () => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (allPageSelected) {
                pagination.items.forEach((item) => next.delete(item.id));
            } else {
                pagination.items.forEach((item) => next.add(item.id));
            }
            return next;
        });
    };

    const toggleSelectRow = (id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const handleUpload = (file: File) => {
        const sessionUser = getPlatformSessionUser();
        const next = createSystemFileFromUpload(file, sessionUser.account);
        onUpdateFiles((prev) => [next, ...prev]);
        setUploadOpen(false);
        showToast('文件上传成功', 'success');
    };

    const handleDownload = (file: SystemFileRecord) => {
        showToast(`已开始下载「${file.originalName}」`, 'success');
    };

    const handleDelete = () => {
        if (!deleteTarget) return;
        onUpdateFiles((prev) => prev.filter((item) => item.id !== deleteTarget.id));
        setSelectedIds((prev) => {
            const next = new Set(prev);
            next.delete(deleteTarget.id);
            return next;
        });
        showToast('文件已删除', 'success');
        setDeleteTarget(null);
    };

    const sidebar = (
        <SystemManagementSidebar
            pageId="file-mgmt"
            onNavigate={onNavigate}
            onUnavailable={(label) => showToast(`${label}功能开发中`)}
        />
    );

    return (
        <AppShell
            activeTopTab="系统管理"
            sidebar={sidebar}
            onNavigateMessageCenter={onNavigateMessageCenter}
            onNavigateSystemManagement={() => onNavigate('file-mgmt')}
            onTopTabChange={(tab) => {
                if (tab === '设备接入') onNavigateDeviceAccess();
                if (tab === '消息中心') onNavigateMessageCenter();
            }}
        >
            <div className="fm-page">
                <Breadcrumb items={[
                                    { label: '系统管理', pageId: 'tenant-mgmt' },
                                    { label: '文件管理' },
                                ]} onNavigate={(id) => onNavigate(id as SystemManagementPageId)} />

                <section className="panel fm-filter-panel">
                    <div className="fm-filter-row">
                        <div className="pm-filter-field">
                            <span className="pm-filter-label">文件名</span>
                            <ClearableInput
                                type="text"
                                className="pm-filter-input"
                                placeholder="请输入文件名"
                                value={draftFileName}
                                onChange={(event) => setDraftFileName(event.target.value)}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter') handleSearch();
                                }}
                            />
                        </div>
                        <div className="pm-filter-field">
                            <span className="pm-filter-label">原名</span>
                            <ClearableInput
                                type="text"
                                className="pm-filter-input"
                                placeholder="请输入原名"
                                value={draftOriginalName}
                                onChange={(event) => setDraftOriginalName(event.target.value)}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter') handleSearch();
                                }}
                            />
                        </div>
                        <div className="pm-filter-field">
                            <span className="pm-filter-label">文件后缀</span>
                            <ClearableInput
                                type="text"
                                className="pm-filter-input"
                                placeholder="请输入文件后缀"
                                value={draftSuffix}
                                onChange={(event) => setDraftSuffix(event.target.value)}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter') handleSearch();
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

                <section className="panel fm-table-panel">
                    <div className="fm-table-head">
                        <h3>文件管理</h3>
                        <button type="button" className="pm-btn pm-btn-primary" onClick={() => setUploadOpen(true)}>
                            <Upload size={14} />
                            上传文件
                        </button>
                    </div>

                    <div className="fm-table-wrap">
                        <table className="fm-table">
                            <thead>
                                <tr>
                                    <th className="fm-col-check">
                                        <input
                                            type="checkbox"
                                            checked={allPageSelected}
                                            aria-label="全选当前页"
                                            onChange={toggleSelectAll}
                                        />
                                    </th>
                                    <th className="fm-col-index">序号</th>
                                    <th>文件名</th>
                                    <th>原名</th>
                                    <th>文件后缀</th>
                                    <th className="fm-col-preview">文件展示</th>
                                    <th>创建时间</th>
                                    <th>上传人</th>
                                    <th>服务商</th>
                                    <th className="fm-col-actions">操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pagination.items.length === 0 ? (
                                    <tr>
                                        <td colSpan={10} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px 12px' }}>
                                            暂无数据
                                        </td>
                                    </tr>
                                ) : (
                                    pagination.items.map((item, idx) => {
                                        const serial = (pagination.currentPage - 1) * Number(pageSize) + idx + 1;
                                        return (
                                            <tr
                                                key={item.id}
                                                className="iot-selectable-row"
                                                onClick={(event) => handleSelectableRowClick(
                                                    event,
                                                    () => toggleSelectRow(item.id),
                                                )}
                                            >
                                                <td className="fm-col-check">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedIds.has(item.id)}
                                                        aria-label={`选择${item.originalName}`}
                                                        onChange={() => toggleSelectRow(item.id)}
                                                    />
                                                </td>
                                                <td className="fm-col-index">{serial}</td>
                                                <td title={item.fileName}>{item.fileName}</td>
                                                <td title={item.originalName}>{item.originalName}</td>
                                                <td>{item.suffix}</td>
                                                <td className="fm-col-preview">
                                                    <FilePreviewCell file={item} />
                                                </td>
                                                <td>{item.createdAt}</td>
                                                <td>{item.uploader}</td>
                                                <td>{item.provider}</td>
                                                <td className="fm-col-actions">
                                                    <div className="fm-table-actions">
                                                        <button type="button" onClick={() => handleDownload(item)}>
                                                            下载
                                                        </button>
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

            <FileUploadDrawer
                open={uploadOpen}
                onClose={() => setUploadOpen(false)}
                onConfirm={handleUpload}
            />

            {deleteTarget ? (
                <ConfirmDialog
                    title="删除文件"
                    message={`确定删除文件「${deleteTarget.originalName}」吗？删除后不可恢复。`}
                    onClose={() => setDeleteTarget(null)}
                    onConfirm={handleDelete}
                />
            ) : null}

            <IotToast toast={toast} />
        </AppShell>
    );
}
