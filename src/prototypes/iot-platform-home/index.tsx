/**
 * @name 紫峰装备智慧化管理平台
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { defineHashPageRoute, parseHashPage, useHashPage } from '../../common/useHashPage';
import { AnnouncementNotificationProvider } from './components/AnnouncementNotificationContext';
import AppShell from './components/AppShell';
import DeviceAccessSidebar, { type DeviceAccessPageId } from './components/DeviceAccessSidebar';
import ExecutiveDeviceOverview from './components/dashboard/ExecutiveDeviceOverview';
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
import CertificateManagementPage from './pages/CertificateManagementPage';
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
import PositionManagementPage from './pages/PositionManagementPage';
import DictionaryManagementPage from './pages/DictionaryManagementPage';
import ParamManagementPage from './pages/ParamManagementPage';
import NoticeAnnouncementPage from './pages/NoticeAnnouncementPage';
import FileManagementPage from './pages/FileManagementPage';
import MessageSubscribePage from './pages/MessageSubscribePage';
import PushSourceConfigPage from './pages/PushSourceConfigPage';
import MessageTemplatePage from './pages/MessageTemplatePage';
import HistoryMessagePage from './pages/HistoryMessagePage';
import DataMonitorPage from './pages/DataMonitorPage';
import WaterUsageAnalysisPage from './pages/WaterUsageAnalysisPage';
import DataReportPage from './pages/DataReportPage';
import AreaConfigPage from './pages/AreaConfigPage';
import DeviceArchivePage from './pages/DeviceArchivePage';
import type { MessageCenterPageId } from './components/MessageCenterSidebar';
import type { AlarmWorkOrderPageId } from './components/AlarmWorkOrderSidebar';
import type { LargeMeterPageId } from './components/LargeMeterSidebar';
import type { SystemManagementPageId } from './components/SystemManagementSidebar';
import type { NotificationFilter } from './components/AppShell';
import { createInitialDeviceAlarms, type DeviceAlarmRecord } from './data/deviceAlarms';
import { createInitialWorkOrders } from './data/workOrders';
import { createInitialProtocols } from './data/protocols';
import { createInitialCertificates } from './data/certificates';
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
import { createInitialPositions } from './data/systemPositions';
import { createInitialSystemMenus } from './data/systemMenus';
import { createInitialDictionaries } from './data/systemDictionaries';
import { createInitialParams } from './data/systemParams';
import { createInitialSystemFiles } from './data/systemFiles';
import {
    createInitialMessagePushSettings,
    createInitialMessageSubscriptions,
} from './data/messageSubscriptions';
import { createInitialPushSources } from './data/pushSources';
import { createInitialMessageTemplates } from './data/messageTemplates';
import { createInitialAreas, createInitialLargeMeters, type LargeMeterArea, type LargeMeterDevice } from './data/largeMeters';
import { createInitialNightlyWaterUsageConfig, type NightlyWaterUsageConfig } from './data/nightlyWaterUsageConfig';
import { parseNetworkProtocolFormRoute } from './utils/networkProtocolRoute';
import { createInitialAlarmLevels } from './data/alarmLevels';
import { createInitialAlarmRuleCategories, createInitialAlarmRules } from './data/alarmRules';
import { createInitialProducts, type ProductRecord } from './data/products';
import { createInitialDevices, isLargeMeterDevice, seedInitialLargeMeterAreaBindings, type DeviceRecord } from './data/devices';
import {
    createArchiveRecordsFromDeviceChange,
    createInitialDeviceArchiveRecords,
    type DeviceArchiveRecord,
} from './data/deviceArchives';
import { createInitialDeviceGroups, createInitialGroupTypes, type DeviceGroupRecord, type DeviceGroupTypeItem } from './data/deviceGroups';
import { clearPersistedSession, loadPersistedSession, PLATFORM_SUPER_ADMIN_ACCOUNT, type PlatformSessionUser } from './data/platformSession';
import { PlatformAuthProvider } from './components/PlatformAuthContext';
import LoginPage from './pages/LoginPage';
import {
    createInitialThingModelTabData,
    findCategoryIdBySectionId,
    getTopLevelCategoryName,
    resolveThingModelCreateContext,
    type ThingModelTabKey,
} from './data/thingModels';
import { parseThingModelFormRoute } from './utils/modelLibraryRoute';
import { isProductFormPage, mergeProductFormRoute, normalizeProductFormHash, parseProductFormRoute, type ProductFormRoute } from './utils/productRoute';
import type { ThingModelSavePayload } from './pages/ProductCreatePage';
import { isDeviceFormPage, mergeDeviceFormRoute, navigateDeviceManagement, parseDeviceFormRoute, parseDeviceManagementRoute, type DeviceFormRoute } from './utils/deviceRoute';
import { parseWorkOrderDetailRoute } from './utils/workOrderRoute';
import {
    mergeWaterUsageAnalysisRoute,
    navigateWaterUsageAnalysis as setWaterUsageAnalysisHash,
    parseWaterUsageAnalysisRoute,
    type WaterUsageAnalysisRoute,
} from './utils/waterUsageAnalysisRoute';
import { isPrototypeMenuPage, PROTOTYPE_MENU_PAGE_IDS } from './prototypeMenuPages';
import PrototypeAnnotationLayer from './components/PrototypeAnnotationLayer';
import './style.css';

const prototypeRoutePages = [
    { id: 'home', title: '设备综合视图' },
    { id: 'access-overview', title: '接入概览' },
    { id: 'product-management', title: '产品管理' },
    { id: 'product-category', title: '产品分类' },
    { id: 'product-create', title: '新增产品' },
    { id: 'product-edit', title: '编辑产品' },
    { id: 'product-view', title: '查看产品' },
    { id: 'model-library', title: '物模型库' },
    { id: 'model-library-create', title: '创建物模型' },
    { id: 'device-management', title: '设备管理' },
    { id: 'device-create', title: '新增设备' },
    { id: 'device-edit', title: '编辑设备' },
    { id: 'device-view', title: '查看设备' },
    { id: 'device-group', title: '设备分组' },
    { id: 'device-map', title: '设备地图' },
    { id: 'device-alarm-info', title: '设备告警信息' },
    { id: 'awo-device-alarm-info', title: '设备告警信息' },
    { id: 'alarm-rule-config', title: '告警规则配置' },
    { id: 'awo-alarm-rule-config', title: '告警规则配置' },
    { id: 'alarm-level-mgmt', title: '告警等级管理' },
    { id: 'awo-alarm-level-mgmt', title: '告警等级管理' },
    { id: 'msg-subscribe', title: '消息订阅' },
    { id: 'push-source-config', title: '推送源配置' },
    { id: 'msg-template', title: '消息模版' },
    { id: 'history-msg', title: '历史消息' },
    { id: 'work-order-management', title: '工单管理' },
    { id: 'work-order-detail', title: '工单详情' },
    { id: 'work-order-create', title: '新增工单' },
    { id: 'protocol-mgmt', title: '协议管理' },
    { id: 'certificate-mgmt', title: '证书管理' },
    { id: 'network-service', title: '网络服务' },
    { id: 'network-protocol', title: '网络协议' },
    { id: 'network-protocol-create', title: '新增网络协议' },
    { id: 'network-protocol-edit', title: '编辑网络协议' },
    { id: 'login-log', title: '登录日志' },
    { id: 'operation-log', title: '操作日志' },
    { id: 'remote-upgrade', title: '远程升级' },
    { id: 'tenant-mgmt', title: '租户管理' },
    { id: 'user-mgmt', title: '用户管理' },
    { id: 'role-mgmt', title: '角色管理' },
    { id: 'dept-mgmt', title: '部门管理' },
    { id: 'position-mgmt', title: '岗位管理' },
    { id: 'menu-mgmt', title: '菜单管理' },
    { id: 'dict-mgmt', title: '字典管理' },
    { id: 'param-mgmt', title: '参数管理' },
    { id: 'notice-announcement', title: '通知公告' },
    { id: 'file-mgmt', title: '文件管理' },
    { id: 'data-monitor', title: '数据监测' },
    { id: 'water-usage-analysis', title: '设备数据' },
    { id: 'data-report', title: '数据报表' },
    { id: 'area-config', title: '区域配置' },
    { id: 'device-archive', title: '大表档案' },
];

const orderedPrototypeRoutePages = [
    ...PROTOTYPE_MENU_PAGE_IDS
        .map((id) => prototypeRoutePages.find((page) => page.id === id))
        .filter((page): page is typeof prototypeRoutePages[number] => Boolean(page)),
    ...prototypeRoutePages.filter((page) => !isPrototypeMenuPage(page.id)),
];

const prototypeRoute = defineHashPageRoute(
    orderedPrototypeRoutePages.map((page) => (
        isPrototypeMenuPage(page.id)
            ? page
            : { ...page, showInMenu: false }
    )),
    { defaultPageId: 'home' },
);

function HomePage({
    onNavigate,
    onNavigateMessageCenter,
    onNavigateAlarmWorkOrder,
    onNavigateSystemManagement,
}: {
    onNavigate: (pageId: DeviceAccessPageId) => void;
    onNavigateMessageCenter: (filter?: NotificationFilter) => void;
    onNavigateAlarmWorkOrder: (filter?: NotificationFilter) => void;
    onNavigateSystemManagement: () => void;
}) {
    return (
        <AppShell
            activeTopTab="设备接入"
            sidebar={<DeviceAccessSidebar pageId="home" onNavigate={onNavigate} />}
            onNavigateMessageCenter={onNavigateMessageCenter}
            onNavigateAlarmWorkOrder={onNavigateAlarmWorkOrder}
            onNavigateSystemManagement={onNavigateSystemManagement}
            onTopTabChange={(tab) => {
                if (tab === '设备接入') onNavigate('home');
            }}
        >
            <ExecutiveDeviceOverview
                onNavigateDevices={() => onNavigate('device-management')}
                onNavigateAlarms={() => onNavigateAlarmWorkOrder()}
                onNavigateWorkOrders={() => {
                    window.location.hash = 'page=work-order-management';
                }}
                onNavigateProductManagement={() => onNavigate('product-management')}
                onNavigateProtocolMgmt={() => onNavigate('protocol-mgmt')}
                onNavigateCertificateMgmt={() => onNavigate('certificate-mgmt')}
                onNavigateNetworkService={() => onNavigate('network-service')}
            />
        </AppShell>
    );
}

export default function IotPlatformHome() {
    return (
        <AnnouncementNotificationProvider>
            <IotPlatformHomeApp />
        </AnnouncementNotificationProvider>
    );
}

function IotPlatformHomeApp() {
    const [sessionUser, setSessionUser] = useState<PlatformSessionUser | null>(() => loadPersistedSession());
    const [annotationPageId, setAnnotationPageId] = useState(() => (
        typeof window !== 'undefined'
            ? (parseHashPage(window.location.hash) ?? (loadPersistedSession() ? 'home' : 'login'))
            : 'home'
    ));

    useEffect(() => {
        const syncAnnotationPage = () => {
            setAnnotationPageId(parseHashPage(window.location.hash) ?? (sessionUser ? 'home' : 'login'));
        };
        window.addEventListener('hashchange', syncAnnotationPage);
        return () => window.removeEventListener('hashchange', syncAnnotationPage);
    }, [sessionUser]);

    const handleLogout = useCallback(() => {
        clearPersistedSession();
        setSessionUser(null);
        setAnnotationPageId('login');
        window.location.hash = '';
    }, []);

    const handleNavigateFromAnnotation = useCallback((pageId: string) => {
        window.location.hash = `page=${pageId}`;
        setAnnotationPageId(pageId);
    }, []);

    if (!sessionUser) {
        const loginUsers = createInitialSystemUsers().filter(
            (user) => user.account === PLATFORM_SUPER_ADMIN_ACCOUNT,
        );
        return (
            <>
                <LoginPage
                    users={loginUsers}
                    onLoginSuccess={(user) => {
                        setSessionUser(user);
                        setAnnotationPageId('home');
                        window.location.hash = 'page=home';
                    }}
                />
                <PrototypeAnnotationLayer
                    currentPageId={annotationPageId}
                    onNavigatePage={handleNavigateFromAnnotation}
                />
            </>
        );
    }

    return (
        <>
            <PlatformAuthProvider user={sessionUser} onLogout={handleLogout}>
                <IotPlatformHomeRoutes sessionUser={sessionUser} />
            </PlatformAuthProvider>
            <PrototypeAnnotationLayer
                currentPageId={annotationPageId}
                onNavigatePage={handleNavigateFromAnnotation}
            />
        </>
    );
}

function IotPlatformHomeRoutes({ sessionUser }: { sessionUser: PlatformSessionUser }) {
    const { page, setPage } = useHashPage(prototypeRoute);
    const activePage = typeof window !== 'undefined'
        ? (parseHashPage(window.location.hash) ?? page)
        : page;
    const platformSession = useMemo(() => sessionUser, [sessionUser]);

    useEffect(() => {
        normalizeProductFormHash();
    }, []);
    const [products, setProducts] = useState(createInitialProducts);
    const [devices, setDevices] = useState(() => {
        const initialProducts = createInitialProducts();
        return seedInitialLargeMeterAreaBindings(
            createInitialDevices(initialProducts),
            initialProducts,
            createInitialAreas(),
        );
    });
    const [deviceArchiveRecords, setDeviceArchiveRecords] = useState<DeviceArchiveRecord[]>(
        () => createInitialDeviceArchiveRecords(devices, products),
    );
    const [archiveFocusDeviceId, setArchiveFocusDeviceId] = useState<string | null>(null);
    const [deviceGroups, setDeviceGroups] = useState(createInitialDeviceGroups);
    const [groupTypes, setGroupTypes] = useState(createInitialGroupTypes);
    const [deviceAlarms, setDeviceAlarms] = useState(() => createInitialDeviceAlarms(createInitialProducts()));
    const [workOrders, setWorkOrders] = useState(createInitialWorkOrders);
    const [protocols, setProtocols] = useState(createInitialProtocols);
    const [certificates, setCertificates] = useState(createInitialCertificates);
    const [networkServices, setNetworkServices] = useState(createInitialNetworkServices);
    const [networkProtocols, setNetworkProtocols] = useState(createInitialNetworkProtocols);
    const [loginLogs] = useState(createInitialLoginLogs);
    const [operationLogs] = useState(createInitialOperationLogs);
    const [firmwarePackages, setFirmwarePackages] = useState<FirmwarePackageRecord[]>(
        () => createInitialFirmwarePackages(createInitialProducts()),
    );
    const [upgradeTasks, setUpgradeTasks] = useState<UpgradeTaskRecord[]>([]);
    const [upgradeBatches, setUpgradeBatches] = useState<UpgradeTaskBatchRecord[]>([]);
    const [upgradeDeviceDetails] = useState<UpgradeDeviceDetailRecord[]>([]);
    const [tenants, setTenants] = useState(createInitialTenants);
    const [systemUsers, setSystemUsers] = useState(createInitialSystemUsers);
    const [systemRoles, setSystemRoles] = useState(createInitialRoles);
    const [systemDepartments, setSystemDepartments] = useState(createInitialDepartments);
    const [systemPositions, setSystemPositions] = useState(createInitialPositions);
    const [systemMenus, setSystemMenus] = useState(createInitialSystemMenus);
    const [dictionaries, setDictionaries] = useState(createInitialDictionaries);
    const [systemParams, setSystemParams] = useState(createInitialParams);
    const [systemFiles, setSystemFiles] = useState(createInitialSystemFiles);
    const [messageSubscriptions, setMessageSubscriptions] = useState(createInitialMessageSubscriptions);
    const [messagePushSettings, setMessagePushSettings] = useState(createInitialMessagePushSettings);
    const [pushSources, setPushSources] = useState(createInitialPushSources);
    const [messageTemplates, setMessageTemplates] = useState(createInitialMessageTemplates);
    const [alarmLevels, setAlarmLevels] = useState(createInitialAlarmLevels);
    const [alarmRuleCategories, setAlarmRuleCategories] = useState(createInitialAlarmRuleCategories);
    const [alarmRules, setAlarmRules] = useState(createInitialAlarmRules);
    const [areas, setAreas] = useState(createInitialAreas);
    const [largeMeters, setLargeMeters] = useState<LargeMeterDevice[]>(() => createInitialLargeMeters());
    const [nightlyWaterUsageConfig, setNightlyWaterUsageConfig] = useState<NightlyWaterUsageConfig>(
        () => createInitialNightlyWaterUsageConfig(),
    );
    const [analysisMeterId, setAnalysisMeterId] = useState<string | null>(null);
    const [waterUsageAnalysisRoute, setWaterUsageAnalysisRoute] = useState<WaterUsageAnalysisRoute>(() => (
        parseWaterUsageAnalysisRoute(window.location.hash)
    ));
    const [thingModelTabData, setThingModelTabData] = useState(createInitialThingModelTabData);
    const [thingModelFormRoute, setThingModelFormRoute] = useState(
        () => parseThingModelFormRoute(window.location.hash),
    );
    const [deviceManagementRoute, setDeviceManagementRoute] = useState(() => parseDeviceManagementRoute(window.location.hash));
    const [deviceFormRoute, setDeviceFormRoute] = useState<DeviceFormRoute>(() => (
        mergeDeviceFormRoute(
            { mode: 'create', deviceId: null, productId: null, tab: null },
            window.location.hash,
        )
    ));
    const [productFormRoute, setProductFormRoute] = useState<ProductFormRoute>(() => (
        mergeProductFormRoute(
            { mode: 'create', productId: null },
            window.location.hash,
        )
    ));
    const [workOrderDetailRoute, setWorkOrderDetailRoute] = useState(() => parseWorkOrderDetailRoute(window.location.hash));
    const [networkProtocolFormRoute, setNetworkProtocolFormRoute] = useState(
        () => parseNetworkProtocolFormRoute(window.location.hash),
    );
    const [pendingAlarmKeyword, setPendingAlarmKeyword] = useState<string | undefined>(undefined);
    const [pendingWorkOrderStatus, setPendingWorkOrderStatus] = useState<string | undefined>(undefined);

    useEffect(() => {
        setDeviceAlarms((previous) => {
            const existingIds = new Set(previous.map((alarm) => alarm.id));
            const missing = createInitialDeviceAlarms(products).filter((alarm) => !existingIds.has(alarm.id));
            return missing.length ? [...previous, ...missing] : previous;
        });
    }, [products]);

    const syncDeviceFormRoute = useCallback((previous: DeviceFormRoute) => (
        mergeDeviceFormRoute(previous, window.location.hash)
    ), []);

    const syncProductFormRoute = useCallback((previous: ProductFormRoute) => (
        mergeProductFormRoute(previous, window.location.hash)
    ), []);

    const syncWaterUsageAnalysisRoute = useCallback((previous: WaterUsageAnalysisRoute) => (
        mergeWaterUsageAnalysisRoute(previous, window.location.hash)
    ), []);

    useEffect(() => {
        const syncRoute = () => {
            setThingModelFormRoute(parseThingModelFormRoute(window.location.hash));
            setDeviceManagementRoute(parseDeviceManagementRoute(window.location.hash));
            setDeviceFormRoute((previous) => syncDeviceFormRoute(previous));
            setProductFormRoute((previous) => syncProductFormRoute(previous));
            setWorkOrderDetailRoute(parseWorkOrderDetailRoute(window.location.hash));
            setNetworkProtocolFormRoute(parseNetworkProtocolFormRoute(window.location.hash));
            setWaterUsageAnalysisRoute((previous) => syncWaterUsageAnalysisRoute(previous));
        };
        window.addEventListener('hashchange', syncRoute);
        return () => window.removeEventListener('hashchange', syncRoute);
    }, [syncDeviceFormRoute, syncProductFormRoute, syncWaterUsageAnalysisRoute]);

    useEffect(() => {
        setThingModelFormRoute(parseThingModelFormRoute(window.location.hash));
        setDeviceManagementRoute(parseDeviceManagementRoute(window.location.hash));
        setDeviceFormRoute((previous) => syncDeviceFormRoute(previous));
        setProductFormRoute((previous) => syncProductFormRoute(previous));
        setWorkOrderDetailRoute(parseWorkOrderDetailRoute(window.location.hash));
        setNetworkProtocolFormRoute(parseNetworkProtocolFormRoute(window.location.hash));
        setWaterUsageAnalysisRoute((previous) => syncWaterUsageAnalysisRoute(previous));
    }, [page, syncDeviceFormRoute, syncProductFormRoute, syncWaterUsageAnalysisRoute]);

    const navigateDeviceAccess = (target: DeviceAccessPageId) => {
        setPage(target);
    };

    const navigateBackToDeviceManagement = useCallback(() => {
        navigateDeviceManagement({
            productId: deviceManagementRoute.productId ?? undefined,
            groupId: deviceManagementRoute.groupId ?? undefined,
        });
    }, [deviceManagementRoute.groupId, deviceManagementRoute.productId]);

    const navigateBackToProductManagement = useCallback(() => {
        window.location.hash = 'page=product-management';
    }, []);

    const navigateLargeMeterCenter = (target: LargeMeterPageId) => {
        if (target === 'device-archive') setArchiveFocusDeviceId(null);
        setPage(target);
    };

    const navigateWaterUsageAnalysis = (meterId: string) => {
        setAnalysisMeterId(meterId);
        setWaterUsageAnalysisRoute({ meterId });
        setWaterUsageAnalysisHash(meterId);
    };

    const resolveWaterUsageAnalysisMeter = useCallback((): LargeMeterDevice | null => {
        const meterId = waterUsageAnalysisRoute.meterId ?? analysisMeterId;
        if (meterId) {
            const matched = largeMeters.find((meter) => meter.id === meterId);
            if (matched) {
                return matched;
            }
        }
        return largeMeters[0] ?? null;
    }, [analysisMeterId, largeMeters, waterUsageAnalysisRoute.meterId]);

    const navigateDeviceArchive = (deviceId: string) => {
        setArchiveFocusDeviceId(deviceId);
        setPage('device-archive');
    };

    const navigateMessageCenter = (target: MessageCenterPageId, filter?: NotificationFilter) => {
        if (filter?.keyword) {
            setPendingAlarmKeyword(filter.keyword);
        }
        setPage(target);
    };

    const navigateAlarmWorkOrder = (target: AlarmWorkOrderPageId, filter?: NotificationFilter) => {
        if (filter?.keyword) {
            setPendingAlarmKeyword(filter.keyword);
        }
        if (filter?.status) {
            setPendingWorkOrderStatus(filter.status);
        }
        setPage(target);
    };


    const navigateSystemManagement = (target: SystemManagementPageId) => {
        setPage(target);
    };

    useEffect(() => {
        if (page !== 'water-usage-analysis') {
            return;
        }
        if (resolveWaterUsageAnalysisMeter()) {
            return;
        }
        setPage('data-monitor');
    }, [page, resolveWaterUsageAnalysisMeter, setPage]);

    // Filter-aware callbacks for AppShell notification navigation
    const shellNavigateLargeMeterCenter = () => {
        setPage('data-monitor');
    };

    const shellNavigateMessageCenter = (filter?: NotificationFilter) => {
        if (filter?.keyword) {
            setPendingAlarmKeyword(filter.keyword);
        }
        setPage('msg-subscribe');
    };

    const shellNavigateAlarmWorkOrder = (filter?: NotificationFilter) => {
        if (filter?.keyword) {
            setPendingAlarmKeyword(filter.keyword);
        }
        if (filter?.status) {
            setPendingWorkOrderStatus(filter.status);
        }
        setPage('awo-device-alarm-info');
    };


    const shellNavigateSystemManagement = () => {
        setPage('tenant-mgmt');
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
        const previousDevice = devices.find((item) => item.id === device.id);
        if (previousDevice) {
            const archiveRecords = createArchiveRecordsFromDeviceChange(previousDevice, device, {
                operator: platformSession.displayName || platformSession.account,
            });
            if (archiveRecords.length) {
                setDeviceArchiveRecords((previous) => [...archiveRecords, ...previous]);
            }
        }
        setDevices((prev) => prev.map((item) => (item.id === device.id ? device : item)));
    };

    if (activePage === 'user-mgmt') {
        return (
            <UserManagementPage
                users={systemUsers}
                tenants={tenants}
                roles={systemRoles}
                positions={systemPositions}
                onUpdateUsers={setSystemUsers}
                onNavigateHome={() => setPage('home')}
                onNavigateDeviceAccess={() => setPage('home')}
                onNavigateMessageCenter={shellNavigateMessageCenter}
                onNavigate={navigateSystemManagement}
            />
        );
    }

    if (activePage === 'role-mgmt') {
        return (
            <RoleManagementPage
                roles={systemRoles}
                tenants={tenants}
                onUpdateRoles={setSystemRoles}
                onNavigateHome={() => setPage('home')}
                onNavigateDeviceAccess={() => setPage('home')}
                onNavigateMessageCenter={shellNavigateMessageCenter}
                onNavigate={navigateSystemManagement}
            />
        );
    }

    if (activePage === 'dept-mgmt') {
        return (
            <DepartmentManagementPage
                departments={systemDepartments}
                tenants={tenants}
                users={systemUsers}
                onUpdateDepartments={setSystemDepartments}
                onNavigateHome={() => setPage('home')}
                onNavigateDeviceAccess={() => setPage('home')}
                onNavigateMessageCenter={shellNavigateMessageCenter}
                onNavigate={navigateSystemManagement}
            />
        );
    }

    if (activePage === 'position-mgmt') {
        return (
            <PositionManagementPage
                positions={systemPositions}
                onUpdatePositions={setSystemPositions}
                onNavigateHome={() => setPage('home')}
                onNavigateDeviceAccess={() => setPage('home')}
                onNavigateMessageCenter={shellNavigateMessageCenter}
                onNavigate={navigateSystemManagement}
            />
        );
    }

    if (activePage === 'tenant-mgmt') {
        return (
            <TenantManagementPage
                tenants={tenants}
                onUpdateTenants={setTenants}
                onNavigateHome={() => setPage('home')}
                onNavigateDeviceAccess={() => setPage('home')}
                onNavigateMessageCenter={shellNavigateMessageCenter}
                onNavigate={navigateSystemManagement}
            />
        );
    }

    if (activePage === 'menu-mgmt') {
        return (
            <MenuManagementPage
                menus={systemMenus}
                onUpdateMenus={setSystemMenus}
                onNavigateHome={() => setPage('home')}
                onNavigateDeviceAccess={() => setPage('home')}
                onNavigateMessageCenter={shellNavigateMessageCenter}
                onNavigate={navigateSystemManagement}
            />
        );
    }

    if (activePage === 'dict-mgmt') {
        return (
            <DictionaryManagementPage
                dictionaries={dictionaries}
                onUpdateDictionaries={setDictionaries}
                onNavigateHome={() => setPage('home')}
                onNavigateDeviceAccess={() => setPage('home')}
                onNavigateMessageCenter={shellNavigateMessageCenter}
                onNavigate={navigateSystemManagement}
            />
        );
    }

    if (activePage === 'param-mgmt') {
        return (
            <ParamManagementPage
                params={systemParams}
                onUpdateParams={setSystemParams}
                onNavigateHome={() => setPage('home')}
                onNavigateDeviceAccess={() => setPage('home')}
                onNavigateMessageCenter={shellNavigateMessageCenter}
                onNavigate={navigateSystemManagement}
            />
        );
    }

    if (activePage === 'notice-announcement') {
        return (
            <NoticeAnnouncementPage
                onNavigateHome={() => setPage('home')}
                onNavigateDeviceAccess={() => setPage('home')}
                onNavigateMessageCenter={shellNavigateMessageCenter}
                onNavigate={navigateSystemManagement}
            />
        );
    }

    if (activePage === 'file-mgmt') {
        return (
            <FileManagementPage
                files={systemFiles}
                onUpdateFiles={setSystemFiles}
                onNavigateHome={() => setPage('home')}
                onNavigateDeviceAccess={() => setPage('home')}
                onNavigateMessageCenter={shellNavigateMessageCenter}
                onNavigate={navigateSystemManagement}
            />
        );
    }

    if (activePage === 'login-log') {
        return (
            <LoginLogPage
                loginLogs={loginLogs}
                onNavigateHome={() => setPage('home')}
                onNavigateDeviceAccess={() => setPage('home')}
                onNavigateMessageCenter={shellNavigateMessageCenter}
                onNavigateSystemManagement={shellNavigateSystemManagement}
                onNavigate={navigateSystemManagement}
            />
        );
    }

    if (activePage === 'operation-log') {
        return (
            <OperationLogPage
                operationLogs={operationLogs}
                onNavigateHome={() => setPage('home')}
                onNavigateDeviceAccess={() => setPage('home')}
                onNavigateMessageCenter={shellNavigateMessageCenter}
                onNavigateSystemManagement={shellNavigateSystemManagement}
                onNavigate={navigateSystemManagement}
            />
        );
    }

    if (activePage === 'remote-upgrade') {
        return (
            <RemoteUpgradePage
                products={products}
                devices={devices}
                firmwarePackages={firmwarePackages}
                upgradeTasks={upgradeTasks}
                upgradeBatches={upgradeBatches}
                upgradeDeviceDetails={upgradeDeviceDetails}
                onUpdateFirmwarePackages={setFirmwarePackages}
                onUpdateUpgradeTasks={setUpgradeTasks}
                onUpdateUpgradeBatches={setUpgradeBatches}
                onNavigateHome={() => setPage('home')}
                onNavigateDeviceAccess={() => setPage('home')}
                onNavigateMessageCenter={shellNavigateMessageCenter}
                onNavigate={navigateDeviceAccess}
            />
        );
    }

    if (activePage === 'network-protocol') {
        return (
            <NetworkProtocolManagementPage
                networkProtocols={networkProtocols}
                onUpdateNetworkProtocols={setNetworkProtocols}
                onNavigateHome={() => setPage('home')}
                onNavigateDeviceAccess={() => setPage('home')}
                onNavigateMessageCenter={shellNavigateMessageCenter}
                onNavigate={navigateDeviceAccess}
            />
        );
    }

    if (activePage === 'network-protocol-create' || activePage === 'network-protocol-edit') {
        const editingRecord = activePage === 'network-protocol-edit'
            ? networkProtocols.find((item) => item.id === networkProtocolFormRoute.networkProtocolId) ?? null
            : null;

        return (
            <NetworkProtocolWizardPage
                mode={activePage === 'network-protocol-create' ? 'create' : 'edit'}
                editingRecord={editingRecord}
                networkProtocols={networkProtocols}
                onUpdateNetworkProtocols={setNetworkProtocols}
                onNavigateHome={() => setPage('home')}
                onNavigateDeviceAccess={() => setPage('home')}
                onNavigateMessageCenter={shellNavigateMessageCenter}
                onNavigate={navigateDeviceAccess}
                onBack={() => setPage('network-protocol')}
            />
        );
    }

    if (activePage === 'protocol-mgmt') {
        return (
            <ProtocolManagementPage
                protocols={protocols}
                products={products}
                onUpdateProtocols={setProtocols}
                onNavigateHome={() => setPage('home')}
                onNavigateDeviceAccess={() => setPage('home')}
                onNavigateMessageCenter={shellNavigateMessageCenter}
                onNavigate={navigateDeviceAccess}
            />
        );
    }

    if (activePage === 'certificate-mgmt') {
        return (
            <CertificateManagementPage
                certificates={certificates}
                onUpdateCertificates={setCertificates}
                onNavigateHome={() => setPage('home')}
                onNavigateDeviceAccess={() => setPage('home')}
                onNavigateMessageCenter={shellNavigateMessageCenter}
                onNavigate={navigateDeviceAccess}
            />
        );
    }

    if (activePage === 'network-service') {
        return (
            <NetworkServiceManagementPage
                networkServices={networkServices}
                certificates={certificates}
                onUpdateNetworkServices={setNetworkServices}
                onNavigateHome={() => setPage('home')}
                onNavigateDeviceAccess={() => setPage('home')}
                onNavigateMessageCenter={shellNavigateMessageCenter}
                onNavigate={navigateDeviceAccess}
            />
        );
    }

    if (activePage === 'work-order-management' || activePage === 'work-order-create' || activePage === 'work-order-detail') {
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
                createDrawerOpen={activePage === 'work-order-create'}
                onCreateDrawerOpenChange={(open) => {
                    if (!open && activePage === 'work-order-create') {
                        setPage('work-order-management');
                    }
                }}
                detailDrawerOpen={activePage === 'work-order-detail'}
                detailWorkOrderId={activePage === 'work-order-detail' ? workOrderDetailRoute.workOrderId : null}
                onDetailDrawerOpenChange={(open) => {
                    if (!open && activePage === 'work-order-detail') {
                        setPage('work-order-management');
                    }
                }}
                onUpdateWorkOrders={setWorkOrders}
                onNavigateHome={() => setPage('home')}
                onNavigateDeviceAccess={() => setPage('home')}
                onNavigateMessageCenter={shellNavigateMessageCenter}
                onNavigateAlarmWorkOrder={navigateAlarmWorkOrder}
                onNavigate={navigateAlarmWorkOrder}
                onCreateWorkOrder={(workOrder) => {
                    setWorkOrders((prev) => [workOrder, ...prev]);
                }}
                initialStatus={workOrderFilter}
            />
        );
    }

    if (activePage === 'awo-device-alarm-info') {
        const alarmFilter = pendingAlarmKeyword;
        if (pendingAlarmKeyword) {
            setPendingAlarmKeyword(undefined);
        }
        return (
            <DeviceAlarmInfoPage
                products={products}
                alarms={deviceAlarms}
                onUpdateAlarms={setDeviceAlarms}
                module="alarm-work-order"
                onNavigateHome={() => setPage('home')}
                onNavigateDeviceAccess={() => setPage('home')}
                onNavigate={navigateMessageCenter}
                onNavigateAlarmWorkOrder={navigateAlarmWorkOrder}
                onViewWorkOrder={navigateWorkOrderDetail}
                onCreateWorkOrder={(workOrder) => {
                    setWorkOrders((prev) => [workOrder, ...prev]);
                }}
                initialKeyword={alarmFilter}
            />
        );
    }

    if (activePage === 'awo-alarm-rule-config') {
        return (
            <AlarmRuleConfigPage
                categories={alarmRuleCategories}
                rules={alarmRules}
                products={products}
                devices={devices}
                alarmLevels={alarmLevels}
                onUpdateCategories={setAlarmRuleCategories}
                onUpdateRules={setAlarmRules}
                module="alarm-work-order"
                onNavigateHome={() => setPage('home')}
                onNavigateDeviceAccess={() => setPage('home')}
                onNavigate={navigateMessageCenter}
                onNavigateAlarmWorkOrder={navigateAlarmWorkOrder}
            />
        );
    }

    if (activePage === 'msg-template') {
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

    if (activePage === 'history-msg') {
        return (
            <HistoryMessagePage
                onNavigateHome={() => setPage('home')}
                onNavigate={navigateMessageCenter}
            />
        );
    }

    if (activePage === 'push-source-config') {
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

    if (activePage === 'msg-subscribe') {
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

    if (activePage === 'awo-alarm-level-mgmt') {
        return (
            <AlarmLevelManagementPage
                levels={alarmLevels}
                alarms={deviceAlarms}
                onUpdateLevels={setAlarmLevels}
                module="alarm-work-order"
                onNavigateHome={() => setPage('home')}
                onNavigateDeviceAccess={() => setPage('home')}
                onNavigate={navigateMessageCenter}
                onNavigateAlarmWorkOrder={navigateAlarmWorkOrder}
            />
        );
    }

    if (activePage === 'water-usage-analysis') {
        const analysisMeter = resolveWaterUsageAnalysisMeter();
        if (analysisMeter) {
            return (
                <WaterUsageAnalysisPage
                    meter={analysisMeter}
                    nightlyConfig={nightlyWaterUsageConfig}
                    areas={areas}
                    products={products}
                    deviceAlarms={deviceAlarms}
                    onUpdateAlarms={setDeviceAlarms}
                    onCreateWorkOrder={(workOrder) => {
                        setWorkOrders((prev) => [workOrder, ...prev]);
                    }}
                    onViewWorkOrder={navigateWorkOrderDetail}
                    onBack={() => setPage('data-monitor')}
                    onNavigateDeviceAccess={() => setPage('home')}
                    onNavigate={navigateLargeMeterCenter}
                    onNavigateMessageCenter={shellNavigateMessageCenter}
                    onNavigateAlarmWorkOrder={shellNavigateAlarmWorkOrder}
                    onNavigateSystemManagement={shellNavigateSystemManagement}
                    onNavigateLargeMeterCenter={shellNavigateLargeMeterCenter}
                />
            );
        }
    }

    if (activePage === 'data-monitor') {
        return (
            <DataMonitorPage
                areas={areas}
                meters={largeMeters}
                nightlyConfig={nightlyWaterUsageConfig}
                onUpdateNightlyConfig={setNightlyWaterUsageConfig}
                onNavigateDeviceAccess={() => setPage('home')}
                onNavigate={navigateLargeMeterCenter}
                onAnalyzeMeter={navigateWaterUsageAnalysis}
                onNavigateMessageCenter={shellNavigateMessageCenter}
                onNavigateAlarmWorkOrder={shellNavigateAlarmWorkOrder}
                onNavigateSystemManagement={shellNavigateSystemManagement}
                onNavigateLargeMeterCenter={shellNavigateLargeMeterCenter}
            />
        );
    }

    if (activePage === 'data-report') {
        return (
            <DataReportPage
                areas={areas}
                meters={largeMeters}
                onNavigateDeviceAccess={() => setPage('home')}
                onNavigate={navigateLargeMeterCenter}
                onNavigateMessageCenter={shellNavigateMessageCenter}
                onNavigateAlarmWorkOrder={shellNavigateAlarmWorkOrder}
                onNavigateSystemManagement={shellNavigateSystemManagement}
                onNavigateLargeMeterCenter={shellNavigateLargeMeterCenter}
            />
        );
    }

    if (activePage === 'device-archive') {
        return (
            <DeviceArchivePage
                devices={devices}
                products={products}
                areas={areas}
                records={deviceArchiveRecords}
                initialDeviceId={archiveFocusDeviceId}
                onUpdateRecords={setDeviceArchiveRecords}
                onNavigateDeviceAccess={() => setPage('home')}
                onNavigate={navigateLargeMeterCenter}
                onNavigateMessageCenter={shellNavigateMessageCenter}
                onNavigateAlarmWorkOrder={shellNavigateAlarmWorkOrder}
                onNavigateSystemManagement={shellNavigateSystemManagement}
                onNavigateLargeMeterCenter={shellNavigateLargeMeterCenter}
            />
        );
    }

    if (activePage === 'area-config') {
        return (
            <AreaConfigPage
                areas={areas}
                devices={devices}
                products={products}
                deviceGroups={deviceGroups}
                groupTypes={groupTypes}
                dictionaries={dictionaries}
                onUpdateAreas={setAreas}
                onUpdateDevices={setDevices}
                onUpdateLargeMeters={setLargeMeters}
                onUpdateArchiveRecords={setDeviceArchiveRecords}
                onViewDeviceArchive={navigateDeviceArchive}
                onNavigateDeviceAccess={() => setPage('home')}
                onNavigate={navigateLargeMeterCenter}
                onNavigateMessageCenter={shellNavigateMessageCenter}
                onNavigateAlarmWorkOrder={shellNavigateAlarmWorkOrder}
                onNavigateSystemManagement={shellNavigateSystemManagement}
                onNavigateLargeMeterCenter={shellNavigateLargeMeterCenter}
            />
        );
    }

    if (activePage === 'home' || activePage === 'access-overview') {
        return (
            <HomePage
                onNavigate={navigateDeviceAccess}
                onNavigateMessageCenter={shellNavigateMessageCenter}
                onNavigateAlarmWorkOrder={shellNavigateAlarmWorkOrder}
                onNavigateSystemManagement={() => setPage('tenant-mgmt')}
            />
        );
    }

    if (activePage === 'device-management') {
        return (
            <DeviceManagementPage
                products={products}
                devices={devices}
                deviceGroups={deviceGroups}
                groupTypes={groupTypes}
                onUpdateDevices={setDevices}
                onDeviceChanged={(before, after) => {
                    const archiveRecords = createArchiveRecordsFromDeviceChange(before, after, {
                        operator: platformSession.displayName || platformSession.account,
                    });
                    if (archiveRecords.length) {
                        setDeviceArchiveRecords((previous) => [...archiveRecords, ...previous]);
                    }
                }}
                initialProductId={deviceManagementRoute.productId}
                initialGroupId={deviceManagementRoute.groupId}
                onNavigateHome={() => setPage('home')}
                onNavigate={navigateDeviceAccess}
            />
        );
    }

    if (activePage === 'device-map') {
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

    if (activePage === 'device-group') {
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

    if (isDeviceFormPage(activePage)) {
        const resolvedDeviceFormRoute = (() => {
            const fromHash = typeof window !== 'undefined'
                ? parseDeviceFormRoute(window.location.hash)
                : deviceFormRoute;
            return {
                mode: fromHash.mode,
                deviceId: fromHash.deviceId ?? deviceFormRoute.deviceId,
                productId: fromHash.productId ?? deviceFormRoute.productId,
                tab: fromHash.tab ?? deviceFormRoute.tab,
            };
        })();

        return (
            <DeviceCreatePage
                mode={resolvedDeviceFormRoute.mode}
                deviceId={resolvedDeviceFormRoute.deviceId}
                defaultProductId={resolvedDeviceFormRoute.productId}
                initialTab={resolvedDeviceFormRoute.tab}
                products={products}
                devices={devices}
                deviceAlarms={deviceAlarms}
                onUpdateAlarms={setDeviceAlarms}
                onCreateWorkOrder={(workOrder) => {
                    setWorkOrders((prev) => [workOrder, ...prev]);
                }}
                onViewWorkOrder={navigateWorkOrderDetail}
                onSaveDevice={handleSaveDevice}
                onNavigateHome={() => setPage('home')}
                onNavigate={navigateDeviceAccess}
                onBack={navigateBackToDeviceManagement}
            />
        );
    }

    if (isProductFormPage(activePage)) {
        const resolvedProductFormRoute = (() => {
            const fromHash = typeof window !== 'undefined'
                ? parseProductFormRoute(window.location.hash)
                : productFormRoute;
            return {
                mode: fromHash.mode,
                productId: fromHash.productId ?? productFormRoute.productId,
            };
        })();

        return (
            <ProductCreatePage
                mode={resolvedProductFormRoute.mode}
                productId={resolvedProductFormRoute.productId}
                products={products}
                onSaveProduct={handleSaveProduct}
                onNavigateHome={() => setPage('home')}
                onNavigate={navigateDeviceAccess}
                onBack={navigateBackToProductManagement}
            />
        );
    }

    if (activePage === 'product-category') {
        return (
            <ProductCategoryPage
                onNavigateHome={() => setPage('home')}
                onNavigate={navigateDeviceAccess}
            />
        );
    }

    if (activePage === 'model-library-create' && thingModelFormRoute) {
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

    if (activePage === 'model-library') {
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

    if (activePage === 'product-management') {
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
            onNavigateAlarmWorkOrder={shellNavigateAlarmWorkOrder}
            onNavigateSystemManagement={() => setPage('tenant-mgmt')}
        />
    );
}
