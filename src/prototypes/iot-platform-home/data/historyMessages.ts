export type HistoryMessageRecord = {
    id: string;
    operationType: string;
    operator: string;
    operationTime: string;
    operationContent: string;
    operationResult: '成功' | '失败';
    status: '正常' | '异常';
    messageType: string;
    pushPlatform: string;
    pushTime: string;
    pushContent: string;
    sourceModule: string;
    pushTargets: string[];
    sendStatus: string;
    resultStatus: string;
};

export type PushDeliveryRecord = {
    serial: number;
    user: string;
    resultStatus: '成功' | '失败';
    reason: string;
    canResend: boolean;
};

export function createInitialHistoryMessages(): HistoryMessageRecord[] {
    return [
        {
            id: 'hm-001',
            operationType: '设备告警消息',
            operator: '管理员',
            operationTime: '2026-06-11 10:18:29',
            operationContent: '新增设备：设备ID=123456，设备名称=智能温控器T1，所属产品=温控器产品线',
            operationResult: '成功',
            status: '正常',
            messageType: '设备告警消息',
            pushPlatform: '钉钉',
            pushTime: '2026-06-11 10:18:29',
            pushContent: '尊敬的用户，2026-06-11 10:18:29，智能温控器T1发生了设备告警，设备编号为：123456，告警等级为：重要，触发条件为：设备在/离线状态 (state) = 离线，请关注并及时处理！',
            sourceModule: '设备告警',
            pushTargets: ['刘恒', '李俊', '张翰和', '吴斌', '刘亚'],
            sendStatus: '成功',
            resultStatus: '正常',
        },
        {
            id: 'hm-002',
            operationType: '设备状态变更',
            operator: '管理员',
            operationTime: '2026-06-11 09:45:12',
            operationContent: '设备状态变更：设备ID=234567，状态由在线变更为离线，原因：网络中断超时',
            operationResult: '成功',
            status: '正常',
            messageType: '设备状态变更',
            pushPlatform: '钉钉',
            pushTime: '2026-06-11 09:45:12',
            pushContent: '设备状态变更通知：设备ID=234567（环境监测仪），状态由"在线"变更为"离线"，请及时关注。',
            sourceModule: '设备管理',
            pushTargets: ['李明', '王芳', '赵强'],
            sendStatus: '成功',
            resultStatus: '正常',
        },
        {
            id: 'hm-003',
            operationType: '设备删除',
            operator: '管理员',
            operationTime: '2026-06-10 16:32:08',
            operationContent: '批量删除设备',  // 短文本，不足20字
            operationResult: '成功',
            status: '正常',
            messageType: '设备删除通知',
            pushPlatform: '飞书',
            pushTime: '2026-06-10 16:32:08',
            pushContent: '设备删除通知：设备ID=789012（环境监测仪）已被管理员删除，如需恢复请联系系统管理员。',
            sourceModule: '设备管理',
            pushTargets: ['陈刚', '周敏'],
            sendStatus: '成功',
            resultStatus: '正常',
        },
        {
            id: 'hm-004',
            operationType: '设备修改',
            operator: '管理员',
            operationTime: '2026-06-10 14:15:33',
            operationContent: '修改设备信息：设备ID=345678，设备名称=智能电表A3，修改字段：设备名称、安装位置、上报周期',
            operationResult: '成功',
            status: '正常',
            messageType: '设备修改通知',
            pushPlatform: '钉钉',
            pushTime: '2026-06-10 14:15:33',
            pushContent: '设备信息变更通知：设备ID=345678（智能电表），设备名称、安装位置已更新，请核实。',
            sourceModule: '设备管理',
            pushTargets: ['黄伟', '孙丽'],
            sendStatus: '成功',
            resultStatus: '正常',
        },
        {
            id: 'hm-005',
            operationType: '系统通知',
            operator: '系统',
            operationTime: '2026-06-08 08:00:00',
            operationContent: '系统升级维护通知：平台将于6月25日凌晨2:00至4:00进行停机升级，届时所有服务暂停',
            operationResult: '成功',
            status: '正常',
            messageType: '系统通知',
            pushPlatform: '钉钉',
            pushTime: '2026-06-08 08:00:00',
            pushContent: '尊敬的各位用户，平台将于2026年6月25日凌晨2:00-4:00进行系统升级维护，期间部分功能可能暂时不可用，请提前做好准备。如有疑问请联系管理员。',
            sourceModule: '系统管理',
            pushTargets: ['刘恒', '李俊', '张翰和', '吴斌', '刘亚', '李明', '王芳'],
            sendStatus: '成功',
            resultStatus: '正常',
        },
        {
            id: 'hm-006',
            operationType: '设备告警消息',
            operator: '系统',
            operationTime: '2026-06-05 12:34:29',
            operationContent: '告警触发：设备ID=20022739，设备名称=智能电表B7，告警等级=重要，触发条件=设备在离线状态检测为离线',
            operationResult: '失败',
            status: '异常',
            messageType: '设备告警消息',
            pushPlatform: '钉钉',
            pushTime: '2026-06-05 12:34:29',
            pushContent: '尊敬的用户，2026-06-05 12:34:29，智能电表B7发生了设备告警，设备编号为：20022739，告警等级为：重要，触发条件为：设备在/离线状态 (state) = 离线，请关注并及时处理！',
            sourceModule: '设备告警',
            pushTargets: ['刘恒', '李俊', '张翰和', '吴斌', '刘亚'],
            sendStatus: '成功',
            resultStatus: '异常',
        },
        {
            id: 'hm-007',
            operationType: '设备新增',
            operator: '管理员',
            operationTime: '2026-06-01 11:22:45',
            operationContent: '新增设备',  // 短文本，不足20字
            operationResult: '成功',
            status: '正常',
            messageType: '设备新增通知',
            pushPlatform: '钉钉',
            pushTime: '2026-06-01 11:22:45',
            pushContent: '新设备接入通知：设备ID=456789（智能水表）已成功接入平台，请及时配置相关参数。',
            sourceModule: '设备管理',
            pushTargets: ['赵强', '陈刚'],
            sendStatus: '成功',
            resultStatus: '正常',
        },
        {
            id: 'hm-008',
            operationType: '设备删除',
            operator: '管理员',
            operationTime: '2026-05-28 15:08:17',
            operationContent: '删除设备：设备ID=567890，设备名称=4G网关设备GW-01，所在区域=一楼机房A区',
            operationResult: '成功',
            status: '正常',
            messageType: '设备删除通知',
            pushPlatform: '飞书',
            pushTime: '2026-05-28 15:08:17',
            pushContent: '设备删除通知：设备ID=567890（网关设备）已被管理员删除。',
            sourceModule: '设备管理',
            pushTargets: ['周敏', '黄伟'],
            sendStatus: '成功',
            resultStatus: '正常',
        },
        {
            id: 'hm-009',
            operationType: '设备修改',
            operator: '管理员',
            operationTime: '2026-05-22 09:55:30',
            operationContent: '修改设备配置：设备ID=678901，设备名称=温湿度传感器TH-12，修改字段：数据上报频率从10分钟调整为5分钟',
            operationResult: '成功',
            status: '正常',
            messageType: '设备修改通知',
            pushPlatform: '钉钉',
            pushTime: '2026-05-22 09:55:30',
            pushContent: '设备配置变更通知：设备ID=678901（温湿度传感器），数据上报频率已调整为每5分钟一次。',
            sourceModule: '设备管理',
            pushTargets: ['孙丽', '李明'],
            sendStatus: '成功',
            resultStatus: '正常',
        },
        {
            id: 'hm-010',
            operationType: '设备告警消息',
            operator: '系统',
            operationTime: '2026-05-15 18:42:11',
            operationContent: '告警触发：设备ID=789123，设备名称=高压配电柜PD-03，告警等级=紧急，触发条件=内部温度超过安全阈值82°C',
            operationResult: '成功',
            status: '正常',
            messageType: '设备告警消息',
            pushPlatform: '钉钉',
            pushTime: '2026-05-15 18:42:11',
            pushContent: '紧急告警通知：设备ID=789123（配电柜）温度异常升高，当前温度82°C，超过安全阈值75°C，请立即检查处理！',
            sourceModule: '设备告警',
            pushTargets: ['刘恒', '李俊', '张翰和'],
            sendStatus: '成功',
            resultStatus: '正常',
        },
    ];
}

export function createInitialPushRecords(messageId: string): PushDeliveryRecord[] {
    if (messageId === 'hm-006') {
        return [
            { serial: 1, user: '刘恒', resultStatus: '成功', reason: '-', canResend: false },
            { serial: 2, user: '李俊', resultStatus: '成功', reason: '-', canResend: false },
            { serial: 3, user: '张翰和', resultStatus: '失败', reason: '手机号验证失败', canResend: true },
            { serial: 4, user: '吴斌', resultStatus: '成功', reason: '-', canResend: false },
            { serial: 5, user: '刘亚', resultStatus: '成功', reason: '-', canResend: false },
        ];
    }
    return [
        { serial: 1, user: '刘恒', resultStatus: '成功', reason: '-', canResend: false },
        { serial: 2, user: '李俊', resultStatus: '成功', reason: '-', canResend: false },
        { serial: 3, user: '张翰和', resultStatus: '成功', reason: '-', canResend: false },
        { serial: 4, user: '吴斌', resultStatus: '成功', reason: '-', canResend: false },
        { serial: 5, user: '刘亚', resultStatus: '成功', reason: '-', canResend: false },
    ];
}
