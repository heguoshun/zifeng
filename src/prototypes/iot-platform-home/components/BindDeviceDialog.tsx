import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, MapPin, RefreshCw, Search, Watch } from 'lucide-react';
import ListPagination from './ListPagination';
import type { DeviceRecord, DeviceStatus } from '../data/devices';
import { isLargeMeterDevice, resolveDeviceProduct, STATUS_LABEL } from '../data/devices';
import { REMOTE_MANUFACTURERS } from '../data/largeMeters';
import type { ProductRecord } from '../data/products';
import type { LargeMeterArea } from '../data/largeMeters';
import { paginateItems } from '../utils/listPagination';
import ClearableInput from './ClearableInput';
import MapPickerDialog from './MapPickerDialog';
import ElSelect from './ElSelect';
import ElDateTimePicker from './ElDateTimePicker';
import '../device-management.css';
import '../area-config.css';

export type BindDeviceValue = {
    deviceId: string;
    name: string;
    userName: string;
    userNo: string;
    bodyNo: string;
    installTime: string;
    installAddress: string;
    longitude?: number;
    latitude?: number;
    mapAddress?: string;
    manufacturer: string;
    deviceFunction: string;
    caliber: string;
    communicationNo: string;
    remoteManufacturer: string;
};

type BindDeviceDialogProps = {
    open: boolean;
    area: LargeMeterArea;
    devices: DeviceRecord[];
    products: ProductRecord[];
    editingDevice?: DeviceRecord | null;
    meterManufacturerOptions: { label: string; value: string }[];
    remoteManufacturerOptions: { label: string; value: string }[];
    onClose: () => void;
    onConfirm: (value: BindDeviceValue) => void;
};

type BindStep = 'select' | 'details';

const EMPTY_FORM: Omit<BindDeviceValue, 'deviceId'> = {
    name: '',
    userName: '',
    userNo: '',
    bodyNo: '',
    installTime: '',
    installAddress: '',
    manufacturer: '',
    deviceFunction: '',
    caliber: '',
    communicationNo: '',
    remoteManufacturer: '',
};

const DEVICE_FUNCTION_OPTIONS = [
    { label: '大用户表', value: '大用户表' },
    { label: '结算表', value: '结算表' },
    { label: '考核表', value: '考核表' },
    { label: '监测表', value: '监测表' },
];

function DeviceStatusTag({ status }: { status: DeviceStatus }) {
    return <span className={`dm-status-tag dm-status-tag--${status}`}>{STATUS_LABEL[status]}</span>;
}

function toDateTimeLocal(value?: string) {
    if (!value) return '';
    const match = value.match(/^(\d{4})[./-](\d{1,2})[./-](\d{1,2})(?:\D+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);
    if (!match) return '';
    const [, year, month, day, hour = '0', minute = '0', second = '0'] = match;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')} ${hour.padStart(2, '0')}:${minute.padStart(2, '0')}:${second.padStart(2, '0')}`;
}

function toStoredDateTime(value: string) {
    return value ? value.replace('T', ' ') : '';
}

function getMapAddress(device: DeviceRecord) {
    if (device.mapAddress?.trim()) return device.mapAddress;
    if (device.installAddress?.trim()) return device.installAddress;
    if (Number.isFinite(device.longitude) && Number.isFinite(device.latitude)) {
        return `${device.longitude.toFixed(6)}, ${device.latitude.toFixed(6)}`;
    }
    return '';
}

function buildFormFromDevice(device: DeviceRecord, products: ProductRecord[]): Omit<BindDeviceValue, 'deviceId'> {
    const product = products.find((item) => item.id === device.productId);
    return {
        name: device.name,
        userName: device.userName ?? '',
        userNo: device.userNo ?? '',
        bodyNo: device.bodyNo ?? '',
        installTime: toDateTimeLocal(device.installTime),
        installAddress: getMapAddress(device),
        manufacturer: device.manufacturer ?? product?.vendor ?? '',
        deviceFunction: device.deviceFunction ?? '大用户表',
        caliber: device.caliber ?? 'DN100',
        communicationNo: device.communicationNo ?? device.registrationCode,
        remoteManufacturer: device.remoteManufacturer?.trim()
            || REMOTE_MANUFACTURERS[(Number(device.id) || 0) % REMOTE_MANUFACTURERS.length],
    };
}

export default function BindDeviceDialog({
    open,
    area,
    devices,
    products,
    editingDevice = null,
    meterManufacturerOptions,
    remoteManufacturerOptions,
    onClose,
    onConfirm,
}: BindDeviceDialogProps) {
    const isEditMode = Boolean(editingDevice);
    const [step, setStep] = useState<BindStep>('select');
    const [keyword, setKeyword] = useState('');
    const [selectedId, setSelectedId] = useState('');
    const [form, setForm] = useState(EMPTY_FORM);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState('10');
    const [jumpPage, setJumpPage] = useState('1');
    const [showErrors, setShowErrors] = useState(false);
    const [mapPickerOpen, setMapPickerOpen] = useState(false);
    const [draftLongitude, setDraftLongitude] = useState<number | null>(null);
    const [draftLatitude, setDraftLatitude] = useState<number | null>(null);

    useEffect(() => {
        if (!open) return;
        if (editingDevice) {
            setStep('details');
            setKeyword('');
            setSelectedId(editingDevice.id);
            setForm(buildFormFromDevice(editingDevice, products));
            setDraftLongitude(editingDevice.longitude ?? null);
            setDraftLatitude(editingDevice.latitude ?? null);
        } else {
            setStep('select');
            setKeyword('');
            setSelectedId('');
            setForm(EMPTY_FORM);
            setDraftLongitude(null);
            setDraftLatitude(null);
        }
        setCurrentPage(1);
        setJumpPage('1');
        setShowErrors(false);
        setMapPickerOpen(false);
    }, [open, editingDevice, products]);

    const availableDevices = useMemo(() => {
        const normalized = keyword.trim().toLowerCase();
        return devices
            .filter((device) => isLargeMeterDevice(device, products))
            .filter((device) => !device.largeMeterAreaId)
            .filter((device) => {
                if (!normalized) return true;
                const { productName } = resolveDeviceProduct(device, products);
                return device.name.toLowerCase().includes(normalized)
                    || device.code.toLowerCase().includes(normalized)
                    || productName.toLowerCase().includes(normalized);
            });
    }, [devices, keyword, products]);

    const pagination = useMemo(
        () => paginateItems(availableDevices, currentPage, Number(pageSize)),
        [availableDevices, currentPage, pageSize],
    );

    useEffect(() => {
        setCurrentPage(1);
        setJumpPage('1');
    }, [keyword, pageSize]);

    useEffect(() => setJumpPage(String(pagination.currentPage)), [pagination.currentPage]);

    const selectedDevice = useMemo(
        () => devices.find((device) => device.id === selectedId) ?? null,
        [devices, selectedId],
    );

    const chooseDevice = (device: DeviceRecord) => {
        setSelectedId(device.id);
        setShowErrors(false);
    };

    const continueToDetails = () => {
        if (!selectedDevice) return;
        setForm({
            ...EMPTY_FORM,
            name: selectedDevice.name,
            installAddress: getMapAddress(selectedDevice),
        });
        setShowErrors(false);
        setDraftLongitude(Number.isFinite(selectedDevice.longitude) ? selectedDevice.longitude : null);
        setDraftLatitude(Number.isFinite(selectedDevice.latitude) ? selectedDevice.latitude : null);
        setStep('details');
    };

    const updateField = (key: keyof typeof form, value: string) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const requiredComplete = Boolean(
        form.name.trim()
        && form.userName.trim()
        && form.userNo.trim()
        && form.bodyNo.trim()
        && form.installTime
        && form.installAddress.trim()
        && form.manufacturer.trim()
        && form.remoteManufacturer.trim()
        && form.deviceFunction.trim()
        && form.caliber.trim()
        && form.communicationNo.trim()
    );

    const handleConfirm = () => {
        const targetDevice = editingDevice ?? selectedDevice;
        if (!targetDevice || !requiredComplete) {
            setShowErrors(true);
            return;
        }
        onConfirm({
            deviceId: targetDevice.id,
            name: form.name.trim(),
            userName: form.userName.trim(),
            userNo: form.userNo.trim(),
            bodyNo: form.bodyNo.trim(),
            installTime: toStoredDateTime(form.installTime),
            installAddress: form.installAddress.trim(),
            longitude: draftLongitude ?? undefined,
            latitude: draftLatitude ?? undefined,
            mapAddress: form.installAddress.trim(),
            manufacturer: form.manufacturer.trim(),
            remoteManufacturer: form.remoteManufacturer.trim(),
            deviceFunction: form.deviceFunction.trim(),
            caliber: form.caliber.trim(),
            communicationNo: form.communicationNo.trim(),
        });
    };

    if (!open) return null;

    const activeDevice = editingDevice ?? selectedDevice;
    const activeProduct = activeDevice ? resolveDeviceProduct(activeDevice, products) : null;

    return createPortal(
        <div className="pcp-drawer-mask dcp-group-dialog-mask" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
            <aside className="pcp-drawer pcp-drawer--form dcp-group-dialog bd-bind-drawer" role="dialog" aria-modal="true" aria-labelledby="bind-device-dialog-title" onMouseDown={(event) => event.stopPropagation()}>
                <div className="pcp-drawer__head">
                    <h3 id="bind-device-dialog-title">
                        {isEditMode ? `编辑「${editingDevice?.name ?? ''}」安装信息` : `绑定设备到「${area.name}」`}
                    </h3>
                    <button type="button" className="pcp-drawer__close" onClick={onClose} aria-label="关闭">×</button>
                </div>

                <div className="pcp-drawer__body pcp-drawer__body--form bd-bind-body">
                    {!isEditMode && (
                    <div className="bd-bind-steps" aria-label="绑定步骤">
                        <div className={`bd-bind-step ${step === 'details' ? 'is-complete' : 'is-active'}`}>
                            <span>{step === 'details' ? <Check size={18} /> : '1'}</span>
                            <strong>选择设备</strong>
                        </div>
                        <div className="bd-bind-step-line" />
                        <div className={`bd-bind-step ${step === 'details' ? 'is-active' : ''}`}>
                            <span>2</span>
                            <strong>完善安装信息</strong>
                        </div>
                    </div>
                    )}

                    {!isEditMode && step === 'select' ? (
                        <section className="bd-bind-select-step">
                            <div className="bd-bind-select-head">
                                <div>
                                    <h4>选择设备</h4>
                                    <p>仅展示尚未绑定片区的大表设备，一次绑定一台。</p>
                                </div>
                                <div className="dm-tree-search bd-bind-search">
                                    <ClearableInput type="text" placeholder="搜索设备名称、编号或产品" value={keyword} onChange={(event) => setKeyword(event.target.value)} />
                                    <Search size={14} className="dm-tree-search-icon" />
                                </div>
                            </div>
                            <div className="pm-table-wrap bd-bind-table">
                                <table className="pm-table">
                                    <thead><tr><th className="bd-bind-radio-cell" /><th>设备名称</th><th>设备编号</th><th>产品类别</th><th>状态</th></tr></thead>
                                    <tbody>
                                        {pagination.items.length === 0 ? (
                                            <tr><td colSpan={5} className="bd-bind-empty">{keyword ? '无匹配设备' : '暂无可绑定设备'}</td></tr>
                                        ) : pagination.items.map((device) => {
                                            const { category } = resolveDeviceProduct(device, products);
                                            const checked = selectedId === device.id;
                                            return (
                                                <tr key={device.id} className={checked ? 'is-selected' : ''} onClick={() => chooseDevice(device)}>
                                                    <td className="bd-bind-radio-cell"><input type="radio" name="bind-device" checked={checked} onChange={() => chooseDevice(device)} aria-label={`选择${device.name}`} /></td>
                                                    <td>{device.name}</td><td>{device.code}</td><td>{category}</td><td><DeviceStatusTag status={device.status} /></td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            <ListPagination total={pagination.total} currentPage={pagination.currentPage} totalPages={pagination.totalPages} pageSize={pageSize} jumpPage={jumpPage} onPageChange={setCurrentPage} onPageSizeChange={setPageSize} onJumpPageChange={setJumpPage} />
                        </section>
                    ) : activeDevice && activeProduct ? (
                        <section className="bd-bind-details-step">
                            <div className="bd-bind-device-summary">
                                <div className="bd-bind-device-icon"><Watch size={34} /></div>
                                <dl><div><dt>设备名称</dt><dd>{activeDevice.name}</dd></div><div><dt>设备编号</dt><dd>{activeDevice.code}</dd></div><div><dt>产品类别</dt><dd>{activeProduct.category}</dd></div><div><dt>状态</dt><dd><DeviceStatusTag status={activeDevice.status} /></dd></div></dl>
                                {!isEditMode ? (
                                    <button type="button" className="pm-link-btn" onClick={() => setStep('select')}>更换设备</button>
                                ) : null}
                            </div>

                            <div className="bd-bind-section-title"><span />安装信息</div>
                            <div className="bd-bind-form-grid">
                                <BindField label="设备名称" required value={form.name} maxLength={50} placeholder="请输入设备名称" error={showErrors && !form.name.trim()} onChange={(value) => updateField('name', value)} />
                                <BindField label="用户名称" required value={form.userName} maxLength={50} placeholder="请输入用户名称" error={showErrors && !form.userName.trim()} onChange={(value) => updateField('userName', value)} />
                                <BindField label="用户号" required value={form.userNo} maxLength={30} placeholder="请输入用户号" error={showErrors && !form.userNo.trim()} onChange={(value) => updateField('userNo', value)} />
                                <BindField label="表身号" required value={form.bodyNo} maxLength={30} placeholder="请输入表身号" error={showErrors && !form.bodyNo.trim()} onChange={(value) => updateField('bodyNo', value)} />
                                <div className="bd-bind-field"><span><em>*</em> 表具厂家</span><ElSelect className={`bd-bind-select ${showErrors && !form.manufacturer.trim() ? 'is-error' : ''}`} placeholder="请选择表具厂家" value={form.manufacturer} options={[{ label: '请选择', value: '' }, ...meterManufacturerOptions]} onChange={(value) => updateField('manufacturer', value)} /></div>
                                <div className="bd-bind-field"><span><em>*</em> 远传厂家</span><ElSelect className={`bd-bind-select ${showErrors && !form.remoteManufacturer.trim() ? 'is-error' : ''}`} placeholder="请选择远传厂家" value={form.remoteManufacturer} options={[{ label: '请选择', value: '' }, ...remoteManufacturerOptions]} onChange={(value) => updateField('remoteManufacturer', value)} /></div>
                                <div className="bd-bind-field"><span><em>*</em> 设备功能</span><ElSelect className="bd-bind-select" placeholder="请选择" value={form.deviceFunction} options={[{ label: '请选择', value: '' }, ...DEVICE_FUNCTION_OPTIONS]} onChange={(value) => updateField('deviceFunction', value)} /></div>
                                <BindField label="设备口径" required value={form.caliber} maxLength={20} placeholder="例如：DN100" error={showErrors && !form.caliber.trim()} onChange={(value) => updateField('caliber', value)} />
                                <BindField label="通讯码" required value={form.communicationNo} maxLength={30} placeholder="请输入通讯码" error={showErrors && !form.communicationNo.trim()} onChange={(value) => updateField('communicationNo', value)} />
                                <div className="bd-bind-field">
                                    <span><em>*</em> 安装时间</span>
                                    <ElDateTimePicker
                                        className={`bd-bind-datetime-picker ${showErrors && !form.installTime ? 'is-error' : ''}`.trim()}
                                        size="medium"
                                        value={form.installTime}
                                        placeholder="请选择"
                                        onChange={(value) => updateField('installTime', value)}
                                    />
                                </div>
                                <div className="bd-bind-address-field">
                                    <span className="bd-bind-field-label"><em>*</em> 具体地址</span>
                                    <div className={`bd-bind-address-box ${showErrors && !form.installAddress.trim() ? 'is-error' : ''}`}>
                                        <textarea maxLength={120} value={form.installAddress} placeholder="请输入具体地址" onChange={(event) => updateField('installAddress', event.target.value)} />
                                        {isEditMode && form.installAddress.trim() ? <small>已登记安装地址</small> : null}
                                    </div>
                                    <button type="button" className="pm-btn pm-btn-ghost bd-bind-repick" onClick={() => setMapPickerOpen(true)}><RefreshCw size={14} />重新选点</button>
                                </div>
                            </div>

                            <div className="bd-bind-location-title">位置信息（来自设备选点）</div>
                            <div className="bd-bind-coordinates">
                                <MapPin size={20} />
                                <div><span>经度（longitude）</span><strong>{Number.isFinite(draftLongitude) ? draftLongitude?.toFixed(6) : '—'}</strong></div>
                                <div><span>纬度（latitude）</span><strong>{Number.isFinite(draftLatitude) ? draftLatitude?.toFixed(6) : '—'}</strong></div>
                            </div>
                        </section>
                    ) : null}
                </div>

                <div className="pcp-drawer__foot">
                    <button type="button" className="pm-btn pm-btn-ghost" onClick={onClose}>取消</button>
                    {!isEditMode && step === 'select' ? (
                        <button type="button" className="pm-btn pm-btn-primary" disabled={!selectedDevice} onClick={continueToDetails}>下一步</button>
                    ) : (
                        <button type="button" className="pm-btn pm-btn-primary" onClick={handleConfirm}>{isEditMode ? '保存' : '确认绑定'}</button>
                    )}
                </div>
            </aside>
            <MapPickerDialog
                open={mapPickerOpen}
                initialValue={{
                    longitude: draftLongitude == null ? '' : String(draftLongitude),
                    latitude: draftLatitude == null ? '' : String(draftLatitude),
                    location: form.installAddress,
                }}
                onClose={() => setMapPickerOpen(false)}
                onConfirm={(value) => {
                    setDraftLongitude(Number(value.longitude));
                    setDraftLatitude(Number(value.latitude));
                    updateField('installAddress', value.location);
                    setMapPickerOpen(false);
                }}
            />
        </div>,
        document.body,
    );
}

type BindFieldProps = {
    label: string;
    required?: boolean;
    value: string;
    maxLength: number;
    placeholder: string;
    error?: boolean;
    onChange: (value: string) => void;
};

function BindField({ label, required, value, maxLength, placeholder, error, onChange }: BindFieldProps) {
    return (
        <label className="bd-bind-field">
            <span>{required ? <><em>*</em> </> : null}{label}</span>
            <div className={`bd-bind-input-wrap ${error ? 'is-error' : ''}`}>
                <input value={value} maxLength={maxLength} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
                <small>{value.length}/{maxLength}</small>
            </div>
        </label>
    );
}
