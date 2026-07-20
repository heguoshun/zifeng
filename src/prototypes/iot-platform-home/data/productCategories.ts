import type { ProductRecord } from './products';
import type { TreeSelectNode } from './orgHierarchy';

export type ProductCategoryNode = {
    id: string;
    label: string;
    businessType?: string;
    count?: number;
    children?: ProductCategoryNode[];
};

export const LARGE_METER_BUSINESS_TYPE = 'large_meter';

/** 大表产品供应商（厂家）顺序，与产品列表分组一致 */
export const LARGE_METER_VENDOR_ORDER = [
    '山科',
    '惠然',
    '汇中',
    '迈拓',
    '海威兹',
    '泽火',
    '宁波',
    '紫瑞',
    '兴玺',
    '捷先',
] as const;

export type LargeMeterVendor = typeof LARGE_METER_VENDOR_ORDER[number];

export const LARGE_METER_TYPE_NODES: ProductCategoryNode[] = [
    { id: 'dabiao-em', label: '电磁表' },
    { id: 'dabiao-mech', label: '机械表' },
    { id: 'dabiao-ultra', label: '超声表' },
    { id: 'dabiao-flow', label: '流量计' },
];

export const LARGE_METER_TYPE_IDS = LARGE_METER_TYPE_NODES.map((node) => node.id);

/** 与产品管理页左侧「产品分类」树一致 */
export const PRODUCT_CATEGORY_TREE: ProductCategoryNode[] = [
    { id: 'all', label: '全部' },
    {
        id: 'water',
        label: '水务设备',
        children: [
            {
                id: 'dabiao',
                label: '大表',
                businessType: LARGE_METER_BUSINESS_TYPE,
                children: LARGE_METER_TYPE_NODES,
            },
            { id: 'hubiao', label: '户表', businessType: 'household_meter' },
            { id: 'yaliji', label: '压力计', businessType: 'pressure_gauge' },
            { id: 'shuizhiyi', label: '水质仪', businessType: 'water_quality' },
            { id: 'zhihuishuizhan', label: '直饮水机', businessType: 'smart_station' },
        ],
    },
];

function walkCategoryTree(
    nodes: ProductCategoryNode[],
    visitor: (node: ProductCategoryNode, ancestors: string[]) => void,
    ancestors: string[] = [],
): void {
    nodes.forEach((node) => {
        visitor(node, ancestors);
        if (node.children?.length) {
            walkCategoryTree(node.children, visitor, [...ancestors, node.id]);
        }
    });
}

function findCategoryPath(
    nodes: ProductCategoryNode[],
    categoryId: string,
    trail: string[] = [],
): string[] | null {
    for (const node of nodes) {
        const nextTrail = [...trail, node.id];
        if (node.id === categoryId) {
            return nextTrail;
        }
        if (node.children?.length) {
            const childPath = findCategoryPath(node.children, categoryId, nextTrail);
            if (childPath) return childPath;
        }
    }
    return null;
}

function collectDescendantIds(node: ProductCategoryNode): string[] {
    if (!node.children?.length) {
        return [node.id];
    }
    return node.children.flatMap((child) => collectDescendantIds(child));
}

function findCategoryNode(nodes: ProductCategoryNode[], categoryId: string): ProductCategoryNode | null {
    for (const node of nodes) {
        if (node.id === categoryId) return node;
        if (node.children?.length) {
            const found = findCategoryNode(node.children, categoryId);
            if (found) return found;
        }
    }
    return null;
}

const CATEGORY_LEAF_IDS = new Set<string>();
walkCategoryTree(PRODUCT_CATEGORY_TREE, (node) => {
    if (!node.children?.length && node.id !== 'all') {
        CATEGORY_LEAF_IDS.add(node.id);
    }
});

export function isLargeMeterCategory(categoryId: string): boolean {
    return getProductCategoryBusinessType(categoryId) === LARGE_METER_BUSINESS_TYPE;
}

export function isLargeMeterProduct(product: ProductRecord): boolean {
    return isLargeMeterCategory(product.categoryId);
}

export function formatProductSelectorLabel(product: ProductRecord): string {
    return product.name;
}

export function productMatchesCategory(activeCategoryId: string, product: ProductRecord): boolean {
    if (activeCategoryId === 'all') return true;
    if (activeCategoryId === product.id) return true;
    if (activeCategoryId === product.categoryId) return true;

    const node = findCategoryNode(PRODUCT_CATEGORY_TREE, activeCategoryId);
    if (node) {
        const descendantIds = collectDescendantIds(node);
        if (descendantIds.includes(product.categoryId)) {
            return true;
        }
    }

    if (activeCategoryId === 'water') {
        return CATEGORY_LEAF_IDS.has(product.categoryId);
    }

    return false;
}

export function countProductsInCategory(products: ProductRecord[], categoryId: string): number {
    return products.filter((product) => productMatchesCategory(categoryId, product)).length;
}

export type ProductSelectorNode = {
    id: string;
    label: string;
    count: number;
    children?: ProductSelectorNode[];
};

type Countable = { productId: string };

function mapSelectorNode(
    node: ProductCategoryNode,
    products: ProductRecord[],
    items: Countable[],
    countByProduct: (productId: string) => number,
    countByCategory: (categoryId: string) => number,
): ProductSelectorNode {
    const categoryProducts = products.filter((product) => product.categoryId === node.id);
    const productNodes: ProductSelectorNode[] = categoryProducts.map((product) => ({
        id: product.id,
        label: formatProductSelectorLabel(product),
        count: countByProduct(product.id),
    }));

    const childNodes = node.children?.map((child) => mapSelectorNode(
        child,
        products,
        items,
        countByProduct,
        countByCategory,
    ));

    const children = [
        ...(childNodes ?? []),
        ...productNodes,
    ];

    return {
        id: node.id,
        label: node.label,
        count: countByCategory(node.id),
        children: children.length ? children : undefined,
    };
}

/** 设备管理「所属产品」树：分类结构与产品管理一致，子节点挂载对应产品列表 */
export function buildProductSelectorTree(
    products: ProductRecord[],
    items: Countable[],
): ProductSelectorNode[] {
    const countByProduct = (productId: string) => items.filter((item) => item.productId === productId).length;

    const countByCategory = (categoryId: string) => items.filter((item) => {
        const product = products.find((entry) => entry.id === item.productId);
        return product ? productMatchesCategory(categoryId, product) : false;
    }).length;

    return PRODUCT_CATEGORY_TREE.map((node) => {
        if (node.id === 'all') {
            return {
                id: node.id,
                label: node.label,
                count: items.length,
            };
        }

        return mapSelectorNode(node, products, items, countByProduct, countByCategory);
    });
}

export function itemMatchesProductFilter(
    activeId: string,
    productId: string,
    products: ProductRecord[],
): boolean {
    if (activeId === 'all') return true;
    if (activeId === productId) return true;
    const product = products.find((entry) => entry.id === productId);
    if (!product) return false;
    return productMatchesCategory(activeId, product);
}

export function filterProductSelectorTree(
    nodes: ProductSelectorNode[],
    keyword: string,
): ProductSelectorNode[] {
    const normalized = keyword.trim();
    if (!normalized) return nodes;

    const filterNodes = (list: ProductSelectorNode[]): ProductSelectorNode[] => list.flatMap((node) => {
        const children = node.children ? filterNodes(node.children) : undefined;
        const selfMatch = node.label.includes(normalized);
        if (selfMatch || children?.length) {
            return [{ ...node, children }];
        }
        return [];
    });

    return filterNodes(nodes);
}

export const DEFAULT_PRODUCT_TREE_EXPANDED: Record<string, boolean> = {
    water: true,
    dabiao: true,
    'dabiao-em': true,
    'dabiao-mech': true,
    'dabiao-ultra': true,
    'dabiao-flow': true,
    hubiao: true,
    yaliji: true,
    shuizhiyi: true,
    zhihuishuizhan: true,
};

function mapCategorySelectNode(node: ProductCategoryNode): TreeSelectNode {
    if (!node.children?.length) {
        return {
            id: node.id,
            label: node.label,
            selectable: true,
        };
    }

    return {
        id: node.id,
        label: node.label,
        selectable: false,
        children: node.children.map((child) => mapCategorySelectNode(child)),
    };
}

/** 产品表单「产品分类」树形下拉：仅叶子分类可选 */
export function buildProductCategorySelectTree(): TreeSelectNode[] {
    return PRODUCT_CATEGORY_TREE
        .filter((node) => node.id !== 'all')
        .map((node) => mapCategorySelectNode(node));
}

export const DEFAULT_PRODUCT_CATEGORY_TREE_EXPANDED: Record<string, boolean> = {
    water: true,
    dabiao: true,
};

export function getProductCategoryLabel(categoryId: string): string {
    if (!categoryId) return '';
    const node = findCategoryNode(PRODUCT_CATEGORY_TREE, categoryId);
    return node?.label ?? categoryId;
}

export function getProductCategoryAncestors(categoryId: string): string[] {
    const path = findCategoryPath(PRODUCT_CATEGORY_TREE, categoryId);
    return path ?? [categoryId];
}

export function getProductCategoryBusinessType(categoryId: string): string {
    const path = findCategoryPath(PRODUCT_CATEGORY_TREE, categoryId);
    if (!path) return '';
    for (let index = path.length - 1; index >= 0; index -= 1) {
        const node = findCategoryNode(PRODUCT_CATEGORY_TREE, path[index]);
        if (node?.businessType) return node.businessType;
    }
    return '';
}

function mapProductPickerNode(node: ProductCategoryNode, products: ProductRecord[]): TreeSelectNode {
    const categoryProducts = products.filter((product) => product.categoryId === node.id);
    const productChildren = categoryProducts.map((product) => ({
        id: product.id,
        label: formatProductSelectorLabel(product),
    }));

    const categoryChildren = node.children?.map((child) => mapProductPickerNode(child, products)) ?? [];
    const children = [...categoryChildren, ...productChildren];

    return {
        id: node.id,
        label: node.label,
        children: children.length ? children : undefined,
    };
}

export function buildProductPickerTree(products: ProductRecord[]): TreeSelectNode[] {
    return PRODUCT_CATEGORY_TREE
        .filter((node) => node.id !== 'all')
        .map((node) => mapProductPickerNode(node, products));
}

function mapDebugProductSelectNode(node: ProductCategoryNode, products: ProductRecord[]): TreeSelectNode {
    const categoryProducts = products.filter((product) => product.categoryId === node.id);
    const productChildren = categoryProducts.map((product) => ({
        id: product.id,
        label: formatProductSelectorLabel(product),
        selectable: true,
    }));

    const categoryChildren = node.children?.map((child) => mapDebugProductSelectNode(child, products)) ?? [];
    const children = [...categoryChildren, ...productChildren];

    return {
        id: node.id,
        label: node.label,
        selectable: false,
        children: children.length ? children : undefined,
    };
}

/** 设备调试等产品选择：仅叶子产品可选，分类节点不可选 */
export function buildDebugProductSelectTree(products: ProductRecord[]): TreeSelectNode[] {
    return PRODUCT_CATEGORY_TREE
        .filter((node) => node.id !== 'all')
        .map((node) => mapDebugProductSelectNode(node, products));
}

function withCategoryCounts(node: ProductCategoryNode, products: ProductRecord[]): ProductCategoryNode {
    if (node.id === 'all') {
        return { ...node, count: products.length };
    }

    if (node.children?.length) {
        const children = node.children.map((child) => withCategoryCounts(child, products));
        return {
            ...node,
            count: countProductsInCategory(products, node.id),
            children,
        };
    }

    return {
        ...node,
        count: countProductsInCategory(products, node.id),
    };
}

export function withProductCounts(categories: ProductCategoryNode[], products: ProductRecord[]): ProductCategoryNode[] {
    return categories.map((node) => withCategoryCounts(node, products));
}

export type VendorProductGroup = {
    vendor: string;
    products: ProductRecord[];
};

export type TypeVendorProductGroup = {
    typeId: string;
    typeLabel: string;
    vendorGroups: VendorProductGroup[];
};

function sortProductsByVendor(products: ProductRecord[]): ProductRecord[] {
    const order = new Map(LARGE_METER_VENDOR_ORDER.map((vendor, index) => [vendor, index]));
    return [...products].sort((left, right) => {
        const leftOrder = order.get(left.vendor as LargeMeterVendor) ?? LARGE_METER_VENDOR_ORDER.length;
        const rightOrder = order.get(right.vendor as LargeMeterVendor) ?? LARGE_METER_VENDOR_ORDER.length;
        if (leftOrder !== rightOrder) return leftOrder - rightOrder;
        return left.name.localeCompare(right.name, 'zh-CN');
    });
}

export function groupProductsByVendor(products: ProductRecord[]): VendorProductGroup[] {
    const sorted = sortProductsByVendor(products);
    const groups: VendorProductGroup[] = [];

    sorted.forEach((product) => {
        const lastGroup = groups[groups.length - 1];
        if (lastGroup?.vendor === product.vendor) {
            lastGroup.products.push(product);
            return;
        }
        groups.push({ vendor: product.vendor, products: [product] });
    });

    return groups;
}

export function groupLargeMeterProducts(
    products: ProductRecord[],
    activeCategoryId: string,
): TypeVendorProductGroup[] | VendorProductGroup[] | null {
    if (!isLargeMeterCategory(activeCategoryId)) {
        return null;
    }

    if (activeCategoryId === 'dabiao') {
        return LARGE_METER_TYPE_NODES.map((typeNode) => {
            const typeProducts = products.filter((product) => product.categoryId === typeNode.id);
            return {
                typeId: typeNode.id,
                typeLabel: typeNode.label,
                vendorGroups: groupProductsByVendor(typeProducts),
            };
        }).filter((group) => group.vendorGroups.length > 0);
    }

    return groupProductsByVendor(products);
}
