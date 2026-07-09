import React, {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
} from 'react';
import {
    createInitialAnnouncements,
    type SystemAnnouncementRecord,
} from '../data/systemAnnouncements';
import AnnouncementViewDialog from './AnnouncementViewDialog';

type AnnouncementNotificationContextValue = {
    announcements: SystemAnnouncementRecord[];
    setAnnouncements: React.Dispatch<React.SetStateAction<SystemAnnouncementRecord[]>>;
    publishedAnnouncements: SystemAnnouncementRecord[];
    unreadAnnouncementCount: number;
    isAnnouncementUnread: (id: string) => boolean;
    markAnnouncementRead: (id: string) => void;
    markAllAnnouncementsRead: () => void;
    notifyAnnouncementPublished: (id: string) => void;
    openAnnouncement: (id: string) => void;
};

const AnnouncementNotificationContext = createContext<AnnouncementNotificationContextValue | null>(null);

export function useAnnouncementNotifications() {
    const context = useContext(AnnouncementNotificationContext);
    if (!context) {
        throw new Error('useAnnouncementNotifications must be used within AnnouncementNotificationProvider');
    }
    return context;
}

export function AnnouncementNotificationProvider({ children }: { children: React.ReactNode }) {
    const [announcements, setAnnouncements] = useState(createInitialAnnouncements);
    const [readAnnouncementIds, setReadAnnouncementIds] = useState<string[]>([]);
    const [viewingAnnouncementId, setViewingAnnouncementId] = useState<string | null>(null);

    const publishedAnnouncements = useMemo(
        () => announcements.filter((item) => item.status === '发布'),
        [announcements],
    );

    const unreadAnnouncementCount = useMemo(
        () => publishedAnnouncements.filter((item) => !readAnnouncementIds.includes(item.id)).length,
        [publishedAnnouncements, readAnnouncementIds],
    );

    const isAnnouncementUnread = useCallback(
        (id: string) => !readAnnouncementIds.includes(id),
        [readAnnouncementIds],
    );

    const markAnnouncementRead = useCallback((id: string) => {
        setReadAnnouncementIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    }, []);

    const markAllAnnouncementsRead = useCallback(() => {
        setReadAnnouncementIds(publishedAnnouncements.map((item) => item.id));
    }, [publishedAnnouncements]);

    const notifyAnnouncementPublished = useCallback((id: string) => {
        setReadAnnouncementIds((prev) => prev.filter((item) => item !== id));
    }, []);

    const openAnnouncement = useCallback((id: string) => {
        setViewingAnnouncementId(id);
        markAnnouncementRead(id);
    }, [markAnnouncementRead]);

    const viewingAnnouncement = useMemo(
        () => announcements.find((item) => item.id === viewingAnnouncementId) ?? null,
        [announcements, viewingAnnouncementId],
    );

    const value = useMemo(
        () => ({
            announcements,
            setAnnouncements,
            publishedAnnouncements,
            unreadAnnouncementCount,
            isAnnouncementUnread,
            markAnnouncementRead,
            markAllAnnouncementsRead,
            notifyAnnouncementPublished,
            openAnnouncement,
        }),
        [
            announcements,
            publishedAnnouncements,
            unreadAnnouncementCount,
            isAnnouncementUnread,
            markAnnouncementRead,
            markAllAnnouncementsRead,
            notifyAnnouncementPublished,
            openAnnouncement,
        ],
    );

    return (
        <AnnouncementNotificationContext.Provider value={value}>
            {children}
            <AnnouncementViewDialog
                open={viewingAnnouncement !== null}
                announcement={viewingAnnouncement}
                onClose={() => setViewingAnnouncementId(null)}
            />
        </AnnouncementNotificationContext.Provider>
    );
}

export function stripAnnouncementHtml(html: string): string {
    return html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
}
