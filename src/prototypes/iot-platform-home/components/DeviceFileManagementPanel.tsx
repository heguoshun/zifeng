import React, { useMemo, useRef, useState } from 'react';
import { FolderUp, Info } from 'lucide-react';
import { ConfirmDialog } from './IotDialogs';
import type { DeviceRecord } from '../data/devices';
import {
    calcDeviceFilesTotalSizeMb,
    createInitialDeviceFilesMap,
    DEVICE_FILE_LIMITS,
    formatDeviceFileSize,
    formatDeviceFileUploadTime,
    generateDeviceFileId,
    getDeviceFiles,
    isAllowedDeviceFile,
    type DeviceFileRecord,
} from '../data/deviceFiles';
import type { IotToastType } from './IotToast';

type DeviceFileManagementPanelProps = {
    device: DeviceRecord | null;
    readonly?: boolean;
    onShowToast: (message: string, type?: IotToastType) => void;
};

export default function DeviceFileManagementPanel({
    device,
    readonly = false,
    onShowToast,
}: DeviceFileManagementPanelProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [filesByDevice, setFilesByDevice] = useState(createInitialDeviceFilesMap);
    const [uploadDrawerOpen, setUploadDrawerOpen] = useState(false);
    const [pendingFile, setPendingFile] = useState<File | null>(null);
    const [deleteFile, setDeleteFile] = useState<DeviceFileRecord | null>(null);

    const deviceCode = device?.code;
    const files = useMemo(
        () => getDeviceFiles(filesByDevice, deviceCode),
        [deviceCode, filesByDevice],
    );
    const usedStorageMb = useMemo(() => calcDeviceFilesTotalSizeMb(files), [files]);

    const updateDeviceFiles = (nextFiles: DeviceFileRecord[]) => {
        if (!deviceCode) return;
        setFilesByDevice((prev) => ({
            ...prev,
            [deviceCode]: nextFiles,
        }));
    };

    const openUploadDrawer = () => {
        if (!deviceCode) {
            onShowToast('请先保存设备后再上传文件', 'warning');
            return;
        }
        if (files.length >= DEVICE_FILE_LIMITS.maxFileCount) {
            onShowToast(`单个设备最多上传 ${DEVICE_FILE_LIMITS.maxFileCount} 个文件`, 'warning');
            return;
        }
        setPendingFile(null);
        setUploadDrawerOpen(true);
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] ?? null;
        event.target.value = '';
        setPendingFile(file);
    };

    const handleConfirmUpload = () => {
        if (!deviceCode || !pendingFile) {
            onShowToast('请选择要上传的文件', 'warning');
            return;
        }

        if (!isAllowedDeviceFile(pendingFile)) {
            onShowToast('文件格式不支持，请上传 jpg、jpeg、png、pdf、docx 文件', 'warning');
            return;
        }

        const sizeMb = pendingFile.size / (1024 * 1024);
        if (sizeMb > DEVICE_FILE_LIMITS.maxSingleFileMb) {
            onShowToast(`单个文件体积不能超过 ${DEVICE_FILE_LIMITS.maxSingleFileMb}MB`, 'warning');
            return;
        }

        if (files.length >= DEVICE_FILE_LIMITS.maxFileCount) {
            onShowToast(`单个设备最多上传 ${DEVICE_FILE_LIMITS.maxFileCount} 个文件`, 'warning');
            return;
        }

        if (usedStorageMb + sizeMb > DEVICE_FILE_LIMITS.maxStorageMb) {
            onShowToast(`设备存储空间不足，上限 ${DEVICE_FILE_LIMITS.maxStorageMb}MB`, 'warning');
            return;
        }

        const nextFile: DeviceFileRecord = {
            id: generateDeviceFileId(),
            name: pendingFile.name,
            sizeMb,
            uploadedAt: formatDeviceFileUploadTime(),
        };

        updateDeviceFiles([nextFile, ...files]);
        setUploadDrawerOpen(false);
        setPendingFile(null);
        onShowToast(`「${pendingFile.name}」上传成功`, 'success');
    };

    const handleView = (file: DeviceFileRecord) => {
        onShowToast(`查看文件「${file.name}」（原型）`);
    };

    const handleDownload = (file: DeviceFileRecord) => {
        onShowToast(`开始下载「${file.name}」（原型）`);
    };

    const handleConfirmDelete = () => {
        if (!deleteFile) return;
        updateDeviceFiles(files.filter((item) => item.id !== deleteFile.id));
        onShowToast(`「${deleteFile.name}」已删除`, 'success');
        setDeleteFile(null);
    };

    return (
        <>
            <section className="panel dcp-panel dcp-file-panel">
                <div className="dcs-toolbar dcp-file-toolbar">
                    <p className="dcp-file-quota">
                        <Info size={14} aria-hidden="true" />
                        单个设备存储空间 {formatDeviceFileSize(usedStorageMb)} / {DEVICE_FILE_LIMITS.maxStorageMb}MB，
                        文件数量 {files.length} / {DEVICE_FILE_LIMITS.maxFileCount}
                    </p>
                    {!readonly && (
                        <button type="button" className="pm-btn pm-btn-primary" onClick={openUploadDrawer}>
                            文件上传
                        </button>
                    )}
                </div>

                <div className="pcp-table-wrap">
                    <table className="pcp-table pcp-table--device-file">
                        <thead>
                            <tr>
                                <th>序号</th>
                                <th>文件ID</th>
                                <th>文件名称</th>
                                <th>文件大小</th>
                                <th>上传时间</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {files.map((file, index) => (
                                <tr key={file.id}>
                                    <td>{index + 1}</td>
                                    <td>{file.id}</td>
                                    <td>{file.name}</td>
                                    <td>{formatDeviceFileSize(file.sizeMb)}</td>
                                    <td>{file.uploadedAt}</td>
                                    <td>
                                        <div className="dai-table-actions">
                                            <button type="button" onClick={() => handleView(file)}>查看</button>
                                            <button type="button" onClick={() => handleDownload(file)}>下载</button>
                                            {!readonly && (
                                                <button type="button" onClick={() => setDeleteFile(file)}>删除</button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {!files.length && (
                                <tr>
                                    <td colSpan={6} className="pcp-empty-cell">
                                        {device ? '暂无文件，可点击右上角上传' : '请先保存设备后管理文件'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            {uploadDrawerOpen && (
                <>
                    <div className="pcp-drawer-mask" onClick={() => setUploadDrawerOpen(false)} />
                    <aside className="pcp-drawer pcp-drawer--form dcp-file-upload-drawer" style={{ position: 'fixed', zIndex: 120 }}>
                        <div className="pcp-drawer__head">
                            <h3>文件上传</h3>
                            <button type="button" className="pcp-drawer__close" onClick={() => setUploadDrawerOpen(false)}>×</button>
                        </div>
                        <div className="pcp-drawer__body pcp-drawer__body--form">
                            <div className="pcp-drawer-field">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    className="dcp-file-input"
                                    accept={DEVICE_FILE_LIMITS.acceptExtensions.join(',')}
                                    onChange={handleFileChange}
                                />
                                <button
                                    type="button"
                                    className="dcp-file-upload-btn"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <FolderUp size={16} />
                                    上传文件
                                </button>
                                {pendingFile && (
                                    <div className="dcp-file-upload-name">{pendingFile.name}</div>
                                )}
                                <p className="pcp-upload-tip">
                                    文件格式：jpg、jpeg、png、pdf、docx文件；单个文件体积不超过2 M
                                </p>
                            </div>
                        </div>
                        <div className="pcp-drawer__foot">
                            <button type="button" className="pm-btn pm-btn-ghost" onClick={() => setUploadDrawerOpen(false)}>取消</button>
                            <button type="button" className="pm-btn pm-btn-primary" onClick={handleConfirmUpload}>确定</button>
                        </div>
                    </aside>
                </>
            )}

            {deleteFile && (
                <ConfirmDialog
                    title="删除文件"
                    message={`确定要删除文件「${deleteFile.name}」吗？`}
                    onClose={() => setDeleteFile(null)}
                    onConfirm={handleConfirmDelete}
                />
            )}
        </>
    );
}
