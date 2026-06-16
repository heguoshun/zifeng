import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Info, Plus } from 'lucide-react';
import AppShell from '../components/AppShell';
import DeviceAccessSidebar, { type DeviceAccessPageId } from '../components/DeviceAccessSidebar';
import ElSelect from '../components/ElSelect';
import MapPickerDialog from '../components/MapPickerDialog';
import DeviceGroupDialog, { type DeviceGroupType } from '../components/DeviceGroupDialog';
import IotToast, { type IotToastData, type IotToastType, triggerIotToast } from '../components/IotToast';
import {
    buildDeviceFormTags,
    deviceRecordToFormState,
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

type GroupKey = DeviceGroupFormKey;

type DeviceFormState = {
    name: string;
    productId: string;
    collectFrequency: string;
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
        collectFrequency: '1440',
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
    products: ProductRecord[];
    devices: DeviceRecord[];
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
    products,
    devices,
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

    useEffect(() => {
        setEnableToggled(false);

        if (mode === 'create') {
            setForm(createEmptyDeviceForm(defaultProductId ?? ''));
            return;
        }

        if (!deviceId || !existingDevice) {
            onBack();
            return;
        }

        const nextForm = deviceRecordToFormState(existingDevice);
        setForm({
            ...createEmptyDeviceForm(existingDevice.productId),
            name: nextForm.name,
            productId: nextForm.productId,
            collectFrequency: nextForm.collectFrequency,
            positioning: nextForm.positioning,
            registrationCode: nextForm.registrationCode,
            enabled: nextForm.enabled,
            statusChangedAt: nextForm.statusChangedAt,
            mapLongitude: nextForm.mapLongitude,
            mapLatitude: nextForm.mapLatitude,
            mapLocation: nextForm.mapLocation,
            groups: nextForm.groups,
        });
    }, [mode, deviceId, defaultProductId, existingDevice, onBack]);

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
        if (readonly) return;
        setMapPickerInitial({
            longitude: form.mapLongitude,
            latitude: form.mapLatitude,
            location: form.mapLocation,
        });
        setMapPickerOpen(true);
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

    const buildDevicePayload = (baseDevice?: DeviceRecord): DeviceRecord => {
        const groupTags = buildDeviceFormTags(form.groups);
        const groupNames = groupTags.map((tag) => tag.split(':')[1]).filter(Boolean);
        const longitude = form.positioning === 'manual' && form.mapLongitude
            ? Number(form.mapLongitude)
            : baseDevice?.longitude ?? 0;
        const latitude = form.positioning === 'manual' && form.mapLatitude
            ? Number(form.mapLatitude)
            : baseDevice?.latitude ?? 0;

        return {
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
            collectFrequency: form.collectFrequency || '1440',
            registrationCode: form.registrationCode.trim() || baseDevice?.registrationCode || '',
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
        if (form.positioning === 'manual' && (!form.mapLongitude || !form.mapLatitude)) {
            showToast('手动定位时，地图位置必选');
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

    const sidebar = <DeviceAccessSidebar pageId="device-create" onNavigate={onNavigate} />;

    return (
        <AppShell
            activeTopTab="设备接入"
            sidebar={sidebar}
            onTopTabChange={(tab) => {
                if (tab === '设备接入') onNavigate('home');
            }}
        >
            <div className="dcp-page">
                <div className="crumb">设备接入 / 设备管理 / 设备管理 / {PAGE_TITLE[mode]}</div>

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

                <section className="panel dcp-panel">
                    <div className="dcp-section">
                        <div className="pm-section-head">
                            <h3>设备基本信息</h3>
                        </div>
                        <div className="dcp-form-grid">
                            <label className="dcp-form-field">
                                <span className="dcp-form-label"><em>*</em>设备名称</span>
                                <input
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
                            <label className="dcp-form-field">
                                <span className="dcp-form-label"><em>*</em>所属产品</span>
                                <ElSelect
                                    className="el-select--medium dcp-form-select"
                                    size="medium"
                                    value={form.productId}
                                    disabled={readonly}
                                    options={[{ label: '请选择', value: '' }, ...productOptions]}
                                    onChange={(value) => setForm((prev) => ({ ...prev, productId: value }))}
                                />
                            </label>
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
                            <label className="dcp-form-field">
                                <span className="dcp-form-label">采集频率（分钟）</span>
                                <input
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
                            </label>
                            <label className="dcp-form-field">
                                <span className="dcp-form-label"><em>*</em>定位方式</span>
                                <ElSelect
                                    className="el-select--medium dcp-form-select"
                                    size="medium"
                                    value={form.positioning}
                                    disabled={readonly}
                                    options={[{ label: '请选择', value: '' }, ...POSITIONING_OPTIONS]}
                                    onChange={(value) => setForm((prev) => ({ ...prev, positioning: value }))}
                                />
                            </label>
                            <label className="dcp-form-field">
                                <span className="dcp-form-label">注册码</span>
                                <input
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
                                    <strong>地图位置</strong>
                                    {!readonly && (
                                        <div className="dcp-geo-panel__actions">
                                            <button type="button" className="pm-link-btn" onClick={handleSelectMapPoint}>
                                                <Plus size={14} />
                                                地图选点
                                            </button>
                                            <button
                                                type="button"
                                                className="pm-link-btn"
                                                onClick={() => setForm((prev) => ({
                                                    ...prev,
                                                    mapLongitude: '',
                                                    mapLatitude: '',
                                                    mapLocation: '',
                                                }))}
                                            >
                                                清空
                                            </button>
                                        </div>
                                    )}
                                </div>
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
                            <span className="dcp-enable-label">
                                {form.enabled
                                    ? `启用时间：${form.statusChangedAt}`
                                    : enableToggled
                                        ? `停用时间：${form.statusChangedAt}`
                                        : `最后启用时间：${existingDevice?.enabledAt || form.statusChangedAt || '—'}`}
                            </span>
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
            </div>

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
