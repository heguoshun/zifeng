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
import type { ProductRecord } from '../data/products';
import { loadBaiduMap } from '../utils/loadBaiduMap';
import '../device-access.css';
import '../product-management.css';
import '../device-map.css';

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
    offline: '#fa8c16',
    fault: '#f5222d',
    disabled: '#bfbfbf',
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

type MapCluster = {
    lng: number;
    lat: number;
    devices: DeviceRecord[];
};

function clusterDevices(devices: DeviceRecord[], cellSize = 0.0018): MapCluster[] {
    const buckets = new Map<string, DeviceRecord[]>();
    devices.forEach((device) => {
        const key = `${Math.floor(device.longitude / cellSize)}_${Math.floor(device.latitude / cellSize)}`;
        const list = buckets.get(key) ?? [];
        list.push(device);
        buckets.set(key, list);
    });
    return Array.from(buckets.values()).map((group) => ({
        lng: group.reduce((sum, item) => sum + item.longitude, 0) / group.length,
        lat: group.reduce((sum, item) => sum + item.latitude, 0) / group.length,
        devices: group,
    }));
}

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
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">
        <path d="M16 0C9.373 0 4 5.373 4 12c0 9 12 26 12 26s12-17 12-26C28 5.373 22.627 0 16 0z" fill="${color}"/>
        <rect x="11" y="8" width="10" height="8" rx="1.5" fill="#fff"/>
        <circle cx="16" cy="12" r="2" fill="${color}"/>
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
        new BMap.Size(32, 40),
        { anchor: new BMap.Size(16, 40), imageSize: new BMap.Size(32, 40) },
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
    const label = new BMap.Label(String(count), {
        position: point,
        offset: new BMap.Size(-16, -16),
    });
    label.setStyle({
        color: '#fff',
        backgroundColor: '#1890ff',
        border: '2px solid #fff',
        borderRadius: '50%',
        width: '32px',
        height: '32px',
        lineHeight: '28px',
        textAlign: 'center',
        fontSize: '13px',
        fontWeight: '600',
        boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
        cursor: 'pointer',
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

    const [mapReady, setMapReady] = useState(false);
    const [mapError, setMapError] = useState('');
    const [searchType, setSearchType] = useState<SearchType>('product');
    const [keyword, setKeyword] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
    const [productPanelOpen, setProductPanelOpen] = useState(true);
    const [searchPanelOpen, setSearchPanelOpen] = useState(false);
    const [mapMode, setMapMode] = useState<'public' | 'private'>('public');
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

    const renderMarkers = useCallback(() => {
        const map = mapRef.current;
        if (!map || !window.BMap) return;
        clearOverlays();
        if (!filteredDevices.length) return;

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

        const clusters = clusterDevices(filteredDevices);
        const points: BMap.Point[] = [];

        clusters.forEach((cluster) => {
            const point = new BMap.Point(cluster.lng, cluster.lat);
            points.push(point);

            if (cluster.devices.length === 1) {
                const device = cluster.devices[0];
                const marker = createDevicePinMarker(
                    point,
                    STATUS_MARKER_COLOR[device.status],
                    () => onDeviceSelectRef.current(device),
                );
                map.addOverlay(marker);
                overlaysRef.current.push(marker);
                return;
            }

            const label = createClusterLabel(point, cluster.devices.length, () => {
                map.centerAndZoom(point, map.getZoom() + 2);
            });
            map.addOverlay(label);
            overlaysRef.current.push(label);
        });

        if (points.length === 1) {
            map.centerAndZoom(points[0], BAIDU_MAP_DEFAULT_ZOOM);
        } else if (points.length > 1) {
            map.setViewport(points, { margins: [80, 80, 80, 324] });
        }
        triggerMapResize(map);
    }, [clearOverlays, filteredDevices, moveModeDeviceId]);

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
        const timer = window.setTimeout(() => {
            renderMarkers();
        }, 200);
        return () => window.clearTimeout(timer);
    }, [mapReady, renderMarkers]);

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
                                    <input
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

                    <div className="dm-map-mode-switch">
                        <button
                            type="button"
                            className={mapMode === 'public' ? 'is-active' : ''}
                            onClick={() => setMapMode('public')}
                        >
                            公有地图
                        </button>
                        <button
                            type="button"
                            className={mapMode === 'private' ? 'is-active' : ''}
                            onClick={() => setMapMode('private')}
                        >
                            私有地图
                        </button>
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
