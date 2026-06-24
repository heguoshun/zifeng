/* ── Property Log (属性日志) ── */

export type PropertyLogRecord = {
    id: string;
    type: string;
    time: string;
    content: string;
    identifier: string;
    detail: string;
};

/* ── Function Log (功能日志) ── */

export type FunctionLogRecord = {
    id: string;
    functionIdentifier: string;
    functionName: string;
    sendTime: string;
    params: string;
    reply: string;
    detail: string;
};

/* ── Event Log (事件日志) ── */

export type EventLogRecord = {
    id: string;
    type: string;
    time: string;
    content: string;
    identifier: string;
    logType: string;
    detail: string;
};

/* ── Filter options ── */

export const EVENT_LOG_TYPE_OPTIONS = [
    '全部',
    '告警',
    '信息',
    '故障',
] as const;

/* ── Mock data generators ── */

const PROPERTY_TYPES = ['电量', '电压', '电流', '功率', '温度', '湿度', '水压', '流量', '功率因数', '频率'] as const;

const PROPERTY_CONTENTS: Record<string, string[]> = {
    '电量': ['8561.38', '8562.10', '8563.55', '8564.22', '8565.88', '8570.12', '8575.66', '8580.44'],
    '电压': ['220.3V', '221.1V', '219.8V', '220.5V', '218.9V', '222.0V', '220.0V', '219.5V'],
    '电流': ['5.2A', '5.5A', '4.8A', '5.0A', '5.3A', '4.9A', '5.1A', '5.4A'],
    '功率': ['1145W', '1210W', '1056W', '1100W', '1166W', '1078W', '1122W', '1188W'],
    '温度': ['36.5°C', '37.2°C', '35.8°C', '36.0°C', '38.1°C', '35.5°C', '36.8°C', '37.0°C'],
    '湿度': ['65.2%', '67.8%', '63.5%', '64.0%', '68.3%', '62.1%', '66.0%', '64.5%'],
    '水压': ['0.35MPa', '0.36MPa', '0.34MPa', '0.35MPa', '0.37MPa', '0.33MPa', '0.35MPa', '0.36MPa'],
    '流量': ['12.5m³/h', '13.1m³/h', '11.8m³/h', '12.0m³/h', '12.8m³/h', '11.5m³/h', '12.3m³/h', '13.0m³/h'],
    '功率因数': ['0.95', '0.96', '0.94', '0.95', '0.97', '0.93', '0.95', '0.96'],
    '频率': ['50.01Hz', '50.00Hz', '49.99Hz', '50.02Hz', '49.98Hz', '50.01Hz', '50.00Hz', '49.99Hz'],
};

const FUNCTION_IDENTIFIERS = ['off', 'restart', 'setParam', 'upgrade', 'resetAlarm', 'setThreshold', 'reboot'] as const;
const FUNCTION_NAMES: Record<string, string> = {
    'off': '远程关机',
    'restart': '远程重启',
    'setParam': '参数设置',
    'upgrade': '远程升级',
    'resetAlarm': '告警复位',
    'setThreshold': '阈值设置',
    'reboot': '系统重启',
};

const FUNCTION_PARAMS: Record<string, string[]> = {
    'off': ['0', '1'],
    'restart': ['0', '{"delay":5}'],
    'setParam': ['{"interval":60}', '{"interval":120}', '{"mode":"auto"}'],
    'upgrade': ['{"version":"2.1.0"}', '{"version":"2.2.0"}'],
    'resetAlarm': ['0', '{"all":true}'],
    'setThreshold': ['{"max":100,"min":0}', '{"max":250,"min":180}'],
    'reboot': ['0', '{"force":true}'],
};

const EVENT_TYPES = ['告警', '信息', '故障'] as const;
const EVENT_CONTENTS: Record<string, string[]> = {
    '告警': ['设备离线', '电压过高', '电流过载', '温度异常', '通信超时', '信号弱'],
    '信息': ['设备上线', '参数更新成功', '固件升级完成', '定时任务执行', '数据同步完成'],
    '故障': ['传感器故障', '通信模块异常', '存储满了', '电池电量低', '看门狗复位'],
};

const EVENT_IDENTIFIERS = ['offline', 'overVoltage', 'overCurrent', 'tempAlert', 'timeout', 'online', 'paramUpdate', 'upgradeDone', 'sensorFault', 'commError'] as const;

function randomDate(baseYear: number, baseMonth: number, count: number): string[] {
    const dates: string[] = [];
    for (let i = 0; i < count; i++) {
        const day = Math.floor(Math.random() * 28) + 1;
        const hour = Math.floor(Math.random() * 24);
        const minute = Math.floor(Math.random() * 60);
        const second = Math.floor(Math.random() * 60);
        const month = baseMonth + Math.floor(Math.random() * 3);
        const year = baseYear + Math.floor((month - 1) / 12);
        const normalizedMonth = ((month - 1) % 12) + 1;
        dates.push(
            `${year}-${String(normalizedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')} ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`,
        );
    }
    return dates.sort();
}

function pickRandom<T>(arr: readonly T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

export function createInitialPropertyLogs(count = 20): PropertyLogRecord[] {
    const dates = randomDate(2026, 1, count);
    return dates.map((time, index) => {
        const type = pickRandom(PROPERTY_TYPES);
        const contents = PROPERTY_CONTENTS[type] ?? ['--'];
        const content = pickRandom(contents);
        const identifier = type === '电量' ? 'power_read' : type === '电压' ? 'voltage' : type === '电流' ? 'current' : type === '功率' ? 'power' : type === '温度' ? 'temperature' : type === '湿度' ? 'humidity' : type === '水压' ? 'water_pressure' : type === '流量' ? 'flow_rate' : type === '功率因数' ? 'power_factor' : 'frequency';
        return {
            id: `PL${String(index + 1).padStart(6, '0')}`,
            type,
            time,
            content,
            identifier,
            detail: JSON.stringify({ identifier, type, value: content, unit: content.replace(/[\d.]/g, ''), timestamp: time, deviceId: 'DB_E_1501' }, null, 2),
        };
    });
}

export function createInitialFunctionLogs(count = 15): FunctionLogRecord[] {
    const dates = randomDate(2026, 1, count);
    return dates.map((time, index) => {
        const identifier = pickRandom(FUNCTION_IDENTIFIERS);
        const functionName = FUNCTION_NAMES[identifier] ?? identifier;
        const params = pickRandom(FUNCTION_PARAMS[identifier] ?? ['0']);
        const replyCode = Math.random() > 0.15 ? 1 : 0;
        return {
            id: `FL${String(index + 1).padStart(6, '0')}`,
            functionIdentifier: identifier,
            functionName,
            sendTime: time,
            params,
            reply: String(replyCode),
            detail: JSON.stringify({ identifier, functionName, sendTime: time, params, reply: replyCode, messageId: `msg_${Date.now()}_${index}`, deviceId: 'DB_E_1501' }, null, 2),
        };
    });
}

export function createInitialEventLogs(count = 18): EventLogRecord[] {
    const dates = randomDate(2026, 1, count);
    return dates.map((time, index) => {
        const type = pickRandom(EVENT_TYPES);
        const contents = EVENT_CONTENTS[type] ?? ['未知事件'];
        const content = pickRandom(contents);
        const identifier = pickRandom(EVENT_IDENTIFIERS);
        return {
            id: `EL${String(index + 1).padStart(6, '0')}`,
            type,
            time,
            content,
            identifier,
            logType: type,
            detail: JSON.stringify({ identifier, type, content, logType: type, timestamp: time, level: type === '故障' ? 'critical' : type === '告警' ? 'warning' : 'info', deviceId: 'DB_E_1501' }, null, 2),
        };
    });
}
