export type ThingModelItem = {
    id: string;
    name: string;
    sectionId: string;
    referencedDeviceCount?: number;
};

export type ThingModelSection = {
    id: string;
    name: string;
};

export type ThingModelCategoryNode = {
    id: string;
    name: string;
    sectionId?: string;
    children?: ThingModelCategoryNode[];
};

export const STANDARD_SECTION_ORDER: ThingModelSection[] = [
    { id: 'sec-water', name: '给排水' },
    { id: 'sec-power', name: '变配电' },
    { id: 'sec-meter', name: '冷热燃表' },
    { id: 'sec-street-light', name: '路灯' },
    { id: 'sec-electric-light', name: '电工照明' },
    { id: 'sec-safety', name: '室内安全' },
    { id: 'sec-appliance', name: '生活电器' },
    { id: 'sec-env', name: '环境监测' },
    { id: 'sec-comm', name: '智慧通信' },
    { id: 'sec-video', name: '视频监控' },
    { id: 'sec-fire', name: '消防设备' },
    { id: 'sec-building', name: '智慧楼宇' },
    { id: 'sec-gateway', name: '智能网关' },
];

export const STANDARD_CATEGORY_TREE: ThingModelCategoryNode[] = [
    {
        id: 'cat-infra',
        name: '基础设施',
        children: [
            { id: 'cat-water', name: '给排水', sectionId: 'sec-water' },
            { id: 'cat-power', name: '变配电', sectionId: 'sec-power' },
            { id: 'cat-meter', name: '冷热燃表', sectionId: 'sec-meter' },
            { id: 'cat-street-light', name: '路灯', sectionId: 'sec-street-light' },
            { id: 'cat-electric-light', name: '电工照明', sectionId: 'sec-electric-light' },
            { id: 'cat-safety', name: '室内安全', sectionId: 'sec-safety' },
            { id: 'cat-appliance', name: '生活电器', sectionId: 'sec-appliance' },
        ],
    },
    {
        id: 'cat-park',
        name: '智慧园区',
        children: [
            { id: 'cat-env', name: '环境监测', sectionId: 'sec-env' },
            { id: 'cat-video', name: '视频监控', sectionId: 'sec-video' },
            { id: 'cat-fire', name: '消防设备', sectionId: 'sec-fire' },
        ],
    },
    {
        id: 'cat-iot-access',
        name: '物联接入',
        children: [
            { id: 'cat-comm', name: '智慧通信', sectionId: 'sec-comm' },
            { id: 'cat-building', name: '智慧楼宇', sectionId: 'sec-building' },
            { id: 'cat-gateway', name: '智能网关', sectionId: 'sec-gateway' },
        ],
    },
];

export const STANDARD_MODELS: ThingModelItem[] = [
    { id: 'sm-001', name: '智能水表', sectionId: 'sec-water', referencedDeviceCount: 12 },
    { id: 'sm-002', name: '水浸传感器', sectionId: 'sec-water' },
    { id: 'sm-003', name: '水阀', sectionId: 'sec-water' },
    { id: 'sm-004', name: '管网压力监测', sectionId: 'sec-water' },
    { id: 'sm-005', name: '气阀', sectionId: 'sec-water' },
    { id: 'sm-006', name: '水箱', sectionId: 'sec-water' },
    { id: 'sm-007', name: '流量计', sectionId: 'sec-water' },
    { id: 'sm-008', name: '空压机表', sectionId: 'sec-water' },
    { id: 'sm-009', name: '水泵', sectionId: 'sec-water' },
    { id: 'sm-010', name: '智能电表', sectionId: 'sec-power' },
    { id: 'sm-011', name: '三相电表', sectionId: 'sec-power' },
    { id: 'sm-012', name: '发电机', sectionId: 'sec-power' },
    { id: 'sm-013', name: '变压器', sectionId: 'sec-power' },
    { id: 'sm-014', name: '计费插座', sectionId: 'sec-power' },
    { id: 'sm-015', name: '配电柜', sectionId: 'sec-power' },
    { id: 'sm-016', name: '电容柜', sectionId: 'sec-power' },
    { id: 'sm-017', name: '风机', sectionId: 'sec-power' },
    { id: 'sm-018', name: '光伏板', sectionId: 'sec-power' },
    { id: 'sm-019', name: '燃气表', sectionId: 'sec-meter' },
    { id: 'sm-020', name: '供冷总表', sectionId: 'sec-meter' },
    { id: 'sm-021', name: '供冷分表', sectionId: 'sec-meter' },
    { id: 'sm-022', name: '供热总表', sectionId: 'sec-meter' },
    { id: 'sm-023', name: '热量表', sectionId: 'sec-meter' },
    { id: 'sm-024', name: '冷量表', sectionId: 'sec-meter' },
    { id: 'sm-025', name: '电表', sectionId: 'sec-meter' },
    { id: 'sm-026', name: '智能灯', sectionId: 'sec-electric-light' },
    { id: 'sm-027', name: '防爆灯', sectionId: 'sec-electric-light' },
    { id: 'sm-028', name: '路灯控制器', sectionId: 'sec-electric-light' },
    { id: 'sm-029', name: '门磁传感器', sectionId: 'sec-safety' },
    { id: 'sm-030', name: '紧急按钮', sectionId: 'sec-safety' },
    { id: 'sm-031', name: '智能门锁', sectionId: 'sec-safety' },
    { id: 'sm-032', name: '门铃', sectionId: 'sec-safety' },
    { id: 'sm-033', name: '智能插座', sectionId: 'sec-appliance' },
    { id: 'sm-034', name: '智能开关', sectionId: 'sec-appliance' },
    { id: 'sm-035', name: '温湿度传感器', sectionId: 'sec-env' },
    { id: 'sm-036', name: '网关设备', sectionId: 'sec-gateway' },
];

export const MANUFACTURER_SECTION_ORDER: ThingModelSection[] = [
    { id: 'mfr-sec-encoder', name: '编码器' },
    { id: 'mfr-sec-freq', name: '变频电' },
    { id: 'mfr-sec-meter', name: '电表' },
    { id: 'mfr-sec-water', name: '水表' },
    { id: 'mfr-sec-sensor', name: '冷热感表' },
    { id: 'mfr-sec-cloud-gateway', name: '云网关' },
    { id: 'mfr-sec-camera', name: '摄像机' },
    { id: 'mfr-sec-industrial', name: '工业传感器' },
];

export const MANUFACTURER_CATEGORY_TREE: ThingModelCategoryNode[] = [
    {
        id: 'mfr-feituo',
        name: '厂家飞拓',
        children: [
            { id: 'mfr-feituo-encoder', name: '编码器', sectionId: 'mfr-sec-encoder' },
            { id: 'mfr-feituo-sensor', name: '冷热感表', sectionId: 'mfr-sec-sensor' },
            { id: 'mfr-feituo-freq', name: '变频电', sectionId: 'mfr-sec-freq' },
            { id: 'mfr-feituo-meter', name: '电表', sectionId: 'mfr-sec-meter' },
            { id: 'mfr-feituo-water', name: '水表', sectionId: 'mfr-sec-water' },
        ],
    },
    {
        id: 'mfr-aliyun',
        name: '阿里云',
        children: [
            { id: 'mfr-aliyun-gateway', name: '云网关', sectionId: 'mfr-sec-cloud-gateway' },
        ],
    },
    {
        id: 'mfr-dahua',
        name: '大华股份',
        children: [
            { id: 'mfr-dahua-camera', name: '摄像机', sectionId: 'mfr-sec-camera' },
        ],
    },
    {
        id: 'mfr-siemens',
        name: '西门子',
        children: [
            { id: 'mfr-siemens-sensor', name: '工业传感器', sectionId: 'mfr-sec-industrial' },
        ],
    },
];

export const MANUFACTURER_MODELS: ThingModelItem[] = [
    { id: 'mm-001', name: '编码器', sectionId: 'mfr-sec-encoder' },
    { id: 'mm-002', name: '编码器 脉冲', sectionId: 'mfr-sec-encoder' },
    { id: 'mm-003', name: '变频电机A型', sectionId: 'mfr-sec-freq' },
    { id: 'mm-004', name: '变频控制器', sectionId: 'mfr-sec-freq' },
    { id: 'mm-005', name: '智能电表V2', sectionId: 'mfr-sec-meter', referencedDeviceCount: 5 },
    { id: 'mm-006', name: '三相电表', sectionId: 'mfr-sec-meter' },
    { id: 'mm-007', name: '智能水表P1', sectionId: 'mfr-sec-water' },
    { id: 'mm-008', name: '温湿度传感器', sectionId: 'mfr-sec-sensor' },
    { id: 'mm-009', name: '物联网云网关', sectionId: 'mfr-sec-cloud-gateway' },
    { id: 'mm-010', name: '边缘计算网关', sectionId: 'mfr-sec-cloud-gateway' },
    { id: 'mm-011', name: '网络摄像机', sectionId: 'mfr-sec-camera' },
    { id: 'mm-012', name: '球型摄像机', sectionId: 'mfr-sec-camera' },
    { id: 'mm-013', name: '压力变送器', sectionId: 'mfr-sec-industrial' },
    { id: 'mm-014', name: '温度变送器', sectionId: 'mfr-sec-industrial' },
];

export function flattenCategoryTree(nodes: ThingModelCategoryNode[]): ThingModelCategoryNode[] {
    const result: ThingModelCategoryNode[] = [];
    const walk = (list: ThingModelCategoryNode[]) => {
        list.forEach((node) => {
            result.push(node);
            if (node.children) walk(node.children);
        });
    };
    walk(nodes);
    return result;
}

export function getCategorySectionId(
    nodes: ThingModelCategoryNode[],
    categoryId: string,
): string | null {
    const node = flattenCategoryTree(nodes).find((item) => item.id === categoryId);
    return node?.sectionId ?? null;
}

export function getCategoryDescendantSectionIds(
    nodes: ThingModelCategoryNode[],
    categoryId: string,
): string[] {
    const node = flattenCategoryTree(nodes).find((item) => item.id === categoryId);
    if (!node) return [];

    const sectionIds: string[] = [];
    const walk = (current: ThingModelCategoryNode) => {
        if (current.sectionId) sectionIds.push(current.sectionId);
        current.children?.forEach(walk);
    };
    walk(node);
    return sectionIds;
}

export function cloneCategoryTree(nodes: ThingModelCategoryNode[]): ThingModelCategoryNode[] {
    return nodes.map((node) => ({
        ...node,
        children: node.children ? cloneCategoryTree(node.children) : undefined,
    }));
}

export function findParentCategoryId(
    nodes: ThingModelCategoryNode[],
    targetId: string,
    parentId: string | null = null,
): string | null | undefined {
    for (const node of nodes) {
        if (node.id === targetId) return parentId;
        if (node.children) {
            const found = findParentCategoryId(node.children, targetId, node.id);
            if (found !== undefined) return found;
        }
    }
    return undefined;
}

export function removeCategoryFromTree(
    nodes: ThingModelCategoryNode[],
    categoryId: string,
): ThingModelCategoryNode[] {
    return nodes
        .filter((node) => node.id !== categoryId)
        .map((node) => ({
            ...node,
            children: node.children
                ? removeCategoryFromTree(node.children, categoryId)
                : undefined,
        }));
}

export function addCategoryToTree(
    nodes: ThingModelCategoryNode[],
    parentId: string | null,
    category: ThingModelCategoryNode,
): ThingModelCategoryNode[] {
    if (!parentId) {
        return [...nodes, category];
    }

    return nodes.map((node) => {
        if (node.id === parentId) {
            return {
                ...node,
                children: [...(node.children ?? []), category],
            };
        }
        if (node.children) {
            return {
                ...node,
                children: addCategoryToTree(node.children, parentId, category),
            };
        }
        return node;
    });
}

export function updateCategoryInTree(
    nodes: ThingModelCategoryNode[],
    categoryId: string,
    updater: (node: ThingModelCategoryNode) => ThingModelCategoryNode,
): ThingModelCategoryNode[] {
    return nodes.map((node) => {
        if (node.id === categoryId) return updater(node);
        if (node.children) {
            return {
                ...node,
                children: updateCategoryInTree(node.children, categoryId, updater),
            };
        }
        return node;
    });
}

export function moveCategoryInTree(
    nodes: ThingModelCategoryNode[],
    categoryId: string,
    newParentId: string | null,
): ThingModelCategoryNode[] {
    const target = flattenCategoryTree(nodes).find((item) => item.id === categoryId);
    if (!target) return nodes;

    const withoutTarget = removeCategoryFromTree(nodes, categoryId);
    return addCategoryToTree(withoutTarget, newParentId, {
        ...target,
        children: target.children,
    });
}

export function countModelsInCategory(
    tree: ThingModelCategoryNode[],
    models: ThingModelItem[],
    categoryId: string,
): number {
    const sectionIds = new Set(getCategoryDescendantSectionIds(tree, categoryId));
    return models.filter((model) => sectionIds.has(model.sectionId)).length;
}

export function getTopLevelParentOptions(
    nodes: ThingModelCategoryNode[],
): { label: string; value: string }[] {
    return nodes.map((node) => ({ label: node.name, value: node.id }));
}

export function generateCategoryId(): string {
    return `cat-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
}

export function generateSectionId(): string {
    return `sec-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
}

export function isTopLevelCategory(
    nodes: ThingModelCategoryNode[],
    categoryId: string,
): boolean {
    return nodes.some((node) => node.id === categoryId);
}

export function getVisibleSectionsForCategory(
    sections: ThingModelSection[],
    selectedCategoryId: string | null,
    categoryTree: ThingModelCategoryNode[],
): ThingModelSection[] {
    if (!selectedCategoryId) return sections;

    const descendantSectionIds = getCategoryDescendantSectionIds(categoryTree, selectedCategoryId);
    if (descendantSectionIds.length > 0) {
        const allowedIds = new Set(descendantSectionIds);
        return sections.filter((section) => allowedIds.has(section.id));
    }

    const anchorSectionId = getCategorySectionId(categoryTree, selectedCategoryId);
    if (!anchorSectionId) return sections;

    const anchorIndex = sections.findIndex((section) => section.id === anchorSectionId);
    if (anchorIndex < 0) return sections;

    const allowedIds = new Set(sections.slice(anchorIndex).map((section) => section.id));
    return sections.filter((section) => allowedIds.has(section.id));
}

export type ThingModelTabKey = 'standard' | 'manufacturer';

export type ThingModelTabData = {
    categoryTree: ThingModelCategoryNode[];
    sectionOrder: ThingModelSection[];
    models: ThingModelItem[];
};

export function createInitialThingModelTabData(): Record<ThingModelTabKey, ThingModelTabData> {
    return {
        standard: {
            categoryTree: cloneCategoryTree(STANDARD_CATEGORY_TREE),
            sectionOrder: [...STANDARD_SECTION_ORDER],
            models: [...STANDARD_MODELS],
        },
        manufacturer: {
            categoryTree: cloneCategoryTree(MANUFACTURER_CATEGORY_TREE),
            sectionOrder: [...MANUFACTURER_SECTION_ORDER],
            models: [...MANUFACTURER_MODELS],
        },
    };
}

export function generateThingModelId(): string {
    return `tm-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
}

export function getTopLevelCategoryId(
    nodes: ThingModelCategoryNode[],
    categoryId: string,
): string {
    if (isTopLevelCategory(nodes, categoryId)) return categoryId;
    const parentId = findParentCategoryId(nodes, categoryId);
    if (!parentId) return categoryId;
    return getTopLevelCategoryId(nodes, parentId);
}

export function getTopLevelCategoryName(
    nodes: ThingModelCategoryNode[],
    categoryId: string,
): string {
    const topLevelId = getTopLevelCategoryId(nodes, categoryId);
    return flattenCategoryTree(nodes).find((item) => item.id === topLevelId)?.name ?? '';
}

export function findCategoryIdBySectionId(
    nodes: ThingModelCategoryNode[],
    sectionId: string,
): string | null {
    const node = flattenCategoryTree(nodes).find((item) => item.sectionId === sectionId);
    return node?.id ?? null;
}

export function isCategoryDescendantOf(
    nodes: ThingModelCategoryNode[],
    ancestorId: string,
    categoryId: string,
): boolean {
    if (categoryId === ancestorId) return true;
    const parentId = findParentCategoryId(nodes, categoryId);
    if (!parentId) return false;
    return isCategoryDescendantOf(nodes, ancestorId, parentId);
}

export function findFirstLeafCategoryWithSection(
    nodes: ThingModelCategoryNode[],
    rootCategoryId?: string,
): ThingModelCategoryNode | null {
    const roots = rootCategoryId
        ? nodes.filter((node) => node.id === rootCategoryId)
        : nodes;

    let found: ThingModelCategoryNode | null = null;
    const walk = (list: ThingModelCategoryNode[]) => {
        list.forEach((node) => {
            if (found) return;
            if (node.sectionId) {
                found = node;
                return;
            }
            if (node.children) walk(node.children);
        });
    };
    walk(roots);
    return found;
}

export function resolveThingModelCreateContext(
    tab: ThingModelTabKey,
    tree: ThingModelCategoryNode[],
    sections: ThingModelSection[],
    categoryId: string | null,
    sectionId: string | null,
    selectedCategoryId: string | null,
): {
    categoryId: string;
    sectionId: string;
    sectionName: string;
    scene: string;
    supplier: string;
} | null {
    let resolvedCategoryId = categoryId;
    let resolvedSectionId = sectionId;

    if (!resolvedSectionId && resolvedCategoryId) {
        resolvedSectionId = getCategorySectionId(tree, resolvedCategoryId);
    }

    if (!resolvedCategoryId && resolvedSectionId) {
        resolvedCategoryId = findCategoryIdBySectionId(tree, resolvedSectionId);
    }

    if (!resolvedSectionId && resolvedCategoryId && isTopLevelCategory(tree, resolvedCategoryId)) {
        const preferredCategoryId = selectedCategoryId
            && isCategoryDescendantOf(tree, resolvedCategoryId, selectedCategoryId)
            ? selectedCategoryId
            : null;
        const preferredSectionId = preferredCategoryId
            ? getCategorySectionId(tree, preferredCategoryId)
            : null;
        if (preferredSectionId) {
            resolvedSectionId = preferredSectionId;
            resolvedCategoryId = preferredCategoryId;
        } else {
            const firstLeaf = findFirstLeafCategoryWithSection(tree, resolvedCategoryId);
            if (firstLeaf?.sectionId) {
                resolvedSectionId = firstLeaf.sectionId;
                resolvedCategoryId = firstLeaf.id;
            }
        }
    }

    if (!resolvedCategoryId || !resolvedSectionId) return null;

    const sectionName = sections.find((item) => item.id === resolvedSectionId)?.name ?? '';
    const topLevelName = getTopLevelCategoryName(tree, resolvedCategoryId);

    return {
        categoryId: resolvedCategoryId,
        sectionId: resolvedSectionId,
        sectionName,
        scene: tab === 'standard' ? topLevelName : '',
        supplier: tab === 'manufacturer' ? topLevelName : '',
    };
}
