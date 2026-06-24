export type SystemFileRecord = {
    id: string;
    fileName: string;
    originalName: string;
    suffix: string;
    previewType: 'image' | 'document';
    createdAt: string;
    uploader: string;
    provider: string;
};

let fileIdCounter = 0;

export function generateSystemFileId(): string {
    fileIdCounter += 1;
    return `sf-${Date.now()}-${fileIdCounter}`;
}

export function generateStoredFileName(originalName: string): string {
    const now = new Date();
    const pad = (value: number) => String(value).padStart(2, '0');
    const datePath = `${now.getFullYear()}/${pad(now.getMonth() + 1)}/${pad(now.getDate())}`;
    const token = Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const suffix = getFileSuffix(originalName);
    const ext = suffix.replace(/^\./, '');
    return `${datePath}/${token}${ext ? `.${ext}` : ''}`;
}

export function getFileSuffix(fileName: string): string {
    const dotIndex = fileName.lastIndexOf('.');
    if (dotIndex <= 0 || dotIndex === fileName.length - 1) return '';
    return fileName.slice(dotIndex).toLowerCase();
}

export function isImageSuffix(suffix: string): boolean {
    return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'].includes(suffix.toLowerCase());
}

export function formatSystemFileNow(date = new Date()): string {
    const pad = (value: number) => String(value).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} `
        + `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export function createSystemFileFromUpload(
    file: File,
    uploader: string,
    provider = 'minio',
): SystemFileRecord {
    const suffix = getFileSuffix(file.name);
    return {
        id: generateSystemFileId(),
        fileName: generateStoredFileName(file.name),
        originalName: file.name,
        suffix,
        previewType: isImageSuffix(suffix) ? 'image' : 'document',
        createdAt: formatSystemFileNow(),
        uploader,
        provider,
    };
}

export function createInitialSystemFiles(): SystemFileRecord[] {
    return [
        {
            id: '1926190001000000001',
            fileName: '2026/03/20/4e89a405c9ff4e32895d5e6050fdc4db.xls',
            originalName: '新建 XLS 工作表.xls',
            suffix: '.xls',
            previewType: 'document',
            createdAt: '2026-03-20 10:13:38',
            uploader: 'admin',
            provider: 'minio',
        },
        {
            id: '1926190001000000002',
            fileName: '2026/03/18/a1b2c3d4e5f6478990abcdef12345678.png',
            originalName: '平台架构图.png',
            suffix: '.png',
            previewType: 'image',
            createdAt: '2026-03-18 16:42:05',
            uploader: 'superadmin',
            provider: 'minio',
        },
        {
            id: '1926190001000000003',
            fileName: '2026/03/15/fedcba9876543210fedcba9876543210.pdf',
            originalName: '设备接入说明.pdf',
            suffix: '.pdf',
            previewType: 'document',
            createdAt: '2026-03-15 09:20:11',
            uploader: 'admin',
            provider: 'minio',
        },
    ];
}

export function filterSystemFiles(
    files: SystemFileRecord[],
    fileName: string,
    originalName: string,
    suffix: string,
): SystemFileRecord[] {
    return files.filter((item) => {
        if (fileName && !item.fileName.toLowerCase().includes(fileName.toLowerCase())) return false;
        if (originalName && !item.originalName.toLowerCase().includes(originalName.toLowerCase())) return false;
        if (suffix && !item.suffix.toLowerCase().includes(suffix.toLowerCase())) return false;
        return true;
    });
}
