import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CloudUpload } from 'lucide-react';
import ElSelect from './ElSelect';
import {
    NETWORK_SERVICE_TYPE_FORM_OPTIONS,
    type NetworkServiceComponentSource,
    type NetworkServiceNetworkScope,
    type NetworkServiceRecord,
    type NetworkServiceType,
} from '../data/networkServices';
import '../product-create.css';
import '../device-create.css';
import '../protocol-management.css';

export type NetworkServiceFormValue = {
    name: string;
    componentSource: NetworkServiceComponentSource;
    serviceType: NetworkServiceType | '';
    sdkFileName: string;
    networkScope: NetworkServiceNetworkScope;
    ipAddress: string;
    port: string;
};

type NetworkServiceFormDrawerProps = {
    open: boolean;
    mode: 'add' | 'edit';
    initialValue?: NetworkServiceFormValue;
    onClose: () => void;
    onSubmit: (value: NetworkServiceFormValue) => void;
};

const EMPTY_FORM: NetworkServiceFormValue = {
    name: '',
    componentSource: '系统内置',
    serviceType: '',
    sdkFileName: '',
    networkScope: '本地网络',
    ipAddress: '',
    port: '',
};

const TYPE_OPTIONS = [
    { label: '请选择类型', value: '' },
    ...NETWORK_SERVICE_TYPE_FORM_OPTIONS.map((item) => ({
        label: item.label,
        value: item.value,
    })),
];

export function toNetworkServiceFormValue(service: NetworkServiceRecord): NetworkServiceFormValue {
    return {
        name: service.name,
        componentSource: service.componentSource,
        serviceType: service.serviceType ?? '',
        sdkFileName: service.sdkFileName ?? '',
        networkScope: service.networkScope,
        ipAddress: service.ipAddress,
        port: service.port,
    };
}

export default function NetworkServiceFormDrawer({
    open,
    mode,
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
    const canSubmit = form.name.trim()
        && (isBuiltIn ? form.serviceType !== '' : Boolean(form.sdkFileName))
        && form.ipAddress.trim().length > 0
        && form.port.trim().length > 0;

    const handleConfirm = () => {
        if (!canSubmit) return;
        onSubmit({
            name: form.name.trim(),
            componentSource: form.componentSource,
            serviceType: form.serviceType,
            sdkFileName: form.sdkFileName,
            networkScope: form.networkScope,
            ipAddress: form.ipAddress.trim(),
            port: form.port.trim(),
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
                        <input
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
                        <label className="pcp-drawer-field">
                            <span className="pcp-form-label"><em>*</em>服务类型：</span>
                            <ElSelect
                                className="el-select--medium pcp-form-select"
                                size="medium"
                                value={form.serviceType}
                                options={TYPE_OPTIONS}
                                onChange={(value) => setForm((prev) => ({
                                    ...prev,
                                    serviceType: value as NetworkServiceType | '',
                                }))}
                            />
                        </label>
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
                            <input
                                type="text"
                                className="pcp-form-input"
                                placeholder="请输入地址"
                                value={form.ipAddress}
                                onChange={(event) => setForm((prev) => ({
                                    ...prev,
                                    ipAddress: event.target.value,
                                }))}
                            />
                            <input
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
