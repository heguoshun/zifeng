import React from 'react';
import { X } from 'lucide-react';
import type { DeviceRecord } from '../data/devices';
import { STATUS_LABEL, resolveDeviceProduct, type DeviceStatus } from '../data/devices';
import type { ProductRecord } from '../data/products';

type DeviceMapInfoPanelProps = {
    device: DeviceRecord;
    products: ProductRecord[];
    moveMode?: boolean;
    anchor?: InfoPanelAnchor | null;
    panelRef?: React.RefObject<HTMLDivElement>;
    onClose: () => void;
    onMovePoint: () => void;
    onViewDetail: () => void;
};

export type InfoPanelAnchor = {
    x: number;
    y: number;
    placement: 'above' | 'below';
    offset: number;
};

export default function DeviceMapInfoPanel({
    device,
    products,
    moveMode = false,
    anchor,
    panelRef,
    onClose,
    onMovePoint,
    onViewDetail,
}: DeviceMapInfoPanelProps) {
    const { productName } = resolveDeviceProduct(device, products);

    const fields = [
        { label: '设备名称', value: device.name },
        { label: '设备编号', value: device.code },
        { label: '所属产品', value: productName },
        { label: '当前状态', value: STATUS_LABEL[device.status as DeviceStatus] ?? device.status },
        { label: '采集频率', value: device.collectFrequency },
        { label: '经度', value: String(device.longitude) },
        { label: '注册码', value: device.registrationCode },
        { label: '纬度', value: String(device.latitude) },
    ];

    return (
        <div
            ref={panelRef}
            className={`dm-map-info-panel dm-map-info-panel--${anchor?.placement ?? 'above'} ${anchor ? 'is-positioned' : ''}`.trim()}
            style={anchor ? {
                left: anchor.x,
                top: anchor.y,
                '--dm-info-panel-marker-offset': `${anchor.offset}px`,
            } as React.CSSProperties : undefined}
            role="dialog"
            aria-label="设备信息"
        >
            <div className="dm-map-info-panel__head">
                <h4>设备信息</h4>
                <button type="button" className="dm-map-info-panel__close" aria-label="关闭" onClick={onClose}>
                    <X size={16} />
                </button>
            </div>
            <div className="dm-map-info-panel__body">
                {fields.map((field) => (
                    <div className="dm-map-info-panel__field" key={field.label}>
                        <span className="dm-map-info-panel__label">{field.label}</span>
                        <span className="dm-map-info-panel__value">{field.value}</span>
                    </div>
                ))}
            </div>
            <div className="dm-map-info-panel__foot">
                <button
                    type="button"
                    className={`pm-btn pm-btn-ghost ${moveMode ? 'is-active' : ''}`.trim()}
                    onClick={onMovePoint}
                >
                    {moveMode ? '取消移动' : '移动位置点'}
                </button>
                <button type="button" className="pm-btn pm-btn-ghost" onClick={onViewDetail}>
                    查看设备详情
                </button>
            </div>
        </div>
    );
}
