export type SpaceNodeType = 'campus' | 'building' | 'floor' | 'room';

export type MapLevel = 'campus' | 'building' | 'floor';

export type SpaceConfigNode = {
    id: string;
    label: string;
    type: SpaceNodeType;
    children?: SpaceConfigNode[];
    mapPosition?: { x: number; y: number };
    departmentId?: string;
    description?: string;
    imageUrl?: string;
};

/**
 * 园区楼栋标注坐标（对齐 space-campus-map 干净底图）
 * 底图建筑立面红字为 B/C/D/E/F，A 栋在远景左侧
 */
const CAMPUS_BUILDING_POSITIONS: Array<{ id: string; label: string; x: number; y: number }> = [
    { id: 'building-a', label: 'A栋', x: 22, y: 30 },
    { id: 'building-b', label: 'B栋', x: 27, y: 41 },
    { id: 'building-c', label: 'C栋', x: 35, y: 45 },
    { id: 'building-d', label: 'D栋', x: 43, y: 43 },
    { id: 'building-e', label: 'E栋', x: 51, y: 41 },
    { id: 'building-f', label: 'F栋', x: 60, y: 47 },
];

function createBuildingNode(
    id: string,
    label: string,
    position: { x: number; y: number },
    floors: SpaceConfigNode[],
): SpaceConfigNode {
    return { id, label, type: 'building', mapPosition: position, children: floors };
}

/** 租户根目录下的空间组织结构 */
export const SPACE_CONFIG_ROOT: SpaceConfigNode = {
    id: 'campus-yunmi',
    label: '云密城',
    type: 'campus',
    children: CAMPUS_BUILDING_POSITIONS.map(({ id, label, x, y }) => {
        if (id === 'building-a') {
            return createBuildingNode(id, label, { x, y }, [
                {
                    id: 'floor-a-4',
                    label: '4层',
                    type: 'floor',
                    children: [
                        { id: 'room-a-401', label: '401', type: 'room', mapPosition: { x: 38, y: 32 } },
                        { id: 'room-a-402', label: '402', type: 'room', mapPosition: { x: 45, y: 35 } },
                        { id: 'room-a-403', label: '403', type: 'room', mapPosition: { x: 52, y: 38 } },
                        { id: 'room-a-404', label: '404', type: 'room', mapPosition: { x: 58, y: 42 } },
                        { id: 'room-a-405', label: '405', type: 'room', mapPosition: { x: 65, y: 45 } },
                    ],
                },
                {
                    id: 'floor-a-5',
                    label: '5层',
                    type: 'floor',
                    children: [
                        { id: 'room-a-501', label: '501', type: 'room', mapPosition: { x: 42, y: 36 } },
                        { id: 'room-a-502', label: '502', type: 'room', mapPosition: { x: 55, y: 40 } },
                    ],
                },
                {
                    id: 'floor-a-6',
                    label: '6层',
                    type: 'floor',
                    children: [
                        { id: 'room-a-601', label: '601', type: 'room', mapPosition: { x: 48, y: 38 } },
                    ],
                },
            ]);
        }

        if (id === 'building-b') {
            return createBuildingNode(id, label, { x, y }, [
                {
                    id: 'floor-b-1',
                    label: '1层',
                    type: 'floor',
                    children: [
                        { id: 'room-b-101', label: '101', type: 'room', mapPosition: { x: 40, y: 34 } },
                        { id: 'room-b-102', label: '102', type: 'room', mapPosition: { x: 52, y: 38 } },
                    ],
                },
                {
                    id: 'floor-b-2',
                    label: '2层',
                    type: 'floor',
                    children: [
                        { id: 'room-b-201', label: '201', type: 'room', mapPosition: { x: 44, y: 36 } },
                    ],
                },
            ]);
        }

        if (id === 'building-e') {
            return createBuildingNode(id, label, { x, y }, [
                {
                    id: 'floor-e-1',
                    label: '1层',
                    type: 'floor',
                    children: [
                        { id: 'room-e-101', label: '101', type: 'room', mapPosition: { x: 36, y: 38 } },
                        { id: 'room-e-102', label: '102', type: 'room', mapPosition: { x: 48, y: 40 } },
                        { id: 'room-e-103', label: '103', type: 'room', mapPosition: { x: 58, y: 42 } },
                    ],
                },
                {
                    id: 'floor-e-2',
                    label: '2层',
                    type: 'floor',
                    children: [
                        { id: 'room-e-201', label: '201', type: 'room', mapPosition: { x: 38, y: 36 } },
                        { id: 'room-e-202', label: '202', type: 'room', mapPosition: { x: 50, y: 38 } },
                    ],
                },
                {
                    id: 'floor-e-3',
                    label: '3层',
                    type: 'floor',
                    children: [
                        { id: 'room-e-301', label: '301', type: 'room', mapPosition: { x: 40, y: 34 } },
                        { id: 'room-e-302', label: '302', type: 'room', mapPosition: { x: 52, y: 36 } },
                    ],
                },
                {
                    id: 'floor-e-4',
                    label: '4层',
                    type: 'floor',
                    children: [
                        { id: 'room-e-401', label: '401', type: 'room', mapPosition: { x: 38, y: 32 } },
                        { id: 'room-e-402', label: '402', type: 'room', mapPosition: { x: 45, y: 35 } },
                        { id: 'room-e-403', label: '403', type: 'room', mapPosition: { x: 52, y: 38 } },
                        { id: 'room-e-404', label: '404', type: 'room', mapPosition: { x: 58, y: 42 } },
                    ],
                },
                {
                    id: 'floor-e-5',
                    label: '5层',
                    type: 'floor',
                    children: [
                        { id: 'room-e-501', label: '501', type: 'room', mapPosition: { x: 42, y: 36 } },
                        { id: 'room-e-502', label: '502', type: 'room', mapPosition: { x: 55, y: 40 } },
                    ],
                },
                {
                    id: 'floor-e-6',
                    label: '6层',
                    type: 'floor',
                    children: [
                        { id: 'room-e-601', label: '601', type: 'room', mapPosition: { x: 44, y: 38 } },
                        { id: 'room-e-602', label: '602', type: 'room', mapPosition: { x: 56, y: 42 } },
                    ],
                },
                {
                    id: 'floor-e-7',
                    label: '7层',
                    type: 'floor',
                    children: [
                        { id: 'room-e-701', label: '701', type: 'room', mapPosition: { x: 46, y: 36 } },
                    ],
                },
                {
                    id: 'floor-e-8',
                    label: '8层',
                    type: 'floor',
                    children: [
                        { id: 'room-e-801', label: '801', type: 'room', mapPosition: { x: 48, y: 38 } },
                        { id: 'room-e-802', label: '802', type: 'room', mapPosition: { x: 60, y: 40 } },
                    ],
                },
            ]);
        }

        return createBuildingNode(id, label, { x, y }, [
            {
                id: `${id}-floor-1`,
                label: '1层',
                type: 'floor',
                children: [
                    {
                        id: `${id}-room-101`,
                        label: '101',
                        type: 'room',
                        mapPosition: { x: 45, y: 40 },
                    },
                ],
            },
        ]);
    }),
};

export const SPACE_CONFIG_DEFAULT_EXPANDED: Record<string, boolean> = {
    'campus-yunmi': true,
    'building-a': true,
    'building-b': false,
    'floor-a-4': true,
    'floor-a-5': false,
    'floor-a-6': false,
    'floor-b-1': false,
    'floor-b-2': false,
};

export function findSpaceConfigNode(
    node: SpaceConfigNode,
    id: string,
): SpaceConfigNode | null {
    if (node.id === id) return node;
    for (const child of node.children ?? []) {
        const found = findSpaceConfigNode(child, id);
        if (found) return found;
    }
    return null;
}

export function findSpaceConfigPath(
    node: SpaceConfigNode,
    id: string,
    trail: SpaceConfigNode[] = [],
): SpaceConfigNode[] | null {
    const nextTrail = [...trail, node];
    if (node.id === id) return nextTrail;
    for (const child of node.children ?? []) {
        const found = findSpaceConfigPath(child, id, nextTrail);
        if (found) return found;
    }
    return null;
}

export function getMapLevelForNode(node: SpaceConfigNode): MapLevel {
    if (node.type === 'campus') return 'campus';
    if (node.type === 'building') return 'building';
    return 'floor';
}

export function getFloorViewNode(node: SpaceConfigNode, root: SpaceConfigNode): SpaceConfigNode {
    if (node.type === 'room') {
        const path = findSpaceConfigPath(root, node.id);
        return path?.find((item) => item.type === 'floor') ?? node;
    }
    if (node.type === 'floor') return node;
    return node;
}

export function getBuildingFloors(building: SpaceConfigNode): SpaceConfigNode[] {
    return building.children?.filter((child) => child.type === 'floor') ?? [];
}

export function getFloorRooms(floor: SpaceConfigNode): SpaceConfigNode[] {
    return floor.children?.filter((child) => child.type === 'room') ?? [];
}

export function getCampusBuildings(campus: SpaceConfigNode): SpaceConfigNode[] {
    return campus.children?.filter((child) => child.type === 'building') ?? [];
}

export function getParentNode(root: SpaceConfigNode, id: string): SpaceConfigNode | null {
    const path = findSpaceConfigPath(root, id);
    if (!path || path.length < 2) return null;
    return path[path.length - 2];
}

export const SPACE_TYPE_LABEL: Record<SpaceNodeType, string> = {
    campus: '园区',
    building: '楼栋',
    floor: '楼层',
    room: '房间',
};

/** 根据上级空间类型，返回允许新增的子空间类型 */
export function getAllowedChildSpaceTypes(parentType: SpaceNodeType): SpaceNodeType[] {
    if (parentType === 'campus') return ['building', 'floor', 'room'];
    if (parentType === 'building') return ['floor', 'room'];
    if (parentType === 'floor') return ['room'];
    return [];
}

export function canAddChildSpace(parentType: SpaceNodeType): boolean {
    return getAllowedChildSpaceTypes(parentType).length > 0;
}

export function getDefaultChildType(parentType: SpaceNodeType): SpaceNodeType | null {
    return getAllowedChildSpaceTypes(parentType)[0] ?? null;
}

export function getChildSpaceTypeOptions(parentType: SpaceNodeType) {
    return getAllowedChildSpaceTypes(parentType).map((type) => ({
        label: SPACE_TYPE_LABEL[type],
        value: type,
    }));
}

export function getSpacePathLabel(root: SpaceConfigNode, id: string) {
    const path = findSpaceConfigPath(root, id);
    return path?.map((node) => node.label).join(' / ') ?? '';
}

export function addChildToSpaceTree(
    root: SpaceConfigNode,
    parentId: string,
    child: SpaceConfigNode,
): SpaceConfigNode {
    if (root.id === parentId) {
        return {
            ...root,
            children: [...(root.children ?? []), child],
        };
    }
    if (!root.children?.length) return root;
    return {
        ...root,
        children: root.children.map((node) => addChildToSpaceTree(node, parentId, child)),
    };
}

export function createSpaceId(prefix: string) {
    return `${prefix}-${Date.now().toString(36)}`;
}

export function updateSpaceNode(
    root: SpaceConfigNode,
    nodeId: string,
    patch: Pick<SpaceConfigNode, 'label' | 'departmentId' | 'description' | 'imageUrl'>,
): SpaceConfigNode {
    if (root.id === nodeId) {
        return { ...root, ...patch };
    }
    if (!root.children?.length) return root;
    return {
        ...root,
        children: root.children.map((node) => updateSpaceNode(node, nodeId, patch)),
    };
}
