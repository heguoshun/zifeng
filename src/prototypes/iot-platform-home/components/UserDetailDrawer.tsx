import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { UserRound } from 'lucide-react';
import { getDepartmentLabel } from '../data/systemDepartments';
import { getPositionLabel, type SystemPositionRecord } from '../data/systemPositions';
import { getRoleLabel, type SystemRoleRecord } from '../data/systemRoles';
import type { SystemUserRecord } from '../data/systemUsers';
import type { TenantRecord } from '../data/tenants';
import '../product-create.css';
import '../device-alarm-info.css';
import '../user-management.css';

type UserDetailDrawerProps = {
    open: boolean;
    user: SystemUserRecord | null;
    tenants: TenantRecord[];
    roles: SystemRoleRecord[];
    positions: SystemPositionRecord[];
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

function resolveTenantName(tenants: TenantRecord[], tenantId: string): string {
    return tenants.find((item) => item.id === tenantId)?.name ?? '—';
}

export default function UserDetailDrawer({
    open,
    user,
    tenants,
    roles,
    positions,
    onClose,
}: UserDetailDrawerProps) {
    useEffect(() => {
        if (!open) return undefined;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [open]);

    if (!open || !user) return null;

    const handleMaskMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
        if (event.target === event.currentTarget) {
            onClose();
        }
    };

    return createPortal(
        <div className="pcp-drawer-mask" role="presentation" onMouseDown={handleMaskMouseDown}>
            <aside
                className="pcp-drawer um-detail-drawer"
                role="dialog"
                aria-modal="true"
                aria-labelledby="um-detail-drawer-title"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <div className="pcp-drawer__head">
                    <h3 id="um-detail-drawer-title">用户详情</h3>
                    <button type="button" className="pcp-drawer__close" onClick={onClose} aria-label="关闭">×</button>
                </div>
                <div className="pcp-drawer__body">
                    <div className="dai-detail-table um-detail-table">
                        <DetailRow label="用户名称">{user.displayName}</DetailRow>
                        <DetailRow label="用户账号">{user.account}</DetailRow>
                        <DetailRow label="所属租户">{resolveTenantName(tenants, user.tenantId)}</DetailRow>
                        <DetailRow label="所属角色">{getRoleLabel(roles, user.roleId)}</DetailRow>
                        <DetailRow label="所属部门">{getDepartmentLabel(user.departmentId)}</DetailRow>
                        <DetailRow label="所属岗位">{getPositionLabel(positions, user.positionId ?? '')}</DetailRow>
                        <DetailRow label="手机号码">{user.phone}</DetailRow>
                        <DetailRow label="性别">{user.gender}</DetailRow>
                        <DetailRow label="生日">{user.birthday || '—'}</DetailRow>
                        <DetailRow label="邮箱">{user.email || '—'}</DetailRow>
                        <DetailRow label="状态">{user.status}</DetailRow>
                        <DetailRow label="头像">
                            {user.avatar ? (
                                <img src={user.avatar} alt={user.displayName} className="um-avatar um-avatar--large" />
                            ) : (
                                <span className="um-avatar um-avatar--large um-avatar--placeholder">
                                    <UserRound size={18} />
                                </span>
                            )}
                        </DetailRow>
                        <DetailRow label="创建时间">{user.createdAt}</DetailRow>
                    </div>
                </div>
            </aside>
        </div>,
        document.body,
    );
}
