import React, { useEffect, useMemo, useState } from 'react';
import { Image, List, Moon, Search } from 'lucide-react';
import AppShell from '../components/AppShell';
import Breadcrumb from '../components/Breadcrumb';
import LargeMeterSidebar, { type LargeMeterPageId } from '../components/LargeMeterSidebar';
import TreeToggleIcon from '../components/TreeToggleIcon';
import ElSelect from '../components/ElSelect';
import ListPagination from '../components/ListPagination';
import MeterDialCard from '../components/MeterDialCard';
import NightlyWaterUsageSettingsDialog from '../components/NightlyWaterUsageSettingsDialog';
import type { LargeMeterArea, LargeMeterDevice } from '../data/largeMeters';
import {
    buildAreaSelectorTree,
    DATA_MONITOR_FILTER_OPTIONS,
    filterAreaSelectorTree,
    getAreaName,
    getDefaultAreaTreeExpanded,
    getMeterDisplayStatus,
    METER_MANUFACTURERS,
    meterMatchesAlarmFilter,
    meterMatchesAreaFilter,
    REMOTE_MANUFACTURERS,
    UNASSIGNED_AREA_ID,
    type AreaSelectorNode,
} from '../data/largeMeters';
import {
    formatNightlyFieldLabels,
    formatNightlyPeriod,
    type NightlyWaterUsageConfig,
} from '../data/nightlyWaterUsageConfig';
import { paginateItems } from '../utils/listPagination';
import '../device-access.css';
import '../product-management.css';
import '../device-management.css';
import '../large-meter.css';
import '../water-usage-analysis.css';
import ClearableInput from '../components/ClearableInput';

type DataMonitorPageProps = {
    areas: LargeMeterArea[];
    meters: LargeMeterDevice[];
    nightlyConfig: NightlyWaterUsageConfig;
    onUpdateNightlyConfig: (config: NightlyWaterUsageConfig) => void;
    onNavigateDeviceAccess: () => void;
    onNavigate: (pageId: LargeMeterPageId) => void;
    onAnalyzeMeter: (meterId: string) => void;
    onNavigateMessageCenter?: () => void;
    onNavigateAlarmWorkOrder?: () => void;
    onNavigateSystemManagement?: () => void;
    onNavigateLargeMeterCenter?: () => void;
};

function formatVolume(value: number): string {
    return value.toLocaleString('zh-CN', { maximumFractionDigits: 2 });
}

function MeterStatusTag({ meter }: { meter: LargeMeterDevice }) {
    const { label, tone } = getMeterDisplayStatus(meter);
    return (
        <span className={`lm-status-tag lm-status-tag--${tone}`}>
            {label}
        </span>
    );
}

function AreaTree({ nodes, expanded, activeId, depth = 0, onToggle, onSelect }: {
    nodes: AreaSelectorNode[];
    expanded: Record<string, boolean>;
    activeId: string;
    depth?: number;
    onToggle: (id: string) => void;
    onSelect: (id: string) => void;
}) {
    return (
        <ul className={`pm-category-tree ${depth > 0 ? 'pm-category-tree--nested' : ''}`}>
            {nodes.map((node) => {
                const hasChildren = Boolean(node.children?.length);
                const isExpanded = expanded[node.id];
                const isActive = activeId === node.id;
                return (
                    <li key={node.id} className="pm-category-node">
                        <div className={`pm-category-item ${isActive ? 'is-active' : ''}`} style={{ paddingLeft: `${8 + depth * 18}px` }}>
                            {hasChildren ? (
                                <button type="button" className="pm-category-toggle" aria-label={isExpanded ? '收起' : '展开'} onClick={() => onToggle(node.id)}>
                                    <TreeToggleIcon expanded={isExpanded} />
                                </button>
                            ) : <span className="pm-category-spacer" />}
                            <button type="button" className="pm-category-label-btn" onClick={() => onSelect(node.id)}>
                                <span className="pm-category-label">{node.label}</span>
                            </button>
                        </div>
                        {hasChildren && isExpanded && (
                            <AreaTree nodes={node.children ?? []} expanded={expanded} activeId={activeId} depth={depth + 1} onToggle={onToggle} onSelect={onSelect} />
                        )}
                    </li>
                );
            })}
        </ul>
    );
}

export default function DataMonitorPage({
    areas,
    meters,
    nightlyConfig,
    onUpdateNightlyConfig,
    onNavigateDeviceAccess,
    onNavigate,
    onAnalyzeMeter,
    onNavigateMessageCenter,
    onNavigateAlarmWorkOrder,
    onNavigateSystemManagement,
    onNavigateLargeMeterCenter,
}: DataMonitorPageProps) {
    const [activeArea, setActiveArea] = useState('all');
    const [areaKeyword, setAreaKeyword] = useState('');
    const [expanded, setExpanded] = useState<Record<string, boolean>>(() => getDefaultAreaTreeExpanded(areas));
    const [draftAlarm, setDraftAlarm] = useState('全部');
    const [draftKeyword, setDraftKeyword] = useState('');
    const [draftManufacturer, setDraftManufacturer] = useState('全部');
    const [draftRemoteManufacturer, setDraftRemoteManufacturer] = useState('全部');
    const [appliedAlarm, setAppliedAlarm] = useState('全部');
    const [appliedKeyword, setAppliedKeyword] = useState('');
    const [appliedManufacturer, setAppliedManufacturer] = useState('全部');
    const [appliedRemoteManufacturer, setAppliedRemoteManufacturer] = useState('全部');
    const [currentPage, setCurrentPage] = useState(1);
    const [viewMode, setViewMode] = useState<'list' | 'image'>('list');
    const [pageSize, setPageSize] = useState('20');
    const [jumpPage, setJumpPage] = useState('1');
    const [nightlySettingsOpen, setNightlySettingsOpen] = useState(false);

    const areaTree = useMemo(() => buildAreaSelectorTree(areas, meters), [areas, meters]);
    const filteredAreaTree = useMemo(() => filterAreaSelectorTree(areaTree, areaKeyword), [areaTree, areaKeyword]);
    const filtered = useMemo((): LargeMeterDevice[] => meters.filter((m) => {
        if (!meterMatchesAreaFilter(activeArea, m.areaId, areas)) return false;
        if (!meterMatchesAlarmFilter(m, appliedAlarm)) return false;
        if (appliedKeyword) {
            const kw = appliedKeyword.toLowerCase();
            const haystack = `${m.userNo} ${m.userName} ${m.code} ${m.bodyNo} ${m.name}`.toLowerCase();
            if (!haystack.includes(kw)) return false;
        }
        if (appliedManufacturer !== '全部' && m.manufacturer !== appliedManufacturer) return false;
        if (appliedRemoteManufacturer !== '全部' && m.remoteManufacturer !== appliedRemoteManufacturer) return false;
        return true;
    }), [meters, activeArea, areas, appliedAlarm, appliedKeyword, appliedManufacturer, appliedRemoteManufacturer]);
    const pagination = useMemo(() => paginateItems(filtered, currentPage, Number(pageSize)), [filtered, currentPage, pageSize]);

    useEffect(() => { setCurrentPage(1); setJumpPage('1'); }, [activeArea, appliedAlarm, appliedKeyword, appliedManufacturer, appliedRemoteManufacturer, pageSize]);
    useEffect(() => { setJumpPage(String(pagination.currentPage)); }, [pagination.currentPage]);

    const handleSearch = () => {
        setAppliedAlarm(draftAlarm);
        setAppliedKeyword(draftKeyword.trim());
        setAppliedManufacturer(draftManufacturer);
        setAppliedRemoteManufacturer(draftRemoteManufacturer);
        setCurrentPage(1);
        setJumpPage('1');
    };
    const handleReset = () => {
        setDraftAlarm('全部'); setDraftKeyword(''); setDraftManufacturer('全部'); setDraftRemoteManufacturer('全部'); setAppliedAlarm('全部'); setAppliedKeyword(''); setAppliedManufacturer('全部'); setAppliedRemoteManufacturer('全部'); setActiveArea('all'); setCurrentPage(1); setJumpPage('1');
    };

    return (
        <AppShell
            activeTopTab="大表中心"
            sidebar={<LargeMeterSidebar pageId="data-monitor" onNavigate={onNavigate} />}
            onNavigateLargeMeterCenter={onNavigateLargeMeterCenter}
            onNavigateMessageCenter={onNavigateMessageCenter}
            onNavigateAlarmWorkOrder={onNavigateAlarmWorkOrder}
            onNavigateSystemManagement={onNavigateSystemManagement}
            onTopTabChange={(tab) => {
                if (tab === '设备接入') onNavigateDeviceAccess();
            }}
        >
            <div className="pm-page lm-page">
                <Breadcrumb items={[
                                    { label: '大表中心', pageId: 'data-monitor' },
                                    { label: '数据监测' },
                                ]} onNavigate={(id) => onNavigate(id as LargeMeterPageId)} />
                <section className="panel pm-filter-panel lm-filter-panel">
                    <div className="pm-filter-row">
                        <div className="pm-filter-field"><span className="pm-filter-label">告警类型</span><ElSelect className="el-select--medium" size="medium" value={draftAlarm} options={[{ label: '全部', value: '全部' }, ...DATA_MONITOR_FILTER_OPTIONS.map((a) => ({ label: a, value: a }))]} onChange={setDraftAlarm} /></div>
                        <div className="pm-filter-field"><span className="pm-filter-label">表具厂家</span><ElSelect className="el-select--medium" size="medium" value={draftManufacturer} options={[{ label: '全部', value: '全部' }, ...METER_MANUFACTURERS.map((m) => ({ label: m, value: m }))]} onChange={setDraftManufacturer} /></div>
                        <div className="pm-filter-field"><span className="pm-filter-label">远传厂家</span><ElSelect className="el-select--medium" size="medium" value={draftRemoteManufacturer} options={[{ label: '全部', value: '全部' }, ...REMOTE_MANUFACTURERS.map((m) => ({ label: m, value: m }))]} onChange={setDraftRemoteManufacturer} /></div>
                        <div className="pm-filter-field"><span className="pm-filter-label">关键词</span><ClearableInput className="pm-filter-input" type="text" placeholder="用户号/用户名称/设备编号/表身号" value={draftKeyword} onChange={(e) => setDraftKeyword(e.target.value)} /></div>
                        <div className="pm-filter-actions">
                            <button type="button" className="pm-btn pm-btn-primary" onClick={handleSearch}><Search size={14} />查询</button>
                            <button type="button" className="pm-btn pm-btn-ghost" onClick={handleReset}>重置</button>
                            <button type="button" className="pm-btn pm-btn-ghost lm-nightly-settings-btn" onClick={() => setNightlySettingsOpen(true)}>
                                <Moon size={14} />夜间用水设置
                            </button>
                        </div>
                    </div>
                    <div className="lm-nightly-config-summary">
                        <span>夜间时段 <strong>{formatNightlyPeriod(nightlyConfig.period)}</strong></span>
                        <span>监测字段 <strong>{formatNightlyFieldLabels(nightlyConfig.fields)}</strong></span>
                        <button type="button" className="lm-nightly-config-summary__edit" onClick={() => setNightlySettingsOpen(true)}>修改</button>
                    </div>
                    <div className="lm-quick-filter-row"><span className="lm-quick-filter-label">快捷筛选：</span><button type="button" className={`lm-quick-filter-chip ${activeArea === UNASSIGNED_AREA_ID ? 'is-active' : ''}`} onClick={() => { setActiveArea(activeArea === UNASSIGNED_AREA_ID ? 'all' : UNASSIGNED_AREA_ID); setCurrentPage(1); setJumpPage('1'); }}>未分配区域</button></div>
                </section>
                <div className="pm-content-grid">
                    <section className="panel pm-category-panel">
                        <div className="pm-section-head"><h3>片区结构</h3></div>
                        <div className="dm-product-search"><ClearableInput type="text" placeholder="请输入片区名称" value={areaKeyword} onChange={(event) => setAreaKeyword(event.target.value)} /></div>
                        <AreaTree nodes={filteredAreaTree} expanded={expanded} activeId={activeArea} onToggle={(id) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))} onSelect={(id) => { setActiveArea(id); setCurrentPage(1); setJumpPage('1'); }} />
                    </section>
                    <section className="panel pm-list-panel">
                        <div className="pm-section-head"><h3>数据监测列表</h3><div className="pm-list-toolbar"><div className="pm-view-toggle"><button type="button" className={viewMode === 'list' ? 'is-active' : ''} aria-label="列表模式" title="列表模式" onClick={() => setViewMode('list')}><List size={14} /></button><button type="button" className={viewMode === 'image' ? 'is-active' : ''} aria-label="图片模式" title="图片模式" onClick={() => setViewMode('image')}><Image size={14} /></button></div></div></div>
                        {viewMode === 'list' ? (
                            <div className="pm-table-wrap lm-table-wrap--data-monitor"><table className="pm-table pm-table--data-monitor"><thead><tr><th>序号</th><th>区域名称</th><th>用户号</th><th>用户名称</th><th>设备编号</th><th>表身号</th><th>状态</th><th>累计读数(m³)</th><th>日累计正向流量(m³)</th><th>日累计逆向流量(m³)</th><th>数据时间</th><th>收到时间</th><th>表具厂家</th><th>远传厂家</th><th>操作</th></tr></thead><tbody>
                                {pagination.items.length === 0 ? <tr><td colSpan={15} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>暂无数据</td></tr> : pagination.items.map((m, index) => { const isUnassigned = !m.areaId || !areas.some((area) => area.id === m.areaId); return <tr key={m.id}><td>{(pagination.currentPage - 1) * Number(pageSize) + index + 1}</td><td>{getAreaName(areas, m.areaId) || '未分配'}</td><td>{isUnassigned ? '-' : (m.userNo || '-')}</td><td>{isUnassigned ? '-' : (m.userName || '-')}</td><td>{m.code || '-'}</td><td>{isUnassigned ? '-' : (m.bodyNo || '-')}</td><td><MeterStatusTag meter={m} /></td><td>{formatVolume(m.currentReading)}</td><td>{formatVolume(m.forwardAccumulation)}</td><td>{formatVolume(m.reverseAccumulation)}</td><td>{m.dataTime || '-'}</td><td>{m.receivedTime || '-'}</td><td>{isUnassigned ? '-' : (m.manufacturer || '-')}</td><td>{isUnassigned ? '-' : (m.remoteManufacturer || '-')}</td><td><div className="pm-table-actions"><button type="button" onClick={() => onAnalyzeMeter(m.id)}>设备数据</button></div></td></tr>; })}
                            </tbody></table></div>
                        ) : <div className="lm-meter-dial-grid">{pagination.items.length === 0 ? <div className="lm-meter-dial-empty">暂无数据</div> : pagination.items.map((m) => <MeterDialCard key={m.id} meter={m} onClick={() => onAnalyzeMeter(m.id)} />)}</div>}
                        <ListPagination total={pagination.total} currentPage={pagination.currentPage} totalPages={pagination.totalPages} pageSize={pageSize} jumpPage={jumpPage} onPageChange={setCurrentPage} onPageSizeChange={setPageSize} onJumpPageChange={setJumpPage} />
                    </section>
                </div>
            </div>
            <NightlyWaterUsageSettingsDialog
                open={nightlySettingsOpen}
                config={nightlyConfig}
                onClose={() => setNightlySettingsOpen(false)}
                onConfirm={(nextConfig) => {
                    onUpdateNightlyConfig(nextConfig);
                    setNightlySettingsOpen(false);
                }}
            />
        </AppShell>
    );
}
