/**
 * @name 设备管理 App
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { defineHashPageRoute, useHashPage } from '../../common/useHashPage';
import type { DeviceAlarmRecord } from '../iot-platform-home/data/deviceAlarms';
import type { WorkOrderRecord } from '../iot-platform-home/data/workOrders';
import { CURRENT_WORK_ORDER_USER } from '../iot-platform-home/data/workOrders';
import EmptyState from './components/EmptyState';
import { PhoneShell } from './components/PhoneShell';
import type { NavBarProps } from './components/NavBar';
import type { TabId } from './components/TabBar';
import {
    countAbnormalDevices,
    countPendingAlarms,
    countPendingWorkOrders,
    createMobileAppBootstrap,
    findDeviceById,
} from './data/appData';
import { useHashQueryParams } from './hooks/useHashQueryParams';
import { buildHashPage } from './utils/hashParams';
import { formatNowTimestamp } from './utils/format';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import DeviceListPage from './pages/DeviceListPage';
import DeviceDetailPage from './pages/DeviceDetailPage';
import AlarmListPage from './pages/AlarmListPage';
import AlarmDetailPage from './pages/AlarmDetailPage';
import WorkOrderListPage from './pages/WorkOrderListPage';
import WorkOrderDetailPage from './pages/WorkOrderDetailPage';
import ProfilePage from './pages/ProfilePage';
import './style.css';

const ROUTE = defineHashPageRoute([
    { id: 'login', title: '登录', showInMenu: false },
    { id: 'home', title: '首页' },
    { id: 'devices', title: '设备' },
    { id: 'device-detail', title: '设备详情', showInMenu: false },
    { id: 'alarms', title: '告警' },
    { id: 'alarm-detail', title: '告警详情', showInMenu: false },
    { id: 'workorders', title: '工单' },
    { id: 'workorder-detail', title: '工单详情', showInMenu: false },
    { id: 'profile', title: '我的' },
], { defaultPageId: 'login' });

const MENU_PAGES = new Set<TabId>(['home', 'devices', 'alarms', 'workorders', 'profile']);
const DETAIL_PAGES = new Set(['device-detail', 'alarm-detail', 'workorder-detail']);

type ListPreset = {
    devices?: 'all' | 'water' | 'pressure' | 'abnormal';
    alarms?: 'pending' | 'processing' | 'done' | 'all';
    workorders?: 'pending' | 'processing' | 'completed' | 'all';
};

function pageToTab(page: string): TabId {
    if (page === 'devices' || page === 'device-detail') return 'devices';
    if (page === 'alarms' || page === 'alarm-detail') return 'alarms';
    if (page === 'workorders' || page === 'workorder-detail') return 'workorders';
    if (page === 'profile') return 'profile';
    return 'home';
}

export default function DeviceMgmtApp() {
    const { page, setPage } = useHashPage(ROUTE);
    const hashParams = useHashQueryParams();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [initialData] = useState(createMobileAppBootstrap);
    const devices = initialData.devices;
    const [alarms, setAlarms] = useState(initialData.alarms);
    const [workOrders, setWorkOrders] = useState(initialData.workOrders);
    const [notifications, setNotifications] = useState(initialData.notifications);
    const [listPreset, setListPreset] = useState<ListPreset>({});

    const selectedDeviceId = hashParams.get('deviceId')?.trim() || '';
    const selectedAlarmId = hashParams.get('alarmId')?.trim() || '';
    const selectedWorkOrderId = hashParams.get('workOrderId')?.trim() || '';

    useEffect(() => {
        if (!isLoggedIn && page !== 'login') {
            setPage('login');
        }
        if (isLoggedIn && page === 'login') {
            setPage('home');
        }
    }, [isLoggedIn, page, setPage]);

    const navigate = useCallback((pageId: string, params?: Record<string, string>) => {
        if (typeof window === 'undefined') return;
        window.location.hash = buildHashPage(pageId, params).replace(/^#/, '');
    }, []);

    const handleTabChange = useCallback((tab: TabId) => {
        setListPreset({});
        setPage(tab);
    }, [setPage]);

    const pendingAlarms = useMemo(() => countPendingAlarms(alarms), [alarms]);
    const pendingWorkOrders = useMemo(() => countPendingWorkOrders(workOrders), [workOrders]);
    const abnormalDevices = useMemo(() => countAbnormalDevices(devices), [devices]);
    const unreadNotifications = useMemo(
        () => notifications.filter((item) => !item.read).length,
        [notifications],
    );

    const selectedDevice = useMemo(
        () => (selectedDeviceId ? findDeviceById(devices, selectedDeviceId) : undefined),
        [devices, selectedDeviceId],
    );
    const selectedAlarm = useMemo(
        () => alarms.find((item) => item.id === selectedAlarmId),
        [alarms, selectedAlarmId],
    );
    const selectedWorkOrder = useMemo(
        () => workOrders.find((item) => item.id === selectedWorkOrderId),
        [workOrders, selectedWorkOrderId],
    );

    const handleLogin = useCallback(() => {
        setIsLoggedIn(true);
        setPage('home');
    }, [setPage]);

    const handleConfirmAlarm = useCallback((alarmId: string) => {
        const now = formatNowTimestamp();
        setAlarms((prev) => prev.map((item) => (
            item.id === alarmId
                ? {
                    ...item,
                    processStatus: '处理中',
                    processHandler: CURRENT_WORK_ORDER_USER,
                    processTime: now,
                }
                : item
        )));
    }, []);

    const handleCloseAlarm = useCallback((alarmId: string) => {
        const now = formatNowTimestamp();
        setAlarms((prev) => prev.map((item) => (
            item.id === alarmId
                ? {
                    ...item,
                    processStatus: '已处理',
                    processMethod: '直接处理',
                    processResult: '现场确认后关闭',
                    processHandler: CURRENT_WORK_ORDER_USER,
                    processTime: now,
                }
                : item
        )));
    }, []);

    const handleTransferAlarm = useCallback((alarmId: string) => {
        const alarm = alarms.find((item) => item.id === alarmId);
        if (!alarm) return;

        const existing = workOrders.find((item) => item.alarmId === alarmId);
        if (existing) {
            navigate('workorder-detail', { workOrderId: existing.id });
        } else {
            const newId = `WO${Date.now()}`;
            const createdAt = formatNowTimestamp();
            const newWorkOrder: WorkOrderRecord = {
                id: newId,
                name: alarm.eventName,
                level: alarm.level,
                type: '告警工单',
                status: '待处理',
                createdAt,
                readStatus: '未读',
                content: alarm.content,
                space: alarm.space,
                assignees: [CURRENT_WORK_ORDER_USER],
                alarmId: alarm.id,
            };
            setWorkOrders((prev) => [newWorkOrder, ...prev]);
            setNotifications((prev) => [{
                id: `notice-wo-${newId}`,
                title: '新工单',
                content: newWorkOrder.name,
                time: createdAt,
                read: false,
            }, ...prev]);
            navigate('workorder-detail', { workOrderId: newId });
        }

        setAlarms((prev) => prev.map((item) => (
            item.id === alarmId
                ? { ...item, processStatus: '处理中', processMethod: '工单处理' }
                : item
        )));
    }, [alarms, navigate, workOrders]);

    const handleAcceptWorkOrder = useCallback((workOrderId: string) => {
        setWorkOrders((prev) => prev.map((item) => (
            item.id === workOrderId
                ? {
                    ...item,
                    handler: CURRENT_WORK_ORDER_USER,
                    handledAt: formatNowTimestamp(),
                }
                : item
        )));
    }, []);

    const handleCompleteWorkOrder = useCallback((workOrderId: string, result: string) => {
        setWorkOrders((prev) => prev.map((item) => (
            item.id === workOrderId
                ? {
                    ...item,
                    status: '已结单',
                    result,
                    closedAt: formatNowTimestamp(),
                }
                : item
        )));
    }, []);

    const homePageProps = useMemo(() => ({
        pendingAlarms,
        pendingWorkOrders,
        abnormalDevices,
        onOpenAlarms: () => {
            setListPreset({ alarms: 'pending' });
            setPage('alarms');
        },
        onOpenWorkOrders: () => {
            setListPreset({ workorders: 'pending' });
            setPage('workorders');
        },
        onOpenDevices: () => {
            setListPreset({ devices: 'abnormal' });
            setPage('devices');
        },
        onQuickNavigate: (target: 'devices' | 'alarms' | 'workorders') => {
            setListPreset({});
            setPage(target);
        },
    }), [abnormalDevices, pendingAlarms, pendingWorkOrders, setPage]);

    const renderPage = () => {
        if (!isLoggedIn) {
            return <LoginPage onLogin={handleLogin} />;
        }

        switch (page) {
            case 'home':
                return <HomePage {...homePageProps} />;
            case 'devices':
                return (
                    <DeviceListPage
                        devices={devices}
                        initialFilter={listPreset.devices || 'all'}
                        onOpenDevice={(deviceId) => navigate('device-detail', { deviceId })}
                    />
                );
            case 'device-detail':
                return selectedDevice
                    ? <DeviceDetailPage device={selectedDevice} />
                    : <EmptyState message="未找到设备" />;
            case 'alarms':
                return (
                    <AlarmListPage
                        alarms={alarms}
                        initialFilter={listPreset.alarms || 'all'}
                        onOpenAlarm={(alarmId) => navigate('alarm-detail', { alarmId })}
                    />
                );
            case 'alarm-detail':
                return selectedAlarm ? (
                    <AlarmDetailPage
                        alarm={selectedAlarm}
                        onConfirm={handleConfirmAlarm}
                        onClose={handleCloseAlarm}
                        onTransfer={handleTransferAlarm}
                        onOpenDevice={(deviceCode) => {
                            const device = devices.find((item) => item.code === deviceCode);
                            if (device) navigate('device-detail', { deviceId: device.id });
                        }}
                    />
                ) : (
                    <EmptyState message="未找到告警" />
                );
            case 'workorders':
                return (
                    <WorkOrderListPage
                        workOrders={workOrders}
                        initialFilter={listPreset.workorders || 'all'}
                        onOpenWorkOrder={(workOrderId) => navigate('workorder-detail', { workOrderId })}
                    />
                );
            case 'workorder-detail':
                return selectedWorkOrder ? (
                    <WorkOrderDetailPage
                        workOrder={selectedWorkOrder}
                        onAccept={handleAcceptWorkOrder}
                        onComplete={handleCompleteWorkOrder}
                        onOpenAlarm={selectedWorkOrder.alarmId
                            ? (alarmId) => navigate('alarm-detail', { alarmId })
                            : undefined}
                    />
                ) : (
                    <EmptyState message="未找到工单" />
                );
            case 'profile':
                return (
                    <ProfilePage
                        notifications={notifications}
                        onMarkAllRead={() => setNotifications((prev) => prev.map((item) => ({ ...item, read: true })))}
                        onLogout={() => {
                            setIsLoggedIn(false);
                            setPage('login');
                        }}
                    />
                );
            default:
                return <HomePage {...homePageProps} />;
        }
    };

    const activeTab = pageToTab(page);
    const showTabBar = isLoggedIn && MENU_PAGES.has(activeTab) && !DETAIL_PAGES.has(page);

    const navBar: NavBarProps | null = useMemo(() => {
        if (page === 'login' || !isLoggedIn) return null;

        switch (page) {
            case 'home':
                return { title: '工作台', subtitle: '待办摘要与快捷入口', large: true };
            case 'devices':
                return { title: '设备', subtitle: '水表与压力计实时状态', large: true };
            case 'device-detail':
                return {
                    title: selectedDevice?.name || '设备详情',
                    showBack: true,
                    onBack: () => setPage('devices'),
                };
            case 'alarms':
                return { title: '告警', subtitle: '待处理告警与处置记录', large: true };
            case 'alarm-detail':
                return {
                    title: selectedAlarm?.eventName || '告警详情',
                    showBack: true,
                    onBack: () => setPage('alarms'),
                };
            case 'workorders':
                return { title: '工单', subtitle: '我的待办与处置进度', large: true };
            case 'workorder-detail':
                return {
                    title: selectedWorkOrder?.name || '工单详情',
                    showBack: true,
                    onBack: () => setPage('workorders'),
                };
            case 'profile':
                return { title: '我的', subtitle: '账号与消息通知', large: true };
            default:
                return { title: '设备管理', large: true };
        }
    }, [isLoggedIn, page, selectedDevice, selectedAlarm, selectedWorkOrder, setPage]);

    return (
        <PhoneShell
            showChrome
            navBar={navBar}
            showTabBar={showTabBar}
            activeTab={activeTab}
            onTabChange={handleTabChange}
            tabBadges={{
                alarms: pendingAlarms || undefined,
                workorders: pendingWorkOrders || undefined,
                profile: unreadNotifications || undefined,
            }}
        >
            {renderPage()}
        </PhoneShell>
    );
}
