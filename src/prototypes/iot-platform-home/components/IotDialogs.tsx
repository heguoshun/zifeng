import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import '../product-create.css';

export type DetailItem = {
    label: string;
    value: string;
};

function useDrawerBodyLock(open: boolean) {
    useEffect(() => {
        if (!open) return undefined;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [open]);
}

function handleMaskMouseDown(onClose: () => void) {
    return (event: React.MouseEvent<HTMLDivElement>) => {
        if (event.target === event.currentTarget) {
            onClose();
        }
    };
}

export function ConfirmDialog({
    title,
    message,
    onClose,
    onConfirm,
    drawerClassName = '',
}: {
    title: string;
    message: string;
    onClose: () => void;
    onConfirm: () => void;
    drawerClassName?: string;
}) {
    useDrawerBodyLock(true);

    return createPortal(
        <div className={`pcp-drawer-mask ${drawerClassName ? `${drawerClassName}-mask` : ''}`.trim()} role="presentation" onMouseDown={handleMaskMouseDown(onClose)}>
            <aside
                className={`pcp-drawer pcp-drawer--form iot-confirm-drawer ${drawerClassName}`.trim()}
                role="dialog"
                aria-modal="true"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <div className="pcp-drawer__head">
                    <h3>{title}</h3>
                    <button type="button" className="pcp-drawer__close" onClick={onClose} aria-label="关闭">×</button>
                </div>
                <div className="pcp-drawer__body">
                    <p className="iot-dialog__message">{message}</p>
                </div>
                <div className="pcp-drawer__foot">
                    <button type="button" className="pm-btn pm-btn-ghost" onClick={onClose}>取消</button>
                    <button type="button" className="pm-btn pm-btn-primary" onClick={onConfirm}>确定</button>
                </div>
            </aside>
        </div>,
        document.body,
    );
}

export function ViewDrawer({
    title,
    open,
    items,
    onClose,
    drawerClassName = '',
}: {
    title: string;
    open: boolean;
    items: DetailItem[];
    onClose: () => void;
    drawerClassName?: string;
}) {
    useDrawerBodyLock(open);

    if (!open) return null;

    return createPortal(
        <div className={`pcp-drawer-mask ${drawerClassName ? `${drawerClassName}-mask` : ''}`.trim()} role="presentation" onMouseDown={handleMaskMouseDown(onClose)}>
            <aside
                className={`pcp-drawer pcp-drawer--form iot-view-drawer ${drawerClassName}`.trim()}
                role="dialog"
                aria-modal="true"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <div className="pcp-drawer__head">
                    <h3>{title}</h3>
                    <button type="button" className="pcp-drawer__close" onClick={onClose} aria-label="关闭">×</button>
                </div>
                <div className="pcp-drawer__body iot-view-drawer__body">
                    <dl className="iot-detail-list">
                        {items.map((item) => (
                            <div key={item.label} className="iot-detail-item">
                                <dt>{item.label}</dt>
                                <dd>{item.value || '—'}</dd>
                            </div>
                        ))}
                    </dl>
                </div>
                <div className="pcp-drawer__foot">
                    <button type="button" className="pm-btn pm-btn-primary" onClick={onClose}>关闭</button>
                </div>
            </aside>
        </div>,
        document.body,
    );
}
