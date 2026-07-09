import React, { useMemo, useState } from 'react';
import { ChevronRight, Droplets, Gauge, Search } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import type { MobileDevice } from '../data/appData';
import { getDeviceReading } from '../data/appData';

type DeviceListPageProps = {
    devices: MobileDevice[];
    initialFilter?: 'all' | 'water' | 'pressure' | 'abnormal';
    onOpenDevice: (deviceId: string) => void;
};

const FILTERS = [
    { id: 'all', label: '全部' },
    { id: 'water', label: '水表' },
    { id: 'pressure', label: '压力计' },
    { id: 'abnormal', label: '异常' },
] as const;

function statusTone(status: MobileDevice['status']) {
    if (status === 'online') return 'success';
    if (status === 'offline') return 'danger';
    if (status === 'fault') return 'warning';
    return 'muted';
}

function statusLabel(status: MobileDevice['status']) {
    if (status === 'online') return '在线';
    if (status === 'offline') return '离线';
    if (status === 'fault') return '故障';
    return '停用';
}

export default function DeviceListPage({ devices, initialFilter = 'all', onOpenDevice }: DeviceListPageProps) {
    const [query, setQuery] = useState('');
    const [filter, setFilter] = useState(initialFilter);

    const filtered = useMemo(() => {
        return devices.filter((device) => {
            if (filter === 'water' && device.displayType !== '水表') return false;
            if (filter === 'pressure' && device.displayType !== '压力计') return false;
            if (filter === 'abnormal' && device.status !== 'offline' && device.status !== 'fault') return false;
            if (!query.trim()) return true;
            const keyword = query.trim().toLowerCase();
            return device.name.toLowerCase().includes(keyword)
                || device.code.toLowerCase().includes(keyword)
                || (device.installAddress || '').toLowerCase().includes(keyword);
        });
    }, [devices, filter, query]);

    return (
        <div className="dma-page-content">
                <div className="dma-search-bar">
                    <Search size={16} color="#8c9bab" />
                    <input
                        placeholder="搜索设备名称、编号或地址"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                    />
                </div>
                <div className="dma-filter-row">
                    {FILTERS.map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            className={`dma-filter-chip${filter === item.id ? ' is-active' : ''}`}
                            onClick={() => setFilter(item.id)}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
                {filtered.length === 0 ? (
                    <div className="dma-empty">暂无匹配设备</div>
                ) : (
                    filtered.map((device) => (
                        <article
                            key={device.id}
                            className="dma-list-card"
                            onClick={() => onOpenDevice(device.id)}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter') onOpenDevice(device.id);
                            }}
                            role="button"
                            tabIndex={0}
                        >
                            <span className={`dma-list-avatar tone-${statusTone(device.status)}`}>
                                {device.displayType === '压力计' ? <Gauge size={18} /> : <Droplets size={18} />}
                            </span>
                            <div className="dma-list-main">
                                <div className="dma-list-top">
                                    <h3>{device.name}</h3>
                                    <StatusBadge label={statusLabel(device.status)} tone={statusTone(device.status)} />
                                </div>
                                <p>{device.displayType} · {getDeviceReading(device)}</p>
                                <p className="dma-list-sub">{device.installAddress || device.mapAddress || '未填写安装地址'}</p>
                            </div>
                            <ChevronRight size={18} className="dma-list-arrow" />
                        </article>
                    ))
                )}
            </div>
    );
}
