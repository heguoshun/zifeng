export type TreeSelectNode = {
    id: string;
    label: string;
    children?: TreeSelectNode[];
    /** 为 false 时仅展示，不可选择 */
    selectable?: boolean;
};

export const DEPARTMENT_TREE: TreeSelectNode[] = [
    {
        id: 'dept-jiahuan-root',
        label: '嘉环科技',
        children: [
            {
                id: 'dept-jiahuan-1',
                label: '总经办',
                children: [
                    { id: 'dept-jiahuan-1-1', label: '行政管理组' },
                    { id: 'dept-jiahuan-1-2', label: '法务合规组' },
                    { id: 'dept-jiahuan-1-3', label: '品牌公关组' },
                ],
            },
            { id: 'dept-jiahuan-2', label: '技术研发中心' },
            { id: 'dept-jiahuan-3', label: '产品与解决方案部' },
            { id: 'dept-jiahuan-4', label: '市场拓展部' },
            { id: 'dept-jiahuan-5', label: '运维服务中心' },
            { id: 'dept-jiahuan-6', label: '质量管理部' },
        ],
    },
    {
        id: 'dept-shuiwu-root',
        label: '水务集团',
        children: [
            { id: 'dept-shuiwu-1', label: '供水调度中心' },
            { id: 'dept-shuiwu-2', label: '管网运维部' },
        ],
    },
    {
        id: 'dept-nanjing-root',
        label: '南京分公司',
    },
];

export const SPACE_TREE: TreeSelectNode[] = [
    {
        id: 'building-a',
        label: 'A栋',
        children: [
            {
                id: 'floor-4',
                label: '4层',
                children: [
                    { id: 'room-201', label: '201' },
                    { id: 'room-202', label: '202' },
                ],
            },
            {
                id: 'floor-5',
                label: '5层',
                children: [
                    { id: 'room-501', label: '501' },
                    { id: 'room-502', label: '502' },
                ],
            },
        ],
    },
    {
        id: 'building-b',
        label: 'B栋',
        children: [
            {
                id: 'floor-1',
                label: '1层',
                children: [
                    { id: 'room-101', label: '101' },
                    { id: 'room-102', label: '102' },
                ],
            },
        ],
    },
];

export function findTreeNode(tree: TreeSelectNode[], id: string): TreeSelectNode | null {
    for (const node of tree) {
        if (node.id === id) return node;
        if (node.children) {
            const found = findTreeNode(node.children, id);
            if (found) return found;
        }
    }
    return null;
}

export function getTreeNodeLabel(tree: TreeSelectNode[], id: string): string {
    if (id === 'all') return '全部';

    function dfs(nodes: TreeSelectNode[], path: string[]): string | null {
        for (const node of nodes) {
            const nextPath = [...path, node.label];
            if (node.id === id) return nextPath.join(' / ');
            if (node.children) {
                const found = dfs(node.children, nextPath);
                if (found) return found;
            }
        }
        return null;
    }

    return dfs(tree, []) ?? id;
}

export function collectTreeNodeIds(node: TreeSelectNode): string[] {
    const ids = [node.id];
    node.children?.forEach((child) => {
        ids.push(...collectTreeNodeIds(child));
    });
    return ids;
}

export function getTreeMatchIds(activeId: string, tree: TreeSelectNode[]): string[] {
    if (activeId === 'all') return ['all'];
    const node = findTreeNode(tree, activeId);
    return node ? collectTreeNodeIds(node) : [activeId];
}

export function matchesTreeSelection(activeId: string, itemId: string, tree: TreeSelectNode[]): boolean {
    if (activeId === 'all') return true;
    return getTreeMatchIds(activeId, tree).includes(itemId);
}

export const DEFAULT_TREE_EXPANDED: Record<string, boolean> = {
    'dept-jiahuan-root': true,
    'dept-jiahuan-1': true,
    'dept-shuiwu-root': true,
    'dept-nanjing-root': true,
    'building-a': true,
    'building-b': true,
    'floor-4': true,
    'floor-5': true,
    'floor-1': true,
};
