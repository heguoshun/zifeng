import type { DeviceRecord } from './devices';
import {
    mapProductFunction,
    mapProductProperty,
    type DebugFunctionField,
    type DebugPropertyField,
} from './deviceDebugging';
import type { ProductRecord, PropertyRow } from './products';
import { parseDeviceDateTime } from '../utils/deviceTime';

export type ControlLogEntry = {
    id: string;
    time: string;
    type: '服务调用' | '属性设置' | '历史补采';
    title: string;
    payload: string;
    status: 'success' | 'pending' | 'failed';
};

export type BackfillRange = {
    startDate: string;
    endDate: string;
};

export type ServiceParamField = {
    key: string;
    label: string;
    value: string;
    inputType: 'text' | 'select';
    options?: { label: string; value: string }[];
};

const SERVICE_PARAM_CONFIG: Record<string, Partial<Record<string, {
    label: string;
    inputType: 'text' | 'select';
    options?: { label: string; value: string }[];
}>>> = {
    remote_valve: {
        action: {
            label: '阀门动作',
            inputType: 'select',
            options: [
                { label: '开阀', value: 'open' },
                { label: '关阀', value: 'close' },
            ],
        },
    },
    start_pump: {
        mode: {
            label: '运行模式',
            inputType: 'select',
            options: [
                { label: '自动', value: 'auto' },
                { label: '手动', value: 'manual' },
            ],
        },
    },
    stop_pump: {
        mode: {
            label: '运行模式',
            inputType: 'select',
            options: [
                { label: '自动', value: 'auto' },
                { label: '手动', value: 'manual' },
            ],
        },
    },
    start_supply: {
        mode: {
            label: '运行模式',
            inputType: 'select',
            options: [
                { label: '自动', value: 'auto' },
                { label: '手动', value: 'manual' },
            ],
        },
    },
    stop_supply: {
        mode: {
            label: '运行模式',
            inputType: 'select',
            options: [
                { label: '自动', value: 'auto' },
                { label: '手动', value: 'manual' },
            ],
        },
    },
};

function formatLogTime(date: Date): string {
    const pad = (num: number) => String(num).padStart(2, '0');
    return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export function isWritableProperty(accessMode: string): boolean {
    return accessMode.includes('写');
}

export function getControlFunctions(product: ProductRecord | null): DebugFunctionField[] {
    if (!product) return [];
    return product.functions.map(mapProductFunction);
}

export function getWritableProperties(product: ProductRecord | null): DebugPropertyField[] {
    if (!product) return [];
    return product.properties
        .filter((row) => isWritableProperty(row.accessMode))
        .map(mapProductProperty);
}

export function parseServiceInputJson(inputJson: string): Record<string, string> {
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

export function buildServiceInputJson(values: Record<string, string>): string {
    const payload = Object.fromEntries(
        Object.entries(values).filter(([, value]) => value !== ''),
    );
    return JSON.stringify(payload, null, 2);
}

export function buildServiceParamFields(
    service: DebugFunctionField,
    values: Record<string, string>,
): ServiceParamField[] {
    const defaults = parseServiceInputJson(service.defaultInput);
    const keys = Object.keys(defaults);
    const config = SERVICE_PARAM_CONFIG[service.identifier] ?? {};

    return keys.map((key) => {
        const fieldConfig = config[key];
        return {
            key,
            label: fieldConfig?.label ?? key,
            value: values[key] ?? defaults[key] ?? '',
            inputType: fieldConfig?.inputType ?? 'text',
            options: fieldConfig?.options,
        };
    });
}

export function initServiceInputValues(service: DebugFunctionField | null): Record<string, string> {
    if (!service) return {};
    return parseServiceInputJson(service.defaultInput);
}

export function initPropertyValues(properties: DebugPropertyField[]): Record<string, string> {
    return Object.fromEntries(
        properties.map((field) => [field.id, field.defaultValue ?? '']),
    );
}

export function canControlDevice(device: DeviceRecord): { allowed: boolean; message?: string } {
    if (!device.enabled || device.status === 'disabled') {
        return { allowed: false, message: '设备已禁用，无法远程控制' };
    }
    return { allowed: true };
}

export function createControlLog(
    type: ControlLogEntry['type'],
    title: string,
    payload: Record<string, unknown>,
    status: ControlLogEntry['status'] = 'success',
): ControlLogEntry {
    return {
        id: `ctrl-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        time: formatLogTime(new Date()),
        type,
        title,
        payload: JSON.stringify(payload, null, 2),
        status,
    };
}

export function simulateServiceInvoke(
    device: DeviceRecord,
    service: DebugFunctionField,
    input: Record<string, string>,
    isOnline: boolean,
): ControlLogEntry {
    const payload = {
        deviceId: device.id,
        deviceCode: device.code,
        identifier: service.identifier,
        serviceName: service.name,
        async: service.async,
        input,
        response: service.async
            ? { taskId: `task-${Date.now()}`, status: isOnline ? 'pending' : 'queued' }
            : { result: 'ok' },
    };

    return createControlLog(
        '服务调用',
        service.name,
        payload,
        isOnline ? 'success' : 'pending',
    );
}

export function simulatePropertySet(
    device: DeviceRecord,
    property: PropertyRow,
    value: string,
): ControlLogEntry {
    return createControlLog('属性设置', property.name, {
        deviceId: device.id,
        deviceCode: device.code,
        identifier: property.identifier,
        propertyName: property.name,
        value,
        response: { code: 200, message: 'success' },
    });
}

function formatDateOnly(date: Date): string {
    const pad = (num: number) => String(num).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function parseDateOnly(value: string): Date | null {
    if (!value.trim()) return null;
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return null;
    const year = Number(match[1]);
    const month = Number(match[2]) - 1;
    const day = Number(match[3]);
    const date = new Date(year, month, day);
    if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) {
        return null;
    }
    return date;
}

function startOfDay(date: Date): Date {
    const next = new Date(date);
    next.setHours(0, 0, 0, 0);
    return next;
}

export function formatDeviceDateLabel(value: string | undefined): string {
    if (!value?.trim()) return '—';
    const parsed = parseDeviceDateTime(value);
    if (!parsed) return value;
    return formatDateOnly(parsed);
}

export function getReportableProperties(product: ProductRecord | null): DebugPropertyField[] {
    if (!product) return [];
    return product.properties
        .filter((row) => row.accessMode.includes('读'))
        .map(mapProductProperty);
}

export function getDefaultBackfillRange(device: DeviceRecord): BackfillRange {
    const enabledAt = parseDeviceDateTime(device.enabledAt);
    const installAt = device.installTime ? parseDeviceDateTime(device.installTime) : null;

    const today = startOfDay(new Date());
    let endDate = new Date(today);
    endDate.setDate(endDate.getDate() - 1);

    if (enabledAt) {
        const enabledDay = startOfDay(enabledAt);
        const dayBeforeEnabled = new Date(enabledDay);
        dayBeforeEnabled.setDate(dayBeforeEnabled.getDate() - 1);
        if (dayBeforeEnabled < endDate) {
            endDate = dayBeforeEnabled;
        }
    }

    let startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 6);

    if (installAt) {
        const installDay = startOfDay(installAt);
        if (installDay <= endDate) {
            startDate = installDay;
        }
    }

    return {
        startDate: formatDateOnly(startDate),
        endDate: formatDateOnly(endDate),
    };
}

export function getMissingBackfillRange(device: DeviceRecord): BackfillRange | null {
    const installAt = device.installTime ? parseDeviceDateTime(device.installTime) : null;
    const enabledAt = parseDeviceDateTime(device.enabledAt);
    if (!installAt || !enabledAt) return null;

    const installDay = startOfDay(installAt);
    const enabledDay = startOfDay(enabledAt);
    const endDate = new Date(enabledDay);
    endDate.setDate(endDate.getDate() - 1);

    if (endDate < installDay) return null;

    return {
        startDate: formatDateOnly(installDay),
        endDate: formatDateOnly(endDate),
    };
}

export function estimateBackfillRecords(
    startDate: string,
    endDate: string,
    collectFrequencyMinutes: number,
): number {
    const start = parseDateOnly(startDate);
    const end = parseDateOnly(endDate);
    if (!start || !end || end < start) return 0;

    const days = Math.floor((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1;
    const frequency = Math.max(1, Number(collectFrequencyMinutes) || 1440);
    const recordsPerDay = Math.ceil((24 * 60) / frequency);
    return days * recordsPerDay;
}

export function validateBackfillRequest(
    device: DeviceRecord,
    startDate: string,
    endDate: string,
    propertyIds: string[],
): { valid: boolean; message?: string } {
    if (!startDate || !endDate) {
        return { valid: false, message: '请选择补采时间范围' };
    }

    const start = parseDateOnly(startDate);
    const end = parseDateOnly(endDate);
    if (!start || !end) {
        return { valid: false, message: '补采时间格式不正确' };
    }
    if (end < start) {
        return { valid: false, message: '结束日期不能早于开始日期' };
    }

    const today = startOfDay(new Date());
    if (end >= today) {
        return { valid: false, message: '补采结束日期需早于今天，避免与实时上报冲突' };
    }

    const installAt = device.installTime ? parseDeviceDateTime(device.installTime) : null;
    if (installAt && start < startOfDay(installAt)) {
        return { valid: false, message: '补采开始日期不能早于设备安装日期' };
    }

    if (!propertyIds.length) {
        return { valid: false, message: '请至少选择一个补采属性' };
    }

    return { valid: true };
}

export function simulateHistoricalBackfill(
    device: DeviceRecord,
    startDate: string,
    endDate: string,
    propertyIds: string[],
    propertyNames: string[],
    isOnline: boolean,
): ControlLogEntry {
    const estimatedRecords = estimateBackfillRecords(
        startDate,
        endDate,
        Number(device.collectFrequency) || 1440,
    );

    const payload = {
        deviceId: device.id,
        deviceCode: device.code,
        startDate,
        endDate,
        propertyIds,
        propertyNames,
        collectFrequency: device.collectFrequency,
        estimatedRecords,
        response: {
            taskId: `backfill-${Date.now()}`,
            status: isOnline ? 'running' : 'queued',
            message: isOnline
                ? '补采任务已下发，设备将分批上报历史数据'
                : '设备离线，补采任务已加入待执行队列',
        },
    };

    return createControlLog(
        '历史补采',
        `${startDate} 至 ${endDate}`,
        payload,
        isOnline ? 'pending' : 'pending',
    );
}
