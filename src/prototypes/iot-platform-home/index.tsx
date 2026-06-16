/**
 * @name 紫峰装备智慧化管理平台
 */
import React, { useEffect, useState } from 'react';
import { defineHashPageRoute, useHashPage } from '../../common/useHashPage';
import AppShell from './components/AppShell';
import DeviceAccessSidebar, { type DeviceAccessPageId } from './components/DeviceAccessSidebar';
import MiniMetric from './components/dashboard/MiniMetric';
import { DonutChart, LegendList } from './components/dashboard/DonutChart';
import BarChart from './components/dashboard/BarChart';
import { ChartPanel, TrendChartPanel } from './components/dashboard/TrendLineChart';
import ServerStatusPanel from './components/dashboard/ServerStatusPanel';
import type { LegendItem, Metric } from './components/dashboard/types';
import ProductManagementPage from './pages/ProductManagementPage';
import ProductCategoryPage from './pages/ProductCategoryPage';
import ProductCreatePage from './pages/ProductCreatePage';
import ModelLibraryPage from './pages/ModelLibraryPage';
import DeviceManagementPage from './pages/DeviceManagementPage';
import DeviceCreatePage from './pages/DeviceCreatePage';
import DeviceGroupPage from './pages/DeviceGroupPage';
import DeviceMapPage from './pages/DeviceMapPage';
import DeviceAlarmInfoPage from './pages/DeviceAlarmInfoPage';
import AlarmLevelManagementPage from './pages/AlarmLevelManagementPage';
import AlarmRuleConfigPage from './pages/AlarmRuleConfigPage';
import WorkOrderManagementPage from './pages/WorkOrderManagementPage';
import ProtocolManagementPage from './pages/ProtocolManagementPage';
import NetworkServiceManagementPage from './pages/NetworkServiceManagementPage';
import NetworkProtocolManagementPage from './pages/NetworkProtocolManagementPage';
import NetworkProtocolWizardPage from './pages/NetworkProtocolWizardPage';
import LoginLogPage from './pages/LoginLogPage';
import OperationLogPage from './pages/OperationLogPage';
import RemoteUpgradePage from './pages/RemoteUpgradePage';
import TenantManagementPage from './pages/TenantManagementPage';
import UserManagementPage from './pages/UserManagementPage';
import RoleManagementPage from './pages/RoleManagementPage';
import DepartmentManagementPage from './pages/DepartmentManagementPage';
import MenuManagementPage from './pages/MenuManagementPage';
import MessageSubscribePage from './pages/MessageSubscribePage';
import PushSourceConfigPage from './pages/PushSourceConfigPage';
import MessageTemplatePage from './pages/MessageTemplatePage';
import HistoryMessagePage from './pages/HistoryMessagePage';
import type { MessageCenterPageId } from './components/MessageCenterSidebar';
import type { OmManagementPageId } from './components/OmManagementSidebar';
import type { SystemManagementPageId } from './components/SystemManagementSidebar';
import type { NotificationFilter } from './components/AppShell';
import { createInitialDeviceAlarms, type DeviceAlarmRecord } from './data/deviceAlarms';
import { createInitialWorkOrders } from './data/workOrders';
import { createInitialProtocols } from './data/protocols';
import { createInitialNetworkServices } from './data/networkServices';
import { createInitialNetworkProtocols } from './data/networkProtocols';
import { createInitialLoginLogs } from './data/loginLogs';
import { createInitialOperationLogs } from './data/operationLogs';
import {
    createInitialFirmwarePackages,
    type FirmwarePackageRecord,
    type UpgradeDeviceDetailRecord,
    type UpgradeTaskBatchRecord,
    type UpgradeTaskRecord,
} from './data/remoteUpgrade';
import { createInitialTenants } from './data/tenants';
import { createInitialSystemUsers } from './data/systemUsers';
import { createInitialRoles } from './data/systemRoles';
import { createInitialDepartments } from './data/systemDepartments';
import { createInitialSystemMenus } from './data/systemMenus';
import {
    createInitialMessagePushSettings,
    createInitialMessageSubscriptions,
} from './data/messageSubscriptions';
import { createInitialPushSources } from './data/pushSources';
import { createInitialMessageTemplates } from './data/messageTemplates';
import { parseNetworkProtocolFormRoute } from './utils/networkProtocolRoute';
import { createInitialAlarmLevels } from './data/alarmLevels';
import { createInitialAlarmRuleCategories, createInitialAlarmRules } from './data/alarmRules';
import { createInitialProducts, type ProductRecord } from './data/products';
import { createInitialDevices, type DeviceRecord } from './data/devices';
import { createInitialDeviceGroups, createInitialGroupTypes, type DeviceGroupRecord, type DeviceGroupTypeItem } from './data/deviceGroups';
import { getPlatformSessionUser } from './data/platformSession';
import {
    createInitialThingModelTabData,
    findCategoryIdBySectionId,
    getTopLevelCategoryName,
    resolveThingModelCreateContext,
    type ThingModelTabKey,
} from './data/thingModels';
import { parseThingModelFormRoute } from './utils/modelLibraryRoute';
import { isProductFormPage, resolveProductFormRoute } from './utils/productRoute';
import type { ThingModelSavePayload } from './pages/ProductCreatePage';
import { isDeviceFormPage, parseDeviceManagementRoute, resolveDeviceFormRoute } from './utils/deviceRoute';
import { parseWorkOrderDetailRoute } from './utils/workOrderRoute';
import './style.css';

const metrics: Metric[] = [
    { label: '设备总数量', value: '92,058', tone: 'blue' },
    { label: '在线设备数', value: '90,218', tone: 'cyan' },
    { label: '离线设备数', value: '800', tone: 'purple' },
    { label: '故障设备数', value: '1,058', tone: 'indigo' },
    { label: '禁用设备数', value: '12', tone: 'rose' },
    { label: '产品数量', value: '20', tone: 'navy' },
];

const alarmLegend: LegendItem[] = [
    { label: '紧急', value: 10, color: '#f66d5c' },
    { label: '重要', value: 10, color: '#f6a54b' },
    { label: '次要', value: 5, color: '#f7d149' },
    { label: '提示', value: 2, color: '#4f82eb' },
];

const ticketLegend: LegendItem[] = [
    { label: '处理中', value: 10, color: '#f6a54b' },
    { label: '待验收', value: 5, color: '#f7d149' },
];

const lineValues = [32, 53, 25, 55, 36, 66, 88, 60, 91, 50, 36, 78];
const outflowValues = [28, 48, 30, 50, 42, 58, 72, 55, 80, 45, 32, 68];

const ingestBars = [
    { label: '大表', value: 88 },
    { label: '户表', value: 76 },
    { label: '压力计', value: 64 },
    { label: '水质仪', value: 52 },
    { label: '智慧水站', value: 38 },
];

const serviceBars = [
    { label: '应用名称1', value: 88 },
    { label: '应用名称2', value: 73 },
    { label: '应用名称3', value: 64 },
    { label: '应用名称4', value: 52 },
    { label: '应用名称5', value: 38 },
];

const prototypeRoute = defineHashPageRoute([
    { id: 'home', title: '设备综合视图' },
    { id: 'access-overview', title: '接入概览' },
    { id: 'product-management', title: '产品管理' },
    { id: 'product-category', title: '产品分类', parentPageId: 'product-management' },
    { id: 'product-create', title: '新增产品', parentPageId: 'product-management' },
    { id: 'model-library', title: '物模型库' },
    { id: 'model-library-create', title: '创建物模型', parentPageId: 'model-library' },
    { id: 'device-management', title: '设备管理' },
    { id: 'device-create', title: '新增设备', parentPageId: 'device-management' },
    { id: 'device-group', title: '设备分组' },
    { id: 'device-map', title: '设备地图' },
    { id: 'device-alarm-info', title: '设备告警信息' },
    { id: 'alarm-rule-config', title: '告警规则配置' },
    { id: 'alarm-level-mgmt', title: '告警等级管理' },
    { id: 'msg-subscribe', title: '消息订阅' },
    { id: 'push-source-config', title: '推送源配置' },
    { id: 'msg-template', title: '消息模版' },
    { id: 'history-msg', title: '历史消息' },
    { id: 'work-order-management', title: '工单管理' },
    { id: 'work-order-detail', title: '工单详情', parentPageId: 'work-order-management' },
    { id: 'work-order-create', title: '新增工单', parentPageId: 'work-order-management' },
    { id: 'protocol-mgmt', title: '协议管理' },
    { id: 'network-service', title: '网络服务' },
    { id: 'network-protocol', title: '网络协议' },
    { id: 'network-protocol-create', title: '新增网络协议', parentPageId: 'network-protocol' },
    { id: 'network-protocol-edit', title: '编辑网络协议', parentPageId: 'network-protocol' },
    { id: 'login-log', title: '登录日志' },
    { id: 'operation-log', title: '操作日志' },
    { id: 'remote-upgrade', title: '远程升级' },
    { id: 'tenant-mgmt', title: '租户管理' },
    { id: 'user-mgmt', title: '用户管理' },
    { id: 'role-mgmt', title: '角色管理' },
    { id: 'dept-mgmt', title: '部门管理' },
    { id: 'menu-mgmt', title: '菜单管理' },
], { defaultPageId: 'home' });

function HomePage({
    onNavigate,
    onNavigateMessageCenter,
    onNavigateOmManagement,
    onNavigateSystemManagement,
}: {
    onNavigate: (pageId: DeviceAccessPageId) => void;
    onNavigateMessageCenter: (filter?: NotificationFilter) => void;
    onNavigateOmManagement: (filter?: NotificationFilter) => void;
    onNavigateSystemManagement: () => void;
}) {
    return (
        <AppShell
            activeTopTab="设备接入"
            sidebar={<DeviceAccessSidebar pageId="home" onNavigate={onNavigate} />}
            onNavigateMessageCenter={onNavigateMessageCenter}
            onNavigateOmManagement={onNavigateOmManagement}
            onNavigateSystemManagement={onNavigateSystemManagement}
            onTopTabChange={(tab) => {
                if (tab === '设备接入') onNavigate('home');
            }}
        >
            <div className="crumb">工作台 / 设备综合视图</div>

            <div className="dashboard">
                <section className="panel overview-panel">
                    <h3>设备概览</h3>
                    <div className="metric-grid">
                        {metrics.map((metric) => (
                            <MiniMetric item={metric} key={metric.label} />
                        ))}
                    </div>
                </section>

                <section className="panel work-panel">
                    <h3>告警工单</h3>
                    <div className="work-content">
                        <div className="work-chart-group">
                            <DonutChart legend={alarmLegend} centerLabel="未处理告警" />
                            <LegendList items={alarmLegend} />
                        </div>
                        <div className="work-chart-group">
                            <DonutChart legend={ticketLegend} centerLabel="未完成工单" />
                            <LegendList items={ticketLegend} />
                        </div>
                    </div>
                </section>

                <ServerStatusPanel />

                <TrendChartPanel title="数据流入量分析" values={lineValues} gradientKey="inflow" />
                <ChartPanel title="产品数据流入Top5">
                    <BarChart bars={ingestBars} />
                </ChartPanel>
                <TrendChartPanel title="数据流出量分析" compact values={outflowValues} gradientKey="outflow" />
                <ChartPanel title="应用服务数据Top5">
                    <BarChart bars={serviceBars} />
                </ChartPanel>
            </div>
        </AppShell>
    );
}

export default function IotPlatformHome() {
    const { page, setPage } = useHashPage(prototypeRoute);
    const [platformSession] = useState(() => getPlatformSessionUser());
    const [products, setProducts] = useState(createInitialProducts);
    const [devices, setDevices] = useState(() => createInitialDevices(createInitialProducts()));
    const [deviceGroups, setDeviceGroups] = useState(createInitialDeviceGroups);
    const [groupTypes, setGroupTypes] = useState(createInitialGroupTypes);
    const [deviceAlarms, setDeviceAlarms] = useState(() => createInitialDeviceAlarms(createInitialProducts()));
    const [workOrders, setWorkOrders] = useState(createInitialWorkOrders);
    const [protocols, setProtocols] = useState(createInitialProtocols);
    const [networkServices, setNetworkServices] = useState(createInitialNetworkServices);
    const [networkProtocols, setNetworkProtocols] = useState(createInitialNetworkProtocols);
    const [loginLogs] = useState(createInitialLoginLogs);
    const [operationLogs] = useState(createInitialOperationLogs);
    const [firmwarePackages, setFirmwarePackages] = useState<FirmwarePackageRecord[]>(
        () => createInitialFirmwarePackages(createInitialProducts()),
    );
    const [softwarePackages, setSoftwarePackages] = useState<SoftwarePackageRecord[]>(
        () => createInitialSoftwarePackages(createInitialProducts()),
    );
    const [upgradeTasks, setUpgradeTasks] = useState<UpgradeTaskRecord[]>([]);
    const [upgradeBatches, setUpgradeBatches] = useState<UpgradeTaskBatchRecord[]>([]);
    const [upgradeDeviceDetails] = useState<UpgradeDeviceDetailRecord[]>([]);
    const [tenants, setTenants] = useState(createInitialTenants);
    const [systemUsers, setSystemUsers] = useState(createInitialSystemUsers);
    const [systemRoles, setSystemRoles] = useState(createInitialRoles);
    const [systemDepartments, setSystemDepartments] = useState(createInitialDepartments);
    const [systemMenus, setSystemMenus] = useState(createInitialSystemMenus);
    const [messageSubscriptions, setMessageSubscriptions] = useState(createInitialMessageSubscriptions);
    const [messagePushSettings, setMessagePushSettings] = useState(createInitialMessagePushSettings);
    const [pushSources, setPushSources] = useState(createInitialPushSources);
    const [messageTemplates, setMessageTemplates] = useState(createInitialMessageTemplates);
    const [alarmLevels, setAlarmLevels] = useState(createInitialAlarmLevels);
    const [alarmRuleCategories, setAlarmRuleCategories] = useState(createInitialAlarmRuleCategories);
    const [alarmRules, setAlarmRules] = useState(createInitialAlarmRules);
    const [thingModelTabData, setThingModelTabData] = useState(createInitialThingModelTabData);
    const [thingModelFormRoute, setThingModelFormRoute] = useState(
        () => parseThingModelFormRoute(window.location.hash),
    );
    const [deviceManagementRoute, setDeviceManagementRoute] = useState(() => parseDeviceManagementRoute(window.location.hash));
    const [workOrderDetailRoute, setWorkOrderDetailRoute] = useState(() => parseWorkOrderDetailRoute(window.location.hash));
    const [networkProtocolFormRoute, setNetworkProtocolFormRoute] = useState(
        () => parseNetworkProtocolFormRoute(window.location.hash),
    );
    const [pendingAlarmKeyword, setPendingAlarmKeyword] = useState<string | undefined>(undefined);
    const [pendingWorkOrderStatus, setPendingWorkOrderStatus] = useState<string | undefined>(undefined);

    useEffect(() => {
        const syncRoute = () => {
            setThingModelFormRoute(parseThingModelFormRoute(window.location.hash));
            setDeviceManagementRoute(parseDeviceManagementRoute(window.location.hash));
            setWorkOrderDetailRoute(parseWorkOrderDetailRoute(window.location.hash));
            setNetworkProtocolFormRoute(parseNetworkProtocolFormRoute(window.location.hash));
        };
        window.addEventListener('hashchange', syncRoute);
        return () => window.removeEventListener('hashchange', syncRoute);
    }, []);

    useEffect(() => {
        setThingModelFormRoute(parseThingModelFormRoute(window.location.hash));
        setDeviceManagementRoute(parseDeviceManagementRoute(window.location.hash));
        setWorkOrderDetailRoute(parseWorkOrderDetailRoute(window.location.hash));
        setNetworkProtocolFormRoute(parseNetworkProtocolFormRoute(window.location.hash));
    }, [page]);

    const navigateDeviceAccess = (target: DeviceAccessPageId) => {
        setPage(target);
    };

    const navigateMessageCenter = (target: MessageCenterPageId, filter?: NotificationFilter) => {
        if (filter?.keyword) {
            setPendingAlarmKeyword(filter.keyword);
        }
        setPage(target);
    };

    const navigateOmManagement = (target: OmManagementPageId, filter?: NotificationFilter) => {
        if (filter?.status) {
            setPendingWorkOrderStatus(filter.status);
        }
        setPage(target);
    };

    const navigateSystemManagement = (target: SystemManagementPageId) => {
        setPage(target);
    };

    // Filter-aware callbacks for AppShell notification navigation
    const shellNavigateMessageCenter = (filter?: NotificationFilter) => {
        if (filter?.keyword) {
            setPendingAlarmKeyword(filter.keyword);
        }
        setPage('device-alarm-info');
    };

    const shellNavigateOmManagement = (filter?: NotificationFilter) => {
        if (filter?.status) {
            setPendingWorkOrderStatus(filter.status);
        }
        setPage('work-order-management');
    };

    const navigateWorkOrderDetail = (workOrderId: string) => {
        const params = new URLSearchParams({ page: 'work-order-detail', id: workOrderId });
        window.location.hash = params.toString();
        setPage('work-order-detail');
        setWorkOrderDetailRoute({ workOrderId });
    };

    const handleSaveThingModel = (
        tab: ThingModelTabKey,
        payload: ThingModelSavePayload,
        saveMode: 'create' | 'edit',
    ) => {
        setThingModelTabData((prev) => ({
            ...prev,
            [tab]: {
                ...prev[tab],
                models: saveMode === 'create'
                    ? [...prev[tab].models, {
                        id: payload.id,
                        name: payload.name,
                        sectionId: payload.sectionId,
                    }]
                    : prev[tab].models.map((item) => (
                        item.id === payload.id
                            ? { ...item, name: payload.name, sectionId: payload.sectionId }
                            : item
                    )),
            },
        }));
    };

    const handleSaveProduct = (product: ProductRecord, saveMode: 'create' | 'edit') => {
        if (saveMode === 'create') {
            setProducts((prev) => [...prev, product]);
            return;
        }
        setProducts((prev) => prev.map((item) => (item.id === product.id ? product : item)));
    };

    const handleDeleteProduct = (productId: string) => {
        setProducts((prev) => prev.filter((item) => item.id !== productId));
    };

    const handleSaveDevice = (device: DeviceRecord, saveMode: 'create' | 'edit') => {
        if (saveMode === 'create') {
            setDevices((prev) => [...prev, device]);
            return;
        }
        setDevices((prev) => prev.map((item) => (item.id === device.id ? device : item)));
    };

    if (page === 'user-mgmt') {
        return (
            <UserManagementPage
                users={systemUsers}
                tenants={tenants}
                roles={systemRoles}
                onUpdateUsers={setSystemUsers}
                onNavigateHome={() => setPage('home')}
                onNavigateDeviceAccess={() => setPage('home')}
                onNavigateMessageCenter={shellNavigateMessageCenter}
                onNavigateOmManagement={shellNavigateOmManagement}
                onNavigate={navigateSystemManagement}
            />
        );
    }

    if (page === 'role-mgmt') {
        return (
            <RoleManagementPage
                roles={systemRoles}
                tenants={tenants}
                onUpdateRoles={setSystemRoles}
                onNavigateHome={() => setPage('home')}
                onNavigateDeviceAccess={() => setPage('home')}
                onNavigateMessageCenter={shellNavigateMessageCenter}
                onNavigateOmManagement={shellNavigateOmManagement}
                onNavigate={navigateSystemManagement}
            />
        );
    }

    if (page === 'dept-mgmt') {
        return (
            <DepartmentManagementPage
                departments={systemDepartments}
                tenants={tenants}
                users={systemUsers}
                onUpdateDepartments={setSystemDepartments}
                onNavigateHome={() => setPage('home')}
                onNavigateDeviceAccess={() => setPage('home')}
                onNavigateMessageCenter={shellNavigateMessageCenter}
                onNavigateOmManagement={shellNavigateOmManagement}
                onNavigate={navigateSystemManagement}
            />
        );
    }

    if (page === 'tenant-mgmt') {
        return (
            <TenantManagementPage
                tenants={tenants}
                onUpdateTenants={setTenants}
                onNavigateHome={() => setPage('home')}
                onNavigateDeviceAccess={() => setPage('home')}
                onNavigateMessageCenter={shellNavigateMessageCenter}
                onNavigateOmManagement={shellNavigateOmManagement}
                onNavigate={navigateSystemManagement}
            />
        );
    }

    if (page === 'menu-mgmt') {
        return (
            <MenuManagementPage
                menus={systemMenus}
                onUpdateMenus={setSystemMenus}
                onNavigateHome={() => setPage('home')}
                onNavigateDeviceAccess={() => setPage('home')}
                onNavigateMessageCenter={shellNavigateMessageCenter}
                onNavigateOmManagement={shellNavigateOmManagement}
                onNavigate={navigateSystemManagement}
            />
        );
    }

    if (page === 'login-log') {
        return (
            <LoginLogPage
                loginLogs={loginLogs}
                onNavigateHome={() => setPage('home')}
                onNavigateDeviceAccess={() => setPage('home')}
                onNavigateMessageCenter={shellNavigateMessageCenter}
                onNavigate={navigateOmManagement}
            />
        );
    }

    if (page === 'operation-log') {
        return (
            <OperationLogPage
                operationLogs={operationLogs}
                onNavigateHome={() => setPage('home')}
                onNavigateDeviceAccess={() => setPage('home')}
                onNavigateMessageCenter={shellNavigateMessageCenter}
                onNavigate={navigateOmManagement}
            />
        );
    }

    if (page === 'remote-upgrade') {
        return (
            <RemoteUpgradePage
                products={products}
                devices={devices}
                firmwarePackages={firmwarePackages}
                softwarePackages={softwarePackages}
                upgradeTasks={upgradeTasks}
                upgradeBatches={upgradeBatches}
                upgradeDeviceDetails={upgradeDeviceDetails}
                onUpdateFirmwarePackages={setFirmwarePackages}
                onUpdateSoftwarePackages={setSoftwarePackages}
                onUpdateUpgradeTasks={setUpgradeTasks}
                onUpdateUpgradeBatches={setUpgradeBatches}
                onNavigateHome={() => setPage('home')}
                onNavigateDeviceAccess={() => setPage('home')}
                onNavigateMessageCenter={shellNavigateMessageCenter}
                onNavigate={navigateDeviceAccess}
                onNavigateOmManagement={shellNavigateOmManagement}
            />
        );
    }

    if (page === 'network-protocol') {
        return (
            <NetworkProtocolManagementPage
                networkProtocols={networkProtocols}
                onUpdateNetworkProtocols={setNetworkProtocols}
                onNavigateHome={() => setPage('home')}
                onNavigateDeviceAccess={() => setPage('home')}
                onNavigateMessageCenter={shellNavigateMessageCenter}
                onNavigate={navigateDeviceAccess}
                onNavigateOmManagement={shellNavigateOmManagement}
            />
        );
    }

    if (page === 'network-protocol-create' || page === 'network-protocol-edit') {
        const editingRecord = page === 'network-protocol-edit'
            ? networkProtocols.find((item) => item.id === networkProtocolFormRoute.networkProtocolId) ?? null
            : null;

        return (
            <NetworkProtocolWizardPage
                mode={page === 'network-protocol-create' ? 'create' : 'edit'}
                editingRecord={editingRecord}
                networkProtocols={networkProtocols}
                onUpdateNetworkProtocols={setNetworkProtocols}
                onNavigateHome={() => setPage('home')}
                onNavigateDeviceAccess={() => setPage('home')}
                onNavigateMessageCenter={shellNavigateMessageCenter}
                onNavigate={navigateDeviceAccess}
                onNavigateOmManagement={shellNavigateOmManagement}
                onBack={() => setPage('network-protocol')}
            />
        );
    }

    if (page === 'protocol-mgmt') {
        return (
            <ProtocolManagementPage
                protocols={protocols}
                products={products}
                onUpdateProtocols={setProtocols}
                onNavigateHome={() => setPage('home')}
                onNavigateDeviceAccess={() => setPage('home')}
                onNavigateMessageCenter={shellNavigateMessageCenter}
                onNavigate={navigateDeviceAccess}
                onNavigateOmManagement={shellNavigateOmManagement}
            />
        );
    }

    if (page === 'network-service') {
        return (
            <NetworkServiceManagementPage
                networkServices={networkServices}
                onUpdateNetworkServices={setNetworkServices}
                onNavigateHome={() => setPage('home')}
                onNavigateDeviceAccess={() => setPage('home')}
                onNavigateMessageCenter={shellNavigateMessageCenter}
                onNavigate={navigateDeviceAccess}
                onNavigateOmManagement={shellNavigateOmManagement}
            />
        );
    }

    if (page === 'work-order-management' || page === 'work-order-create' || page === 'work-order-detail') {
        const workOrderFilter = pendingWorkOrderStatus;
        // Clear the pending filter after consuming it
        if (pendingWorkOrderStatus) {
            setPendingWorkOrderStatus(undefined);
        }
        return (
            <WorkOrderManagementPage
                workOrders={workOrders}
                products={products}
                devices={devices}
                createDrawerOpen={page === 'work-order-create'}
                onCreateDrawerOpenChange={(open) => {
                    if (!open && page === 'work-order-create') {
                        setPage('work-order-management');
                    }
                }}
                detailDrawerOpen={page === 'work-order-detail'}
                detailWorkOrderId={page === 'work-order-detail' ? workOrderDetailRoute.workOrderId : null}
                onDetailDrawerOpenChange={(open) => {
                    if (!open && page === 'work-order-detail') {
                        setPage('work-order-management');
                    }
                }}
                onUpdateWorkOrders={setWorkOrders}
                onNavigateHome={() => setPage('home')}
                onNavigateDeviceAccess={() => setPage('home')}
                onNavigateMessageCenter={shellNavigateMessageCenter}
                onNavigate={navigateOmManagement}
                onCreateWorkOrder={(workOrder) => {
                    setWorkOrders((prev) => [workOrder, ...prev]);
                }}
                initialStatus={workOrderFilter}
            />
        );
    }

    if (page === 'device-alarm-info') {
        const alarmFilter = pendingAlarmKeyword;
        // Clear the pending filter after consuming it
        if (pendingAlarmKeyword) {
            setPendingAlarmKeyword(undefined);
        }
        return (
            <DeviceAlarmInfoPage
                products={products}
                alarms={deviceAlarms}
                onUpdateAlarms={setDeviceAlarms}
                onNavigateHome={() => setPage('home')}
                onNavigateDeviceAccess={() => setPage('home')}
                onNavigate={navigateMessageCenter}
                onNavigateOmManagement={shellNavigateOmManagement}
                onViewWorkOrder={navigateWorkOrderDetail}
                onCreateWorkOrder={(workOrder) => {
                    setWorkOrders((prev) => [workOrder, ...prev]);
                }}
                initialKeyword={alarmFilter}
            />
        );
    }

    if (page === 'alarm-rule-config') {
        return (
            <AlarmRuleConfigPage
                categories={alarmRuleCategories}
                rules={alarmRules}
                products={products}
                devices={devices}
                alarmLevels={alarmLevels}
                onUpdateCategories={setAlarmRuleCategories}
                onUpdateRules={setAlarmRules}
                onNavigateHome={() => setPage('home')}
                onNavigateDeviceAccess={() => setPage('home')}
                onNavigate={navigateMessageCenter}
            />
        );
    }

    if (page === 'msg-template') {
        return (
            <MessageTemplatePage
                templates={messageTemplates}
                onUpdateTemplates={setMessageTemplates}
                onNavigateHome={() => setPage('home')}
                onNavigateDeviceAccess={() => setPage('home')}
                onNavigate={navigateMessageCenter}
            />
        );
    }

    if (page === 'history-msg') {
        return (
            <HistoryMessagePage
                onNavigateHome={() => setPage('home')}
                onNavigate={navigateMessageCenter}
            />
        );
    }

    if (page === 'push-source-config') {
        return (
            <PushSourceConfigPage
                pushSources={pushSources}
                onUpdatePushSources={setPushSources}
                onNavigateHome={() => setPage('home')}
                onNavigateDeviceAccess={() => setPage('home')}
                onNavigate={navigateMessageCenter}
            />
        );
    }

    if (page === 'msg-subscribe') {
        return (
            <MessageSubscribePage
                subscriptions={messageSubscriptions}
                pushSettings={messagePushSettings}
                onUpdateSubscriptions={setMessageSubscriptions}
                onUpdatePushSettings={setMessagePushSettings}
                onNavigateHome={() => setPage('home')}
                onNavigateDeviceAccess={() => setPage('home')}
                onNavigate={navigateMessageCenter}
            />
        );
    }

    if (page === 'alarm-level-mgmt') {
        return (
            <AlarmLevelManagementPage
                levels={alarmLevels}
                alarms={deviceAlarms}
                onUpdateLevels={setAlarmLevels}
                onNavigateHome={() => setPage('home')}
                onNavigateDeviceAccess={() => setPage('home')}
                onNavigate={navigateMessageCenter}
            />
        );
    }

    if (page === 'home' || page === 'access-overview') {
        return (
            <HomePage
                onNavigate={navigateDeviceAccess}
                onNavigateMessageCenter={shellNavigateMessageCenter}
                onNavigateOmManagement={shellNavigateOmManagement}
                onNavigateSystemManagement={() => setPage('tenant-mgmt')}
            />
        );
    }

    if (page === 'device-management') {
        return (
            <DeviceManagementPage
                products={products}
                devices={devices}
                deviceGroups={deviceGroups}
                groupTypes={groupTypes}
                onUpdateDevices={setDevices}
                initialProductId={deviceManagementRoute.productId}
                initialGroupId={deviceManagementRoute.groupId}
                onNavigateHome={() => setPage('home')}
                onNavigate={navigateDeviceAccess}
            />
        );
    }

    if (page === 'device-map') {
        return (
            <DeviceMapPage
                products={products}
                devices={devices}
                deviceGroups={deviceGroups}
                onUpdateDevices={setDevices}
                onNavigateHome={() => setPage('home')}
                onNavigate={navigateDeviceAccess}
            />
        );
    }

    if (page === 'device-group') {
        return (
            <DeviceGroupPage
                groups={deviceGroups}
                groupTypes={groupTypes}
                devices={devices}
                products={products}
                onUpdateGroups={setDeviceGroups}
                onUpdateGroupTypes={setGroupTypes}
                onUpdateDevices={setDevices}
                onNavigateHome={() => setPage('home')}
                onNavigate={navigateDeviceAccess}
            />
        );
    }

    if (isDeviceFormPage(page)) {
        const deviceFormRoute = resolveDeviceFormRoute(page, window.location.hash);
        return (
            <DeviceCreatePage
                mode={deviceFormRoute.mode}
                deviceId={deviceFormRoute.deviceId}
                defaultProductId={deviceFormRoute.productId}
                products={products}
                devices={devices}
                onSaveDevice={handleSaveDevice}
                onNavigateHome={() => setPage('home')}
                onNavigate={navigateDeviceAccess}
                onBack={() => setPage('device-management')}
            />
        );
    }

    if (isProductFormPage(page)) {
        const productFormRoute = resolveProductFormRoute(page, window.location.hash);
        return (
            <ProductCreatePage
                mode={productFormRoute.mode}
                productId={productFormRoute.productId}
                products={products}
                onSaveProduct={handleSaveProduct}
                onNavigateHome={() => setPage('home')}
                onNavigate={navigateDeviceAccess}
                onBack={() => setPage('product-management')}
            />
        );
    }

    if (page === 'product-category') {
        return (
            <ProductCategoryPage
                onNavigateHome={() => setPage('home')}
                onNavigate={navigateDeviceAccess}
            />
        );
    }

    if (page === 'model-library-create' && thingModelFormRoute) {
        const route = thingModelFormRoute;
        const activeTabData = thingModelTabData[route.tab];
        const editingModel = route.modelId
            ? activeTabData.models.find((item) => item.id === route.modelId) ?? null
            : null;
        const resolvedContext = resolveThingModelCreateContext(
            route.tab,
            activeTabData.categoryTree,
            activeTabData.sectionOrder,
            route.categoryId,
            route.sectionId ?? editingModel?.sectionId ?? null,
            route.categoryId,
        );
        const fallbackCategoryId = editingModel
            ? findCategoryIdBySectionId(activeTabData.categoryTree, editingModel.sectionId)
            : null;
        const thingModelEntry = resolvedContext ?? (editingModel && fallbackCategoryId ? {
            categoryId: fallbackCategoryId,
            sectionId: editingModel.sectionId,
            sectionName: activeTabData.sectionOrder.find((item) => item.id === editingModel.sectionId)?.name ?? '',
            scene: route.tab === 'standard'
                ? getTopLevelCategoryName(activeTabData.categoryTree, fallbackCategoryId)
                : '',
            supplier: route.tab === 'manufacturer'
                ? getTopLevelCategoryName(activeTabData.categoryTree, fallbackCategoryId)
                : '',
        } : null);

        if (!thingModelEntry) {
            return null;
        }

        return (
            <ProductCreatePage
                entry="thing-model"
                mode={route.mode}
                productId={null}
                products={products}
                thingModelEntry={{
                    tab: route.tab,
                    scene: thingModelEntry.scene,
                    supplier: thingModelEntry.supplier,
                    sectionId: thingModelEntry.sectionId,
                    sectionName: thingModelEntry.sectionName,
                }}
                thingModel={editingModel}
                onSaveThingModel={(payload, saveMode) => handleSaveThingModel(route.tab, payload, saveMode)}
                onSaveProduct={handleSaveProduct}
                onNavigateHome={() => setPage('home')}
                onNavigate={navigateDeviceAccess}
                onBack={() => setPage('model-library')}
            />
        );
    }

    if (page === 'model-library') {
        return (
            <ModelLibraryPage
                canManage={platformSession.isSuperAdmin}
                tabData={thingModelTabData}
                onTabDataChange={setThingModelTabData}
                onNavigateHome={() => setPage('home')}
                onNavigate={navigateDeviceAccess}
            />
        );
    }

    if (page === 'product-management') {
        return (
            <ProductManagementPage
                products={products}
                onDeleteProduct={handleDeleteProduct}
                onNavigateHome={() => setPage('home')}
                onNavigate={navigateDeviceAccess}
            />
        );
    }

    return (
        <HomePage
            onNavigate={navigateDeviceAccess}
            onNavigateMessageCenter={shellNavigateMessageCenter}
            onNavigateOmManagement={shellNavigateOmManagement}
            onNavigateSystemManagement={() => setPage('tenant-mgmt')}
        />
    );
}
