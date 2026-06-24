import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FolderUp } from 'lucide-react';
import '../product-create.css';
import '../file-management.css';

type FileUploadDrawerProps = {
    open: boolean;
    onClose: () => void;
    onConfirm: (file: File) => void;
};

export default function FileUploadDrawer({
    open,
    onClose,
    onConfirm,
}: FileUploadDrawerProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [pendingFile, setPendingFile] = useState<File | null>(null);

    useEffect(() => {
        if (!open) return undefined;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [open]);

    useEffect(() => {
        if (!open) return;
        setPendingFile(null);
    }, [open]);

    if (!open) return null;

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] ?? null;
        event.target.value = '';
        setPendingFile(file);
    };

    const handleConfirm = () => {
        if (!pendingFile) return;
        onConfirm(pendingFile);
    };

    const handleMaskMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
        if (event.target === event.currentTarget) {
            onClose();
        }
    };

    return createPortal(
        <div className="pcp-drawer-mask" role="presentation" onMouseDown={handleMaskMouseDown}>
            <aside
                className="pcp-drawer pcp-drawer--form fm-upload-drawer"
                role="dialog"
                aria-modal="true"
                aria-labelledby="fm-upload-drawer-title"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <div className="pcp-drawer__head">
                    <h3 id="fm-upload-drawer-title">上传文件</h3>
                    <button type="button" className="pcp-drawer__close" onClick={onClose} aria-label="关闭">×</button>
                </div>

                <div className="pcp-drawer__body pcp-drawer__body--form">
                    <div className="pcp-drawer-field">
                        <input
                            ref={fileInputRef}
                            type="file"
                            className="fm-file-input"
                            onChange={handleFileChange}
                        />
                        <button
                            type="button"
                            className="fm-file-upload-btn"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <FolderUp size={16} />
                            选择文件
                        </button>
                        {pendingFile ? (
                            <div className="fm-file-upload-name">{pendingFile.name}</div>
                        ) : (
                            <p className="fm-upload-tip">支持常见文档、表格、图片等格式</p>
                        )}
                    </div>
                </div>

                <div className="pcp-drawer__foot">
                    <button type="button" className="pm-btn pm-btn-ghost" onClick={onClose}>取消</button>
                    <button
                        type="button"
                        className="pm-btn pm-btn-primary"
                        disabled={!pendingFile}
                        onClick={handleConfirm}
                    >
                        确定
                    </button>
                </div>
            </aside>
        </div>,
        document.body,
    );
}
