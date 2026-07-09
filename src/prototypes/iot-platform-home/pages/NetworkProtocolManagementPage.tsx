import React, { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import AppShell from '../components/AppShell';
import DeviceAccessSidebar, { type DeviceAccessPageId } from '../components/DeviceAccessSidebar';
import ListPagination from '../components/ListPagination';
import { ConfirmDialog } from '../components/IotDialogs';
import IotToast, { type IotToastData, type IotToastType, triggerIotToast } from '../components/IotToast';
import type { NetworkProtocolRecord } from '../data/networkProtocols';
import { navigateNetworkProtocolForm } from '../utils/networkProtocolRoute';
import { paginateItems, DEFAULT_LIST_PAGE_SIZE } from '../utils/listPagination';
import '../device-access.css';
import '../product-management.css';
import '../network-protocol.css';
import ClearableInput from '../components/ClearableInput';

type NetworkProtocolManagementPageProps = {
    networkProtocols: NetworkProtocolRecord[];
    onUpdateNetworkProtocols: React.Dispatch<React.SetStateAction<NetworkProtocolRecord[]>>;
    onNavigateHome: () => void;
    onNavigateDeviceAccess: () => void;
    onNavigateMessageCenter: () => void;
    onNavigate: (pageId: DeviceAccessPageId) => void;
};

function NetworkProtocolCard({
    item,
    onEdit,
    onDelete,
}: {
    item: NetworkProtocolRecord;
    onEdit: () => void;
    onDelete: () => void;
}) {
    return (
        <article className="np-protocol-card">
            <div className="np-protocol-card__body">
                <h4>{item.name}</h4>
                <div className="np-protocol-card__meta">
                    <div>
                        <span>服务名称</span>
                        <strong>{item.serviceName}</strong>
                    </div>
                    <div>
                        <span>协议名称</span>
                        <strong>{item.protocolName}</strong>
                    </div>
                    <div>
                        <span>IP地址</span>
                        <strong>{item.ipAddress}</strong>
                    </div>
                    <div>
                        <span>协议类型</span>
                        <strong>{item.protocolType}</strong>
                    </div>
                </div>
            </div>
            <div className="np-protocol-card__foot">
                <button type="button" onClick={onEdit}>编辑</button>
                <button type="button" onClick={onDelete}>删除</button>
            </div>
        </article>
    );
}

export default function NetworkProtocolManagementPage({
    networkProtocols,
    onUpdateNetworkProtocols,
    onNavigateHome,
    onNavigateDeviceAccess,
    onNavigateMessageCenter,
    onNavigate,
}: NetworkProtocolManagementPageProps) {
    const [draftKeyword, setDraftKeyword] = useState('');
    const [appliedKeyword, setAppliedKeyword] = useState('');
    const [pageSize, setPageSize] = useState('20');
    const [currentPage, setCurrentPage] = useState(1);
    const [jumpPage, setJumpPage] = useState('1');
    const [deleteTarget, setDeleteTarget] = useState<NetworkProtocolRecord | null>(null);
    const [toast, setToast] = useState<IotToastData | null>(null);

    const showToast = (message: string, type: IotToastType = 'warning') => {
        triggerIotToast(setToast, message, type);
    };

    const filteredItems = useMemo(() => networkProtocols.filter((item) => (
        !appliedKeyword
        || item.name.includes(appliedKeyword)
        || item.serviceName.includes(appliedKeyword)
        || item.protocolName.includes(appliedKeyword)
    )), [appliedKeyword, networkProtocols]);

    const pagination = useMemo(
        () => paginateItems(filteredItems, currentPage, Number(pageSize)),
        [currentPage, filteredItems, pageSize],
    );

    useEffect(() => {
        setCurrentPage(1);
        setJumpPage('1');
    }, [appliedKeyword, pageSize]);

    useEffect(() => {
        setJumpPage(String(pagination.currentPage));
    }, [pagination.currentPage]);

    const handleDelete = () => {
        if (!deleteTarget) return;
        onUpdateNetworkProtocols((prev) => prev.filter((item) => item.id !== deleteTarget.id));
        setDeleteTarget(null);
        showToast('网络协议删除成功', 'success');
    };

    const sidebar = <DeviceAccessSidebar pageId="network-protocol" onNavigate={onNavigate} />;

    return (
        <AppShell
            activeTopTab="设备接入"
            sidebar={sidebar}
            onNavigateMessageCenter={onNavigateMessageCenter}
            onTopTabChange={(tab) => {
                if (tab === '设备接入') onNavigate('home');
            }}
        >
            <div className="pm-page np-page">
                <div className="crumb">设备接入 / 设备运维 / 网络协议</div>

                <section className="panel pm-filter-panel">
                    <div className="pm-filter-row">
                        <div className="pm-filter-field">
                            <span className="pm-filter-label">组件名称</span>
                            <ClearableInput
                                type="text"
                                className="pm-filter-input"
                                placeholder="请输入组件名称"
                                value={draftKeyword}
                                onChange={(event) => setDraftKeyword(event.target.value)}
                            />
                        </div>
                        <div className="pm-filter-actions">
                            <button
                                type="button"
                                className="pm-btn pm-btn-primary"
                                onClick={() => setAppliedKeyword(draftKeyword.trim())}
                            >
                                <Search size={14} />
                                查询
                            </button>
                            <button
                                type="button"
                                className="pm-btn pm-btn-ghost"
                                onClick={() => {
                                    setDraftKeyword('');
                                    setAppliedKeyword('');
                                }}
                            >
                                重置
                            </button>
                        </div>
                    </div>
                </section>

                <section className="panel pm-list-panel">
                    <div className="pm-section-head">
                        <h3>网络协议列表</h3>
                        <button
                            type="button"
                            className="pm-btn pm-btn-primary"
                            onClick={() => navigateNetworkProtocolForm('create')}
                        >
                            新增
                        </button>
                    </div>

                    <div className="np-card-grid">
                        {pagination.items.map((item) => (
                            <NetworkProtocolCard
                                key={item.id}
                                item={item}
                                onEdit={() => navigateNetworkProtocolForm('edit', item.id)}
                                onDelete={() => setDeleteTarget(item)}
                            />
                        ))}
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

            {deleteTarget ? (
                <ConfirmDialog
                    title="删除网络协议"
                    message={`确定删除网络协议「${deleteTarget.name}」吗？`}
                    onClose={() => setDeleteTarget(null)}
                    onConfirm={handleDelete}
                />
            ) : null}

            <IotToast toast={toast} />
        </AppShell>
    );
}
