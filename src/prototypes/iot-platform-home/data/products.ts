import {
    getProductCategoryLabel,
    LARGE_METER_TYPE_NODES,
    LARGE_METER_VENDOR_ORDER,
} from './productCategories';

export type PropertyRow = {
    id: string;
    identifier: string;
    name: string;
    dataType: string;
    accessMode: string;
    description: string;
};

export type FunctionRow = {
    id: string;
    identifier: string;
    name: string;
    async: string;
    description: string;
    inputJson: string;
};

const FUNCTION_PARAM_DEFAULTS: Record<string, unknown> = {
    delay: 3,
    threshold: 80,
    metric: 'temperature',
    timestamp: 1718188800,
    version: '1.2.0',
    url: 'https://example.com/fw.bin',
    md5: 'abc123',
};

export function parseFunctionInputKeys(inputJson: string): string[] {
    if (!inputJson?.trim() || inputJson.trim() === '{}') return [];

    try {
        const parsed = JSON.parse(inputJson) as Record<string, unknown>;
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            return Object.keys(parsed);
        }
    } catch {
        // fallback to regex for legacy strings
    }

    const matches = inputJson.match(/"([^"]+)":/g);
    return matches?.map((match) => match.replace(/"/g, '').replace(':', '')) ?? [];
}

export function normalizeFunctionRow(row: FunctionRow): FunctionRow {
    const fallback = DEFAULT_FUNCTION_ROWS.find((item) => item.identifier === row.identifier);
    const hasInputJson = Boolean(row.inputJson?.trim() && row.inputJson.trim() !== '{}');
    return {
        ...row,
        inputJson: hasInputJson ? row.inputJson : (fallback?.inputJson ?? '{}'),
    };
}

export function getFunctionInputParams(row: FunctionRow): string[] {
    return parseFunctionInputKeys(normalizeFunctionRow(row).inputJson);
}

export function buildFunctionInputJson(paramKeys: string[], previousJson?: string): string {
    if (!paramKeys.length) return '{}';

    let previous: Record<string, unknown> = {};
    if (previousJson?.trim()) {
        try {
            previous = JSON.parse(previousJson) as Record<string, unknown>;
        } catch {
            previous = {};
        }
    }

    const result: Record<string, unknown> = {};
    paramKeys.forEach((key) => {
        result[key] = previous[key] ?? FUNCTION_PARAM_DEFAULTS[key] ?? '';
    });
    return JSON.stringify(result);
}

export type EventRow = {
    id: string;
    identifier: string;
    name: string;
    eventType: string;
    jsonObject: string;
    description: string;
};

export type ProductRecord = {
    id: string;
    code: string;
    name: string;
    categoryId: string;
    category: string;
    nodeType: string;
    vendor: string;
    remark: string;
    protocolId: string;
    protocolLabel: string;
    deviceCount: number;
    properties: PropertyRow[];
    functions: FunctionRow[];
    events: EventRow[];
};

export const DEFAULT_PROPERTY_ROWS: PropertyRow[] = [
    { id: '1', identifier: 'flow_rate', name: '瞬时流量', dataType: 'float', accessMode: '只读', description: '当前瞬时流量，单位 m³/h' },
    { id: '2', identifier: 'total_flow', name: '累计流量', dataType: 'float', accessMode: '只读', description: '累计用水量，单位 m³' },
    { id: '3', identifier: 'pressure', name: '压力', dataType: 'float', accessMode: '只读', description: '管网压力，单位 MPa' },
    { id: '4', identifier: 'water_temp', name: '水温', dataType: 'float', accessMode: '只读', description: '水体温度，单位 ℃' },
    { id: '5', identifier: 'battery', name: '电池电量', dataType: 'int', accessMode: '只读', description: '设备电池剩余电量，单位 %' },
];

export const DEFAULT_FUNCTION_ROWS: FunctionRow[] = [
    {
        id: '1',
        identifier: 'remote_valve',
        name: '远程开关阀',
        async: '是',
        description: '远程控制设备阀门开/关，适用于户表及大表',
        inputJson: '{"action":"open"}',
    },
    {
        id: '2',
        identifier: 'set_threshold',
        name: '设置告警阈值',
        async: '否',
        description: '调整压力、流量或水质等告警阈值参数',
        inputJson: '{"threshold":0.6,"metric":"pressure"}',
    },
    {
        id: '3',
        identifier: 'sync_time',
        name: '同步时间',
        async: '否',
        description: '将平台时间同步至设备本地时钟',
        inputJson: '{"timestamp":1718188800}',
    },
    {
        id: '4',
        identifier: 'firmware_upgrade',
        name: '固件升级',
        async: '是',
        description: '下发 OTA 固件包并触发升级流程',
        inputJson: '{"version":"1.2.0","url":"https://example.com/fw.bin","md5":"abc123"}',
    },
];

export const DEFAULT_EVENT_ROWS: EventRow[] = [
    { id: '1', identifier: 'leak_alarm', name: '漏水告警', eventType: '告警', jsonObject: '{ "leak": true, "level": "warning" }', description: '检测到管道或设备漏水时上报' },
    { id: '2', identifier: 'flow_abnormal', name: '流量异常', eventType: '告警', jsonObject: '{ "flow_rate": 120.5 }', description: '瞬时流量超出设定阈值时上报' },
    { id: '3', identifier: 'online_event', name: '上线事件', eventType: '信息', jsonObject: '{ "status": "online" }', description: '设备成功接入平台并建立连接' },
    { id: '4', identifier: 'offline_event', name: '离线事件', eventType: '信息', jsonObject: '{ "status": "offline" }', description: '设备与平台连接断开时上报' },
    { id: '5', identifier: 'low_battery', name: '电池电量低', eventType: '告警', jsonObject: '{ "battery": 15 }', description: '设备电池电量低于告警阈值时上报' },
    { id: '6', identifier: 'sensor_fault', name: '传感器故障', eventType: '故障', jsonObject: '{ "code": "F102" }', description: '传感器硬件或通信异常时上报' },
];

function cloneModelRows<T>(rows: T[]): T[] {
    return rows.map((row) => ({ ...row }));
}

type ProductSeed = {
    categoryId: string;
    category: string;
    name: string;
    code: string;
    nodeType: string;
    deviceCount: number;
    remark?: string;
    protocolId?: string;
    protocolLabel?: string;
    vendor?: string;
    properties?: PropertyRow[];
    functions?: FunctionRow[];
    events?: EventRow[];
};

type CategoryThingModel = {
    properties: PropertyRow[];
    functions: FunctionRow[];
    events: EventRow[];
};

/** 直饮水机控制网关物模型（依据净水箱清洗工艺图） */
const GATEWAY_PROPERTIES: PropertyRow[] = [
    { id: 'gw-p1', identifier: 'raw_tank_level', name: '原水箱液位', dataType: 'float', accessMode: '只读', description: '原水箱实时液位，单位 m' },
    { id: 'gw-p2', identifier: 'pure_tank_level', name: '净水箱液位', dataType: 'float', accessMode: '只读', description: '净水箱实时液位，单位 m' },
    { id: 'gw-p3', identifier: 'product_flow_rate', name: '产水瞬时量', dataType: 'float', accessMode: '只读', description: '膜处理后的瞬时产水量，单位 m³/h' },
    { id: 'gw-p4', identifier: 'supply_pressure', name: '供水压力', dataType: 'float', accessMode: '只读', description: '直饮供水管路压力，单位 MPa' },
    { id: 'gw-p5', identifier: 'run_status', name: '运行状态', dataType: 'enum', accessMode: '只读', description: '枚举型：制水/供水/清洗/待机/故障' },
];

const GATEWAY_FUNCTIONS: FunctionRow[] = [
    { id: 'gw-f1', identifier: 'start_production', name: '启动制水', async: '是', description: '联动原水泵、高压泵和膜处理单元启动制水', inputJson: '{"mode":"auto"}' },
    { id: 'gw-f2', identifier: 'stop_production', name: '停止制水', async: '是', description: '停止制水流程并关闭相关阀门', inputJson: '{}' },
    { id: 'gw-f3', identifier: 'start_cleaning', name: '启动清洗', async: '是', description: '启动净水箱与膜组件清洗流程', inputJson: '{"duration":600}' },
    { id: 'gw-f4', identifier: 'firmware_upgrade', name: '固件升级', async: '是', description: '下发 OTA 固件包并触发升级', inputJson: '{"version":"2.0.0","url":"https://example.com/zyssj.bin"}' },
];

const GATEWAY_EVENTS: EventRow[] = [
    { id: 'gw-e1', identifier: 'tank_level_alarm', name: '水箱液位异常', eventType: '告警', jsonObject: '{ "tank":"raw", "level":0.15 }', description: '原水箱或净水箱液位超出上下限时上报' },
    { id: 'gw-e2', identifier: 'quality_alarm', name: '水质异常', eventType: '告警', jsonObject: '{ "conductivity":68 }', description: '产水电导、浊度、臭氧或 pH 超出阈值时上报' },
    { id: 'gw-e3', identifier: 'pump_fault', name: '水泵故障', eventType: '故障', jsonObject: '{ "pump":"high_pressure", "fault_code":"P001" }', description: '原水泵、高压泵或供水泵异常时上报' },
    { id: 'gw-e4', identifier: 'offline_event', name: '离线事件', eventType: '信息', jsonObject: '{ "status": "offline" }', description: '设备与平台连接断开时上报' },
];

const CATEGORY_THING_MODELS: Record<string, CategoryThingModel> = {
    dabiao: {
        properties: [
            { id: 'db-p1', identifier: 'data_time', name: '数据时间', dataType: 'date', accessMode: '只读', description: '本次属性上报的数据采集时间' },
            { id: 'db-p2', identifier: 'total_flow', name: '累计流量', dataType: 'float', accessMode: '只读', description: '累计用水量，单位 m³' },
            { id: 'db-p3', identifier: 'forward_flow', name: '正向流量', dataType: 'float', accessMode: '只读', description: '正向累计流量，单位 m³' },
            { id: 'db-p4', identifier: 'reverse_flow', name: '反向流量', dataType: 'float', accessMode: '只读', description: '反向累计流量，单位 m³' },
            { id: 'db-p5', identifier: 'flow_rate', name: '瞬时流量', dataType: 'float', accessMode: '只读', description: '当前瞬时流量，单位 m³/h' },
            { id: 'db-p6', identifier: 'battery_voltage', name: '电池电压', dataType: 'float', accessMode: '只读', description: '设备电池电压，单位 V' },
            { id: 'db-p7', identifier: 'signal_strength', name: '信号强度', dataType: 'int', accessMode: '只读', description: '通信信号强度 RSSI，单位 dBm' },
        ],
        functions: [
            { id: 'db-f1', identifier: 'remote_valve', name: '远程开关阀', async: '是', description: '远程控制大表阀门开/关', inputJson: '{"action":"open"}' },
            { id: 'db-f2', identifier: 'set_report_interval', name: '设置上报周期', async: '否', description: '调整数据上报间隔，单位分钟', inputJson: '{"interval":60}' },
            { id: 'db-f3', identifier: 'sync_time', name: '同步时间', async: '否', description: '将平台时间同步至设备', inputJson: '{"timestamp":1718188800}' },
            { id: 'db-f4', identifier: 'firmware_upgrade', name: '固件升级', async: '是', description: '下发 OTA 固件升级包', inputJson: '{"version":"1.2.0"}' },
        ],
        events: [
            { id: 'db-e1', identifier: 'empty_pipe_alarm', name: '空管报警', eventType: '告警', jsonObject: '{ "empty_pipe": true }', description: '检测到管道无水或空管状态时上报' },
            { id: 'db-e2', identifier: 'low_battery', name: '电量低报警', eventType: '告警', jsonObject: '{ "battery_voltage": 3.2 }', description: '电池电压低于告警阈值时上报' },
            { id: 'db-e3', identifier: 'offline_alarm', name: '设备离线报警', eventType: '告警', jsonObject: '{ "status": "offline" }', description: '设备与平台通信中断或长时间未上报时触发' },
            { id: 'db-e4', identifier: 'reverse_flow_alarm', name: '倒流报警', eventType: '告警', jsonObject: '{ "reverse_flow": 0.5 }', description: '检测到反向流量或管网倒流时上报' },
            { id: 'db-e5', identifier: 'flow_overload_alarm', name: '水量过载报警', eventType: '告警', jsonObject: '{ "flow_rate": 500 }', description: '瞬时流量超出额定上限时上报' },
            { id: 'db-e6', identifier: 'motherboard_alarm', name: '主板报警', eventType: '故障', jsonObject: '{ "fault_code": "MB001" }', description: '表计主板自检异常或硬件故障时上报' },
        ],
    },
    hubiao: {
        properties: [
            { id: 'hb-p1', identifier: 'total_flow', name: '累计流量', dataType: 'float', accessMode: '只读', description: '累计用水量，单位 m³' },
            { id: 'hb-p2', identifier: 'daily_flow', name: '日用水量', dataType: 'float', accessMode: '只读', description: '当日累计用水量，单位 m³' },
            { id: 'hb-p3', identifier: 'valve_status', name: '阀门状态', dataType: 'bool', accessMode: '读写', description: '0-关闭，1-开启' },
            { id: 'hb-p4', identifier: 'battery', name: '电池电量', dataType: 'int', accessMode: '只读', description: '设备电池剩余电量，单位 %' },
            { id: 'hb-p5', identifier: 'signal_strength', name: '信号强度', dataType: 'int', accessMode: '只读', description: 'NB-IoT/LoRa 信号强度' },
        ],
        functions: [
            { id: 'hb-f1', identifier: 'remote_valve', name: '远程开关阀', async: '是', description: '远程控制户表阀门', inputJson: '{"action":"close"}' },
            { id: 'hb-f2', identifier: 'set_report_interval', name: '设置上报周期', async: '否', description: '调整抄表上报间隔', inputJson: '{"interval":1440}' },
            { id: 'hb-f3', identifier: 'sync_time', name: '同步时间', async: '否', description: '同步平台时间至设备', inputJson: '{"timestamp":1718188800}' },
        ],
        events: [
            { id: 'hb-e1', identifier: 'leak_alarm', name: '漏水告警', eventType: '告警', jsonObject: '{ "leak": true }', description: '户内漏水检测告警' },
            { id: 'hb-e2', identifier: 'tamper_alarm', name: '拆表告警', eventType: '告警', jsonObject: '{ "tamper": true }', description: '检测到非法拆表时上报' },
            { id: 'hb-e3', identifier: 'low_battery', name: '低电量告警', eventType: '告警', jsonObject: '{ "battery": 20 }', description: '电池电量不足时上报' },
            { id: 'hb-e4', identifier: 'offline_event', name: '离线事件', eventType: '信息', jsonObject: '{ "status": "offline" }', description: '设备离线时上报' },
        ],
    },
    yaliji: {
        properties: [
            { id: 'yl-p1', identifier: 'pressure', name: '压力值', dataType: 'float', accessMode: '只读', description: '监测点压力，单位 MPa' },
            { id: 'yl-p2', identifier: 'water_temp', name: '水温', dataType: 'float', accessMode: '只读', description: '水体温度，单位 ℃' },
            { id: 'yl-p3', identifier: 'battery', name: '电池电量', dataType: 'int', accessMode: '只读', description: '设备电池剩余电量，单位 %' },
            { id: 'yl-p4', identifier: 'signal_strength', name: '信号强度', dataType: 'int', accessMode: '只读', description: '无线通信信号强度' },
        ],
        functions: [
            { id: 'yl-f1', identifier: 'set_threshold', name: '设置压力阈值', async: '否', description: '设置高压/低压告警阈值', inputJson: '{"high":0.8,"low":0.15}' },
            { id: 'yl-f2', identifier: 'calibrate', name: '零点校准', async: '是', description: '触发压力传感器零点校准', inputJson: '{"mode":"zero"}' },
            { id: 'yl-f3', identifier: 'sync_time', name: '同步时间', async: '否', description: '同步平台时间至设备', inputJson: '{"timestamp":1718188800}' },
        ],
        events: [
            { id: 'yl-e1', identifier: 'pressure_high', name: '高压告警', eventType: '告警', jsonObject: '{ "pressure": 0.82 }', description: '压力超过上限阈值时上报' },
            { id: 'yl-e2', identifier: 'pressure_low', name: '低压告警', eventType: '告警', jsonObject: '{ "pressure": 0.12 }', description: '压力低于下限阈值时上报' },
            { id: 'yl-e3', identifier: 'sensor_fault', name: '传感器故障', eventType: '故障', jsonObject: '{ "code": "S001" }', description: '压力传感器异常时上报' },
            { id: 'yl-e4', identifier: 'offline_event', name: '离线事件', eventType: '信息', jsonObject: '{ "status": "offline" }', description: '设备离线时上报' },
        ],
    },
    shuizhiyi: {
        properties: [
            { id: 'szy-p1', identifier: 'turbidity', name: '浊度', dataType: 'float', accessMode: '只读', description: '水体浊度，单位 NTU' },
            { id: 'szy-p2', identifier: 'ph', name: 'PH值', dataType: 'float', accessMode: '只读', description: '水体酸碱度' },
            { id: 'szy-p3', identifier: 'residual_chlorine', name: '余氯', dataType: 'float', accessMode: '只读', description: '余氯含量，单位 mg/L' },
            { id: 'szy-p4', identifier: 'conductivity', name: '电导率', dataType: 'float', accessMode: '只读', description: '水体电导率，单位 μS/cm' },
            { id: 'szy-p5', identifier: 'water_temp', name: '水温', dataType: 'float', accessMode: '只读', description: '水体温度，单位 ℃' },
        ],
        functions: [
            { id: 'szy-f1', identifier: 'calibrate', name: '传感器校准', async: '是', description: '触发水质传感器校准流程', inputJson: '{"sensor":"turbidity"}' },
            { id: 'szy-f2', identifier: 'set_threshold', name: '设置告警阈值', async: '否', description: '设置浊度、余氯等告警阈值', inputJson: '{"turbidity_max":5,"chlorine_min":0.3}' },
            { id: 'szy-f3', identifier: 'sync_time', name: '同步时间', async: '否', description: '同步平台时间至设备', inputJson: '{"timestamp":1718188800}' },
        ],
        events: [
            { id: 'szy-e1', identifier: 'quality_alarm', name: '水质超标', eventType: '告警', jsonObject: '{ "turbidity": 5.2 }', description: '水质指标超出标准时上报' },
            { id: 'szy-e2', identifier: 'chlorine_low', name: '余氯不足', eventType: '告警', jsonObject: '{ "residual_chlorine": 0.15 }', description: '余氯低于标准值时上报' },
            { id: 'szy-e3', identifier: 'sensor_fault', name: '传感器故障', eventType: '故障', jsonObject: '{ "code": "Q102" }', description: '水质传感器故障时上报' },
            { id: 'szy-e4', identifier: 'offline_event', name: '离线事件', eventType: '信息', jsonObject: '{ "status": "offline" }', description: '设备离线时上报' },
        ],
    },
    zhihuishuizhan: {
        properties: [
            { id: 'zhsz-p1', identifier: 'raw_tank_level', name: '原水箱液位', dataType: 'float', accessMode: '只读', description: '原水箱实时液位，单位 m' },
            { id: 'zhsz-p2', identifier: 'raw_conductivity', name: '原水电导', dataType: 'float', accessMode: '只读', description: '原水电导率，单位 μS/cm' },
            { id: 'zhsz-p3', identifier: 'raw_pressure', name: '原水压力', dataType: 'float', accessMode: '只读', description: '原水进水压力，单位 MPa' },
            { id: 'zhsz-p4', identifier: 'pure_tank_level', name: '净水箱液位', dataType: 'float', accessMode: '只读', description: '净水箱实时液位，单位 m' },
            { id: 'zhsz-p5', identifier: 'pure_conductivity', name: '净水箱电导', dataType: 'float', accessMode: '只读', description: '净水箱电导率，单位 μS/cm' },
            { id: 'zhsz-p6', identifier: 'product_flow_rate', name: '产水瞬时量', dataType: 'float', accessMode: '只读', description: '瞬时产水流量，单位 m³/h' },
            { id: 'zhsz-p7', identifier: 'product_total_flow', name: '产水累计量', dataType: 'float', accessMode: '只读', description: '累计产水量，单位 m³' },
            { id: 'zhsz-p8', identifier: 'product_conductivity', name: '产水电导', dataType: 'float', accessMode: '只读', description: '膜处理后产水电导率，单位 μS/cm' },
            { id: 'zhsz-p9', identifier: 'membrane_inlet_pressure', name: '膜前压力', dataType: 'float', accessMode: '只读', description: '膜组件入口压力，单位 MPa' },
            { id: 'zhsz-p10', identifier: 'membrane_outlet_pressure', name: '膜后压力', dataType: 'float', accessMode: '只读', description: '膜组件出口压力，单位 MPa' },
            { id: 'zhsz-p11', identifier: 'high_pump_inlet_pressure', name: '高压泵前压力', dataType: 'float', accessMode: '只读', description: '高压泵入口压力，单位 MPa' },
            { id: 'zhsz-p12', identifier: 'supply_pressure', name: '供水压力', dataType: 'float', accessMode: '只读', description: '直饮供水压力，单位 MPa' },
            { id: 'zhsz-p13', identifier: 'supply_flow_rate', name: '瞬时供水量', dataType: 'float', accessMode: '只读', description: '瞬时供水流量，单位 m³/h' },
            { id: 'zhsz-p14', identifier: 'supply_total_flow', name: '累计供水量', dataType: 'float', accessMode: '只读', description: '累计供水量，单位 m³' },
            { id: 'zhsz-p15', identifier: 'return_flow_rate', name: '回水瞬时量', dataType: 'float', accessMode: '只读', description: '瞬时回水流量，单位 m³/h' },
            { id: 'zhsz-p16', identifier: 'return_total_flow', name: '回水累计量', dataType: 'float', accessMode: '只读', description: '累计回水量，单位 m³' },
            { id: 'zhsz-p17', identifier: 'turbidity', name: '浊度', dataType: 'float', accessMode: '只读', description: '回水浊度，单位 NTU' },
            { id: 'zhsz-p18', identifier: 'ozone', name: '臭氧', dataType: 'float', accessMode: '只读', description: '回水臭氧浓度，单位 mg/L' },
            { id: 'zhsz-p19', identifier: 'ph', name: 'pH', dataType: 'float', accessMode: '只读', description: '回水酸碱度' },
            { id: 'zhsz-p20', identifier: 'water_temp', name: '水温', dataType: 'float', accessMode: '只读', description: '回水温度，单位 ℃' },
        ],
        functions: [
            { id: 'zhsz-f1', identifier: 'control_raw_pump', name: '原水泵控制', async: '是', description: '远程启动或停止原水泵', inputJson: '{"action":"start"}' },
            { id: 'zhsz-f2', identifier: 'control_high_pump', name: '高压泵控制', async: '是', description: '远程启动或停止高压泵', inputJson: '{"action":"start"}' },
            { id: 'zhsz-f3', identifier: 'control_supply_pump', name: '供水泵控制', async: '是', description: '远程控制 1#、2#、3# 供水泵', inputJson: '{"pump_no":1,"action":"start"}' },
            { id: 'zhsz-f4', identifier: 'control_ozone_generator', name: '臭氧发生器控制', async: '是', description: '远程启动或停止臭氧发生器', inputJson: '{"action":"start"}' },
            { id: 'zhsz-f5', identifier: 'control_valve', name: '工艺阀门控制', async: '是', description: '控制原水阀、回水阀、膜前阀、供水阀、清洗进水阀、浓水阀和清洗排放阀', inputJson: '{"valve":"raw_water","action":"open"}' },
            { id: 'zhsz-f6', identifier: 'start_cleaning', name: '启动清洗流程', async: '是', description: '按工艺顺序联动阀门、水泵和臭氧发生器执行净水箱清洗', inputJson: '{"duration":600}' },
        ],
        events: [
            { id: 'zhsz-e1', identifier: 'tank_level_alarm', name: '水箱液位异常', eventType: '告警', jsonObject: '{ "tank":"pure", "level":0.12 }', description: '原水箱或净水箱液位超出上下限时上报' },
            { id: 'zhsz-e2', identifier: 'conductivity_alarm', name: '电导异常', eventType: '告警', jsonObject: '{ "point":"product", "conductivity":68 }', description: '原水、净水箱或产水电导率超出阈值时上报' },
            { id: 'zhsz-e3', identifier: 'pressure_alarm', name: '压力异常', eventType: '告警', jsonObject: '{ "point":"membrane_inlet", "pressure":0.85 }', description: '膜前、膜后、高压泵前或供水压力异常时上报' },
            { id: 'zhsz-e4', identifier: 'quality_alarm', name: '回水水质异常', eventType: '告警', jsonObject: '{ "turbidity":4.8,"ozone":0.02,"ph":6.2 }', description: '回水浊度、臭氧或 pH 超出阈值时上报' },
            { id: 'zhsz-e5', identifier: 'pump_fault', name: '水泵故障', eventType: '故障', jsonObject: '{ "pump":"supply_1", "fault_code":"P001" }', description: '原水泵、高压泵或任一供水泵异常时上报' },
            { id: 'zhsz-e6', identifier: 'offline_event', name: '离线事件', eventType: '信息', jsonObject: '{ "status": "offline" }', description: '设备离线时上报' },
        ],
    },
};

function resolveThingModelCategoryId(categoryId: string): string {
    if (categoryId.startsWith('dabiao')) {
        return 'dabiao';
    }
    return categoryId;
}

function getCategoryThingModel(categoryId: string, isGateway: boolean): CategoryThingModel {
    if (isGateway) {
        return {
            properties: GATEWAY_PROPERTIES,
            functions: GATEWAY_FUNCTIONS,
            events: GATEWAY_EVENTS,
        };
    }
    const resolvedCategoryId = resolveThingModelCategoryId(categoryId);
    return CATEGORY_THING_MODELS[resolvedCategoryId] ?? {
        properties: DEFAULT_PROPERTY_ROWS,
        functions: DEFAULT_FUNCTION_ROWS,
        events: DEFAULT_EVENT_ROWS,
    };
}

const LARGE_METER_TYPE_REMARKS: Record<string, string> = {
    'dabiao-em': '电磁感应原理大口径水表，适用于清洁水质管网计量。',
    'dabiao-mech': '机械传动大口径水表，计量稳定、维护成本低。',
    'dabiao-ultra': '超声波非接触计量，适合大流量远传抄表场景。',
    'dabiao-flow': '管网流量计产品，支持瞬时流量与累计流量监测。',
};

const PRODUCT_REMARKS: Record<string, string> = {
    dabiao: '适用于 DN50 及以上管网大口径计量场景，支持远程抄表与阀门控制。',
    hubiao: '适用于居民及商业户用远传抄表，支持 NB-IoT / LoRa 等多种通信方式。',
    yaliji: '适用于供水管网压力监测，支持高低压告警与传感器校准。',
    shuizhiyi: '适用于水源地、水厂及管网水质在线监测，支持多参数采集。',
    zhihuishuizhan: '依据净水箱清洗工艺设计，集成原水预处理、精滤、膜处理、净水储存、臭氧消毒和循环供水。',
};

const VARIANT_REMARKS: Record<string, string> = {
    'NB-IoT型': '内置 NB-IoT 通信模组，低功耗广覆盖。',
    'LoRa型': 'LoRa 无线组网，适合密集部署场景。',
    '有线远传型': 'RS485 有线通信，适用于集中抄表。',
    '光电直读型': '光电直读技术，抄读准确率高。',
    '管网型': '专用于主管网及配水管网压力监测。',
    '泵站型': '安装于泵站进出口，监测泵房运行压力。',
    '二供型': '二次供水泵房专用压力监测设备。',
    '无线型': '内置无线通信模组，免布线快速部署。',
    '在线监测型': '固定安装式在线水质监测终端。',
    '便携型': '便携式水质快速检测，适合巡检抽检。',
    '多参数型': '同时监测浊度、PH、余氯、电导率等多指标。',
    '余氯型': '专用于出水余氯在线监测。',
    '净水箱清洗工艺型': '配置原水箱、净水箱、多级过滤、高压膜处理、三路供水泵和臭氧发生器。',
    '网关型': '作为边缘网关接入子设备，支持本地汇聚上报。',
};

const PRODUCT_TEMPLATES: Array<{
    categoryId: string;
    category: string;
    prefix: string;
    variants: string[];
    nodeTypes?: string[];
}> = [
    {
        categoryId: 'hubiao',
        category: '户表',
        prefix: 'HB',
        variants: ['NB-IoT型', 'LoRa型', '有线远传型', '光电直读型'],
    },
    {
        categoryId: 'yaliji',
        category: '压力计',
        prefix: 'YL',
        variants: ['管网型', '泵站型', '二供型', '无线型'],
    },
    {
        categoryId: 'shuizhiyi',
        category: '水质仪',
        prefix: 'SZY',
        variants: ['在线监测型', '便携型', '多参数型', '余氯型'],
    },
    {
        categoryId: 'zhihuishuizhan',
        category: '直饮水机',
        prefix: 'ZYSSJ',
        variants: ['净水箱清洗工艺型'],
        nodeTypes: ['直连设备'],
    },
];

const LARGE_METER_TYPE_PREFIX: Record<string, string> = {
    'dabiao-em': 'DB-EM',
    'dabiao-mech': 'DB-MC',
    'dabiao-ultra': 'DB-US',
    'dabiao-flow': 'DB-FL',
};

function buildLargeMeterSeeds(): ProductSeed[] {
    return LARGE_METER_TYPE_NODES.flatMap((typeNode) => (
        LARGE_METER_VENDOR_ORDER.map((vendor, index) => {
            const thingModel = getCategoryThingModel(typeNode.id, false);
            const protocol = index % 2 === 0
                ? { protocolId: 'mqtt', protocolLabel: 'MQTT' }
                : { protocolId: 'coap', protocolLabel: 'CoAP' };

            return {
                categoryId: typeNode.id,
                category: typeNode.label,
                name: `${typeNode.label}-${vendor}`,
                code: `${LARGE_METER_TYPE_PREFIX[typeNode.id]}-${String(index + 1).padStart(2, '0')}`,
                nodeType: '直连设备',
                deviceCount: 12 + index,
                remark: `${LARGE_METER_TYPE_REMARKS[typeNode.id] ?? PRODUCT_REMARKS.dabiao}供应商：${vendor}。`,
                vendor,
                ...protocol,
                properties: thingModel.properties,
                functions: thingModel.functions,
                events: thingModel.events,
            };
        })
    ));
}

function buildProductSeeds(): ProductSeed[] {
    const seeds: ProductSeed[] = [...buildLargeMeterSeeds()];

    PRODUCT_TEMPLATES.forEach((template) => {
        template.variants.forEach((variant, index) => {
            const nodeType = template.nodeTypes?.[index] ?? '直连设备';
            const isGateway = nodeType === '网关设备';
            const thingModel = getCategoryThingModel(template.categoryId, isGateway);
            const protocol = isGateway
                ? { protocolId: 'modbus-tcp', protocolLabel: 'Modbus TCP' }
                : index % 2 === 0
                    ? { protocolId: 'mqtt', protocolLabel: 'MQTT' }
                    : { protocolId: 'coap', protocolLabel: 'CoAP' };

            seeds.push({
                categoryId: template.categoryId,
                category: template.category,
                name: `${template.category}-${variant}`,
                code: `${template.prefix}-${String(index + 1).padStart(3, '0')}`,
                nodeType,
                deviceCount: nodeType === '直连设备' ? 16 + index * 2 : 8,
                remark: `${PRODUCT_REMARKS[template.categoryId] ?? ''}${VARIANT_REMARKS[variant] ?? ''}`,
                vendor: '紫峰装备',
                ...protocol,
                properties: thingModel.properties,
                functions: thingModel.functions,
                events: thingModel.events,
            });
        });
    });

    return seeds;
}

function buildGatewaySubDeviceSeeds(): ProductSeed[] {
    const templates = [
        { categoryId: 'yaliji', category: '压力计', prefix: 'YL-SUB', name: '压力计-网关子设备' },
        { categoryId: 'shuizhiyi', category: '水质仪', prefix: 'SZY-SUB', name: '水质仪-网关子设备' },
        { categoryId: 'dabiao-em', category: '电磁表', prefix: 'DB-SUB', name: '电磁表-网关子设备' },
        { categoryId: 'hubiao', category: '户表', prefix: 'HB-SUB', name: '户表-网关子设备' },
    ];

    return templates.map((template, index) => {
        const thingModel = getCategoryThingModel(template.categoryId, false);
        return {
            categoryId: template.categoryId,
            category: template.category,
            name: template.name,
            code: `${template.prefix}-${String(index + 1).padStart(3, '0')}`,
            nodeType: '网关子设备',
            deviceCount: 0,
            remark: `挂载在边缘网关下的${template.category}子设备，通过网关代理接入平台。`,
            vendor: '紫峰装备',
            protocolId: 'modbus-tcp',
            protocolLabel: 'Modbus TCP',
            properties: thingModel.properties,
            functions: thingModel.functions,
            events: thingModel.events,
        };
    });
}

const PRODUCT_SEEDS: ProductSeed[] = buildProductSeeds();

export function createInitialProducts(): ProductRecord[] {
    const baseProducts = PRODUCT_SEEDS.map((seed, index) => ({
        id: String(index + 1),
        code: seed.code,
        name: seed.name,
        categoryId: seed.categoryId,
        category: seed.category,
        nodeType: seed.nodeType,
        vendor: seed.vendor ?? '紫峰装备',
        remark: seed.remark ?? '—',
        protocolId: seed.protocolId ?? 'mqtt',
        protocolLabel: seed.protocolLabel ?? 'MQTT',
        deviceCount: seed.deviceCount,
        properties: cloneModelRows(seed.properties ?? DEFAULT_PROPERTY_ROWS),
        functions: cloneModelRows(seed.functions ?? DEFAULT_FUNCTION_ROWS).map((row) => normalizeFunctionRow(row)),
        events: cloneModelRows(seed.events ?? DEFAULT_EVENT_ROWS),
    }));

    const subDeviceOffset = baseProducts.length;
    const subDeviceProducts = buildGatewaySubDeviceSeeds().map((seed, index) => ({
        id: String(subDeviceOffset + index + 1),
        code: seed.code,
        name: seed.name,
        categoryId: seed.categoryId,
        category: seed.category,
        nodeType: seed.nodeType ?? '网关子设备',
        vendor: seed.vendor ?? '紫峰装备',
        remark: seed.remark ?? '—',
        protocolId: seed.protocolId ?? 'modbus-tcp',
        protocolLabel: seed.protocolLabel ?? 'Modbus TCP',
        deviceCount: seed.deviceCount ?? 0,
        properties: cloneModelRows(seed.properties ?? DEFAULT_PROPERTY_ROWS),
        functions: cloneModelRows(seed.functions ?? DEFAULT_FUNCTION_ROWS).map((row) => normalizeFunctionRow(row)),
        events: cloneModelRows(seed.events ?? DEFAULT_EVENT_ROWS),
    }));

    return [...baseProducts, ...subDeviceProducts];
}

export function createEmptyProductForm() {
    return {
        name: '',
        nodeType: '',
        categoryId: '',
        vendor: '',
        remark: '',
        protocolId: '',
        protocolLabel: '',
    };
}

export function productToForm(product: ProductRecord) {
    return {
        name: product.name,
        nodeType: product.nodeType,
        categoryId: product.categoryId,
        vendor: product.vendor,
        remark: product.remark === '—' ? '' : product.remark,
        protocolId: product.protocolId,
        protocolLabel: product.protocolLabel,
    };
}

export function buildProductModelState(product: ProductRecord) {
    return {
        form: productToForm(product),
        properties: product.properties.map((row) => ({ ...row })),
        functions: product.functions.map((row) => normalizeFunctionRow({
            ...row,
            inputJson: row.inputJson ?? '{}',
        })),
        events: product.events.map((row) => ({ ...row })),
    };
}

export function getProductDisplayRemark(product: ProductRecord): string {
    if (!product.remark || product.remark === '—') {
        return '暂无备注';
    }
    return product.remark;
}

export function truncateProductRemark(text: string, max = 20): string {
    const remark = String(text ?? '');
    if (remark.length <= max) {
        return remark;
    }
    return `${remark.slice(0, max)}...`;
}

export function categoryIdToLabel(categoryId: string): string {
    return getProductCategoryLabel(categoryId);
}
