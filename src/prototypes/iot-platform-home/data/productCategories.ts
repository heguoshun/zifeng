import type { ProductRecord } from './products';
import type { TreeSelectNode } from './orgHierarchy';

export type ProductCategoryNode = {
    id: string;
    label: string;
    count?: number;
    children?: ProductCategoryNode[];
};

/** 与产品管理页左侧「产品分类」树一致 */
export const PRODUCT_CATEGORY_TREE: ProductCategoryNode[] = [
    { id: 'all', label: '全部' },
    {
        id: 'water',
        label: '水务设备',
        children: [
            { id: 'dabiao', label: '大表' },
            { id: 'hubiao', label: '户表' },
            { id: 'yaliji', label: '压力计' },
            { id: 'shuizhiyi', label: '水质仪' },
            { id: 'zhihuishuizhan', label: '智慧水站' },
        ],
    },
];

const CATEGORY_ID_TO_LABEL: Record<string, string> = {
    dabiao: '大表',
    hubiao: '户表',
    yaliji: '压力计',
    shuizhiyi: '水质仪',
    zhuishuizhan: '智慧水站',
};

const PARENT_CATEGORY_IDS: Record<string, string[]> = {
    water: ['dabiao', 'hubiao', 'yaliji', 'shuizhiyi', 'zhihuishuizhan'],
};

export function formatProductSelectorLabel(product: ProductRecord): string {
    return product.name;
}

export function productMatchesCategory(activeCategoryId: string, product: ProductRecord): boolean {
    if (activeCategoryId === 'all') return true;
    if (activeCategoryId === product.id) return true;
    if (activeCategoryId === product.categoryId) return true;

    const categoryLabel = CATEGORY_ID_TO_LABEL[activeCategoryId];
    if (categoryLabel && product.category === categoryLabel) return true;

    const childIds = PARENT_CATEGORY_IDS[activeCategoryId];
    if (childIds?.includes(product.categoryId)) return true;

    if (activeCategoryId === 'water' && Object.values(CATEGORY_ID_TO_LABEL).includes(product.category)) {
        return true;
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

        const children = node.children?.map((subCategory) => {
            const categoryProducts = products.filter((product) => product.categoryId === subCategory.id);
            const productNodes: ProductSelectorNode[] = categoryProducts.map((product) => ({
                id: product.id,
                label: formatProductSelectorLabel(product),
                count: countByProduct(product.id),
            }));

            return {
                id: subCategory.id,
                label: subCategory.label,
                count: countByCategory(subCategory.id),
                children: productNodes.length ? productNodes : undefined,
            };
        });

        return {
            id: node.id,
            label: node.label,
            count: countByCategory(node.id),
            children,
        };
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
    hubiao: true,
    yaliji: true,
    shuizhiyi: true,
    zhuishuizhan: true,
};

/** 产品表单「产品分类」树形下拉：一级目录不可选，仅二级叶子可选 */
export function buildProductCategorySelectTree(): TreeSelectNode[] {
    return PRODUCT_CATEGORY_TREE
        .filter((node) => node.id !== 'all')
        .map((node) => ({
            id: node.id,
            label: node.label,
            selectable: false,
            children: node.children?.map((child) => ({
                id: child.id,
                label: child.label,
            })),
        }));
}

export const DEFAULT_PRODUCT_CATEGORY_TREE_EXPANDED: Record<string, boolean> = {
    water: true,
};

export function getProductCategoryLabel(categoryId: string): string {
    if (!categoryId) return '';
    for (const node of PRODUCT_CATEGORY_TREE) {
        if (node.id === categoryId) return node.label;
        const child = node.children?.find((item) => item.id === categoryId);
        if (child) return child.label;
    }
    return categoryId;
}

export function getProductCategoryAncestors(categoryId: string): string[] {
    for (const node of PRODUCT_CATEGORY_TREE) {
        if (node.id === categoryId) {
            return [categoryId];
        }
        if (node.children?.some((child) => child.id === categoryId)) {
            return [node.id, categoryId];
        }
    }
    return [categoryId];
}

export function buildProductPickerTree(products: ProductRecord[]): TreeSelectNode[] {
    return PRODUCT_CATEGORY_TREE
        .filter((node) => node.id !== 'all')
        .map((node) => ({
            id: node.id,
            label: node.label,
            children: node.children?.map((subCategory) => {
                const categoryProducts = products.filter((product) => product.categoryId === subCategory.id);
                return {
                    id: subCategory.id,
                    label: subCategory.label,
                    children: categoryProducts.map((product) => ({
                        id: product.id,
                        label: formatProductSelectorLabel(product),
                    })),
                };
            }),
        }));
}

/** 设备调试等产品选择：仅叶子产品可选，分类节点不可选 */
export function buildDebugProductSelectTree(products: ProductRecord[]): TreeSelectNode[] {
    return PRODUCT_CATEGORY_TREE
        .filter((node) => node.id !== 'all')
        .map((node) => ({
            id: node.id,
            label: node.label,
            selectable: false,
            children: node.children?.map((subCategory) => {
                const categoryProducts = products.filter((product) => product.categoryId === subCategory.id);
                return {
                    id: subCategory.id,
                    label: subCategory.label,
                    selectable: false,
                    children: categoryProducts.map((product) => ({
                        id: product.id,
                        label: formatProductSelectorLabel(product),
                    })),
                };
            }),
        }));
}

export function withProductCounts(categories: ProductCategoryNode[], products: ProductRecord[]): ProductCategoryNode[] {
    return categories.map((node) => {
        if (node.id === 'all') {
            return { ...node, count: products.length };
        }
        if (node.children) {
            const children = node.children.map((child) => ({
                ...child,
                count: countProductsInCategory(products, child.id),
            }));
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
    });
}
