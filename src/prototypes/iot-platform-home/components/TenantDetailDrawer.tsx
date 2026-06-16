import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { TenantRecord } from '../data/tenants';
import { formatAuthorizedPermissionSummary, resolveTenantPermissionIds } from '../data/tenantMenus';
import '../product-create.css';
import '../device-alarm-info.css';
import '../tenant-management.css';

type TenantDetailDrawerProps = {
    open: boolean;
    tenant: TenantRecord | null;
    onClose: () => void;
};

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="dai-detail-row">
            <div className="dai-detail-label">{label}</div>
            <div className="dai-detail-value">{children}</div>
        </div>
    );
}

export default function TenantDetailDrawer({
    open,
    tenant,
    onClose,
}: TenantDetailDrawerProps) {
    useEffect(() => {
        if (!open) return undefined;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [open]);

    if (!open || !tenant) return null;

    const handleMaskMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
        if (event.target === event.currentTarget) {
            onClose();
        }
    };

    return createPortal(
        <div className="pcp-drawer-mask" role="presentation" onMouseDown={handleMaskMouseDown}>
            <aside
                className="pcp-drawer tm-detail-drawer"
                role="dialog"
                aria-modal="true"
                aria-labelledby="tm-detail-drawer-title"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <div className="pcp-drawer__head">
                    <h3 id="tm-detail-drawer-title">租户详情</h3>
                    <button type="button" className="pcp-drawer__close" onClick={onClose} aria-label="关闭">×</button>
                </div>
                <div className="pcp-drawer__body">
                    <div className="dai-detail-table tm-detail-table">
                        <DetailRow label="租户名称">{tenant.name}</DetailRow>
                        <DetailRow label="所在地区">{tenant.region}</DetailRow>
                        <DetailRow label="详细地址">{tenant.address}</DetailRow>
                        <DetailRow label="管理员">{tenant.adminName}</DetailRow>
                        <DetailRow label="手机号码">{tenant.phone}</DetailRow>
                        <DetailRow label="租户备注">{tenant.remark || '—'}</DetailRow>
                        <DetailRow label="已授权权限">{formatAuthorizedPermissionSummary(resolveTenantPermissionIds(tenant))}</DetailRow>
                        <DetailRow label="创建时间">{tenant.createdAt}</DetailRow>
                    </div>
                </div>
            </aside>
        </div>,
        document.body,
    );
}
