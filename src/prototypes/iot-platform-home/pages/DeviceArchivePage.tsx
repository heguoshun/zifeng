import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Archive, FileClock, MapPin, Plus, Search, Upload, UserRound, Wrench } from 'lucide-react';
import AppShell from '../components/AppShell';
import ClearableInput from '../components/ClearableInput';
import ElSelect from '../components/ElSelect';
import ElDateTimePicker, { formatDateTimeValue } from '../components/ElDateTimePicker';
import IotToast, { type IotToastData, triggerIotToast } from '../components/IotToast';
import LargeMeterSidebar, { type LargeMeterPageId } from '../components/LargeMeterSidebar';
import ListPagination from '../components/ListPagination';
import {
    createDeviceArchiveRecord,
    DEVICE_ARCHIVE_TYPE_LABELS,
    DEVICE_ARCHIVE_TYPE_OPTIONS,
    type DeviceArchiveRecord,
    type DeviceArchiveType,
} from '../data/deviceArchives';
import type { DeviceRecord } from '../data/devices';
import { isLargeMeterDevice, resolveDeviceProduct, STATUS_LABEL } from '../data/devices';
import type { LargeMeterArea } from '../data/largeMeters';
import type { ProductRecord } from '../data/products';
import { DEFAULT_LIST_PAGE_SIZE, paginateItems } from '../utils/listPagination';
import '../device-access.css';
import '../product-management.css';
import '../device-management.css';
import '../device-archive.css';

type DeviceArchivePageProps = {
    devices: DeviceRecord[];
    products: ProductRecord[];
    areas: LargeMeterArea[];
    records: DeviceArchiveRecord[];
    initialDeviceId?: string | null;
    onUpdateRecords: React.Dispatch<React.SetStateAction<DeviceArchiveRecord[]>>;
    onNavigateDeviceAccess: () => void;
    onNavigate: (pageId: LargeMeterPageId) => void;
    onNavigateMessageCenter?: () => void;
    onNavigateAlarmWorkOrder?: () => void;
    onNavigateSystemManagement?: () => void;
    onNavigateLargeMeterCenter?: () => void;
};

type ArchiveForm = {
    type: DeviceArchiveType;
    occurredAt: string;
    title: string;
    summary: string;
    beforeValue: string;
    afterValue: string;
    operator: string;
    remark: string;
};

function createEmptyForm(): ArchiveForm {
    return {
        type: 'maintenance',
        occurredAt: formatDateTimeValue(new Date()),
        title: '',
        summary: '',
        beforeValue: '',
        afterValue: '',
        operator: 'superadmin',
        remark: '',
    };
}

function ArchiveTypeIcon({ type }: { type: DeviceArchiveType }) {
    if (type === 'user-change') return <UserRound size={16} />;
    if (type === 'location-change' || type === 'installation') return <MapPin size={16} />;
    if (type === 'accessory' || type === 'maintenance' || type === 'calibration') return <Wrench size={16} />;
    return <FileClock size={16} />;
}

function buildDeviceLocation(device: DeviceRecord) {
    if (!device.largeMeterAreaId) return '未记录';
    return device.mapAddress?.trim() || device.installAddress?.trim() || '未记录';
}

function getCurrentUserInfo(device: DeviceRecord) {
    if (!device.largeMeterAreaId) {
        return { name: '—', no: '', searchText: '' };
    }
    const name = device.userName?.trim() || '—';
    const no = device.userNo?.trim() || '';
    return {
        name,
        no,
        searchText: `${name} ${no}`.toLowerCase(),
    };
}

function formatCurrentUserInfo(device: DeviceRecord) {
    const currentUser = getCurrentUserInfo(device);
    return currentUser.no ? `${currentUser.name}（${currentUser.no}）` : currentUser.name;
}

function formatDateTimeMinute(value?: string) {
    const normalized = value?.trim().replace('T', ' ').replace(/[./]/g, '-') ?? '';
    if (!normalized) return '—';
    const match = normalized.match(/^(\d{4})-(\d{1,2})-(\d{1,2})\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?/);
    if (!match) return normalized;
    const [, year, month, day, hour, minute, second = '00'] = match;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')} ${hour.padStart(2, '0')}:${minute.padStart(2, '0')}:${second.padStart(2, '0')}`;
}

function formatDateOnly(value?: string) {
    const formatted = formatDateTimeMinute(value);
    return formatted === '—' ? formatted : formatted.slice(0, 10);
}

function formatCurrentInstallTime(device: DeviceRecord) {
    if (!device.largeMeterAreaId) return '—';
    return formatDateTimeMinute(device.installTime);
}

function formatAccessTime(device: DeviceRecord) {
    return formatDateTimeMinute(device.enabledAt);
}

export default function DeviceArchivePage({
    devices,
    products,
    areas,
    records,
    initialDeviceId,
    onUpdateRecords,
    onNavigateDeviceAccess,
    onNavigate,
    onNavigateMessageCenter,
    onNavigateAlarmWorkOrder,
    onNavigateSystemManagement,
    onNavigateLargeMeterCenter,
}: DeviceArchivePageProps) {
    const [keyword, setKeyword] = useState('');
    const [draftKeyword, setDraftKeyword] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(DEFAULT_LIST_PAGE_SIZE);
    const [jumpPage, setJumpPage] = useState('1');
    const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(initialDeviceId ?? null);
    const [recordType, setRecordType] = useState('all');
    const [recordKeyword, setRecordKeyword] = useState('');
    const [formOpen, setFormOpen] = useState(false);
    const [form, setForm] = useState<ArchiveForm>(createEmptyForm);
    const [attachmentCount, setAttachmentCount] = useState(0);
    const [toast, setToast] = useState<IotToastData | null>(null);
    const attachmentInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (initialDeviceId) setSelectedDeviceId(initialDeviceId);
    }, [initialDeviceId]);

    const largeMeterDevices = useMemo(
        () => devices.filter((device) => isLargeMeterDevice(device, products)),
        [devices, products],
    );

    const filteredDevices = useMemo(() => {
        const normalized = keyword.trim().toLowerCase();
        if (!normalized) return largeMeterDevices;
        return largeMeterDevices.filter((device) => {
            const { productName } = resolveDeviceProduct(device, products);
            const currentUser = getCurrentUserInfo(device);
            return device.name.toLowerCase().includes(normalized)
                || device.code.toLowerCase().includes(normalized)
                || currentUser.searchText.includes(normalized)
                || productName.toLowerCase().includes(normalized);
        });
    }, [keyword, largeMeterDevices, products]);

    const pagination = useMemo(
        () => paginateItems(filteredDevices, currentPage, Number(pageSize)),
        [currentPage, filteredDevices, pageSize],
    );

    useEffect(() => {
        setCurrentPage(1);
        setJumpPage('1');
    }, [keyword, pageSize]);

    useEffect(() => setJumpPage(String(pagination.currentPage)), [pagination.currentPage]);

    const areaMap = useMemo(() => new Map(areas.map((area) => [area.id, area.name])), [areas]);
    const selectedDevice = useMemo(
        () => devices.find((device) => device.id === selectedDeviceId) ?? null,
        [devices, selectedDeviceId],
    );

    const selectedRecords = useMemo(() => {
        if (!selectedDeviceId) return [];
        const normalized = recordKeyword.trim().toLowerCase();
        return records
            .filter((record) => record.deviceId === selectedDeviceId)
            .filter((record) => recordType === 'all' || record.type === recordType)
            .filter((record) => !normalized
                || record.title.toLowerCase().includes(normalized)
                || record.summary.toLowerCase().includes(normalized)
                || record.operator.toLowerCase().includes(normalized))
            .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
    }, [recordKeyword, recordType, records, selectedDeviceId]);

    const recordCounts = useMemo(() => {
        const counts = new Map<string, number>();
        records.forEach((record) => counts.set(record.deviceId, (counts.get(record.deviceId) ?? 0) + 1));
        return counts;
    }, [records]);

    const latestRecords = useMemo(() => {
        const latest = new Map<string, DeviceArchiveRecord>();
        records.forEach((record) => {
            const current = latest.get(record.deviceId);
            if (!current || record.occurredAt > current.occurredAt) latest.set(record.deviceId, record);
        });
        return latest;
    }, [records]);

    const openArchive = (deviceId: string) => {
        setSelectedDeviceId(deviceId);
        setRecordType('all');
        setRecordKeyword('');
        setFormOpen(false);
    };

    const closeArchive = () => {
        setSelectedDeviceId(null);
        setFormOpen(false);
    };

    const openCreateForm = () => {
        setForm(createEmptyForm());
        setAttachmentCount(0);
        if (attachmentInputRef.current) attachmentInputRef.current.value = '';
        setFormOpen(true);
    };

    const saveRecord = () => {
        if (!selectedDeviceId) return;
        if (!form.title.trim() || !form.summary.trim() || !form.occurredAt) {
            triggerIotToast(setToast, '请填写发生时间、记录标题和记录内容');
            return;
        }
        const record = createDeviceArchiveRecord({
            deviceId: selectedDeviceId,
            type: form.type,
            occurredAt: form.occurredAt.replace('T', ' '),
            title: form.title.trim(),
            summary: form.summary.trim(),
            beforeValue: form.beforeValue.trim() || undefined,
            afterValue: form.afterValue.trim() || undefined,
            operator: form.operator.trim() || 'superadmin',
            source: '人工补录',
            remark: form.remark.trim() || undefined,
            attachmentCount,
        });
        onUpdateRecords((previous) => [record, ...previous]);
        setFormOpen(false);
        triggerIotToast(setToast, '设备档案记录已新增', 'success');
    };

    const sidebar = <LargeMeterSidebar pageId="device-archive" onNavigate={onNavigate} />;

    return (
        <AppShell
            activeTopTab="大表中心"
            sidebar={sidebar}
            onNavigateLargeMeterCenter={onNavigateLargeMeterCenter}
            onNavigateMessageCenter={onNavigateMessageCenter}
            onNavigateAlarmWorkOrder={onNavigateAlarmWorkOrder}
            onNavigateSystemManagement={onNavigateSystemManagement}
            onTopTabChange={(tab) => {
                if (tab === '设备接入') onNavigateDeviceAccess();
            }}
        >
            <div className="pm-page da-page">
                <div className="crumb">大表中心 / 大表档案</div>

                <section className="panel pm-filter-panel da-filter-panel">
                    <div className="pm-filter-row">
                        <div className="pm-filter-field">
                            <span className="pm-filter-label">关键词</span>
                            <ClearableInput
                                className="pm-filter-input"
                                type="text"
                                placeholder="设备名称、编号、用户或产品"
                                value={draftKeyword}
                                onChange={(event) => setDraftKeyword(event.target.value)}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter') {
                                        setKeyword(draftKeyword.trim());
                                        setCurrentPage(1);
                                    }
                                }}
                            />
                        </div>
                        <div className="pm-filter-actions">
                            <button
                                type="button"
                                className="pm-btn pm-btn-primary"
                                onClick={() => {
                                    setKeyword(draftKeyword.trim());
                                    setCurrentPage(1);
                                }}
                            >
                                <Search size={14} />
                                查询
                            </button>
                            <button
                                type="button"
                                className="pm-btn pm-btn-ghost"
                                onClick={() => {
                                    setDraftKeyword('');
                                    setKeyword('');
                                    setCurrentPage(1);
                                }}
                            >
                                重置
                            </button>
                        </div>
                    </div>
                </section>

                <section className="panel da-list-panel">
                    <div className="pm-page-title-row da-title-row">
                        <div>
                            <h2>大表档案</h2>
                            <p>集中查看大表的安装、用户、点位、配件及维护履历。</p>
                        </div>
                    </div>

                    <div className="pm-table-wrap">
                        <table className="pm-table da-device-table">
                            <thead>
                                <tr>
                                    <th>设备名称</th>
                                    <th>设备编号</th>
                                    <th>所属产品</th>
                                    <th>当前用户</th>
                                    <th>所属片区</th>
                                    <th>接入时间</th>
                                    <th>档案记录</th>
                                    <th>最近记录</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pagination.items.map((device) => {
                                    const { productName } = resolveDeviceProduct(device, products);
                                    const latest = latestRecords.get(device.id);
                                    const currentUser = getCurrentUserInfo(device);
                                    return (
                                        <tr key={device.id}>
                                            <td>{device.name}</td>
                                            <td>{device.code}</td>
                                            <td>{productName}</td>
                                            <td>{currentUser.name}</td>
                                            <td>{device.largeMeterAreaId ? areaMap.get(device.largeMeterAreaId) || '—' : '未分配'}</td>
                                            <td>{formatAccessTime(device)}</td>
                                            <td>{recordCounts.get(device.id) ?? 0} 条</td>
                                            <td>{latest ? `${DEVICE_ARCHIVE_TYPE_LABELS[latest.type]} - ${formatDateOnly(latest.occurredAt)}` : '—'}</td>
                                            <td><button type="button" className="pm-link-btn" onClick={() => openArchive(device.id)}>查看档案</button></td>
                                        </tr>
                                    );
                                })}
                                {!pagination.items.length && (
                                    <tr><td colSpan={9} className="pcp-empty-cell">暂无符合条件的大表设备</td></tr>
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

            {selectedDevice && (
                <div className="pcp-drawer-mask da-archive-mask" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && closeArchive()}>
                    <aside className="pcp-drawer pcp-drawer--form da-archive-drawer" role="dialog" aria-modal="true" aria-labelledby="device-archive-title" onMouseDown={(event) => event.stopPropagation()}>
                        <div className="pcp-drawer__head">
                            <div>
                                <h3 id="device-archive-title">{selectedDevice.name} - 设备档案</h3>
                                <p>{selectedDevice.code}</p>
                            </div>
                            <button type="button" className="pcp-drawer__close" onClick={closeArchive} aria-label="关闭">×</button>
                        </div>
                        <div className="pcp-drawer__body pcp-drawer__body--form da-archive-body">
                            <section className="da-device-summary">
                                <div className="da-summary-icon"><Archive size={24} /></div>
                                <dl>
                                    <div><dt>当前用户</dt><dd>{formatCurrentUserInfo(selectedDevice)}</dd></div>
                                    <div><dt>所属片区</dt><dd>{selectedDevice.largeMeterAreaId ? areaMap.get(selectedDevice.largeMeterAreaId) || '—' : '未分配'}</dd></div>
                                    <div><dt>安装时间</dt><dd>{formatCurrentInstallTime(selectedDevice)}</dd></div>
                                    <div><dt>当前状态</dt><dd><span className={`dm-status-tag dm-status-tag--${selectedDevice.status}`}>{STATUS_LABEL[selectedDevice.status]}</span></dd></div>
                                    <div className="da-summary-location"><dt>设备点位</dt><dd>{buildDeviceLocation(selectedDevice)}</dd></div>
                                </dl>
                            </section>

                            <div className="da-record-toolbar">
                                <div className="da-record-filters">
                                    <ElSelect
                                        className="el-select--medium da-type-select"
                                        size="medium"
                                        value={recordType}
                                        options={[{ label: '全部类型', value: 'all' }, ...DEVICE_ARCHIVE_TYPE_OPTIONS]}
                                        onChange={setRecordType}
                                    />
                                    <ClearableInput
                                        className="pm-filter-input da-record-search"
                                        type="text"
                                        placeholder="记录标题、内容或操作人"
                                        value={recordKeyword}
                                        onChange={(event) => setRecordKeyword(event.target.value)}
                                    />
                                </div>
                                <button type="button" className="pm-btn pm-btn-primary" onClick={openCreateForm}><Plus size={14} />新增记录</button>
                            </div>

                            {formOpen && (
                                <section className="da-create-form">
                                    <div className="da-create-form__head"><h4>新增档案记录</h4><button type="button" onClick={() => setFormOpen(false)}>收起</button></div>
                                    <div className="da-form-grid">
                                        <div><span><em>*</em> 记录类型</span><ElSelect size="medium" value={form.type} options={DEVICE_ARCHIVE_TYPE_OPTIONS} onChange={(value) => setForm((previous) => ({ ...previous, type: value as DeviceArchiveType }))} /></div>
                                        <div><span><em>*</em> 发生时间</span><ElDateTimePicker className="da-datetime-picker" size="medium" value={form.occurredAt} placeholder="请选择发生时间" onChange={(occurredAt) => setForm((previous) => ({ ...previous, occurredAt }))} /></div>
                                        <label className="da-form-wide"><span><em>*</em> 记录标题</span><ClearableInput type="text" placeholder="例如：更换通讯模块" value={form.title} onChange={(event) => setForm((previous) => ({ ...previous, title: event.target.value }))} /></label>
                                        <label className="da-form-wide"><span><em>*</em> 记录内容</span><textarea placeholder="说明本次安装、变更或维护内容" value={form.summary} onChange={(event) => setForm((previous) => ({ ...previous, summary: event.target.value }))} /></label>
                                        <label><span>变更前</span><ClearableInput type="text" placeholder="原用户、原配件或原位置" value={form.beforeValue} onChange={(event) => setForm((previous) => ({ ...previous, beforeValue: event.target.value }))} /></label>
                                        <label><span>变更后</span><ClearableInput type="text" placeholder="新用户、新配件或新位置" value={form.afterValue} onChange={(event) => setForm((previous) => ({ ...previous, afterValue: event.target.value }))} /></label>
                                        <label><span>操作人</span><ClearableInput type="text" value={form.operator} onChange={(event) => setForm((previous) => ({ ...previous, operator: event.target.value }))} /></label>
                                        <div className="da-form-field">
                                            <span>附件</span>
                                            <input ref={attachmentInputRef} className="da-attachment-input" type="file" multiple onChange={(event) => setAttachmentCount(event.target.files?.length ?? 0)} />
                                            <div className="da-attachment-control">
                                                <button type="button" className="pm-btn pm-btn-ghost" onClick={() => attachmentInputRef.current?.click()}><Upload size={14} />选择附件</button>
                                                <small>{attachmentCount ? `已选择 ${attachmentCount} 个附件` : '支持多选'}</small>
                                            </div>
                                        </div>
                                        <label className="da-form-wide"><span>备注</span><textarea placeholder="可补充更换原因、现场情况等信息" value={form.remark} onChange={(event) => setForm((previous) => ({ ...previous, remark: event.target.value }))} /></label>
                                    </div>
                                    <div className="da-create-form__foot"><button type="button" className="pm-btn pm-btn-ghost" onClick={() => setFormOpen(false)}>取消</button><button type="button" className="pm-btn pm-btn-primary" onClick={saveRecord}>保存记录</button></div>
                                </section>
                            )}

                            <section className="da-timeline" aria-label="设备档案时间线">
                                {selectedRecords.map((record) => (
                                    <article className="da-timeline-item" key={record.id}>
                                        <div className={`da-timeline-icon da-timeline-icon--${record.type}`}><ArchiveTypeIcon type={record.type} /></div>
                                        <div className="da-timeline-content">
                                            <div className="da-timeline-head"><div><span className="da-record-type">{DEVICE_ARCHIVE_TYPE_LABELS[record.type]}</span><h4>{record.title}</h4></div><time>{formatDateTimeMinute(record.occurredAt)}</time></div>
                                            <p>{record.summary}</p>
                                            {(record.beforeValue || record.afterValue) && <div className="da-change-row"><span>变更前：{record.beforeValue || '—'}</span><span>变更后：{record.afterValue || '—'}</span></div>}
                                            {record.remark && <div className="da-record-remark">备注：{record.remark}</div>}
                                            <div className="da-record-meta"><span>操作人：{record.operator}</span><span>来源：{record.source}</span>{record.attachmentCount ? <span>附件：{record.attachmentCount} 个</span> : null}</div>
                                        </div>
                                    </article>
                                ))}
                                {!selectedRecords.length && <div className="da-empty-records">暂无符合条件的档案记录</div>}
                            </section>
                        </div>
                        <div className="pcp-drawer__foot"><button type="button" className="pm-btn pm-btn-ghost" onClick={closeArchive}>关闭</button></div>
                    </aside>
                </div>
            )}
            <IotToast toast={toast} />
        </AppShell>
    );
}
