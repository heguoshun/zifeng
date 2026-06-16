import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
    BAIDU_MAP_AK,
    BAIDU_MAP_DEFAULT_CENTER,
    BAIDU_MAP_DEFAULT_ZOOM,
} from '../config/baiduMap';
import { loadBaiduMap } from '../utils/loadBaiduMap';
import '../device-create.css';

const DEFAULT_COORDS = {
    longitude: String(BAIDU_MAP_DEFAULT_CENTER.longitude),
    latitude: String(BAIDU_MAP_DEFAULT_CENTER.latitude),
    location: '江苏省南京市玄武区',
};

const TILES_CHECK_INTERVAL_MS = 1000;
const TILES_CHECK_MAX_ATTEMPTS = 12;

function parseCoord(value: string, fallback: number) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function formatCoord(value: number) {
    return value.toFixed(6);
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
                reject(new Error('地图容器尺寸异常，请刷新后重试'));
                return;
            }
            requestAnimationFrame(check);
        };

        check();
    });
}

function triggerMapResize(map: BMap.Map) {
    map.checkResize();
    window.setTimeout(() => map.checkResize(), 120);
    window.setTimeout(() => map.checkResize(), 320);
}

function hasVisibleMapTiles(container: HTMLElement) {
    const tileImages = container.querySelectorAll('img[src*="baidu"], img[src*="bdimg"]');
    for (const image of tileImages) {
        const element = image as HTMLImageElement;
        if (element.complete && element.naturalWidth > 0 && element.naturalHeight > 0) {
            return true;
        }
    }
    return false;
}

function waitForMapTiles(container: HTMLElement): Promise<boolean> {
    return new Promise((resolve) => {
        let attempts = 0;

        const check = () => {
            if (hasVisibleMapTiles(container)) {
                resolve(true);
                return;
            }
            attempts += 1;
            if (attempts >= TILES_CHECK_MAX_ATTEMPTS) {
                resolve(false);
                return;
            }
            window.setTimeout(check, TILES_CHECK_INTERVAL_MS);
        };

        check();
    });
}

function buildTileLoadErrorMessage() {
    const akTail = BAIDU_MAP_AK ? BAIDU_MAP_AK.slice(-4) : '未配置';
    return [
        '地图底图仍未加载，请依次检查：',
        '1. AK 类型为「浏览器端」，且已开通 JavaScript API；',
        '2. Referer 白名单已设为 * 并保存，等待 5 分钟后硬刷新；',
        '3. .env 中的 AK 与控制台配置白名单的是同一个；',
        `4. 浏览器 Network 中是否有 bdimg.com 请求被拦截（当前 AK 尾号：${akTail}）。`,
    ].join('');
}

export type MapPickerValue = {
    longitude: string;
    latitude: string;
    location: string;
};

type MapPickerDialogProps = {
    open: boolean;
    initialValue?: Partial<MapPickerValue>;
    onClose: () => void;
    onConfirm: (value: MapPickerValue) => void;
};

export default function MapPickerDialog({
    open,
    initialValue,
    onClose,
    onConfirm,
}: MapPickerDialogProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<BMap.Map | null>(null);
    const markerRef = useRef<BMap.Marker | null>(null);
    const geocoderRef = useRef<BMap.Geocoder | null>(null);
    const locationRef = useRef(DEFAULT_COORDS.location);

    const [draftAddress, setDraftAddress] = useState(DEFAULT_COORDS.location);
    const [draftLongitude, setDraftLongitude] = useState(DEFAULT_COORDS.longitude);
    const [draftLatitude, setDraftLatitude] = useState(DEFAULT_COORDS.latitude);
    const [mapStatus, setMapStatus] = useState<'loading' | 'ready' | 'error'>('loading');
    const [mapError, setMapError] = useState('');
    const [tileWarning, setTileWarning] = useState('');
    const [addressSearching, setAddressSearching] = useState(false);
    const [addressSearchError, setAddressSearchError] = useState('');

    useEffect(() => {
        if (!open) return;

        const longitude = initialValue?.longitude || DEFAULT_COORDS.longitude;
        const latitude = initialValue?.latitude || DEFAULT_COORDS.latitude;
        locationRef.current = initialValue?.location || DEFAULT_COORDS.location;
        setDraftAddress(initialValue?.location || DEFAULT_COORDS.location);
        setDraftLongitude(longitude);
        setDraftLatitude(latitude);
        setMapStatus('loading');
        setMapError('');
        setTileWarning('');
        setAddressSearching(false);
        setAddressSearchError('');
    }, [open, initialValue?.longitude, initialValue?.latitude, initialValue?.location]);

    useEffect(() => {
        if (!open) return undefined;

        let cancelled = false;
        let container: HTMLDivElement | null = null;

        const reverseGeocode = (lng: number, lat: number) => {
            const geocoder = geocoderRef.current;
            if (!geocoder || !window.BMap) return;

            geocoder.getLocation(new BMap.Point(lng, lat), (result) => {
                if (result?.address) {
                    locationRef.current = result.address;
                    setDraftAddress(result.address);
                }
            });
        };

        const syncMapPosition = (lng: number, lat: number, pan = true) => {
            const map = mapRef.current;
            const marker = markerRef.current;
            if (!map || !marker || !window.BMap) return;

            const point = new BMap.Point(lng, lat);
            marker.setPosition(point);
            if (pan) {
                map.panTo(point);
            }
            reverseGeocode(lng, lat);
        };

        const updateCoords = (lng: number, lat: number, pan = true) => {
            setDraftLongitude(formatCoord(lng));
            setDraftLatitude(formatCoord(lat));
            syncMapPosition(lng, lat, pan);
        };

        const verifyTiles = async (
            map: BMap.Map,
            mapContainer: HTMLDivElement,
            lng: number,
            lat: number,
        ) => {
            triggerMapResize(map);
            const loaded = await waitForMapTiles(mapContainer);
            if (cancelled) return;

            if (loaded) {
                setTileWarning('');
                return;
            }

            map.centerAndZoom(new BMap.Point(lng, lat), BAIDU_MAP_DEFAULT_ZOOM);
            triggerMapResize(map);

            const retryLoaded = await waitForMapTiles(mapContainer);
            if (cancelled) return;

            if (!retryLoaded) {
                setTileWarning(buildTileLoadErrorMessage());
            }
        };

        const initMap = async () => {
            try {
                await loadBaiduMap(BAIDU_MAP_AK);
                container = mapContainerRef.current;
                if (cancelled || !container || !window.BMap?.Map) return;

                await waitForContainerSize(container);
                if (cancelled || !mapContainerRef.current) return;
                container = mapContainerRef.current;

                const lng = parseCoord(
                    initialValue?.longitude || DEFAULT_COORDS.longitude,
                    BAIDU_MAP_DEFAULT_CENTER.longitude,
                );
                const lat = parseCoord(
                    initialValue?.latitude || DEFAULT_COORDS.latitude,
                    BAIDU_MAP_DEFAULT_CENTER.latitude,
                );
                const point = new BMap.Point(lng, lat);

                const map = new BMap.Map(container);
                map.centerAndZoom(point, BAIDU_MAP_DEFAULT_ZOOM);
                map.enableScrollWheelZoom(true);

                const marker = new BMap.Marker(point);
                marker.enableDragging();
                map.addOverlay(marker);

                const geocoder = new BMap.Geocoder();
                geocoderRef.current = geocoder;
                mapRef.current = map;
                markerRef.current = marker;

                const handleMapClick = (event: BMap.MapEvent) => {
                    updateCoords(event.point.lng, event.point.lat, false);
                };

                const handleMarkerDragEnd = (event: BMap.MapEvent) => {
                    updateCoords(event.point.lng, event.point.lat, false);
                };

                map.addEventListener('click', handleMapClick);
                marker.addEventListener('dragend', handleMarkerDragEnd);
                reverseGeocode(lng, lat);

                if (cancelled) {
                    map.clearOverlays();
                    return;
                }

                setMapStatus('ready');
                void verifyTiles(map, container, lng, lat);
            } catch (error) {
                if (cancelled) return;
                setMapStatus('error');
                setMapError(error instanceof Error ? error.message : '百度地图加载失败');
            }
        };

        const frameId = requestAnimationFrame(() => {
            void initMap();
        });

        return () => {
            cancelled = true;
            cancelAnimationFrame(frameId);
            mapRef.current?.clearOverlays();
            mapRef.current = null;
            markerRef.current = null;
            geocoderRef.current = null;
            if (container) {
                container.innerHTML = '';
            }
        };
    }, [open, initialValue?.longitude, initialValue?.latitude]);

    if (!open) return null;

    const applyCoords = () => {
        const lng = parseCoord(draftLongitude, BAIDU_MAP_DEFAULT_CENTER.longitude);
        const lat = parseCoord(draftLatitude, BAIDU_MAP_DEFAULT_CENTER.latitude);
        setDraftLongitude(formatCoord(lng));
        setDraftLatitude(formatCoord(lat));

        const map = mapRef.current;
        const marker = markerRef.current;
        const geocoder = geocoderRef.current;
        if (!map || !marker || !window.BMap) return;

        const point = new BMap.Point(lng, lat);
        marker.setPosition(point);
        map.panTo(point);

        if (geocoder) {
            geocoder.getLocation(point, (result) => {
                if (result?.address) {
                    locationRef.current = result.address;
                    setDraftAddress(result.address);
                }
            });
        }
    };

    const syncMapToPoint = (point: BMap.Point, zoom = BAIDU_MAP_DEFAULT_ZOOM) => {
        const map = mapRef.current;
        const marker = markerRef.current;
        if (!map || !marker) return;

        marker.setPosition(point);
        map.centerAndZoom(point, zoom);
    };

    const handleAddressSearch = () => {
        const keyword = draftAddress.trim();
        if (!keyword || mapStatus !== 'ready') return;

        const geocoder = geocoderRef.current;
        if (!geocoder || !window.BMap) return;

        setAddressSearching(true);
        setAddressSearchError('');

        geocoder.getPoint(keyword, (point) => {
            setAddressSearching(false);
            if (!point) {
                setAddressSearchError('未找到该地址，请换个关键词试试');
                return;
            }

            locationRef.current = keyword;
            setDraftLongitude(formatCoord(point.lng));
            setDraftLatitude(formatCoord(point.lat));
            syncMapToPoint(point);
        });
    };

    const handleToolbarApply = () => {
        if (mapStatus !== 'ready' || addressSearching) return;

        if (draftAddress.trim()) {
            handleAddressSearch();
            return;
        }

        if (!draftLongitude.trim() || !draftLatitude.trim()) {
            setAddressSearchError('请输入详细地址，或填写经纬度');
            return;
        }

        setAddressSearchError('');
        applyCoords();
    };

    const handleToolbarKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            handleToolbarApply();
        }
    };

    const handleDialogConfirm = () => {
        if (!draftLongitude.trim() || !draftLatitude.trim()) return;
        onConfirm({
            longitude: draftLongitude,
            latitude: draftLatitude,
            location: draftAddress.trim() || locationRef.current || DEFAULT_COORDS.location,
        });
        onClose();
    };

    const handleMaskMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
        if (event.target === event.currentTarget) {
            onClose();
        }
    };

    return createPortal(
        <div
            className="iot-dialog-mask dcp-map-mask"
            role="presentation"
            onMouseDown={handleMaskMouseDown}
        >
            <div
                className="dcp-map-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="dcp-map-dialog-title"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <div className="iot-dialog__head">
                    <h4 id="dcp-map-dialog-title">设备经纬度选点</h4>
                    <button type="button" className="iot-dialog__close" onClick={onClose} aria-label="关闭">×</button>
                </div>

                <div className="dcp-map-dialog__body">
                    <div className="dcp-map-dialog__map-wrap">
                        <div className="dcp-map-dialog__toolbar">
                            <input
                                type="text"
                                className="dcp-map-dialog__input dcp-map-dialog__input--address"
                                placeholder="请输入详细地址"
                                value={draftAddress}
                                onChange={(event) => {
                                    setDraftAddress(event.target.value);
                                    setAddressSearchError('');
                                }}
                                onKeyDown={handleToolbarKeyDown}
                            />
                            <label className="dcp-map-dialog__field">
                                <span>经度：</span>
                                <input
                                    type="text"
                                    className="dcp-map-dialog__input dcp-map-dialog__input--coord"
                                    value={draftLongitude}
                                    onChange={(event) => setDraftLongitude(event.target.value)}
                                    onKeyDown={handleToolbarKeyDown}
                                />
                            </label>
                            <label className="dcp-map-dialog__field">
                                <span>纬度：</span>
                                <input
                                    type="text"
                                    className="dcp-map-dialog__input dcp-map-dialog__input--coord"
                                    value={draftLatitude}
                                    onChange={(event) => setDraftLatitude(event.target.value)}
                                    onKeyDown={handleToolbarKeyDown}
                                />
                            </label>
                            <button
                                type="button"
                                className="pm-btn pm-btn-primary dcp-map-dialog__toolbar-btn"
                                onClick={handleToolbarApply}
                                disabled={mapStatus !== 'ready' || addressSearching}
                            >
                                {addressSearching ? '定位中...' : '确定'}
                            </button>
                            {addressSearchError && (
                                <p className="dcp-map-dialog__search-error">{addressSearchError}</p>
                            )}
                        </div>

                        <div className="dcp-map-dialog__map">
                            <div ref={mapContainerRef} className="dcp-map-dialog__bmap" />
                            {tileWarning && mapStatus === 'ready' && (
                                <div className="dcp-map-dialog__tile-warning">{tileWarning}</div>
                            )}
                            {mapStatus === 'loading' && (
                                <div className="dcp-map-dialog__status">地图加载中...</div>
                            )}
                            {mapStatus === 'error' && (
                                <div className="dcp-map-dialog__status dcp-map-dialog__status--error">
                                    <p>{mapError}</p>
                                    {!BAIDU_MAP_AK && (
                                        <p className="dcp-map-dialog__status-tip">
                                            请在项目根目录 `.env` 中配置 `VITE_BAIDU_MAP_AK`
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="iot-dialog__foot">
                    <button type="button" className="pm-btn pm-btn-ghost" onClick={onClose}>取消</button>
                    <button
                        type="button"
                        className="pm-btn pm-btn-primary"
                        onClick={handleDialogConfirm}
                        disabled={mapStatus !== 'ready'}
                    >
                        确定
                    </button>
                </div>
            </div>
        </div>,
        document.body,
    );
}
