import React, { useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Upload, FileText, AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { DeviceRecord } from '../data/devices';
import { isLargeMeterDevice, resolveDeviceProduct, STATUS_LABEL, type DeviceStatus } from '../data/devices';
import type { ProductRecord } from '../data/products';
import type { LargeMeterArea } from '../data/largeMeters';
import '../device-management.css';
import '../area-config.css';

type ImportDevicesDialogProps = {
    open: boolean;
    area: LargeMeterArea;
    devices: DeviceRecord[];
    products: ProductRecord[];
    onClose: () => void;
    onConfirm: (deviceIds: string[]) => void;
};

type ParseResult = {
    code: string;
    device: DeviceRecord | null;
    productName: string;
    status: DeviceStatus | null;
    alreadyBoundTo: string | null; // 已关联的片区名称
    isLargeMeter: boolean;
};

function parseCSV(text: string): string[] {
    const codes: string[] = [];
    const lines = text.split(/\r?\n/);
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        // 取第一列（逗号或 tab 分隔）
        const firstCol = trimmed.split(/[,\t]/)[0].replace(/^"|"$/g, '').trim();
        if (firstCol) codes.push(firstCol);
    }
    return Array.from(new Set(codes));
}

function DeviceStatusTag({ status }: { status: DeviceStatus }) {
    return (
        <span className={`dm-status-tag dm-status-tag--${status}`}>
            {STATUS_LABEL[status]}
        </span>
    );
}

export default function ImportDevicesDialog({
    open,
    area,
    devices,
    products,
    onClose,
    onConfirm,
}: ImportDevicesDialogProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [dragOver, setDragOver] = useState(false);
    const [fileName, setFileName] = useState('');
    const [parsedCodes, setParsedCodes] = useState<string[]>([]);
    const [error, setError] = useState('');

    const parseResults = useMemo<ParseResult[]>(() => {
        return parsedCodes.map((code) => {
            const device = devices.find((d) => d.code === code) ?? null;
            const isLM = device ? isLargeMeterDevice(device, products) : false;
            const { productName } = device ? resolveDeviceProduct(device, products) : { productName: '—' };
            return {
                code,
                device,
                productName,
                status: device?.status ?? null,
                alreadyBoundTo: device?.largeMeterAreaId && device.largeMeterAreaId !== area.id
                    ? `已关联其他片区`
                    : null,
                isLargeMeter: isLM,
            };
        });
    }, [parsedCodes, devices, products, area.id]);

    const stats = useMemo(() => {
        const matched = parseResults.filter((r) => r.device !== null);
        const unmatched = parseResults.filter((r) => r.device === null);
        const largeMeter = matched.filter((r) => r.isLargeMeter);
        const nonLargeMeter = matched.filter((r) => !r.isLargeMeter);
        const willOverwrite = matched.filter((r) => r.device?.largeMeterAreaId && r.device.largeMeterAreaId !== area.id);
        const alreadyHere = matched.filter((r) => r.device?.largeMeterAreaId === area.id);
        return { matched, unmatched, largeMeter, nonLargeMeter, willOverwrite, alreadyHere };
    }, [parseResults]);

    const bindableIds = useMemo(
        () => stats.largeMeter.map((r) => r.device!.id),
        [stats.largeMeter],
    );
    const canConfirm = bindableIds.length > 0;

    const handleFile = (file: File) => {
        setError('');
        setFileName(file.name);
        const reader = new FileReader();
        reader.onload = () => {
            const text = reader.result as string;
            const codes = parseCSV(text);
            if (codes.length === 0) {
                setError('文件中未解析到有效的设备编号');
                setParsedCodes([]);
                return;
            }
            setParsedCodes(codes);
        };
        reader.onerror = () => {
            setError('文件读取失败，请重试');
        };
        reader.readAsText(file);
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) handleFile(file);
        // 重置以便重复选择同一文件
        event.target.value = '';
    };

    const handleDrop = (event: React.DragEvent) => {
        event.preventDefault();
        setDragOver(false);
        const file = event.dataTransfer.files?.[0];
        if (file) handleFile(file);
    };

    const handleDragOver = (event: React.DragEvent) => {
        event.preventDefault();
        setDragOver(true);
    };

    const handleDragLeave = () => {
        setDragOver(false);
    };

    const handleMaskMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
        if (event.target === event.currentTarget) onClose();
    };

    if (!open) return null;

    return createPortal(
        <div
            className="pcp-drawer-mask dcp-group-dialog-mask"
            role="presentation"
            onMouseDown={handleMaskMouseDown}
        >
            <aside
                className="pcp-drawer pcp-drawer--form dcp-group-dialog"
                style={{ width: '780px', maxWidth: '95vw' }}
                role="dialog"
                aria-modal="true"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <div className="pcp-drawer__head">
                    <h3>导入设备到「{area.name}」</h3>
                    <button type="button" className="pcp-drawer__close" onClick={onClose} aria-label="关闭">×</button>
                </div>

                <div className="pcp-drawer__body pcp-drawer__body--form" style={{ padding: '16px 20px' }}>
                    <div className="id-upload-info">
                        <p>上传 CSV 文件，第一列为设备编号。系统将自动匹配设备并绑定到当前片区。</p>
                    </div>

                    <div
                        className={`id-upload-zone ${dragOver ? 'is-dragover' : ''} ${fileName ? 'has-file' : ''}`}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".csv,.txt"
                            style={{ display: 'none' }}
                            onChange={handleFileChange}
                        />
                        {fileName ? (
                            <div className="id-upload-file">
                                <FileText size={18} />
                                <span>{fileName}</span>
                                <button
                                    type="button"
                                    className="pm-link-btn"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setFileName('');
                                        setParsedCodes([]);
                                        setError('');
                                    }}
                                >
                                    重新选择
                                </button>
                            </div>
                        ) : (
                            <div className="id-upload-placeholder">
                                <Upload size={24} />
                                <span>拖拽 CSV 文件到此处，或点击选择文件</span>
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="id-upload-error">
                            <AlertTriangle size={14} />
                            <span>{error}</span>
                        </div>
                    )}

                    {parsedCodes.length > 0 && (
                        <div className="id-result-summary">
                            <div className="id-result-stats">
                                <span>
                                    共解析 <strong>{parsedCodes.length}</strong> 条设备编号
                                </span>
                                <span className="id-stat-match">
                                    <CheckCircle2 size={14} />
                                    匹配 <strong>{stats.matched.length}</strong> 条
                                </span>
                                {stats.unmatched.length > 0 && (
                                    <span className="id-stat-unmatch">
                                        <AlertTriangle size={14} />
                                        未匹配 <strong>{stats.unmatched.length}</strong> 条
                                    </span>
                                )}
                                {stats.willOverwrite.length > 0 && (
                                    <span className="id-stat-overwrite">
                                        <AlertTriangle size={14} />
                                        将覆盖 <strong>{stats.willOverwrite.length}</strong> 条已有片区
                                    </span>
                                )}
                                {stats.alreadyHere.length > 0 && (
                                    <span className="id-stat-already">
                                        已在本片区 <strong>{stats.alreadyHere.length}</strong> 条（跳过）
                                    </span>
                                )}
                            </div>

                            {stats.nonLargeMeter.length > 0 && (
                                <p className="id-result-hint">
                                    其中 {stats.nonLargeMeter.length} 条匹配设备非大表产品，不会纳入绑定。
                                </p>
                            )}

                            <div className="pm-table-wrap" style={{ border: '1px solid #dcdfe6', borderRadius: '4px', maxHeight: '260px', overflow: 'auto' }}>
                                <table className="pm-table" style={{ minWidth: 0, width: '100%', tableLayout: 'fixed' }}>
                                    <thead>
                                        <tr>
                                            <th style={{ width: '130px', padding: '8px 12px' }}>设备编号</th>
                                            <th style={{ width: 'auto', padding: '8px 12px' }}>设备名称</th>
                                            <th style={{ width: '110px', padding: '8px 12px' }}>所属产品</th>
                                            <th style={{ width: '70px', padding: '8px 12px' }}>状态</th>
                                            <th style={{ width: '130px', padding: '8px 12px' }}>匹配结果</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {parseResults.map((r) => (
                                            <tr key={r.code}>
                                                <td style={{ padding: '7px 12px' }}>{r.code}</td>
                                                <td style={{ padding: '7px 12px' }}>{r.device?.name ?? '—'}</td>
                                                <td style={{ padding: '7px 12px' }}>{r.productName}</td>
                                                <td style={{ padding: '7px 12px' }}>
                                                    {r.status ? <DeviceStatusTag status={r.status} /> : '—'}
                                                </td>
                                                <td style={{ padding: '7px 12px' }}>
                                                    {!r.device ? (
                                                        <span className="id-match-badge id-match-badge--unmatch">未匹配</span>
                                                    ) : !r.isLargeMeter ? (
                                                        <span className="id-match-badge id-match-badge--skip">非大表</span>
                                                    ) : r.device?.largeMeterAreaId === area.id ? (
                                                        <span className="id-match-badge id-match-badge--skip">已在片区</span>
                                                    ) : r.alreadyBoundTo ? (
                                                        <span className="id-match-badge id-match-badge--overwrite">将覆盖</span>
                                                    ) : (
                                                        <span className="id-match-badge id-match-badge--bind">可绑定</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {canConfirm && (
                                <p className="id-confirm-summary">
                                    确认后，将绑定 <strong>{bindableIds.length}</strong> 台大表设备到当前片区。
                                </p>
                            )}
                        </div>
                    )}
                </div>

                <div className="pcp-drawer__foot">
                    <button type="button" className="pm-btn pm-btn-ghost" onClick={onClose}>取消</button>
                    <button
                        type="button"
                        className="pm-btn pm-btn-primary"
                        disabled={!canConfirm}
                        onClick={() => onConfirm(bindableIds)}
                    >
                        确认导入
                    </button>
                </div>
            </aside>
        </div>,
        document.body,
    );
}
