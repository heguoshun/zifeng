export type NightlyPeriod = {
    start: string;
    end: string;
};

export type NightlyFieldKey = 'usage' | 'ratio' | 'peak' | 'valley';

export type NightlyWaterUsageConfig = {
    period: NightlyPeriod;
    fields: NightlyFieldKey[];
};

export const DEFAULT_NIGHTLY_PERIOD: NightlyPeriod = { start: '22:00', end: '06:00' };

export const NIGHTLY_FIELD_OPTIONS: { key: NightlyFieldKey; label: string }[] = [
    { key: 'usage', label: '夜间用水' },
    { key: 'ratio', label: '占日比例' },
    { key: 'peak', label: '峰值流量' },
    { key: 'valley', label: '谷值流量' },
];

export const DEFAULT_NIGHTLY_FIELDS: NightlyFieldKey[] = ['usage', 'ratio', 'peak', 'valley'];

export const NIGHTLY_HOUR_OPTIONS = Array.from({ length: 24 }, (_, hour) => {
    const value = `${String(hour).padStart(2, '0')}:00`;
    return { label: value, value };
});

export function createInitialNightlyWaterUsageConfig(): NightlyWaterUsageConfig {
    return {
        period: { ...DEFAULT_NIGHTLY_PERIOD },
        fields: [...DEFAULT_NIGHTLY_FIELDS],
    };
}

export function formatNightlyPeriod(period: NightlyPeriod) {
    return `${period.start}-${period.end}`;
}

export function formatNightlyFieldLabels(fields: NightlyFieldKey[]) {
    return fields
        .map((key) => NIGHTLY_FIELD_OPTIONS.find((item) => item.key === key)?.label ?? key)
        .join('、');
}

export function validateNightlyWaterUsageConfig(config: NightlyWaterUsageConfig): string | null {
    if (!config.fields.length) {
        return '请至少选择一个监测字段';
    }
    if (config.period.start === config.period.end) {
        return '夜间时段起止时间不能相同';
    }
    return null;
}
