export type DeviceFileRecord = {
    id: string;
    name: string;
    sizeMb: number;
    uploadedAt: string;
};

export const DEVICE_FILE_LIMITS = {
    maxStorageMb: 10,
    maxFileCount: 10,
    maxSingleFileMb: 2,
    acceptExtensions: ['.jpg', '.jpeg', '.png', '.pdf', '.docx'],
} as const;

const DEFAULT_DEVICE_FILES: Record<string, DeviceFileRecord[]> = {
    DB000001: [
        {
            id: '1bd8de220bd64e0',
            name: '设备保养手册.pdf',
            sizeMb: 0.02,
            uploadedAt: '2025-07-01 12:30:23',
        },
        {
            id: '1bd8de220bd64e2',
            name: '设备照片.png',
            sizeMb: 0.02,
            uploadedAt: '2025-07-01 09:29:31',
        },
    ],
};

export function createInitialDeviceFilesMap() {
    return { ...DEFAULT_DEVICE_FILES };
}

export function getDeviceFiles(
    filesByDevice: Record<string, DeviceFileRecord[]>,
    deviceCode: string | undefined,
) {
    if (!deviceCode) return [];
    return filesByDevice[deviceCode] ?? [];
}

export function calcDeviceFilesTotalSizeMb(files: DeviceFileRecord[]) {
    return files.reduce((sum, file) => sum + file.sizeMb, 0);
}

export function formatDeviceFileSize(sizeMb: number) {
    return `${sizeMb.toFixed(2)}MB`;
}

export function generateDeviceFileId() {
    return Array.from({ length: 15 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
}

export function isAllowedDeviceFile(file: File) {
    const lowerName = file.name.toLowerCase();
    return DEVICE_FILE_LIMITS.acceptExtensions.some((ext) => lowerName.endsWith(ext));
}

export function formatDeviceFileUploadTime(date = new Date()) {
    const pad = (value: number) => String(value).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} `
        + `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}
