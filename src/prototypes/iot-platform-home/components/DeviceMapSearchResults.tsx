import React from 'react';
import { ChevronUp } from 'lucide-react';
import EntityCardPlaceholder from './EntityCardPlaceholder';
import type { DeviceGroupRecord } from '../data/deviceGroups';
import { STATUS_LABEL, type DeviceRecord, type DeviceStatus } from '../data/devices';
import type { ProductRecord } from '../data/products';

const STATUS_SEARCH_COLOR: Record<DeviceStatus, string> = {
    online: '#52c41a',
    offline: '#909399',
    fault: '#f5222d',
    disabled: '#909399',
};

type DeviceMapSearchResultsProps = {
    searchType: 'product' | 'device' | 'group';
    products: ProductRecord[];
    devices: DeviceRecord[];
    groups: DeviceGroupRecord[];
    onClose: () => void;
    onSelectProduct: (productId: string) => void;
    onSelectDevice: (device: DeviceRecord) => void;
    onSelectGroup: (groupName: string) => void;
};

export default function DeviceMapSearchResults({
    searchType,
    products,
    devices,
    groups,
    onClose,
    onSelectProduct,
    onSelectDevice,
    onSelectGroup,
}: DeviceMapSearchResultsProps) {
    const isEmpty = searchType === 'product'
        ? !products.length
        : searchType === 'device'
            ? !devices.length
            : !groups.length;

    return (
        <section className={`dm-map-search-panel dm-map-search-panel--${searchType}`}>
            <div className="dm-map-search-panel__head">
                <span>搜索结果：</span>
                <button type="button" onClick={onClose}>
                    收起
                    <ChevronUp size={12} />
                </button>
            </div>

            {isEmpty && <div className="dm-map-search-empty">暂无匹配结果</div>}

            {searchType === 'product' && !!products.length && (
                <div className="dm-map-search-product-grid">
                    {products.map((item) => (
                        <button
                            type="button"
                            key={item.id}
                            className="dm-map-search-product-card"
                            onClick={() => onSelectProduct(item.id)}
                        >
                            <EntityCardPlaceholder size="card" />
                            <span>{item.category}</span>
                        </button>
                    ))}
                </div>
            )}

            {searchType === 'device' && !!devices.length && (
                <ul className="dm-map-search-device-list">
                    {devices.map((item) => (
                        <li key={item.id}>
                            <button type="button" onClick={() => onSelectDevice(item)}>
                                <EntityCardPlaceholder size="thumb" />
                                <div className="dm-map-search-device-list__body">
                                    <strong>{item.name}</strong>
                                    <span>设备编号：{item.code}</span>
                                </div>
                                <span className={`dm-map-search-status dm-map-search-status--${item.status}`}>
                                    <i style={{ background: STATUS_SEARCH_COLOR[item.status] }} />
                                    {STATUS_LABEL[item.status]}
                                </span>
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            {searchType === 'group' && !!groups.length && (
                <ul className="dm-map-search-group-list">
                    {groups.map((item) => (
                        <li key={item.id}>
                            <button type="button" onClick={() => onSelectGroup(item.name)}>
                                <strong>{item.name}</strong>
                                <span>分组编号：{item.code}</span>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
