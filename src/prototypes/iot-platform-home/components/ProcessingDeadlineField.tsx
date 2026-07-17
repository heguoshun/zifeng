import React from 'react';
import ElSelect from './ElSelect';
import ClearableInput from './ClearableInput';
import type { ProcessingDeadlineValue } from '../data/alarmLevels';

const DEADLINE_UNIT_OPTIONS = [
    { label: '小时', value: 'hour' },
    { label: '天', value: 'day' },
] as const;

type ProcessingDeadlineFieldProps = ProcessingDeadlineValue & {
    onChange: (value: ProcessingDeadlineValue) => void;
};

export default function ProcessingDeadlineField({
    processingDeadline,
    processingDeadlineUnit = 'hour',
    onChange,
}: ProcessingDeadlineFieldProps) {
    return (
        <div className="pcp-drawer-field">
            <span className="pcp-form-label">处理期限：</span>
            <div className="dai-deadline-row">
                <ClearableInput
                    type="number"
                    className="pcp-form-input dai-deadline-row__value"
                    placeholder="请输入数值"
                    min="0"
                    step="1"
                    value={processingDeadline ?? ''}
                    onChange={(event) => {
                        const value = event.target.value === '' ? undefined : Number(event.target.value);
                        onChange({ processingDeadline: value, processingDeadlineUnit });
                    }}
                />
                <ElSelect
                    className="el-select--medium dai-deadline-row__unit"
                    size="medium"
                    value={processingDeadlineUnit}
                    options={[...DEADLINE_UNIT_OPTIONS]}
                    onChange={(value) => onChange({
                        processingDeadline,
                        processingDeadlineUnit: value as 'hour' | 'day',
                    })}
                />
            </div>
        </div>
    );
}
