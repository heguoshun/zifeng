export type SpacePickerNodeType = 'campus' | 'building' | 'floor' | 'room';

export type SpacePickerNode = {
    id: string;
    label: string;
    type: SpacePickerNodeType;
    children?: SpacePickerNode[];
    mapPosition?: { x: number; y: number };
};

export const SPACE_PICKER_TREE: SpacePickerNode[] = [
    {
        id: 'campus-yunmi',
        label: '云密城',
        type: 'campus',
        children: [
            {
                id: 'building-jiahuan',
                label: '嘉环大厦',
                type: 'building',
                mapPosition: { x: 42, y: 38 },
                children: [
                    {
                        id: 'floor-jiahuan-1',
                        label: '1楼',
                        type: 'floor',
                        children: [
                            { id: 'room-jiahuan-101', label: '101房间', type: 'room' },
                            { id: 'room-jiahuan-102', label: '102房间', type: 'room' },
                            { id: 'room-jiahuan-103', label: '103房间', type: 'room' },
                            { id: 'room-jiahuan-104', label: '104房间', type: 'room' },
                        ],
                    },
                    {
                        id: 'floor-jiahuan-2',
                        label: '2楼',
                        type: 'floor',
                        children: [
                            { id: 'room-jiahuan-201', label: '201房间', type: 'room' },
                            { id: 'room-jiahuan-202', label: '202房间', type: 'room' },
                        ],
                    },
                    {
                        id: 'floor-jiahuan-3',
                        label: '3楼',
                        type: 'floor',
                        children: [
                            { id: 'room-jiahuan-301', label: '301房间', type: 'room' },
                            { id: 'room-jiahuan-302', label: '302房间', type: 'room' },
                        ],
                    },
                ],
            },
            {
                id: 'building-chengmai',
                label: '诚迈科技',
                type: 'building',
                mapPosition: { x: 58, y: 52 },
                children: [
                    {
                        id: 'floor-chengmai-1',
                        label: '1楼',
                        type: 'floor',
                        children: [
                            { id: 'room-chengmai-101', label: '101房间', type: 'room' },
                            { id: 'room-chengmai-102', label: '102房间', type: 'room' },
                        ],
                    },
                ],
            },
            {
                id: 'building-anxun',
                label: '安迅大厦',
                type: 'building',
                mapPosition: { x: 72, y: 34 },
                children: [
                    {
                        id: 'floor-anxun-1',
                        label: '1楼',
                        type: 'floor',
                        children: [
                            { id: 'room-anxun-101', label: '101房间', type: 'room' },
                            { id: 'room-anxun-102', label: '102房间', type: 'room' },
                        ],
                    },
                ],
            },
        ],
    },
];

export function findSpaceNode(tree: SpacePickerNode[], id: string): SpacePickerNode | null {
    for (const node of tree) {
        if (node.id === id) return node;
        if (node.children) {
            const found = findSpaceNode(node.children, id);
            if (found) return found;
        }
    }
    return null;
}

export function findSpacePath(tree: SpacePickerNode[], id: string): SpacePickerNode[] {
    function dfs(nodes: SpacePickerNode[], trail: SpacePickerNode[]): SpacePickerNode[] | null {
        for (const node of nodes) {
            const nextTrail = [...trail, node];
            if (node.id === id) return nextTrail;
            if (node.children) {
                const found = dfs(node.children, nextTrail);
                if (found) return found;
            }
        }
        return null;
    }

    return dfs(tree, []) ?? [];
}

export function getSpacePathLabel(path: SpacePickerNode[]) {
    return path.map((node) => node.label).join(' / ');
}

export function getBuildings(campus: SpacePickerNode) {
    return campus.children?.filter((node) => node.type === 'building') ?? [];
}

export function getFloors(building: SpacePickerNode) {
    return building.children?.filter((node) => node.type === 'floor') ?? [];
}

export function getRooms(floor: SpacePickerNode) {
    return floor.children?.filter((node) => node.type === 'room') ?? [];
}

export function getDeepestNode(path: SpacePickerNode[]) {
    return path[path.length - 1] ?? null;
}
