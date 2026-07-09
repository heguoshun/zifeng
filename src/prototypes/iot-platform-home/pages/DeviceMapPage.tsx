import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import AppShell from '../components/AppShell';
import DeviceAccessSidebar, { type DeviceAccessPageId } from '../components/DeviceAccessSidebar';
import ElSelect from '../components/ElSelect';
import EntityCardPlaceholder from '../components/EntityCardPlaceholder';
import { BAIDU_MAP_AK, BAIDU_MAP_DEFAULT_CENTER, BAIDU_MAP_DEFAULT_ZOOM } from '../config/baiduMap';
import type { DeviceGroupRecord } from '../data/deviceGroups';
import DeviceMapInfoPanel, { type InfoPanelAnchor } from '../components/DeviceMapInfoPanel';
import DeviceMapSearchResults from '../components/DeviceMapSearchResults';
import IotToast, { type IotToastData, type IotToastType, triggerIotToast } from '../components/IotToast';
import { STATUS_LABEL, ensureDeviceCoordinates, type DeviceRecord, type DeviceStatus } from '../data/devices';
import { navigateDeviceForm } from '../utils/deviceRoute';
import {
    fitDevicesInView,
    getSpiderfyPoint,
    resolveDeviceMarkerGroups,
    zoomIntoCluster,
    type DeviceMapCluster,
} from '../utils/deviceMapCluster';
import type { ProductRecord } from '../data/products';
import { loadBaiduMap } from '../utils/loadBaiduMap';
import '../device-access.css';
import '../product-management.css';
import '../device-map.css';
import ClearableInput from '../components/ClearableInput';

type SearchType = 'product' | 'device' | 'group';

const SEARCH_TYPE_OPTIONS = [
    { label: '产品', value: 'product' },
    { label: '设备', value: 'device' },
    { label: '分组', value: 'group' },
];

const STATUS_OPTIONS = [
    { label: '设备状态', value: '' },
    { label: '在线', value: 'online' },
    { label: '离线', value: 'offline' },
    { label: '故障', value: 'fault' },
    { label: '禁用', value: 'disabled' },
];

const STATUS_MARKER_COLOR: Record<DeviceStatus, string> = {
    online: '#1890ff',
    offline: '#bfbfbf',
    fault: '#f5222d',
    disabled: '#fa8c16',
};

const SEARCH_PLACEHOLDER: Record<SearchType, string> = {
    product: '输入产品名称/编号',
    device: '输入设备名称/编号',
    group: '输入分组名称',
};

type DeviceMapPageProps = {
    products: ProductRecord[];
    devices: DeviceRecord[];
    deviceGroups: DeviceGroupRecord[];
    onUpdateDevices: React.Dispatch<React.SetStateAction<DeviceRecord[]>>;
    onNavigateHome: () => void;
    onNavigate: (pageId: DeviceAccessPageId) => void;
};

function triggerMapResize(map: BMap.Map) {
    map.checkResize();
    window.setTimeout(() => map.checkResize(), 120);
    window.setTimeout(() => map.checkResize(), 320);
}

function waitForContainerSize(container: HTMLElement, timeoutMs = 5000): Promise<void> {
    return new Promise((resolve, reject) => {
        const started = Date.now();
        const check = () => {
            const { width, height } = container.getBoundingClientRect();
            if (width > 0 && height > 0) {
                resolve();
                return;
            }
            if (Date.now() - started >= timeoutMs) {
                reject(new Error('地图容器尺寸异常'));
                return;
            }
            requestAnimationFrame(check);
        };
        check();
    });
}

const PIN_ICON_CACHE = new Map<string, string>();

function createPinIconUrl(color: string) {
    const cached = PIN_ICON_CACHE.get(color);
    if (cached) return cached;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="38" height="46" viewBox="0 0 38 46">
        <defs>
            <filter id="shadow" x="-30%" y="-20%" width="160%" height="160%">
                <feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#18324d" flood-opacity="0.28"/>
            </filter>
            <linearGradient id="pinFill" x1="9" y1="4" x2="29" y2="37" gradientUnits="userSpaceOnUse">
                <stop offset="0" stop-color="${color}"/>
                <stop offset="1" stop-color="${color}" stop-opacity="0.82"/>
            </linearGradient>
            <linearGradient id="glass" x1="12" y1="7" x2="25" y2="23" gradientUnits="userSpaceOnUse">
                <stop offset="0" stop-color="#fff" stop-opacity="0.9"/>
                <stop offset="1" stop-color="#fff" stop-opacity="0.35"/>
            </linearGradient>
        </defs>
        <path filter="url(#shadow)" d="M19 2C11.18 2 4.84 8.26 4.84 15.98c0 10.5 14.16 27.52 14.16 27.52s14.16-17.02 14.16-27.52C33.16 8.26 26.82 2 19 2z" fill="url(#pinFill)"/>
        <path d="M19 4.8c-6.23 0-11.28 4.96-11.28 11.08 0 8.08 8.22 19.52 11.28 23.44 3.06-3.92 11.28-15.36 11.28-23.44C30.28 9.76 25.23 4.8 19 4.8z" fill="none" stroke="#fff" stroke-opacity="0.55" stroke-width="1.4"/>
        <circle cx="19" cy="16" r="9.2" fill="#fff"/>
        <circle cx="19" cy="16" r="7.5" fill="url(#glass)"/>
        <rect x="14.1" y="12.2" width="9.8" height="7.1" rx="1.4" fill="${color}"/>
        <rect x="15.8" y="13.7" width="6.4" height="3.5" rx="0.6" fill="#fff" fill-opacity="0.96"/>
        <path d="M16 21h6M19 19.4V21" stroke="${color}" stroke-width="1.5" stroke-linecap="round"/>
        <ellipse cx="19" cy="43.4" rx="5.2" ry="1.6" fill="#18324d" opacity="0.18"/>
    </svg>`;
    const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    PIN_ICON_CACHE.set(color, url);
    return url;
}

type DevicePinMarkerOptions = {
    draggable?: boolean;
    onDragStart?: () => void;
    onDragEnd?: (lng: number, lat: number) => void;
};

function createDevicePinMarker(
    point: BMap.Point,
    color: string,
    onClick: () => void,
    options?: DevicePinMarkerOptions,
): BMap.Marker {
    const icon = new BMap.Icon(
        createPinIconUrl(color),
        new BMap.Size(38, 46),
        { anchor: new BMap.Size(19, 43), imageSize: new BMap.Size(38, 46) },
    );
    const marker = new BMap.Marker(point, { icon });
    marker.addEventListener('click', () => {
        onClick();
    });
    if (options?.draggable) {
        marker.enableDragging();
        if (options.onDragStart) {
            marker.addEventListener('dragstart', () => {
                options.onDragStart!();
            });
        }
        if (options.onDragEnd) {
            marker.addEventListener('dragend', (event: BMap.MapEvent) => {
                options.onDragEnd!(event.point.lng, event.point.lat);
            });
        }
    }
    return marker;
}

function createClusterLabel(
    point: BMap.Point,
    count: number,
    onClick?: () => void,
): BMap.Label {
    const label = new BMap.Label(
        `<div style="
            width: 64px;
            height: 64px;
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            user-select: none;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        ">
            <svg width="64" height="64" viewBox="0 0 64 64" style="position:absolute;top:0;left:0;">
                <defs>
                    <radialGradient id="cg" cx="50%" cy="45%" r="50%">
                        <stop offset="0%" stop-color="#60a5fa" stop-opacity="0.72"/>
                        <stop offset="100%" stop-color="#2563eb" stop-opacity="0.55"/>
                    </radialGradient>
                    <filter id="cglow">
                        <feGaussianBlur stdDeviation="2.5" result="b"/>
                        <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
                    </filter>
                </defs>
                <circle cx="32" cy="32" r="30" fill="none" stroke="#60a5fa" stroke-width="0.8" stroke-dasharray="3.5 2.5" stroke-opacity="0.40"/>
                <circle cx="32" cy="32" r="25" fill="url(#cg)" stroke="#60a5fa" stroke-width="1.5" stroke-opacity="0.72" filter="url(#cglow)"/>
                <circle cx="32" cy="32" r="25" fill="none" stroke="#93c5fd" stroke-width="0.5" stroke-opacity="0.30"/>
            </svg>
            <div style="
                position: relative;
                z-index: 1;
                display: flex;
                flex-direction: column;
                align-items: center;
                line-height: 1;
            ">
                <strong style="font-size: 18px; font-weight: 800; color: #fff; text-shadow: 0 1px 6px rgba(96,165,250,.55);">${count}</strong>
                <span style="margin-top: 3px; font-size: 10px; font-weight: 600; color: rgba(191,219,254,.88); letter-spacing: 0.5px;">设备</span>
            </div>
        </div>`,
        {
            position: point,
            offset: new BMap.Size(-32, -32),
        },
    );
    label.setStyle({
        backgroundColor: 'transparent',
        border: '0',
        boxShadow: 'none',
        cursor: 'pointer',
        height: '64px',
        padding: '0',
        width: '64px',
    });
    if (onClick) {
        label.addEventListener('click', onClick);
    }
    return label;
}

const INFO_PANEL_ESTIMATED_SIZE = { width: 520, height: 300 };
const INFO_PANEL_EDGE_PADDING = 12;
const INFO_PANEL_MARKER_GAP = 20;
const DEVICE_PIN_HEIGHT = 40;
const INFO_PANEL_ABOVE_OFFSET = DEVICE_PIN_HEIGHT + INFO_PANEL_MARKER_GAP;

function resolveInfoPanelAnchor(
    map: BMap.Map,
    shellWidth: number,
    shellHeight: number,
    longitude: number,
    latitude: number,
    panelWidth: number,
    panelHeight: number,
): InfoPanelAnchor {
    const pixel = map.pointToPixel(new BMap.Point(longitude, latitude));
    const halfWidth = panelWidth / 2;
    const x = Math.max(
        INFO_PANEL_EDGE_PADDING + halfWidth,
        Math.min(shellWidth - INFO_PANEL_EDGE_PADDING - halfWidth, pixel.x),
    );

    const spaceAbove = pixel.y - INFO_PANEL_EDGE_PADDING;
    const spaceBelow = shellHeight - pixel.y - INFO_PANEL_EDGE_PADDING;
    const needAbove = panelHeight + INFO_PANEL_ABOVE_OFFSET;
    const placement: InfoPanelAnchor['placement'] = spaceAbove >= needAbove || spaceAbove >= spaceBelow
        ? 'above'
        : 'below';

    return {
        x,
        y: pixel.y,
        placement,
        offset: placement === 'above' ? INFO_PANEL_ABOVE_OFFSET : INFO_PANEL_MARKER_GAP,
    };
}

export default function DeviceMapPage({
    products,
    devices,
    deviceGroups,
    onUpdateDevices,
    onNavigateHome,
    onNavigate,
}: DeviceMapPageProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapShellRef = useRef<HTMLDivElement>(null);
    const infoPanelRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<BMap.Map | null>(null);
    const overlaysRef = useRef<BMap.Overlay[]>([]);
    const renderMarkersRef = useRef<() => void>(() => {});
    const viewportFitRequestRef = useRef(true);
    const mapViewRefreshTimerRef = useRef<number | null>(null);

    const [mapReady, setMapReady] = useState(false);
    const [mapError, setMapError] = useState('');
    const [searchType, setSearchType] = useState<SearchType>('product');
    const [keyword, setKeyword] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
    const [productPanelOpen, setProductPanelOpen] = useState(true);
    const [searchPanelOpen, setSearchPanelOpen] = useState(false);
    const [selectedDevice, setSelectedDevice] = useState<DeviceRecord | null>(null);
    const [infoPanelAnchor, setInfoPanelAnchor] = useState<InfoPanelAnchor | null>(null);
    const [moveModeDeviceId, setMoveModeDeviceId] = useState<string | null>(null);
    const [toast, setToast] = useState<IotToastData | null>(null);
    const onDeviceSelectRef = useRef<(device: DeviceRecord) => void>(() => {});
    const onDeviceMoveRef = useRef<(deviceId: string, lng: number, lat: number) => void>(() => {});
    const onDeviceDragStartRef = useRef<() => void>(() => {});
    const selectedDeviceRef = useRef<DeviceRecord | null>(null);
    selectedDeviceRef.current = selectedDevice;

    const showToast = (message: string, type: IotToastType = 'info') => {
        triggerIotToast(setToast, message, type);
    };

    const trimmedKeyword = keyword.trim();

    const mapDevices = useMemo(
        () => devices.map((device, index) => ensureDeviceCoordinates(device, index)),
        [devices],
    );

    const filteredDevices = useMemo(() => {
        let result = mapDevices;
        if (selectedProductId) {
            result = result.filter((item) => item.productId === selectedProductId);
        }
        if (statusFilter) {
            result = result.filter((item) => item.status === statusFilter);
        }
        if (trimmedKeyword) {
            const lower = trimmedKeyword.toLowerCase();
            if (searchType === 'product') {
                const productIds = products
                    .filter((item) => item.name.toLowerCase().includes(lower) || item.code.toLowerCase().includes(lower))
                    .map((item) => item.id);
                result = result.filter((item) => productIds.includes(item.productId));
            } else if (searchType === 'device') {
                result = result.filter(
                    (item) => item.name.toLowerCase().includes(lower) || item.code.toLowerCase().includes(lower),
                );
            } else {
                const groupNames = deviceGroups
                    .filter((item) => item.name.toLowerCase().includes(lower))
                    .map((item) => item.name);
                result = result.filter(
                    (item) => item.groups.some((group) => groupNames.includes(group) || group.toLowerCase().includes(lower)),
                );
            }
        }
        return result;
    }, [deviceGroups, mapDevices, products, searchType, selectedProductId, statusFilter, trimmedKeyword]);

    const searchResults = useMemo(() => {
        if (!trimmedKeyword) return { products: [] as ProductRecord[], devices: [] as DeviceRecord[], groups: [] as DeviceGroupRecord[] };
        const lower = trimmedKeyword.toLowerCase();
        return {
            products: products.filter((item) => item.name.toLowerCase().includes(lower) || item.code.toLowerCase().includes(lower) || item.category.toLowerCase().includes(lower)),
            devices: mapDevices.filter((item) => item.name.toLowerCase().includes(lower) || item.code.toLowerCase().includes(lower)),
            groups: deviceGroups.filter((item) => item.name.toLowerCase().includes(lower) || item.code.toLowerCase().includes(lower)),
        };
    }, [deviceGroups, mapDevices, products, trimmedKeyword]);

    const showSearchPanel = searchPanelOpen && Boolean(trimmedKeyword);

    const productCards = products;

    useEffect(() => {
        viewportFitRequestRef.current = true;
    }, [searchType, selectedProductId, statusFilter, trimmedKeyword]);

    onDeviceSelectRef.current = (device: DeviceRecord) => {
        setMoveModeDeviceId(null);
        setSelectedDevice(device);
        const map = mapRef.current;
        if (map) {
            map.panTo(new BMap.Point(device.longitude, device.latitude));
        }
    };

    onDeviceMoveRef.current = (deviceId: string, longitude: number, latitude: number) => {
        onUpdateDevices((prev) =>
            prev.map((item) => (item.id === deviceId ? { ...item, longitude, latitude } : item)),
        );
        setMoveModeDeviceId(null);
        showToast('设备位置已更新', 'success');
    };

    onDeviceDragStartRef.current = () => {
        setSelectedDevice(null);
        setInfoPanelAnchor(null);
    };

    const updateInfoPanelAnchor = useCallback((device: DeviceRecord) => {
        const map = mapRef.current;
        const shell = mapShellRef.current;
        if (!map || !shell || !window.BMap) return;

        const { width: shellWidth, height: shellHeight } = shell.getBoundingClientRect();
        const panelWidth = infoPanelRef.current?.offsetWidth || INFO_PANEL_ESTIMATED_SIZE.width;
        const panelHeight = infoPanelRef.current?.offsetHeight || INFO_PANEL_ESTIMATED_SIZE.height;

        setInfoPanelAnchor(resolveInfoPanelAnchor(
            map,
            shellWidth,
            shellHeight,
            device.longitude,
            device.latitude,
            panelWidth,
            panelHeight,
        ));
    }, []);

    const clearOverlays = useCallback(() => {
        const map = mapRef.current;
        if (!map) return;
        overlaysRef.current.forEach((overlay) => map.removeOverlay(overlay));
        overlaysRef.current = [];
    }, []);

    const handleClusterClickRef = useRef<(cluster: DeviceMapCluster) => void>(() => {});

    const scheduleMarkerRefresh = useCallback(() => {
        if (mapViewRefreshTimerRef.current) {
            window.clearTimeout(mapViewRefreshTimerRef.current);
        }
        mapViewRefreshTimerRef.current = window.setTimeout(() => {
            renderMarkersRef.current();
        }, 120);
    }, []);

    handleClusterClickRef.current = (cluster: DeviceMapCluster) => {
        const map = mapRef.current;
        if (!map) return;

        setSelectedDevice(null);
        setInfoPanelAnchor(null);
        setMoveModeDeviceId(null);
        zoomIntoCluster(map, cluster);
    };

    const renderMarkers = useCallback(() => {
        const map = mapRef.current;
        if (!map || !window.BMap) return;
        clearOverlays();

        if (!filteredDevices.length) {
            triggerMapResize(map);
            return;
        }

        const movingDeviceId = moveModeDeviceId;

        if (movingDeviceId) {
            const movingDevice = filteredDevices.find((item) => item.id === movingDeviceId);
            if (movingDevice) {
                const point = new BMap.Point(movingDevice.longitude, movingDevice.latitude);
                const marker = createDevicePinMarker(
                    point,
                    STATUS_MARKER_COLOR[movingDevice.status],
                    () => onDeviceSelectRef.current(movingDevice),
                    {
                        draggable: true,
                        onDragStart: () => onDeviceDragStartRef.current(),
                        onDragEnd: (lng, lat) => onDeviceMoveRef.current(movingDevice.id, lng, lat),
                    },
                );
                map.addOverlay(marker);
                overlaysRef.current.push(marker);
            }
            triggerMapResize(map);
            return;
        }

        const currentZoom = map.getZoom();
        const markerGroups = resolveDeviceMarkerGroups(map, filteredDevices);

        markerGroups.forEach((group) => {
            const point = new BMap.Point(group.lng, group.lat);

            if (group.displayMode === 'single') {
                const device = group.devices[0];
                const marker = createDevicePinMarker(
                    new BMap.Point(device.longitude, device.latitude),
                    STATUS_MARKER_COLOR[device.status],
                    () => onDeviceSelectRef.current(device),
                );
                map.addOverlay(marker);
                overlaysRef.current.push(marker);
                return;
            }

            if (group.displayMode === 'spiderfy') {
                group.devices.forEach((device, index) => {
                    const devicePoint = getSpiderfyPoint(group, device, index, currentZoom);
                    const marker = createDevicePinMarker(
                        devicePoint,
                        STATUS_MARKER_COLOR[device.status],
                        () => onDeviceSelectRef.current(device),
                    );
                    map.addOverlay(marker);
                    overlaysRef.current.push(marker);
                });
                return;
            }

            const label = createClusterLabel(point, group.devices.length, () => {
                handleClusterClickRef.current(group);
            });
            map.addOverlay(label);
            overlaysRef.current.push(label);
        });

        if (viewportFitRequestRef.current) {
            viewportFitRequestRef.current = false;
            fitDevicesInView(map, filteredDevices);
        }

        triggerMapResize(map);
    }, [clearOverlays, filteredDevices, moveModeDeviceId]);

    renderMarkersRef.current = renderMarkers;

    useEffect(() => {
        let cancelled = false;
        const container = mapContainerRef.current;
        if (!container) return undefined;

        const initMap = async () => {
            try {
                await loadBaiduMap(BAIDU_MAP_AK);
                if (cancelled || !mapContainerRef.current || !window.BMap?.Map) return;

                await waitForContainerSize(mapContainerRef.current);
                if (cancelled || !mapContainerRef.current) return;

                const map = new BMap.Map(mapContainerRef.current);
                map.centerAndZoom(
                    new BMap.Point(BAIDU_MAP_DEFAULT_CENTER.longitude, BAIDU_MAP_DEFAULT_CENTER.latitude),
                    BAIDU_MAP_DEFAULT_ZOOM,
                );
                map.enableScrollWheelZoom(true);
                mapRef.current = map;
                viewportFitRequestRef.current = true;
                triggerMapResize(map);
                setMapReady(true);
                setMapError('');
            } catch (error) {
                if (cancelled) return;
                setMapError(error instanceof Error ? error.message : '地图加载失败');
            }
        };

        void initMap();

        return () => {
            cancelled = true;
            clearOverlays();
            mapRef.current = null;
            setMapReady(false);
        };
    }, [clearOverlays]);

    useEffect(() => {
        if (!mapReady) return undefined;
        renderMarkers();
        return undefined;
    }, [mapReady, renderMarkers]);

    useEffect(() => {
        if (!mapReady) return undefined;
        const map = mapRef.current;
        if (!map) return undefined;

        const handleMapViewChange = () => {
            scheduleMarkerRefresh();
        };

        map.addEventListener('zoomend', handleMapViewChange);
        map.addEventListener('moveend', handleMapViewChange);
        return () => {
            map.removeEventListener('zoomend', handleMapViewChange);
            map.removeEventListener('moveend', handleMapViewChange);
            if (mapViewRefreshTimerRef.current) {
                window.clearTimeout(mapViewRefreshTimerRef.current);
            }
        };
    }, [mapReady, scheduleMarkerRefresh]);

    useEffect(() => {
        if (!selectedDevice) return;
        const stillVisible = filteredDevices.some((item) => item.id === selectedDevice.id);
        if (!stillVisible) {
            setSelectedDevice(null);
            setInfoPanelAnchor(null);
            setMoveModeDeviceId(null);
        }
    }, [filteredDevices, selectedDevice]);

    useLayoutEffect(() => {
        if (!selectedDevice || !mapReady) {
            setInfoPanelAnchor(null);
            return;
        }
        updateInfoPanelAnchor(selectedDevice);
    }, [mapReady, selectedDevice, updateInfoPanelAnchor]);

    useEffect(() => {
        if (!mapReady || !selectedDevice) return undefined;

        const map = mapRef.current;
        if (!map) return undefined;

        const syncPanelPosition = () => {
            const device = selectedDeviceRef.current;
            if (device) updateInfoPanelAnchor(device);
        };

        map.addEventListener('moveend', syncPanelPosition);
        map.addEventListener('zoomend', syncPanelPosition);
        window.addEventListener('resize', syncPanelPosition);

        return () => {
            map.removeEventListener('moveend', syncPanelPosition);
            map.removeEventListener('zoomend', syncPanelPosition);
            window.removeEventListener('resize', syncPanelPosition);
        };
    }, [mapReady, selectedDevice, updateInfoPanelAnchor]);

    useEffect(() => {
        setSearchPanelOpen(Boolean(trimmedKeyword));
    }, [trimmedKeyword]);

    const handleProductSelect = (productId: string) => {
        setSelectedProductId((prev) => (prev === productId ? null : productId));
    };

    const handleMovePoint = () => {
        if (!selectedDevice) return;
        if (moveModeDeviceId === selectedDevice.id) {
            setMoveModeDeviceId(null);
            showToast('已取消移动位置');
            return;
        }
        setMoveModeDeviceId(selectedDevice.id);
        showToast('请拖动地图上的标记调整设备位置');
    };

    const handleCloseInfoPanel = () => {
        setMoveModeDeviceId(null);
        setInfoPanelAnchor(null);
        setSelectedDevice(null);
    };

    const sidebar = <DeviceAccessSidebar pageId="device-map" onNavigate={onNavigate} />;

    return (
        <AppShell
            activeTopTab="设备接入"
            sidebar={sidebar}
            onTopTabChange={(tab) => {
                if (tab === '设备接入') onNavigate('home');
            }}
        >
            <div className="dm-map-page">
                <div className="crumb">设备接入 / 设备地图</div>

                <div className="dm-map-shell" ref={mapShellRef}>
                    <div className="dm-map-canvas" ref={mapContainerRef} />
                    {mapError && <div className="dm-map-error">{mapError}</div>}

                    <div className={`dm-map-search-stack ${showSearchPanel ? 'is-open' : ''}`.trim()}>
                        <div className="dm-map-search">
                            <div className={`dm-map-search-group ${showSearchPanel ? 'has-panel' : ''}`.trim()}>
                                <ElSelect
                                    className="dm-map-search-type"
                                    size="medium"
                                    usePortal
                                    dropdownAlign="left"
                                    value={searchType}
                                    options={SEARCH_TYPE_OPTIONS}
                                    onChange={(value) => {
                                        setSearchType(value as SearchType);
                                        setKeyword('');
                                    }}
                                />
                                <div className="dm-map-search-input">
                                    <ClearableInput
                                        key={searchType}
                                        type="text"
                                        value={keyword}
                                        placeholder={SEARCH_PLACEHOLDER[searchType]}
                                        onChange={(event) => setKeyword(event.target.value)}
                                    />
                                    {keyword && (
                                        <button type="button" aria-label="清空" onClick={() => setKeyword('')}>
                                            <X size={12} />
                                        </button>
                                    )}
                                </div>
                            </div>
                            <ElSelect
                                className="dm-map-status-select"
                                size="medium"
                                usePortal
                                dropdownAlign="left"
                                value={statusFilter}
                                options={STATUS_OPTIONS}
                                onChange={setStatusFilter}
                            />
                        </div>

                        {showSearchPanel && (
                            <DeviceMapSearchResults
                                searchType={searchType}
                                products={searchResults.products}
                                devices={searchResults.devices}
                                groups={searchResults.groups}
                                onClose={() => setSearchPanelOpen(false)}
                                onSelectProduct={(productId) => {
                                    setSelectedProductId(productId);
                                    setSearchPanelOpen(false);
                                }}
                                onSelectDevice={(device) => {
                                    onDeviceSelectRef.current(device);
                                    setSearchPanelOpen(false);
                                }}
                                onSelectGroup={(groupName) => setKeyword(groupName)}
                            />
                        )}
                    </div>

                    <div className={`dm-map-product-wrap ${productPanelOpen ? 'is-open' : ''}`.trim()}>
                        <button
                            type="button"
                            className={`dm-map-product-toggle ${productPanelOpen ? 'is-open' : ''}`.trim()}
                            onClick={() => setProductPanelOpen((prev) => !prev)}
                        >
                            <span>产品列表</span>
                            {productPanelOpen ? (
                                <span className="dm-map-product-toggle__action">
                                    收起
                                    <ChevronUp size={14} />
                                </span>
                            ) : (
                                <ChevronDown size={14} />
                            )}
                        </button>

                        {productPanelOpen && (
                            <aside className="dm-map-product-panel">
                                <div className="dm-map-product-grid">
                                    {productCards.map((product) => (
                                        <button
                                            type="button"
                                            key={product.id}
                                            className={`dm-map-product-card ${selectedProductId === product.id ? 'is-active' : ''}`.trim()}
                                            onClick={() => handleProductSelect(product.id)}
                                        >
                                            <EntityCardPlaceholder size="card" />
                                            <span>{product.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </aside>
                        )}
                    </div>

                    <div className="dm-map-legend">
                        {Object.entries(STATUS_MARKER_COLOR).map(([status, color]) => (
                            <span key={status}>
                                <i style={{ background: color }} />
                                {STATUS_LABEL[status as DeviceStatus]}
                            </span>
                        ))}
                        <span className="dm-map-legend__count">共 {filteredDevices.length} 台设备</span>
                    </div>

                    {moveModeDeviceId && (
                        <div className="dm-map-move-hint">拖动标记可调整设备位置，松手后自动保存</div>
                    )}

                    {selectedDevice && (
                        <DeviceMapInfoPanel
                            device={selectedDevice}
                            products={products}
                            moveMode={moveModeDeviceId === selectedDevice.id}
                            anchor={infoPanelAnchor}
                            panelRef={infoPanelRef}
                            onClose={handleCloseInfoPanel}
                            onMovePoint={handleMovePoint}
                            onViewDetail={() => navigateDeviceForm('view', {
                                deviceId: selectedDevice.id,
                                productId: selectedDevice.productId,
                            })}
                        />
                    )}
                </div>
            </div>
            <IotToast toast={toast} onClose={() => setToast(null)} />
        </AppShell>
    );
}
