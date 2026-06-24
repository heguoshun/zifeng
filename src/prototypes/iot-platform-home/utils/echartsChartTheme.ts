import type { TooltipComponentOption } from 'echarts';

/** 平台统一 ECharts 轴类图表 tooltip（与设备数据页一致） */
export const IOT_AXIS_TOOLTIP: TooltipComponentOption = {
    trigger: 'axis',
    backgroundColor: '#fff',
    borderColor: '#e8edf3',
    borderWidth: 1,
    padding: [8, 12],
    textStyle: {
        color: '#1f2d3d',
        fontSize: 12,
    },
    extraCssText: 'box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2), 0 2px 8px rgba(0, 0, 0, 0.08);',
    axisPointer: {
        type: 'line',
        lineStyle: {
            color: '#c6d4e8',
            type: 'dashed',
            width: 1,
        },
    },
};
