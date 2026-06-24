import React from 'react';
import AlarmWorkOrderSidebar, { type AlarmWorkOrderPageId } from '../components/AlarmWorkOrderSidebar';

export type AlarmPageModule = 'alarm-work-order';

type AlarmShellConfigOptions = {
    module: AlarmPageModule;
    workOrderPageId: AlarmWorkOrderPageId;
    crumbSuffix: string;
    onNavigateAlarmWorkOrder: (pageId: AlarmWorkOrderPageId) => void;
    // 以下参数保留以兼容原有调用方，不再实际使用
    messagePageId?: string;
    onNavigateMessageCenter?: (...args: unknown[]) => void;
};

export function buildAlarmModuleShellConfig(options: AlarmShellConfigOptions) {
    const {
        workOrderPageId,
        crumbSuffix,
        onNavigateAlarmWorkOrder,
    } = options;

    return {
        activeTopTab: '告警工单' as const,
        sidebar: (
            <AlarmWorkOrderSidebar
                pageId={workOrderPageId}
                onNavigate={onNavigateAlarmWorkOrder}
            />
        ),
        crumb: `告警工单 / 设备告警 / ${crumbSuffix}`,
    };
}
