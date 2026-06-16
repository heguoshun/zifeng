export type Metric = {
    label: string;
    value: string;
    tone: 'blue' | 'cyan' | 'purple' | 'indigo' | 'rose' | 'navy';
};

export type LegendItem = {
    label: string;
    value: number;
    color: string;
};

export type BarData = {
    label: string;
    value: number;
};

export type DateRange = { start: number; end: number };
