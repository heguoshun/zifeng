import React from 'react';
import { createPortal } from 'react-dom';
import type { SystemAnnouncementRecord } from '../data/systemAnnouncements';
import '../product-create.css';
import '../device-create.css';
import '../notice-announcement.css';

type AnnouncementViewDialogProps = {
    open: boolean;
    announcement: SystemAnnouncementRecord | null;
    onClose: () => void;
};

function TypeTag({ type }: { type: SystemAnnouncementRecord['type'] }) {
    const cls = type === '通知' ? 'na-type-tag--notice' : 'na-type-tag--announcement';
    return <span className={`na-type-tag ${cls}`}>{type}</span>;
}

export default function AnnouncementViewDialog({
    open,
    announcement,
    onClose,
}: AnnouncementViewDialogProps) {
    if (!open || !announcement) return null;

    const handleMaskMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
        if (event.target === event.currentTarget) {
            onClose();
        }
    };

    return createPortal(
        <div
            className="pcp-drawer-mask dcp-group-dialog-mask"
            role="presentation"
            onMouseDown={handleMaskMouseDown}
        >
            <aside
                className="pcp-drawer pcp-drawer--form dcp-group-dialog na-view-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="na-view-dialog-title"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <div className="pcp-drawer__head">
                    <h3 id="na-view-dialog-title">{announcement.title}</h3>
                    <button type="button" className="pcp-drawer__close" onClick={onClose} aria-label="关闭">×</button>
                </div>

                <div className="pcp-drawer__body na-view-dialog__body">
                    <div className="na-view-dialog__meta">
                        <TypeTag type={announcement.type} />
                        <span>发布人：{announcement.creator}</span>
                        <span>发布时间：{announcement.createdAt}</span>
                    </div>
                    <div
                        className="na-view-dialog__content"
                        dangerouslySetInnerHTML={{ __html: announcement.content || '<p>暂无内容</p>' }}
                    />
                </div>

                <div className="pcp-drawer__foot">
                    <button type="button" className="pm-btn pm-btn-primary" onClick={onClose}>知道了</button>
                </div>
            </aside>
        </div>,
        document.body,
    );
}
