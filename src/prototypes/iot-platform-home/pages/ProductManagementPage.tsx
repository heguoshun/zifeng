import React, { useEffect, useMemo, useState } from 'react';
import {
    LayoutGrid,
    List,
    Search,
} from 'lucide-react';
import TreeToggleIcon from '../components/TreeToggleIcon';
import EntityCardPlaceholder from '../components/EntityCardPlaceholder';
import AppShell from '../components/AppShell';
import DeviceAccessSidebar, { type DeviceAccessPageId } from '../components/DeviceAccessSidebar';
import ElSelect from '../components/ElSelect';
import { ConfirmDialog } from '../components/IotDialogs';
import IotToast, { type IotToastData, type IotToastType, triggerIotToast } from '../components/IotToast';
import { truncateProductRemark, type ProductRecord } from '../data/products';
import {
    DEFAULT_PRODUCT_TREE_EXPANDED,
    PRODUCT_CATEGORY_TREE,
    productMatchesCategory,
    withProductCounts,
    type ProductCategoryNode,
} from '../data/productCategories';
import ListPagination from '../components/ListPagination';
import { navigateProductForm } from '../utils/productRoute';
import { navigateDeviceManagement } from '../utils/deviceRoute';
import { paginateItems } from '../utils/listPagination';
import '../device-access.css';
import '../product-management.css';

const NODE_TYPE_OPTIONS = ['全部', '直连设备', '网关设备', '网关子设备'].map((type) => ({
    label: type,
    value: type,
}));

type ProductManagementPageProps = {
    products: ProductRecord[];
    onDeleteProduct: (productId: string) => void;
    onNavigateHome: () => void;
    onNavigate: (pageId: DeviceAccessPageId) => void;
};

function CategoryTree({
    nodes,
    expanded,
    activeId,
    depth = 0,
    onToggle,
    onSelect,
}: {
    nodes: ProductCategoryNode[];
    expanded: Record<string, boolean>;
    activeId: string;
    depth?: number;
    onToggle: (id: string) => void;
    onSelect: (id: string) => void;
}) {
    return (
        <ul className={`pm-category-tree ${depth > 0 ? 'pm-category-tree--nested' : ''}`}>
            {nodes.map((node) => {
                const hasChildren = Boolean(node.children?.length);
                const isExpanded = expanded[node.id];
                const isActive = activeId === node.id;

                return (
                    <li key={node.id} className="pm-category-node">
                        <div
                            className={`pm-category-item ${isActive ? 'is-active' : ''}`}
                            style={{ paddingLeft: `${8 + depth * 18}px` }}
                        >
                            {hasChildren ? (
                                <button
                                    type="button"
                                    className="pm-category-toggle"
                                    aria-label={isExpanded ? '收起' : '展开'}
                                    onClick={() => onToggle(node.id)}
                                >
                                    <TreeToggleIcon expanded={isExpanded} />
                                </button>
                            ) : (
                                <span className="pm-category-spacer" />
                            )}
                            <button
                                type="button"
                                className="pm-category-label-btn"
                                onClick={() => onSelect(node.id)}
                            >
                                <span className="pm-category-label">{node.label}</span>
                                <span className="pm-category-count">{node.count}</span>
                            </button>
                        </div>
                        {hasChildren && isExpanded && (
                            <CategoryTree
                                nodes={node.children ?? []}
                                expanded={expanded}
                                activeId={activeId}
                                depth={depth + 1}
                                onToggle={onToggle}
                                onSelect={onSelect}
                            />
                        )}
                    </li>
                );
            })}
        </ul>
    );
}

function ProductCard({
    product,
    onView,
    onEdit,
    onDelete,
    onDevices,
}: {
    product: ProductRecord;
    onView: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onDevices: (product: ProductRecord) => void;
}) {
    return (
        <article className="pm-product-card">
            <div className="pm-product-card__icon">
                <EntityCardPlaceholder />
            </div>
            <div className="pm-product-card__body">
                <h4>{product.name}</h4>
                <div className="pm-product-card__meta">
                    <div>
                        <span>产品编号</span>
                        <strong>{product.code}</strong>
                    </div>
                    <div>
                        <span>节点类型</span>
                        <strong>{product.nodeType}</strong>
                    </div>
                    <div>
                        <span>产品分类</span>
                        <strong>{product.category}</strong>
                    </div>
                    <div>
                        <span>供应商</span>
                        <strong>{product.vendor}</strong>
                    </div>
                </div>
            </div>
            <div className="pm-product-card__hover">
                <div className="pm-product-card__actions">
                    <button type="button" onClick={onView}>查看</button>
                    <button type="button" onClick={onEdit}>编辑</button>
                    <button type="button" onClick={() => onDevices(product)}>设备</button>
                    <button type="button" onClick={onDelete}>删除</button>
                </div>
            </div>
        </article>
    );
}

function ProductTable({
    rows,
    onView,
    onEdit,
    onDelete,
    onDevices,
}: {
    rows: ProductRecord[];
    onView: (product: ProductRecord) => void;
    onEdit: (product: ProductRecord) => void;
    onDelete: (product: ProductRecord) => void;
    onDevices: (product: ProductRecord) => void;
}) {
    return (
        <div className="pm-table-wrap">
            <table className="pm-table pm-table--product-list">
                <thead>
                    <tr>
                        <th><input type="checkbox" aria-label="全选" /></th>
                        <th>序号</th>
                        <th>产品编号</th>
                        <th>产品名称</th>
                        <th>产品图片</th>
                        <th>节点类型</th>
                        <th>供应商</th>
                        <th>备注</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((product, index) => (
                        <tr key={product.id}>
                            <td><input type="checkbox" aria-label={`选择 ${product.name}`} /></td>
                            <td>{index + 1}</td>
                            <td>{product.code}</td>
                            <td>{product.name}</td>
                            <td>
                                <span className="pm-table-thumb">
                                    <EntityCardPlaceholder size="thumb" />
                                </span>
                            </td>
                            <td>{product.nodeType}</td>
                            <td>{product.vendor}</td>
                            <td title={product.remark}>{truncateProductRemark(product.remark)}</td>
                            <td>
                                <div className="pm-table-actions">
                                    <button type="button" onClick={() => onView(product)}>查看</button>
                                    <button type="button" onClick={() => onDevices(product)}>设备</button>
                                    <button type="button" onClick={() => onEdit(product)}>编辑</button>
                                    <button type="button" onClick={() => onDelete(product)}>删除</button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default function ProductManagementPage({
    products,
    onDeleteProduct,
    onNavigateHome,
    onNavigate,
}: ProductManagementPageProps) {
    const [nodeType, setNodeType] = useState('全部');
    const [keyword, setKeyword] = useState('');
    const [draftNodeType, setDraftNodeType] = useState('全部');
    const [draftKeyword, setDraftKeyword] = useState('');
    const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
    const [pageSize, setPageSize] = useState('10');
    const [currentPage, setCurrentPage] = useState(1);
    const [jumpPage, setJumpPage] = useState('1');
    const [activeCategory, setActiveCategory] = useState('all');
    const [expanded, setExpanded] = useState(DEFAULT_PRODUCT_TREE_EXPANDED);
    const [deleteProduct, setDeleteProduct] = useState<ProductRecord | null>(null);
    const [toast, setToast] = useState<IotToastData | null>(null);

    const showToast = (message: string, type: IotToastType = 'warning') => {
        triggerIotToast(setToast, message, type);
    };

    const categories = useMemo(
        () => withProductCounts(PRODUCT_CATEGORY_TREE, products),
        [products],
    );

    const filteredProducts = useMemo(() => products.filter((product) => {
        const matchType = nodeType === '全部' || product.nodeType === nodeType;
        const matchKeyword = !keyword
            || product.name.includes(keyword)
            || product.code.includes(keyword);
        const matchCategory = productMatchesCategory(activeCategory, product);
        return matchType && matchKeyword && matchCategory;
    }), [activeCategory, keyword, nodeType, products]);

    const pagination = useMemo(
        () => paginateItems(filteredProducts, currentPage, Number(pageSize)),
        [currentPage, filteredProducts, pageSize],
    );

    useEffect(() => {
        setCurrentPage(1);
        setJumpPage('1');
    }, [activeCategory, keyword, nodeType, pageSize]);

    useEffect(() => {
        setJumpPage(String(pagination.currentPage));
    }, [pagination.currentPage]);

    const displayProducts = pagination.items;

    const handleDeleteRequest = (product: ProductRecord) => {
        if (product.deviceCount > 0) {
            showToast('当前产品下存在关联设备，无法删除！');
            return;
        }
        setDeleteProduct(product);
    };

    const sidebar = <DeviceAccessSidebar pageId="product-management" onNavigate={onNavigate} />;

    return (
        <AppShell
            activeTopTab="设备接入"
            sidebar={sidebar}
            onTopTabChange={(tab) => {
                if (tab === '设备接入') onNavigate('home');
            }}
        >
            <div className="pm-page">
                <div className="crumb">设备接入 / 产品开发 / 产品管理</div>

                <section className="panel pm-filter-panel">
                    <div className="pm-filter-row">
                        <label className="pm-filter-field">
                            <span className="pm-filter-label">节点类型</span>
                            <ElSelect
                                className="el-select--medium"
                                size="medium"
                                value={draftNodeType}
                                options={NODE_TYPE_OPTIONS}
                                onChange={setDraftNodeType}
                            />
                        </label>
                        <div className="pm-filter-inline-group">
                            <label className="pm-filter-field">
                                <span className="pm-filter-label">产品</span>
                                <input
                                    type="text"
                                    className="pm-filter-input"
                                    placeholder="请输入产品名称/编号"
                                    value={draftKeyword}
                                    onChange={(event) => setDraftKeyword(event.target.value)}
                                />
                            </label>
                            <div className="pm-filter-actions">
                            <button
                                type="button"
                                className="pm-btn pm-btn-primary"
                                onClick={() => {
                                    setNodeType(draftNodeType);
                                    setKeyword(draftKeyword.trim());
                                }}
                            >
                                <Search size={14} />
                                查询
                            </button>
                            <button
                                type="button"
                                className="pm-btn pm-btn-ghost"
                                onClick={() => {
                                    setDraftNodeType('全部');
                                    setDraftKeyword('');
                                    setNodeType('全部');
                                    setKeyword('');
                                }}
                            >
                                重置
                            </button>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="pm-content-grid">
                    <section className="panel pm-category-panel">
                        <div className="pm-section-head">
                            <h3>产品分类</h3>
                            <button
                                type="button"
                                className="pm-link-btn"
                                onClick={() => onNavigate('product-category')}
                            >
                                编辑分类
                            </button>
                        </div>
                        <CategoryTree
                            nodes={categories}
                            expanded={expanded}
                            activeId={activeCategory}
                            onToggle={(id) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))}
                            onSelect={setActiveCategory}
                        />
                    </section>

                    <section className="panel pm-list-panel">
                        <div className="pm-section-head">
                            <h3>产品列表</h3>
                            <div className="pm-list-toolbar">
                                <button
                                    type="button"
                                    className="pm-btn pm-btn-primary"
                                    onClick={() => navigateProductForm('create')}
                                >
                                    新增
                                </button>
                                <button type="button" className="pm-btn pm-btn-ghost">批量导出</button>
                                <button type="button" className="pm-btn pm-btn-ghost">批量导入</button>
                                <div className="pm-view-toggle">
                                    <button
                                        type="button"
                                        className={viewMode === 'card' ? 'is-active' : ''}
                                        aria-label="卡片视图"
                                        onClick={() => setViewMode('card')}
                                    >
                                        <LayoutGrid size={14} />
                                    </button>
                                    <button
                                        type="button"
                                        className={viewMode === 'list' ? 'is-active' : ''}
                                        aria-label="列表视图"
                                        onClick={() => setViewMode('list')}
                                    >
                                        <List size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {viewMode === 'card' ? (
                            <div className="pm-card-grid">
                                {displayProducts.map((product) => (
                                    <ProductCard
                                        product={product}
                                        key={product.id}
                                        onView={() => navigateProductForm('view', product.id)}
                                        onEdit={() => navigateProductForm('edit', product.id)}
                                        onDelete={() => handleDeleteRequest(product)}
                                        onDevices={(product) => navigateDeviceManagement({ productId: product.id })}
                                    />
                                ))}
                            </div>
                        ) : (
                            <ProductTable
                                rows={displayProducts}
                                onView={(product) => navigateProductForm('view', product.id)}
                                onEdit={(product) => navigateProductForm('edit', product.id)}
                                onDelete={handleDeleteRequest}
                                onDevices={(product) => navigateDeviceManagement({ productId: product.id })}
                            />
                        )}

                        <ListPagination
                            total={pagination.total}
                            currentPage={pagination.currentPage}
                            totalPages={pagination.totalPages}
                            pageSize={pageSize}
                            jumpPage={jumpPage}
                            onPageChange={setCurrentPage}
                            onPageSizeChange={setPageSize}
                            onJumpPageChange={setJumpPage}
                        />
                    </section>
                </div>
            </div>

            <IotToast toast={toast} />

            {deleteProduct && (
                <ConfirmDialog
                    title="删除产品"
                    message="确定删除该产品？"
                    onClose={() => setDeleteProduct(null)}
                    onConfirm={() => {
                        onDeleteProduct(deleteProduct.id);
                        showToast('产品已删除', 'success');
                        setDeleteProduct(null);
                    }}
                />
            )}
        </AppShell>
    );
}
