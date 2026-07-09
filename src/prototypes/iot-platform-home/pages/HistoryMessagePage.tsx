import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import AppShell from '../components/AppShell';
import MessageCenterSidebar, { type MessageCenterPageId } from '../components/MessageCenterSidebar';
import ElSelect from '../components/ElSelect';
import ElDateRangePicker from '../components/ElDateRangePicker';
import { Search, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { createInitialHistoryMessages, createInitialPushRecords, type HistoryMessageRecord, type PushDeliveryRecord } from '../data/historyMessages';
import IotToast, { type IotToastData, type IotToastType, triggerIotToast } from '../components/IotToast';
import '../device-access.css';
import '../product-management.css';
import '../product-create.css';
import '../device-group.css';
import '../history-message.css';

// ── Types ──

type FilterState = {
    operationType: string;
    operator: string;
    operationResult: string;
    status: string;
    startTime: string;
    endTime: string;
};

// ── Constants ──

const OPERATION_TYPE_OPTIONS = [
    { label: '全部', value: '' },
    { label: '设备告警消息', value: '设备告警消息' },
    { label: '设备状态变更', value: '设备状态变更' },
    { label: '设备新增', value: '设备新增' },
    { label: '设备删除', value: '设备删除' },
    { label: '设备修改', value: '设备修改' },
    { label: '系统通知', value: '系统通知' },
];

const OPERATOR_OPTIONS = [
    { label: '全部', value: '' },
    { label: '管理员', value: '管理员' },
    { label: '系统', value: '系统' },
];

const RESULT_OPTIONS = [
    { label: '全部', value: '' },
    { label: '成功', value: '成功' },
    { label: '失败', value: '失败' },
];

const STATUS_OPTIONS = [
    { label: '全部', value: '' },
    { label: '正常', value: '正常' },
    { label: '异常', value: '异常' },
];

const ALL_USERS = ['刘恒', '李俊', '张翰和', '吴斌', '刘亚', '李明', '王芳', '赵强', '陈刚', '周敏', '黄伟', '孙丽', '用户名1', '用户名2', '用户名3'];

// ── Forward User Drawer ──

function ForwardUserDrawer({
    open,
    onClose,
    onConfirm,
}: {
    open: boolean;
    onClose: () => void;
    onConfirm: (users: string[]) => void;
}) {
    const [available, setAvailable] = useState<string[]>(() =>
        ALL_USERS.filter((u) => !['刘恒', '李俊', '张翰和', '吴斌', '刘亚'].includes(u)),
    );
    const [selected, setSelected] = useState<string[]>(['刘恒', '李俊', '张翰和', '吴斌', '刘亚']);
    const [checkedAvailable, setCheckedAvailable] = useState<string[]>([]);
    const [checkedSelected, setCheckedSelected] = useState<string[]>([]);

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
        setAvailable(ALL_USERS.filter((u) => !['刘恒', '李俊', '张翰和', '吴斌', '刘亚'].includes(u)));
        setSelected(['刘恒', '李俊', '张翰和', '吴斌', '刘亚']);
        setCheckedAvailable([]);
        setCheckedSelected([]);
    }, [open]);

    if (!open) return null;

    const toggleAvailable = (user: string) => {
        setCheckedAvailable((prev) => (
            prev.includes(user) ? prev.filter((item) => item !== user) : [...prev, user]
        ));
    };

    const toggleSelected = (user: string) => {
        setCheckedSelected((prev) => (
            prev.includes(user) ? prev.filter((item) => item !== user) : [...prev, user]
        ));
    };

    const moveRight = () => {
        if (!checkedAvailable.length) return;
        setSelected((prev) => Array.from(new Set([...prev, ...checkedAvailable])));
        setAvailable((prev) => prev.filter((user) => !checkedAvailable.includes(user)));
        setCheckedAvailable([]);
    };

    const moveLeft = () => {
        if (!checkedSelected.length) return;
        setAvailable((prev) => [...prev, ...checkedSelected]);
        setSelected((prev) => prev.filter((user) => !checkedSelected.includes(user)));
        setCheckedSelected([]);
    };

    const handleMaskMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
        if (event.target === event.currentTarget) {
            onClose();
        }
    };

    return createPortal(
        <div className="pcp-drawer-mask hm-forward-drawer-mask" role="presentation" onMouseDown={handleMaskMouseDown}>
            <aside
                className="pcp-drawer hm-forward-drawer"
                role="dialog"
                aria-modal="true"
                aria-labelledby="hm-forward-drawer-title"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <div className="pcp-drawer__head">
                    <h3 id="hm-forward-drawer-title">选择转发对象</h3>
                    <button type="button" className="pcp-drawer__close" onClick={onClose} aria-label="关闭">×</button>
                </div>

                <div className="pcp-drawer__body hm-forward-drawer__body">
                    <div className="dg-transfer">
                        <div className="dg-transfer-panel">
                            <div className="dg-transfer-panel__head">
                                <span>选择用户</span>
                            </div>
                            <div className="dg-transfer-panel__filter">
                                <ElSelect
                                    className="el-select--medium"
                                    size="medium"
                                    value=""
                                    options={[{ label: '请选择用户角色', value: '' }]}
                                    onChange={() => {}}
                                />
                            </div>
                            <div className="dg-transfer-panel__list">
                                <ul className="dg-transfer-list">
                                    {available.map((user) => (
                                        <li key={user}>
                                            <label className="dg-transfer-item">
                                                <input
                                                    type="checkbox"
                                                    checked={checkedAvailable.includes(user)}
                                                    onChange={() => toggleAvailable(user)}
                                                />
                                                <span>{user}</span>
                                            </label>
                                        </li>
                                    ))}
                                    {!available.length && (
                                        <li className="dg-transfer-empty">暂无可选用户</li>
                                    )}
                                </ul>
                            </div>
                        </div>

                        <div className="dg-transfer-actions">
                            <button
                                type="button"
                                className="dg-transfer-actions__btn"
                                disabled={!checkedAvailable.length}
                                aria-label="添加到已选"
                                onClick={moveRight}
                            >
                                <ChevronRight size={16} />
                            </button>
                            <button
                                type="button"
                                className="dg-transfer-actions__btn"
                                disabled={!checkedSelected.length}
                                aria-label="移出已选"
                                onClick={moveLeft}
                            >
                                <ChevronLeft size={16} />
                            </button>
                        </div>

                        <div className="dg-transfer-panel">
                            <div className="dg-transfer-panel__head">
                                <span>已选择用户</span>
                                <span className="dg-transfer-panel__count">{selected.length}人</span>
                            </div>
                            <div className="dg-transfer-panel__filter">
                                <ElSelect
                                    className="el-select--medium"
                                    size="medium"
                                    value=""
                                    options={[{ label: '请选择用户角色', value: '' }]}
                                    onChange={() => {}}
                                />
                            </div>
                            <div className="dg-transfer-panel__list">
                                <ul className="dg-transfer-list">
                                    {selected.map((user) => (
                                        <li key={user}>
                                            <label className="dg-transfer-item">
                                                <input
                                                    type="checkbox"
                                                    checked={checkedSelected.includes(user)}
                                                    onChange={() => toggleSelected(user)}
                                                />
                                                <span>{user}</span>
                                            </label>
                                        </li>
                                    ))}
                                    {!selected.length && (
                                        <li className="dg-transfer-empty">暂无已选用户</li>
                                    )}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pcp-drawer__foot">
                    <button type="button" className="pm-btn pm-btn-ghost" onClick={onClose}>取消</button>
                    <button type="button" className="pm-btn pm-btn-primary" onClick={() => onConfirm(selected)}>确定</button>
                </div>
            </aside>
        </div>,
        document.body,
    );
}

// ── Detail Drawer ──

function DetailDrawer({
    open,
    record,
    onClose,
    onForward,
    onCopyPushContent,
}: {
    open: boolean;
    record: HistoryMessageRecord | null;
    onClose: () => void;
    onForward: () => void;
    onCopyPushContent: (success: boolean) => void;
}) {
    const [tab, setTab] = useState<'basic' | 'push'>('basic');
    const [pushRecords, setPushRecords] = useState<PushDeliveryRecord[]>([]);

    React.useEffect(() => {
        if (record) {
            setPushRecords(createInitialPushRecords(record.id));
        }
    }, [record]);

    if (!open || !record) return null;

    const handleResend = (idx: number) => {
        setPushRecords((prev) =>
            prev.map((r, i) =>
                i === idx ? { ...r, resultStatus: '成功' as const, reason: '-', canResend: false } : r,
            ),
        );
    };

    const handleCopyPushContent = async () => {
        const content = record.pushContent;
        if (!content) {
            onCopyPushContent(false);
            return;
        }

        try {
            await navigator.clipboard.writeText(content);
            onCopyPushContent(true);
        } catch {
            try {
                const textarea = document.createElement('textarea');
                textarea.value = content;
                textarea.style.position = 'fixed';
                textarea.style.opacity = '0';
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
                onCopyPushContent(true);
            } catch {
                onCopyPushContent(false);
            }
        }
    };

    return (
        <div className="hm-drawer-mask" onClick={onClose}>
            <div className="hm-drawer" onClick={(e) => e.stopPropagation()}>
                <div className="hm-drawer__head">
                    <h4>详情信息</h4>
                    <button type="button" className="hm-dialog__close" onClick={onClose}>×</button>
                </div>

                <div className="hm-drawer__tabs">
                    <button
                        type="button"
                        className={`hm-drawer__tab ${tab === 'basic' ? 'is-active' : ''}`}
                        onClick={() => setTab('basic')}
                    >
                        基本信息
                    </button>
                    <button
                        type="button"
                        className={`hm-drawer__tab ${tab === 'push' ? 'is-active' : ''}`}
                        onClick={() => setTab('push')}
                    >
                        推送记录
                    </button>
                </div>

                {tab === 'basic' ? (
                    <div className="hm-drawer__body">
                        <div className="hm-info-grid">
                            <div className="hm-info-item">
                                <span className="hm-info-label">消息类型</span>
                                <span className="hm-info-value">{record.messageType}</span>
                            </div>
                            <div className="hm-info-item">
                                <span className="hm-info-label">推送平台</span>
                                <span className="hm-info-value">{record.pushPlatform}</span>
                            </div>
                            <div className="hm-info-item">
                                <span className="hm-info-label">推送时间</span>
                                <span className="hm-info-value">{record.pushTime}</span>
                            </div>
                            <div className="hm-info-item hm-info-item--full">
                                <span className="hm-info-label">推送内容</span>
                                <div className="hm-info-content-block">
                                    <p>{record.pushContent}</p>
                                    <button type="button" className="hm-copy-btn" onClick={handleCopyPushContent}>复制</button>
                                </div>
                            </div>
                            <div className="hm-info-item">
                                <span className="hm-info-label">来源模块</span>
                                <span className="hm-info-value">{record.sourceModule}</span>
                            </div>
                            <div className="hm-info-item">
                                <span className="hm-info-label">推送对象</span>
                                <span className="hm-info-value">{record.pushTargets.join('、')}等{record.pushTargets.length}人</span>
                            </div>
                            <div className="hm-info-item">
                                <span className="hm-info-label">发送状态</span>
                                <span className="hm-info-value">{record.sendStatus}</span>
                            </div>
                            <div className="hm-info-item">
                                <span className="hm-info-label">结果状态</span>
                                <span className={`hm-info-value ${record.resultStatus === '异常' ? 'hm-text-danger' : ''}`}>
                                    {record.resultStatus}
                                </span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="hm-drawer__body">
                        <table className="hm-push-table">
                            <thead>
                                <tr>
                                    <th>序号</th>
                                    <th>用户</th>
                                    <th>结果状态</th>
                                    <th>原因</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pushRecords.map((pr) => (
                                    <tr key={pr.serial}>
                                        <td>{pr.serial}</td>
                                        <td>{pr.user}</td>
                                        <td>
                                            <span className={pr.resultStatus === '失败' ? 'hm-text-danger' : ''}>
                                                {pr.resultStatus}
                                            </span>
                                        </td>
                                        <td>{pr.reason}</td>
                                        <td>
                                            {pr.canResend ? (
                                                <button
                                                    type="button"
                                                    className="hm-link-btn"
                                                    onClick={() => handleResend(pr.serial - 1)}
                                                >
                                                    重发
                                                </button>
                                            ) : (
                                                <span className="hm-link-btn hm-link-btn--disabled">重发</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="hm-drawer__foot">
                    <button type="button" className="pm-btn pm-btn-primary">导出</button>
                    <button type="button" className="pm-btn pm-btn-primary" onClick={onForward}>转发</button>
                    <button type="button" className="pm-btn pm-btn-ghost" onClick={onClose}>取消</button>
                </div>
            </div>
        </div>
    );
}

// ── Main Page ──

type HistoryMessagePageProps = {
    onNavigateHome: () => void;
    onNavigate: (pageId: MessageCenterPageId) => void;
};

export default function HistoryMessagePage({ onNavigateHome, onNavigate }: HistoryMessagePageProps) {
    const [records] = useState<HistoryMessageRecord[]>(createInitialHistoryMessages);
    const [filter, setFilter] = useState<FilterState>({ operationType: '', operator: '', operationResult: '', status: '', startTime: '2026-05-11', endTime: '2026-06-11' });
    const [page, setPage] = useState(1);
    const [detailRecord, setDetailRecord] = useState<HistoryMessageRecord | null>(null);
    const [forwardOpen, setForwardOpen] = useState(false);
    const [toast, setToast] = useState<IotToastData | null>(null);

    const showToast = (message: string, type: IotToastType = 'warning') => {
        triggerIotToast(setToast, message, type);
    };

    const pageSize = 10;

    const filtered = useMemo(() => {
        return records.filter((r) => {
            if (filter.operationType && r.operationType !== filter.operationType) return false;
            if (filter.operator && r.operator !== filter.operator) return false;
            if (filter.operationResult && r.operationResult !== filter.operationResult) return false;
            if (filter.status && r.status !== filter.status) return false;
            if (filter.startTime && r.operationTime < filter.startTime) return false;
            if (filter.endTime && r.operationTime > filter.endTime + ' 23:59:59') return false;
            return true;
        });
    }, [records, filter]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

    const handleReset = () => {
        setFilter({ operationType: '', operator: '', operationResult: '', status: '', startTime: '2026-05-11', endTime: '2026-06-11' });
        setPage(1);
    };

    const handleSearch = () => {
        setPage(1);
    };

    const handleForward = (users: string[]) => {
        setForwardOpen(false);
        showToast(`已转发给 ${users.length} 位用户`, 'success');
    };

    const handleCopyPushContent = (success: boolean) => {
        showToast(success ? '推送内容复制成功' : '复制失败，请重试', success ? 'success' : 'warning');
    };

    const sidebar = <MessageCenterSidebar pageId="history-msg" onNavigate={onNavigate} />;

    return (
        <AppShell
            activeTopTab="消息中心"
            sidebar={sidebar}
            onTopTabChange={() => {}}
        >
            <div className="hm-page">
                <div className="crumb">消息中心 / 历史消息</div>

                <section className="panel pm-filter-panel">
                    <div className="pm-filter-row hm-filter-row">
                        <div className="pm-filter-field">
                            <span className="pm-filter-label">操作类型</span>
                            <ElSelect
                                className="el-select--medium"
                                size="medium"
                                value={filter.operationType}
                                options={OPERATION_TYPE_OPTIONS}
                                onChange={(v) => setFilter((prev) => ({ ...prev, operationType: v }))}
                            />
                        </div>
                        <div className="pm-filter-field">
                            <span className="pm-filter-label">操作人</span>
                            <ElSelect
                                className="el-select--medium"
                                size="medium"
                                value={filter.operator}
                                options={OPERATOR_OPTIONS}
                                onChange={(v) => setFilter((prev) => ({ ...prev, operator: v }))}
                            />
                        </div>
                        <div className="pm-filter-field">
                            <span className="pm-filter-label">操作时间</span>
                            <ElDateRangePicker
                                size="medium"
                                start={filter.startTime}
                                end={filter.endTime}
                                onChange={(range) => setFilter((prev) => ({ ...prev, startTime: range.start, endTime: range.end }))}
                            />
                        </div>
                        <div className="pm-filter-field">
                            <span className="pm-filter-label">操作结果</span>
                            <ElSelect
                                className="el-select--medium"
                                size="medium"
                                value={filter.operationResult}
                                options={RESULT_OPTIONS}
                                onChange={(v) => setFilter((prev) => ({ ...prev, operationResult: v }))}
                            />
                        </div>
                        <div className="pm-filter-field">
                            <span className="pm-filter-label">状态</span>
                            <ElSelect
                                className="el-select--medium"
                                size="medium"
                                value={filter.status}
                                options={STATUS_OPTIONS}
                                onChange={(v) => setFilter((prev) => ({ ...prev, status: v }))}
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

                <section className="panel hm-table-panel">
                    <div className="hm-table-head">
                        <h3>历史消息列表</h3>
                        <button type="button" className="pm-btn pm-btn-ghost">
                            <Download size={14} />
                            导出
                        </button>
                    </div>
                    <div className="hm-table-wrap">
                        <table className="hm-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '5%' }}>序号</th>
                                    <th style={{ width: '13%' }}>操作类型</th>
                                    <th style={{ width: '8%' }}>操作人</th>
                                    <th style={{ width: '16%' }}>操作时间</th>
                                    <th style={{ width: '26%' }}>操作内容</th>
                                    <th style={{ width: '10%' }}>操作结果</th>
                                    <th style={{ width: '8%' }}>状态</th>
                                    <th style={{ width: '14%' }}>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paged.map((record, idx) => (
                                    <tr key={record.id}>
                                        <td>{(page - 1) * pageSize + idx + 1}</td>
                                        <td>{record.operationType}</td>
                                        <td>{record.operator}</td>
                                        <td>{record.operationTime}</td>
                                        <td className="hm-content-cell" title={record.operationContent}>
                                            {record.operationContent.length > 20
                                                ? `${record.operationContent.slice(0, 20)}…`
                                                : record.operationContent}
                                        </td>
                                        <td>
                                            <span className={record.operationResult === '失败' ? 'hm-text-danger' : ''}>
                                                {record.operationResult}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={record.status === '异常' ? 'hm-text-danger' : ''}>
                                                {record.status}
                                            </span>
                                        </td>
                                        <td>
                                            <button
                                                type="button"
                                                className="hm-link-btn"
                                                onClick={() => setDetailRecord(record)}
                                            >
                                                详情
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="hm-pagination">
                        <span className="hm-pagination__info">共 {filtered.length} 条记录 / 第 {page} 页</span>
                        <div className="hm-pagination__controls">
                            <button
                                type="button"
                                disabled={page <= 1}
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                            >
                                <ChevronLeft size={14} />
                                上一页
                            </button>
                            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                                if (p > totalPages) return null;
                                return (
                                    <button
                                        key={p}
                                        type="button"
                                        className={`hm-page-num ${page === p ? 'is-active' : ''}`}
                                        onClick={() => setPage(p)}
                                    >
                                        {p}
                                    </button>
                                );
                            })}
                            <button
                                type="button"
                                disabled={page >= totalPages}
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            >
                                下一页
                                <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                </section>

                <DetailDrawer
                    open={Boolean(detailRecord)}
                    record={detailRecord}
                    onClose={() => setDetailRecord(null)}
                    onForward={() => setForwardOpen(true)}
                    onCopyPushContent={handleCopyPushContent}
                />

                <ForwardUserDrawer
                    open={forwardOpen}
                    onClose={() => setForwardOpen(false)}
                    onConfirm={handleForward}
                />

                <IotToast toast={toast} />
            </div>
        </AppShell>
    );
}
