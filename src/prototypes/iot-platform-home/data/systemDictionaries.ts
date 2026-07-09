// ── Dictionary Management Data Module ──

export type DictItemRecord = {
    id: string;
    name: string;
    dataValue: string;
    description: string;
    sort: number;
    enabled: boolean;
};

export type DictTypeRecord = {
    id: string;
    name: string;
    code: string;
    description: string;
    items: DictItemRecord[];
};

export function generateDictTypeId(): string {
    return `dict-type-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

export function generateDictItemId(): string {
    return `dict-item-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

export function createInitialDictionaries(): DictTypeRecord[] {
    return [
        {
            id: 'dict-operate-type',
            name: '操作类型',
            code: 'operate_type',
            description: '',
            items: [
                { id: 'item-ot-1', name: '添加', dataValue: '2', description: '', sort: 1, enabled: true },
                { id: 'item-ot-2', name: '修改', dataValue: '3', description: '', sort: 2, enabled: true },
                { id: 'item-ot-3', name: '删除', dataValue: '4', description: '', sort: 3, enabled: true },
                { id: 'item-ot-4', name: '查询', dataValue: '1', description: '', sort: 4, enabled: true },
                { id: 'item-ot-5', name: '导入', dataValue: '5', description: '', sort: 5, enabled: true },
                { id: 'item-ot-6', name: '导出', dataValue: '6', description: '', sort: 6, enabled: true },
            ],
        },
        {
            id: 'dict-certificate-standard',
            name: '证书标准',
            code: 'om_certificate_standard',
            description: '',
            items: [
                { id: 'item-cs-1', name: 'X.509', dataValue: 'x509', description: '标准X.509证书', sort: 1, enabled: true },
                { id: 'item-cs-2', name: 'RSA', dataValue: 'rsa', description: 'RSA证书', sort: 2, enabled: true },
            ],
        },
        {
            id: 'dict-product-type',
            name: '业务类型',
            code: 'business_type',
            description: '产品分类所属业务类型',
            items: [
                { id: 'item-pt-1', name: '大表', dataValue: 'large_meter', description: '', sort: 1, enabled: true },
                { id: 'item-pt-2', name: '户表', dataValue: 'household_meter', description: '', sort: 2, enabled: true },
                { id: 'item-pt-3', name: '压力计', dataValue: 'pressure_gauge', description: '', sort: 3, enabled: true },
                { id: 'item-pt-4', name: '水质仪', dataValue: 'water_quality', description: '', sort: 4, enabled: true },
                { id: 'item-pt-5', name: '智慧水站', dataValue: 'smart_station', description: '', sort: 5, enabled: true },
            ],
        },
        {
            id: 'dict-device-status',
            name: '设备状态',
            code: 'device_status',
            description: '',
            items: [
                { id: 'item-ds-1', name: '在线', dataValue: 'online', description: '设备在线', sort: 1, enabled: true },
                { id: 'item-ds-2', name: '离线', dataValue: 'offline', description: '设备离线', sort: 2, enabled: true },
                { id: 'item-ds-3', name: '故障', dataValue: 'fault', description: '设备故障', sort: 3, enabled: true },
                { id: 'item-ds-4', name: '禁用', dataValue: 'disabled', description: '设备已禁用', sort: 4, enabled: true },
            ],
        },
        {
            id: 'dict-alarm-level',
            name: '告警等级',
            code: 'alarm_level',
            description: '',
            items: [
                { id: 'item-al-1', name: '紧急', dataValue: 'critical', description: '紧急告警', sort: 1, enabled: true },
                { id: 'item-al-2', name: '重要', dataValue: 'major', description: '重要告警', sort: 2, enabled: true },
                { id: 'item-al-3', name: '次要', dataValue: 'minor', description: '次要告警', sort: 3, enabled: true },
                { id: 'item-al-4', name: '提示', dataValue: 'info', description: '提示告警', sort: 4, enabled: true },
            ],
        },
        {
            id: 'dict-alarm-status',
            name: '告警状态',
            code: 'alarm_status',
            description: '',
            items: [
                { id: 'item-as-1', name: '未处理', dataValue: 'pending', description: '', sort: 1, enabled: true },
                { id: 'item-as-2', name: '处理中', dataValue: 'processing', description: '', sort: 2, enabled: true },
                { id: 'item-as-3', name: '已处理', dataValue: 'resolved', description: '', sort: 3, enabled: true },
            ],
        },
        {
            id: 'dict-gender',
            name: '性别',
            code: 'sys_gender',
            description: '',
            items: [
                { id: 'item-g-1', name: '男', dataValue: '1', description: '', sort: 1, enabled: true },
                { id: 'item-g-2', name: '女', dataValue: '2', description: '', sort: 2, enabled: true },
                { id: 'item-g-3', name: '未知', dataValue: '0', description: '', sort: 3, enabled: true },
            ],
        },
        {
            id: 'dict-yes-no',
            name: '是否',
            code: 'sys_yes_no',
            description: '',
            items: [
                { id: 'item-yn-1', name: '是', dataValue: '1', description: '', sort: 1, enabled: true },
                { id: 'item-yn-2', name: '否', dataValue: '0', description: '', sort: 2, enabled: true },
            ],
        },
        {
            id: 'dict-enable-status',
            name: '启用状态',
            code: 'sys_enable_status',
            description: '',
            items: [
                { id: 'item-es-1', name: '启用', dataValue: '1', description: '', sort: 1, enabled: true },
                { id: 'item-es-2', name: '禁用', dataValue: '0', description: '', sort: 2, enabled: true },
            ],
        },
        {
            id: 'dict-menu-type',
            name: '菜单类型',
            code: 'sys_menu_type',
            description: '',
            items: [
                { id: 'item-mt-1', name: '目录', dataValue: 'root', description: '', sort: 1, enabled: true },
                { id: 'item-mt-2', name: '菜单', dataValue: 'submenu', description: '', sort: 2, enabled: true },
                { id: 'item-mt-3', name: '按钮', dataValue: 'button', description: '', sort: 3, enabled: true },
            ],
        },
        {
            id: 'dict-meter-manufacturer',
            name: '表具厂家',
            code: 'meter_manufacturer',
            description: '大表设备表具厂家字典',
            items: [
                { id: 'item-mm-1', name: '山科', dataValue: '山科', description: '', sort: 1, enabled: true },
                { id: 'item-mm-2', name: '惠然', dataValue: '惠然', description: '', sort: 2, enabled: true },
                { id: 'item-mm-3', name: '汇中', dataValue: '汇中', description: '', sort: 3, enabled: true },
                { id: 'item-mm-4', name: '迈拓', dataValue: '迈拓', description: '', sort: 4, enabled: true },
                { id: 'item-mm-5', name: '海威兹', dataValue: '海威兹', description: '', sort: 5, enabled: true },
                { id: 'item-mm-6', name: '泽火', dataValue: '泽火', description: '', sort: 6, enabled: true },
                { id: 'item-mm-7', name: '宁波', dataValue: '宁波', description: '', sort: 7, enabled: true },
                { id: 'item-mm-8', name: '紫瑞', dataValue: '紫瑞', description: '', sort: 8, enabled: true },
                { id: 'item-mm-9', name: '兴玺', dataValue: '兴玺', description: '', sort: 9, enabled: true },
                { id: 'item-mm-10', name: '捷先', dataValue: '捷先', description: '', sort: 10, enabled: true },
            ],
        },
        {
            id: 'dict-remote-manufacturer',
            name: '远传厂家',
            code: 'remote_manufacturer',
            description: '大表设备远传厂家字典',
            items: [
                { id: 'item-rm-1', name: '紫峰远传', dataValue: '紫峰远传', description: '', sort: 1, enabled: true },
                { id: 'item-rm-2', name: '宁水远传', dataValue: '宁水远传', description: '', sort: 2, enabled: true },
                { id: 'item-rm-3', name: '三川智慧', dataValue: '三川智慧', description: '', sort: 3, enabled: true },
                { id: 'item-rm-4', name: '新天科技', dataValue: '新天科技', description: '', sort: 4, enabled: true },
                { id: 'item-rm-5', name: '威胜信息', dataValue: '威胜信息', description: '', sort: 5, enabled: true },
            ],
        },
    ];
}
