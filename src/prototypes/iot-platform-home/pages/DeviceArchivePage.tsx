import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Archive, FileClock, FileText, MapPin, Pencil, Plus, Search, Trash2, Upload, UserRound, Wrench } from 'lucide-react';
import AppShell from '../components/AppShell';
import Breadcrumb from '../components/Breadcrumb';
import ClearableInput from '../components/ClearableInput';
import ElSelect from '../components/ElSelect';
import ElDateTimePicker, { formatDateTimeValue } from '../components/ElDateTimePicker';
import { ConfirmDialog } from '../components/IotDialogs';
import IotToast, { type IotToastData, triggerIotToast } from '../components/IotToast';
import LargeMeterSidebar, { type LargeMeterPageId } from '../components/LargeMeterSidebar';
import ListPagination from '../components/ListPagination';
import MapPickerDialog, { type MapPickerValue } from '../components/MapPickerDialog';
import {
    createDeviceArchiveRecord,
    DEVICE_ARCHIVE_TYPE_LABELS,
    DEVICE_ARCHIVE_TYPE_OPTIONS,
    MANUAL_DEVICE_ARCHIVE_TYPE_OPTIONS,
    SYSTEM_GENERATED_ARCHIVE_TYPES,
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
    currentUserName: string;
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
    beforeLongitude: string;
    beforeLatitude: string;
    afterLongitude: string;
    afterLatitude: string;
    operator: string;
    remark: string;
};

type ArchiveFormConfig = {
    titleLabel?: string;
    titlePlaceholder?: string;
    generatedTitle?: string;
    summaryLabel: string;
    summaryPlaceholder: string;
    beforeLabel?: string;
    beforePlaceholder?: string;
    beforeRequired?: boolean;
    afterLabel?: string;
    afterPlaceholder?: string;
    afterRequired?: boolean;
    remarkPlaceholder: string;
};

const ARCHIVE_FORM_CONFIGS: Record<Exclude<DeviceArchiveType, 'access' | 'installation' | 'status-change'>, ArchiveFormConfig> = {
    accessory: {
        titleLabel: '更换配件',
        titlePlaceholder: '例如：NB-IoT 通讯模块',
        summaryLabel: '更换原因及处理过程',
        summaryPlaceholder: '说明故障现象、更换原因和现场处理过程',
        beforeLabel: '原配件信息',
        beforePlaceholder: '原配件名称、型号或序列号',
        beforeRequired: true,
        afterLabel: '新配件信息',
        afterPlaceholder: '新配件名称、型号或序列号',
        afterRequired: true,
        remarkPlaceholder: '可补充配件来源、质保情况等信息',
    },
    'user-change': {
        generatedTitle: '用户变更',
        summaryLabel: '变更原因',
        summaryPlaceholder: '说明用户变更原因和办理情况',
        beforeLabel: '原用户名称',
        beforePlaceholder: '请输入原用户名称',
        beforeRequired: true,
        afterLabel: '新用户名称',
        afterPlaceholder: '请输入新用户名称',
        afterRequired: true,
        remarkPlaceholder: '可补充交接、资料核验等信息',
    },
    'location-change': {
        generatedTitle: '位置变更',
        summaryLabel: '变更原因',
        summaryPlaceholder: '说明迁移原因、施工情况和点位调整',
        beforeLabel: '原安装位置',
        beforePlaceholder: '变更前的安装地址或点位',
        afterLabel: '新安装位置',
        afterPlaceholder: '变更后的安装地址或点位',
        afterRequired: true,
        remarkPlaceholder: '可补充坐标、现场环境等信息',
    },
    maintenance: {
        titleLabel: '维护项目',
        titlePlaceholder: '例如：例行巡检、阀门维修',
        summaryLabel: '维护内容',
        summaryPlaceholder: '记录检查项、故障现象和处理过程',
        afterLabel: '处理结果',
        afterPlaceholder: '例如：设备恢复正常、需继续观察',
        afterRequired: true,
        remarkPlaceholder: '可补充后续计划、耗材使用等信息',
    },
    calibration: {
        titleLabel: '检定项目',
        titlePlaceholder: '例如：周期检定、现场校准',
        summaryLabel: '检定过程',
        summaryPlaceholder: '记录检定机构、检定依据和执行过程',
        afterLabel: '检定结果',
        afterPlaceholder: '例如：合格，误差符合标准要求',
        afterRequired: true,
        remarkPlaceholder: '可补充证书编号、有效期等信息',
    },
    other: {
        titleLabel: '记录标题',
        titlePlaceholder: '概括本次记录事项',
        summaryLabel: '记录内容',
        summaryPlaceholder: '说明事项经过和处理结果',
        remarkPlaceholder: '可补充其他说明',
    },
};

function createEmptyForm(operator = '当前用户'): ArchiveForm {
    return {
        type: 'maintenance',
        occurredAt: formatDateTimeValue(new Date()),
        title: '',
        summary: '',
        beforeValue: '',
        afterValue: '',
        beforeLongitude: '',
        beforeLatitude: '',
        afterLongitude: '',
        afterLatitude: '',
        operator,
        remark: '',
    };
}

function getArchiveFormConfig(type: DeviceArchiveType): ArchiveFormConfig {
    if (type === 'access' || type === 'installation' || type === 'status-change') {
        return ARCHIVE_FORM_CONFIGS.other;
    }
    return ARCHIVE_FORM_CONFIGS[type];
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

function parseCoordinate(value: string): number | undefined {
    const normalized = value.trim();
    if (!normalized) return undefined;
    const coordinate = Number(normalized);
    return Number.isFinite(coordinate) ? coordinate : undefined;
}

function formatCoordinates(longitude?: number, latitude?: number) {
    if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) return '—';
    return `${longitude!.toFixed(6)}, ${latitude!.toFixed(6)}`;
}

function isEditableArchiveRecord(record: DeviceArchiveRecord): boolean {
    return record.source === '人工补录';
}

function parseUserNoFromValue(value: string): string | undefined {
    const match = value.match(/（(YH\d+)）$/);
    return match ? match[1] : undefined;
}

function recordToForm(record: DeviceArchiveRecord): ArchiveForm {
    let afterValue = record.afterValue ?? '';
    if (record.type === 'user-change' && afterValue) {
        const userNo = parseUserNoFromValue(afterValue);
        if (userNo) {
            afterValue = afterValue.replace(`（${userNo}）`, '').trim();
        }
    }
    return {
        type: record.type,
        occurredAt: record.occurredAt,
        title: record.title,
        summary: record.summary,
        beforeValue: record.beforeValue ?? '',
        afterValue,
        beforeLongitude: record.beforeLongitude === undefined ? '' : String(record.beforeLongitude),
        beforeLatitude: record.beforeLatitude === undefined ? '' : String(record.beforeLatitude),
        afterLongitude: record.afterLongitude === undefined ? '' : String(record.afterLongitude),
        afterLatitude: record.afterLatitude === undefined ? '' : String(record.afterLatitude),
        operator: record.operator,
        remark: record.remark ?? '',
    };
}

type ArchiveAttachmentItem = {
    id: string;
    name: string;
    kind: 'image' | 'file';
    previewUrl?: string;
};

function isImageAttachmentName(name: string): boolean {
    return /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(name);
}

function buildAttachmentPreviewSvg(label: string, tone: 'blue' | 'green' | 'amber'): string {
    const palette = {
        blue: { bg: '#ecf5ff', border: '#b3d8ff', accent: '#409eff', text: '#1d39c4' },
        green: { bg: '#f0f9eb', border: '#c2e7b0', accent: '#67c23a', text: '#3f6212' },
        amber: { bg: '#fdf6ec', border: '#f3d19e', accent: '#e6a23c', text: '#9a5b13' },
    }[tone];
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="320" viewBox="0 0 480 320">
        <rect width="480" height="320" fill="${palette.bg}"/>
        <rect x="24" y="24" width="432" height="272" rx="12" fill="#fff" stroke="${palette.border}" stroke-width="2"/>
        <circle cx="96" cy="96" r="28" fill="${palette.accent}" opacity="0.18"/>
        <path d="M72 220 L160 132 L232 188 L312 108 L408 220 Z" fill="${palette.accent}" opacity="0.28"/>
        <rect x="320" y="72" width="96" height="72" rx="8" fill="${palette.accent}" opacity="0.16"/>
        <text x="240" y="286" text-anchor="middle" fill="${palette.text}" font-size="18" font-family="Arial, sans-serif">${label}</text>
    </svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function buildMockAttachmentItems(record: DeviceArchiveRecord): ArchiveAttachmentItem[] {
    const count = record.attachmentCount ?? 0;
    const tones: Array<'blue' | 'green' | 'amber'> = ['blue', 'green', 'amber'];
    const templates = record.type === 'accessory'
        ? ['通讯模块更换现场照片1.jpg', '通讯模块更换验收单.pdf']
        : [`${record.title}-现场照片.jpg`, `${record.title}-说明文档.pdf`];

    return Array.from({ length: count }, (_, index) => {
        const name = templates[index] ?? `${record.title}-附件${index + 1}.jpg`;
        const kind = isImageAttachmentName(name) ? 'image' : 'file';
        return {
            id: `${record.id}-attachment-${index}`,
            name,
            kind,
            previewUrl: kind === 'image'
                ? buildAttachmentPreviewSvg(`现场照片 ${index + 1}`, tones[index % tones.length])
                : undefined,
        };
    });
}

function downloadMockAttachment(attachment: ArchiveAttachmentItem) {
    const blob = new Blob([`模拟附件内容：${attachment.name}`], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = attachment.name;
    anchor.click();
    URL.revokeObjectURL(url);
}

function AttachmentPreviewDialog({
    attachment,
    onClose,
}: {
    attachment: ArchiveAttachmentItem;
    onClose: () => void;
}) {
    useEffect(() => {
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, []);

    if (!attachment.previewUrl) return null;

    return createPortal(
        <div
            className="iot-dialog-mask da-attachment-preview-mask"
            role="presentation"
            onMouseDown={(event) => event.target === event.currentTarget && onClose()}
        >
            <div
                className="iot-dialog da-attachment-preview-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="da-attachment-preview-title"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <div className="iot-dialog__head">
                    <h3 id="da-attachment-preview-title">图片预览</h3>
                    <button type="button" className="pcp-drawer__close" onClick={onClose} aria-label="关闭">×</button>
                </div>
                <div className="iot-dialog__body da-attachment-preview-dialog__body">
                    <p className="da-attachment-preview-dialog__name">{attachment.name}</p>
                    <img src={attachment.previewUrl} alt={attachment.name} />
                </div>
                <div className="iot-dialog__foot">
                    <button type="button" className="pm-btn pm-btn-ghost" onClick={onClose}>关闭</button>
                </div>
            </div>
        </div>,
        document.body,
    );
}

export default function DeviceArchivePage({
    devices,
    products,
    areas,
    records,
    initialDeviceId,
    currentUserName,
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
    const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<DeviceArchiveRecord | null>(null);
    const [expandedAttachmentRecordId, setExpandedAttachmentRecordId] = useState<string | null>(null);
    const [previewAttachment, setPreviewAttachment] = useState<ArchiveAttachmentItem | null>(null);
    const [mapPickerOpen, setMapPickerOpen] = useState(false);
    const [form, setForm] = useState<ArchiveForm>(() => createEmptyForm(currentUserName));
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
    const hasBoundUser = Boolean(
        selectedDevice?.largeMeterAreaId
        && selectedDevice.userName?.trim(),
    );
    const availableManualArchiveTypeOptions = useMemo(
        () => hasBoundUser
            ? MANUAL_DEVICE_ARCHIVE_TYPE_OPTIONS
            : MANUAL_DEVICE_ARCHIVE_TYPE_OPTIONS.filter((option) => option.value !== 'user-change'),
        [hasBoundUser],
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
        setEditingRecordId(null);
        setDeleteTarget(null);
        setExpandedAttachmentRecordId(null);
        setPreviewAttachment(null);
    };

    const openCreateForm = () => {
        setEditingRecordId(null);
        setForm(createEmptyForm(currentUserName));
        setAttachmentCount(0);
        if (attachmentInputRef.current) attachmentInputRef.current.value = '';
        setFormOpen(true);
    };

    const openEditForm = (record: DeviceArchiveRecord) => {
        setEditingRecordId(record.id);
        setForm(recordToForm(record));
        setAttachmentCount(record.attachmentCount ?? 0);
        if (attachmentInputRef.current) attachmentInputRef.current.value = '';
        setFormOpen(true);
    };

    const closeForm = () => {
        setFormOpen(false);
        setEditingRecordId(null);
    };

    const saveRecord = () => {
        if (!selectedDeviceId) return;
        if (!editingRecordId && SYSTEM_GENERATED_ARCHIVE_TYPES.has(form.type)) {
            triggerIotToast(setToast, '该记录类型由操作设备时系统自动生成');
            return;
        }
        if (form.type === 'user-change' && !hasBoundUser) {
            triggerIotToast(setToast, '设备未绑定用户，不能进行用户变更');
            return;
        }
        const config = getArchiveFormConfig(form.type);
        const resolvedTitle = config.generatedTitle ?? form.title.trim();
        const isLocationChange = form.type === 'location-change';
        const beforeLongitude = parseCoordinate(form.beforeLongitude);
        const beforeLatitude = parseCoordinate(form.beforeLatitude);
        const afterLongitude = parseCoordinate(form.afterLongitude);
        const afterLatitude = parseCoordinate(form.afterLatitude);
        const missingFields = [
            !form.occurredAt ? '发生时间' : '',
            !resolvedTitle ? config.titleLabel || '记录标题' : '',
            !form.summary.trim() ? config.summaryLabel : '',
            config.beforeRequired && !form.beforeValue.trim() ? config.beforeLabel || '变更前信息' : '',
            config.afterRequired && !form.afterValue.trim() ? config.afterLabel || '变更后信息' : '',
            isLocationChange && afterLongitude === undefined ? '新经度' : '',
            isLocationChange && afterLatitude === undefined ? '新纬度' : '',
        ].filter(Boolean);
        if (missingFields.length) {
            triggerIotToast(setToast, `请填写${missingFields.join('、')}`);
            return;
        }
        if (isLocationChange && (Math.abs(afterLongitude!) > 180 || Math.abs(afterLatitude!) > 90)) {
            triggerIotToast(setToast, '经度范围应为 -180～180，纬度范围应为 -90～90');
            return;
        }

        if (editingRecordId) {
            let finalAfterValue = form.afterValue.trim() || undefined;
            let finalBeforeValue = form.beforeValue.trim() || undefined;
            if (form.type === 'user-change') {
                const inheritedUserNo = parseUserNoFromValue(form.beforeValue);
                if (inheritedUserNo && finalAfterValue) {
                    finalAfterValue = `${finalAfterValue}（${inheritedUserNo}）`;
                }
            }
            onUpdateRecords((previous) => previous.map((record) => (
                record.id === editingRecordId
                    ? {
                        ...record,
                        type: record.type,
                        occurredAt: form.occurredAt.replace('T', ' '),
                        title: resolvedTitle,
                        summary: form.summary.trim(),
                        beforeValue: finalBeforeValue,
                        afterValue: finalAfterValue,
                        beforeLongitude: isLocationChange ? beforeLongitude : undefined,
                        beforeLatitude: isLocationChange ? beforeLatitude : undefined,
                        afterLongitude: isLocationChange ? afterLongitude : undefined,
                        afterLatitude: isLocationChange ? afterLatitude : undefined,
                        remark: form.remark.trim() || undefined,
                        attachmentCount: attachmentCount || undefined,
                    }
                    : record
            )));
            closeForm();
            triggerIotToast(setToast, '设备档案记录已更新', 'success');
            return;
        }

        let finalAfterValue = form.afterValue.trim() || undefined;
        let finalBeforeValue = form.beforeValue.trim() || undefined;
        if (form.type === 'user-change') {
            const inheritedUserNo = parseUserNoFromValue(form.beforeValue);
            if (inheritedUserNo && finalAfterValue) {
                finalAfterValue = `${finalAfterValue}（${inheritedUserNo}）`;
            }
        }

        const record = createDeviceArchiveRecord({
            deviceId: selectedDeviceId,
            type: form.type,
            occurredAt: form.occurredAt.replace('T', ' '),
            title: resolvedTitle,
            summary: form.summary.trim(),
            beforeValue: finalBeforeValue,
            afterValue: finalAfterValue,
            beforeLongitude: isLocationChange ? beforeLongitude : undefined,
            beforeLatitude: isLocationChange ? beforeLatitude : undefined,
            afterLongitude: isLocationChange ? afterLongitude : undefined,
            afterLatitude: isLocationChange ? afterLatitude : undefined,
            operator: currentUserName,
            source: '人工补录',
            remark: form.remark.trim() || undefined,
            attachmentCount,
        });
        onUpdateRecords((previous) => [record, ...previous]);
        closeForm();
        triggerIotToast(setToast, '设备档案记录已新增', 'success');
    };

    const formConfig = getArchiveFormConfig(form.type);

    const handleArchiveTypeChange = (value: string) => {
        if (editingRecordId) return;
        const currentUserName = selectedDevice ? getCurrentUserInfo(selectedDevice).name : '—';
        setForm((previous) => ({
            ...previous,
            type: value as DeviceArchiveType,
            title: '',
            summary: '',
            beforeValue: value === 'location-change' && selectedDevice
                ? buildDeviceLocation(selectedDevice)
                : value === 'user-change'
                    ? (currentUserName === '—' ? '未绑定用户' : currentUserName)
                    : '',
            afterValue: '',
            beforeLongitude: value === 'location-change' && Number.isFinite(selectedDevice?.longitude) ? String(selectedDevice?.longitude) : '',
            beforeLatitude: value === 'location-change' && Number.isFinite(selectedDevice?.latitude) ? String(selectedDevice?.latitude) : '',
            afterLongitude: '',
            afterLatitude: '',
        }));
    };

    const handleConfirmMapPoint = (value: MapPickerValue) => {
        setForm((previous) => ({
            ...previous,
            afterValue: value.location,
            afterLongitude: value.longitude,
            afterLatitude: value.latitude,
        }));
        triggerIotToast(setToast, '新位置已选择', 'success');
    };

    const confirmDeleteRecord = () => {
        if (!deleteTarget) return;
        onUpdateRecords((previous) => previous.filter((record) => record.id !== deleteTarget.id));
        if (editingRecordId === deleteTarget.id) closeForm();
        setDeleteTarget(null);
        triggerIotToast(setToast, '设备档案记录已删除', 'success');
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
                <Breadcrumb items={[
                                    { label: '大表中心', pageId: 'data-monitor' },
                                    { label: '大表档案' },
                                ]} onNavigate={(id) => onNavigate(id as LargeMeterPageId)} />

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
                            <p>集中查看大表的接入、安装、用户、点位、配件及维护履历。</p>
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

                            {formOpen && (() => {
                                const formPanel = (
                                <section className="da-create-form">
                                    <div className="da-create-form__head"><h4>{editingRecordId ? '编辑档案记录' : '新增档案记录'}</h4><button type="button" onClick={closeForm}>收起</button></div>
                                    <div className="da-form-grid">
                                        <div className="da-form-field">
                                            <span><em>*</em> 记录类型</span>
                                            <ElSelect size="medium" value={form.type} options={availableManualArchiveTypeOptions} onChange={handleArchiveTypeChange} disabled={Boolean(editingRecordId)} />
                                            <small className="da-form-tip">{editingRecordId ? '编辑记录时不可更改记录类型' : '设备接入、安装投运、启停变更由操作设备时系统自动生成'}</small>
                                        </div>
                                        <div><span><em>*</em> 发生时间</span><ElDateTimePicker className="da-datetime-picker" size="medium" value={form.occurredAt} placeholder="请选择发生时间" onChange={(occurredAt) => setForm((previous) => ({ ...previous, occurredAt }))} /></div>
                                        {formConfig.titleLabel && (
                                            <label className="da-form-wide"><span><em>*</em> {formConfig.titleLabel}</span><ClearableInput type="text" placeholder={formConfig.titlePlaceholder} value={form.title} onChange={(event) => setForm((previous) => ({ ...previous, title: event.target.value }))} /></label>
                                        )}
                                        <label className="da-form-wide"><span><em>*</em> {formConfig.summaryLabel}</span><textarea placeholder={formConfig.summaryPlaceholder} value={form.summary} onChange={(event) => setForm((previous) => ({ ...previous, summary: event.target.value }))} /></label>
                                        {form.type === 'user-change' && (
                                            <div className="da-form-field">
                                                <span><em>*</em> 原用户名称</span>
                                                <div className="da-readonly-field" aria-readonly="true">{form.beforeValue || '未绑定用户'}</div>
                                            </div>
                                        )}
                                        {formConfig.beforeLabel && form.type !== 'location-change' && form.type !== 'user-change' && (
                                            <label><span>{formConfig.beforeRequired && <em>*</em>} {formConfig.beforeLabel}</span><ClearableInput type="text" placeholder={formConfig.beforePlaceholder} value={form.beforeValue} onChange={(event) => setForm((previous) => ({ ...previous, beforeValue: event.target.value }))} /></label>
                                        )}
                                        {formConfig.afterLabel && form.type !== 'location-change' && (
                                            <label className={formConfig.beforeLabel ? undefined : 'da-form-wide'}><span>{formConfig.afterRequired && <em>*</em>} {formConfig.afterLabel}</span><ClearableInput type="text" placeholder={formConfig.afterPlaceholder} value={form.afterValue} onChange={(event) => setForm((previous) => ({ ...previous, afterValue: event.target.value }))} /></label>
                                        )}
                                        {form.type === 'location-change' && (
                                            <div className="da-location-picker da-form-wide">
                                                <div className="da-location-picker__head">
                                                    <span><em>*</em> 新安装位置</span>
                                                    <button type="button" className="pm-btn pm-btn-ghost" onClick={() => setMapPickerOpen(true)}><MapPin size={14} />选择新位置</button>
                                                </div>
                                                <dl>
                                                    <div><dt>位置</dt><dd>{form.afterValue || '暂未选择'}</dd></div>
                                                    <div><dt>经度</dt><dd>{form.afterLongitude || '—'}</dd></div>
                                                    <div><dt>纬度</dt><dd>{form.afterLatitude || '—'}</dd></div>
                                                </dl>
                                                <small>原安装位置和原坐标将从设备当前档案中自动记录。</small>
                                            </div>
                                        )}
                                        <div className="da-form-field"><span>操作人</span><div className="da-readonly-field" aria-readonly="true">{form.operator}</div></div>
                                        <div className="da-form-field">
                                            <span>附件</span>
                                            <input ref={attachmentInputRef} className="da-attachment-input" type="file" multiple onChange={(event) => setAttachmentCount(event.target.files?.length ?? 0)} />
                                            <div className="da-attachment-control">
                                                <button type="button" className="pm-btn pm-btn-ghost" onClick={() => attachmentInputRef.current?.click()}><Upload size={14} />选择附件</button>
                                                <small>{attachmentCount ? `已选择 ${attachmentCount} 个附件` : '支持多选'}</small>
                                            </div>
                                        </div>
                                        <label className="da-form-wide"><span>备注</span><textarea placeholder={formConfig.remarkPlaceholder} value={form.remark} onChange={(event) => setForm((previous) => ({ ...previous, remark: event.target.value }))} /></label>
                                    </div>
                                    <div className="da-create-form__foot"><button type="button" className="pm-btn pm-btn-ghost" onClick={closeForm}>取消</button><button type="button" className="pm-btn pm-btn-primary" onClick={saveRecord}>{editingRecordId ? '保存修改' : '保存记录'}</button></div>
                                </section>
                                );
                                if (!editingRecordId) return formPanel;
                                const editTarget = document.getElementById(`da-edit-slot-${editingRecordId}`);
                                return editTarget ? createPortal(formPanel, editTarget) : null;
                            })()}

                            <section className="da-timeline" aria-label="设备档案时间线">
                                {selectedRecords.map((record) => (
                                    <article className="da-timeline-item" key={record.id}>
                                        <div className={`da-timeline-icon da-timeline-icon--${record.type}`}><ArchiveTypeIcon type={record.type} /></div>
                                        <div className="da-timeline-content">
                                            <div className="da-timeline-head">
                                                <div>
                                                    <span className="da-record-type">{DEVICE_ARCHIVE_TYPE_LABELS[record.type]}</span>
                                                    <h4>{record.title}</h4>
                                                </div>
                                                <div className="da-timeline-head__side">
                                                    {isEditableArchiveRecord(record) && (
                                                        <div className="da-record-actions">
                                                            {!(record.type === 'user-change' && !hasBoundUser) && <button type="button" className="pm-link-btn" onClick={() => openEditForm(record)}><Pencil size={13} />编辑</button>}
                                                            <button type="button" className="pm-link-btn da-link-btn--danger" onClick={() => setDeleteTarget(record)}><Trash2 size={13} />删除</button>
                                                        </div>
                                                    )}
                                                    <time>{formatDateTimeMinute(record.occurredAt)}</time>
                                                </div>
                                            </div>
                                            <p>{record.summary}</p>
                                            {record.type !== 'access' && record.type !== 'installation' && record.type !== 'calibration' && (record.beforeValue || record.afterValue) && (
                                                <div className="da-change-row">
                                                    {record.type === 'user-change' ? (
                                                        <>
                                                            <span>变更前：{parseUserNoFromValue(record.beforeValue || '') ? (record.beforeValue || '').replace(/（YH\d+）$/, '') : (record.beforeValue || '—')}</span>
                                                            <span>变更后：{parseUserNoFromValue(record.afterValue || '') ? (record.afterValue || '').replace(/（YH\d+）$/, '') : (record.afterValue || '—')}</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <span>变更前：{record.beforeValue || '—'}</span>
                                                            <span>变更后：{record.afterValue || '—'}</span>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                            {record.type === 'calibration' && record.afterValue && <div className="da-record-remark">检定结果：{record.afterValue}</div>}
                                            {record.type === 'location-change' && (
                                                <div className="da-change-row da-coordinate-row">
                                                    <span>原坐标：{formatCoordinates(record.beforeLongitude, record.beforeLatitude)}</span>
                                                    <span>新坐标：{formatCoordinates(record.afterLongitude, record.afterLatitude)}</span>
                                                </div>
                                            )}
                                            {record.remark && <div className="da-record-remark">备注：{record.remark}</div>}
                                            <div className="da-record-meta">
                                                <span>操作人：{record.operator}</span>
                                                <span>来源：{record.source}</span>
                                                {record.attachmentCount ? (
                                                    <span className="da-attachment-meta">
                                                        附件：{record.attachmentCount} 个
                                                        <button
                                                            type="button"
                                                            className="pm-link-btn"
                                                            onClick={() => {
                                                                setExpandedAttachmentRecordId((current) => {
                                                                    if (current === record.id) {
                                                                        setPreviewAttachment(null);
                                                                        return null;
                                                                    }
                                                                    setPreviewAttachment(null);
                                                                    return record.id;
                                                                });
                                                            }}
                                                        >
                                                            {expandedAttachmentRecordId === record.id ? '收起附件' : '查看附件'}
                                                        </button>
                                                    </span>
                                                ) : null}
                                            </div>
                                            {record.attachmentCount && expandedAttachmentRecordId === record.id ? (
                                                <ul className="da-attachment-panel">
                                                    {buildMockAttachmentItems(record).map((attachment) => (
                                                        <li key={attachment.id}>
                                                            <div className="da-attachment-row">
                                                                {attachment.kind === 'image' && attachment.previewUrl ? (
                                                                    <button
                                                                        type="button"
                                                                        className="da-attachment-thumb-btn"
                                                                        aria-label={`预览 ${attachment.name}`}
                                                                        onClick={() => setPreviewAttachment(attachment)}
                                                                    >
                                                                        <img src={attachment.previewUrl} alt={attachment.name} />
                                                                    </button>
                                                                ) : (
                                                                    <span className="da-attachment-file-icon" aria-hidden="true">
                                                                        <FileText size={22} />
                                                                    </span>
                                                                )}
                                                                <span className="da-attachment-name">{attachment.name}</span>
                                                                {attachment.kind === 'image' ? (
                                                                    <button
                                                                        type="button"
                                                                        className="pm-link-btn"
                                                                        onClick={() => setPreviewAttachment(attachment)}
                                                                    >
                                                                        预览
                                                                    </button>
                                                                ) : (
                                                                    <button
                                                                        type="button"
                                                                        className="pm-link-btn"
                                                                        onClick={() => downloadMockAttachment(attachment)}
                                                                    >
                                                                        下载
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : null}
                                            <div id={`da-edit-slot-${record.id}`} className="da-inline-edit-slot" />
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
            {deleteTarget && (
                <ConfirmDialog
                    title="删除档案记录"
                    message={`确定删除「${deleteTarget.title}」吗？删除后不可恢复。`}
                    onClose={() => setDeleteTarget(null)}
                    onConfirm={confirmDeleteRecord}
                />
            )}
            {previewAttachment?.previewUrl && (
                <AttachmentPreviewDialog
                    attachment={previewAttachment}
                    onClose={() => setPreviewAttachment(null)}
                />
            )}
            <IotToast toast={toast} />

            <MapPickerDialog
                open={mapPickerOpen}
                initialValue={{
                    location: form.afterValue,
                    longitude: form.afterLongitude,
                    latitude: form.afterLatitude,
                }}
                onClose={() => setMapPickerOpen(false)}
                onConfirm={handleConfirmMapPoint}
            />
        </AppShell>
    );
}
