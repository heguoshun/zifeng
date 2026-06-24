export type SystemPositionRecord = {
    id: string;
    positionCode: string;
    name: string;
    sort: number;
    status: SystemPositionStatus;
    createdAt: string;
};

export type SystemPositionStatus = '正常' | '停用';

export const SYSTEM_POSITION_STATUS_OPTIONS = ['全部', '正常', '停用'] as const;

export function generatePositionId(): string {
    return `pos-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

export function generatePositionCode(): string {
    positionCodeCounter += 1;
    return `pos_${String(positionCodeCounter).padStart(4, '0')}`;
}

let positionCodeCounter = 0;

export function formatPositionNow(): string {
    const now = new Date();
    const pad = (value: number) => String(value).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} `
        + `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

export function createInitialPositions(): SystemPositionRecord[] {
    return [
        {
            id: '1926166165840805889',
            positionCode: 'jl_1',
            name: '总经理',
            sort: 4,
            status: '正常',
            createdAt: '2025-05-24 14:39:35',
        },
        {
            id: '1926167699869745154',
            positionCode: 'ds_01',
            name: '董事长',
            sort: 5,
            status: '正常',
            createdAt: '2025-05-24 14:45:40',
        },
        {
            id: '1926170001000000001',
            positionCode: 'js_01',
            name: '技术总监',
            sort: 3,
            status: '正常',
            createdAt: '2025-06-01 09:12:18',
        },
        {
            id: '1926170001000000002',
            positionCode: 'cw_01',
            name: '财务经理',
            sort: 2,
            status: '正常',
            createdAt: '2025-06-03 10:30:05',
        },
        {
            id: '1926170001000000003',
            positionCode: 'xs_01',
            name: '销售经理',
            sort: 6,
            status: '停用',
            createdAt: '2025-06-05 16:22:41',
        },
        {
            id: '1926170001000000004',
            positionCode: 'rs_01',
            name: '人事主管',
            sort: 1,
            status: '正常',
            createdAt: '2025-06-08 08:55:30',
        },
        {
            id: '1926170001000000005',
            positionCode: 'yy_01',
            name: '运营专员',
            sort: 7,
            status: '正常',
            createdAt: '2025-06-10 11:18:12',
        },
        {
            id: '1926170001000000006',
            positionCode: 'kf_01',
            name: '客服代表',
            sort: 8,
            status: '停用',
            createdAt: '2025-06-12 14:05:33',
        },
    ];
}

export function filterPositions(
    positions: SystemPositionRecord[],
    code: string,
    name: string,
    status: string,
): SystemPositionRecord[] {
    return positions.filter((p) => {
        if (code && !p.positionCode.toLowerCase().includes(code.toLowerCase())) return false;
        if (name && !p.name.toLowerCase().includes(name.toLowerCase())) return false;
        if (status && status !== '全部' && p.status !== status) return false;
        return true;
    });
}

export function getPositionLabel(positions: SystemPositionRecord[], positionId: string): string {
    if (!positionId) return '—';
    return positions.find((item) => item.id === positionId)?.name ?? '—';
}

export function getActivePositions(positions: SystemPositionRecord[]): SystemPositionRecord[] {
    return positions
        .filter((item) => item.status === '正常')
        .sort((a, b) => a.sort - b.sort);
}
