export type AlarmLevelRecord = {
    id: string;
    name: string;
    color: string;
    description: string;
    processingDeadline?: number;
    processingDeadlineUnit?: 'hour' | 'day';
};

export const DEFAULT_ALARM_LEVEL_COLORS = [
    '#f66d5c',
    '#f6a54b',
    '#f7d149',
    '#4f82eb',
    '#67c23a',
    '#909399',
] as const;

const INITIAL_ALARM_LEVELS: AlarmLevelRecord[] = [
    {
        id: 'level-urgent',
        name: '紧急',
        color: '#f66d5c',
        description: '已经影响业务，需要立即采取纠正措施',
        processingDeadline: 4,
        processingDeadlineUnit: 'hour',
    },
    {
        id: 'level-important',
        name: '重要',
        color: '#f6a54b',
        description: '已经影响业务，如果不及时处理，将发生严重故障',
        processingDeadline: 12,
        processingDeadlineUnit: 'hour',
    },
    {
        id: 'level-minor',
        name: '次要',
        color: '#f7d149',
        description: '目前对业务影响轻微，需要采取纠正措施，防止发生更严重的故障',
        processingDeadline: 24,
        processingDeadlineUnit: 'hour',
    },
    {
        id: 'level-info',
        name: '提示',
        color: '#4f82eb',
        description: '检测到潜在的或即将发生的影响业务的故障，但目前对业务还没有影响',
        processingDeadline: 48,
        processingDeadlineUnit: 'hour',
    },
];

export function createInitialAlarmLevels(): AlarmLevelRecord[] {
    return INITIAL_ALARM_LEVELS.map((item) => ({ ...item }));
}

export function generateAlarmLevelId(): string {
    return `level-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export type ProcessingDeadlineValue = {
    processingDeadline?: number;
    processingDeadlineUnit?: 'hour' | 'day';
};

export function resolveProcessingDeadlineByLevelName(
    levelName: string,
    levels: AlarmLevelRecord[] = createInitialAlarmLevels(),
): ProcessingDeadlineValue {
    const level = levels.find((item) => item.name === levelName);
    if (!level) {
        return { processingDeadline: undefined, processingDeadlineUnit: 'hour' };
    }
    return {
        processingDeadline: level.processingDeadline,
        processingDeadlineUnit: level.processingDeadlineUnit ?? 'hour',
    };
}

export function formatProcessingDeadline(
    deadline?: number,
    unit?: 'hour' | 'day',
): string {
    if (deadline === undefined) return '—';
    return `${deadline}${unit === 'day' ? '天' : '小时'}`;
}
