import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Info, Plus } from 'lucide-react';
import AppShell from '../components/AppShell';
import Breadcrumb from '../components/Breadcrumb';
import { ConfirmDialog } from '../components/IotDialogs';
import ListPagination from '../components/ListPagination';
import DeviceAccessSidebar, { type DeviceAccessPageId } from '../components/DeviceAccessSidebar';
import ElSelect from '../components/ElSelect';
import MapPickerDialog from '../components/MapPickerDialog';
import DeviceGroupDialog, { type DeviceGroupType } from '../components/DeviceGroupDialog';
import DevicePropertyDataPanel from '../components/DevicePropertyDataPanel';
import DeviceAlarmInfoPanel from '../components/DeviceAlarmInfoPanel';
import DeviceFileManagementPanel from '../components/DeviceFileManagementPanel';
import DeviceLogManagementPanel from '../components/DeviceLogManagementPanel';
import DeviceShadowPanel from '../components/DeviceShadowPanel';
import SubDeviceManagementPanel from '../components/SubDeviceManagementPanel';
import IotToast, { type IotToastData, type IotToastType, triggerIotToast } from '../components/IotToast';
import type { DeviceAlarmRecord } from '../data/deviceAlarms';
import type { AlarmLevelRecord } from '../data/alarmLevels';
import type { WorkOrderRecord } from '../data/workOrders';
import {
    buildDeviceFormTags,
    COLLECT_FREQUENCY_UNIT_OPTIONS,
    DEFAULT_COLLECT_FREQUENCY_UNIT,
    deviceRecordToFormState,
    getGatewaySubDevices,
    type CollectFrequencyUnit,
    type DeviceGroupFormKey,
    type DeviceRecord,
} from '../data/devices';
import type { ProductRecord } from '../data/products';
import type { DeviceFormMode } from '../utils/deviceRoute';
import { navigateDeviceForm } from '../utils/deviceRoute';
import {
    applyDeviceEnableToggle,
    formatDeviceDateTime,
} from '../utils/deviceTime';
import '../device-access.css';
import '../product-management.css';
import '../product-create.css';
import '../device-create.css';
import '../device-alarm-info.css';
import '../sub-device-management.css';
import ClearableInput from '../components/ClearableInput';

const POSITIONING_OPTIONS = [
    { label: '手动定位', value: 'manual' },
    { label: '自动定位', value: 'auto' },
];

const DEFAULT_GROUP_OPTIONS: Record<DeviceGroupFormKey, string[]> = {
    type: ['大表', '户表', '压力计', '水质仪', '智慧水站'],
    area: ['城东', '城西', '城南', '城北'],
    pipeline: ['主管网', '配水管', '支管网'],
};

const GROUP_LABELS: Record<DeviceGroupFormKey, string> = {
    type: '设备类型',
    area: '所属区域',
    pipeline: '管网层级',
};

/* ── 设备定时 ── */

type SchedulingTask = {
    id: string;
    name: string;
    type: '每日' | '每周' | '每月';
    cycleDays?: string[];
    cycleDates?: string[];
    time: string;
    action: string;
    status: '启用' | '停用';
};

const WEEKLY_DAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

const MOCK_SCHEDULING_TASKS: SchedulingTask[] = [
    { id: 'st-1', name: '每日数据采集', type: '每日', time: '08:00', action: '设置属性', status: '启用' },
    { id: 'st-2', name: '每周设备重启', type: '每周', cycleDays: ['周一'], time: '02:00', action: '调用服务', status: '启用' },
    { id: 'st-3', name: '月度数据上报', type: '每月', cycleDates: ['1号'], time: '00:00', action: '设置属性', status: '启用' },
    { id: 'st-4', name: '定时固件检测', type: '每日', time: '06:00', action: '调用服务', status: '停用' },
    { id: 'st-5', name: '工作日日志清理', type: '每周', cycleDays: ['周一', '周二', '周三', '周四', '周五'], time: '23:00', action: '调用服务', status: '启用' },
    { id: 'st-6', name: '月中数据备份', type: '每月', cycleDates: ['15号'], time: '03:00', action: '设置属性', status: '启用' },
    { id: 'st-7', name: '周末设备检测', type: '每周', cycleDays: ['周六', '周日'], time: '10:00', action: '调用服务', status: '停用' },
    { id: 'st-8', name: '夜间数据同步', type: '每日', time: '01:00', action: '设置属性', status: '启用' },
];

type GroupKey = DeviceGroupFormKey;

type DeviceFormState = {
    name: string;
    productId: string;
    collectFrequency: string;
    collectFrequencyUnit: CollectFrequencyUnit;
    positioning: string;
    registrationCode: string;
    enabled: boolean;
    statusChangedAt: string;
    mapLongitude: string;
    mapLatitude: string;
    mapLocation: string;
    groups: Record<GroupKey, string[]>;
};

function createEmptyDeviceForm(defaultProductId = ''): DeviceFormState {
    return {
        name: '',
        productId: defaultProductId,
        collectFrequency: '',
        collectFrequencyUnit: DEFAULT_COLLECT_FREQUENCY_UNIT,
        positioning: '',
        registrationCode: '',
        enabled: true,
        statusChangedAt: formatDeviceDateTime(new Date()),
        mapLongitude: '',
        mapLatitude: '',
        mapLocation: '',
        groups: {
            type: [],
            area: [],
            pipeline: [],
        },
    };
}

type DeviceCreatePageProps = {
    mode: DeviceFormMode;
    deviceId: string | null;
    defaultProductId: string | null;
    initialTab?: string | null;
    products: ProductRecord[];
    devices: DeviceRecord[];
    deviceAlarms: DeviceAlarmRecord[];
    alarmLevels?: AlarmLevelRecord[];
    onUpdateAlarms: React.Dispatch<React.SetStateAction<DeviceAlarmRecord[]>>;
    onCreateWorkOrder?: (workOrder: WorkOrderRecord) => void;
    onViewWorkOrder?: (workOrderId: string) => void;
    onSaveDevice: (device: DeviceRecord, saveMode: 'create' | 'edit') => void;
    onNavigateHome: () => void;
    onNavigate: (pageId: DeviceAccessPageId) => void;
    onBack: () => void;
};

const PAGE_TITLE: Record<DeviceFormMode, string> = {
    create: '新增设备',
    view: '查看设备',
    edit: '编辑设备',
};

export default function DeviceCreatePage({
    mode,
    deviceId,
    defaultProductId,
    initialTab = null,
    products,
    devices,
    deviceAlarms,
    alarmLevels,
    onUpdateAlarms,
    onCreateWorkOrder,
    onViewWorkOrder,
    onSaveDevice,
    onNavigateHome,
    onNavigate,
    onBack,
}: DeviceCreatePageProps) {
    const readonly = mode === 'view';
    const existingDevice = mode !== 'create' && deviceId
        ? devices.find((item) => item.id === deviceId)
        : null;

    const [form, setForm] = useState(() => createEmptyDeviceForm(defaultProductId ?? ''));
    const [toast, setToast] = useState<IotToastData | null>(null);
    const [mapPickerOpen, setMapPickerOpen] = useState(false);
    const [mapPickerInitial, setMapPickerInitial] = useState({
        longitude: '',
        latitude: '',
        location: '',
    });
    const [groupDialogOpen, setGroupDialogOpen] = useState(false);
    const [groupOptions, setGroupOptions] = useState(DEFAULT_GROUP_OPTIONS);
    const [enableToggled, setEnableToggled] = useState(false);

    const groupTypeOptions = useMemo(
        () => (Object.keys(GROUP_LABELS) as GroupKey[]).map((key) => ({
            label: GROUP_LABELS[key],
            value: key as DeviceGroupType,
        })),
        [],
    );

    const productOptions = useMemo(
        () => products.map((product) => ({
            label: product.name,
            value: product.id,
        })),
        [products],
    );

    const selectedProduct = useMemo(
        () => products.find((item) => item.id === form.productId),
        [form.productId, products],
    );

    const nodeType = selectedProduct?.nodeType ?? '直连设备';

    const isGateway = nodeType === '网关设备';
    const fullTabList = useMemo(
        () => (isGateway
            ? ['基本信息', '产品物模', '设备定时', '日志管理', '告警信息', '文件管理', '子设备管理']
            : ['基本信息', '产品物模', '属性数据', '设备定时', '日志管理', '告警信息', '文件管理', '设备影子']),
        [isGateway],
    );
    const visibleTabList = mode === 'create' ? ['基本信息'] : fullTabList;
    const [activeTab, setActiveTab] = useState(() => {
        if (mode === 'create') {
            return '基本信息';
        }
        return initialTab && fullTabList.includes(initialTab) ? initialTab : '基本信息';
    });
    const [modelSubTab, setModelSubTab] = useState<'property' | 'function' | 'event'>('property');

    /* ── 设备定时 state ── */
    const [scheduleTasks, setScheduleTasks] = useState<SchedulingTask[]>(MOCK_SCHEDULING_TASKS);
    const [scheduleDrawerOpen, setScheduleDrawerOpen] = useState(false);
    const [editingSchedule, setEditingSchedule] = useState<SchedulingTask | null>(null);
    const [deleteScheduleTask, setDeleteScheduleTask] = useState<SchedulingTask | null>(null);
    const [scheduleKeyword, setScheduleKeyword] = useState('');
    const [scheduleStatusFilter, setScheduleStatusFilter] = useState('');
    const [schedulePage, setSchedulePage] = useState(1);
    const [schedulePageSize, setSchedulePageSize] = useState('10');
    const [scheduleJumpPage, setScheduleJumpPage] = useState('');
    const [stFormName, setStFormName] = useState('');
    const [stFormType, setStFormType] = useState<'每日' | '每周' | '每月'>('每日');
    const [stFormWeekly, setStFormWeekly] = useState<string[]>([]);
    const [stFormMonthly, setStFormMonthly] = useState<string[]>([]);
    const [stFormTime, setStFormTime] = useState('08:00');
    const [stFormActions, setStFormActions] = useState<string[]>(['']);

    const propertyDataDeviceKey = existingDevice?.id ?? (form.productId ? `draft-${form.productId}` : '');

    const gatewaySubDevices = useMemo(() => {
        if (!existingDevice) return [];
        return getGatewaySubDevices(existingDevice.id, devices);
    }, [devices, existingDevice]);

    useEffect(() => {
        if (mode === 'create') {
            setActiveTab('基本信息');
            return;
        }
        if (initialTab && fullTabList.includes(initialTab)) {
            setActiveTab(initialTab);
            return;
        }
        setActiveTab('基本信息');
    }, [mode, deviceId, initialTab, fullTabList]);

    useEffect(() => {
        setEnableToggled(false);

        if (mode === 'create') {
            setForm(createEmptyDeviceForm(defaultProductId ?? ''));
            return;
        }

        if (!deviceId || !existingDevice) {
            return;
        }

        const nextForm = deviceRecordToFormState(existingDevice);
        setForm({
            ...createEmptyDeviceForm(existingDevice.productId),
            name: nextForm.name,
            productId: nextForm.productId,
            collectFrequency: nextForm.collectFrequency,
            collectFrequencyUnit: nextForm.collectFrequencyUnit,
            positioning: nextForm.positioning,
            registrationCode: nextForm.registrationCode,
            enabled: nextForm.enabled,
            statusChangedAt: nextForm.statusChangedAt,
            mapLongitude: nextForm.mapLongitude,
            mapLatitude: nextForm.mapLatitude,
            mapLocation: nextForm.mapLocation,
            groups: nextForm.groups,
        });
    }, [mode, deviceId, defaultProductId, existingDevice]);

    const showToast = (message: string, type: IotToastType = 'warning') => {
        triggerIotToast(setToast, message, type);
    };

    const toggleGroupTag = (groupKey: GroupKey, value: string) => {
        if (readonly) return;
        setForm((prev) => {
            const current = prev.groups[groupKey];
            const next = current.includes(value)
                ? current.filter((item) => item !== value)
                : [...current, value];
            return {
                ...prev,
                groups: { ...prev.groups, [groupKey]: next },
            };
        });
    };

    const handleConfirmAddGroup = (value: { name: string; type: DeviceGroupType }) => {
        const trimmedName = value.name.trim();
        if (!trimmedName) {
            showToast('请输入分组名称');
            return;
        }

        const groupKey = value.type as GroupKey;
        if (groupOptions[groupKey].includes(trimmedName)) {
            showToast('该分组名称已存在');
            return;
        }

        setGroupOptions((prev) => ({
            ...prev,
            [groupKey]: [...prev[groupKey], trimmedName],
        }));
        setForm((prev) => ({
            ...prev,
            groups: {
                ...prev.groups,
                [groupKey]: [...prev.groups[groupKey], trimmedName],
            },
        }));
        setGroupDialogOpen(false);
        showToast('分组添加成功', 'success');
    };

    const handleSelectMapPoint = () => {
        if (readonly || form.positioning !== 'manual') return;
        setMapPickerInitial({
            longitude: form.mapLongitude,
            latitude: form.mapLatitude,
            location: form.mapLocation,
        });
        setMapPickerOpen(true);
    };

    const handlePositioningChange = (value: string) => {
        setForm((prev) => ({
            ...prev,
            positioning: value,
            ...(value === 'auto'
                ? { mapLongitude: '', mapLatitude: '', mapLocation: '' }
                : {}),
        }));
    };

    const handleClearMapPoint = () => {
        if (readonly || form.positioning !== 'manual') return;
        setForm((prev) => ({
            ...prev,
            mapLongitude: '',
            mapLatitude: '',
            mapLocation: '',
        }));
    };

    const handleConfirmMapPoint = (value: { longitude: string; latitude: string; location: string }) => {
        setForm((prev) => ({
            ...prev,
            mapLongitude: value.longitude,
            mapLatitude: value.latitude,
            mapLocation: value.location,
        }));
        showToast('地图选点成功', 'success');
    };

    /* ── 设备定时 computed ── */
    const filteredScheduleTasks = useMemo(() => {
        let list = scheduleTasks;
        if (scheduleKeyword.trim()) {
            const kw = scheduleKeyword.trim().toLowerCase();
            list = list.filter((t) => t.name.toLowerCase().includes(kw));
        }
        if (scheduleStatusFilter) {
            list = list.filter((t) => t.status === scheduleStatusFilter);
        }
        return list;
    }, [scheduleTasks, scheduleKeyword, scheduleStatusFilter]);

    const schedulePageSizeNum = Number(schedulePageSize);
    const scheduleTotalPages = Math.max(1, Math.ceil(filteredScheduleTasks.length / schedulePageSizeNum));
    const scheduleCurrentPage = Math.min(schedulePage, scheduleTotalPages);
    const schedulePagedData = filteredScheduleTasks.slice(
        (scheduleCurrentPage - 1) * schedulePageSizeNum,
        scheduleCurrentPage * schedulePageSizeNum,
    );

    const productFunctionOptions = useMemo(
        () => (selectedProduct?.functions ?? []).map((fn) => ({
            label: fn.name,
            value: fn.identifier,
        })),
        [selectedProduct],
    );

    const resetScheduleForm = () => {
        setStFormName('');
        setStFormType('每日');
        setStFormWeekly([]);
        setStFormMonthly([]);
        setStFormTime('08:00');
        setStFormActions(['']);
    };

    const openScheduleDrawer = (task?: SchedulingTask) => {
        if (task) {
            setEditingSchedule(task);
            setStFormName(task.name);
            setStFormType(task.type);
            setStFormWeekly(task.cycleDays ?? []);
            setStFormMonthly(task.cycleDates ?? []);
            setStFormTime(task.time);
            // 解析多个动作（格式: "调用服务 - fn1, fn2" 或 "fn1, fn2"）
            const raw = task.action.replace(/^调用服务\s*-\s*/, '').trim();
            const ids = raw
                .split(/[,，、]/)
                .map((s) => s.trim())
                .filter(Boolean);
            setStFormActions(ids.length ? ids : ['']);
        } else {
            setEditingSchedule(null);
            resetScheduleForm();
        }
        setScheduleDrawerOpen(true);
    };

    const handleSaveSchedulingTask = () => {
        if (!stFormName.trim()) {
            showToast('请输入定时名称');
            return;
        }
        if (stFormType === '每周' && stFormWeekly.length === 0) {
            showToast('请选择执行周期');
            return;
        }
        if (stFormType === '每月' && stFormMonthly.length === 0) {
            showToast('请选择执行日期');
            return;
        }

        const selectedActions = stFormActions.filter(Boolean);
        if (selectedActions.length === 0) {
            showToast('请选择至少一个执行动作');
            return;
        }
        const actionNames = selectedActions.map((id) => {
            const fn = selectedProduct?.functions?.find((f) => f.identifier === id);
            return fn?.name ?? id;
        });
        const actionLabel = `调用服务 - ${actionNames.join(', ')}`;

        if (editingSchedule) {
            const updated: SchedulingTask = {
                ...editingSchedule,
                name: stFormName.trim(),
                type: stFormType,
                cycleDays: stFormType === '每周' ? stFormWeekly : undefined,
                cycleDates: stFormType === '每月' ? stFormMonthly : undefined,
                time: stFormTime,
                action: actionLabel,
            };
            setScheduleTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
            showToast('定时任务已更新', 'success');
        } else {
            const newTask: SchedulingTask = {
                id: `st-${Date.now()}`,
                name: stFormName.trim(),
                type: stFormType,
                cycleDays: stFormType === '每周' ? stFormWeekly : undefined,
                cycleDates: stFormType === '每月' ? stFormMonthly : undefined,
                time: stFormTime,
                action: actionLabel,
                status: '启用',
            };
            setScheduleTasks((prev) => [newTask, ...prev]);
            showToast('定时任务已创建', 'success');
        }
        setScheduleDrawerOpen(false);
    };

    const handleToggleScheduling = (task: SchedulingTask) => {
        const nextStatus = task.status === '启用' ? '停用' : '启用';
        setScheduleTasks((prev) =>
            prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t)),
        );
        showToast(`已${nextStatus}`);
    };

    const handleExecuteOnce = (task: SchedulingTask) => {
        showToast(`「${task.name}」已手动执行一次`, 'success');
    };

    const handleDeleteScheduling = () => {
        if (!deleteScheduleTask) return;
        setScheduleTasks((prev) => prev.filter((t) => t.id !== deleteScheduleTask.id));
        setDeleteScheduleTask(null);
        showToast('定时任务已删除', 'success');
    };

    const handleScheduleReset = () => {
        setScheduleKeyword('');
        setScheduleStatusFilter('');
        setSchedulePage(1);
    };

    const handleToggleWeeklyDay = (day: string) => {
        setStFormWeekly((prev) =>
            prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
        );
    };

    const handleToggleMonthlyDate = (date: string) => {
        setStFormMonthly((prev) =>
            prev.includes(date) ? prev.filter((d) => d !== date) : [...prev, date],
        );
    };

    const buildDevicePayload = (baseDevice?: DeviceRecord): DeviceRecord => {
        const groupTags = buildDeviceFormTags(form.groups);
        const groupNames = groupTags.map((tag) => tag.split(':')[1]).filter(Boolean);
        const longitude = form.positioning === 'manual' && form.mapLongitude.trim()
            ? Number(form.mapLongitude)
            : 0;
        const latitude = form.positioning === 'manual' && form.mapLatitude.trim()
            ? Number(form.mapLatitude)
            : 0;

        return {
            ...baseDevice,
            id: baseDevice?.id ?? `device-${Date.now()}`,
            code: baseDevice?.code ?? `S${String(Math.floor(273890 + Math.random() * 900000))}`,
            name: form.name.trim(),
            productId: form.productId,
            status: form.enabled ? (baseDevice?.status === 'fault' ? 'fault' : 'online') : 'disabled',
            spaceId: baseDevice?.spaceId ?? 'room-201',
            departmentId: baseDevice?.departmentId ?? 'dept-jiahuan-1',
            groups: groupNames.length ? groupNames : [selectedProduct?.category ?? '公共设备组'],
            tags: groupTags.length ? groupTags : [`类型:${selectedProduct?.category ?? '大表'}`],
            enabled: form.enabled,
            enabledAt: form.enabled ? (form.statusChangedAt || formatDeviceDateTime(new Date())) : '',
            onlineDuration: baseDevice?.onlineDuration ?? '0天0小时0分钟',
            longitude,
            latitude,
            collectFrequency: form.collectFrequency.trim(),
            collectFrequencyUnit: form.collectFrequencyUnit,
            registrationCode: form.registrationCode.trim() || baseDevice?.registrationCode || '',
            mapAddress: form.mapLocation.trim(),
        };
    };

    const handleSave = () => {
        if (readonly) return;

        if (!form.name.trim()) {
            showToast('请输入设备名称');
            return;
        }
        if (!form.productId) {
            showToast('请选择所属产品');
            return;
        }
        if (!form.positioning) {
            showToast('请选择定位方式');
            return;
        }
        if (form.positioning === 'manual' && (!form.mapLongitude.trim() || !form.mapLatitude.trim())) {
            showToast('手动定位时，请通过地图选点标注经纬度');
            return;
        }

        if (mode === 'edit' && existingDevice) {
            const now = new Date();
            let nextDevice = buildDevicePayload(existingDevice);

            if (form.enabled !== existingDevice.enabled) {
                nextDevice = applyDeviceEnableToggle(nextDevice, form.enabled, now);
            }

            onSaveDevice(nextDevice, 'edit');
            showToast('设备保存成功', 'success');
            window.setTimeout(() => onBack(), 1200);
            return;
        }

        const nextDevice = buildDevicePayload();
        onSaveDevice(nextDevice, 'create');
        showToast(`设备保存成功，编号 ${nextDevice.code}`, 'success');
        window.setTimeout(() => onBack(), 1200);
    };

    if (mode !== 'create' && !existingDevice) {
        return null;
    }

    const sidebar = (
        <DeviceAccessSidebar
            pageId={mode === 'edit' ? 'device-edit' : mode === 'view' ? 'device-view' : 'device-create'}
            onNavigate={onNavigate}
        />
    );
    const isManualPositioning = form.positioning === 'manual';
    const isAutoPositioning = form.positioning === 'auto';

    return (
        <AppShell
            activeTopTab="设备接入"
            sidebar={sidebar}
            onTopTabChange={(tab) => {
                if (tab === '设备接入') onNavigate('home');
            }}
        >
            <div className="dcp-page">
                <Breadcrumb items={[
                                    { label: '设备接入', pageId: 'home' },
                                    { label: '设备管理', pageId: 'device-management' },
                                    { label: PAGE_TITLE[mode] },
                                ]} onNavigate={(id) => onNavigate(id as DeviceAccessPageId)} />

                <div className="pcp-head">
                    <button
                        type="button"
                        className="pcp-back-btn"
                        onClick={onBack}
                        aria-label="返回"
                    >
                        <ArrowLeft size={16} />
                    </button>
                    <h2 className="pcp-title">{PAGE_TITLE[mode]}</h2>
                </div>

                {visibleTabList.length > 1 && (
                    <div className="dcp-tabs">
                        {visibleTabList.map((tab) => (
                            <button
                                key={tab}
                                type="button"
                                className={`dcp-tab ${activeTab === tab ? 'is-active' : ''}`}
                                onClick={() => setActiveTab(tab)}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                )}

                {activeTab === '基本信息' && (
                <section className="panel dcp-panel">
                    <div className="dcp-section">
                        <div className="pm-section-head">
                            <h3>设备基本信息</h3>
                        </div>
                        <div className="dcp-form-grid">
                            <label className="dcp-form-field">
                                <span className="dcp-form-label"><em>*</em>设备名称</span>
                                <ClearableInput
                                    type="text"
                                    className={`dcp-form-input ${readonly ? 'is-readonly' : ''}`.trim()}
                                    placeholder="请输入设备名称"
                                    value={form.name}
                                    readOnly={readonly}
                                    onChange={(event) => setForm((prev) => ({
                                        ...prev,
                                        name: event.target.value,
                                    }))}
                                />
                            </label>
                            <div className="dcp-form-field">
                                <span className="dcp-form-label"><em>*</em>所属产品</span>
                                <ElSelect
                                    className="el-select--medium dcp-form-select"
                                    size="medium"
                                    value={form.productId}
                                    disabled={readonly}
                                    options={[{ label: '请选择', value: '' }, ...productOptions]}
                                    onChange={(value) => setForm((prev) => ({ ...prev, productId: value }))}
                                />
                            </div>
                            <label className="dcp-form-field">
                                <span className="dcp-form-label">
                                    节点类型
                                    <Info size={14} aria-hidden="true" />
                                </span>
                                <input
                                    type="text"
                                    className="dcp-form-input is-readonly"
                                    value={nodeType}
                                    readOnly
                                />
                            </label>
                            <div className="dcp-form-field">
                                <span className="dcp-form-label">采集频率</span>
                                <div className="dcp-input-with-suffix">
                                    <ClearableInput
                                        type="text"
                                        className={`dcp-form-input ${readonly ? 'is-readonly' : ''}`.trim()}
                                        placeholder="请输入采集频率"
                                        value={form.collectFrequency}
                                        readOnly={readonly}
                                        onChange={(event) => setForm((prev) => ({
                                            ...prev,
                                            collectFrequency: event.target.value,
                                        }))}
                                    />
                                    <ElSelect
                                        className="el-select--medium dcp-collect-frequency-unit"
                                        size="medium"
                                        value={form.collectFrequencyUnit}
                                        disabled={readonly}
                                        options={COLLECT_FREQUENCY_UNIT_OPTIONS}
                                        onChange={(value) => setForm((prev) => ({
                                            ...prev,
                                            collectFrequencyUnit: value as CollectFrequencyUnit,
                                        }))}
                                    />
                                </div>
                            </div>
                            <div className="dcp-form-field">
                                <span className="dcp-form-label"><em>*</em>定位方式</span>
                                <ElSelect
                                    className="el-select--medium dcp-form-select"
                                    size="medium"
                                    value={form.positioning}
                                    disabled={readonly}
                                    options={[{ label: '请选择', value: '' }, ...POSITIONING_OPTIONS]}
                                    onChange={handlePositioningChange}
                                />
                            </div>
                            <label className="dcp-form-field">
                                <span className="dcp-form-label">注册码</span>
                                <ClearableInput
                                    type="text"
                                    className={`dcp-form-input ${readonly ? 'is-readonly' : ''}`.trim()}
                                    placeholder="请输入注册码"
                                    value={form.registrationCode}
                                    readOnly={readonly}
                                    onChange={(event) => setForm((prev) => ({
                                        ...prev,
                                        registrationCode: event.target.value,
                                    }))}
                                />
                            </label>
                        </div>
                    </div>

                    <div className="dcp-section">
                        <div className="pm-section-head">
                            <h3>位置信息</h3>
                        </div>
                        <div className="dcp-geo-grid">
                            <div className="dcp-geo-panel">
                                <div className="dcp-geo-panel__head">
                                    <strong className="dcp-geo-panel__title">
                                        {isManualPositioning ? <em>*</em> : null}
                                        地图位置
                                    </strong>
                                    {!readonly && isManualPositioning && (
                                        <div className="dcp-geo-panel__actions">
                                            <button type="button" className="pm-link-btn" onClick={handleSelectMapPoint}>
                                                <Plus size={14} />
                                                地图选点
                                            </button>
                                            <button
                                                type="button"
                                                className="pm-link-btn"
                                                onClick={handleClearMapPoint}
                                            >
                                                清空
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <p className="dcp-geo-panel__hint">
                                    {isManualPositioning
                                        ? '手动定位时，地图位置必选，请通过地图选点标注设备经纬度。'
                                        : isAutoPositioning
                                            ? '自动定位时，地图位置非必选；设备上线后，具备定位功能的设备将自动上报经纬度信息。'
                                            : '请先选择定位方式。'}
                                </p>
                                <div className="dcp-geo-panel__fields">
                                    <div className="dcp-geo-field">
                                        <span>经度：</span>
                                        <strong>{form.mapLongitude || '—'}</strong>
                                    </div>
                                    <div className="dcp-geo-field">
                                        <span>纬度：</span>
                                        <strong>{form.mapLatitude || '—'}</strong>
                                    </div>
                                    <div className="dcp-geo-field">
                                        <span>位置描述：</span>
                                        <strong>{form.mapLocation || '—'}</strong>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="dcp-section">
                        <div className="pm-section-head">
                            <h3>应用设备</h3>
                        </div>
                        <div className="dcp-enable-row">
                            <label className="dcp-enable-switch">
                                <input
                                    type="checkbox"
                                    checked={form.enabled}
                                    disabled={readonly}
                                    onChange={(event) => {
                                        const nextEnabled = event.target.checked;
                                        setEnableToggled(true);
                                        setForm((prev) => ({
                                            ...prev,
                                            enabled: nextEnabled,
                                            statusChangedAt: formatDeviceDateTime(new Date()),
                                        }));
                                    }}
                                />
                                <span>{form.enabled ? '已启用' : '已禁用'}</span>
                            </label>
                            {mode !== 'edit' && (
                                <span className="dcp-enable-label">
                                    {form.enabled
                                        ? `启用时间：${form.statusChangedAt}`
                                        : enableToggled
                                            ? `停用时间：${form.statusChangedAt}`
                                            : `最后启用时间：${existingDevice?.enabledAt || form.statusChangedAt || '—'}`}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="dcp-section">
                        <div className="pm-section-head">
                            <h3>设备分组</h3>
                            {!readonly && (
                                <button
                                    type="button"
                                    className="pm-link-btn"
                                    onClick={() => setGroupDialogOpen(true)}
                                >
                                    添加分组
                                </button>
                            )}
                        </div>
                        <div className="dcp-group-panel">
                            {(Object.keys(groupOptions) as GroupKey[]).map((groupKey) => (
                                <div className="dcp-group-row" key={groupKey}>
                                    <span className="dcp-group-row__label">{GROUP_LABELS[groupKey]}</span>
                                    <div className="dcp-group-tags">
                                        {groupOptions[groupKey].map((tag) => (
                                            <button
                                                key={tag}
                                                type="button"
                                                className={`dcp-group-tag ${form.groups[groupKey].includes(tag) ? 'is-selected' : ''}`.trim()}
                                                disabled={readonly}
                                                onClick={() => toggleGroupTag(groupKey, tag)}
                                            >
                                                {tag}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="dcp-footer">
                        {readonly ? (
                            <>
                                <button
                                    type="button"
                                    className="pm-btn pm-btn-primary dcp-save-btn"
                                    onClick={() => {
                                        if (deviceId) {
                                            navigateDeviceForm('edit', { deviceId });
                                        }
                                    }}
                                >
                                    编辑
                                </button>
                                <button type="button" className="pm-btn pm-btn-ghost" onClick={onBack}>
                                    返回
                                </button>
                            </>
                        ) : (
                            <>
                                <button type="button" className="pm-btn pm-btn-primary dcp-save-btn" onClick={handleSave}>
                                    保存
                                </button>
                                <button type="button" className="pm-btn pm-btn-ghost" onClick={onBack}>
                                    取消
                                </button>
                            </>
                        )}
                    </div>
                </section>
                )}

                {activeTab === '属性数据' && (
                    <DevicePropertyDataPanel
                        product={selectedProduct}
                        deviceKey={propertyDataDeviceKey}
                        device={existingDevice}
                        devices={devices}
                        onShowToast={showToast}
                    />
                )}

                {activeTab === '设备影子' && (
                    <DeviceShadowPanel
                        device={existingDevice}
                        productId={form.productId}
                        deviceKey={propertyDataDeviceKey}
                        readonly={readonly}
                        onShowToast={showToast}
                    />
                )}

                {activeTab === '子设备管理' && isGateway && (
                    <SubDeviceManagementPanel
                        gatewayDevice={existingDevice!}
                        subDevices={gatewaySubDevices}
                        products={products}
                        allDevices={devices}
                        onShowToast={showToast}
                    />
                )}

                {activeTab !== '基本信息' && activeTab !== '产品物模' && activeTab !== '属性数据' && activeTab !== '设备定时' && activeTab !== '日志管理' && activeTab !== '告警信息' && activeTab !== '文件管理' && activeTab !== '设备影子' && activeTab !== '子设备管理' && (
                    <div className="ru-placeholder-panel panel">
                        {activeTab}（原型占位）
                    </div>
                )}

                {activeTab === '告警信息' && (
                    <DeviceAlarmInfoPanel
                        device={existingDevice}
                        devices={devices}
                        products={products}
                        alarms={deviceAlarms}
                        alarmLevels={alarmLevels}
                        onUpdateAlarms={onUpdateAlarms}
                        onCreateWorkOrder={onCreateWorkOrder}
                        onViewWorkOrder={onViewWorkOrder}
                        onShowToast={showToast}
                    />
                )}

                {activeTab === '文件管理' && (
                    <DeviceFileManagementPanel
                        device={existingDevice}
                        readonly={readonly}
                        onShowToast={showToast}
                    />
                )}

                {activeTab === '日志管理' && (
                    <DeviceLogManagementPanel
                        device={existingDevice}
                        readonly={readonly}
                        onShowToast={showToast}
                    />
                )}

                {activeTab === '设备定时' && (
                    <section className="panel dcp-panel dcs-panel">
                        <div className="dcs-toolbar">
                            <div className="dcs-toolbar__left">
                                <ClearableInput
                                    type="text"
                                    className="pm-filter-input dcs-search"
                                    placeholder="定时名称"
                                    value={scheduleKeyword}
                                    onChange={(e) => setScheduleKeyword(e.target.value)}
                                />
                                <ElSelect
                                    className="el-select--medium dcs-status-select"
                                    size="medium"
                                    value={scheduleStatusFilter}
                                    options={[
                                        { label: '定时状态', value: '' },
                                        { label: '启用', value: '启用' },
                                        { label: '停用', value: '停用' },
                                    ]}
                                    onChange={(v) => { setScheduleStatusFilter(v); setSchedulePage(1); }}
                                />
                                <button type="button" className="pm-btn pm-btn-primary" onClick={() => setSchedulePage(1)}>查询</button>
                                <button type="button" className="pm-btn pm-btn-ghost" onClick={handleScheduleReset}>重置</button>
                            </div>
                            <button type="button" className="pm-btn pm-btn-primary" onClick={() => openScheduleDrawer()}>新增</button>
                        </div>

                        <div className="pcp-table-wrap">
                            <table className="pcp-table pcp-table--schedule">
                                <thead>
                                    <tr>
                                        <th>序号</th>
                                        <th>名称</th>
                                        <th>定时类型</th>
                                        <th>动作</th>
                                        <th>状态</th>
                                        <th>
                                            <div className="dcs-ops-col__inner">操作</div>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {schedulePagedData.map((task, index) => (
                                        <tr key={task.id}>
                                            <td>{(scheduleCurrentPage - 1) * schedulePageSizeNum + index + 1}</td>
                                            <td>{task.name}</td>
                                            <td>{task.type}</td>
                                            <td>{task.action}</td>
                                            <td>
                                                <span className={`dcs-status ${task.status === '启用' ? 'dcs-status--on' : 'dcs-status--off'}`}>
                                                    <i className="dcs-status-dot" />
                                                    {task.status}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="dcs-ops-col__inner">
                                                    <div className="dcs-actions">
                                                        <button type="button" className="pm-link-btn" onClick={() => openScheduleDrawer(task)}>编辑</button>
                                                        <button type="button" className="pm-link-btn" onClick={() => handleToggleScheduling(task)}>
                                                            {task.status === '启用' ? '停用' : '启用'}
                                                        </button>
                                                        <button type="button" className="pm-link-btn" onClick={() => handleExecuteOnce(task)}>执行一次</button>
                                                        <button type="button" className="pm-link-btn pm-link-btn--danger" onClick={() => setDeleteScheduleTask(task)}>删除</button>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {!schedulePagedData.length && (
                                        <tr><td colSpan={6} className="pcp-empty-cell">暂无定时任务</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <ListPagination
                            total={filteredScheduleTasks.length}
                            currentPage={scheduleCurrentPage}
                            totalPages={scheduleTotalPages}
                            pageSize={schedulePageSize}
                            jumpPage={scheduleJumpPage}
                            onPageChange={setSchedulePage}
                            onPageSizeChange={(v) => { setSchedulePageSize(v); setSchedulePage(1); }}
                            onJumpPageChange={setScheduleJumpPage}
                        />
                    </section>
                )}

                {activeTab === '产品物模' && selectedProduct && (
                    <section className="panel dcp-panel">
                        <div className="pcp-model-tabs">
                            <button
                                type="button"
                                className={modelSubTab === 'property' ? 'is-active' : ''}
                                onClick={() => setModelSubTab('property')}
                            >
                                属性定义
                            </button>
                            <button
                                type="button"
                                className={modelSubTab === 'function' ? 'is-active' : ''}
                                onClick={() => setModelSubTab('function')}
                            >
                                功能定义
                            </button>
                            <button
                                type="button"
                                className={modelSubTab === 'event' ? 'is-active' : ''}
                                onClick={() => setModelSubTab('event')}
                            >
                                事件定义
                            </button>
                        </div>

                        <div className="pcp-table-wrap">
                            {modelSubTab === 'property' && (
                                <table className="pcp-table">
                                    <thead>
                                        <tr>
                                            <th>序号</th>
                                            <th>标识</th>
                                            <th>名称</th>
                                            <th>数据类型</th>
                                            <th>读写类型</th>
                                            <th>说明</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedProduct.properties.map((row, index) => (
                                            <tr key={row.id}>
                                                <td>{index + 1}</td>
                                                <td>{row.identifier}</td>
                                                <td>{row.name}</td>
                                                <td>{row.dataType}</td>
                                                <td>{row.accessMode}</td>
                                                <td className="pcp-desc-cell">{row.description}</td>
                                            </tr>
                                        ))}
                                        {!selectedProduct.properties.length && (
                                            <tr><td colSpan={6} className="pcp-empty-cell">暂无属性定义</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            )}

                            {modelSubTab === 'function' && (
                                <table className="pcp-table">
                                    <thead>
                                        <tr>
                                            <th>序号</th>
                                            <th>功能标识</th>
                                            <th>功能名称</th>
                                            <th>是否异步</th>
                                            <th>说明</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedProduct.functions.map((row, index) => (
                                            <tr key={row.id}>
                                                <td>{index + 1}</td>
                                                <td>{row.identifier}</td>
                                                <td>{row.name}</td>
                                                <td>{row.async}</td>
                                                <td className="pcp-desc-cell">{row.description}</td>
                                            </tr>
                                        ))}
                                        {!selectedProduct.functions.length && (
                                            <tr><td colSpan={5} className="pcp-empty-cell">暂无功能定义</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            )}

                            {modelSubTab === 'event' && (
                                <table className="pcp-table">
                                    <thead>
                                        <tr>
                                            <th>序号</th>
                                            <th>事件标识</th>
                                            <th>事件名称</th>
                                            <th>事件类型</th>
                                            <th>说明</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedProduct.events.map((row, index) => (
                                            <tr key={row.id}>
                                                <td>{index + 1}</td>
                                                <td>{row.identifier}</td>
                                                <td>{row.name}</td>
                                                <td>{row.eventType}</td>
                                                <td className="pcp-desc-cell">{row.description}</td>
                                            </tr>
                                        ))}
                                        {!selectedProduct.events.length && (
                                            <tr><td colSpan={5} className="pcp-empty-cell">暂无事件定义</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </section>
                )}
            </div>

            {/* 设备定时 新增/编辑抽屉 */}
            {scheduleDrawerOpen && (
                <>
                    <div className="pcp-drawer-mask" onClick={() => setScheduleDrawerOpen(false)} />
                    <aside className="pcp-drawer pcp-drawer--form" style={{ position: 'fixed', zIndex: 120 }}>
                        <div className="pcp-drawer__head">
                            <h3>{editingSchedule ? '编辑定时任务' : '新增定时任务'}</h3>
                            <button type="button" className="pcp-drawer__close" onClick={() => setScheduleDrawerOpen(false)}>×</button>
                        </div>
                        <div className="pcp-drawer__body pcp-drawer__body--form">
                            <div className="pcp-drawer-field">
                                <span className="dcp-form-label"><em>*</em>定时名称</span>
                                <ClearableInput
                                    type="text"
                                    className="dcp-form-input"
                                    placeholder="请输入定时名称"
                                    value={stFormName}
                                    onChange={(e) => setStFormName(e.target.value)}
                                />
                            </div>

                            <div className="pcp-drawer-field">
                                <span className="dcp-form-label"><em>*</em>定时类型</span>
                                <div className="pcp-radio-group">
                                    {(['每日', '每周', '每月'] as const).map((opt) => (
                                        <label key={opt} className="pcp-radio">
                                            <input
                                                type="radio"
                                                name="scheduleType"
                                                checked={stFormType === opt}
                                                onChange={() => setStFormType(opt)}
                                            />
                                            {opt}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {stFormType === '每周' && (
                                <div className="pcp-drawer-field">
                                    <span className="dcp-form-label"><em>*</em>执行周期</span>
                                    <div className="dcs-week-days">
                                        {WEEKLY_DAYS.map((day) => (
                                            <button
                                                key={day}
                                                type="button"
                                                className={`dcs-week-day ${stFormWeekly.includes(day) ? 'is-selected' : ''}`}
                                                onClick={() => handleToggleWeeklyDay(day)}
                                            >
                                                {day}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {stFormType === '每月' && (
                                <div className="pcp-drawer-field">
                                    <span className="dcp-form-label"><em>*</em>执行周期</span>
                                    <div className="dcs-month-grid">
                                        {Array.from({ length: 28 }, (_, i) => `${i + 1}号`).map((date) => (
                                            <button
                                                key={date}
                                                type="button"
                                                className={`dcs-month-day ${stFormMonthly.includes(date) ? 'is-selected' : ''}`}
                                                onClick={() => handleToggleMonthlyDate(date)}
                                            >
                                                {date}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="pcp-drawer-field">
                                <span className="dcp-form-label"><em>*</em>执行时间</span>
                                <ClearableInput
                                    type="time"
                                    className="dcp-form-input"
                                    value={stFormTime}
                                    onChange={(e) => setStFormTime(e.target.value)}
                                />
                            </div>

                            <div className="pcp-drawer-field">
                                <span className="dcp-form-label">执行动作</span>
                                {stFormActions.map((actionId, index) => {
                                    const usedByOthers = new Set(
                                        stFormActions.filter((_, i) => i !== index),
                                    );
                                    const availableOptions = productFunctionOptions.filter(
                                        (opt) => !usedByOthers.has(opt.value),
                                    );
                                    return (
                                        <div className="dcs-action-row" key={index}>
                                            <ElSelect
                                                className="el-select--medium dcs-action-select"
                                                size="medium"
                                                value={actionId}
                                                options={[
                                                    { label: '请选择功能', value: '' },
                                                    ...availableOptions,
                                                ]}
                                                onChange={(v) => {
                                                    const next = [...stFormActions];
                                                    next[index] = v;
                                                    setStFormActions(next);
                                                }}
                                            />
                                            {stFormActions.length > 1 && (
                                                <button
                                                    type="button"
                                                    className="dcs-action-remove"
                                                    onClick={() => {
                                                        setStFormActions(stFormActions.filter((_, i) => i !== index));
                                                    }}
                                                >
                                                    ×
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                                <button
                                    type="button"
                                    className="dcs-add-action-link"
                                    onClick={() => setStFormActions([...stFormActions, ''])}
                                >
                                    <Plus size={12} /> 添加执行动作
                                </button>
                            </div>
                        </div>

                        <div className="pcp-drawer__foot">
                            <button type="button" className="pm-btn pm-btn-ghost" onClick={() => setScheduleDrawerOpen(false)}>取消</button>
                            <button type="button" className="pm-btn pm-btn-primary" onClick={handleSaveSchedulingTask}>确定</button>
                        </div>
                    </aside>
                </>
            )}

            {deleteScheduleTask && (
                <ConfirmDialog
                    title="删除定时任务"
                    message={`确定要删除定时任务「${deleteScheduleTask.name}」吗？`}
                    onClose={() => setDeleteScheduleTask(null)}
                    onConfirm={handleDeleteScheduling}
                />
            )}

            <IotToast toast={toast} />

            <MapPickerDialog
                open={mapPickerOpen}
                initialValue={mapPickerInitial}
                onClose={() => setMapPickerOpen(false)}
                onConfirm={handleConfirmMapPoint}
            />

            <DeviceGroupDialog
                open={groupDialogOpen}
                typeOptions={groupTypeOptions}
                onClose={() => setGroupDialogOpen(false)}
                onConfirm={handleConfirmAddGroup}
            />
        </AppShell>
    );
}
