import React, { useEffect, useMemo, useState } from 'react';
import { Download, Search } from 'lucide-react';
import AppShell from '../components/AppShell';
import LargeMeterSidebar, { type LargeMeterPageId } from '../components/LargeMeterSidebar';
import TreeToggleIcon from '../components/TreeToggleIcon';
import ElSelect from '../components/ElSelect';
import ElDatePicker from '../components/ElDatePicker';
import ElMonthPicker from '../components/ElMonthPicker';
import ListPagination from '../components/ListPagination';
import IotToast, { type IotToastData, type IotToastType, triggerIotToast } from '../components/IotToast';
import type { LargeMeterArea, LargeMeterDevice, DataReportRecord, DataReportType } from '../data/largeMeters';
import {
    buildAreaSelectorTree,
    createInitialDataReports,
    filterAreaSelectorTree,
    getAreaName,
    getAreaPath,
    getDefaultAreaTreeExpanded,
    getDefaultReportDate,
    getMeterUsageByReportType,
    getReportDateLabel,
    getReportPeriodLabel,
    getReportTotalUsageLabel,
    getReportUsageLabel,
    meterMatchesAreaFilter,
    UNASSIGNED_AREA_ID,
    type AreaSelectorNode,
} from '../data/largeMeters';
import { paginateItems, DEFAULT_LIST_PAGE_SIZE } from '../utils/listPagination';
import '../device-access.css';
import '../product-management.css';
import '../device-management.css';
import '../large-meter.css';
import ClearableInput from '../components/ClearableInput';

const REPORT_TYPES = [
    { label: '日报', value: '日报' },
    { label: '月报', value: '月报' },
    { label: '季报', value: '季报' },
    { label: '年报', value: '年报' },
];

const QUARTER_OPTIONS = [
    { label: '2026年第1季度', value: '2026-Q1' },
    { label: '2026年第2季度', value: '2026-Q2' },
    { label: '2026年第3季度', value: '2026-Q3' },
    { label: '2026年第4季度', value: '2026-Q4' },
    { label: '2025年第4季度', value: '2025-Q4' },
];

const YEAR_OPTIONS = [
    { label: '2026年', value: '2026' },
    { label: '2025年', value: '2025' },
    { label: '2024年', value: '2024' },
];

type DataReportPageProps = {
    areas: LargeMeterArea[];
    meters: LargeMeterDevice[];
    onNavigateDeviceAccess: () => void;
    onNavigate: (pageId: LargeMeterPageId) => void;
    onNavigateMessageCenter?: () => void;
    onNavigateAlarmWorkOrder?: () => void;
    onNavigateSystemManagement?: () => void;
    onNavigateLargeMeterCenter?: () => void;
};

function getReportAreaLabel(areas: LargeMeterArea[], areaId: string): string {
    if (areaId === 'all') return '全部片区';
    if (areaId === UNASSIGNED_AREA_ID) return '未分配区域';
    return getAreaName(areas, areaId);
}

function reportMatchesAreaFilter(
    activeAreaId: string,
    reportAreaId: string,
    areas: LargeMeterArea[],
): boolean {
    if (activeAreaId === 'all') return true;
    if (reportAreaId === activeAreaId) return true;
    return meterMatchesAreaFilter(activeAreaId, reportAreaId, areas);
}
function AreaTree({
    nodes,
    expanded,
    activeId,
    depth = 0,
    onToggle,
    onSelect,
}: {
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
                        <div
                            className={`pm-category-item ${isActive ? 'is-active' : ''}`}
                            style={{ paddingLeft: `${8 + depth * 18}px` }}
                        >
                            {hasChildren ? (
                                <button
                                    type="button"
                                    className="pm-category-toggle"
                                    aria-label={isExpanded ? '收起' : '展开'}
                                    onClick={() => onToggle(node.id)}
                                >
                                    <TreeToggleIcon expanded={isExpanded} />
                                </button>
                            ) : (
                                <span className="pm-category-spacer" />
                            )}
                            <button
                                type="button"
                                className="pm-category-label-btn"
                                onClick={() => onSelect(node.id)}
                            >
                                <span className="pm-category-label">{node.label}</span>
                            </button>
                        </div>
                        {hasChildren && isExpanded && (
                            <AreaTree
                                nodes={node.children ?? []}
                                expanded={expanded}
                                activeId={activeId}
                                depth={depth + 1}
                                onToggle={onToggle}
                                onSelect={onSelect}
                            />
                        )}
                    </li>
                );
            })}
        </ul>
    );
}

export default function DataReportPage({
    areas,
    meters,
    onNavigateDeviceAccess,
    onNavigate,
    onNavigateMessageCenter,
    onNavigateAlarmWorkOrder,
    onNavigateSystemManagement,
    onNavigateLargeMeterCenter,
}: DataReportPageProps) {
    const [reports, setReports] = useState<DataReportRecord[]>(() => createInitialDataReports());
    const [activeArea, setActiveArea] = useState('all');
    const [areaKeyword, setAreaKeyword] = useState('');
    const [expanded, setExpanded] = useState<Record<string, boolean>>(() => getDefaultAreaTreeExpanded(areas));
    const [draftReportType, setDraftReportType] = useState<DataReportType>('日报');
    const [draftDate, setDraftDate] = useState(() => getDefaultReportDate('日报'));
    const [appliedReportType, setAppliedReportType] = useState<DataReportType>('日报');
    const [appliedDate, setAppliedDate] = useState(() => getDefaultReportDate('日报'));
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(DEFAULT_LIST_PAGE_SIZE);
    const [jumpPage, setJumpPage] = useState('1');
    const [toast, setToast] = useState<IotToastData | null>(null);

    const showToast = (message: string, type: IotToastType = 'success') => {
        triggerIotToast(setToast, message, type);
    };

    const areaTree = useMemo(
        () => buildAreaSelectorTree(areas, meters),
        [areas, meters],
    );

    const filteredAreaTree = useMemo(
        () => filterAreaSelectorTree(areaTree, areaKeyword),
        [areaTree, areaKeyword],
    );

    const scopedMeters = useMemo(
        () => meters.filter((m) => meterMatchesAreaFilter(activeArea, m.areaId, areas)),
        [meters, activeArea, areas],
    );

    const areaSummary = useMemo(() => {
        const totalUsage = scopedMeters.reduce(
            (sum, meter) => sum + getMeterUsageByReportType(meter, appliedReportType),
            0,
        );
        const areaName = activeArea === 'all'
            ? '全部片区'
            : activeArea === UNASSIGNED_AREA_ID
                ? '未分配区域'
                : getAreaName(areas, activeArea);
        const includesSubAreas = activeArea === 'all'
            || (activeArea !== UNASSIGNED_AREA_ID && areas.some((a) => a.parentId === activeArea));

        return {
            name: areaName,
            deviceCount: scopedMeters.length,
            totalUsage: Math.round(totalUsage * 10) / 10,
            includesSubAreas,
        };
    }, [activeArea, appliedReportType, areas, scopedMeters]);

    const scopedReports = useMemo(
        () => reports.filter((r) => (
            reportMatchesAreaFilter(activeArea, r.areaId, areas)
            && r.type === appliedReportType
            && r.date === appliedDate
        )),
        [reports, activeArea, areas, appliedReportType, appliedDate],
    );

    const meterUsages = useMemo(
        () => scopedMeters
            .map((m) => ({
                id: m.id,
                userNo: m.userNo,
                userName: m.userName,
                name: m.name,
                code: m.code,
                areaName: getAreaPath(areas, m.areaId),
                usage: getMeterUsageByReportType(m, appliedReportType),
            }))
            .sort((a, b) => b.usage - a.usage),
        [appliedReportType, areas, scopedMeters],
    );

    const pagination = useMemo(
        () => paginateItems(meterUsages, currentPage, Number(pageSize)),
        [meterUsages, currentPage, pageSize],
    );

    useEffect(() => {
        setCurrentPage(1);
        setJumpPage('1');
    }, [activeArea, appliedDate, appliedReportType, pageSize]);

    useEffect(() => {
        setJumpPage(String(pagination.currentPage));
    }, [pagination.currentPage]);

    const handleReportTypeChange = (value: string) => {
        const nextType = value as DataReportType;
        setDraftReportType(nextType);
        setDraftDate(getDefaultReportDate(nextType));
    };

    const renderDatePicker = (reportType: DataReportType, value: string, onChange: (next: string) => void) => {
        if (reportType === '日报') {
            return (
                <ElDatePicker
                    className="el-select--medium"
                    size="medium"
                    value={value}
                    placeholder="请选择日期"
                    onChange={onChange}
                />
            );
        }
        if (reportType === '月报') {
            return (
                <ElMonthPicker
                    className="el-select--medium"
                    size="medium"
                    value={value}
                    placeholder="请选择月份"
                    onChange={onChange}
                />
            );
        }
        if (reportType === '季报') {
            return (
                <ElSelect
                    className="el-select--medium"
                    size="medium"
                    value={value}
                    options={QUARTER_OPTIONS}
                    onChange={onChange}
                />
            );
        }
        return (
            <ElSelect
                className="el-select--medium"
                size="medium"
                value={value}
                options={YEAR_OPTIONS}
                onChange={onChange}
            />
        );
    };

    const handleSearch = () => {
        setAppliedReportType(draftReportType);
        setAppliedDate(draftDate);
        setCurrentPage(1);
        setJumpPage('1');
    };

    const handleReset = () => {
        const defaultType: DataReportType = '日报';
        const defaultDate = getDefaultReportDate(defaultType);
        setDraftReportType(defaultType);
        setDraftDate(defaultDate);
        setAppliedReportType(defaultType);
        setAppliedDate(defaultDate);
        setActiveArea('all');
        setAreaKeyword('');
        setCurrentPage(1);
        setJumpPage('1');
    };

    const handleGenerateReport = () => {
        const reportAreaId = activeArea;
        const duplicated = reports.some((r) => (
            r.areaId === reportAreaId
            && r.type === appliedReportType
            && r.date === appliedDate
        ));
        if (duplicated) {
            showToast('当前片区、类型与日期下已有报表', 'warning');
            return;
        }

        setReports((prev) => [{
            id: `report-${Date.now()}`,
            areaId: reportAreaId,
            type: appliedReportType,
            date: appliedDate,
            totalUsage: areaSummary.totalUsage,
            deviceCount: areaSummary.deviceCount,
            exported: false,
        }, ...prev]);
        showToast(`${appliedReportType}生成成功`, 'success');
    };

    const handleExport = (reportId: string) => {
        setReports((prev) => prev.map((r) => (r.id === reportId ? { ...r, exported: true } : r)));
        showToast('报表导出成功', 'success');
    };

    const sidebar = <LargeMeterSidebar pageId="data-report" onNavigate={onNavigate} />;

    return (
        <AppShell
            activeTopTab="大表中心"
            sidebar={sidebar}
            onNavigateLargeMeterCenter={onNavigateLargeMeterCenter}
            onNavigateMessageCenter={onNavigateMessageCenter}
            onNavigateAlarmWorkOrder={onNavigateAlarmWorkOrder}
            onNavigateSystemManagement={onNavigateSystemManagement}
            onTopTabChange={(tab) => {
                if (tab === '设备接入') onNavigateDeviceAccess();
            }}
        >
            <div className="pm-page lm-page lm-page--data-report">
                <div className="crumb">大表中心 / 数据报表</div>

                <section className="panel pm-filter-panel lm-filter-panel">
                    <div className="pm-filter-row">
                        <div className="pm-filter-field">
                            <span className="pm-filter-label">报表类型</span>
                            <ElSelect
                                className="el-select--medium"
                                size="medium"
                                value={draftReportType}
                                options={REPORT_TYPES}
                                onChange={handleReportTypeChange}
                            />
                        </div>
                        <div className="pm-filter-field">
                            <span className="pm-filter-label">{getReportDateLabel(draftReportType)}</span>
                            {renderDatePicker(draftReportType, draftDate, setDraftDate)}
                        </div>
                        <div className="pm-filter-actions">
                            <button type="button" className="pm-btn pm-btn-primary" onClick={handleSearch}>
                                <Search size={14} />
                                查询
                            </button>
                            <button type="button" className="pm-btn pm-btn-ghost" onClick={handleReset}>
                                重置
                            </button>
                            <button type="button" className="pm-btn pm-btn-primary" onClick={handleGenerateReport}>
                                生成报表
                            </button>
                        </div>
                    </div>
                    <div className="lm-quick-filter-row">
                        <span className="lm-quick-filter-label">快捷筛选：</span>
                        <button
                            type="button"
                            className={`lm-quick-filter-chip ${activeArea === UNASSIGNED_AREA_ID ? 'is-active' : ''}`}
                            onClick={() => {
                                const next = activeArea === UNASSIGNED_AREA_ID ? 'all' : UNASSIGNED_AREA_ID;
                                setActiveArea(next);
                                setCurrentPage(1);
                                setJumpPage('1');
                            }}
                        >
                            未分配区域
                        </button>
                    </div>
                </section>

                <div className="pm-content-grid">
                    <section className="panel pm-category-panel">
                        <div className="pm-section-head">
                            <h3>片区结构</h3>
                        </div>
                        <div className="dm-product-search">
                            <ClearableInput
                                type="text"
                                placeholder="请输入片区名称"
                                value={areaKeyword}
                                onChange={(event) => setAreaKeyword(event.target.value)}
                            />
                        </div>
                        <AreaTree
                            nodes={filteredAreaTree}
                            expanded={expanded}
                            activeId={activeArea}
                            onToggle={(id) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))}
                            onSelect={(id) => {
                                setActiveArea(id);
                                setCurrentPage(1);
                                setJumpPage('1');
                            }}
                        />
                    </section>

                    <div className="lm-report-main">
                        <section className="panel lm-chart-panel lm-report-summary-panel">
                            <div className="lm-section-head">
                                <h3>
                                    {areaSummary.name} · {appliedDate} · {getReportPeriodLabel(appliedReportType)}用水统计
                                </h3>
                            </div>
                            <div className="lm-stat-grid lm-stat-grid--summary">
                                <div className="lm-stat-card">
                                    <div className="lm-stat-card__label">统计片区</div>
                                    <div className="lm-stat-card__value lm-stat-card__value--text">{areaSummary.name}</div>
                                </div>
                                <div className="lm-stat-card">
                                    <div className="lm-stat-card__label">{getReportTotalUsageLabel(appliedReportType)}</div>
                                    <div className="lm-stat-card__value">{areaSummary.totalUsage} m³</div>
                                </div>
                                <div className="lm-stat-card">
                                    <div className="lm-stat-card__label">大表数量</div>
                                    <div className="lm-stat-card__value">{areaSummary.deviceCount}</div>
                                    {areaSummary.includesSubAreas && (
                                        <div className="lm-stat-card__meta">含下属片区设备</div>
                                    )}
                                </div>
                            </div>
                        </section>

                        <section className="panel pm-list-panel lm-report-table-panel">
                            <div className="lm-section-head">
                                <h3>单表用水明细</h3>
                            </div>
                            <div className="pm-table-wrap lm-report-table-wrap">
                                <table className="pm-table">
                                    <thead>
                                        <tr>
                                            <th>用户编号</th>
                                            <th>用户名称</th>
                                            <th>大表名称</th>
                                            <th>编号</th>
                                            <th>所属片区</th>
                                            <th>{getReportUsageLabel(appliedReportType)}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pagination.items.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                                                    暂无数据
                                                </td>
                                            </tr>
                                        ) : pagination.items.map((m) => (
                                            <tr key={m.id}>
                                                <td>{m.userNo}</td>
                                                <td>{m.userName}</td>
                                                <td>{m.name}</td>
                                                <td>{m.code}</td>
                                                <td>{m.areaName}</td>
                                                <td>{m.usage}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <ListPagination
                                total={pagination.total}
                                currentPage={pagination.currentPage}
                                totalPages={pagination.totalPages}
                                pageSize={pageSize}
                                jumpPage={jumpPage}
                                onPageChange={setCurrentPage}
                                onPageSizeChange={setPageSize}
                                onJumpPageChange={setJumpPage}
                            />
                        </section>

                        <section className="panel pm-list-panel lm-report-table-panel">
                            <div className="lm-section-head">
                                <div>
                                    <h3>报表导出记录</h3>
                                    <p className="lm-report-history-hint">
                                        仅展示当前「{appliedReportType} · {appliedDate} · {areaSummary.name}」下通过「生成报表」保存的记录
                                    </p>
                                </div>
                            </div>
                            <div className="pm-table-wrap lm-report-table-wrap">
                                <table className="pm-table">
                                    <thead>
                                        <tr>
                                            <th>报表类型</th>
                                            <th>日期</th>
                                            <th>片区</th>
                                            <th>总用量(m³)</th>
                                            <th>设备数</th>
                                            <th>状态</th>
                                            <th>操作</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {scopedReports.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                                                    当前条件下暂无导出记录，可点击上方「生成报表」保存
                                                </td>
                                            </tr>
                                        ) : scopedReports.map((r) => (
                                            <tr key={r.id}>
                                                <td>{r.type}</td>
                                                <td>{r.date}</td>
                                                <td>{getReportAreaLabel(areas, r.areaId)}</td>
                                                <td>{r.totalUsage}</td>
                                                <td>{r.deviceCount}</td>
                                                <td>
                                                    <span className={`lm-status-tag ${r.exported ? 'lm-status-tag--online' : 'lm-status-tag--offline'}`}>
                                                        {r.exported ? '已导出' : '未导出'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="pm-table-actions">
                                                        <button type="button" className="lm-export-btn" onClick={() => handleExport(r.id)}>
                                                            <Download size={14} />
                                                            导出
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    </div>
                </div>
            </div>

            <IotToast toast={toast} />
        </AppShell>
    );
}
