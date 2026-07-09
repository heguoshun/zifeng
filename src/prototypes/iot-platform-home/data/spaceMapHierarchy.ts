export type SpaceMapNode = {
    id: string;
    label: string;
    x?: number;
    y?: number;
    children?: SpaceMapNode[];
};

export const SPACE_MAP_ROOT: SpaceMapNode[] = [
    {
        id: 'yunmi-city',
        label: '云密城',
        children: [
            {
                id: 'building-jiahuan',
                label: '嘉环大厦',
                x: 42,
                y: 38,
                children: [
                    {
                        id: 'floor-1',
                        label: '1楼',
                        children: [
                            { id: 'room-101', label: '101房间', x: 12.5, y: 8.3 },
                            { id: 'room-102', label: '102房间', x: 18.2, y: 9.1 },
                            { id: 'room-103', label: '103房间', x: 24.6, y: 10.4 },
                            { id: 'room-104', label: '104房间', x: 31.0, y: 11.2 },
                        ],
                    },
                    {
                        id: 'floor-2',
                        label: '2楼',
                        children: [
                            { id: 'room-201', label: '201房间', x: 14.0, y: 15.6 },
                            { id: 'room-202', label: '202房间', x: 20.5, y: 16.8 },
                            { id: 'room-203', label: '203房间', x: 27.3, y: 17.5 },
                        ],
                    },
                    {
                        id: 'floor-3',
                        label: '3楼',
                        children: [
                            { id: 'room-301', label: '301房间', x: 16.8, y: 22.4 },
                            { id: 'room-302', label: '302房间', x: 23.1, y: 23.0 },
                        ],
                    },
                ],
            },
            {
                id: 'building-chengmai',
                label: '诚迈科技',
                x: 58,
                y: 46,
                children: [
                    {
                        id: 'floor-cm-1',
                        label: '1楼',
                        children: [
                            { id: 'room-cm-101', label: '101房间', x: 55.2, y: 44.5 },
                            { id: 'room-cm-102', label: '102房间', x: 61.8, y: 45.3 },
                        ],
                    },
                    {
                        id: 'floor-cm-2',
                        label: '2楼',
                        children: [
                            { id: 'room-cm-201', label: '201房间', x: 57.4, y: 50.1 },
                        ],
                    },
                ],
            },
            {
                id: 'building-anxun',
                label: '安迅大厦',
                x: 72,
                y: 52,
                children: [
                    {
                        id: 'floor-ax-1',
                        label: '1楼',
                        children: [
                            { id: 'room-ax-101', label: '101房间', x: 70.5, y: 51.2 },
                            { id: 'room-ax-102', label: '102房间', x: 76.3, y: 52.8 },
                        ],
                    },
                ],
            },
        ],
    },
];

export const SPACE_MAP_BUILDINGS = [
    { id: 'building-jiahuan', label: 'C栋', x: 38, y: 34 },
    { id: 'building-chengmai', label: 'D栋', x: 48, y: 40 },
    { id: 'building-anxun', label: 'E栋', x: 58, y: 46 },
    { id: 'pin-f', label: 'F栋', x: 66, y: 52 },
    { id: 'pin-g', label: 'G栋', x: 74, y: 58 },
    { id: 'pin-h', label: 'H栋', x: 28, y: 56 },
    { id: 'pin-i', label: 'I栋', x: 36, y: 62 },
    { id: 'pin-j', label: 'J栋', x: 52, y: 68 },
    { id: 'pin-k', label: 'K栋', x: 64, y: 72 },
] as const;

export function findSpacePath(nodes: SpaceMapNode[], targetId: string, trail: SpaceMapNode[] = []): SpaceMapNode[] | null {
    for (const node of nodes) {
        const nextTrail = [...trail, node];
        if (node.id === targetId) return nextTrail;
        if (node.children) {
            const found = findSpacePath(node.children, targetId, nextTrail);
            if (found) return found;
        }
    }
    return null;
}

export function formatSpacePath(path: SpaceMapNode[]) {
    return path.map((node) => node.label).join(' / ');
}

export function getNodeById(nodes: SpaceMapNode[], id: string): SpaceMapNode | null {
    for (const node of nodes) {
        if (node.id === id) return node;
        if (node.children) {
            const found = getNodeById(node.children, id);
            if (found) return found;
        }
    }
    return null;
}
