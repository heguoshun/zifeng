export type CertificateStandard = 'X.509' | '国密标准';

export type CertificateRecord = {
    id: string;
    standard: CertificateStandard;
    name: string;
    fileName: string;
    privateKey: string;
    description: string;
    createdAt: string;
};

export type CertificateFormValue = {
    standard: CertificateStandard | '';
    name: string;
    fileName: string;
    privateKey: string;
    description: string;
};

export const CERTIFICATE_STANDARD_OPTIONS: { label: string; value: CertificateStandard }[] = [
    { label: 'X.509', value: 'X.509' },
    { label: '国密标准', value: '国密标准' },
];

export const CERTIFICATE_STANDARD_FILTER_OPTIONS = [
    { label: '全部', value: 'all' },
    ...CERTIFICATE_STANDARD_OPTIONS.map((item) => ({ label: item.label, value: item.value })),
];

/** 证书文件允许的扩展名（PEM / DER / PKCS#12 等常见编码） */
export const CERTIFICATE_FILE_EXTENSIONS = ['.pem', '.crt', '.cer', '.pfx', '.p12'] as const;

export const CERTIFICATE_FILE_ACCEPT = CERTIFICATE_FILE_EXTENSIONS.join(',');

export const CERTIFICATE_FILE_FORMAT_HINT = `支持扩展名：${CERTIFICATE_FILE_EXTENSIONS.join(' ')}`;

export const MAX_CERTIFICATE_FILE_SIZE_MB = 100;

export function getCertificateFileExtension(fileName: string): string {
    const dotIndex = fileName.lastIndexOf('.');
    if (dotIndex < 0) return '';
    return fileName.slice(dotIndex).toLowerCase();
}

let certificateIdCounter = 0;

export function generateCertificateId(): string {
    certificateIdCounter += 1;
    return `cert-${String(certificateIdCounter).padStart(4, '0')}`;
}

export function defaultCertificateFormValue(): CertificateFormValue {
    return {
        standard: '',
        name: '',
        fileName: '',
        privateKey: '',
        description: '',
    };
}

export function toCertificateFormValue(record: CertificateRecord): CertificateFormValue {
    return {
        standard: record.standard,
        name: record.name,
        fileName: record.fileName,
        privateKey: record.privateKey,
        description: record.description,
    };
}

export function formatCertificateNow(): string {
    const now = new Date();
    const pad = (num: number) => String(num).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} `
        + `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

export function validateCertificateFile(file: File): string | null {
    const extension = getCertificateFileExtension(file.name);
    if (!CERTIFICATE_FILE_EXTENSIONS.includes(extension as typeof CERTIFICATE_FILE_EXTENSIONS[number])) {
        return `仅支持 ${CERTIFICATE_FILE_EXTENSIONS.join('、')} 格式的证书文件`;
    }

    const maxBytes = MAX_CERTIFICATE_FILE_SIZE_MB * 1024 * 1024;
    if (file.size > maxBytes) {
        return `文件大小不能超过 ${MAX_CERTIFICATE_FILE_SIZE_MB}M`;
    }
    return null;
}

export function createInitialCertificates(): CertificateRecord[] {
    certificateIdCounter = 4;
    return [
        {
            id: 'cert-0001',
            standard: 'X.509',
            name: 'MQTT TLS 服务端证书',
            fileName: 'mqtt-server.crt',
            privateKey: '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...\n-----END PRIVATE KEY-----',
            description: '用于 MQTT Broker 双向 TLS 认证',
            createdAt: '2025-11-08 10:23:15',
        },
        {
            id: 'cert-0002',
            standard: 'X.509',
            name: '设备接入根证书',
            fileName: 'device-root-ca.pem',
            privateKey: '-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEA...\n-----END RSA PRIVATE KEY-----',
            description: '设备接入平台根 CA 证书',
            createdAt: '2025-11-12 14:05:42',
        },
        {
            id: 'cert-0003',
            standard: '国密标准',
            name: 'CoAP DTLS 国密证书',
            fileName: 'coap-dtls-sm2.cer',
            privateKey: '-----BEGIN SM2 PRIVATE KEY-----\nMIICdQIBADANBgkqhkiG9w0BAQEFAASCAl8wggJbAgEAAoGB...\n-----END SM2 PRIVATE KEY-----',
            description: 'CoAP DTLS 协议国密 SM2 证书',
            createdAt: '2025-12-01 09:18:30',
        },
        {
            id: 'cert-0004',
            standard: '国密标准',
            name: '边缘网关客户端证书',
            fileName: 'edge-gateway.pfx',
            privateKey: '-----BEGIN SM2 PRIVATE KEY-----\nMIICdQIBADANBgkqhkiG9w0BAQEFAASCAl8wggJbAgEAAoGB...\n-----END SM2 PRIVATE KEY-----',
            description: '',
            createdAt: '2026-01-15 16:42:08',
        },
    ];
}
