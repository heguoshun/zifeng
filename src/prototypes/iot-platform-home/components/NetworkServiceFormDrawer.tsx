import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CloudUpload } from 'lucide-react';
import ElSelect from './ElSelect';
import {
    NETWORK_SERVICE_DISCARD_DELIMITER_OPTIONS,
    NETWORK_SERVICE_DTLS_ENABLED_OPTIONS,
    NETWORK_SERVICE_LENGTH_FIELD_VALUE_OPTIONS,
    NETWORK_SERVICE_PACKET_RULE_OPTIONS,
    NETWORK_SERVICE_TYPE_FORM_OPTIONS,
    type NetworkServiceComponentSource,
    type NetworkServiceDiscardDelimiter,
    type NetworkServiceDtlsEnabled,
    type NetworkServiceLengthFieldEndian,
    type NetworkServiceNetworkScope,
    type NetworkServicePacketRule,
    type NetworkServiceRecord,
    type NetworkServiceType,
} from '../data/networkServices';
import type { CertificateRecord } from '../data/certificates';
import '../product-create.css';
import '../device-create.css';
import '../protocol-management.css';
import ClearableInput from './ClearableInput';

export type NetworkServiceFormValue = {
    name: string;
    componentSource: NetworkServiceComponentSource;
    serviceType: NetworkServiceType | '';
    sdkFileName: string;
    packetRule: NetworkServicePacketRule | '';
    delimiter: string;
    discardDelimiter: NetworkServiceDiscardDelimiter | '';
    fixedLength: string;
    byteCount: string;
    endOffset: string;
    subsequentLength: string;
    firstByteCount: string;
    lengthFieldValue: NetworkServiceLengthFieldEndian | '';
    clusterAddress: string;
    mqttUsername: string;
    mqttPassword: string;
    messageQuality: string;
    timeout: string;
    keepAlive: string;
    networkScope: NetworkServiceNetworkScope;
    ipAddress: string;
    port: string;
    enableDtls: NetworkServiceDtlsEnabled;
    certificateId: string;
    privateKeyAlias: string;
};

type NetworkServiceFormDrawerProps = {
    open: boolean;
    mode: 'add' | 'edit';
    certificates: CertificateRecord[];
    initialValue?: NetworkServiceFormValue;
    onClose: () => void;
    onSubmit: (value: NetworkServiceFormValue) => void;
};

const EMPTY_FORM: NetworkServiceFormValue = {
    name: '',
    componentSource: '系统内置',
    serviceType: '',
    sdkFileName: '',
    packetRule: '',
    delimiter: '',
    discardDelimiter: '',
    fixedLength: '',
    byteCount: '',
    endOffset: '',
    subsequentLength: '',
    firstByteCount: '',
    lengthFieldValue: '',
    clusterAddress: '',
    mqttUsername: '',
    mqttPassword: '',
    messageQuality: '',
    timeout: '',
    keepAlive: '',
    networkScope: '本地网络',
    ipAddress: '',
    port: '',
    enableDtls: '否',
    certificateId: '',
    privateKeyAlias: '',
};

const TYPE_OPTIONS = [
    { label: '请选择类型', value: '' },
    ...NETWORK_SERVICE_TYPE_FORM_OPTIONS.map((item) => ({
        label: item.label,
        value: item.value,
    })),
];

const PACKET_RULE_OPTIONS = [
    { label: '请选择', value: '' },
    ...NETWORK_SERVICE_PACKET_RULE_OPTIONS.map((item) => ({
        label: item.label,
        value: item.value,
    })),
];

const DISCARD_DELIMITER_OPTIONS = [
    { label: '请选择', value: '' },
    ...NETWORK_SERVICE_DISCARD_DELIMITER_OPTIONS.map((item) => ({
        label: item.label,
        value: item.value,
    })),
];

const LENGTH_FIELD_VALUE_OPTIONS = [
    { label: '请选择', value: '' },
    ...NETWORK_SERVICE_LENGTH_FIELD_VALUE_OPTIONS.map((item) => ({
        label: item.label,
        value: item.value,
    })),
];

const DTLS_ENABLED_OPTIONS = NETWORK_SERVICE_DTLS_ENABLED_OPTIONS.map((item) => ({
    label: item.label,
    value: item.value,
}));

const DTLS_CONFIG_EMPTY = {
    certificateId: '',
    privateKeyAlias: '',
};

const PACKET_RULE_SPECIFIC_EMPTY = {
    delimiter: '',
    discardDelimiter: '' as const,
    fixedLength: '',
    byteCount: '',
    endOffset: '',
    subsequentLength: '',
    firstByteCount: '',
    lengthFieldValue: '' as const,
};

const TYPE_SPECIFIC_EMPTY = {
    packetRule: '' as const,
    ...PACKET_RULE_SPECIFIC_EMPTY,
    clusterAddress: '',
    mqttUsername: '',
    mqttPassword: '',
    messageQuality: '',
    timeout: '',
    keepAlive: '',
};

function isTcpPacketRuleConfigValid(form: NetworkServiceFormValue): boolean {
    if (!form.packetRule) return false;
    if (form.packetRule === '分隔符') {
        return form.delimiter.trim().length > 0;
    }
    if (form.packetRule === '固定长度') {
        return form.fixedLength.trim().length > 0;
    }
    return true;
}

export function toNetworkServiceFormValue(service: NetworkServiceRecord): NetworkServiceFormValue {
    return {
        name: service.name,
        componentSource: service.componentSource,
        serviceType: service.serviceType ?? '',
        sdkFileName: service.sdkFileName ?? '',
        packetRule: service.packetRule ?? '',
        delimiter: service.delimiter ?? '',
        discardDelimiter: service.discardDelimiter ?? '',
        fixedLength: service.fixedLength ?? '',
        byteCount: service.byteCount ?? '',
        endOffset: service.endOffset ?? '',
        subsequentLength: service.subsequentLength ?? '',
        firstByteCount: service.firstByteCount ?? '',
        lengthFieldValue: service.lengthFieldValue ?? '',
        clusterAddress: service.clusterAddress ?? '',
        mqttUsername: service.mqttUsername ?? '',
        mqttPassword: service.mqttPassword ?? '',
        messageQuality: service.messageQuality ?? '',
        timeout: service.timeout ?? '',
        keepAlive: service.keepAlive ?? '',
        networkScope: service.networkScope,
        ipAddress: service.ipAddress,
        port: service.port,
        enableDtls: service.enableDtls ?? '否',
        certificateId: service.certificateId ?? '',
        privateKeyAlias: service.privateKeyAlias ?? '',
    };
}

export default function NetworkServiceFormDrawer({
    open,
    mode,
    certificates,
    initialValue,
    onClose,
    onSubmit,
}: NetworkServiceFormDrawerProps) {
    const [form, setForm] = useState<NetworkServiceFormValue>(EMPTY_FORM);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!open) return;

        if (mode === 'edit' && initialValue) {
            setForm({ ...initialValue });
            return;
        }

        setForm(EMPTY_FORM);
    }, [open, mode, initialValue]);

    if (!open) return null;

    const isBuiltIn = form.componentSource === '系统内置';
    const isTcp = isBuiltIn && form.serviceType === 'TCP服务';
    const isMqtt = isBuiltIn && form.serviceType === 'MQTT服务';
    const isDtlsEnabled = form.enableDtls === '是';

    const certificateOptions = [
        { label: '请选择证书', value: '' },
        ...certificates.map((item) => ({ label: item.name, value: item.id })),
    ];

    const hasDtlsConfig = !isDtlsEnabled || form.certificateId !== '';

    const hasTcpConfig = !isTcp || isTcpPacketRuleConfigValid(form);
    const hasMqttConfig = !isMqtt
        || (form.clusterAddress.trim().length > 0
            && form.mqttUsername.trim().length > 0
            && form.mqttPassword.trim().length > 0
            && form.messageQuality.trim().length > 0);

    const canSubmit = form.name.trim()
        && (isBuiltIn ? form.serviceType !== '' : Boolean(form.sdkFileName))
        && hasTcpConfig
        && hasMqttConfig
        && hasDtlsConfig
        && form.ipAddress.trim().length > 0
        && form.port.trim().length > 0;

    const handleConfirm = () => {
        if (!canSubmit) return;
        onSubmit({
            name: form.name.trim(),
            componentSource: form.componentSource,
            serviceType: form.serviceType,
            sdkFileName: form.sdkFileName,
            packetRule: form.packetRule,
            delimiter: form.delimiter.trim(),
            discardDelimiter: form.discardDelimiter,
            fixedLength: form.fixedLength.trim(),
            byteCount: form.byteCount.trim(),
            endOffset: form.endOffset.trim(),
            subsequentLength: form.subsequentLength.trim(),
            firstByteCount: form.firstByteCount.trim(),
            lengthFieldValue: form.lengthFieldValue,
            clusterAddress: form.clusterAddress.trim(),
            mqttUsername: form.mqttUsername.trim(),
            mqttPassword: form.mqttPassword.trim(),
            messageQuality: form.messageQuality.trim(),
            timeout: form.timeout.trim(),
            keepAlive: form.keepAlive.trim(),
            networkScope: form.networkScope,
            ipAddress: form.ipAddress.trim(),
            port: form.port.trim(),
            enableDtls: form.enableDtls,
            certificateId: isDtlsEnabled ? form.certificateId : '',
            privateKeyAlias: isDtlsEnabled ? form.privateKeyAlias.trim() : '',
        });
    };

    const handleMaskMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
        if (event.target === event.currentTarget) {
            onClose();
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        setForm((prev) => ({ ...prev, sdkFileName: file.name }));
        event.target.value = '';
    };

    return createPortal(
        <div
            className="pcp-drawer-mask dcp-group-dialog-mask"
            role="presentation"
            onMouseDown={handleMaskMouseDown}
        >
            <aside
                className="pcp-drawer pcp-drawer--form dcp-group-dialog pt-form-drawer"
                role="dialog"
                aria-modal="true"
                aria-labelledby="ns-form-drawer-title"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <div className="pcp-drawer__head">
                    <h3 id="ns-form-drawer-title">{mode === 'add' ? '新增网络服务' : '编辑网络服务'}</h3>
                    <button type="button" className="pcp-drawer__close" onClick={onClose} aria-label="关闭">×</button>
                </div>

                <div className="pcp-drawer__body pcp-drawer__body--form">
                    <label className="pcp-drawer-field">
                        <span className="pcp-form-label"><em>*</em>服务名称：</span>
                        <ClearableInput
                            type="text"
                            className="pcp-form-input"
                            placeholder="请输入服务名称"
                            value={form.name}
                            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                        />
                    </label>

                    <div className="pcp-drawer-field">
                        <span className="pcp-form-label"><em>*</em>服务组件：</span>
                        <div className="pcp-radio-group pt-form-radio-group">
                            <label className="pcp-radio">
                                <input
                                    type="radio"
                                    name="ns-component-source"
                                    checked={form.componentSource === '系统内置'}
                                    onChange={() => setForm((prev) => ({
                                        ...prev,
                                        componentSource: '系统内置',
                                    }))}
                                />
                                系统内置
                            </label>
                            <label className="pcp-radio">
                                <input
                                    type="radio"
                                    name="ns-component-source"
                                    checked={form.componentSource === '自定义服务'}
                                    onChange={() => setForm((prev) => ({
                                        ...prev,
                                        componentSource: '自定义服务',
                                    }))}
                                />
                                自定义服务
                            </label>
                        </div>
                    </div>

                    {isBuiltIn ? (
                        <div className="pcp-drawer-field">
                            <span className="pcp-form-label"><em>*</em>服务类型：</span>
                            <ElSelect
                                className="el-select--medium pcp-form-select"
                                size="medium"
                                value={form.serviceType}
                                options={TYPE_OPTIONS}
                                onChange={(value) => setForm((prev) => ({
                                    ...prev,
                                    serviceType: value as NetworkServiceType | '',
                                    ...TYPE_SPECIFIC_EMPTY,
                                }))}
                            />
                        </div>
                    ) : (
                        <div className="pcp-drawer-field">
                            <span className="pcp-form-label pt-form-label-row">
                                <span><em>*</em>组件文件：</span>
                                <span className="pt-form-label-hint">请上传不超过100M，格式为SDK文件</span>
                            </span>
                            <input
                                ref={fileInputRef}
                                type="file"
                                className="pt-form-file-input"
                                onChange={handleFileChange}
                            />
                            <button
                                type="button"
                                className="pt-upload-file-btn"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <CloudUpload size={16} />
                                选择上传文件
                            </button>
                            {form.sdkFileName ? (
                                <p className="pt-upload-file-name">{form.sdkFileName}</p>
                            ) : null}
                        </div>
                    )}

                    <div className="pcp-drawer-field">
                        <span className="pcp-form-label"><em>*</em>网络类型：</span>
                        <div className="pcp-radio-group pt-form-radio-group">
                            <label className="pcp-radio">
                                <input
                                    type="radio"
                                    name="ns-network-scope"
                                    checked={form.networkScope === '本地网络'}
                                    onChange={() => setForm((prev) => ({
                                        ...prev,
                                        networkScope: '本地网络',
                                    }))}
                                />
                                本地网络
                            </label>
                            <label className="pcp-radio">
                                <input
                                    type="radio"
                                    name="ns-network-scope"
                                    checked={form.networkScope === '公共网络'}
                                    onChange={() => setForm((prev) => ({
                                        ...prev,
                                        networkScope: '公共网络',
                                    }))}
                                />
                                公共网络
                            </label>
                        </div>
                    </div>

                    <div className="pcp-drawer-field">
                        <span className="pcp-form-label"><em>*</em>IP地址：</span>
                        <div className="ns-ip-row">
                            <ClearableInput
                                type="text"
                                className="pcp-form-input"
                                placeholder="请输入地址"
                                value={form.ipAddress}
                                onChange={(event) => setForm((prev) => ({
                                    ...prev,
                                    ipAddress: event.target.value,
                                }))}
                            />
                            <ClearableInput
                                type="text"
                                className="pcp-form-input"
                                placeholder="请输入端口"
                                value={form.port}
                                onChange={(event) => setForm((prev) => ({
                                    ...prev,
                                    port: event.target.value,
                                }))}
                            />
                        </div>
                    </div>

                    <div className="pcp-drawer-field">
                        <span className="pcp-form-label">是否开启DTLS：</span>
                        <ElSelect
                            className="el-select--medium pcp-form-select"
                            size="medium"
                            value={form.enableDtls}
                            options={DTLS_ENABLED_OPTIONS}
                            onChange={(value) => setForm((prev) => ({
                                ...prev,
                                enableDtls: value as NetworkServiceDtlsEnabled,
                                ...(value === '否' ? DTLS_CONFIG_EMPTY : {}),
                            }))}
                        />
                    </div>

                    {isDtlsEnabled ? (
                        <>
                            <div className="pcp-drawer-field">
                                <span className="pcp-form-label"><em>*</em>证书：</span>
                                <ElSelect
                                    className="el-select--medium pcp-form-select"
                                    size="medium"
                                    value={form.certificateId}
                                    options={certificateOptions}
                                    onChange={(value) => setForm((prev) => ({
                                        ...prev,
                                        certificateId: value,
                                    }))}
                                />
                            </div>
                            <label className="pcp-drawer-field">
                                <span className="pcp-form-label">私钥别名：</span>
                                <ClearableInput
                                    type="text"
                                    className="pcp-form-input"
                                    placeholder="请输入私钥别名"
                                    value={form.privateKeyAlias}
                                    onChange={(event) => setForm((prev) => ({
                                        ...prev,
                                        privateKeyAlias: event.target.value,
                                    }))}
                                />
                            </label>
                        </>
                    ) : null}

                    {isTcp ? (
                        <>
                            <div className="pcp-drawer-field">
                                <span className="pcp-form-label"><em>*</em>粘拆包规则：</span>
                                <ElSelect
                                    className="el-select--medium pcp-form-select"
                                    size="medium"
                                    value={form.packetRule}
                                    options={PACKET_RULE_OPTIONS}
                                    onChange={(value) => setForm((prev) => ({
                                        ...prev,
                                        packetRule: value as NetworkServicePacketRule | '',
                                        ...PACKET_RULE_SPECIFIC_EMPTY,
                                    }))}
                                />
                            </div>

                            {form.packetRule === '分隔符' ? (
                                <>
                                    <label className="pcp-drawer-field">
                                        <span className="pcp-form-label"><em>*</em>分隔符：</span>
                                        <ClearableInput
                                            type="text"
                                            className="pcp-form-input"
                                            placeholder="请输入分隔符"
                                            value={form.delimiter}
                                            onChange={(event) => setForm((prev) => ({
                                                ...prev,
                                                delimiter: event.target.value,
                                            }))}
                                        />
                                    </label>
                                    <div className="pcp-drawer-field">
                                        <span className="pcp-form-label">是否丢弃分隔符：</span>
                                        <ElSelect
                                            className="el-select--medium pcp-form-select"
                                            size="medium"
                                            value={form.discardDelimiter}
                                            options={DISCARD_DELIMITER_OPTIONS}
                                            onChange={(value) => setForm((prev) => ({
                                                ...prev,
                                                discardDelimiter: value as NetworkServiceDiscardDelimiter | '',
                                            }))}
                                        />
                                    </div>
                                </>
                            ) : null}

                            {form.packetRule === '固定长度' ? (
                                <label className="pcp-drawer-field">
                                    <span className="pcp-form-label"><em>*</em>长度值：</span>
                                    <ClearableInput
                                        type="text"
                                        className="pcp-form-input"
                                        placeholder="请输入长度值"
                                        value={form.fixedLength}
                                        onChange={(event) => setForm((prev) => ({
                                            ...prev,
                                            fixedLength: event.target.value,
                                        }))}
                                    />
                                </label>
                            ) : null}

                            {form.packetRule === '长度字段' ? (
                                <>
                                    <label className="pcp-drawer-field">
                                        <span className="pcp-form-label">所占字节数：</span>
                                        <ClearableInput
                                            type="text"
                                            className="pcp-form-input"
                                            placeholder="请输入"
                                            value={form.byteCount}
                                            onChange={(event) => setForm((prev) => ({
                                                ...prev,
                                                byteCount: event.target.value,
                                            }))}
                                        />
                                    </label>
                                    <label className="pcp-drawer-field">
                                        <span className="pcp-form-label">结束位置偏移量：</span>
                                        <ClearableInput
                                            type="text"
                                            className="pcp-form-input"
                                            placeholder="请输入"
                                            value={form.endOffset}
                                            onChange={(event) => setForm((prev) => ({
                                                ...prev,
                                                endOffset: event.target.value,
                                            }))}
                                        />
                                    </label>
                                    <label className="pcp-drawer-field">
                                        <span className="pcp-form-label">后续报文的长度：</span>
                                        <ClearableInput
                                            type="text"
                                            className="pcp-form-input"
                                            placeholder="请输入"
                                            value={form.subsequentLength}
                                            onChange={(event) => setForm((prev) => ({
                                                ...prev,
                                                subsequentLength: event.target.value,
                                            }))}
                                        />
                                    </label>
                                    <label className="pcp-drawer-field">
                                        <span className="pcp-form-label">第一个字节数：</span>
                                        <ClearableInput
                                            type="text"
                                            className="pcp-form-input"
                                            placeholder="请输入"
                                            value={form.firstByteCount}
                                            onChange={(event) => setForm((prev) => ({
                                                ...prev,
                                                firstByteCount: event.target.value,
                                            }))}
                                        />
                                    </label>
                                    <div className="pcp-drawer-field">
                                        <span className="pcp-form-label">读取到长度域的值：</span>
                                        <ElSelect
                                            className="el-select--medium pcp-form-select"
                                            size="medium"
                                            value={form.lengthFieldValue}
                                            options={LENGTH_FIELD_VALUE_OPTIONS}
                                            onChange={(value) => setForm((prev) => ({
                                                ...prev,
                                                lengthFieldValue: value as NetworkServiceLengthFieldEndian | '',
                                            }))}
                                        />
                                    </div>
                                </>
                            ) : null}
                        </>
                    ) : null}

                    {isMqtt ? (
                        <>
                            <label className="pcp-drawer-field">
                                <span className="pcp-form-label"><em>*</em>集群地址：</span>
                                <ClearableInput
                                    type="text"
                                    className="pcp-form-input"
                                    placeholder="请输入地址"
                                    value={form.clusterAddress}
                                    onChange={(event) => setForm((prev) => ({
                                        ...prev,
                                        clusterAddress: event.target.value,
                                    }))}
                                />
                            </label>
                            <label className="pcp-drawer-field">
                                <span className="pcp-form-label"><em>*</em>用户名：</span>
                                <ClearableInput
                                    type="text"
                                    className="pcp-form-input"
                                    placeholder="请输入用户名"
                                    value={form.mqttUsername}
                                    onChange={(event) => setForm((prev) => ({
                                        ...prev,
                                        mqttUsername: event.target.value,
                                    }))}
                                />
                            </label>
                            <label className="pcp-drawer-field">
                                <span className="pcp-form-label"><em>*</em>密码：</span>
                                <ClearableInput
                                    type="password"
                                    className="pcp-form-input"
                                    placeholder="请输入密码"
                                    value={form.mqttPassword}
                                    onChange={(event) => setForm((prev) => ({
                                        ...prev,
                                        mqttPassword: event.target.value,
                                    }))}
                                />
                            </label>
                            <label className="pcp-drawer-field">
                                <span className="pcp-form-label"><em>*</em>消息质量：</span>
                                <ClearableInput
                                    type="text"
                                    className="pcp-form-input"
                                    placeholder="请输入时间（秒）"
                                    value={form.messageQuality}
                                    onChange={(event) => setForm((prev) => ({
                                        ...prev,
                                        messageQuality: event.target.value,
                                    }))}
                                />
                            </label>
                            <label className="pcp-drawer-field">
                                <span className="pcp-form-label">超时时间：</span>
                                <ClearableInput
                                    type="text"
                                    className="pcp-form-input"
                                    placeholder="请输入时间（秒）"
                                    value={form.timeout}
                                    onChange={(event) => setForm((prev) => ({
                                        ...prev,
                                        timeout: event.target.value,
                                    }))}
                                />
                            </label>
                            <label className="pcp-drawer-field">
                                <span className="pcp-form-label">保持心跳时间：</span>
                                <ClearableInput
                                    type="text"
                                    className="pcp-form-input"
                                    placeholder="请输入时间（秒）"
                                    value={form.keepAlive}
                                    onChange={(event) => setForm((prev) => ({
                                        ...prev,
                                        keepAlive: event.target.value,
                                    }))}
                                />
                            </label>
                        </>
                    ) : null}
                </div>

                <div className="pcp-drawer__foot">
                    <button type="button" className="pm-btn pm-btn-ghost" onClick={onClose}>取消</button>
                    <button
                        type="button"
                        className="pm-btn pm-btn-primary"
                        disabled={!canSubmit}
                        onClick={handleConfirm}
                    >
                        {mode === 'add' ? '新增' : '保存'}
                    </button>
                </div>
            </aside>
        </div>,
        document.body,
    );
}
