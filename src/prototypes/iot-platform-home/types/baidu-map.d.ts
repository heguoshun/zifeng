declare namespace BMap {
    class Point {
        constructor(lng: number, lat: number);
        lng: number;
        lat: number;
    }

    class Size {
        constructor(width: number, height: number);
    }

    class Icon {
        constructor(url: string, size: Size, opts?: { anchor?: Size; imageSize?: Size });
    }

    class Map {
        constructor(container: HTMLElement | string, opts?: Record<string, unknown>);
        centerAndZoom(point: Point, zoom: number): void;
        enableScrollWheelZoom(enable?: boolean): void;
        addOverlay(overlay: Overlay): void;
        removeOverlay(overlay: Overlay): void;
        clearOverlays(): void;
        panTo(point: Point): void;
        checkResize(): void;
        setViewport(points: Point[], viewportOptions?: Record<string, unknown>): void;
        getZoom(): number;
        pointToPixel(point: Point): Pixel;
        pixelToPoint(pixel: Pixel): Point;
        addEventListener(event: string, handler: (event: MapEvent) => void): void;
        removeEventListener(event: string, handler: (event: MapEvent) => void): void;
    }

    class Pixel {
        x: number;
        y: number;
    }

    class Marker extends Overlay {
        constructor(point: Point, opts?: { icon?: Icon });
        setPosition(point: Point): void;
        getPosition(): Point;
        enableDragging(): void;
        addEventListener(event: string, handler: (event: MapEvent) => void): void;
    }

    class Label extends Overlay {
        constructor(content: string, opts?: { position?: Point; offset?: Size });
        setStyle(styles: Record<string, string | number>): void;
        addEventListener(event: string, handler: (event: MapEvent) => void): void;
    }

    class Geocoder {
        getLocation(point: Point, callback: (result: GeocoderResult | null) => void): void;
        getPoint(address: string, callback: (point: Point | null) => void, city?: string): void;
    }

    interface MapEvent {
        point: Point;
    }

    interface GeocoderResult {
        address: string;
    }

    class Overlay {}
}

interface Window {
    BMap?: typeof BMap;
}
