import React, { useMemo, useState } from 'react';
import AppShell from '../components/AppShell';
import MessageCenterSidebar, { type MessageCenterPageId } from '../components/MessageCenterSidebar';
import AlarmLevelFormDrawer from '../components/AlarmLevelFormDrawer';
import { ConfirmDialog } from '../components/IotDialogs';
import IotToast, { type IotToastData, type IotToastType, triggerIotToast } from '../components/IotToast';
import {
    generateAlarmLevelId,
    type AlarmLevelRecord,
} from '../data/alarmLevels';
import type { DeviceAlarmRecord } from '../data/deviceAlarms';
import '../device-access.css';
import '../product-management.css';
import '../product-category.css';
import '../alarm-level-management.css';

type DrawerMode = 'add' | 'edit' | null;

type AlarmLevelManagementPageProps = {
    levels: AlarmLevelRecord[];
    alarms: DeviceAlarmRecord[];
    onUpdateLevels: React.Dispatch<React.SetStateAction<AlarmLevelRecord[]>>;
    onNavigateHome: () => void;
    onNavigateDeviceAccess: () => void;
    onNavigate: (pageId: MessageCenterPageId) => void;
};

function ColorCell({ color }: { color: string }) {
    return <span className="alm-color-swatch" style={{ backgroundColor: color }} aria-label={color} />;
}

export default function AlarmLevelManagementPage({
    levels,
    alarms,
    onUpdateLevels,
    onNavigateHome,
    onNavigateDeviceAccess,
    onNavigate,
}: AlarmLevelManagementPageProps) {
    const [drawerMode, setDrawerMode] = useState<DrawerMode>(null);
    const [editingLevel, setEditingLevel] = useState<AlarmLevelRecord | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<AlarmLevelRecord | null>(null);
    const [toast, setToast] = useState<IotToastData | null>(null);

    const levelUsageCount = useMemo(() => {
        const map = new Map<string, number>();
        alarms.forEach((alarm) => {
            map.set(alarm.level, (map.get(alarm.level) ?? 0) + 1);
        });
        return map;
    }, [alarms]);

    const showToast = (message: string, type: IotToastType = 'warning') => {
        triggerIotToast(setToast, message, type);
    };

    const openAddDrawer = () => {
        setEditingLevel(null);
        setDrawerMode('add');
    };

    const openEditDrawer = (item: AlarmLevelRecord) => {
        setEditingLevel(item);
        setDrawerMode('edit');
    };

    const closeDrawer = () => {
        setDrawerMode(null);
        setEditingLevel(null);
    };

    const handleSubmit = (value: { name: string; color: string; description: string }) => {
        const name = value.name.trim();
        if (!name) {
            showToast('请输入级别名称');
            return;
        }

        const duplicate = levels.some((item) => item.name === name && item.id !== editingLevel?.id);
        if (duplicate) {
            showToast('级别名称已存在');
            return;
        }

        const description = value.description.trim();

        if (drawerMode === 'add') {
            onUpdateLevels((prev) => [
                ...prev,
                {
                    id: generateAlarmLevelId(),
                    name,
                    color: value.color,
                    description,
                },
            ]);
            showToast('告警等级新增成功', 'success');
            closeDrawer();
            return;
        }

        if (drawerMode === 'edit' && editingLevel) {
            if (editingLevel.name !== name && (levelUsageCount.get(editingLevel.name) ?? 0) > 0) {
                showToast('该等级已被告警记录引用，无法修改名称');
                return;
            }

            onUpdateLevels((prev) => prev.map((item) => (
                item.id === editingLevel.id
                    ? { ...item, name, color: value.color, description }
                    : item
            )));
            showToast('告警等级保存成功', 'success');
            closeDrawer();
        }
    };

    const handleDelete = () => {
        if (!deleteTarget) return;

        const usage = levelUsageCount.get(deleteTarget.name) ?? 0;
        if (usage > 0) {
            showToast(`该等级已被 ${usage} 条告警记录引用，无法删除`);
            setDeleteTarget(null);
            return;
        }

        onUpdateLevels((prev) => prev.filter((item) => item.id !== deleteTarget.id));
        showToast('告警等级已删除', 'success');
        setDeleteTarget(null);
    };

    const sidebar = <MessageCenterSidebar pageId="alarm-level-mgmt" onNavigate={onNavigate} />;

    return (
        <AppShell
            activeTopTab="消息中心"
            sidebar={sidebar}
            onTopTabChange={(tab) => {
                if (tab === '设备接入') onNavigateDeviceAccess();
            }}
        >
            <div className="alm-page">
                <div className="crumb">消息中心 / 告警消息 / 告警等级管理</div>

                <section className="panel alm-list-panel">
                    <div className="pc-table-head">
                        <div className="pc-table-title">
                            <h3>告警级别列表</h3>
                        </div>
                        <div className="pc-table-actions">
                            <button type="button" className="pm-btn pm-btn-primary" onClick={openAddDrawer}>
                                新增
                            </button>
                        </div>
                    </div>

                    <div className="pc-table-wrap">
                        <table className="pc-table">
                            <thead>
                                <tr>
                                    <th>序号</th>
                                    <th>级别名称</th>
                                    <th>颜色配置</th>
                                    <th>描述</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {levels.map((level, index) => (
                                    <tr key={level.id}>
                                        <td>{index + 1}</td>
                                        <td>{level.name}</td>
                                        <td><ColorCell color={level.color} /></td>
                                        <td className="alm-desc-cell">{level.description || '—'}</td>
                                        <td>
                                            <div className="pc-row-actions">
                                                <button type="button" onClick={() => openEditDrawer(level)}>编辑</button>
                                                <button type="button" onClick={() => setDeleteTarget(level)}>删除</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {levels.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="pc-empty-cell">暂无告警等级数据</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>

            <AlarmLevelFormDrawer
                open={drawerMode !== null}
                mode={drawerMode === 'edit' ? 'edit' : 'add'}
                initialValue={editingLevel ? {
                    name: editingLevel.name,
                    color: editingLevel.color,
                    description: editingLevel.description,
                } : undefined}
                onClose={closeDrawer}
                onSubmit={handleSubmit}
            />

            {deleteTarget && (
                <ConfirmDialog
                    title="删除告警等级"
                    message={`确定删除告警等级「${deleteTarget.name}」吗？删除后不可恢复。`}
                    onClose={() => setDeleteTarget(null)}
                    onConfirm={handleDelete}
                />
            )}

            <IotToast toast={toast} />
        </AppShell>
    );
}
