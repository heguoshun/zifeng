import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import AppShell from '../components/AppShell';
import Breadcrumb from '../components/Breadcrumb';
import DeviceAccessSidebar, { type DeviceAccessPageId } from '../components/DeviceAccessSidebar';
import ElSelect from '../components/ElSelect';
import CertificateFormDrawer from '../components/CertificateFormDrawer';
import ListPagination from '../components/ListPagination';
import { ConfirmDialog } from '../components/IotDialogs';
import IotToast, { type IotToastData, type IotToastType, triggerIotToast } from '../components/IotToast';
import {
    CERTIFICATE_STANDARD_FILTER_OPTIONS,
    formatCertificateNow,
    generateCertificateId,
    toCertificateFormValue,
    type CertificateFormValue,
    type CertificateRecord,
} from '../data/certificates';
import { paginateItems, DEFAULT_LIST_PAGE_SIZE } from '../utils/listPagination';
import '../device-access.css';
import '../product-management.css';
import '../certificate-management.css';
import ClearableInput from '../components/ClearableInput';

type DrawerMode = 'add' | 'edit' | null;

type CertificateManagementPageProps = {
    certificates: CertificateRecord[];
    onUpdateCertificates: React.Dispatch<React.SetStateAction<CertificateRecord[]>>;
    onNavigateHome: () => void;
    onNavigateDeviceAccess: () => void;
    onNavigateMessageCenter: () => void;
    onNavigate: (pageId: DeviceAccessPageId) => void;
};

export default function CertificateManagementPage({
    certificates,
    onUpdateCertificates,
    onNavigateHome,
    onNavigateDeviceAccess,
    onNavigateMessageCenter,
    onNavigate,
}: CertificateManagementPageProps) {
    const [draftStandard, setDraftStandard] = useState('all');
    const [draftName, setDraftName] = useState('');
    const [appliedStandard, setAppliedStandard] = useState('all');
    const [appliedName, setAppliedName] = useState('');
    const [pageSize, setPageSize] = useState('20');
    const [currentPage, setCurrentPage] = useState(1);
    const [jumpPage, setJumpPage] = useState('1');
    const [drawerMode, setDrawerMode] = useState<DrawerMode>(null);
    const [editingRecord, setEditingRecord] = useState<CertificateRecord | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<CertificateRecord | null>(null);
    const [toast, setToast] = useState<IotToastData | null>(null);

    const showToast = (message: string, type: IotToastType = 'warning') => {
        triggerIotToast(setToast, message, type);
    };

    const filteredRecords = useMemo(() => certificates.filter((item) => {
        const matchStandard = appliedStandard === 'all' || item.standard === appliedStandard;
        const matchName = !appliedName || item.name.includes(appliedName);
        return matchStandard && matchName;
    }), [appliedName, appliedStandard, certificates]);

    const pagination = useMemo(
        () => paginateItems(filteredRecords, currentPage, Number(pageSize)),
        [filteredRecords, currentPage, pageSize],
    );

    useEffect(() => {
        setCurrentPage(1);
        setJumpPage('1');
    }, [appliedName, appliedStandard, pageSize]);

    useEffect(() => {
        setJumpPage(String(pagination.currentPage));
    }, [pagination.currentPage]);

    const openAddDrawer = () => {
        setEditingRecord(null);
        setDrawerMode('add');
    };

    const openEditDrawer = (record: CertificateRecord) => {
        setEditingRecord(record);
        setDrawerMode('edit');
    };

    const closeDrawer = () => {
        setDrawerMode(null);
        setEditingRecord(null);
    };

    const handleSearch = () => {
        setAppliedStandard(draftStandard);
        setAppliedName(draftName.trim());
        setCurrentPage(1);
        setJumpPage('1');
    };

    const handleReset = () => {
        setDraftStandard('all');
        setDraftName('');
        setAppliedStandard('all');
        setAppliedName('');
        setCurrentPage(1);
        setJumpPage('1');
    };

    const handleSubmit = (value: CertificateFormValue) => {
        const name = value.name.trim();
        if (!value.standard) {
            showToast('请选择证书标准');
            return;
        }
        if (!name) {
            showToast('请输入证书名称');
            return;
        }
        if (!value.fileName) {
            showToast('请上传证书文件');
            return;
        }
        if (!value.privateKey.trim()) {
            showToast('请输入证书私钥');
            return;
        }

        const duplicate = certificates.some((item) => item.name === name && item.id !== editingRecord?.id);
        if (duplicate) {
            showToast('证书名称已存在');
            return;
        }

        if (drawerMode === 'add') {
            onUpdateCertificates((prev) => [
                {
                    id: generateCertificateId(),
                    standard: value.standard,
                    name,
                    fileName: value.fileName,
                    privateKey: value.privateKey.trim(),
                    description: value.description.trim(),
                    createdAt: formatCertificateNow(),
                },
                ...prev,
            ]);
            showToast('证书新增成功', 'success');
            closeDrawer();
            return;
        }

        if (drawerMode === 'edit' && editingRecord) {
            onUpdateCertificates((prev) => prev.map((item) => (
                item.id === editingRecord.id
                    ? {
                        ...item,
                        standard: value.standard,
                        name,
                        fileName: value.fileName,
                        privateKey: value.privateKey.trim(),
                        description: value.description.trim(),
                    }
                    : item
            )));
            showToast('证书保存成功', 'success');
            closeDrawer();
        }
    };

    const handleDelete = () => {
        if (!deleteTarget) return;
        onUpdateCertificates((prev) => prev.filter((item) => item.id !== deleteTarget.id));
        setDeleteTarget(null);
        showToast('证书删除成功', 'success');
    };

    const sidebar = <DeviceAccessSidebar pageId="certificate-mgmt" onNavigate={onNavigate} />;

    return (
        <AppShell
            activeTopTab="设备接入"
            sidebar={sidebar}
            onNavigateMessageCenter={onNavigateMessageCenter}
            onTopTabChange={(tab) => {
                if (tab === '设备接入') onNavigate('home');
            }}
        >
            <div className="pm-page cert-page">
                <Breadcrumb items={[
                                    { label: '设备接入', pageId: 'home' },
                                    { label: '证书管理', pageId: 'certificate-mgmt' },
                                    { label: '证书管理' },
                                ]} onNavigate={(id) => onNavigate(id as DeviceAccessPageId)} />

                <section className="panel pm-filter-panel">
                    <div className="pm-filter-row">
                        <div className="pm-filter-field">
                            <span className="pm-filter-label">证书标准</span>
                            <ElSelect
                                className="el-select--medium"
                                size="medium"
                                value={draftStandard}
                                options={CERTIFICATE_STANDARD_FILTER_OPTIONS}
                                onChange={setDraftStandard}
                            />
                        </div>
                        <div className="pm-filter-field">
                            <span className="pm-filter-label">证书名称</span>
                            <ClearableInput
                                type="text"
                                className="pm-filter-input"
                                placeholder="请输入证书名称"
                                value={draftName}
                                onChange={(event) => setDraftName(event.target.value)}
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

                <section className="panel cert-list-panel">
                    <div className="cert-table-head">
                        <h3>证书管理</h3>
                        <button type="button" className="pm-btn pm-btn-primary" onClick={openAddDrawer}>
                            <Plus size={14} />
                            新增
                        </button>
                    </div>

                    <div className="cert-table-wrap">
                        <table className="cert-table">
                            <thead>
                                <tr>
                                    <th>序号</th>
                                    <th>证书标准</th>
                                    <th>证书名称</th>
                                    <th>说明</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pagination.items.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="cert-empty-cell">暂无数据</td>
                                    </tr>
                                ) : (
                                    pagination.items.map((record, index) => (
                                        <tr key={record.id}>
                                            <td>{(pagination.currentPage - 1) * Number(pageSize) + index + 1}</td>
                                            <td>{record.standard}</td>
                                            <td>{record.name}</td>
                                            <td className="cert-desc-cell">{record.description || '—'}</td>
                                            <td>
                                                <div className="cert-row-actions">
                                                    <button type="button" onClick={() => openEditDrawer(record)}>编辑</button>
                                                    <button type="button" onClick={() => setDeleteTarget(record)}>删除</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
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

            <CertificateFormDrawer
                open={drawerMode !== null}
                mode={drawerMode === 'edit' ? 'edit' : 'add'}
                initialValue={editingRecord ? toCertificateFormValue(editingRecord) : undefined}
                onClose={closeDrawer}
                onSubmit={handleSubmit}
            />

            {deleteTarget ? (
                <ConfirmDialog
                    title="删除证书"
                    message={`确定删除证书「${deleteTarget.name}」吗？`}
                    onClose={() => setDeleteTarget(null)}
                    onConfirm={handleDelete}
                />
            ) : null}

            <IotToast toast={toast} />
        </AppShell>
    );
}
