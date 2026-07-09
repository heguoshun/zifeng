export type AnnouncementType = '通知' | '公告';

export type AnnouncementStatus = '发布' | '草稿';

export type SystemAnnouncementRecord = {
    id: string;
    title: string;
    type: AnnouncementType;
    status: AnnouncementStatus;
    content: string;
    creator: string;
    createdAt: string;
};

export const ANNOUNCEMENT_TYPE_OPTIONS = ['全部', '通知', '公告'] as const;

export const ANNOUNCEMENT_STATUS_OPTIONS = ['发布', '草稿'] as const;

let announcementIdCounter = 0;

export function generateAnnouncementId(): string {
    announcementIdCounter += 1;
    return `ann-${Date.now()}-${announcementIdCounter}`;
}

export function formatAnnouncementNow(): string {
    const now = new Date();
    const pad = (value: number) => String(value).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} `
        + `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

export function createInitialAnnouncements(): SystemAnnouncementRecord[] {
    return [
        {
            id: '1926180001000000001',
            title: '系统升级维护通知',
            type: '通知',
            status: '发布',
            content: '<p>平台将于 2026-06-25 22:00 至 23:00 进行系统升级维护，期间部分功能可能暂时不可用，请提前安排相关工作。</p>',
            creator: 'admin',
            createdAt: '2026-06-22 10:23:55',
        },
        {
            id: '1926180001000000002',
            title: '物联网设备接入规范更新公告',
            type: '公告',
            status: '发布',
            content: '<p>为提升设备接入质量，平台已更新设备接入规范文档，请各租户管理员及时查阅并按要求调整。</p>',
            creator: 'admin',
            createdAt: '2026-06-20 14:08:12',
        },
        {
            id: '1926180001000000003',
            title: '端午节放假安排',
            type: '通知',
            status: '草稿',
            content: '<p>端午节期间平台运维团队将安排值班保障，如有紧急问题请联系技术支持。</p>',
            creator: 'superadmin',
            createdAt: '2026-06-18 09:15:40',
        },
    ];
}

export function filterAnnouncements(
    announcements: SystemAnnouncementRecord[],
    title: string,
    operator: string,
    type: string,
): SystemAnnouncementRecord[] {
    return announcements.filter((item) => {
        if (title && !item.title.toLowerCase().includes(title.toLowerCase())) return false;
        if (operator && !item.creator.toLowerCase().includes(operator.toLowerCase())) return false;
        if (type && type !== '全部' && item.type !== type) return false;
        return true;
    });
}
