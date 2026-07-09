import React, { useMemo, useState } from 'react';
import { AlertTriangle, ChevronRight, Search } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import type { DeviceAlarmRecord } from '../../iot-platform-home/data/deviceAlarms';

type AlarmListPageProps = {
    alarms: DeviceAlarmRecord[];
    initialFilter?: 'pending' | 'processing' | 'done' | 'all';
    onOpenAlarm: (alarmId: string) => void;
};

const FILTERS = [
    { id: 'all', label: '全部' },
    { id: 'pending', label: '待处理' },
    { id: 'processing', label: '处理中' },
    { id: 'done', label: '已处理' },
] as const;

function levelTone(level: DeviceAlarmRecord['level']) {
    if (level === '紧急') return 'danger';
    if (level === '重要') return 'warning';
    return 'primary';
}

function statusTone(status: DeviceAlarmRecord['processStatus']) {
    if (status === '未处理') return 'danger';
    if (status === '处理中') return 'warning';
    return 'success';
}

export default function AlarmListPage({ alarms, initialFilter = 'all', onOpenAlarm }: AlarmListPageProps) {
    const [query, setQuery] = useState('');
    const [filter, setFilter] = useState(initialFilter);

    const filtered = useMemo(() => {
        return alarms.filter((alarm) => {
            if (filter === 'pending' && alarm.processStatus !== '未处理') return false;
            if (filter === 'processing' && alarm.processStatus !== '处理中') return false;
            if (filter === 'done' && alarm.processStatus !== '已处理') return false;
            if (!query.trim()) return true;
            const keyword = query.trim().toLowerCase();
            return alarm.eventName.toLowerCase().includes(keyword)
                || alarm.deviceName.toLowerCase().includes(keyword);
        });
    }, [alarms, filter, query]);

    return (
        <div className="dma-page-content">
                <div className="dma-search-bar">
                    <Search size={16} color="#8c9bab" />
                    <input
                        placeholder="搜索告警事件或设备"
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
                    <div className="dma-empty">暂无匹配告警</div>
                ) : (
                    filtered.map((alarm) => (
                        <article
                            key={alarm.id}
                            className="dma-list-card"
                            onClick={() => onOpenAlarm(alarm.id)}
                            role="button"
                            tabIndex={0}
                        >
                            <span className={`dma-list-avatar tone-${levelTone(alarm.level)}`}>
                                <AlertTriangle size={18} />
                            </span>
                            <div className="dma-list-main">
                                <div className="dma-list-top">
                                    <h3>{alarm.eventName}</h3>
                                    <StatusBadge label={alarm.processStatus} tone={statusTone(alarm.processStatus)} />
                                </div>
                                <p>{alarm.deviceName} · {alarm.space}</p>
                                <p className="dma-list-sub">{alarm.content}</p>
                                <time className="dma-list-time">{alarm.triggeredAt.slice(5, 16)}</time>
                            </div>
                            <ChevronRight size={18} className="dma-list-arrow" />
                        </article>
                    ))
                )}
            </div>
    );
}
