import React, { useEffect, useMemo, useState } from 'react';
import ElDateRangePicker from './ElDateRangePicker';
import ElSelect from './ElSelect';
import ListPagination from './ListPagination';
import AlarmDetailModal from './AlarmDetailModal';
import ConvertWorkOrderModal, { type ConvertWorkOrderForm } from './ConvertWorkOrderModal';
import { DonutChart } from './dashboard/DonutChart';
import { paginateItems, DEFAULT_LIST_PAGE_SIZE } from '../utils/listPagination';
import {
    ALARM_LEVEL_ORDER,
    buildPendingAlarmLevelCounts,
    buildPendingAlarmLevelLegend,
    filterAlarmsByDevice,
    normalizeDeviceAlarm,
    resolveAlarmProductName,
    type DeviceAlarmRecord,
} from '../data/deviceAlarms';
import { createWorkOrderFromAlarm, type WorkOrderRecord } from '../data/workOrders';
import type { DeviceRecord } from '../data/devices';
import type { ProductRecord } from '../data/products';

type DeviceAlarmInfoPanelProps = {
    device: DeviceRecord | null;
    devices?: DeviceRecord[];
    products: ProductRecord[];
    alarms: DeviceAlarmRecord[];
    onUpdateAlarms: React.Dispatch<React.SetStateAction<DeviceAlarmRecord[]>>;
    onCreateWorkOrder?: (workOrder: WorkOrderRecord) => void;
    onViewWorkOrder?: (workOrderId: string) => void;
    onShowToast: (message: string, type?: 'success' | 'warning' | 'error') => void;
};

const LEVEL_FILTER_OPTIONS = [
    { label: '请选择', value: '' },
    ...ALARM_LEVEL_ORDER.map((level) => ({ label: level, value: level })),
];

import { AlarmLevelCell, ReadStatusCell } from './DeviceAlarmTableCells';

export default function DeviceAlarmInfoPanel({
    device,
    devices = [],
    products,
    alarms,
    onUpdateAlarms,
    onCreateWorkOrder,
    onViewWorkOrder,
    onShowToast,
}: DeviceAlarmInfoPanelProps) {
    const [draftLevel, setDraftLevel] = useState('');
    const [draftStartTime, setDraftStartTime] = useState('');
    const [draftEndTime, setDraftEndTime] = useState('');
    const [appliedLevel, setAppliedLevel] = useState('');
    const [appliedStartTime, setAppliedStartTime] = useState('');
    const [appliedEndTime, setAppliedEndTime] = useState('');
    const [pageSize, setPageSize] = useState('20');
    const [currentPage, setCurrentPage] = useState(1);
    const [jumpPage, setJumpPage] = useState('1');
    const [detailModal, setDetailModal] = useState<{
        alarmId: string;
        mode: 'process' | 'view';
    } | null>(null);
    const [convertModal, setConvertModal] = useState<{ alarmId: string } | null>(null);

    const deviceAlarms = useMemo(
        () => filterAlarmsByDevice(alarms, device),
        [alarms, device],
    );

    const pendingLegend = useMemo(
        () => buildPendingAlarmLevelLegend(deviceAlarms),
        [deviceAlarms],
    );

    const pendingLevelCounts = useMemo(
        () => buildPendingAlarmLevelCounts(deviceAlarms),
        [deviceAlarms],
    );

    const filteredAlarms = useMemo(() => deviceAlarms
        .filter((alarm) => {
            const matchLevel = !appliedLevel || alarm.level === appliedLevel;
            const matchStart = !appliedStartTime || alarm.triggeredAt >= appliedStartTime;
            const matchEnd = !appliedEndTime || alarm.triggeredAt <= `${appliedEndTime} 23:59:59`;
            return matchLevel && matchStart && matchEnd;
        })
        .sort((a, b) => b.triggeredAt.localeCompare(a.triggeredAt)), [
        appliedEndTime,
        appliedLevel,
        appliedStartTime,
        deviceAlarms,
    ]);

    const pagination = useMemo(
        () => paginateItems(filteredAlarms, currentPage, Number(pageSize)),
        [currentPage, filteredAlarms, pageSize],
    );

    useEffect(() => {
        setCurrentPage(1);
        setJumpPage('1');
    }, [appliedLevel, appliedStartTime, appliedEndTime, pageSize, device?.code]);

    useEffect(() => {
        setJumpPage(String(pagination.currentPage));
    }, [pagination.currentPage]);

    const activeAlarm = useMemo(
        () => (detailModal ? alarms.find((item) => item.id === detailModal.alarmId) ?? null : null),
        [alarms, detailModal],
    );

    const convertAlarm = useMemo(
        () => (convertModal ? alarms.find((item) => item.id === convertModal.alarmId) ?? null : null),
        [alarms, convertModal],
    );

    const markAlarmRead = (alarmId: string) => {
        onUpdateAlarms((prev) => prev.map((item) => (
            item.id === alarmId ? { ...item, readStatus: '已读' } : item
        )));
    };

    const handleSearch = () => {
        setAppliedLevel(draftLevel);
        setAppliedStartTime(draftStartTime);
        setAppliedEndTime(draftEndTime);
    };

    const handleReset = () => {
        setDraftLevel('');
        setDraftStartTime('');
        setDraftEndTime('');
        setAppliedLevel('');
        setAppliedStartTime('');
        setAppliedEndTime('');
    };

    const handleProcess = (alarm: DeviceAlarmRecord) => {
        markAlarmRead(alarm.id);
        setDetailModal({ alarmId: alarm.id, mode: 'process' });
    };

    const handleView = (alarm: DeviceAlarmRecord) => {
        markAlarmRead(alarm.id);
        setDetailModal({ alarmId: alarm.id, mode: 'view' });
    };

    const handleConfirmProcess = (result: string) => {
        if (!activeAlarm) return;

        const now = new Date();
        const pad = (value: number) => String(value).padStart(2, '0');
        const processTime = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

        onUpdateAlarms((prev) => prev.map((item) => (
            item.id === activeAlarm.id
                ? normalizeDeviceAlarm({
                    ...item,
                    readStatus: '已读',
                    processStatus: '已处理',
                    processMethod: '直接处理',
                    processResult: result,
                    processHandler: '当前用户',
                    processTime,
                    releaseTime: processTime,
                })
                : item
        )));

        setDetailModal(null);
        onShowToast(`「${activeAlarm.eventName}」已处理完成`);
    };

    const handleConvertTicket = (alarm: DeviceAlarmRecord) => {
        if (alarm.processStatus !== '未处理') return;
        markAlarmRead(alarm.id);
        setConvertModal({ alarmId: alarm.id });
    };

    const handleConfirmConvert = (form: ConvertWorkOrderForm) => {
        if (!convertAlarm) return;

        const now = new Date();
        const pad = (value: number) => String(value).padStart(2, '0');
        const createdAt = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} `
            + `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

        const workOrderRecord = createWorkOrderFromAlarm({
            name: form.name,
            level: form.level,
            content: form.content,
            assignees: form.assignees,
            space: convertAlarm.space,
            alarmId: convertAlarm.id,
        });

        onUpdateAlarms((prev) => prev.map((item) => (
            item.id === convertAlarm.id
                ? normalizeDeviceAlarm({
                    ...item,
                    readStatus: '已读',
                    processStatus: '处理中',
                    processMethod: '工单处理',
                    workOrder: {
                        id: workOrderRecord.id,
                        name: form.name,
                        createdAt,
                        level: form.level,
                        content: form.content,
                        assignees: form.assignees,
                    },
                })
                : item
        )));

        onCreateWorkOrder?.(workOrderRecord);
        setConvertModal(null);
        onShowToast(`「${convertAlarm.eventName}」已转为工单`);
    };

    const handleViewWorkOrder = (workOrder: NonNullable<DeviceAlarmRecord['workOrder']>) => {
        if (onViewWorkOrder) {
            onViewWorkOrder(workOrder.id);
            return;
        }
        onShowToast(`查看工单 ${workOrder.id}（原型）`, 'warning');
    };

    const donutLegend = pendingLegend.length > 0 ? pendingLegend : null;

    return (
        <section className="panel dcp-panel dcp-alarm-panel">
            <div className="dcp-alarm-summary">
                <div className="dcp-alarm-summary__chart">
                    {donutLegend ? (
                        <DonutChart legend={donutLegend} centerLabel="未处理" />
                    ) : (
                        <div className="dcp-alarm-summary__chart-empty" aria-label="未处理告警 0">
                            <strong>0</strong>
                            <span>未处理</span>
                        </div>
                    )}
                </div>
                <div className="dcp-alarm-summary__stats">
                    {pendingLevelCounts.map((item) => (
                        <div className="dcp-alarm-summary__stat" key={item.level}>
                            <span className="dcp-alarm-summary__stat-value">{item.count}</span>
                            <span className="dcp-alarm-summary__stat-label">
                                <i style={{ backgroundColor: item.color }} />
                                {item.level}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="dai-filter-row">
                <div className="dai-filter-main-row">
                    <div className="pm-filter-field">
                        <span className="pm-filter-label">告警等级</span>
                        <ElSelect
                            className="el-select--medium"
                            size="medium"
                            value={draftLevel}
                            options={LEVEL_FILTER_OPTIONS}
                            onChange={setDraftLevel}
                        />
                    </div>
                    <div className="pm-filter-field">
                        <span className="pm-filter-label">时间范围</span>
                        <ElDateRangePicker
                            size="medium"
                            start={draftStartTime}
                            end={draftEndTime}
                            onChange={(range) => {
                                setDraftStartTime(range.start);
                                setDraftEndTime(range.end);
                            }}
                        />
                    </div>
                    <div className="pm-filter-actions dai-filter-actions">
                        <button type="button" className="pm-btn pm-btn-primary" onClick={handleSearch}>查询</button>
                        <button type="button" className="pm-btn pm-btn-ghost" onClick={handleReset}>重置</button>
                    </div>
                </div>
            </div>

            <div className="pcp-table-wrap">
                <table className="pm-table pm-table--device-alarm">
                    <thead>
                        <tr>
                            <th>序号</th>
                            <th>事件名称</th>
                            <th>告警等级</th>
                            <th>设备名称</th>
                            <th>设备编号</th>
                            <th>所属产品</th>
                            <th>所属片区</th>
                            <th>阅读状态</th>
                            <th>触发时间</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pagination.items.map((alarm, index) => (
                            <tr key={alarm.id}>
                                <td>{(pagination.currentPage - 1) * Number(pageSize) + index + 1}</td>
                                <td>{alarm.eventName}</td>
                                <td><AlarmLevelCell level={alarm.level} /></td>
                                <td>{alarm.deviceName}</td>
                                <td>{alarm.deviceCode}</td>
                                <td>{resolveAlarmProductName(alarm.productId, products)}</td>
                                <td>{alarm.space}</td>
                                <td><ReadStatusCell status={alarm.readStatus} /></td>
                                <td>{alarm.triggeredAt}</td>
                                <td>
                                    <div className="dai-table-actions">
                                        {alarm.processStatus === '未处理' ? (
                                            <button type="button" onClick={() => handleProcess(alarm)}>处理</button>
                                        ) : (
                                            <button type="button" onClick={() => handleView(alarm)}>查看</button>
                                        )}
                                        {alarm.processStatus === '未处理' ? (
                                            <button type="button" onClick={() => handleConvertTicket(alarm)}>转为工单</button>
                                        ) : (
                                            <span className="is-disabled">转为工单</span>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {!pagination.items.length && (
                            <tr>
                                <td colSpan={10} className="pcp-empty-cell">
                                    {device ? '暂无告警记录' : '请先保存设备后查看告警信息'}
                                </td>
                            </tr>
                        )}
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

            <AlarmDetailModal
                open={detailModal !== null}
                mode={detailModal?.mode ?? 'view'}
                alarm={activeAlarm}
                products={products}
                devices={devices.length ? devices : (device ? [device] : [])}
                onClose={() => setDetailModal(null)}
                onConfirmProcess={handleConfirmProcess}
                onViewWorkOrder={handleViewWorkOrder}
            />

            <ConvertWorkOrderModal
                open={convertModal !== null}
                alarm={convertAlarm}
                onClose={() => setConvertModal(null)}
                onConfirm={handleConfirmConvert}
            />
        </section>
    );
}
