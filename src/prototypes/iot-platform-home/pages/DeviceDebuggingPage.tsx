import React, { useEffect, useMemo, useState } from 'react';
import { Pause, Play, Trash2 } from 'lucide-react';
import deviceDebugIcon from '../assets/device-debug-icon.png';
import AppShell from '../components/AppShell';
import DeviceAccessSidebar, { type DeviceAccessPageId } from '../components/DeviceAccessSidebar';
import ElSelect from '../components/ElSelect';
import ElTreeSelect from '../components/ElTreeSelect';
import IotToast, { type IotToastData, triggerIotToast } from '../components/IotToast';
import type { DeviceRecord } from '../data/devices';
import {
    buildInitialPropertyValues,
    buildMockPropertyReadValues,
    createDebugLog,
    getDebugDevicesForProduct,
    resolveDebugProduct,
    type DebugLogEntry,
    type DebugPropertyField,
} from '../data/deviceDebugging';
import {
    buildDebugProductSelectTree,
    DEFAULT_PRODUCT_TREE_EXPANDED,
} from '../data/productCategories';
import type { ProductRecord } from '../data/products';
import '../device-access.css';
import '../device-debugging.css';
import '../product-create.css';

type DeviceDebuggingPageProps = {
    products: ProductRecord[];
    devices: DeviceRecord[];
    onNavigateHome: () => void;
    onNavigateDeviceAccess: () => void;
    onNavigateMessageCenter: () => void;
    onNavigate: (pageId: DeviceAccessPageId) => void;
    onNavigateOmManagement: () => void;
    onNavigateSystemManagement: () => void;
};

type MainTab = 'device' | 'app';
type DeviceSimTab = 'property' | 'event';
type AppSimTab = 'set' | 'get' | 'expect' | 'service';
type DebugMode = 'gateway' | 'subdevice';

function getPropertyDisplayLabel(field: DebugPropertyField) {
    if (field.unit) {
        return `${field.name} (${field.unit})`;
    }
    return `${field.name} (${field.typeLabel})`;
}

function PropertyFieldRow({
    field,
    checked,
    value,
    disabled,
    onCheck,
    onChange,
}: {
    field: DebugPropertyField;
    checked: boolean;
    value: string;
    disabled: boolean;
    onCheck: (checked: boolean) => void;
    onChange: (value: string) => void;
}) {
    return (
        <div className="ddb-prop-item">
            <label className="ddb-prop-item__head">
                <input
                    type="checkbox"
                    checked={checked}
                    disabled={disabled}
                    onChange={(event) => onCheck(event.target.checked)}
                />
                <span>{getPropertyDisplayLabel(field)}</span>
            </label>
            {field.dataType === 'bool' ? (
                <ElSelect
                    className="el-select--medium ddb-prop-item__control"
                    size="medium"
                    value={value}
                    disabled={disabled || !checked}
                    options={[
                        { label: '请选择', value: '' },
                        { label: '开', value: 'true' },
                        { label: '关', value: 'false' },
                    ]}
                    onChange={onChange}
                />
            ) : field.dataType === 'enum' && field.enumOptions?.length ? (
                <ElSelect
                    className="el-select--medium ddb-prop-item__control"
                    size="medium"
                    value={value}
                    disabled={disabled || !checked}
                    options={[
                        { label: '请选择', value: '' },
                        ...field.enumOptions.map((item) => ({
                            label: item.label,
                            value: item.value,
                        })),
                    ]}
                    onChange={onChange}
                />
            ) : (
                <input
                    className="ddb-prop-item__control"
                    type="text"
                    placeholder="请输入"
                    value={value}
                    disabled={disabled || !checked}
                    onChange={(event) => onChange(event.target.value)}
                />
            )}
        </div>
    );
}

function PropertyCheckboxRow({
    field,
    checked,
    onCheck,
}: {
    field: DebugPropertyField;
    checked: boolean;
    onCheck: (checked: boolean) => void;
}) {
    return (
        <label className="ddb-prop-item ddb-prop-item--all">
            <input
                type="checkbox"
                checked={checked}
                onChange={(event) => onCheck(event.target.checked)}
            />
            <span>{getPropertyDisplayLabel(field)}</span>
        </label>
    );
}

function PropertySelectAllRow({
    checked,
    onChange,
}: {
    checked: boolean;
    onChange: (checked: boolean) => void;
}) {
    return (
        <label className="ddb-prop-item ddb-prop-item--all">
            <input
                type="checkbox"
                checked={checked}
                onChange={(event) => onChange(event.target.checked)}
            />
            <span>全部</span>
        </label>
    );
}

export default function DeviceDebuggingPage({
    products,
    devices,
    onNavigateHome,
    onNavigateDeviceAccess,
    onNavigateMessageCenter,
    onNavigate,
    onNavigateOmManagement,
    onNavigateSystemManagement,
}: DeviceDebuggingPageProps) {
    const productTree = useMemo(() => buildDebugProductSelectTree(products ?? []), [products]);
    const validProductIds = useMemo(
        () => new Set((products ?? []).map((item) => item.id)),
        [products],
    );

    const [productId, setProductId] = useState('');
    const [deviceId, setDeviceId] = useState('');
    const [debugMode, setDebugMode] = useState<DebugMode>('gateway');
    const [subDeviceId, setSubDeviceId] = useState('');
    const [mainTab, setMainTab] = useState<MainTab>('device');
    const [deviceSimTab, setDeviceSimTab] = useState<DeviceSimTab>('property');
    const [appSimTab, setAppSimTab] = useState<AppSimTab>('set');
    const [debugging, setDebugging] = useState(false);
    const [logs, setLogs] = useState<DebugLogEntry[]>([]);
    const [propertyValues, setPropertyValues] = useState<Record<string, string>>({});
    const [expectPropertyValues, setExpectPropertyValues] = useState<Record<string, string>>({});
    const [selectedProps, setSelectedProps] = useState<Record<string, boolean>>({});
    const [getSelectedProps, setGetSelectedProps] = useState<Record<string, boolean>>({});
    const [expectSelectedProps, setExpectSelectedProps] = useState<Record<string, boolean>>({});
    const [selectedEventId, setSelectedEventId] = useState('');
    const [eventPayload, setEventPayload] = useState('');
    const [selectedServiceId, setSelectedServiceId] = useState('');
    const [servicePayload, setServicePayload] = useState('');
    const [toast, setToast] = useState<IotToastData | null>(null);

    const product = useMemo(
        () => (productId ? resolveDebugProduct(productId, products, devices) : undefined),
        [productId, products, devices],
    );
    const productDevices = useMemo(
        () => getDebugDevicesForProduct(productId, products, devices),
        [productId, products, devices],
    );
    const device = productDevices.find((item) => item.id === deviceId);
    const subDevice = device?.subDevices?.find((item) => item.id === subDeviceId);
    const activeTargetName = debugMode === 'subdevice' && subDevice
        ? subDevice.name
        : device?.name ?? '—';
    const activeTargetLabel = debugMode === 'subdevice' && subDevice
        ? `【${subDevice.productLabel}】`
        : product ? `【${product.name}】` : '';

    const deviceOptions = useMemo(
        () => productDevices.map((item) => ({
            label: item.name,
            value: item.id,
        })),
        [productDevices],
    );

    const subDeviceOptions = useMemo(
        () => (device?.subDevices ?? []).map((item) => ({
            label: item.name,
            value: item.id,
        })),
        [device],
    );

    const eventOptions = useMemo(
        () => (product?.events ?? []).map((item) => ({
            label: item.name,
            value: item.id,
        })),
        [product],
    );

    const serviceOptions = useMemo(
        () => (product?.functions ?? []).map((item) => ({
            label: item.name,
            value: item.id,
        })),
        [product],
    );

    const selectedEvent = product?.events.find((item) => item.id === selectedEventId);
    const selectedService = product?.functions.find((item) => item.id === selectedServiceId);

    const initPropertySelection = (fields: DebugPropertyField[]) => (
        Object.fromEntries(fields.map((field) => [field.id, true]))
    );

    useEffect(() => {
        if (!productId || !validProductIds.has(productId)) {
            setDeviceId('');
            setSubDeviceId('');
            setPropertyValues({});
            setExpectPropertyValues({});
            setSelectedProps({});
            setGetSelectedProps({});
            setExpectSelectedProps({});
            setSelectedEventId('');
            setEventPayload('');
            setSelectedServiceId('');
            setServicePayload('');
            setDebugging(false);
            return;
        }
        const currentProduct = resolveDebugProduct(productId, products, devices);
        if (!currentProduct) return;

        const initialValues = buildInitialPropertyValues(currentProduct);
        const allSelected = initPropertySelection(currentProduct.properties);
        setPropertyValues(initialValues);
        setExpectPropertyValues(initialValues);
        setSelectedProps(allSelected);
        setGetSelectedProps(allSelected);
        setExpectSelectedProps(allSelected);
        setSelectedEventId(currentProduct.events[0]?.id ?? '');
        setEventPayload(currentProduct.events[0]?.jsonObject ?? '');
        setSelectedServiceId(currentProduct.functions[0]?.id ?? '');
        setServicePayload(currentProduct.functions[0]?.defaultInput ?? '{}');
        setDeviceId((prev) => {
            if (productDevices.some((item) => item.id === prev)) return prev;
            return productDevices[0]?.id ?? '';
        });
    }, [productId, products, devices, productDevices, validProductIds]);

    useEffect(() => {
        if (!selectedEvent) {
            setEventPayload('');
            return;
        }
        setEventPayload(selectedEvent.jsonObject);
    }, [selectedEventId, selectedEvent?.jsonObject]);

    useEffect(() => {
        if (!selectedService) {
            setServicePayload('');
            return;
        }
        setServicePayload(selectedService.defaultInput);
    }, [selectedServiceId, selectedService?.defaultInput]);

    useEffect(() => {
        if (!device) {
            setSubDeviceId('');
            return;
        }
        if (!device.subDevices?.some((item) => item.id === subDeviceId)) {
            setSubDeviceId(device.subDevices?.[0]?.id ?? '');
        }
    }, [deviceId, device, subDeviceId]);

    useEffect(() => {
        if (!product?.isGateway) {
            setDebugMode('gateway');
        }
    }, [productId, product?.isGateway]);

    const canDebug = Boolean(product && device);
    const showSubDevice = Boolean(product?.isGateway && device && debugMode === 'subdevice');

    const appendLog = (title: string, payload: Record<string, unknown>) => {
        setLogs((prev) => [createDebugLog(title, payload), ...prev]);
    };

    const handleStartDebug = () => {
        if (!canDebug) {
            triggerIotToast(setToast, '请先选择产品和设备', 'warning');
            return;
        }
        setDebugging(true);
        appendLog('登录', {
            action: 'login',
            productId: product!.id,
            deviceId: debugMode === 'subdevice' ? subDeviceId : deviceId,
            mode: debugMode,
        });
        triggerIotToast(setToast, '已开始调试', 'success');
    };

    const handleStopDebug = () => {
        setDebugging(false);
        appendLog('停止调试', { action: 'stop' });
    };

    const handlePropertyReport = () => {
        if (!debugging || !product) return;
        const payload = Object.fromEntries(
            product.properties
                .filter((field) => selectedProps[field.id])
                .map((field) => [field.identifier, propertyValues[field.id] ?? '']),
        );
        if (Object.keys(payload).length === 0) {
            triggerIotToast(setToast, '请至少选择一个属性', 'warning');
            return;
        }
        const isAppSet = mainTab === 'app' && appSimTab === 'set';
        appendLog(isAppSet ? '属性设置' : '属性上报', payload);
        appendLog('收到平台响应', { code: 200, message: 'success', data: payload });
        triggerIotToast(setToast, isAppSet ? '属性设置成功' : '属性上报成功', 'success');
    };

    const handlePropertyGet = () => {
        if (!debugging || !product) return;
        const identifiers = product.properties
            .filter((field) => getSelectedProps[field.id])
            .map((field) => field.identifier);
        if (identifiers.length === 0) {
            triggerIotToast(setToast, '请至少选择一个属性', 'warning');
            return;
        }
        appendLog('属性获取', { identifiers });
        const data = buildMockPropertyReadValues(product.properties, getSelectedProps);
        appendLog('收到平台响应', { code: 200, message: 'success', data });
        triggerIotToast(setToast, '属性获取成功', 'success');
    };

    const handlePropertyExpectSet = () => {
        if (!debugging || !product) return;
        const payload = Object.fromEntries(
            product.properties
                .filter((field) => expectSelectedProps[field.id])
                .map((field) => [field.identifier, expectPropertyValues[field.id] ?? '']),
        );
        if (Object.keys(payload).length === 0) {
            triggerIotToast(setToast, '请至少选择一个属性', 'warning');
            return;
        }
        appendLog('属性期望值设置', payload);
        appendLog('收到平台响应', { code: 200, message: 'success', data: payload });
        triggerIotToast(setToast, '属性期望值设置成功', 'success');
    };

    const handleServiceInvoke = () => {
        if (!debugging || !selectedService) return;
        let parsedPayload: Record<string, unknown> = {};
        try {
            parsedPayload = servicePayload.trim() ? JSON.parse(servicePayload) : {};
        } catch {
            triggerIotToast(setToast, '服务入参 JSON 格式不正确', 'warning');
            return;
        }
        const payload = {
            identifier: selectedService.identifier,
            serviceName: selectedService.name,
            async: selectedService.async,
            input: parsedPayload,
        };
        appendLog('服务调用', payload);
        appendLog('收到平台响应', {
            code: 200,
            message: 'success',
            data: selectedService.async
                ? { taskId: `task-${Date.now()}`, status: 'pending' }
                : { result: 'ok' },
        });
        triggerIotToast(setToast, '服务调用成功', 'success');
    };

    const handleEventReport = () => {
        if (!debugging || !selectedEvent) return;
        let parsedPayload: Record<string, unknown> = {};
        try {
            parsedPayload = eventPayload.trim() ? JSON.parse(eventPayload) : {};
        } catch {
            triggerIotToast(setToast, '事件参数 JSON 格式不正确', 'warning');
            return;
        }
        const payload = {
            identifier: selectedEvent.identifier,
            eventName: selectedEvent.name,
            eventType: selectedEvent.eventType,
            data: parsedPayload,
        };
        appendLog('事件上报', payload);
        appendLog('收到平台响应', { code: 200, message: 'success', data: payload });
        triggerIotToast(setToast, '事件上报成功', 'success');
    };

    const handleReset = () => {
        if (!product) return;
        const initialValues = buildInitialPropertyValues(product);
        const allSelected = initPropertySelection(product.properties);

        if (mainTab === 'device' && deviceSimTab === 'event') {
            setEventPayload(selectedEvent?.jsonObject ?? product.events[0]?.jsonObject ?? '');
            return;
        }
        if (mainTab === 'app' && appSimTab === 'service') {
            setServicePayload(selectedService?.defaultInput ?? product.functions[0]?.defaultInput ?? '{}');
            return;
        }
        if (mainTab === 'app' && appSimTab === 'get') {
            setGetSelectedProps(allSelected);
            return;
        }
        if (mainTab === 'app' && appSimTab === 'expect') {
            setExpectPropertyValues(initialValues);
            setExpectSelectedProps(allSelected);
            return;
        }

        setPropertyValues(initialValues);
        setSelectedProps(allSelected);
    };

    const renderSimulatorContent = () => {
        if (!canDebug || !debugging) {
            return (
                <div className="ddb-empty">
                    <span className="ddb-empty__dash">—</span>
                </div>
            );
        }

        const showProperty = mainTab === 'device' ? deviceSimTab === 'property' : appSimTab === 'set';
        const showPropertyGet = mainTab === 'app' && appSimTab === 'get';
        const showPropertyExpect = mainTab === 'app' && appSimTab === 'expect';
        const showService = mainTab === 'app' && appSimTab === 'service';
        const showEvent = mainTab === 'device' && deviceSimTab === 'event';

        if (showProperty) {
            const isAppSet = mainTab === 'app';
            return (
                <div className="ddb-simulator__form">
                    <div className="ddb-prop-list">
                        <PropertySelectAllRow
                            checked={product!.properties.every((field) => selectedProps[field.id])}
                            onChange={(checked) => {
                                setSelectedProps(Object.fromEntries(
                                    product!.properties.map((field) => [field.id, checked]),
                                ));
                            }}
                        />
                        {product!.properties.map((field) => (
                            <PropertyFieldRow
                                key={field.id}
                                field={field}
                                checked={Boolean(selectedProps[field.id])}
                                value={propertyValues[field.id] ?? ''}
                                disabled={false}
                                onCheck={(checked) => setSelectedProps((prev) => ({
                                    ...prev,
                                    [field.id]: checked,
                                }))}
                                onChange={(value) => setPropertyValues((prev) => ({
                                    ...prev,
                                    [field.id]: value,
                                }))}
                            />
                        ))}
                    </div>
                    <div className="ddb-simulator__foot">
                        <button type="button" className="pm-btn pm-btn-ghost" onClick={handleReset}>
                            重置
                        </button>
                        <button
                            type="button"
                            className="pm-btn pm-btn-primary"
                            onClick={handlePropertyReport}
                        >
                            {isAppSet ? '属性设置' : '属性上报'}
                        </button>
                    </div>
                </div>
            );
        }

        if (showPropertyGet) {
            return (
                <div className="ddb-simulator__form">
                    <div className="ddb-prop-list">
                        <PropertySelectAllRow
                            checked={product!.properties.every((field) => getSelectedProps[field.id])}
                            onChange={(checked) => {
                                setGetSelectedProps(Object.fromEntries(
                                    product!.properties.map((field) => [field.id, checked]),
                                ));
                            }}
                        />
                        {product!.properties.map((field) => (
                            <PropertyCheckboxRow
                                key={field.id}
                                field={field}
                                checked={Boolean(getSelectedProps[field.id])}
                                onCheck={(checked) => setGetSelectedProps((prev) => ({
                                    ...prev,
                                    [field.id]: checked,
                                }))}
                            />
                        ))}
                    </div>
                    <div className="ddb-simulator__foot">
                        <button type="button" className="pm-btn pm-btn-ghost" onClick={handleReset}>
                            重置
                        </button>
                        <button
                            type="button"
                            className="pm-btn pm-btn-primary"
                            onClick={handlePropertyGet}
                        >
                            属性获取
                        </button>
                    </div>
                </div>
            );
        }

        if (showPropertyExpect) {
            return (
                <div className="ddb-simulator__form">
                    <div className="ddb-prop-list">
                        <PropertySelectAllRow
                            checked={product!.properties.every((field) => expectSelectedProps[field.id])}
                            onChange={(checked) => {
                                setExpectSelectedProps(Object.fromEntries(
                                    product!.properties.map((field) => [field.id, checked]),
                                ));
                            }}
                        />
                        {product!.properties.map((field) => (
                            <PropertyFieldRow
                                key={field.id}
                                field={field}
                                checked={Boolean(expectSelectedProps[field.id])}
                                value={expectPropertyValues[field.id] ?? ''}
                                disabled={false}
                                onCheck={(checked) => setExpectSelectedProps((prev) => ({
                                    ...prev,
                                    [field.id]: checked,
                                }))}
                                onChange={(value) => setExpectPropertyValues((prev) => ({
                                    ...prev,
                                    [field.id]: value,
                                }))}
                            />
                        ))}
                    </div>
                    <div className="ddb-simulator__foot">
                        <button type="button" className="pm-btn pm-btn-ghost" onClick={handleReset}>
                            重置
                        </button>
                        <button
                            type="button"
                            className="pm-btn pm-btn-primary"
                            onClick={handlePropertyExpectSet}
                        >
                            设置期望值
                        </button>
                    </div>
                </div>
            );
        }

        if (showService && selectedService) {
            return (
                <div className="ddb-simulator__form">
                    <div className="ddb-prop-list">
                        <label className="pcp-form-field" style={{ maxWidth: 320 }}>
                            <span className="pcp-form-label">选择服务</span>
                            <ElSelect
                                className="el-select--medium"
                                size="medium"
                                value={selectedServiceId}
                                options={serviceOptions}
                                onChange={setSelectedServiceId}
                            />
                        </label>
                        <div className="ddb-event-detail">
                            <div className="ddb-event-detail__meta">
                                <div className="ddb-prop-row__label">{selectedService.name}</div>
                                <div className="ddb-prop-row__type">
                                    {selectedService.asyncLabel}
                                    {selectedService.description ? ` · ${selectedService.description}` : ''}
                                </div>
                            </div>
                            <label className="ddb-event-detail__field">
                                <span className="pcp-form-label">服务入参</span>
                                <textarea
                                    className="ddb-event-detail__textarea"
                                    value={servicePayload}
                                    placeholder="请输入服务 JSON 入参"
                                    onChange={(event) => setServicePayload(event.target.value)}
                                />
                            </label>
                        </div>
                    </div>
                    <div className="ddb-simulator__foot">
                        <button type="button" className="pm-btn pm-btn-ghost" onClick={handleReset}>
                            重置
                        </button>
                        <button
                            type="button"
                            className="pm-btn pm-btn-primary"
                            onClick={handleServiceInvoke}
                        >
                            服务调用
                        </button>
                    </div>
                </div>
            );
        }

        if (showService && !selectedService) {
            return (
                <div className="ddb-empty">
                    当前产品暂无可用服务
                </div>
            );
        }

        if (showEvent && selectedEvent) {
            return (
                <div className="ddb-simulator__form">
                    <div className="ddb-prop-list">
                        <label className="pcp-form-field" style={{ maxWidth: 320 }}>
                            <span className="pcp-form-label">选择事件</span>
                            <ElSelect
                                className="el-select--medium"
                                size="medium"
                                value={selectedEventId}
                                options={eventOptions}
                                onChange={setSelectedEventId}
                            />
                        </label>
                        <div className="ddb-event-detail">
                            <div className="ddb-event-detail__meta">
                                <div className="ddb-prop-row__label">{selectedEvent.name}</div>
                                <div className="ddb-prop-row__type">
                                    {selectedEvent.typeLabel}
                                    {selectedEvent.description ? ` · ${selectedEvent.description}` : ''}
                                </div>
                            </div>
                            <label className="ddb-event-detail__field">
                                <span className="pcp-form-label">事件参数</span>
                                <textarea
                                    className="ddb-event-detail__textarea"
                                    value={eventPayload}
                                    placeholder="请输入事件 JSON 参数"
                                    onChange={(event) => setEventPayload(event.target.value)}
                                />
                            </label>
                        </div>
                    </div>
                    <div className="ddb-simulator__foot">
                        <button type="button" className="pm-btn pm-btn-ghost" onClick={handleReset}>
                            重置
                        </button>
                        <button
                            type="button"
                            className="pm-btn pm-btn-primary"
                            onClick={handleEventReport}
                        >
                            事件上报
                        </button>
                    </div>
                </div>
            );
        }

        return null;
    };

    const sidebar = <DeviceAccessSidebar pageId="device-debug" onNavigate={onNavigate} />;

    return (
        <AppShell
            activeTopTab="设备接入"
            sidebar={sidebar}
            onNavigateMessageCenter={onNavigateMessageCenter}
            onNavigateOmManagement={onNavigateOmManagement}
            onNavigateSystemManagement={onNavigateSystemManagement}
            onTopTabChange={(tab) => {
                if (tab === '设备接入') onNavigate('home');
                if (tab === '运维管理') onNavigateOmManagement();
            }}
        >
            <div className="ddb-page">
                <div className="crumb">设备接入 / 设备运维 / 设备调试</div>

                <section className="panel ddb-device-panel">
                    <div className="ddb-device-title">设备</div>
                    <div className="ddb-device-panel__inner">
                        <div className="ddb-device-visual">
                            <div className="ddb-device-icon">
                                <img src={deviceDebugIcon} alt="" />
                            </div>
                            <span className="ddb-device-status">
                                {device && (
                                    <i className={`ddb-device-status__dot ${device.status === 'online' ? 'is-online' : 'is-offline'}`} />
                                )}
                                {device?.status === 'online' ? '设备在线' : device ? '设备离线' : '---'}
                            </span>
                        </div>

                        <div className="ddb-device-body">
                            <div className="ddb-device-controls">
                                <ElTreeSelect
                                    className="el-select--medium ddb-select"
                                    size="medium"
                                    value={productId}
                                    tree={productTree}
                                    placeholder="请选择产品"
                                    showAllOption={false}
                                    defaultExpanded={DEFAULT_PRODUCT_TREE_EXPANDED}
                                    onChange={(value) => {
                                        if (validProductIds.has(value)) {
                                            setProductId(value);
                                        }
                                    }}
                                />
                                <ElSelect
                                    className="el-select--medium ddb-select"
                                    size="medium"
                                    value={deviceId}
                                    placeholder="请选择设备"
                                    disabled={!productId || deviceOptions.length === 0}
                                    options={[
                                        { label: '请选择设备', value: '' },
                                        ...deviceOptions,
                                    ]}
                                    onChange={setDeviceId}
                                />
                                <div className="ddb-mode-toggle">
                                    <button
                                        type="button"
                                        className={debugMode === 'gateway' ? 'is-active' : ''}
                                        onClick={() => setDebugMode('gateway')}
                                    >
                                        网关调试
                                    </button>
                                    <button
                                        type="button"
                                        className={debugMode === 'subdevice' ? 'is-active' : ''}
                                        onClick={() => {
                                            if (!product?.isGateway) {
                                                triggerIotToast(
                                                    setToast,
                                                    '当前产品不是网关设备，请切换为网关类产品',
                                                    'warning',
                                                );
                                                return;
                                            }
                                            if (!device) {
                                                triggerIotToast(setToast, '请先选择设备', 'warning');
                                                return;
                                            }
                                            setDebugMode('subdevice');
                                        }}
                                    >
                                        子设备调试
                                    </button>
                                </div>
                            </div>
                            <div className="ddb-device-right">
                                <div className="ddb-device-meta">
                                    <div className="ddb-device-meta-item">
                                        产品ID: {product?.code ?? '-'}
                                    </div>
                                    <div className="ddb-device-meta-item">
                                        产品类型: {product?.nodeType ?? '-'}
                                    </div>
                                    <div className="ddb-device-meta-item">
                                        设备ID: {device?.code ?? '-'}
                                    </div>
                                </div>
                                {showSubDevice && (
                                    <div className="ddb-sub-device-block">
                                        <div className="ddb-sub-device-block__label">子设备</div>
                                        <ElSelect
                                            className="el-select--medium ddb-select ddb-select--sub"
                                            size="medium"
                                            value={subDeviceId}
                                            placeholder="请选择"
                                            options={subDeviceOptions}
                                            onChange={setSubDeviceId}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                <section className="panel ddb-workspace">
                    <div className="ddb-tab-bar">
                        <div className="ddb-tab-bar__left">
                            <div className="ddb-main-tabs">
                                <button
                                    type="button"
                                    className={`ddb-main-tab ${mainTab === 'device' ? 'is-active' : ''}`}
                                    onClick={() => setMainTab('device')}
                                >
                                    设备模拟器
                                </button>
                                <button
                                    type="button"
                                    className={`ddb-main-tab ${mainTab === 'app' ? 'is-active' : ''}`}
                                    onClick={() => setMainTab('app')}
                                >
                                    应用模拟器
                                </button>
                            </div>

                            {mainTab === 'device' ? (
                                <div className="ddb-sub-tabs">
                                    <button
                                        type="button"
                                        className={`ddb-sub-tab ${deviceSimTab === 'property' ? 'is-active' : ''}`}
                                        onClick={() => setDeviceSimTab('property')}
                                    >
                                        属性上报
                                    </button>
                                    <button
                                        type="button"
                                        className={`ddb-sub-tab ${deviceSimTab === 'event' ? 'is-active' : ''}`}
                                        onClick={() => setDeviceSimTab('event')}
                                    >
                                        事件上报
                                    </button>
                                </div>
                            ) : (
                                <div className="ddb-sub-tabs">
                                    {([
                                        ['set', '属性设置'],
                                        ['get', '属性获取'],
                                        ['expect', '属性期望值设置'],
                                        ['service', '服务调用'],
                                    ] as const).map(([id, label]) => (
                                        <button
                                            key={id}
                                            type="button"
                                            className={`ddb-sub-tab ${appSimTab === id ? 'is-active' : ''}`}
                                            onClick={() => setAppSimTab(id)}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="ddb-body">
                        <div className="ddb-simulator">
                            <div className="ddb-simulator-card">
                                <div className="ddb-simulator__head">
                                    <div className="ddb-simulator__head-main">
                                        <div className="ddb-simulator__title">
                                            {mainTab === 'device' ? '设备模拟调试' : '应用模拟调试'}
                                        </div>
                                        {canDebug && (
                                            <div className="ddb-simulator__target">
                                                {activeTargetName} {activeTargetLabel}
                                            </div>
                                        )}
                                    </div>
                                    {debugging ? (
                                        <button type="button" className="ddb-debug-action" onClick={handleStopDebug}>
                                            <span className="ddb-debug-action__icon">
                                                <Pause size={16} />
                                            </span>
                                            <span className="ddb-debug-action__text">停止调试</span>
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            className="ddb-debug-action"
                                            disabled={!canDebug}
                                            onClick={handleStartDebug}
                                        >
                                            <span className="ddb-debug-action__icon">
                                                <Play size={16} />
                                            </span>
                                            <span className="ddb-debug-action__text">开始调试</span>
                                        </button>
                                    )}
                                </div>
                                <div className="ddb-simulator__divider" />
                                <div className="ddb-simulator__content">
                                    {renderSimulatorContent()}
                                </div>
                            </div>
                        </div>

                        <div className="ddb-log-panel">
                            <div className="ddb-log-card">
                                <div className="ddb-log-panel__head">
                                    <h3>调试日志</h3>
                                    <button
                                        type="button"
                                        className="ddb-clear-btn"
                                        onClick={() => setLogs([])}
                                    >
                                        <Trash2 size={13} />
                                        清屏
                                    </button>
                                </div>
                                <div className="ddb-log-panel__divider" />
                                <div className="ddb-log-list">
                                    {logs.length === 0 ? (
                                        <div className="ddb-empty">
                                            暂无日志，开始调试后将在此显示
                                        </div>
                                    ) : (
                                        logs.map((log) => (
                                            <article key={log.id} className="ddb-log-item">
                                                <div className="ddb-log-item__head">
                                                    <span className="ddb-log-item__tag">{log.title}</span>
                                                    <span className="ddb-log-item__time">{log.time}</span>
                                                </div>
                                                <pre>{log.payload}</pre>
                                            </article>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            <IotToast toast={toast} />
        </AppShell>
    );
}
