import React, { useEffect, useState } from 'react';
import { generateSystemUserPassword } from '../data/systemUsers';
import '../user-management.css';

type UserPasswordDialogProps = {
    open: boolean;
    onClose: () => void;
    onConfirm: (password: string) => void;
    onCopySuccess?: () => void;
};

export default function UserPasswordDialog({
    open,
    onClose,
    onConfirm,
    onCopySuccess,
}: UserPasswordDialogProps) {
    const [password, setPassword] = useState('');

    useEffect(() => {
        if (!open) return;
        setPassword(generateSystemUserPassword());
    }, [open]);

    if (!open) return null;

    const handleCopy = async () => {
        if (!password) return;
        try {
            await navigator.clipboard.writeText(password);
            onCopySuccess?.();
        } catch {
            const textarea = document.createElement('textarea');
            textarea.value = password;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            onCopySuccess?.();
        }
    };

    return (
        <div className="iot-dialog-mask" role="presentation" onClick={onClose}>
            <div
                className="iot-dialog iot-dialog--confirm um-password-dialog-panel"
                role="dialog"
                aria-modal="true"
                aria-labelledby="um-password-dialog-message"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="iot-dialog__body um-password-dialog__body">
                    <div className="um-password-dialog__content">
                        <span className="um-password-dialog__icon" aria-hidden="true">?</span>
                        <div className="um-password-dialog__main">
                            <p id="um-password-dialog-message" className="um-password-dialog__message">
                                密码修改为：{password}
                            </p>
                            <button
                                type="button"
                                className="um-password-dialog__copy"
                                onClick={handleCopy}
                            >
                                复制密码
                            </button>
                        </div>
                    </div>
                </div>
                <div className="iot-dialog__foot um-password-dialog__foot">
                    <button type="button" className="pm-btn pm-btn-ghost" onClick={onClose}>取消</button>
                    <button
                        type="button"
                        className="pm-btn pm-btn-primary"
                        disabled={!password.trim()}
                        onClick={() => onConfirm(password.trim())}
                    >
                        确定
                    </button>
                </div>
            </div>
        </div>
    );
}
