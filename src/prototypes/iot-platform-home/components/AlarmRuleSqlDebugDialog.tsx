import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
    ALARM_RULE_SQL_DEBUG_SAMPLE_INPUT,
    mockAlarmRuleSqlDebugOutput,
} from '../data/alarmRules';

type AlarmRuleSqlDebugDialogProps = {
    open: boolean;
    onClose: () => void;
};

export default function AlarmRuleSqlDebugDialog({
    open,
    onClose,
}: AlarmRuleSqlDebugDialogProps) {
    const [input, setInput] = useState(ALARM_RULE_SQL_DEBUG_SAMPLE_INPUT);
    const [output, setOutput] = useState('');

    useEffect(() => {
        if (!open) return;
        setInput(ALARM_RULE_SQL_DEBUG_SAMPLE_INPUT);
        setOutput('');
    }, [open]);

    if (!open) return null;

    const handleTest = () => {
        setOutput(mockAlarmRuleSqlDebugOutput(input));
    };

    const handleMaskMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
        if (event.target === event.currentTarget) {
            onClose();
        }
    };

    return createPortal(
        <div
            className="pcp-drawer-mask dcp-group-dialog-mask arc-sql-debug-mask"
            role="presentation"
            onMouseDown={handleMaskMouseDown}
        >
            <aside
                className="pcp-drawer pcp-drawer--form dcp-group-dialog arc-sql-debug-drawer"
                role="dialog"
                aria-modal="true"
                aria-labelledby="arc-sql-debug-title"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <div className="pcp-drawer__head">
                    <h3 id="arc-sql-debug-title">SQL调试</h3>
                    <button type="button" className="pcp-drawer__close" onClick={onClose} aria-label="关闭">×</button>
                </div>
                <div className="pcp-drawer__body arc-sql-debug-body">
                    <label className="pcp-drawer-field arc-sql-debug-field">
                        <span className="pcp-form-label"><em>*</em>消息输入：</span>
                        <textarea
                            className="pcp-form-textarea arc-sql-debug-textarea"
                            value={input}
                            spellCheck={false}
                            onChange={(event) => setInput(event.target.value)}
                        />
                    </label>
                    <label className="pcp-drawer-field arc-sql-debug-field">
                        <span className="pcp-form-label"><em>*</em>消息输出：</span>
                        <textarea
                            className="pcp-form-textarea arc-sql-debug-textarea is-readonly"
                            value={output}
                            readOnly
                            placeholder=""
                        />
                    </label>
                </div>
                <div className="pcp-drawer__foot">
                    <button type="button" className="pm-btn pm-btn-ghost" onClick={onClose}>取消</button>
                    <button type="button" className="pm-btn pm-btn-primary" onClick={handleTest}>测试</button>
                </div>
            </aside>
        </div>,
        document.body,
    );
}
