import React, { useEffect, useMemo, useState } from 'react';
import {
    LayoutGrid,
    List,
    Search,
} from 'lucide-react';
import DeviceGroupTags from '../components/DeviceGroupTags';
import TreeToggleIcon from '../components/TreeToggleIcon';
import EntityCardPlaceholder from '../components/EntityCardPlaceholder';
import AppShell from '../components/AppShell';
import Breadcrumb from '../components/Breadcrumb';
import DeviceAccessSidebar, { type DeviceAccessPageId } from '../components/DeviceAccessSidebar';
import ElSelect from '../components/ElSelect';
import ElTreeSelect from '../components/ElTreeSelect';
import ListPagination from '../components/ListPagination';
import { paginateItems } from '../utils/listPagination';
import { ConfirmDialog } from '../components/IotDialogs';
import IotToast, { type IotToastData, type IotToastType, triggerIotToast } from '../components/IotToast';
import {
    DEPARTMENT_TREE,
    matchesTreeSelection,
} from '../data/orgHierarchy';
import {
    DEFAULT_PRODUCT_TREE_EXPANDED,
    buildProductSelectorTree,
    filterProductSelectorTree,
    getProductCategoryAncestors,
    itemMatchesProductFilter,
    type ProductSelectorNode,
} from '../data/productCategories';
import {
    STATUS_LABEL,
    countByStatus,
    resolveDeviceOrg,
    resolveDeviceProduct,
    type DeviceRecord,
    type DeviceStatus,
} from '../data/devices';
import {
    deviceMatchesGroup,
    findDeviceGroup,
    type DeviceGroupRecord,
    type DeviceGroupTypeItem,
} from '../data/deviceGroups';
import {
    applyDeviceEnableToggle,
    resolveDeviceOnlineDuration,
} from '../utils/deviceTime';
import type { ProductRecord } from '../data/products';
import DeviceRemoteControlDrawer from '../components/DeviceRemoteControlDrawer';
import { canControlDevice } from '../data/deviceRemoteControl';
import { navigateDeviceForm } from '../utils/deviceRoute';
import '../device-access.css';
import '../product-management.css';
import '../device-management.css';
import ClearableInput from '../components/ClearableInput';

const NODE_TYPE_OPTIONS = ['全部', '直连设备', '网关设备', '网关子设备'].map((type) => ({
    label: type,
    value: type,
}));

const STATUS_OPTIONS = ['全部', '在线', '离线', '故障', '禁用'].map((type) => ({
    label: type,
    value: type,
}));

const STATUS_FILTER_MAP: Record<string, DeviceStatus | '全部'> = {
    全部: '全部',
    在线: 'online',
    离线: 'offline',
    故障: 'fault',
    禁用: 'disabled',
};

type EnrichedDevice = DeviceRecord & {
    productName: string;
    nodeType: string;
    category: string;
    department: string;
};

type DeviceManagementPageProps = {
    products: ProductRecord[];
    devices: DeviceRecord[];
    deviceGroups: DeviceGroupRecord[];
    groupTypes: DeviceGroupTypeItem[];
    onUpdateDevices: React.Dispatch<React.SetStateAction<DeviceRecord[]>>;
    onDeviceChanged?: (before: DeviceRecord, after: DeviceRecord) => void;
    initialProductId?: string | null;
    initialGroupId?: string | null;
    onNavigateHome: () => void;
    onNavigate: (pageId: DeviceAccessPageId) => void;
};

function ProductTree({
    nodes,
    expanded,
    activeId,
    depth = 0,
    onToggle,
    onSelect,
}: {
    nodes: ProductSelectorNode[];
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
                            <ProductTree
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

function StatusTag({ status }: { status: DeviceStatus }) {
    return (
        <span className={`dm-status-tag dm-status-tag--${status}`}>
            {STATUS_LABEL[status]}
        </span>
    );
}

function DeviceCard({
    device,
    now,
    onToggleEnabled,
    onView,
    onEdit,
    onControl,
    onData,
    onDelete,
}: {
    device: EnrichedDevice;
    now: Date;
    onToggleEnabled: (device: DeviceRecord) => void;
    onView: (device: DeviceRecord) => void;
    onEdit: (device: DeviceRecord) => void;
    onControl: (device: DeviceRecord) => void;
    onData: (device: DeviceRecord) => void;
    onDelete: (device: DeviceRecord) => void;
}) {
    const onlineDuration = resolveDeviceOnlineDuration(device, now);

    return (
        <article className="dm-device-card">
            <div className="dm-device-card__aside">
                <div className="dm-device-card__icon">
                    <EntityCardPlaceholder />
                </div>
                <StatusTag status={device.status} />
            </div>
            <div className="dm-device-card__body">
                <div className="dm-device-card__top">
                    <h4 className="dm-device-card__title">{device.name}</h4>
                    <label className="dm-enable-switch">
                        <input
                            type="checkbox"
                            checked={device.enabled}
                            onChange={() => onToggleEnabled(device)}
                            aria-label={`${device.name}启用状态`}
                        />
                        <span>{device.enabled ? '已启用' : '已禁用'}</span>
                    </label>
                </div>
                <DeviceGroupTags groups={device.groups} variant="card" />
                <div className="dm-device-card__meta">
                    <div>
                        <span>设备编号</span>
                        <strong>{device.code}</strong>
                    </div>
                    <div>
                        <span>启用时间</span>
                        <strong>{device.enabledAt}</strong>
                    </div>
                    <div>
                        <span>节点类型</span>
                        <strong>{device.nodeType}</strong>
                    </div>
                    <div>
                        <span>在线时长</span>
                        <strong className="is-highlight">{onlineDuration}</strong>
                    </div>
                </div>
            </div>
            <div className="dm-device-card__overlay">
                <div className="dm-device-card__actions">
                    <button type="button" onClick={() => onEdit(device)}>编辑</button>
                    <button type="button" onClick={() => onControl(device)}>远程控制</button>
                    <button type="button" onClick={() => onData(device)}>数据</button>
                    <button type="button" onClick={() => onDelete(device)}>删除</button>
                </div>
            </div>
        </article>
    );
}

function DeviceTable({
    rows,
    onView,
    onEdit,
    onControl,
    onData,
    onDelete,
}: {
    rows: EnrichedDevice[];
    onView: (device: DeviceRecord) => void;
    onEdit: (device: DeviceRecord) => void;
    onControl: (device: DeviceRecord) => void;
    onData: (device: DeviceRecord) => void;
    onDelete: (device: DeviceRecord) => void;
}) {
    return (
        <div className="pm-table-wrap">
            <table className="pm-table pm-table--device-list">
                <thead>
                    <tr>
                        <th><input type="checkbox" aria-label="全选" /></th>
                        <th>序号</th>
                        <th>设备编号</th>
                        <th>设备名称</th>
                        <th>所属产品</th>
                        <th>节点类型</th>
                        <th>状态</th>
                        <th>所属部门</th>
                        <th>设备分组</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((device, index) => (
                        <tr key={device.id}>
                            <td><input type="checkbox" aria-label={`选择 ${device.name}`} /></td>
                            <td>{index + 1}</td>
                            <td>{device.code}</td>
                            <td>{device.name}</td>
                            <td>{device.productName}</td>
                            <td>{device.nodeType}</td>
                            <td><StatusTag status={device.status} /></td>
                            <td>{device.department}</td>
                            <td>
                                <DeviceGroupTags groups={device.groups} />
                            </td>
                            <td>
                                <div className="pm-table-actions">
                                    <button type="button" onClick={() => onEdit(device)}>编辑</button>
                                    <button type="button" onClick={() => onControl(device)}>控制</button>
                                    <button type="button" onClick={() => onData(device)}>数据</button>
                                    <button type="button" onClick={() => onDelete(device)}>删除</button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default function DeviceManagementPage({
    products,
    devices,
    deviceGroups,
    groupTypes,
    onUpdateDevices,
    onDeviceChanged,
    initialProductId = null,
    initialGroupId = null,
    onNavigateHome,
    onNavigate,
}: DeviceManagementPageProps) {
    const [nodeType, setNodeType] = useState('全部');
    const [deviceStatus, setDeviceStatus] = useState('全部');
    const [department, setDepartment] = useState('all');
    const [keyword, setKeyword] = useState('');
    const [draftNodeType, setDraftNodeType] = useState('全部');
    const [draftDeviceStatus, setDraftDeviceStatus] = useState('全部');
    const [draftDepartment, setDraftDepartment] = useState('all');
    const [draftKeyword, setDraftKeyword] = useState('');
    const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
    const [pageSize, setPageSize] = useState('20');
    const [currentPage, setCurrentPage] = useState(1);
    const [jumpPage, setJumpPage] = useState('1');
    const [activeProduct, setActiveProduct] = useState(initialProductId ?? 'all');
    const [productKeyword, setProductKeyword] = useState('');
    const [expanded, setExpanded] = useState(DEFAULT_PRODUCT_TREE_EXPANDED);
    const [deleteDevice, setDeleteDevice] = useState<DeviceRecord | null>(null);
    const [controlDevice, setControlDevice] = useState<DeviceRecord | null>(null);
    const [toast, setToast] = useState<IotToastData | null>(null);
    const [now, setNow] = useState(() => new Date());

    useEffect(() => {
        const timer = window.setInterval(() => setNow(new Date()), 60000);
        return () => window.clearInterval(timer);
    }, []);

    const showToast = (message: string, type: IotToastType = 'warning') => {
        triggerIotToast(setToast, message, type);
    };

    useEffect(() => {
        if (!initialProductId) return;

        const product = products.find((item) => item.id === initialProductId);
        if (!product) {
            setActiveProduct('all');
            return;
        }

        setActiveProduct(initialProductId);
        setExpanded((prev) => {
            const next = { ...prev };
            getProductCategoryAncestors(product.categoryId).forEach((id) => {
                next[id] = true;
            });
            next[product.categoryId] = true;
            return next;
        });
        setCurrentPage(1);
        setJumpPage('1');
    }, [initialProductId, products]);

    const activeGroup = useMemo(
        () => findDeviceGroup(deviceGroups, initialGroupId),
        [deviceGroups, initialGroupId],
    );

    useEffect(() => {
        if (!activeGroup) return;
        setKeyword(activeGroup.name);
        setDraftKeyword(activeGroup.name);
        setCurrentPage(1);
        setJumpPage('1');
    }, [activeGroup]);

    const enrichedDevices = useMemo(() => devices.map((device) => ({
        ...device,
        ...resolveDeviceProduct(device, products),
        ...resolveDeviceOrg(device),
    })), [devices, products]);

    const productTree = useMemo(
        () => buildProductSelectorTree(products, devices),
        [products, devices],
    );

    const devicesInSelection = useMemo(() => enrichedDevices.filter((device) => {
        const matchType = nodeType === '全部' || device.nodeType === nodeType;
        const matchDepartment = matchesTreeSelection(department, device.departmentId, DEPARTMENT_TREE);
        const matchKeyword = !keyword
            || device.name.includes(keyword)
            || device.code.includes(keyword)
            || device.groups.some((group) => group.includes(keyword))
            || device.productName.includes(keyword);
        const matchProduct = itemMatchesProductFilter(activeProduct, device.productId, products);
        const matchGroup = !activeGroup || deviceMatchesGroup(device, groupTypes, activeGroup);
        return matchType && matchDepartment && matchKeyword && matchProduct && matchGroup;
    }), [activeGroup, activeProduct, department, enrichedDevices, groupTypes, keyword, nodeType, products]);

    const statusCounts = useMemo(() => countByStatus(devicesInSelection), [devicesInSelection]);

    const filteredDevices = useMemo(() => {
        const statusFilter = STATUS_FILTER_MAP[deviceStatus];
        if (statusFilter === '全部') return devicesInSelection;
        return devicesInSelection.filter((device) => device.status === statusFilter);
    }, [deviceStatus, devicesInSelection]);

    const pagination = useMemo(
        () => paginateItems(filteredDevices, currentPage, Number(pageSize)),
        [currentPage, filteredDevices, pageSize],
    );

    useEffect(() => {
        setCurrentPage(1);
        setJumpPage('1');
    }, [activeProduct, department, deviceStatus, keyword, nodeType, pageSize]);

    useEffect(() => {
        setJumpPage(String(pagination.currentPage));
    }, [pagination.currentPage]);

    const displayDevices = pagination.items;

    const filteredProductTree = useMemo(
        () => filterProductSelectorTree(productTree, productKeyword),
        [productTree, productKeyword],
    );

    const handleToggleEnabled = (device: DeviceRecord) => {
        const nextEnabled = !device.enabled;
        const toggledAt = new Date();
        const nextDevice = applyDeviceEnableToggle(device, nextEnabled, toggledAt);

        onUpdateDevices((prev) => prev.map((item) => (
            item.id === device.id ? nextDevice : item
        )));
        onDeviceChanged?.(device, nextDevice);
        setNow(toggledAt);
        showToast(nextEnabled ? '设备已启用' : '设备已禁用', 'success');
    };

    const handleOpenControl = (device: DeviceRecord) => {
        const check = canControlDevice(device);
        if (!check.allowed) {
            showToast(check.message ?? '当前设备不可控制');
            return;
        }
        setControlDevice(device);
    };

    const controlProduct = useMemo(() => {
        if (!controlDevice) return null;
        return products.find((item) => item.id === controlDevice.productId) ?? null;
    }, [controlDevice, products]);

    const controlProductName = useMemo(() => {
        if (!controlDevice) return '—';
        return resolveDeviceProduct(controlDevice, products).productName;
    }, [controlDevice, products]);

    const sidebar = <DeviceAccessSidebar pageId="device-management" onNavigate={onNavigate} />;

    return (
        <AppShell
            activeTopTab="设备接入"
            sidebar={sidebar}
            onTopTabChange={(tab) => {
                if (tab === '设备接入') onNavigate('home');
            }}
        >
            <div className="pm-page">
                <Breadcrumb items={[
                    { label: '设备接入', pageId: 'home' },
                    { label: '设备管理', pageId: 'device-management' },
                    { label: '设备管理' },
                    ...(activeGroup ? [{ label: activeGroup.name }] : []),
                ]} onNavigate={(id) => onNavigate(id as DeviceAccessPageId)} />

                <section className="panel pm-filter-panel">
                    <div className="pm-filter-row dm-filter-row--device">
                        <div className="pm-filter-field">
                            <span className="pm-filter-label">节点类型</span>
                            <ElSelect
                                className="el-select--medium"
                                size="medium"
                                value={draftNodeType}
                                options={NODE_TYPE_OPTIONS}
                                onChange={setDraftNodeType}
                            />
                        </div>
                        <div className="pm-filter-field">
                            <span className="pm-filter-label">设备状态</span>
                            <ElSelect
                                className="el-select--medium"
                                size="medium"
                                value={draftDeviceStatus}
                                options={STATUS_OPTIONS}
                                onChange={setDraftDeviceStatus}
                            />
                        </div>
                        <div className="pm-filter-field">
                            <span className="pm-filter-label">所属部门</span>
                            <ElTreeSelect
                                className="el-select--medium dm-tree-select"
                                size="medium"
                                value={draftDepartment}
                                tree={DEPARTMENT_TREE}
                                onChange={setDraftDepartment}
                            />
                        </div>
                        <div className="pm-filter-inline-group">
                            <div className="pm-filter-field">
                                <span className="pm-filter-label">设备搜索</span>
                                <ClearableInput
                                    type="text"
                                    className="pm-filter-input"
                                    placeholder="请输入设备名称/编号/分组名称"
                                    value={draftKeyword}
                                    onChange={(event) => setDraftKeyword(event.target.value)}
                                />
                            </div>
                            <div className="pm-filter-actions">
                                <button
                                    type="button"
                                    className="pm-btn pm-btn-primary"
                                    onClick={() => {
                                        setNodeType(draftNodeType);
                                        setDeviceStatus(draftDeviceStatus);
                                        setDepartment(draftDepartment);
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
                                        setDraftDeviceStatus('全部');
                                        setDraftDepartment('all');
                                        setDraftKeyword('');
                                        setNodeType('全部');
                                        setDeviceStatus('全部');
                                        setDepartment('all');
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
                            <h3>所属产品</h3>
                        </div>
                        <div className="dm-product-search">
                            <ClearableInput
                                type="text"
                                placeholder="请输入产品名称"
                                value={productKeyword}
                                onChange={(event) => setProductKeyword(event.target.value)}
                            />
                        </div>
                        <ProductTree
                            nodes={filteredProductTree}
                            expanded={expanded}
                            activeId={activeProduct}
                            onToggle={(id) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))}
                            onSelect={setActiveProduct}
                        />
                    </section>

                    <section className="panel pm-list-panel">
                        <div className="dm-list-head">
                            <div className="dm-list-head-left">
                                <div className="pm-section-head dm-section-head--compact">
                                    <h3>设备列表</h3>
                                </div>
                                <div className="dm-status-summary">
                                    <span><i className="dm-status-dot dm-status-dot--online" />在线 {statusCounts.online}</span>
                                    <span><i className="dm-status-dot dm-status-dot--offline" />离线 {statusCounts.offline}</span>
                                    <span><i className="dm-status-dot dm-status-dot--fault" />故障 {statusCounts.fault}</span>
                                    <span><i className="dm-status-dot dm-status-dot--disabled" />禁用 {statusCounts.disabled}</span>
                                </div>
                            </div>
                            <div className="dm-list-head-right">
                                <button
                                    type="button"
                                    className="pm-btn pm-btn-primary"
                                    onClick={() => navigateDeviceForm('create', {
                                        productId: activeProduct !== 'all' ? activeProduct : undefined,
                                    })}
                                >
                                    新增
                                </button>
                                <button
                                    type="button"
                                    className="pm-btn pm-btn-ghost"
                                    onClick={() => showToast('导出任务已提交', 'success')}
                                >
                                    批量导出
                                </button>
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
                            <div className="dm-card-grid">
                                {displayDevices.map((device) => (
                                    <DeviceCard
                                        device={device}
                                        key={device.id}
                                        now={now}
                                        onToggleEnabled={handleToggleEnabled}
                                        onView={(item) => navigateDeviceForm('view', { deviceId: item.id })}
                                        onEdit={(item) => navigateDeviceForm('edit', { deviceId: item.id })}
                                        onControl={handleOpenControl}
                                        onData={(item) => navigateDeviceForm('view', { deviceId: item.id, tab: '属性数据' })}
                                        onDelete={setDeleteDevice}
                                    />
                                ))}
                            </div>
                        ) : (
                            <DeviceTable
                                rows={displayDevices}
                                onView={(item) => navigateDeviceForm('view', { deviceId: item.id })}
                                onEdit={(item) => navigateDeviceForm('edit', { deviceId: item.id })}
                                onControl={handleOpenControl}
                                onData={(item) => navigateDeviceForm('view', { deviceId: item.id, tab: '属性数据' })}
                                onDelete={setDeleteDevice}
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

            {deleteDevice && (
                <ConfirmDialog
                    title="删除设备"
                    message="确定删除该设备？"
                    onClose={() => setDeleteDevice(null)}
                    onConfirm={() => {
                        onUpdateDevices((prev) => prev.filter((item) => item.id !== deleteDevice.id));
                        showToast('设备已删除', 'success');
                        setDeleteDevice(null);
                    }}
                />
            )}

            <DeviceRemoteControlDrawer
                open={Boolean(controlDevice)}
                device={controlDevice}
                product={controlProduct}
                productName={controlProductName}
                onClose={() => setControlDevice(null)}
                onShowToast={showToast}
            />
        </AppShell>
    );
}
