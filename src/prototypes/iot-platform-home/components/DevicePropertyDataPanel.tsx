import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeftRight, FileText, LineChart, RefreshCw } from 'lucide-react';
import DevicePropertyHistoryDrawer from './DevicePropertyHistoryDrawer';
import DevicePropertyLineChartDrawer from './DevicePropertyLineChartDrawer';
import DeviceDataMigrationDrawer, { type DeviceDataMigrationPayload } from './DeviceDataMigrationDrawer';
import { mapProductProperty, type DebugPropertyField } from '../data/deviceDebugging';
import type { DeviceRecord } from '../data/devices';
import {
    buildInitialDevicePropertyData,
    refreshDevicePropertyValue,
    supportsPropertyLineChart,
    type DevicePropertyLatestValue,
} from '../data/devicePropertyData';
import type { ProductRecord } from '../data/products';
import type { IotToastType } from './IotToast';
import ClearableInput from './ClearableInput';

type DevicePropertyDataPanelProps = {
    product: ProductRecord | undefined;
    deviceKey: string;
    device: DeviceRecord | null;
    devices: DeviceRecord[];
    onShowToast: (message: string, type?: IotToastType) => void;
};

export default function DevicePropertyDataPanel({
    product,
    deviceKey,
    device,
    devices,
    onShowToast,
}: DevicePropertyDataPanelProps) {
    const properties = useMemo(
        () => (product?.properties ?? []).map(mapProductProperty),
        [product],
    );

    const [draftKeyword, setDraftKeyword] = useState('');
    const [keyword, setKeyword] = useState('');
    const [refreshingId, setRefreshingId] = useState<string | null>(null);
    const [propertyData, setPropertyData] = useState<Record<string, DevicePropertyLatestValue>>({});
    const [chartField, setChartField] = useState<DebugPropertyField | null>(null);
    const [historyField, setHistoryField] = useState<DebugPropertyField | null>(null);
    const [migrationOpen, setMigrationOpen] = useState(false);

    useEffect(() => {
        if (!product || !deviceKey) {
            setPropertyData({});
            return;
        }
        setPropertyData(buildInitialDevicePropertyData(product, deviceKey));
    }, [product, deviceKey]);

    const filteredProperties = useMemo(() => {
        const normalized = keyword.trim().toLowerCase();
        if (!normalized) return properties;
        return properties.filter((field) => (
            field.name.toLowerCase().includes(normalized)
            || field.identifier.toLowerCase().includes(normalized)
        ));
    }, [keyword, properties]);

    const handleSearch = () => {
        setKeyword(draftKeyword);
    };

    const handleReset = () => {
        setDraftKeyword('');
        setKeyword('');
    };

    const handleRefreshProperty = (propertyId: string) => {
        const field = properties.find((item) => item.id === propertyId);
        if (!field) return;

        setRefreshingId(propertyId);
        window.setTimeout(() => {
            setPropertyData((prev) => ({
                ...prev,
                [propertyId]: refreshDevicePropertyValue(field, deviceKey),
            }));
            setRefreshingId(null);
            onShowToast(`「${field.name}」数据已刷新`, 'success');
        }, 500);
    };

    if (!product) {
        return (
            <section className="panel dcp-prop-data-panel">
                <div className="dcp-prop-data-empty">请先选择所属产品</div>
            </section>
        );
    }

    if (!properties.length) {
        return (
            <section className="panel dcp-prop-data-panel">
                <div className="dcp-prop-data-empty">当前产品物模型暂无属性定义</div>
            </section>
        );
    }

    return (
        <section className="panel dcp-prop-data-panel">
            <div className="dcp-prop-data-toolbar">
                <div className="dcp-prop-data-toolbar__left">
                    <ClearableInput
                        type="text"
                        className="dcp-prop-data-search"
                        placeholder="请输入关键字进行搜索"
                        value={draftKeyword}
                        onChange={(event) => setDraftKeyword(event.target.value)}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter') handleSearch();
                        }}
                    />
                    <button type="button" className="pm-btn pm-btn-primary" onClick={handleSearch}>
                        查询
                    </button>
                    <button type="button" className="pm-btn pm-btn-ghost" onClick={handleReset}>
                        重置
                    </button>
                </div>
                <button
                    type="button"
                    className="pm-link-btn dcp-prop-data-migrate"
                    onClick={() => {
                        if (!device) {
                            onShowToast('请先保存设备后再进行数据迁移', 'warning');
                            return;
                        }
                        setMigrationOpen(true);
                    }}
                >
                    <ArrowLeftRight size={14} />
                    数据迁移
                </button>
            </div>

            {filteredProperties.length ? (
                <div className="dcp-prop-data-grid">
                    {filteredProperties.map((field) => {
                        const latest = propertyData[field.id];
                        const isRefreshing = refreshingId === field.id;

                        return (
                            <article className="dcp-prop-data-card" key={field.id}>
                                <div className="dcp-prop-data-card__head">
                                    <h4>{field.name}</h4>
                                    <button
                                        type="button"
                                        className={`dcp-prop-data-card__refresh ${isRefreshing ? 'is-spinning' : ''}`.trim()}
                                        aria-label={`刷新${field.name}`}
                                        onClick={() => handleRefreshProperty(field.id)}
                                        disabled={isRefreshing}
                                    >
                                        <RefreshCw size={16} />
                                    </button>
                                </div>
                                <div className="dcp-prop-data-card__value">
                                    <strong>{latest?.value ?? '—'}</strong>
                                    {latest?.unit ? <span>{latest.unit}</span> : null}
                                </div>
                                <p className="dcp-prop-data-card__time">
                                    更新时间：{latest?.updatedAt ?? '—'}
                                </p>
                                <div className="dcp-prop-data-card__actions">
                                    {supportsPropertyLineChart(field.dataType) && (
                                        <button
                                            type="button"
                                            className="pm-link-btn"
                                            onClick={() => setChartField(field)}
                                        >
                                            <LineChart size={14} />
                                            折线图
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        className="pm-link-btn"
                                        onClick={() => setHistoryField(field)}
                                    >
                                        <FileText size={14} />
                                        历史数据
                                    </button>
                                </div>
                            </article>
                        );
                    })}
                </div>
            ) : (
                <div className="dcp-prop-data-empty">未找到匹配的属性</div>
            )}

            <DevicePropertyLineChartDrawer
                open={Boolean(chartField)}
                field={chartField}
                deviceKey={deviceKey}
                onClose={() => setChartField(null)}
            />
            <DevicePropertyHistoryDrawer
                open={Boolean(historyField)}
                field={historyField}
                deviceKey={deviceKey}
                onClose={() => setHistoryField(null)}
            />
            <DeviceDataMigrationDrawer
                open={migrationOpen}
                sourceDevice={device}
                devices={devices}
                properties={properties}
                onClose={() => setMigrationOpen(false)}
                onShowToast={onShowToast}
                onSubmit={(payload: DeviceDataMigrationPayload) => {
                    const targetDevice = devices.find((item) => item.id === payload.targetDeviceId);
                    const propertyNames = properties
                        .filter((field) => payload.propertyIds.includes(field.id))
                        .map((field) => field.name)
                        .join('、');
                    setMigrationOpen(false);
                    onShowToast(
                        `已将 ${propertyNames} 的历史数据迁移至「${targetDevice?.name ?? '目标设备'}」`,
                        'success',
                    );
                }}
            />
        </section>
    );
}
