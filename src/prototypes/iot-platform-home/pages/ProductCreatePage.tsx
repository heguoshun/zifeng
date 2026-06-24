import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Plus, Search } from 'lucide-react';
import AppShell from '../components/AppShell';
import DeviceAccessSidebar, { type DeviceAccessPageId } from '../components/DeviceAccessSidebar';
import ElSelect from '../components/ElSelect';
import ElTreeSelect from '../components/ElTreeSelect';
import { ConfirmDialog, ViewDrawer } from '../components/IotDialogs';
import IotToast, { type IotToastData, type IotToastType, triggerIotToast } from '../components/IotToast';
import {
    buildFunctionInputJson,
    buildProductModelState,
    categoryIdToLabel,
    createEmptyProductForm,
    getFunctionInputParams,
    getProductDisplayRemark,
    normalizeFunctionRow,
    productToForm,
    type EventRow,
    type FunctionRow,
    type ProductRecord,
    type PropertyRow,
} from '../data/products';
import {
    buildProductCategorySelectTree,
    DEFAULT_PRODUCT_CATEGORY_TREE_EXPANDED,
} from '../data/productCategories';
import { generateThingModelId, type ThingModelItem } from '../data/thingModels';
import type { ProductFormMode } from '../utils/productRoute';
import { navigateProductForm } from '../utils/productRoute';

export type ThingModelEntryConfig = {
    tab: 'standard' | 'manufacturer';
    scene: string;
    supplier: string;
    sectionId: string;
    sectionName: string;
};

export type ThingModelSavePayload = {
    id: string;
    name: string;
    sectionId: string;
    properties: PropertyRow[];
    functions: FunctionRow[];
    events: EventRow[];
};
import '../device-access.css';
import '../product-management.css';
import '../product-create.css';
import ClearableInput from '../components/ClearableInput';

type MainTab = 'basic' | 'model';
type ModelTab = 'property' | 'function' | 'event';

const NODE_TYPE_OPTIONS = ['直连设备', '网关设备', '网关子设备'].map((value) => ({
    label: value,
    value,
}));

const PROTOCOL_ITEMS = [
    {
        id: 'mqtt',
        name: 'MQTT',
        serviceName: 'MQTT服务',
        protocolName: 'MQTT协议',
        ipAddress: '192.220.39.02',
        protocolType: 'Local',
    },
    {
        id: 'http',
        name: 'HTTP',
        serviceName: 'HTTP服务',
        protocolName: 'HTTP协议',
        ipAddress: '192.220.39.03',
        protocolType: 'Local',
    },
    {
        id: 'coap',
        name: 'CoAP',
        serviceName: 'CoAP服务',
        protocolName: 'CoAP协议',
        ipAddress: '192.220.39.04',
        protocolType: 'Local',
    },
    {
        id: 'udp',
        name: 'UDP',
        serviceName: 'UDP服务',
        protocolName: 'UDP协议',
        ipAddress: '192.220.39.05',
        protocolType: 'Local',
    },
    {
        id: 'tcp',
        name: 'TCP',
        serviceName: 'TCP服务',
        protocolName: 'TCP协议',
        ipAddress: '192.220.39.06',
        protocolType: 'Local',
    },
    {
        id: 'websocket',
        name: 'WebSocket',
        serviceName: 'WebSocket服务',
        protocolName: 'WebSocket协议',
        ipAddress: '192.220.39.07',
        protocolType: 'Local',
    },
    {
        id: 'modbus-tcp',
        name: 'Modbus TCP',
        serviceName: 'Modbus服务',
        protocolName: 'Modbus TCP协议',
        ipAddress: '192.220.39.08',
        protocolType: 'Local',
    },
];

type ProtocolItem = typeof PROTOCOL_ITEMS[number];

const SUPPLIER_OPTIONS = [
    { label: '紫峰装备', value: '紫峰装备' },
    { label: '嘉环科技', value: '嘉环科技' },
    { label: '德力西电气', value: '德力西电气' },
    { label: '正泰电器', value: '正泰电器' },
    { label: '华为物联网', value: '华为物联网' },
];

const DATA_TYPE_OPTIONS = [
    { label: 'int', value: 'int' },
    { label: 'float', value: 'float' },
    { label: 'double', value: 'double' },
    { label: 'text', value: 'text' },
    { label: 'bool', value: 'bool' },
    { label: 'enum', value: 'enum' },
    { label: 'struct', value: 'struct' },
];

const ACCESS_MODE_OPTIONS = [
    { label: '只读', value: '只读' },
    { label: '读写', value: '读写' },
];

const EVENT_TYPE_OPTIONS = [
    { label: '信息', value: '信息' },
    { label: '告警', value: '告警' },
    { label: '故障', value: '故障' },
];

const OUTPUT_PARAM_OPTIONS = [
    { label: 'int', value: 'int' },
    { label: 'float', value: 'float' },
    { label: 'text', value: 'text' },
    { label: 'bool', value: 'bool' },
    { label: 'object(结构体)', value: 'object(结构体)' },
];

type ProductCreatePageProps = {
    mode: ProductFormMode;
    productId: string | null;
    products: ProductRecord[];
    onSaveProduct: (product: ProductRecord, saveMode: 'create' | 'edit') => void;
    onNavigateHome: () => void;
    onNavigate: (pageId: DeviceAccessPageId) => void;
    onBack: () => void;
    entry?: 'product' | 'thing-model';
    thingModelEntry?: ThingModelEntryConfig;
    thingModel?: ThingModelItem | null;
    onSaveThingModel?: (payload: ThingModelSavePayload, saveMode: 'create' | 'edit') => void;
};

const PAGE_TITLE: Record<ProductFormMode, string> = {
    create: '新增产品',
    view: '查看产品',
    edit: '编辑产品',
};

const CRUMB_SUFFIX: Record<ProductFormMode, string> = {
    create: '新增产品',
    view: '查看产品',
    edit: '编辑产品',
};

const THING_MODEL_PAGE_TITLE: Record<ProductFormMode, string> = {
    create: '创建物模型',
    view: '查看物模型',
    edit: '编辑物模型',
};

const THING_MODEL_CRUMB_SUFFIX: Record<ProductFormMode, string> = {
    create: '创建物模型',
    view: '查看物模型',
    edit: '编辑物模型',
};

function ProtocolPickerDrawer({
    open,
    selectedId,
    onClose,
    onConfirm,
}: {
    open: boolean;
    selectedId: string;
    onClose: () => void;
    onConfirm: (protocol: ProtocolItem) => void;
}) {
    const [draftKeyword, setDraftKeyword] = useState('');
    const [keyword, setKeyword] = useState('');
    const [draftSelectedId, setDraftSelectedId] = useState(selectedId);

    useEffect(() => {
        if (open) {
            setDraftSelectedId(selectedId);
            setDraftKeyword('');
            setKeyword('');
        }
    }, [open, selectedId]);

    const filteredItems = useMemo(() => {
        const normalized = keyword.trim().toLowerCase();
        if (!normalized) return PROTOCOL_ITEMS;
        return PROTOCOL_ITEMS.filter((item) => (
            item.name.toLowerCase().includes(normalized)
            || item.serviceName.toLowerCase().includes(normalized)
            || item.protocolName.toLowerCase().includes(normalized)
        ));
    }, [keyword]);

    if (!open) return null;

    return (
        <div className="pcp-drawer-mask" role="presentation" onClick={onClose}>
            <aside
                className="pcp-drawer"
                role="dialog"
                aria-modal="true"
                aria-labelledby="pcp-protocol-drawer-title"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="pcp-drawer__head">
                    <h3 id="pcp-protocol-drawer-title">网络协议</h3>
                    <button type="button" className="pcp-drawer__close" onClick={onClose} aria-label="关闭">×</button>
                </div>

                <div className="pcp-drawer__body">
                    <div className="pcp-drawer-filter">
                        <div className="pm-filter-field">
                            <span className="pm-filter-label">组件名称</span>
                            <ClearableInput
                                type="text"
                                className="pm-filter-input pcp-drawer-filter-input"
                                placeholder="请输入组件名称"
                                value={draftKeyword}
                                onChange={(event) => setDraftKeyword(event.target.value)}
                            />
                        </div>
                        <button
                            type="button"
                            className="pm-btn pm-btn-primary"
                            onClick={() => setKeyword(draftKeyword.trim())}
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
                            }}
                        >
                            重置
                        </button>
                    </div>

                    <div className="pcp-protocol-grid">
                        {filteredItems.map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                className={`pcp-protocol-card ${draftSelectedId === item.id ? 'is-selected' : ''}`}
                                onClick={() => setDraftSelectedId(item.id)}
                            >
                                <h4>{item.name}</h4>
                                <dl>
                                    <div>
                                        <dt>服务名称</dt>
                                        <dd>{item.serviceName}</dd>
                                    </div>
                                    <div>
                                        <dt>协议名称</dt>
                                        <dd>{item.protocolName}</dd>
                                    </div>
                                    <div>
                                        <dt>IP地址</dt>
                                        <dd>{item.ipAddress}</dd>
                                    </div>
                                    <div>
                                        <dt>协议类型</dt>
                                        <dd>{item.protocolType}</dd>
                                    </div>
                                </dl>
                            </button>
                        ))}
                        {filteredItems.length === 0 && (
                            <div className="pcp-protocol-empty">暂无匹配的协议组件</div>
                        )}
                    </div>

                    <div className="pm-pagination pcp-drawer-pagination">
                        <span>共 {filteredItems.length} 条记录 第 1 / 1 页</span>
                        <div className="pm-pagination__controls">
                            <button type="button" disabled>{'<'}</button>
                            <button type="button" className="is-active">1</button>
                            <button type="button" disabled>{'>'}</button>
                            <ElSelect
                                className="el-select--compact"
                                value="10"
                                options={[
                                    { label: '10条/页', value: '10' },
                                    { label: '20条/页', value: '20' },
                                ]}
                                onChange={() => undefined}
                                dropdownAlign="right"
                            />
                            <label className="pm-pagination__jump">
                                跳至
                                <input type="text" defaultValue="1" readOnly />
                                页
                            </label>
                        </div>
                    </div>
                </div>

                <div className="pcp-drawer__foot">
                    <button
                        type="button"
                        className="pm-btn pm-btn-primary"
                        disabled={!draftSelectedId}
                        onClick={() => {
                            const selected = PROTOCOL_ITEMS.find((item) => item.id === draftSelectedId);
                            if (!selected) return;
                            onConfirm(selected);
                            onClose();
                        }}
                    >
                        确定
                    </button>
                    <button type="button" className="pm-btn pm-btn-ghost" onClick={onClose}>取消</button>
                </div>
            </aside>
        </div>
    );
}

function ModelFormDrawer({
    title,
    open,
    onClose,
    children,
    onConfirm,
    confirmDisabled = false,
}: {
    title: string;
    open: boolean;
    onClose: () => void;
    children: React.ReactNode;
    onConfirm: () => void;
    confirmDisabled?: boolean;
}) {
    if (!open) return null;

    return (
        <div className="pcp-drawer-mask" role="presentation" onClick={onClose}>
            <aside
                className="pcp-drawer pcp-drawer--form"
                role="dialog"
                aria-modal="true"
                aria-labelledby="pcp-model-drawer-title"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="pcp-drawer__head">
                    <h3 id="pcp-model-drawer-title">{title}</h3>
                    <button type="button" className="pcp-drawer__close" onClick={onClose} aria-label="关闭">×</button>
                </div>
                <div className="pcp-drawer__body pcp-drawer__body--form">{children}</div>
                <div className="pcp-drawer__foot">
                    <button type="button" className="pm-btn pm-btn-ghost" onClick={onClose}>取消</button>
                    <button
                        type="button"
                        className="pm-btn pm-btn-primary"
                        disabled={confirmDisabled}
                        onClick={onConfirm}
                    >
                        确定
                    </button>
                </div>
            </aside>
        </div>
    );
}

function parseJsonParams(jsonObject: string): string[] {
    const matches = jsonObject.match(/"([^"]+)":/g);
    return matches?.map((match) => match.replace(/"/g, '').replace(':', '')) ?? [];
}

function formatFunctionParamLabel(key: string, inputJson: string): string {
    try {
        const parsed = JSON.parse(inputJson) as Record<string, unknown>;
        if (Object.prototype.hasOwnProperty.call(parsed, key)) {
            return `${key} = ${JSON.stringify(parsed[key])}`;
        }
    } catch {
        // ignore invalid json
    }
    return key;
}

function PropertyDrawer({
    open,
    mode,
    initialRow,
    onClose,
    onConfirm,
}: {
    open: boolean;
    mode: 'add' | 'edit';
    initialRow?: PropertyRow;
    onClose: () => void;
    onConfirm: (row: Omit<PropertyRow, 'id'>, id?: string) => void;
}) {
    const [form, setForm] = useState({
        identifier: '',
        name: '',
        dataType: '',
        accessMode: '',
        description: '',
    });

    useEffect(() => {
        if (!open) return;
        if (mode === 'edit' && initialRow) {
            setForm({
                identifier: initialRow.identifier,
                name: initialRow.name,
                dataType: initialRow.dataType,
                accessMode: initialRow.accessMode,
                description: initialRow.description === '—' ? '' : initialRow.description,
            });
            return;
        }
        setForm({
            identifier: '',
            name: '',
            dataType: '',
            accessMode: '',
            description: '',
        });
    }, [open, mode, initialRow]);

    const isValid = form.identifier.trim() && form.name.trim() && form.dataType && form.accessMode;

    return (
        <ModelFormDrawer
            title={mode === 'add' ? '新增属性' : '编辑属性'}
            open={open}
            onClose={onClose}
            confirmDisabled={!isValid}
            onConfirm={() => {
                if (!isValid) return;
                onConfirm({
                    identifier: form.identifier.trim(),
                    name: form.name.trim(),
                    dataType: form.dataType,
                    accessMode: form.accessMode,
                    description: form.description.trim() || '—',
                }, mode === 'edit' ? initialRow?.id : undefined);
                onClose();
            }}
        >
            <label className="pcp-drawer-field">
                <span className="pcp-form-label"><em>*</em>属性标识</span>
                <ClearableInput
                    type="text"
                    className="pcp-form-input"
                    placeholder="请输入属性标识"
                    value={form.identifier}
                    onChange={(event) => setForm((prev) => ({ ...prev, identifier: event.target.value }))}
                />
            </label>
            <label className="pcp-drawer-field">
                <span className="pcp-form-label"><em>*</em>属性名称</span>
                <ClearableInput
                    type="text"
                    className="pcp-form-input"
                    placeholder="请输入属性名称"
                    value={form.name}
                    onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                />
            </label>
            <div className="pcp-drawer-field">
                <span className="pcp-form-label"><em>*</em>数据类型</span>
                <ElSelect
                    className="el-select--medium pcp-form-select"
                    size="medium"
                    value={form.dataType}
                    options={[{ label: '请选择数据类型', value: '' }, ...DATA_TYPE_OPTIONS]}
                    onChange={(value) => setForm((prev) => ({ ...prev, dataType: value }))}
                />
            </div>
            <div className="pcp-drawer-field">
                <span className="pcp-form-label"><em>*</em>读写类型</span>
                <ElSelect
                    className="el-select--medium pcp-form-select"
                    size="medium"
                    value={form.accessMode}
                    options={[{ label: '请选择读写类型', value: '' }, ...ACCESS_MODE_OPTIONS]}
                    onChange={(value) => setForm((prev) => ({ ...prev, accessMode: value }))}
                />
            </div>
            <label className="pcp-drawer-field">
                <span className="pcp-form-label">说明</span>
                <textarea
                    className="pcp-form-textarea"
                    placeholder="请输入说明"
                    rows={4}
                    value={form.description}
                    onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                />
            </label>
        </ModelFormDrawer>
    );
}

function FunctionDrawer({
    open,
    mode,
    initialRow,
    onClose,
    onConfirm,
}: {
    open: boolean;
    mode: 'add' | 'edit';
    initialRow?: FunctionRow;
    onClose: () => void;
    onConfirm: (row: Omit<FunctionRow, 'id'>, id?: string) => void;
}) {
    const [form, setForm] = useState({
        identifier: '',
        name: '',
        async: '否',
        outputParam: '',
        description: '',
    });
    const [inputParams, setInputParams] = useState<string[]>([]);
    const [sourceInputJson, setSourceInputJson] = useState('{}');

    useEffect(() => {
        if (!open) return;
        if (mode === 'edit' && initialRow) {
            const normalized = normalizeFunctionRow(initialRow);
            setForm({
                identifier: normalized.identifier,
                name: normalized.name,
                async: normalized.async,
                outputParam: '',
                description: normalized.description === '—' ? '' : normalized.description,
            });
            setSourceInputJson(normalized.inputJson);
            setInputParams(getFunctionInputParams(normalized));
            return;
        }
        setForm({
            identifier: '',
            name: '',
            async: '否',
            outputParam: '',
            description: '',
        });
        setSourceInputJson('{}');
        setInputParams([]);
    }, [open, mode, initialRow]);

    const isValid = form.identifier.trim() && form.name.trim();

    return (
        <ModelFormDrawer
            title={mode === 'add' ? '新增功能' : '编辑功能'}
            open={open}
            onClose={onClose}
            confirmDisabled={!isValid}
            onConfirm={() => {
                if (!isValid) return;
                onConfirm({
                    identifier: form.identifier.trim(),
                    name: form.name.trim(),
                    async: form.async,
                    description: form.description.trim() || '—',
                    inputJson: buildFunctionInputJson(
                        inputParams,
                        sourceInputJson,
                    ),
                }, mode === 'edit' ? initialRow?.id : undefined);
                onClose();
            }}
        >
            <label className="pcp-drawer-field">
                <span className="pcp-form-label"><em>*</em>功能标识</span>
                <ClearableInput
                    type="text"
                    className="pcp-form-input"
                    placeholder="请输入功能标识"
                    value={form.identifier}
                    onChange={(event) => setForm((prev) => ({ ...prev, identifier: event.target.value }))}
                />
            </label>
            <label className="pcp-drawer-field">
                <span className="pcp-form-label"><em>*</em>功能名称</span>
                <ClearableInput
                    type="text"
                    className="pcp-form-input"
                    placeholder="请输入功能名称"
                    value={form.name}
                    onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                />
            </label>
            <div className="pcp-drawer-field">
                <span className="pcp-form-label">是否异步</span>
                <div className="pcp-radio-group">
                    {['是', '否'].map((option) => (
                        <label key={option} className="pcp-radio">
                            <input
                                type="radio"
                                name="function-async"
                                checked={form.async === option}
                                onChange={() => setForm((prev) => ({ ...prev, async: option }))}
                            />
                            <span>{option}</span>
                        </label>
                    ))}
                </div>
            </div>
            <div className="pcp-drawer-field">
                <span className="pcp-form-label">输入参数</span>
                <div className="pcp-param-panel">
                    {inputParams.map((param, index) => (
                        <div key={`${param}-${index}`} className="pcp-param-item">
                            <span>{formatFunctionParamLabel(param, sourceInputJson)}</span>
                            <button
                                type="button"
                                onClick={() => setInputParams((prev) => prev.filter((_, i) => i !== index))}
                            >
                                删除
                            </button>
                        </div>
                    ))}
                    <button
                        type="button"
                        className="pcp-add-param-btn"
                        onClick={() => setInputParams((prev) => [...prev, `param_${prev.length + 1}`])}
                    >
                        + 添加参数
                    </button>
                </div>
            </div>
            <div className="pcp-drawer-field">
                <span className="pcp-form-label">输出参数</span>
                <ElSelect
                    className="el-select--medium pcp-form-select"
                    size="medium"
                    value={form.outputParam}
                    options={[{ label: '请选择数据类型', value: '' }, ...OUTPUT_PARAM_OPTIONS]}
                    onChange={(value) => setForm((prev) => ({ ...prev, outputParam: value }))}
                />
            </div>
            <label className="pcp-drawer-field">
                <span className="pcp-form-label">说明</span>
                <textarea
                    className="pcp-form-textarea"
                    placeholder="请输入说明"
                    rows={4}
                    value={form.description}
                    onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                />
            </label>
        </ModelFormDrawer>
    );
}

function buildJsonObject(params: string[]): string {
    if (!params.length) return '{ }';
    const body = params.map((param) => `"${param}": ""`).join(', ');
    return `{ ${body} }`;
}

function EventDrawer({
    open,
    mode,
    initialRow,
    onClose,
    onConfirm,
}: {
    open: boolean;
    mode: 'add' | 'edit';
    initialRow?: EventRow;
    onClose: () => void;
    onConfirm: (row: Omit<EventRow, 'id'>, id?: string) => void;
}) {
    const [form, setForm] = useState({
        identifier: '',
        name: '',
        eventType: '',
        outputParam: 'object(结构体)',
        description: '',
    });
    const [jsonParams, setJsonParams] = useState<string[]>([]);

    useEffect(() => {
        if (!open) return;
        if (mode === 'edit' && initialRow) {
            setForm({
                identifier: initialRow.identifier,
                name: initialRow.name,
                eventType: initialRow.eventType,
                outputParam: 'object(结构体)',
                description: initialRow.description === '—' ? '' : initialRow.description,
            });
            setJsonParams(parseJsonParams(initialRow.jsonObject));
            return;
        }
        setForm({
            identifier: '',
            name: '',
            eventType: '',
            outputParam: 'object(结构体)',
            description: '',
        });
        setJsonParams([]);
    }, [open, mode, initialRow]);

    const isValid = form.identifier.trim() && form.name.trim() && form.eventType;

    return (
        <ModelFormDrawer
            title={mode === 'add' ? '新增事件' : '编辑事件'}
            open={open}
            onClose={onClose}
            confirmDisabled={!isValid}
            onConfirm={() => {
                if (!isValid) return;
                onConfirm({
                    identifier: form.identifier.trim(),
                    name: form.name.trim(),
                    eventType: form.eventType,
                    jsonObject: buildJsonObject(jsonParams),
                    description: form.description.trim() || '—',
                }, mode === 'edit' ? initialRow?.id : undefined);
                onClose();
            }}
        >
            <label className="pcp-drawer-field">
                <span className="pcp-form-label"><em>*</em>事件标识</span>
                <ClearableInput
                    type="text"
                    className="pcp-form-input"
                    placeholder="请输入事件标识"
                    value={form.identifier}
                    onChange={(event) => setForm((prev) => ({ ...prev, identifier: event.target.value }))}
                />
            </label>
            <label className="pcp-drawer-field">
                <span className="pcp-form-label"><em>*</em>事件名称</span>
                <ClearableInput
                    type="text"
                    className="pcp-form-input"
                    placeholder="请输入事件名称"
                    value={form.name}
                    onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                />
            </label>
            <div className="pcp-drawer-field">
                <span className="pcp-form-label"><em>*</em>事件类型</span>
                <ElSelect
                    className="el-select--medium pcp-form-select"
                    size="medium"
                    value={form.eventType}
                    options={[{ label: '请选择事件类型', value: '' }, ...EVENT_TYPE_OPTIONS]}
                    onChange={(value) => setForm((prev) => ({ ...prev, eventType: value }))}
                />
            </div>
            <div className="pcp-drawer-field">
                <span className="pcp-form-label">输出参数</span>
                <ElSelect
                    className="el-select--medium pcp-form-select"
                    size="medium"
                    value={form.outputParam}
                    options={OUTPUT_PARAM_OPTIONS}
                    onChange={(value) => setForm((prev) => ({ ...prev, outputParam: value }))}
                />
            </div>
            <div className="pcp-drawer-field">
                <span className="pcp-form-label">JSON对象</span>
                <div className="pcp-param-panel">
                    {jsonParams.map((param, index) => (
                        <div key={`${param}-${index}`} className="pcp-param-item">
                            <span>{param}</span>
                            <button
                                type="button"
                                onClick={() => setJsonParams((prev) => prev.filter((_, i) => i !== index))}
                            >
                                删除
                            </button>
                        </div>
                    ))}
                    <button
                        type="button"
                        className="pcp-add-param-btn"
                        onClick={() => setJsonParams((prev) => [...prev, `field_${prev.length + 1}`])}
                    >
                        + 添加参数
                    </button>
                </div>
            </div>
            <label className="pcp-drawer-field">
                <span className="pcp-form-label">说明</span>
                <textarea
                    className="pcp-form-textarea"
                    placeholder="请输入说明"
                    rows={4}
                    value={form.description}
                    onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                />
            </label>
        </ModelFormDrawer>
    );
}

function ModelTableToolbar({
    keyword,
    onKeywordChange,
    onSearch,
    onAdd,
    onViewModel,
    readonly = false,
}: {
    keyword: string;
    onKeywordChange: (value: string) => void;
    onSearch: () => void;
    onAdd: () => void;
    onViewModel: () => void;
    readonly?: boolean;
}) {
    return (
        <div className="pcp-model-toolbar">
            <div className="pcp-model-search">
                <ClearableInput
                    type="text"
                    className="pcp-form-input"
                    placeholder="请输入关键字进行搜索"
                    value={keyword}
                    onChange={(event) => onKeywordChange(event.target.value)}
                />
                <button type="button" className="pm-btn pm-btn-primary" onClick={onSearch}>
                    <Search size={14} />
                    查询
                </button>
            </div>
            <div className="pcp-model-actions">
                {!readonly && (
                    <>
                        <button type="button" className="pm-btn pm-btn-primary" onClick={onAdd}>新增</button>
                        <button type="button" className="pm-btn pm-btn-ghost">导入</button>
                    </>
                )}
                <button type="button" className="pm-btn pm-btn-ghost" onClick={onViewModel}>查看物模型</button>
            </div>
        </div>
    );
}

function filterByKeyword<T extends { identifier: string; name: string; description: string }>(
    rows: T[],
    keyword: string,
): T[] {
    const normalized = keyword.trim().toLowerCase();
    if (!normalized) return rows;
    return rows.filter((row) => (
        row.identifier.toLowerCase().includes(normalized)
        || row.name.toLowerCase().includes(normalized)
        || row.description.toLowerCase().includes(normalized)
    ));
}

export default function ProductCreatePage({
    mode,
    productId,
    products,
    onSaveProduct,
    onNavigateHome,
    onNavigate,
    onBack,
    entry = 'product',
    thingModelEntry,
    thingModel = null,
    onSaveThingModel,
}: ProductCreatePageProps) {
    const isThingModelEntry = entry === 'thing-model';
    const readonly = mode === 'view';
    const resolvedProduct = !isThingModelEntry && mode !== 'create' && productId
        ? products.find((item) => item.id === productId) ?? null
        : null;
    const existingProduct = resolvedProduct;
    const existingThingModel = isThingModelEntry && mode !== 'create' ? thingModel : null;
    const initialProductState = resolvedProduct ? buildProductModelState(resolvedProduct) : null;

    const [mainTab, setMainTab] = useState<MainTab>('basic');
    const [modelTab, setModelTab] = useState<ModelTab>('property');
    const [draftKeyword, setDraftKeyword] = useState('');
    const [keyword, setKeyword] = useState('');
    const [protocolDrawerOpen, setProtocolDrawerOpen] = useState(false);
    const [propertyDrawer, setPropertyDrawer] = useState<{ mode: 'add' | 'edit'; row?: PropertyRow } | null>(null);
    const [functionDrawer, setFunctionDrawer] = useState<{ mode: 'add' | 'edit'; row?: FunctionRow } | null>(null);
    const [eventDrawer, setEventDrawer] = useState<{ mode: 'add' | 'edit'; row?: EventRow } | null>(null);
    const [viewProperty, setViewProperty] = useState<PropertyRow | null>(null);
    const [viewFunction, setViewFunction] = useState<FunctionRow | null>(null);
    const [viewEvent, setViewEvent] = useState<EventRow | null>(null);
    const [deleteProperty, setDeleteProperty] = useState<PropertyRow | null>(null);
    const [deleteFunction, setDeleteFunction] = useState<FunctionRow | null>(null);
    const [deleteEvent, setDeleteEvent] = useState<EventRow | null>(null);
    const [modelPreviewOpen, setModelPreviewOpen] = useState(false);
    const [toast, setToast] = useState<IotToastData | null>(null);

    const [properties, setProperties] = useState<PropertyRow[]>(
        () => initialProductState?.properties ?? [],
    );
    const [functions, setFunctions] = useState<FunctionRow[]>(
        () => initialProductState?.functions ?? [],
    );
    const [events, setEvents] = useState<EventRow[]>(
        () => initialProductState?.events ?? [],
    );

    const [form, setForm] = useState(
        () => initialProductState?.form ?? createEmptyProductForm(),
    );

    useEffect(() => {
        if (mode === 'create') {
            setForm(createEmptyProductForm());
            setProperties([]);
            setFunctions([]);
            setEvents([]);
            setMainTab('basic');
            setModelTab('property');
            setDraftKeyword('');
            setKeyword('');
            return;
        }

        if (isThingModelEntry) {
            if (!existingThingModel) {
                onBack();
                return;
            }

            setForm({
                ...createEmptyProductForm(),
                name: existingThingModel.name,
                vendor: thingModelEntry?.supplier ?? '',
            });
            setProperties([]);
            setFunctions([]);
            setEvents([]);
            setMainTab('basic');
            setModelTab('property');
            setDraftKeyword('');
            setKeyword('');
            return;
        }

        if (!productId) {
            return;
        }

        const product = products.find((item) => item.id === productId);
        if (!product) {
            return;
        }

        const nextState = buildProductModelState(product);
        setForm(nextState.form);
        setProperties(nextState.properties);
        setFunctions(nextState.functions);
        setEvents(nextState.events);
        setMainTab('basic');
        setModelTab('property');
        setDraftKeyword('');
        setKeyword('');
    }, [mode, productId, products, isThingModelEntry, existingThingModel, thingModelEntry]);

    const filteredProperties = useMemo(
        () => filterByKeyword(properties, keyword),
        [properties, keyword],
    );
    const filteredFunctions = useMemo(
        () => filterByKeyword(functions, keyword),
        [functions, keyword],
    );
    const filteredEvents = useMemo(
        () => filterByKeyword(events, keyword),
        [events, keyword],
    );

    const productCategoryTree = useMemo(() => buildProductCategorySelectTree(), []);

    const handleModelAdd = () => {
        if (modelTab === 'property') setPropertyDrawer({ mode: 'add' });
        if (modelTab === 'function') setFunctionDrawer({ mode: 'add' });
        if (modelTab === 'event') setEventDrawer({ mode: 'add' });
    };

    const modelPreviewText = useMemo(() => JSON.stringify({
        properties: properties.map(({ identifier, name, dataType, accessMode }) => ({
            identifier, name, dataType, accessMode,
        })),
        functions: functions.map(({ identifier, name, async: isAsync, inputJson }) => ({
            identifier, name, async: isAsync, inputJson,
        })),
        events: events.map(({ identifier, name, eventType, jsonObject }) => ({
            identifier, name, eventType, jsonObject,
        })),
    }, null, 2), [properties, functions, events]);

    const showToast = (message: string, type: IotToastType = 'warning') => {
        triggerIotToast(setToast, message, type);
    };

    const handleSave = () => {
        if (readonly) return;

        if (!form.name.trim()) {
            showToast('请输入产品名称');
            setMainTab('basic');
            return;
        }
        if (!form.nodeType) {
            showToast('请选择节点类型');
            setMainTab('basic');
            return;
        }
        if (!form.categoryId) {
            showToast('请选择产品分类');
            setMainTab('basic');
            return;
        }
        if (!form.protocolId) {
            showToast('请选择网络协议');
            setMainTab('basic');
            return;
        }

        if (isThingModelEntry) {
            if (!onSaveThingModel || !thingModelEntry) return;

            const payload: ThingModelSavePayload = {
                id: mode === 'edit' && existingThingModel
                    ? existingThingModel.id
                    : generateThingModelId(),
                name: form.name.trim(),
                sectionId: thingModelEntry.sectionId,
                properties,
                functions,
                events,
            };

            onSaveThingModel(payload, mode === 'edit' ? 'edit' : 'create');
            showToast(
                mode === 'edit' ? '物模型保存成功' : `物模型「${payload.name}」创建成功`,
                'success',
            );
            window.setTimeout(() => onBack(), 1200);
            return;
        }

        if (mode === 'edit' && existingProduct) {
            onSaveProduct({
                ...existingProduct,
                name: form.name.trim(),
                categoryId: form.categoryId,
                category: categoryIdToLabel(form.categoryId),
                nodeType: form.nodeType,
                vendor: form.vendor.trim() || '—',
                remark: form.remark.trim() || '—',
                protocolId: form.protocolId,
                protocolLabel: form.protocolLabel,
                properties,
                functions,
                events,
            }, 'edit');
            showToast('产品保存成功', 'success');
            window.setTimeout(() => onBack(), 1200);
            return;
        }

        const code = `P${String(Math.floor(100000 + Math.random() * 900000))}`;
        onSaveProduct({
            id: `prod-${Date.now()}`,
            code,
            name: form.name.trim(),
            categoryId: form.categoryId,
            category: categoryIdToLabel(form.categoryId),
            nodeType: form.nodeType,
            vendor: form.vendor.trim() || '—',
            remark: form.remark.trim() || '—',
            protocolId: form.protocolId,
            protocolLabel: form.protocolLabel,
            deviceCount: 0,
            properties,
            functions,
            events,
        }, 'create');
        showToast(`产品保存成功，编号 ${code}`, 'success');
        window.setTimeout(() => onBack(), 1200);
    };

    if (isThingModelEntry) {
        if (mode !== 'create' && !existingThingModel) return null;
        if (mode === 'create' && !thingModelEntry) return null;
    } else if (mode !== 'create' && productId && !existingProduct) {
        return null;
    }

    const pageTitle = isThingModelEntry ? THING_MODEL_PAGE_TITLE[mode] : PAGE_TITLE[mode];
    const crumbSuffix = isThingModelEntry ? THING_MODEL_CRUMB_SUFFIX[mode] : CRUMB_SUFFIX[mode];
    const crumbPrefix = isThingModelEntry
        ? '设备接入 / 产品开发 / 物模型库'
        : '设备接入 / 产品开发 / 产品管理';

    const sidebar = (
        <DeviceAccessSidebar
            pageId={
                isThingModelEntry
                    ? 'model-library'
                    : mode === 'edit'
                        ? 'product-edit'
                        : mode === 'view'
                            ? 'product-view'
                            : 'product-create'
            }
            onNavigate={onNavigate}
        />
    );

    return (
        <AppShell
            activeTopTab="设备接入"
            sidebar={sidebar}
            onTopTabChange={(tab) => {
                if (tab === '设备接入') onNavigate('home');
            }}
        >
            <div className="pcp-page">
                <div className="crumb">{crumbPrefix} / {crumbSuffix}</div>

                <div className="pcp-head">
                    <button
                        type="button"
                        className="pcp-back-btn"
                        onClick={onBack}
                        aria-label="返回"
                    >
                        <ArrowLeft size={16} />
                    </button>
                    <h2 className="pcp-title">{pageTitle}</h2>
                </div>

                <section className="panel pcp-panel">
                    <div className="pcp-main-tabs">
                        <button
                            type="button"
                            className={mainTab === 'basic' ? 'is-active' : ''}
                            onClick={() => setMainTab('basic')}
                        >
                            基本信息
                        </button>
                        <button
                            type="button"
                            className={mainTab === 'model' ? 'is-active' : ''}
                            onClick={() => setMainTab('model')}
                        >
                            产品物模型
                        </button>
                    </div>

                    {mainTab === 'basic' ? (
                        <div className="pcp-basic-body">
                            <div className="pcp-form-grid">
                                <label className="pcp-form-field">
                                    <span className="pcp-form-label"><em>*</em>产品名称</span>
                                    <ClearableInput
                                        type="text"
                                        className={`pcp-form-input ${readonly ? 'is-readonly' : ''}`.trim()}
                                        placeholder="请输入产品名称"
                                        value={form.name}
                                        readOnly={readonly}
                                        onChange={(event) => setForm((prev) => ({
                                            ...prev,
                                            name: event.target.value,
                                        }))}
                                    />
                                </label>
                                <div className="pcp-form-field">
                                    <span className="pcp-form-label"><em>*</em>节点类型</span>
                                    {readonly ? (
                                        <input
                                            type="text"
                                            className="pcp-form-input is-readonly"
                                            value={form.nodeType}
                                            readOnly
                                        />
                                    ) : (
                                        <ElSelect
                                            className="el-select--medium pcp-form-select"
                                            size="medium"
                                            value={form.nodeType}
                                            disabled={readonly}
                                            options={[{ label: '请选择', value: '' }, ...NODE_TYPE_OPTIONS]}
                                            onChange={(value) => setForm((prev) => ({ ...prev, nodeType: value }))}
                                        />
                                    )}
                                </div>
                                <div className="pcp-form-field">
                                    <span className="pcp-form-label"><em>*</em>产品分类</span>
                                    {readonly ? (
                                        <input
                                            type="text"
                                            className="pcp-form-input is-readonly"
                                            value={categoryIdToLabel(form.categoryId)}
                                            readOnly
                                        />
                                    ) : (
                                        <ElTreeSelect
                                            className="el-select--medium pcp-form-select pcp-category-tree-select"
                                            size="medium"
                                            value={form.categoryId}
                                            tree={productCategoryTree}
                                            placeholder="请选择"
                                            showAllOption={false}
                                            defaultExpanded={DEFAULT_PRODUCT_CATEGORY_TREE_EXPANDED}
                                            onChange={(value) => setForm((prev) => ({ ...prev, categoryId: value }))}
                                        />
                                    )}
                                </div>

                                <label className="pcp-form-field">
                                    <span className="pcp-form-label"><em>*</em>网络协议</span>
                                    <div className="pcp-protocol-group">
                                        <input
                                            type="text"
                                            className="pcp-form-input is-readonly pcp-protocol-display"
                                            placeholder="请选择"
                                            value={form.protocolLabel}
                                            readOnly
                                        />
                                        {!readonly && (
                                            <button
                                                type="button"
                                                className="pm-btn pm-btn-ghost pcp-protocol-btn"
                                                onClick={() => setProtocolDrawerOpen(true)}
                                            >
                                                选择
                                            </button>
                                        )}
                                    </div>
                                </label>
                                {isThingModelEntry && thingModelEntry?.tab === 'standard' && (
                                    <label className="pcp-form-field">
                                        <span className="pcp-form-label">场景</span>
                                        <input
                                            type="text"
                                            className="pcp-form-input is-readonly"
                                            value={thingModelEntry.scene}
                                            readOnly
                                        />
                                    </label>
                                )}
                                {isThingModelEntry && thingModelEntry?.tab === 'manufacturer' && (
                                    <label className="pcp-form-field">
                                        <span className="pcp-form-label">供应商</span>
                                        <input
                                            type="text"
                                            className="pcp-form-input is-readonly"
                                            value={thingModelEntry.supplier}
                                            readOnly
                                        />
                                    </label>
                                )}
                                {!isThingModelEntry && (
                                    <div className="pcp-form-field">
                                        <span className="pcp-form-label">供应商</span>
                                        {readonly ? (
                                            <input
                                                type="text"
                                                className="pcp-form-input is-readonly"
                                                value={form.vendor || '紫峰装备'}
                                                readOnly
                                            />
                                        ) : (
                                            <ElSelect
                                                className="el-select--medium pcp-form-select"
                                                size="medium"
                                                value={form.vendor}
                                                disabled={readonly}
                                                options={[{ label: '请选择', value: '' }, ...SUPPLIER_OPTIONS]}
                                                onChange={(value) => setForm((prev) => ({ ...prev, vendor: value }))}
                                            />
                                        )}
                                    </div>
                                )}
                                {!isThingModelEntry && (
                                    <label className="pcp-form-field">
                                        <span className="pcp-form-label">关联设备数</span>
                                        <input
                                            type="text"
                                            className="pcp-form-input is-readonly"
                                            value={String(existingProduct?.deviceCount ?? 0)}
                                            readOnly
                                        />
                                    </label>
                                )}

                                <label className="pcp-form-field pcp-form-field--span-2">
                                    <span className="pcp-form-label">备注</span>
                                    <textarea
                                        className={`pcp-form-textarea ${readonly ? 'is-readonly' : ''}`.trim()}
                                        placeholder="请输入内容"
                                        rows={4}
                                        value={readonly && existingProduct
                                            ? getProductDisplayRemark(existingProduct)
                                            : form.remark}
                                        readOnly={readonly}
                                        onChange={(event) => setForm((prev) => ({
                                            ...prev,
                                            remark: event.target.value,
                                        }))}
                                    />
                                </label>
                                <div className="pcp-form-field">
                                    <span className="pcp-form-label">{isThingModelEntry ? '产品图标' : '产品图片'}</span>
                                    <div className="pcp-upload-wrap">
                                        <button
                                            type="button"
                                            className={`pcp-upload-box ${readonly ? 'is-readonly' : ''}`.trim()}
                                            aria-label={isThingModelEntry ? '上传产品图标' : '上传产品图片'}
                                            disabled={readonly}
                                        >
                                            <Plus size={22} />
                                            <span>上传</span>
                                        </button>
                                        <p className="pcp-upload-tip">
                                            {isThingModelEntry
                                                ? '仅支持PNG、JPG格式图片'
                                                : (
                                                    <>
                                                        仅支持.png、.jpg、.jpeg格式
                                                        <br />
                                                        大小不超过15M
                                                    </>
                                                )}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="pcp-model-body">
                            <div className="pcp-model-tabs">
                                <button
                                    type="button"
                                    className={modelTab === 'property' ? 'is-active' : ''}
                                    onClick={() => setModelTab('property')}
                                >
                                    属性定义
                                </button>
                                <button
                                    type="button"
                                    className={modelTab === 'function' ? 'is-active' : ''}
                                    onClick={() => setModelTab('function')}
                                >
                                    功能定义
                                </button>
                                <button
                                    type="button"
                                    className={modelTab === 'event' ? 'is-active' : ''}
                                    onClick={() => setModelTab('event')}
                                >
                                    事件定义
                                </button>
                            </div>

                            <ModelTableToolbar
                                keyword={draftKeyword}
                                onKeywordChange={setDraftKeyword}
                                onSearch={() => setKeyword(draftKeyword.trim())}
                                onAdd={handleModelAdd}
                                onViewModel={() => setModelPreviewOpen(true)}
                                readonly={readonly}
                            />

                            <div className="pcp-table-wrap">
                                {modelTab === 'property' && (
                                    <table className="pcp-table">
                                        <thead>
                                            <tr>
                                                <th>序号</th>
                                                <th>标识</th>
                                                <th>名称</th>
                                                <th>数据类型</th>
                                                <th>读写类型</th>
                                                <th>说明</th>
                                                <th>操作</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredProperties.map((row, index) => (
                                                <tr key={row.id}>
                                                    <td>{index + 1}</td>
                                                    <td>{row.identifier}</td>
                                                    <td>{row.name}</td>
                                                    <td>{row.dataType}</td>
                                                    <td>{row.accessMode}</td>
                                                    <td className="pcp-desc-cell">{row.description}</td>
                                                    <td>
                                                        <div className="pcp-row-actions">
                                                            <button type="button" onClick={() => setViewProperty(row)}>查看</button>
                                                            {!readonly && (
                                                                <>
                                                                    <button type="button" onClick={() => setPropertyDrawer({ mode: 'edit', row })}>编辑</button>
                                                                    <button type="button" onClick={() => setDeleteProperty(row)}>删除</button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {!filteredProperties.length && (
                                                <tr>
                                                    <td colSpan={7} className="pcp-empty-cell">暂无属性定义</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                )}

                                {modelTab === 'function' && (
                                    <table className="pcp-table">
                                        <thead>
                                            <tr>
                                                <th>序号</th>
                                                <th>功能标识</th>
                                                <th>功能名称</th>
                                                <th>是否异步</th>
                                                <th>输入参数</th>
                                                <th>说明</th>
                                                <th>操作</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredFunctions.map((row, index) => (
                                                <tr key={row.id}>
                                                    <td>{index + 1}</td>
                                                    <td>{row.identifier}</td>
                                                    <td>{row.name}</td>
                                                    <td>{row.async}</td>
                                                    <td className="pcp-json-cell">{normalizeFunctionRow(row).inputJson}</td>
                                                    <td className="pcp-desc-cell">{row.description}</td>
                                                    <td>
                                                        <div className="pcp-row-actions">
                                                            <button type="button" onClick={() => setViewFunction(row)}>查看</button>
                                                            {!readonly && (
                                                                <>
                                                                    <button type="button" onClick={() => setFunctionDrawer({ mode: 'edit', row })}>编辑</button>
                                                                    <button type="button" onClick={() => setDeleteFunction(row)}>删除</button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {!filteredFunctions.length && (
                                                <tr>
                                                    <td colSpan={7} className="pcp-empty-cell">暂无功能定义</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                )}

                                {modelTab === 'event' && (
                                    <table className="pcp-table">
                                        <thead>
                                            <tr>
                                                <th>序号</th>
                                                <th>事件标识</th>
                                                <th>事件名称</th>
                                                <th>事件类型</th>
                                                <th>JSON对象</th>
                                                <th>说明</th>
                                                <th>操作</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredEvents.map((row, index) => (
                                                <tr key={row.id}>
                                                    <td>{index + 1}</td>
                                                    <td>{row.identifier}</td>
                                                    <td>{row.name}</td>
                                                    <td>{row.eventType}</td>
                                                    <td className="pcp-json-cell">{row.jsonObject}</td>
                                                    <td className="pcp-desc-cell">{row.description}</td>
                                                    <td>
                                                        <div className="pcp-row-actions">
                                                            <button type="button" onClick={() => setViewEvent(row)}>查看</button>
                                                            {!readonly && (
                                                                <>
                                                                    <button type="button" onClick={() => setEventDrawer({ mode: 'edit', row })}>编辑</button>
                                                                    <button type="button" onClick={() => setDeleteEvent(row)}>删除</button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {!filteredEvents.length && (
                                                <tr>
                                                    <td colSpan={7} className="pcp-empty-cell">暂无事件定义</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="pcp-footer">
                        {readonly ? (
                            <>
                                <button
                                    type="button"
                                    className="pm-btn pm-btn-primary pcp-save-btn"
                                    onClick={() => {
                                        if (productId) {
                                            navigateProductForm('edit', productId);
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
                                <button type="button" className="pm-btn pm-btn-primary pcp-save-btn" onClick={handleSave}>
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

            <ProtocolPickerDrawer
                open={protocolDrawerOpen}
                selectedId={form.protocolId}
                onClose={() => setProtocolDrawerOpen(false)}
                onConfirm={(protocol) => setForm((prev) => ({
                    ...prev,
                    protocolId: protocol.id,
                    protocolLabel: protocol.name,
                }))}
            />

            <PropertyDrawer
                open={Boolean(propertyDrawer)}
                mode={propertyDrawer?.mode ?? 'add'}
                initialRow={propertyDrawer?.row}
                onClose={() => setPropertyDrawer(null)}
                onConfirm={(row, id) => {
                    if (id) {
                        setProperties((prev) => prev.map((item) => (item.id === id ? { ...item, ...row } : item)));
                        showToast('属性保存成功', 'success');
                        return;
                    }
                    setProperties((prev) => [...prev, { ...row, id: `prop-${Date.now()}` }]);
                    showToast('属性新增成功', 'success');
                }}
            />
            <FunctionDrawer
                open={Boolean(functionDrawer)}
                mode={functionDrawer?.mode ?? 'add'}
                initialRow={functionDrawer?.row}
                onClose={() => setFunctionDrawer(null)}
                onConfirm={(row, id) => {
                    if (id) {
                        setFunctions((prev) => prev.map((item) => (item.id === id ? { ...item, ...row } : item)));
                        showToast('功能保存成功', 'success');
                        return;
                    }
                    setFunctions((prev) => [...prev, { ...row, id: `func-${Date.now()}` }]);
                    showToast('功能新增成功', 'success');
                }}
            />
            <EventDrawer
                open={Boolean(eventDrawer)}
                mode={eventDrawer?.mode ?? 'add'}
                initialRow={eventDrawer?.row}
                onClose={() => setEventDrawer(null)}
                onConfirm={(row, id) => {
                    if (id) {
                        setEvents((prev) => prev.map((item) => (item.id === id ? { ...item, ...row } : item)));
                        showToast('事件保存成功', 'success');
                        return;
                    }
                    setEvents((prev) => [...prev, { ...row, id: `event-${Date.now()}` }]);
                    showToast('事件新增成功', 'success');
                }}
            />

            <ViewDrawer
                title="查看属性"
                open={Boolean(viewProperty)}
                onClose={() => setViewProperty(null)}
                items={viewProperty ? [
                    { label: '属性标识', value: viewProperty.identifier },
                    { label: '属性名称', value: viewProperty.name },
                    { label: '数据类型', value: viewProperty.dataType },
                    { label: '读写类型', value: viewProperty.accessMode },
                    { label: '说明', value: viewProperty.description },
                ] : []}
            />
            <ViewDrawer
                title="查看功能"
                open={Boolean(viewFunction)}
                onClose={() => setViewFunction(null)}
                items={viewFunction ? [
                    { label: '功能标识', value: viewFunction.identifier },
                    { label: '功能名称', value: viewFunction.name },
                    { label: '是否异步', value: viewFunction.async },
                    { label: '输入参数', value: viewFunction.inputJson || '{}' },
                    { label: '说明', value: viewFunction.description },
                ] : []}
            />
            <ViewDrawer
                title="查看事件"
                open={Boolean(viewEvent)}
                onClose={() => setViewEvent(null)}
                items={viewEvent ? [
                    { label: '事件标识', value: viewEvent.identifier },
                    { label: '事件名称', value: viewEvent.name },
                    { label: '事件类型', value: viewEvent.eventType },
                    { label: 'JSON对象', value: viewEvent.jsonObject },
                    { label: '说明', value: viewEvent.description },
                ] : []}
            />

            {modelPreviewOpen && (
                <div className="pcp-drawer-mask" role="presentation" onClick={() => setModelPreviewOpen(false)}>
                    <aside className="pcp-drawer pcp-drawer--form" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
                        <div className="pcp-drawer__head">
                            <h3>查看物模型</h3>
                            <button type="button" className="pcp-drawer__close" onClick={() => setModelPreviewOpen(false)} aria-label="关闭">×</button>
                        </div>
                        <div className="pcp-drawer__body">
                            <pre className="pcp-model-preview">{modelPreviewText}</pre>
                        </div>
                        <div className="pcp-drawer__foot">
                            <button type="button" className="pm-btn pm-btn-primary" onClick={() => setModelPreviewOpen(false)}>关闭</button>
                        </div>
                    </aside>
                </div>
            )}

            {deleteProperty && (
                <ConfirmDialog
                    title="删除属性"
                    message={`确定删除属性「${deleteProperty.name}」吗？`}
                    onClose={() => setDeleteProperty(null)}
                    onConfirm={() => {
                        setProperties((prev) => prev.filter((item) => item.id !== deleteProperty.id));
                        showToast('属性已删除', 'success');
                        setDeleteProperty(null);
                    }}
                />
            )}
            {deleteFunction && (
                <ConfirmDialog
                    title="删除功能"
                    message={`确定删除功能「${deleteFunction.name}」吗？`}
                    onClose={() => setDeleteFunction(null)}
                    onConfirm={() => {
                        setFunctions((prev) => prev.filter((item) => item.id !== deleteFunction.id));
                        showToast('功能已删除', 'success');
                        setDeleteFunction(null);
                    }}
                />
            )}
            {deleteEvent && (
                <ConfirmDialog
                    title="删除事件"
                    message={`确定删除事件「${deleteEvent.name}」吗？`}
                    onClose={() => setDeleteEvent(null)}
                    onConfirm={() => {
                        setEvents((prev) => prev.filter((item) => item.id !== deleteEvent.id));
                        showToast('事件已删除', 'success');
                        setDeleteEvent(null);
                    }}
                />
            )}
        </AppShell>
    );
}
