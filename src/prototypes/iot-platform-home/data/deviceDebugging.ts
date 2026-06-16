import type { DeviceRecord } from './devices';
import {
    normalizeFunctionRow,
    type EventRow,
    type FunctionRow,
    type ProductRecord,
    type PropertyRow,
} from './products';

export type DebugPropertyField = {
    id: string;
    identifier: string;
    name: string;
    typeLabel: string;
    dataType: 'float' | 'int' | 'text' | 'enum' | 'bool' | 'struct';
    unit?: string;
    enumOptions?: { label: string; value: string }[];
    defaultValue?: string;
};

export type DebugEventField = {
    id: string;
    identifier: string;
    name: string;
    typeLabel: string;
    eventType: string;
    jsonObject: string;
    description: string;
};

export type DebugFunctionField = {
    id: string;
    identifier: string;
    name: string;
    async: boolean;
    asyncLabel: string;
    description: string;
    defaultInput: string;
};

export type DebugDeviceItem = {
    id: string;
    name: string;
    code: string;
    status: 'online' | 'offline';
    subDevices?: { id: string; name: string; productLabel: string }[];
};

export type DebugProductItem = {
    id: string;
    name: string;
    code: string;
    nodeType: string;
    categoryPath: string;
    isGateway: boolean;
    properties: DebugPropertyField[];
    events: DebugEventField[];
    functions: DebugFunctionField[];
    devices: DebugDeviceItem[];
};

export type DebugLogEntry = {
    id: string;
    time: string;
    title: string;
    payload: string;
};

const DATA_TYPE_LABELS: Record<string, string> = {
    int: '整数型',
    float: '浮点型',
    double: '浮点型',
    text: '文本型',
    bool: '布尔型',
    enum: '枚举型',
    struct: '结构体型',
};

function extractUnit(description: string): string | undefined {
    const unitMatch = description.match(/单位[：:\s]*([^\s，,。.]+)/);
    if (unitMatch?.[1]) return unitMatch[1];

    const symbolMatch = description.match(/[（(]([^）)]+)[）)]/);
    if (symbolMatch?.[1] && /[%℃°RhVWm³h\/]/.test(symbolMatch[1])) {
        return symbolMatch[1];
    }

    return undefined;
}

function normalizePropertyDataType(dataType: string): DebugPropertyField['dataType'] {
    if (dataType === 'int') return 'int';
    if (dataType === 'bool') return 'bool';
    if (dataType === 'enum') return 'enum';
    if (dataType === 'text') return 'text';
    if (dataType === 'struct') return 'struct';
    if (dataType === 'float' || dataType === 'double') return 'float';
    return 'text';
}

function defaultValueForProperty(field: DebugPropertyField): string {
    if (field.dataType === 'bool') return 'false';
    if (field.enumOptions?.length) return field.enumOptions[0].value;
    return '';
}

export function mapProductProperty(row: PropertyRow): DebugPropertyField {
    const dataType = normalizePropertyDataType(row.dataType);
    const unit = extractUnit(row.description);
    const field: DebugPropertyField = {
        id: row.id,
        identifier: row.identifier,
        name: row.name,
        typeLabel: DATA_TYPE_LABELS[row.dataType] ?? row.dataType,
        dataType,
        unit,
        defaultValue: '',
    };
    field.defaultValue = defaultValueForProperty(field);
    return field;
}

export function mapProductEvent(row: EventRow): DebugEventField {
    return {
        id: row.id,
        identifier: row.identifier,
        name: row.name,
        typeLabel: row.eventType,
        eventType: row.eventType,
        jsonObject: row.jsonObject,
        description: row.description,
    };
}

function formatFunctionDefaultInput(inputJson?: string): string {
    if (!inputJson?.trim()) return '{}';
    try {
        return JSON.stringify(JSON.parse(inputJson), null, 2);
    } catch {
        return inputJson;
    }
}

export function mapProductFunction(row: FunctionRow): DebugFunctionField {
    const normalized = normalizeFunctionRow(row);
    return {
        id: normalized.id,
        identifier: normalized.identifier,
        name: normalized.name,
        async: normalized.async === '是',
        asyncLabel: normalized.async,
        description: normalized.description,
        defaultInput: formatFunctionDefaultInput(normalized.inputJson),
    };
}

const MOCK_PROPERTY_READ_VALUES: Record<string, string | number | boolean> = {
    temperature: 25.6,
    humidity: 68,
    switch_status: true,
    voltage: 220.5,
    power: 45.2,
    fanSpeed: 'medium',
    workMode: 'cool',
    flow: 1.25,
    totalFlow: 1024.8,
};

export function buildMockPropertyReadValues(
    fields: DebugPropertyField[],
    selected: Record<string, boolean>,
): Record<string, string | number | boolean> {
    return Object.fromEntries(
        fields
            .filter((field) => selected[field.id])
            .map((field) => [
                field.identifier,
                MOCK_PROPERTY_READ_VALUES[field.identifier] ?? field.defaultValue ?? '—',
            ]),
    );
}

function mapDeviceStatus(status: DeviceRecord['status']): 'online' | 'offline' {
    return status === 'online' ? 'online' : 'offline';
}

function buildSubDevices(
    gatewayDevice: DeviceRecord,
    devices: DeviceRecord[],
    products: ProductRecord[],
): DebugDeviceItem['subDevices'] {
    const subProductIds = new Set(
        products.filter((product) => product.nodeType === '网关子设备').map((product) => product.id),
    );
    if (!subProductIds.size) return undefined;

    const subDevices = devices
        .filter((item) => item.id !== gatewayDevice.id && subProductIds.has(item.productId))
        .sort((left, right) => {
            const leftDemo = left.id.startsWith('demo-sub-') ? 0 : 1;
            const rightDemo = right.id.startsWith('demo-sub-') ? 0 : 1;
            return leftDemo - rightDemo || left.name.localeCompare(right.name, 'zh-CN');
        })
        .slice(0, 8)
        .map((item) => {
            const subProduct = products.find((product) => product.id === item.productId);
            return {
                id: item.id,
                name: item.name,
                productLabel: subProduct?.name ?? '—',
            };
        });

    return subDevices.length ? subDevices : undefined;
}

function mapDeviceToDebugItem(
    device: DeviceRecord,
    product: ProductRecord,
    devices: DeviceRecord[],
    products: ProductRecord[],
): DebugDeviceItem {
    const item: DebugDeviceItem = {
        id: device.id,
        name: device.name,
        code: device.code,
        status: mapDeviceStatus(device.status),
    };

    if (product.nodeType === '网关设备') {
        item.subDevices = buildSubDevices(device, devices, products);
    }

    return item;
}

function mapProductRecordToDebugItem(
    product: ProductRecord,
    devices: DeviceRecord[],
    products: ProductRecord[],
): DebugProductItem {
    const productDevices = devices.filter((device) => device.productId === product.id);

    return {
        id: product.id,
        name: product.name,
        code: product.code,
        nodeType: product.nodeType,
        categoryPath: product.category,
        isGateway: product.nodeType === '网关设备',
        properties: (product.properties ?? []).map(mapProductProperty),
        events: (product.events ?? []).map(mapProductEvent),
        functions: (product.functions ?? []).map(mapProductFunction),
        devices: productDevices.map((device) => mapDeviceToDebugItem(device, product, devices, products)),
    };
}

export function resolveDebugProduct(
    productId: string,
    products: ProductRecord[] = [],
    devices: DeviceRecord[] = [],
): DebugProductItem | undefined {
    const product = products.find((item) => item.id === productId);
    if (!product) return undefined;
    return mapProductRecordToDebugItem(product, devices, products);
}

export function getDebugDevicesForProduct(
    productId: string,
    products: ProductRecord[] = [],
    devices: DeviceRecord[] = [],
): DebugDeviceItem[] {
    const product = products.find((item) => item.id === productId);
    if (!product) return [];
    return devices
        .filter((device) => device.productId === productId)
        .map((device) => mapDeviceToDebugItem(device, product, devices, products));
}

export function formatDebugNow(): string {
    const now = new Date();
    const pad = (value: number) => String(value).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} `
        + `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

export function createDebugLog(title: string, payload: Record<string, unknown>): DebugLogEntry {
    return {
        id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        time: formatDebugNow(),
        title,
        payload: JSON.stringify(payload, null, 2),
    };
}

export function buildInitialPropertyValues(product: DebugProductItem): Record<string, string> {
    return Object.fromEntries(
        product.properties.map((field) => [field.id, field.defaultValue ?? '']),
    );
}
