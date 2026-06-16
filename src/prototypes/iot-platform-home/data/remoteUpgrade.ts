import type { ProductRecord } from './products';

export type FirmwarePackageType = '完整包' | '差分包';

export type FirmwarePackageRecord = {
    id: string;
    name: string;
    type: FirmwarePackageType;
    productId: string;
    productName: string;
    version: string;
    baseVersion: string;
    description: string;
    fileName: string;
    createdAt: string;
};

export type UpgradePackageKind = 'firmware' | 'software';

export type UpgradePackageTarget = {
    id: string;
    name: string;
    version: string;
    productId: string;
};

export type SoftwarePackageRecord = {
    id: string;
    name: string;
    productId: string;
    productName: string;
    version: string;
    description: string;
    fileName: string;
    createdAt: string;
};

export type SoftwarePackageFormValue = {
    name: string;
    productId: string;
    version: string;
    description: string;
    fileName: string;
};

export type UpgradeTaskRecord = {
    id: string;
    packageKind: UpgradePackageKind;
    packageId: string;
    packageName: string;
    targetVersion: string;
    scope: '全部设备' | '指定设备';
    deviceIds: string[];
    scheduleType: '立即升级' | '定时升级';
    scheduledAt: string;
    retryStrategy: string;
    timeout: string;
    status: '待执行' | '执行中' | '已完成' | '部分失败';
    createdAt: string;
};

export type FirmwarePackageFormValue = {
    type: FirmwarePackageType;
    name: string;
    productId: string;
    version: string;
    baseVersion: string;
    description: string;
    fileName: string;
};

export type UpgradeTaskFormValue = {
    targetVersion: string;
    scope: '全部设备' | '指定设备';
    deviceIds: string[];
    scheduleType: '立即升级' | '定时升级';
    scheduledAt: string;
    retryStrategy: string;
    timeout: string;
};

export const FIRMWARE_SEARCH_FIELD_OPTIONS = [
    { label: '固件包名称', value: 'name' },
    { label: '产品名称', value: 'productName' },
];

export const SOFTWARE_SEARCH_FIELD_OPTIONS = [
    { label: '软件包名称', value: 'name' },
    { label: '产品名称', value: 'productName' },
];

export type UpgradeBatchStatus = '未开始' | '进行中' | '已完成';

export type UpgradeDeviceStatus = '待升级' | '升级中' | '升级成功' | '升级失败' | '取消升级';

export type UpgradeTaskBatchRecord = {
    id: string;
    batchNo: string;
    packageKind: UpgradePackageKind;
    packageId: string;
    status: UpgradeBatchStatus;
    versionBefore: string;
    versionAfter: string;
    deviceCount: number;
    scheduleType: '立即升级' | '定时升级';
    upgradeTime: string;
};

export type UpgradeDeviceDetailRecord = {
    id: string;
    batchId: string;
    deviceName: string;
    deviceCode: string;
    scheduleType: '立即升级' | '定时升级';
    status: UpgradeDeviceStatus;
    updatedAt: string;
};

export const UPGRADE_BATCH_STATUS_OPTIONS = [
    { label: '全部状态', value: 'all' },
    { label: '未开始', value: '未开始' },
    { label: '进行中', value: '进行中' },
    { label: '已完成', value: '已完成' },
];

export const UPGRADE_DEVICE_STATUS_OPTIONS = [
    { label: '全部状态', value: 'all' },
    { label: '待升级', value: '待升级' },
    { label: '升级中', value: '升级中' },
    { label: '升级成功', value: '升级成功' },
    { label: '升级失败', value: '升级失败' },
    { label: '取消升级', value: '取消升级' },
];

export const UPGRADE_DEVICE_SEARCH_FIELD_OPTIONS = [
    { label: '设备名称', value: 'name' },
    { label: '设备编号', value: 'code' },
];

export type PackageUpgradeStats = {
    pending: number;
    upgrading: number;
    success: number;
    failed: number;
};

export const RETRY_STRATEGY_OPTIONS = [
    { label: '请选择', value: '' },
    { label: '不重试', value: '不重试' },
    { label: '失败后重试 1 次', value: '失败后重试 1 次' },
    { label: '失败后重试 3 次', value: '失败后重试 3 次' },
    { label: '失败后重试 5 次', value: '失败后重试 5 次' },
];

export const UPGRADE_TIMEOUT_OPTIONS = [
    { label: '请选择', value: '' },
    { label: '10 分钟', value: '10 分钟' },
    { label: '30 分钟', value: '30 分钟' },
    { label: '1 小时', value: '1 小时' },
    { label: '2 小时', value: '2 小时' },
];

const FIRMWARE_SEEDS: Array<Omit<FirmwarePackageRecord, 'id' | 'productId' | 'createdAt'>> = [
    { name: '大表固件升级包', type: '完整包', productName: '大表', version: 'V2.0', baseVersion: '', description: '大表固件完整升级包', fileName: 'dabiao_v2.0.bin' },
    { name: '大表固件升级包', type: '差分包', productName: '大表', version: 'V3.0', baseVersion: 'V2.0', description: '大表固件差分升级包', fileName: 'dabiao_v3.0.patch' },
    { name: '户表固件升级包', type: '完整包', productName: '户表', version: 'V3.2', baseVersion: '', description: '户表固件完整升级包', fileName: 'hubiao_v3.2.bin' },
    { name: '压力计固件升级包', type: '完整包', productName: '压力计', version: 'V1.5', baseVersion: '', description: '压力计采集固件', fileName: 'yaliji_v1.5.bin' },
    { name: '水质仪固件升级包', type: '差分包', productName: '水质仪', version: 'V2.1', baseVersion: 'V2.0', description: '水质仪固件差分包', fileName: 'shuizhiyi_v2.1.patch' },
    { name: '智慧水站升级包', type: '完整包', productName: '智慧水站', version: 'V4.0', baseVersion: '', description: '智慧水站主控固件', fileName: 'zhihuishuizhan_v4.0.bin' },
    { name: '户表固件升级包', type: '差分包', productName: '户表', version: 'V3.1', baseVersion: 'V3.0', description: '户表固件差分包', fileName: 'hubiao_v3.1.patch' },
    { name: '压力计固件升级包', type: '完整包', productName: '压力计', version: 'V2.3', baseVersion: '', description: '压力计采集固件', fileName: 'yaliji_v2.3.bin' },
    { name: '水质仪固件升级包', type: '完整包', productName: '水质仪', version: 'V1.0', baseVersion: '', description: '水质仪监测固件', fileName: 'shuizhiyi_v1.0.bin' },
    { name: '大表固件升级包', type: '完整包', productName: '大表', version: 'V1.0', baseVersion: '', description: '大表系列固件', fileName: 'dabiao_v1.0.bin' },
];

const SOFTWARE_SEEDS: Array<Omit<SoftwarePackageRecord, 'id' | 'productId' | 'createdAt'>> = [
    { name: '户表采集应用', productName: '户表', version: 'V2.1.0', description: '户表终端采集软件', fileName: 'hubiao_app.apk' },
    { name: '大表管理平台', productName: '大表', version: 'V1.8.3', description: '大表设备管理应用', fileName: 'dabiao_mgmt.zip' },
    { name: '智慧水站运维工具', productName: '智慧水站', version: 'V3.0.2', description: '智慧水站远程运维软件包', fileName: 'zhihuishuizhan_ops.zip' },
    { name: '压力监测客户端', productName: '压力计', version: 'V2.0.0', description: '管网压力监测应用', fileName: 'yaliji_client.apk' },
    { name: '水质分析软件', productName: '水质仪', version: 'V1.5.1', description: '水质数据分析软件', fileName: 'shuizhiyi_analytics.zip' },
    { name: '智慧水站集控应用', productName: '智慧水站', version: 'V4.2.0', description: '智慧水站集中控制软件', fileName: 'zhihuishuizhan_ctrl.apk' },
    { name: '户表抄表应用', productName: '户表', version: 'V2.3.4', description: '远程抄表控制应用', fileName: 'hubiao_read.apk' },
    { name: '压力监测平台', productName: '压力计', version: 'V1.1.0', description: '压力监测分析软件', fileName: 'yaliji_mon.zip' },
    { name: '大表水务应用', productName: '大表', version: 'V1.0.5', description: '大表水务终端应用', fileName: 'dabiao_app.apk' },
    { name: '智慧水站调试助手', productName: '智慧水站', version: 'V2.4.1', description: '现场水站调试工具', fileName: 'zhihuishuizhan_debug.zip' },
];

function resolveProductId(productName: string, products: ProductRecord[]): string {
    const product = products.find((item) => item.name === productName || item.name.includes(productName) || productName.includes(item.name));
    return product?.id ?? products[0]?.id ?? '';
}

function formatCreatedAt(index: number): string {
    const day = String(12 - Math.floor(index / 3)).padStart(2, '0');
    const hour = String(9 + (index % 8)).padStart(2, '0');
    const minute = String((index * 7) % 60).padStart(2, '0');
    const second = String((index * 11) % 60).padStart(2, '0');
    return `2026-06-${day} ${hour}:${minute}:${second}`;
}

export function createInitialSoftwarePackages(products: ProductRecord[]): SoftwarePackageRecord[] {
    const records: SoftwarePackageRecord[] = [];
    for (let index = 0; index < 30; index += 1) {
        const seed = SOFTWARE_SEEDS[index % SOFTWARE_SEEDS.length];
        records.push({
            id: `sw-${String(index + 1).padStart(3, '0')}`,
            ...seed,
            productId: resolveProductId(seed.productName, products),
            createdAt: formatCreatedAt(index),
        });
    }
    return records;
}

export function createInitialFirmwarePackages(products: ProductRecord[]): FirmwarePackageRecord[] {
    const records: FirmwarePackageRecord[] = [];
    for (let index = 0; index < 30; index += 1) {
        const seed = FIRMWARE_SEEDS[index % FIRMWARE_SEEDS.length];
        records.push({
            id: `fw-${String(index + 1).padStart(3, '0')}`,
            ...seed,
            productId: resolveProductId(seed.productName, products),
            createdAt: formatCreatedAt(index),
        });
    }
    return records;
}

export function formatRemoteUpgradeNow(): string {
    const now = new Date();
    const pad = (value: number) => String(value).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} `
        + `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

export function generateFirmwarePackageId(): string {
    return `fw-${Date.now()}`;
}

export function generateSoftwarePackageId(): string {
    return `sw-${Date.now()}`;
}

export function generateUpgradeTaskId(): string {
    return `task-${Date.now()}`;
}

export function generateUpgradeBatchId(): string {
    return `batch-${Date.now()}`;
}

const BATCH_STATUS_CYCLE: UpgradeBatchStatus[] = ['进行中', '未开始', '已完成'];

export function createMockBatchesForPackage(
    packageId: string,
    packageKind: UpgradePackageKind,
    versionAfter: string,
    count = 30,
): UpgradeTaskBatchRecord[] {
    return Array.from({ length: count }, (_, index) => ({
        id: `batch-${packageId}-${index + 1}`,
        batchNo: String(2883478 + index),
        packageKind,
        packageId,
        status: BATCH_STATUS_CYCLE[index % BATCH_STATUS_CYCLE.length],
        versionBefore: `V1.${index % 4}`,
        versionAfter,
        deviceCount: 8 + (index % 6),
        scheduleType: index % 3 === 0 ? '定时升级' : '立即升级',
        upgradeTime: formatCreatedAt(index),
    }));
}

export function upgradeTaskToBatch(
    task: UpgradeTaskRecord,
    versionAfter: string,
): UpgradeTaskBatchRecord {
    const batchNo = task.id.replace(/\D/g, '').slice(-7).padStart(7, '0');
    return {
        id: task.id,
        batchNo: batchNo || String(Date.now()).slice(-7),
        packageKind: task.packageKind,
        packageId: task.packageId,
        status: task.status === '待执行'
            ? '未开始'
            : task.status === '执行中'
                ? '进行中'
                : '已完成',
        versionBefore: 'V1.0',
        versionAfter: task.targetVersion || versionAfter,
        deviceCount: task.scope === '指定设备' ? Math.max(task.deviceIds.length, 1) : 48,
        scheduleType: task.scheduleType,
        upgradeTime: task.scheduleType === '定时升级' ? task.scheduledAt : task.createdAt,
    };
}

const DEVICE_STATUS_CYCLE: UpgradeDeviceStatus[] = [
    '取消升级', '取消升级', '取消升级', '取消升级',
    '升级失败', '升级失败',
    '升级成功', '升级成功', '升级成功', '升级成功',
];

export function createMockDeviceDetailsForBatch(
    batch: UpgradeTaskBatchRecord,
    count = 10,
): UpgradeDeviceDetailRecord[] {
    return Array.from({ length: count }, (_, index) => ({
        id: `${batch.id}-device-${index + 1}`,
        batchId: batch.id,
        deviceName: `大表-主管网-${String(index + 1).padStart(2, '0')}`,
        deviceCode: String(23492783399 + index),
        scheduleType: batch.scheduleType,
        status: DEVICE_STATUS_CYCLE[index % DEVICE_STATUS_CYCLE.length],
        updatedAt: `2025-07-30 ${String(11 + (index % 8)).padStart(2, '0')}:${String((index * 5) % 60).padStart(2, '0')}:00`,
    }));
}

export function computePackageUpgradeStats(
    deviceDetails: UpgradeDeviceDetailRecord[],
    packageId: string,
): PackageUpgradeStats {
    const list = deviceDetails.filter((item) => item.batchId.startsWith(`batch-${packageId}`) || item.id.includes(packageId));
    if (!list.length) {
        return { pending: 48, upgrading: 22, success: 20, failed: 5 };
    }
    return {
        pending: list.filter((item) => item.status === '待升级').length,
        upgrading: list.filter((item) => item.status === '升级中').length,
        success: list.filter((item) => item.status === '升级成功').length,
        failed: list.filter((item) => item.status === '升级失败').length,
    };
}

export function mergePackageBatches(
    packageId: string,
    packageKind: UpgradePackageKind,
    version: string,
    upgradeTasks: UpgradeTaskRecord[],
    extraBatches: UpgradeTaskBatchRecord[],
): UpgradeTaskBatchRecord[] {
    const byId = new Map<string, UpgradeTaskBatchRecord>();
    createMockBatchesForPackage(packageId, packageKind, version).forEach((item) => {
        byId.set(item.id, item);
    });
    upgradeTasks
        .filter((item) => item.packageKind === packageKind && item.packageId === packageId)
        .map((item) => upgradeTaskToBatch(item, version))
        .forEach((item) => {
            byId.set(item.id, item);
        });
    extraBatches
        .filter((item) => item.packageId === packageId)
        .forEach((item) => {
            byId.set(item.id, item);
        });
    return Array.from(byId.values());
}

export function toFirmwarePackageFormValue(record: FirmwarePackageRecord): FirmwarePackageFormValue {
    return {
        type: record.type,
        name: record.name,
        productId: record.productId,
        version: record.version,
        baseVersion: record.baseVersion,
        description: record.description === '—' ? '' : record.description,
        fileName: record.fileName,
    };
}

export function toSoftwarePackageFormValue(record: SoftwarePackageRecord): SoftwarePackageFormValue {
    return {
        name: record.name,
        productId: record.productId,
        version: record.version,
        description: record.description === '—' ? '' : record.description,
        fileName: record.fileName,
    };
}

export const EMPTY_SOFTWARE_FORM: SoftwarePackageFormValue = {
    name: '',
    productId: '',
    version: '',
    description: '',
    fileName: '',
};

export const EMPTY_FIRMWARE_FORM: FirmwarePackageFormValue = {
    type: '完整包',
    name: '',
    productId: '',
    version: '',
    baseVersion: '',
    description: '',
    fileName: '',
};

export const EMPTY_UPGRADE_TASK_FORM: UpgradeTaskFormValue = {
    targetVersion: '',
    scope: '全部设备',
    deviceIds: [],
    scheduleType: '立即升级',
    scheduledAt: '',
    retryStrategy: '',
    timeout: '',
};

export function validatePackageFileName(fileName: string, label = '包'): string | null {
    if (!fileName.trim()) return `请上传${label}文件`;
    const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
    if (!['zip', 'rar', 'bin', 'apk'].includes(ext)) {
        return '仅支持 .zip / .rar / .bin / .apk 文件';
    }
    const baseName = fileName.replace(/\.[^.]+$/, '');
    if (baseName.length < 1 || baseName.length > 20) {
        return '文件名长度需为 1~20 个字符';
    }
    if (!/^[A-Za-z0-9._-]+$/.test(baseName)) {
        return '文件名仅支持英文、数字、点、横线或下划线';
    }
    return null;
}

export function validateFirmwareFileName(fileName: string): string | null {
    return validatePackageFileName(fileName, '固件包');
}

export function validateSoftwareFileName(fileName: string): string | null {
    return validatePackageFileName(fileName, '软件包');
}
