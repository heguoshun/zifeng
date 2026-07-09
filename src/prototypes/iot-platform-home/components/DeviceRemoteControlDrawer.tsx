import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import ElDateRangePicker from './ElDateRangePicker';
import ElSelect from './ElSelect';
import type { IotToastType } from './IotToast';
import { STATUS_LABEL, collectFrequencyToMinutes, formatCollectFrequencyDisplay, type DeviceRecord } from '../data/devices';
import type { DebugPropertyField } from '../data/deviceDebugging';
import {
    buildServiceInputJson,
    buildServiceParamFields,
    canControlDevice,
    estimateBackfillRecords,
    formatDeviceDateLabel,
    getControlFunctions,
    getDefaultBackfillRange,
    getMissingBackfillRange,
    getReportableProperties,
    getWritableProperties,
    initPropertyValues,
    initServiceInputValues,
    simulateHistoricalBackfill,
    simulatePropertySet,
    simulateServiceInvoke,
    validateBackfillRequest,
    type ControlLogEntry,
} from '../data/deviceRemoteControl';
import type { ProductRecord } from '../data/products';
import '../product-create.css';
import '../device-create.css';
import '../device-remote-control.css';
import ClearableInput from './ClearableInput';

type DeviceRemoteControlDrawerProps = {
    open: boolean;
    device: DeviceRecord | null;
    product: ProductRecord | null;
    productName: string;
    onClose: () => void;
    onShowToast: (message: string, type?: IotToastType) => void;
};

type ControlTab = 'service' | 'property' | 'backfill';

function parseServiceInputJsonSafe(inputJson: string): Record<string, string> {
    if (!inputJson.trim()) return {};
    try {
        const parsed = JSON.parse(inputJson) as Record<string, unknown>;
        return Object.fromEntries(
            Object.entries(parsed).map(([key, value]) => [key, String(value ?? '')]),
        );
    } catch {
        return {};
    }
}

function PropertyControlRow({
    field,
    value,
    onChange,
    onSubmit,
}: {
    field: DebugPropertyField;
    value: string;
    onChange: (value: string) => void;
    onSubmit: () => void;
}) {
    return (
        <div className="drc-property-item">
            <div className="drc-property-item__meta">
                <strong>{field.name}</strong>
                <span>{field.identifier}</span>
            </div>
            {field.dataType === 'bool' ? (
                <ElSelect
                    className="el-select--medium"
                    size="medium"
                    value={value}
                    options={[
                        { label: '关', value: 'false' },
                        { label: '开', value: 'true' },
                    ]}
                    onChange={onChange}
                />
            ) : (
                <ClearableInput
                    type="text"
                    className="pcp-form-input"
                    placeholder="请输入"
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                />
            )}
            <button
                type="button"
                className="pm-btn pm-btn-primary"
                onClick={onSubmit}
            >
                下发
            </button>
        </div>
    );
}

export default function DeviceRemoteControlDrawer({
    open,
    device,
    product,
    productName,
    onClose,
    onShowToast,
}: DeviceRemoteControlDrawerProps) {
    const [activeTab, setActiveTab] = useState<ControlTab>('service');
    const [selectedServiceId, setSelectedServiceId] = useState('');
    const [serviceValues, setServiceValues] = useState<Record<string, string>>({});
    const [serviceJson, setServiceJson] = useState('{}');
    const [propertyValues, setPropertyValues] = useState<Record<string, string>>({});
    const [backfillStartDate, setBackfillStartDate] = useState('');
    const [backfillEndDate, setBackfillEndDate] = useState('');
    const [backfillPropertyIds, setBackfillPropertyIds] = useState<string[]>([]);
    const [backfilling, setBackfilling] = useState(false);
    const [logs, setLogs] = useState<ControlLogEntry[]>([]);
    const [invoking, setInvoking] = useState(false);

    const functions = useMemo(() => getControlFunctions(product), [product]);
    const writableProperties = useMemo(() => getWritableProperties(product), [product]);
    const reportableProperties = useMemo(() => getReportableProperties(product), [product]);
    const missingBackfillRange = useMemo(
        () => (device ? getMissingBackfillRange(device) : null),
        [device],
    );
    const estimatedBackfillRecords = useMemo(
        () => estimateBackfillRecords(
            backfillStartDate,
            backfillEndDate,
            collectFrequencyToMinutes(device?.collectFrequency ?? '', device?.collectFrequencyUnit),
        ),
        [backfillStartDate, backfillEndDate, device?.collectFrequency, device?.collectFrequencyUnit],
    );

    const selectedService = useMemo(
        () => functions.find((item) => item.id === selectedServiceId) ?? functions[0] ?? null,
        [functions, selectedServiceId],
    );

    const serviceParamFields = useMemo(() => {
        if (!selectedService) return [];
        return buildServiceParamFields(selectedService, serviceValues);
    }, [selectedService, serviceValues]);

    useEffect(() => {
        if (!open || !device) return;

        const nextService = functions[0] ?? null;
        const defaultRange = getDefaultBackfillRange(device);
        setActiveTab('service');
        setSelectedServiceId(nextService?.id ?? '');
        setPropertyValues(initPropertyValues(writableProperties));
        setBackfillStartDate(defaultRange.startDate);
        setBackfillEndDate(defaultRange.endDate);
        setBackfillPropertyIds(reportableProperties.map((field) => field.id));
        setLogs([]);
        setInvoking(false);
        setBackfilling(false);
    }, [open, device, functions, writableProperties, reportableProperties]);

    useEffect(() => {
        if (!open || !selectedServiceId) return;
        const service = functions.find((item) => item.id === selectedServiceId);
        if (!service) return;
        setServiceValues(initServiceInputValues(service));
        setServiceJson(service.defaultInput);
    }, [open, selectedServiceId, functions]);

    useEffect(() => {
        if (!open) return undefined;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [open]);

    if (!open || !device) return null;

    const controlCheck = canControlDevice(device);
    const isOnline = device.status === 'online';
    const showOfflineWarning = device.status === 'offline' || device.status === 'fault';

    const handleMaskMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
        if (event.target === event.currentTarget) {
            onClose();
        }
    };

    const appendLog = (entry: ControlLogEntry) => {
        setLogs((prev) => [entry, ...prev].slice(0, 20));
    };

    const handleServiceValueChange = (key: string, value: string) => {
        const nextValues = { ...serviceValues, [key]: value };
        setServiceValues(nextValues);
        setServiceJson(buildServiceInputJson(nextValues));
    };

    const handleServiceInvoke = async () => {
        if (!controlCheck.allowed) {
            onShowToast(controlCheck.message ?? '当前设备不可控制');
            return;
        }
        if (!selectedService) {
            onShowToast('请选择控制服务');
            return;
        }

        let parsedInput: Record<string, string> = {};
        try {
            const parsed = JSON.parse(serviceJson) as Record<string, unknown>;
            parsedInput = Object.fromEntries(
                Object.entries(parsed).map(([key, value]) => [key, String(value ?? '')]),
            );
        } catch {
            onShowToast('服务入参 JSON 格式不正确');
            return;
        }

        setInvoking(true);
        await new Promise((resolve) => window.setTimeout(resolve, 500));

        const log = simulateServiceInvoke(device, selectedService, parsedInput, isOnline);
        appendLog(log);
        setInvoking(false);

        if (!isOnline) {
            onShowToast('设备离线，指令已加入下发队列', 'warning');
            return;
        }

        onShowToast(
            selectedService.async ? '服务调用已提交，等待设备响应' : '服务调用成功',
            'success',
        );
    };

    const handlePropertySet = (field: DebugPropertyField) => {
        if (!controlCheck.allowed) {
            onShowToast(controlCheck.message ?? '当前设备不可控制');
            return;
        }
        if (!product) return;

        const propertyRow = product.properties.find((item) => item.id === field.id);
        if (!propertyRow) return;

        const value = propertyValues[field.id] ?? '';
        if (!value.trim()) {
            onShowToast(`请设置${field.name}`);
            return;
        }

        const log = simulatePropertySet(device, propertyRow, value);
        appendLog(log);
        onShowToast(`${field.name} 下发成功`, 'success');
    };

    const handleApplyMissingRange = () => {
        if (!missingBackfillRange) {
            onShowToast('当前设备暂无明确的缺失补采时段', 'warning');
            return;
        }
        setBackfillStartDate(missingBackfillRange.startDate);
        setBackfillEndDate(missingBackfillRange.endDate);
    };

    const toggleBackfillProperty = (propertyId: string) => {
        setBackfillPropertyIds((prev) => (
            prev.includes(propertyId)
                ? prev.filter((id) => id !== propertyId)
                : [...prev, propertyId]
        ));
    };

    const handleSelectAllBackfillProperties = () => {
        setBackfillPropertyIds(reportableProperties.map((field) => field.id));
    };

    const handleClearBackfillProperties = () => {
        setBackfillPropertyIds([]);
    };

    const handleHistoricalBackfill = async () => {
        if (!controlCheck.allowed) {
            onShowToast(controlCheck.message ?? '当前设备不可控制');
            return;
        }

        const validation = validateBackfillRequest(
            device,
            backfillStartDate,
            backfillEndDate,
            backfillPropertyIds,
        );
        if (!validation.valid) {
            onShowToast(validation.message ?? '补采参数不正确', 'warning');
            return;
        }

        const selectedProperties = reportableProperties.filter((field) => (
            backfillPropertyIds.includes(field.id)
        ));

        setBackfilling(true);
        await new Promise((resolve) => window.setTimeout(resolve, 700));

        const log = simulateHistoricalBackfill(
            device,
            backfillStartDate,
            backfillEndDate,
            backfillPropertyIds,
            selectedProperties.map((field) => field.name),
            isOnline,
        );
        appendLog(log);
        setBackfilling(false);

        onShowToast(
            isOnline
                ? `补采任务已下发，预计上报 ${estimatedBackfillRecords.toLocaleString('zh-CN')} 条历史数据`
                : '设备离线，补采任务已加入待执行队列',
            isOnline ? 'success' : 'warning',
        );
    };

    const renderBackfillPanel = () => {
        if (!reportableProperties.length) {
            return <div className="drc-empty">当前产品暂无可补采属性</div>;
        }

        const allSelected = backfillPropertyIds.length === reportableProperties.length;

        return (
            <div className="drc-backfill">
                <div className="drc-backfill__intro">
                    <strong>离线安装补采</strong>
                    <p>
                        设备已在现场安装并持续采集，但尚未接入平台。接入后可在此选择缺失时段，
                        一键下发补采指令，让设备将本地缓存的历史数据批量上报至平台。
                    </p>
                </div>

                <div className="drc-backfill__timeline">
                    <div className="drc-backfill__timeline-item">
                        <span>安装时间</span>
                        <strong>{formatDeviceDateLabel(device.installTime)}</strong>
                    </div>
                    <div className="drc-backfill__timeline-item">
                        <span>平台接入</span>
                        <strong>{formatDeviceDateLabel(device.enabledAt)}</strong>
                    </div>
                    <div className="drc-backfill__timeline-item">
                        <span>采集频率</span>
                        <strong>{formatCollectFrequencyDisplay(device.collectFrequency, device.collectFrequencyUnit)}</strong>
                    </div>
                </div>

                <div className="drc-backfill__section">
                    <div className="drc-backfill__section-head">
                        <span className="pcp-form-label">补采时间范围</span>
                        {missingBackfillRange ? (
                            <button
                                type="button"
                                className="pm-link-btn"
                                onClick={handleApplyMissingRange}
                            >
                                补采全部缺失时段
                            </button>
                        ) : null}
                    </div>
                    <ElDateRangePicker
                        className="el-select--medium"
                        size="medium"
                        start={backfillStartDate}
                        end={backfillEndDate}
                        placeholder="请选择补采起止日期"
                        onChange={({ start, end }) => {
                            setBackfillStartDate(start);
                            setBackfillEndDate(end);
                        }}
                    />
                    {backfillStartDate && backfillEndDate ? (
                        <p className="drc-backfill__estimate">
                            预计补采约 <strong>{estimatedBackfillRecords.toLocaleString('zh-CN')}</strong> 条历史记录
                            {missingBackfillRange
                                && backfillStartDate === missingBackfillRange.startDate
                                && backfillEndDate === missingBackfillRange.endDate
                                ? '，覆盖安装后至接入前的缺失数据'
                                : ''}
                        </p>
                    ) : null}
                </div>

                <div className="drc-backfill__section">
                    <div className="drc-backfill__section-head">
                        <span className="pcp-form-label">补采属性</span>
                        <div className="drc-backfill__property-actions">
                            <button
                                type="button"
                                className="pm-link-btn"
                                onClick={handleSelectAllBackfillProperties}
                                disabled={allSelected}
                            >
                                全选
                            </button>
                            <button
                                type="button"
                                className="pm-link-btn"
                                onClick={handleClearBackfillProperties}
                                disabled={!backfillPropertyIds.length}
                            >
                                清空
                            </button>
                        </div>
                    </div>
                    <div className="drc-backfill__property-list">
                        {reportableProperties.map((field) => {
                            const checked = backfillPropertyIds.includes(field.id);
                            return (
                                <label key={field.id} className="drc-backfill__property-item">
                                    <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() => toggleBackfillProperty(field.id)}
                                    />
                                    <span>
                                        <strong>{field.name}</strong>
                                        <em>{field.identifier}</em>
                                    </span>
                                </label>
                            );
                        })}
                    </div>
                </div>

                <div className="drc-panel__foot">
                    <button
                        type="button"
                        className="pm-btn pm-btn-ghost"
                        onClick={() => {
                            const defaultRange = getDefaultBackfillRange(device);
                            setBackfillStartDate(defaultRange.startDate);
                            setBackfillEndDate(defaultRange.endDate);
                            handleSelectAllBackfillProperties();
                        }}
                    >
                        重置
                    </button>
                    <button
                        type="button"
                        className="pm-btn pm-btn-primary"
                        disabled={backfilling || !controlCheck.allowed}
                        onClick={handleHistoricalBackfill}
                    >
                        {backfilling ? '下发中...' : '一键补采上报'}
                    </button>
                </div>
            </div>
        );
    };

    const renderServicePanel = () => {
        if (!functions.length) {
            return <div className="drc-empty">当前产品暂无可用控制服务</div>;
        }

        return (
            <div className="drc-service-layout">
                <div className="drc-service-list" role="listbox" aria-label="控制服务列表">
                    {functions.map((service) => (
                        <button
                            key={service.id}
                            type="button"
                            role="option"
                            aria-selected={selectedService?.id === service.id}
                            className={`drc-service-item ${selectedService?.id === service.id ? 'is-active' : ''}`}
                            onClick={() => setSelectedServiceId(service.id)}
                        >
                            <strong>{service.name}</strong>
                            <span>
                                {service.asyncLabel}
                                {service.description ? ` · ${service.description}` : ''}
                            </span>
                        </button>
                    ))}
                </div>

                {selectedService ? (
                    <div className="drc-service-detail">
                        <div className="drc-service-detail__head">
                            <strong>{selectedService.name}</strong>
                            <p>
                                标识符：{selectedService.identifier}
                                {selectedService.description ? ` · ${selectedService.description}` : ''}
                            </p>
                        </div>

                        {serviceParamFields.length > 0 ? (
                            <div className="drc-param-list">
                                {serviceParamFields.map((field) => (
                                    <div key={field.key} className="drc-param-field">
                                        <span>{field.label}</span>
                                        {field.inputType === 'select' && field.options?.length ? (
                                            <ElSelect
                                                className="el-select--medium"
                                                size="medium"
                                                value={field.value}
                                                options={field.options}
                                                onChange={(value) => handleServiceValueChange(field.key, value)}
                                            />
                                        ) : (
                                            <ClearableInput
                                                type="text"
                                                className="pcp-form-input"
                                                placeholder="请输入"
                                                value={field.value}
                                                onChange={(event) => handleServiceValueChange(
                                                    field.key,
                                                    event.target.value,
                                                )}
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : null}

                        <label className="drc-json-field">
                            <span className="pcp-form-label">服务入参（JSON）</span>
                            <textarea
                                value={serviceJson}
                                placeholder="请输入服务 JSON 入参"
                                onChange={(event) => {
                                    setServiceJson(event.target.value);
                                    setServiceValues(parseServiceInputJsonSafe(event.target.value));
                                }}
                            />
                        </label>

                        <div className="drc-panel__foot">
                            <button
                                type="button"
                                className="pm-btn pm-btn-ghost"
                                onClick={() => {
                                    if (!selectedService) return;
                                    const initial = initServiceInputValues(selectedService);
                                    setServiceValues(initial);
                                    setServiceJson(buildServiceInputJson(initial));
                                }}
                            >
                                重置
                            </button>
                            <button
                                type="button"
                                className="pm-btn pm-btn-primary"
                                disabled={invoking || !controlCheck.allowed}
                                onClick={handleServiceInvoke}
                            >
                                {invoking ? '下发中...' : '下发指令'}
                            </button>
                        </div>
                    </div>
                ) : null}
            </div>
        );
    };

    const renderPropertyPanel = () => {
        if (!writableProperties.length) {
            return <div className="drc-empty">当前产品暂无可写属性</div>;
        }

        return (
            <div className="drc-property-list">
                {writableProperties.map((field) => (
                    <PropertyControlRow
                        key={field.id}
                        field={field}
                        value={propertyValues[field.id] ?? ''}
                        onChange={(value) => setPropertyValues((prev) => ({ ...prev, [field.id]: value }))}
                        onSubmit={() => handlePropertySet(field)}
                    />
                ))}
            </div>
        );
    };

    return createPortal(
        <div
            className="pcp-drawer-mask dcp-group-dialog-mask"
            role="presentation"
            onMouseDown={handleMaskMouseDown}
        >
            <aside
                className="pcp-drawer pcp-drawer--form dcp-group-dialog drc-drawer"
                role="dialog"
                aria-modal="true"
                aria-labelledby="drc-drawer-title"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <div className="pcp-drawer__head">
                    <h3 id="drc-drawer-title">远程控制</h3>
                    <button type="button" className="pcp-drawer__close" onClick={onClose} aria-label="关闭">×</button>
                </div>

                <div className="pcp-drawer__body pcp-drawer__body--form drc-drawer__body">
                    <div className="drc-device-summary">
                        <div className="drc-device-summary__item">
                            <span>设备名称</span>
                            <strong>{device.name}</strong>
                        </div>
                        <div className="drc-device-summary__item">
                            <span>设备编号</span>
                            <strong>{device.code}</strong>
                        </div>
                        <div className="drc-device-summary__item">
                            <span>所属产品</span>
                            <strong>{productName}</strong>
                        </div>
                        <div className="drc-device-summary__item">
                            <span>设备状态</span>
                            <strong>{STATUS_LABEL[device.status]}</strong>
                        </div>
                    </div>

                    {!controlCheck.allowed ? (
                        <div className="drc-alert drc-alert--warning">{controlCheck.message}</div>
                    ) : null}

                    {controlCheck.allowed && showOfflineWarning ? (
                        <div className="drc-alert drc-alert--warning">
                            设备当前{STATUS_LABEL[device.status]}，指令将尝试下发，离线时进入待执行队列。
                        </div>
                    ) : null}

                    <div className="drc-tabs" role="tablist" aria-label="远程控制类型">
                        <button
                            type="button"
                            role="tab"
                            aria-selected={activeTab === 'service'}
                            className={`drc-tab ${activeTab === 'service' ? 'is-active' : ''}`}
                            onClick={() => setActiveTab('service')}
                        >
                            服务控制
                        </button>
                        <button
                            type="button"
                            role="tab"
                            aria-selected={activeTab === 'property'}
                            className={`drc-tab ${activeTab === 'property' ? 'is-active' : ''}`}
                            onClick={() => setActiveTab('property')}
                        >
                            属性设置
                        </button>
                        <button
                            type="button"
                            role="tab"
                            aria-selected={activeTab === 'backfill'}
                            className={`drc-tab ${activeTab === 'backfill' ? 'is-active' : ''}`}
                            onClick={() => setActiveTab('backfill')}
                        >
                            历史补采
                        </button>
                    </div>

                    <div className="drc-panel">
                        {activeTab === 'service'
                            ? renderServicePanel()
                            : activeTab === 'property'
                                ? renderPropertyPanel()
                                : renderBackfillPanel()}
                    </div>

                    <div className="drc-log">
                        <div className="drc-log__head">
                            <h4>执行记录</h4>
                            {logs.length > 0 ? (
                                <button
                                    type="button"
                                    className="pm-link-btn"
                                    onClick={() => setLogs([])}
                                >
                                    清空
                                </button>
                            ) : null}
                        </div>
                        {logs.length === 0 ? (
                            <div className="drc-empty" style={{ minHeight: 88 }}>暂无执行记录</div>
                        ) : (
                            <div className="drc-log__list">
                                {logs.map((log) => (
                                    <div key={log.id} className="drc-log-item">
                                        <div className="drc-log-item__top">
                                            <strong>{log.type} · {log.title}</strong>
                                            <span>{log.time}</span>
                                            <span className={`drc-log-status drc-log-status--${log.status}`}>
                                                {log.status === 'success' ? '成功' : log.status === 'pending' ? '待执行' : '失败'}
                                            </span>
                                        </div>
                                        <pre>{log.payload}</pre>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="pcp-drawer__foot">
                    <button type="button" className="pm-btn pm-btn-ghost" onClick={onClose}>关闭</button>
                </div>
            </aside>
        </div>,
        document.body,
    );
}
