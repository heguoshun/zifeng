import React, { useEffect, useMemo, useState } from 'react';
import { LayoutGrid, List, Search } from 'lucide-react';
import AppShell from '../components/AppShell';
import Breadcrumb from '../components/Breadcrumb';
import DeviceAccessSidebar, { type DeviceAccessPageId } from '../components/DeviceAccessSidebar';
import ElSelect from '../components/ElSelect';
import EntityCardPlaceholder from '../components/EntityCardPlaceholder';
import ListPagination from '../components/ListPagination';
import ProtocolFormDrawer, { toProtocolFormValue } from '../components/ProtocolFormDrawer';
import { ConfirmDialog } from '../components/IotDialogs';
import IotToast, { type IotToastData, type IotToastType, triggerIotToast } from '../components/IotToast';
import {
    PROTOCOL_TYPE_OPTIONS,
    generateProtocolId,
    type ProtocolRecord,
} from '../data/protocols';
import type { ProductRecord } from '../data/products';
import { paginateItems, DEFAULT_LIST_PAGE_SIZE } from '../utils/listPagination';
import '../device-access.css';
import '../product-management.css';
import '../protocol-management.css';
import ClearableInput from '../components/ClearableInput';

type DrawerMode = 'add' | 'edit' | null;

type ProtocolManagementPageProps = {
    protocols: ProtocolRecord[];
    products: ProductRecord[];
    onUpdateProtocols: React.Dispatch<React.SetStateAction<ProtocolRecord[]>>;
    onNavigateHome: () => void;
    onNavigateDeviceAccess: () => void;
    onNavigateMessageCenter: () => void;
    onNavigate: (pageId: DeviceAccessPageId) => void;
};

const TYPE_FILTER_OPTIONS = PROTOCOL_TYPE_OPTIONS.map((item) => ({
    label: item,
    value: item,
}));

function ProtocolCard({
    protocol,
    onEdit,
    onDelete,
}: {
    protocol: ProtocolRecord;
    onEdit: () => void;
    onDelete: () => void;
}) {
    return (
        <article className="pt-protocol-card">
            <div className="pt-protocol-card__main">
                <div className="pt-protocol-card__icon">
                    <EntityCardPlaceholder />
                </div>
                <div className="pt-protocol-card__body">
                    <h4>{protocol.name}</h4>
                    <div className="pt-protocol-card__meta">
                        <p>ID：<strong>{protocol.id}</strong></p>
                        <p>类型：<strong>{protocol.type}</strong></p>
                    </div>
                </div>
            </div>
            <div className="pt-protocol-card__foot">
                <button type="button" onClick={onEdit}>编辑</button>
                <button type="button" onClick={onDelete}>删除</button>
            </div>
        </article>
    );
}

function ProtocolTable({
    rows,
    startIndex,
    onEdit,
    onDelete,
}: {
    rows: ProtocolRecord[];
    startIndex: number;
    onEdit: (protocol: ProtocolRecord) => void;
    onDelete: (protocol: ProtocolRecord) => void;
}) {
    return (
        <div className="pm-table-wrap">
            <table className="pm-table">
                <thead>
                    <tr>
                        <th>序号</th>
                        <th>ID</th>
                        <th>协议名称</th>
                        <th>协议描述</th>
                        <th>协议类型</th>
                        <th>创建时间</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((protocol, index) => (
                        <tr key={protocol.id}>
                            <td>{startIndex + index + 1}</td>
                            <td>{protocol.id}</td>
                            <td>{protocol.name}</td>
                            <td>{protocol.description || '—'}</td>
                            <td>{protocol.type}</td>
                            <td>{protocol.createdAt}</td>
                            <td>
                                <div className="pt-table-actions">
                                    <button type="button" onClick={() => onEdit(protocol)}>编辑</button>
                                    <button type="button" onClick={() => onDelete(protocol)}>删除</button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default function ProtocolManagementPage({
    protocols,
    products,
    onUpdateProtocols,
    onNavigateHome,
    onNavigateDeviceAccess,
    onNavigateMessageCenter,
    onNavigate,
}: ProtocolManagementPageProps) {
    const [draftName, setDraftName] = useState('');
    const [draftType, setDraftType] = useState('全部');
    const [appliedName, setAppliedName] = useState('');
    const [appliedType, setAppliedType] = useState('全部');
    const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
    const [pageSize, setPageSize] = useState('20');
    const [currentPage, setCurrentPage] = useState(1);
    const [jumpPage, setJumpPage] = useState('1');
    const [drawerMode, setDrawerMode] = useState<DrawerMode>(null);
    const [editingProtocol, setEditingProtocol] = useState<ProtocolRecord | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<ProtocolRecord | null>(null);
    const [toast, setToast] = useState<IotToastData | null>(null);

    const showToast = (message: string, type: IotToastType = 'warning') => {
        triggerIotToast(setToast, message, type);
    };

    const filteredProtocols = useMemo(() => protocols.filter((protocol) => {
        const matchName = !appliedName || protocol.name.includes(appliedName);
        const matchType = appliedType === '全部' || protocol.type === appliedType;
        return matchName && matchType;
    }), [appliedName, appliedType, protocols]);

    const pagination = useMemo(
        () => paginateItems(filteredProtocols, currentPage, Number(pageSize)),
        [currentPage, filteredProtocols, pageSize],
    );

    useEffect(() => {
        setCurrentPage(1);
        setJumpPage('1');
    }, [appliedName, appliedType, pageSize, viewMode]);

    useEffect(() => {
        setJumpPage(String(pagination.currentPage));
    }, [pagination.currentPage]);

    const openAddDrawer = () => {
        setEditingProtocol(null);
        setDrawerMode('add');
    };

    const openEditDrawer = (protocol: ProtocolRecord) => {
        setEditingProtocol(protocol);
        setDrawerMode('edit');
    };

    const closeDrawer = () => {
        setDrawerMode(null);
        setEditingProtocol(null);
    };

    const isProtocolInUse = (protocol: ProtocolRecord) => products.some((product) => (
        product.protocolLabel === protocol.name
        || product.protocolId === protocol.id
    ));

    const handleSubmit = (value: {
        name: string;
        description: string;
        type: ProtocolRecord['type'];
        localAddress: string;
        jarFileName: string;
    }) => {
        const name = value.name.trim();
        if (!name) {
            showToast('请输入协议名称');
            return;
        }

        if (value.type === 'Jar' && !value.jarFileName) {
            showToast('请上传协议文件');
            return;
        }

        if (value.type === 'Local' && !value.localAddress.trim()) {
            showToast('请输入本机地址');
            return;
        }

        const duplicate = protocols.some((item) => item.name === name && item.id !== editingProtocol?.id);
        if (duplicate) {
            showToast('协议名称已存在');
            return;
        }

        const typeFields = value.type === 'Jar'
            ? { jarFileName: value.jarFileName, localAddress: undefined }
            : { localAddress: value.localAddress.trim(), jarFileName: undefined };

        if (drawerMode === 'add') {
            const now = new Date();
            const pad = (num: number) => String(num).padStart(2, '0');
            const createdAt = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} `
                + `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

            onUpdateProtocols((prev) => [
                {
                    id: generateProtocolId(),
                    name,
                    description: value.description,
                    type: value.type,
                    ...typeFields,
                    createdAt,
                },
                ...prev,
            ]);
            showToast('协议新增成功', 'success');
            closeDrawer();
            return;
        }

        if (drawerMode === 'edit' && editingProtocol) {
            onUpdateProtocols((prev) => prev.map((item) => (
                item.id === editingProtocol.id
                    ? {
                        ...item,
                        name,
                        description: value.description,
                        type: value.type,
                        ...typeFields,
                    }
                    : item
            )));
            showToast('协议保存成功', 'success');
            closeDrawer();
        }
    };

    const handleDeleteRequest = (protocol: ProtocolRecord) => {
        if (isProtocolInUse(protocol)) {
            showToast('当前协议已被产品引用，无法删除');
            return;
        }
        setDeleteTarget(protocol);
    };

    const handleDelete = () => {
        if (!deleteTarget) return;
        onUpdateProtocols((prev) => prev.filter((item) => item.id !== deleteTarget.id));
        setDeleteTarget(null);
        showToast('协议删除成功', 'success');
    };

    const sidebar = <DeviceAccessSidebar pageId="protocol-mgmt" onNavigate={onNavigate} />;

    return (
        <AppShell
            activeTopTab="设备接入"
            sidebar={sidebar}
            onNavigateMessageCenter={onNavigateMessageCenter}
            onTopTabChange={(tab) => {
                if (tab === '设备接入') onNavigate('home');
            }}
        >
            <div className="pm-page pt-page">
                <Breadcrumb items={[
                                    { label: '设备接入', pageId: 'home' },
                                    { label: '协议管理', pageId: 'protocol-mgmt' },
                                    { label: '协议管理' },
                                ]} onNavigate={(id) => onNavigate(id as DeviceAccessPageId)} />

                <section className="panel pm-filter-panel">
                    <div className="pm-filter-row">
                        <div className="pm-filter-field">
                            <span className="pm-filter-label">协议名称</span>
                            <ClearableInput
                                type="text"
                                className="pm-filter-input"
                                placeholder="请输入协议名称"
                                value={draftName}
                                onChange={(event) => setDraftName(event.target.value)}
                            />
                        </div>
                        <div className="pm-filter-field">
                            <span className="pm-filter-label">协议类型</span>
                            <ElSelect
                                className="el-select--medium"
                                size="medium"
                                value={draftType}
                                options={TYPE_FILTER_OPTIONS}
                                onChange={setDraftType}
                            />
                        </div>
                        <div className="pm-filter-actions">
                            <button
                                type="button"
                                className="pm-btn pm-btn-primary"
                                onClick={() => {
                                    setAppliedName(draftName.trim());
                                    setAppliedType(draftType);
                                }}
                            >
                                <Search size={14} />
                                查询
                            </button>
                            <button
                                type="button"
                                className="pm-btn pm-btn-ghost"
                                onClick={() => {
                                    setDraftName('');
                                    setDraftType('全部');
                                    setAppliedName('');
                                    setAppliedType('全部');
                                }}
                            >
                                重置
                            </button>
                        </div>
                    </div>
                </section>

                <section className="panel pm-list-panel">
                    <div className="pm-section-head">
                        <h3>协议列表</h3>
                        <div className="pm-list-toolbar">
                            <button type="button" className="pm-btn pm-btn-primary" onClick={openAddDrawer}>
                                新增
                            </button>
                            <div className="pm-view-toggle">
                                <button
                                    type="button"
                                    className={viewMode === 'card' ? 'is-active' : ''}
                                    aria-label="卡片视图"
                                    onClick={() => setViewMode('card')}
                                >
                                    <LayoutGrid size={14} />
                                </button>
                                <button
                                    type="button"
                                    className={viewMode === 'list' ? 'is-active' : ''}
                                    aria-label="列表视图"
                                    onClick={() => setViewMode('list')}
                                >
                                    <List size={14} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {viewMode === 'card' ? (
                        <div className="pt-card-grid">
                            {pagination.items.map((protocol) => (
                                <ProtocolCard
                                    key={protocol.id}
                                    protocol={protocol}
                                    onEdit={() => openEditDrawer(protocol)}
                                    onDelete={() => handleDeleteRequest(protocol)}
                                />
                            ))}
                        </div>
                    ) : (
                        <ProtocolTable
                            rows={pagination.items}
                            startIndex={(pagination.currentPage - 1) * Number(pageSize)}
                            onEdit={openEditDrawer}
                            onDelete={handleDeleteRequest}
                        />
                    )}

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

            <ProtocolFormDrawer
                open={drawerMode !== null}
                mode={drawerMode === 'edit' ? 'edit' : 'add'}
                initialValue={editingProtocol ? toProtocolFormValue(editingProtocol) : undefined}
                onClose={closeDrawer}
                onSubmit={handleSubmit}
            />

            {deleteTarget ? (
                <ConfirmDialog
                    title="删除协议"
                    message={`确定删除协议「${deleteTarget.name}」吗？`}
                    onClose={() => setDeleteTarget(null)}
                    onConfirm={handleDelete}
                />
            ) : null}

            <IotToast toast={toast} />
        </AppShell>
    );
}
