import React, { useEffect, useMemo, useState } from 'react';
import { LayoutGrid, List, Search } from 'lucide-react';
import AppShell from '../components/AppShell';
import DeviceAccessSidebar, { type DeviceAccessPageId } from '../components/DeviceAccessSidebar';
import ElSelect from '../components/ElSelect';
import EntityCardPlaceholder from '../components/EntityCardPlaceholder';
import ListPagination from '../components/ListPagination';
import NetworkServiceFormDrawer, { toNetworkServiceFormValue } from '../components/NetworkServiceFormDrawer';
import { ConfirmDialog } from '../components/IotDialogs';
import IotToast, { type IotToastData, type IotToastType, triggerIotToast } from '../components/IotToast';
import {
    NETWORK_SERVICE_TYPE_OPTIONS,
    generateNetworkServiceId,
    getNetworkServiceTypeLabel,
    type NetworkServiceRecord,
} from '../data/networkServices';
import type { NetworkServiceFormValue } from '../components/NetworkServiceFormDrawer';
import { paginateItems } from '../utils/listPagination';
import '../device-access.css';
import '../product-management.css';
import '../protocol-management.css';

type DrawerMode = 'add' | 'edit' | null;

type NetworkServiceManagementPageProps = {
    networkServices: NetworkServiceRecord[];
    onUpdateNetworkServices: React.Dispatch<React.SetStateAction<NetworkServiceRecord[]>>;
    onNavigateHome: () => void;
    onNavigateDeviceAccess: () => void;
    onNavigateMessageCenter: () => void;
    onNavigate: (pageId: DeviceAccessPageId) => void;
    onNavigateOmManagement: () => void;
};

const TYPE_FILTER_OPTIONS = NETWORK_SERVICE_TYPE_OPTIONS.map((item) => ({
    label: item,
    value: item,
}));

function ServiceCard({
    service,
    onEdit,
    onDelete,
}: {
    service: NetworkServiceRecord;
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
                    <h4>{service.name}</h4>
                    <div className="pt-protocol-card__meta">
                        <p>ID：<strong>{service.id}</strong></p>
                        <p>类型：<strong>{getNetworkServiceTypeLabel(service)}</strong></p>
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

function ServiceTable({
    rows,
    startIndex,
    onEdit,
    onDelete,
}: {
    rows: NetworkServiceRecord[];
    startIndex: number;
    onEdit: (service: NetworkServiceRecord) => void;
    onDelete: (service: NetworkServiceRecord) => void;
}) {
    return (
        <div className="pm-table-wrap">
            <table className="pm-table">
                <thead>
                    <tr>
                        <th>序号</th>
                        <th>ID</th>
                        <th>服务名称</th>
                        <th>服务类型</th>
                        <th>创建时间</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((service, index) => (
                        <tr key={service.id}>
                            <td>{startIndex + index + 1}</td>
                            <td>{service.id}</td>
                            <td>{service.name}</td>
                            <td>{getNetworkServiceTypeLabel(service)}</td>
                            <td>{service.createdAt}</td>
                            <td>
                                <div className="pt-table-actions">
                                    <button type="button" onClick={() => onEdit(service)}>编辑</button>
                                    <button type="button" onClick={() => onDelete(service)}>删除</button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default function NetworkServiceManagementPage({
    networkServices,
    onUpdateNetworkServices,
    onNavigateHome,
    onNavigateDeviceAccess,
    onNavigateMessageCenter,
    onNavigate,
    onNavigateOmManagement,
}: NetworkServiceManagementPageProps) {
    const [draftName, setDraftName] = useState('');
    const [draftType, setDraftType] = useState('全部');
    const [appliedName, setAppliedName] = useState('');
    const [appliedType, setAppliedType] = useState('全部');
    const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
    const [pageSize, setPageSize] = useState('10');
    const [currentPage, setCurrentPage] = useState(1);
    const [jumpPage, setJumpPage] = useState('1');
    const [drawerMode, setDrawerMode] = useState<DrawerMode>(null);
    const [editingService, setEditingService] = useState<NetworkServiceRecord | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<NetworkServiceRecord | null>(null);
    const [toast, setToast] = useState<IotToastData | null>(null);

    const showToast = (message: string, type: IotToastType = 'warning') => {
        triggerIotToast(setToast, message, type);
    };

    const filteredServices = useMemo(() => networkServices.filter((service) => {
        const matchName = !appliedName || service.name.includes(appliedName);
        const matchType = appliedType === '全部'
            || (service.componentSource === '系统内置' && service.serviceType === appliedType);
        return matchName && matchType;
    }), [appliedName, appliedType, networkServices]);

    const pagination = useMemo(
        () => paginateItems(filteredServices, currentPage, Number(pageSize)),
        [currentPage, filteredServices, pageSize],
    );

    useEffect(() => {
        setCurrentPage(1);
        setJumpPage('1');
    }, [appliedName, appliedType, pageSize, viewMode]);

    useEffect(() => {
        setJumpPage(String(pagination.currentPage));
    }, [pagination.currentPage]);

    const openAddDrawer = () => {
        setEditingService(null);
        setDrawerMode('add');
    };

    const openEditDrawer = (service: NetworkServiceRecord) => {
        setEditingService(service);
        setDrawerMode('edit');
    };

    const closeDrawer = () => {
        setDrawerMode(null);
        setEditingService(null);
    };

    const handleSubmit = (value: NetworkServiceFormValue) => {
        const name = value.name.trim();
        if (!name) {
            showToast('请输入服务名称');
            return;
        }

        if (value.componentSource === '系统内置' && !value.serviceType) {
            showToast('请选择服务类型');
            return;
        }

        if (value.componentSource === '自定义服务' && !value.sdkFileName) {
            showToast('请上传组件文件');
            return;
        }

        if (!value.ipAddress.trim()) {
            showToast('请输入地址');
            return;
        }

        if (!value.port.trim()) {
            showToast('请输入端口');
            return;
        }

        const duplicate = networkServices.some((item) => item.name === name && item.id !== editingService?.id);
        if (duplicate) {
            showToast('服务名称已存在');
            return;
        }

        const payload = {
            name,
            componentSource: value.componentSource,
            networkScope: value.networkScope,
            ipAddress: value.ipAddress.trim(),
            port: value.port.trim(),
            ...(value.componentSource === '系统内置'
                ? { serviceType: value.serviceType as NetworkServiceRecord['serviceType'], sdkFileName: undefined }
                : { serviceType: undefined, sdkFileName: value.sdkFileName }),
        };

        if (drawerMode === 'add') {
            const now = new Date();
            const pad = (num: number) => String(num).padStart(2, '0');
            const createdAt = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} `
                + `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

            onUpdateNetworkServices((prev) => [
                {
                    id: generateNetworkServiceId(),
                    ...payload,
                    createdAt,
                },
                ...prev,
            ]);
            showToast('网络服务新增成功', 'success');
            closeDrawer();
            return;
        }

        if (drawerMode === 'edit' && editingService) {
            onUpdateNetworkServices((prev) => prev.map((item) => (
                item.id === editingService.id
                    ? { ...item, ...payload }
                    : item
            )));
            showToast('网络服务保存成功', 'success');
            closeDrawer();
        }
    };

    const handleDelete = () => {
        if (!deleteTarget) return;
        onUpdateNetworkServices((prev) => prev.filter((item) => item.id !== deleteTarget.id));
        setDeleteTarget(null);
        showToast('网络服务删除成功', 'success');
    };

    const sidebar = <DeviceAccessSidebar pageId="network-service" onNavigate={onNavigate} />;

    return (
        <AppShell
            activeTopTab="设备接入"
            sidebar={sidebar}
            onNavigateOmManagement={onNavigateOmManagement}
            onNavigateMessageCenter={onNavigateMessageCenter}
            onTopTabChange={(tab) => {
                if (tab === '设备接入') onNavigate('home');
                if (tab === '运维管理') onNavigateOmManagement();
            }}
        >
            <div className="pm-page pt-page">
                <div className="crumb">设备接入 / 设备运维 / 网络服务</div>

                <section className="panel pm-filter-panel">
                    <div className="pm-filter-row">
                        <label className="pm-filter-field">
                            <span className="pm-filter-label">服务名称</span>
                            <input
                                type="text"
                                className="pm-filter-input"
                                placeholder="请输入组件名称"
                                value={draftName}
                                onChange={(event) => setDraftName(event.target.value)}
                            />
                        </label>
                        <label className="pm-filter-field">
                            <span className="pm-filter-label">服务类型</span>
                            <ElSelect
                                className="el-select--medium"
                                size="medium"
                                value={draftType}
                                options={TYPE_FILTER_OPTIONS}
                                onChange={setDraftType}
                            />
                        </label>
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
                        <h3>网络服务列表</h3>
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
                            {pagination.items.map((service) => (
                                <ServiceCard
                                    key={service.id}
                                    service={service}
                                    onEdit={() => openEditDrawer(service)}
                                    onDelete={() => setDeleteTarget(service)}
                                />
                            ))}
                        </div>
                    ) : (
                        <ServiceTable
                            rows={pagination.items}
                            startIndex={(pagination.currentPage - 1) * Number(pageSize)}
                            onEdit={openEditDrawer}
                            onDelete={setDeleteTarget}
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

            <NetworkServiceFormDrawer
                open={drawerMode !== null}
                mode={drawerMode === 'edit' ? 'edit' : 'add'}
                initialValue={editingService ? toNetworkServiceFormValue(editingService) : undefined}
                onClose={closeDrawer}
                onSubmit={handleSubmit}
            />

            {deleteTarget ? (
                <ConfirmDialog
                    title="删除网络服务"
                    message={`确定删除网络服务「${deleteTarget.name}」吗？`}
                    onClose={() => setDeleteTarget(null)}
                    onConfirm={handleDelete}
                />
            ) : null}

            <IotToast toast={toast} />
        </AppShell>
    );
}
