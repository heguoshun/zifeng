import React, { useState } from 'react';
import AppShell from '../components/AppShell';
import DeviceAccessSidebar, { type DeviceAccessPageId } from '../components/DeviceAccessSidebar';
import AccessFlowPanel from '../components/AccessFlowPanel';
import MiniMetric from '../components/dashboard/MiniMetric';
import { DonutChart, LegendList } from '../components/dashboard/DonutChart';
import BarChart from '../components/dashboard/BarChart';
import { ChartPanel, LineChart } from '../components/dashboard/TrendLineChart';
import type { BarData, LegendItem, Metric } from '../components/dashboard/types';
import { chartMonths, sliceChartData } from '../components/dashboard/chartUtils';
import '../access-overview.css';

const accessMetrics: Metric[] = [
    { label: '产品总数', value: '24', tone: 'blue' },
    { label: '设备总数', value: '92,058', tone: 'cyan' },
    { label: '在线设备', value: '90,218', tone: 'purple' },
    { label: '今日新增接入', value: '186', tone: 'indigo' },
    { label: '离线设备', value: '800', tone: 'rose' },
    { label: '接入成功率', value: '98.6%', tone: 'navy' },
];

const accessTrendValues = [28, 42, 35, 48, 52, 61, 74, 68, 82, 58, 64, 79];

const nodeTypeLegend: LegendItem[] = [
    { label: '直连设备', value: 62000, color: '#5b8def' },
    { label: '网关设备', value: 24000, color: '#13c2c2' },
    { label: '网关子设备', value: 6058, color: '#fa8c16' },
];

const protocolLegend: LegendItem[] = [
    { label: 'MQTT', value: 52000, color: '#5b8def' },
    { label: 'HTTP', value: 28000, color: '#13c2c2' },
    { label: 'CoAP', value: 8600, color: '#fa8c16' },
    { label: '其他', value: 3458, color: '#8c9bab' },
];

const productTopBars: BarData[] = [
    { label: '德力单相电表', value: 88 },
    { label: '智能水表', value: 76 },
    { label: '温湿度传感器', value: 64 },
    { label: '智能电表', value: 52 },
    { label: '网关设备', value: 38 },
];

const recentAccess = [
    { time: '10:24:18', product: '德力单相电表DLDX-001', deviceId: 'DEV-92831', success: true },
    { time: '10:22:05', product: '智能水表SW-102', deviceId: 'DEV-92830', success: true },
    { time: '10:18:47', product: '温湿度传感器TH-88', deviceId: 'DEV-92829', success: false },
    { time: '10:15:32', product: '德力单相电表DLDX-002', deviceId: 'DEV-92828', success: true },
    { time: '10:11:09', product: '网关设备GW-001', deviceId: 'DEV-92827', success: true },
    { time: '10:08:56', product: '智能电表EM-556', deviceId: 'DEV-92826', success: true },
    { time: '10:05:41', product: 'LORA智能水表', deviceId: 'DEV-92825', success: false },
    { time: '10:02:17', product: '德力单相电表DLDX-003', deviceId: 'DEV-92824', success: true },
];

function AccessTrendPanel() {
    const [range, setRange] = useState({ start: 0, end: chartMonths.length - 1 });
    const { months, values } = sliceChartData(accessTrendValues, range);

    return (
        <ChartPanel
            title="设备接入趋势"
            wide
            toolbar
            unitLabel="单位：台"
            range={range}
            onRangeChange={setRange}
        >
            <LineChart
                chartMonths={months}
                chartValues={values}
                gradientKey="access"
                maxValue={10000}
                valueSuffix="台"
            />
        </ChartPanel>
    );
}

function DonutChartCard({
    title,
    legend,
    centerLabel,
}: {
    title: string;
    legend: LegendItem[];
    centerLabel: string;
}) {
    return (
        <section className="panel ao-donut-card">
            <h3>{title}</h3>
            <div className="ao-donut-body">
                <DonutChart legend={legend} centerLabel={centerLabel} />
                <LegendList items={legend} />
            </div>
        </section>
    );
}

type AccessOverviewPageProps = {
    onNavigateHome: () => void;
    onNavigate: (pageId: DeviceAccessPageId) => void;
};

export default function AccessOverviewPage({ onNavigateHome, onNavigate }: AccessOverviewPageProps) {
    return (
        <AppShell
            activeTopTab="设备接入"
            sidebar={<DeviceAccessSidebar pageId="access-overview" onNavigate={onNavigate} />}
            onTopTabChange={(tab) => {
                if (tab === '设备接入') onNavigate('home');
            }}
        >
            <div className="crumb">设备接入 / 接入概览</div>

            <div className="dashboard">
                <AccessFlowPanel onNavigate={onNavigate} />

                <section className="panel ao-metrics-panel">
                    <h3>接入核心指标</h3>
                    <div className="metric-grid">
                        {accessMetrics.map((metric) => (
                            <MiniMetric item={metric} key={metric.label} />
                        ))}
                    </div>
                </section>

                <AccessTrendPanel />

                <DonutChartCard
                    title="节点类型分布"
                    legend={nodeTypeLegend}
                    centerLabel="设备总数"
                />

                <ChartPanel title="产品接入设备 Top5" wide unitLabel="">
                    <BarChart bars={productTopBars} />
                </ChartPanel>

                <DonutChartCard
                    title="协议接入占比"
                    legend={protocolLegend}
                    centerLabel="协议类型"
                />

                <section className="panel ao-recent-panel">
                    <h3>最近接入动态</h3>
                    <ul className="ao-recent-list">
                        {recentAccess.map((item) => (
                            <li className="ao-recent-item" key={item.deviceId}>
                                <time>{item.time}</time>
                                <div>
                                    <strong>{item.product}</strong>
                                    <span>{item.deviceId}</span>
                                </div>
                                <span className={`ao-status-tag ${item.success ? 'is-success' : 'is-fail'}`}>
                                    {item.success ? '成功' : '失败'}
                                </span>
                            </li>
                        ))}
                    </ul>
                </section>
            </div>
        </AppShell>
    );
}
