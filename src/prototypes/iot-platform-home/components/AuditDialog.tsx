import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
    AlertTriangle,
    CalendarClock,
    CheckCircle2,
    RotateCcw,
    ShieldCheck,
    Users,
    XCircle,
} from 'lucide-react';
import type { UpgradeTaskRecord } from '../data/remoteUpgrade';
import type { DeviceRecord } from '../data/devices';
import '../device-create.css';
import '../product-create.css';
import '../remote-upgrade.css';
import ClearableInput from './ClearableInput';

type AuditDialogProps = {
    open: boolean;
    task: UpgradeTaskRecord;
    taskName: string;
    productName: string;
    productId: string;
    devices: DeviceRecord[];
    currentUser?: string;
    onClose: () => void;
    onApprove: (remark: string) => void;
    onReject: (remark: string) => void;
};

export default function AuditDialog({
    open,
    task,
    taskName,
    productName,
    productId,
    devices,
    currentUser,
    onClose,
    onApprove,
    onReject,
}: AuditDialogProps) {
    const [decision, setDecision] = useState<'approve' | 'reject'>('approve');
    const [remark, setRemark] = useState('');
    const [executionConfirmed, setExecutionConfirmed] = useState(false);
    const [error, setError] = useState('');
    const [devicesExpanded, setDevicesExpanded] = useState(false);
    const [deviceKeyword, setDeviceKeyword] = useState('');
    const [devicePage, setDevicePage] = useState(1);
    const devicePageSize = 6;

    useEffect(() => {
        if (!open) return undefined;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [open]);

    useEffect(() => {
        if (!open) return;
        setDecision('approve');
        setRemark('');
        setExecutionConfirmed(false);
        setError('');
        setDevicesExpanded(false);
        setDeviceKeyword('');
        setDevicePage(1);
    }, [open, task.id]);

    const scopedDevices = useMemo(
        () => task.scope === '全部设备'
            ? devices.filter((device) => device.productId === productId && device.enabled)
            : devices.filter((device) => task.deviceIds.includes(device.id)),
        [devices, productId, task.deviceIds, task.scope],
    );
    const deviceCount = task.scope === '全部设备' ? `${scopedDevices.length} 台符合条件的设备` : `${scopedDevices.length} 台设备`;
    const filteredDevices = useMemo(() => {
        const keyword = deviceKeyword.trim().toLowerCase();
        if (!keyword) return scopedDevices;
        return scopedDevices.filter((device) => (
            device.name.toLowerCase().includes(keyword)
            || device.code.toLowerCase().includes(keyword)
        ));
    }, [deviceKeyword, scopedDevices]);
    const deviceTotalPages = Math.max(1, Math.ceil(filteredDevices.length / devicePageSize));
    const pagedDevices = filteredDevices.slice((devicePage - 1) * devicePageSize, devicePage * devicePageSize);
    const reviewerName = currentUser?.replace(/^(审核员|发起者)-/, '') || '未识别';
    const executionTime = task.scheduleType === '立即升级' ? '审核通过后立即执行' : task.scheduledAt;
    const risks = useMemo(() => {
        const items: string[] = [];
        if (task.scope === '全部设备') items.push('升级范围为全部设备，请确认影响范围');
        if (task.scheduleType === '立即升级') items.push('通过后任务将立即执行，无法停留在待执行队列');
        if (task.retryStrategy === '不重试') items.push('当前未配置失败重试策略');
        return items;
    }, [task.retryStrategy, task.scheduleType, task.scope]);

    useEffect(() => {
        setDevicePage(1);
    }, [deviceKeyword, devicesExpanded]);

    useEffect(() => {
        if (devicePage > deviceTotalPages) setDevicePage(deviceTotalPages);
    }, [devicePage, deviceTotalPages]);

    if (!open) return null;

    const handleSubmit = () => {
        const normalizedRemark = remark.trim();
        if (decision === 'reject' && !normalizedRemark) {
            setError('请填写退回原因，便于发起人修改后重新提交');
            return;
        }
        if (decision === 'approve' && task.scheduleType === '立即升级' && !executionConfirmed) {
            setError('请先确认已核对升级范围和执行风险');
            return;
        }
        setError('');
        if (decision === 'approve') onApprove(normalizedRemark);
        else onReject(normalizedRemark);
    };

    const handleMaskMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
        if (event.target === event.currentTarget) onClose();
    };

    return createPortal(
        <div className="pcp-drawer-mask ru-drawer-mask" role="presentation" onMouseDown={handleMaskMouseDown}>
            <aside
                className="pcp-drawer pcp-drawer--form dcp-group-dialog ru-drawer ru-audit-drawer"
                role="dialog"
                aria-modal="true"
                aria-labelledby="ru-audit-drawer-title"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <div className="pcp-drawer__head ru-audit-head">
                    <div>
                        <h3 id="ru-audit-drawer-title">审核升级任务</h3>
                        <p>核对升级范围与执行策略后作出审核决定</p>
                    </div>
                    <button type="button" className="pcp-drawer__close" onClick={onClose} aria-label="关闭">×</button>
                </div>

                <div className="pcp-drawer__body pcp-drawer__body--form ru-audit-body">
                    <section className="ru-audit-summary" aria-labelledby="ru-audit-summary-title">
                        <div className="ru-audit-section-title">
                            <ShieldCheck size={17} />
                            <h4 id="ru-audit-summary-title">审批任务</h4>
                            <span className="ru-audit-status">待审核</span>
                        </div>
                        <div className="ru-audit-task-name">{taskName}</div>
                        <div className="ru-audit-summary-grid">
                            <div><span>任务编号</span><strong>{task.id}</strong></div>
                            <div><span>所属产品</span><strong>{productName}</strong></div>
                            <div><span>目标版本</span><strong>{task.targetVersion}</strong></div>
                            <div><span>创建时间</span><strong>{task.createdAt}</strong></div>
                        </div>
                    </section>

                    <section className="ru-audit-impact" aria-label="执行影响">
                        <div className="ru-audit-impact-card">
                            <Users size={18} />
                            <span>升级范围</span>
                            <strong>{deviceCount}</strong>
                            <button
                                type="button"
                                className="ru-audit-device-link"
                                onClick={() => setDevicesExpanded((value) => !value)}
                                aria-expanded={devicesExpanded}
                            >
                                {devicesExpanded ? '收起设备' : '查看设备'}
                            </button>
                        </div>
                        <div className="ru-audit-impact-card">
                            <CalendarClock size={18} />
                            <span>执行时间</span>
                            <strong>{executionTime}</strong>
                        </div>
                        <div className="ru-audit-impact-card">
                            <RotateCcw size={18} />
                            <span>失败策略</span>
                            <strong>{task.retryStrategy || '未配置'} · 超时 {task.timeout || '未配置'}</strong>
                        </div>
                    </section>

                    {devicesExpanded && (
                        <section className="ru-audit-device-list" aria-label="升级设备清单">
                            <div className="ru-audit-device-list__head">
                                <strong>升级设备</strong>
                                <span>{deviceKeyword ? `找到 ${filteredDevices.length} 台` : `共 ${scopedDevices.length} 台`}</span>
                            </div>
                            <div className="ru-audit-device-toolbar">
                                <ClearableInput
                                    type="text"
                                    className="pm-filter-input ru-audit-device-search"
                                    value={deviceKeyword}
                                    onChange={(event) => setDeviceKeyword(event.target.value)}
                                    placeholder="搜索设备名称或编号"
                                    aria-label="搜索升级设备"
                                />
                            </div>
                            <div className="ru-audit-device-list__table">
                                <table>
                                    <thead><tr><th>设备名称</th><th>设备编号</th><th>状态</th></tr></thead>
                                    <tbody>
                                        {pagedDevices.map((device) => (
                                            <tr key={device.id}>
                                                <td>{device.name}</td>
                                                <td>{device.code}</td>
                                                <td>
                                                    <span className={`ru-audit-device-status is-${device.status}`}>
                                                        {device.status === 'online' ? '在线' : device.status === 'offline' ? '离线' : device.status === 'fault' ? '故障' : '已禁用'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {!pagedDevices.length && <tr><td colSpan={3} className="ru-audit-device-empty">暂无符合条件的设备</td></tr>}
                                    </tbody>
                                </table>
                            </div>
                            {filteredDevices.length > devicePageSize && (
                                <div className="ru-audit-device-pagination" aria-label="升级设备分页">
                                    <button type="button" disabled={devicePage === 1} onClick={() => setDevicePage((page) => page - 1)}>上一页</button>
                                    <span>{devicePage} / {deviceTotalPages}</span>
                                    <button type="button" disabled={devicePage === deviceTotalPages} onClick={() => setDevicePage((page) => page + 1)}>下一页</button>
                                </div>
                            )}
                        </section>
                    )}

                    {risks.length > 0 && (
                        <section className="ru-audit-risk" aria-labelledby="ru-audit-risk-title">
                            <AlertTriangle size={18} />
                            <div>
                                <h4 id="ru-audit-risk-title">需要确认</h4>
                                <ul>{risks.map((item) => <li key={item}>{item}</li>)}</ul>
                            </div>
                        </section>
                    )}

                    <section className="ru-audit-decision" aria-labelledby="ru-audit-decision-title">
                        <div className="ru-audit-section-title">
                            <h4 id="ru-audit-decision-title">审核决定</h4>
                            <span>审核人员：{reviewerName}</span>
                        </div>
                        <div className="ru-audit-decision-options">
                            <button
                                type="button"
                                className={`ru-audit-option ru-audit-option--approve ${decision === 'approve' ? 'is-active' : ''}`}
                                onClick={() => { setDecision('approve'); setError(''); }}
                                aria-pressed={decision === 'approve'}
                            >
                                <CheckCircle2 size={19} />
                                <span><strong>通过审批</strong><small>{task.scheduleType === '立即升级' ? '立即开始升级' : '进入待执行队列'}</small></span>
                            </button>
                            <button
                                type="button"
                                className={`ru-audit-option ru-audit-option--reject ${decision === 'reject' ? 'is-active' : ''}`}
                                onClick={() => { setDecision('reject'); setError(''); }}
                                aria-pressed={decision === 'reject'}
                            >
                                <XCircle size={19} />
                                <span><strong>退回修改</strong><small>由发起人修改后重新提交</small></span>
                            </button>
                        </div>

                        <label className="pcp-drawer-field ru-audit-remark">
                            <span className="pcp-form-label">
                                {decision === 'reject' && <em>*</em>}
                                {decision === 'reject' ? '退回原因' : '审核意见（选填）'}
                            </span>
                            <div className="dai-textarea-wrap ru-audit-remark-wrap">
                                <textarea
                                    className={`pcp-form-textarea ru-audit-remark-textarea ${error && decision === 'reject' ? 'is-error' : ''}`}
                                    placeholder={decision === 'reject' ? '请说明需要修改的内容，便于发起人处理' : '可补充审核依据、执行要求或注意事项'}
                                    value={remark}
                                    onChange={(event) => { setRemark(event.target.value); setError(''); }}
                                    rows={3}
                                    maxLength={200}
                                />
                                <span className="dai-textarea-counter">{remark.length}/200</span>
                            </div>
                        </label>

                        {decision === 'approve' && task.scheduleType === '立即升级' && (
                            <label className="ru-audit-confirm">
                                <input
                                    type="checkbox"
                                    checked={executionConfirmed}
                                    onChange={(event) => { setExecutionConfirmed(event.target.checked); setError(''); }}
                                />
                                <span>我已核对升级设备范围、目标版本和执行策略，确认审核通过后立即执行。</span>
                            </label>
                        )}
                        {error && <p className="ru-audit-error" role="alert">{error}</p>}
                    </section>
                </div>

                <div className="pcp-drawer__foot ru-audit-foot">
                    <span>{decision === 'approve' ? '通过后将按任务计划执行' : '驳回后任务将退回修改'}</span>
                    <div>
                        <button type="button" className="pm-btn pm-btn-ghost" onClick={onClose}>取消</button>
                        <button
                            type="button"
                            className={`pm-btn ${decision === 'approve' ? 'pm-btn-primary' : 'ru-audit-reject-btn'}`}
                            onClick={handleSubmit}
                        >
                            确认{decision === 'approve' ? '通过' : '驳回'}
                        </button>
                    </div>
                </div>
            </aside>
        </div>,
        document.body,
    );
}
