import React, { useState } from 'react';
import type { AlarmLevelRecord } from '../data/alarmLevels';
import {
    createDefaultLevelSqlConfig,
    type AlarmRuleSqlSettings,
} from '../data/alarmRules';
import AlarmRuleSqlDebugDialog from './AlarmRuleSqlDebugDialog';
import SqlCodeEditor from './SqlCodeEditor';

type AlarmRuleSqlSectionProps = {
    value: AlarmRuleSqlSettings;
    alarmLevels: AlarmLevelRecord[];
    onChange: (value: AlarmRuleSqlSettings) => void;
};

export default function AlarmRuleSqlSection({
    value,
    alarmLevels,
    onChange,
}: AlarmRuleSqlSectionProps) {
    const [debugOpen, setDebugOpen] = useState(false);
    const activeConfig = value.levels[value.activeLevelId] ?? createDefaultLevelSqlConfig();

    const setActiveLevelId = (levelId: string) => {
        onChange({ ...value, activeLevelId: levelId });
    };

    const updateSql = (sql: string) => {
        onChange({
            ...value,
            levels: {
                ...value.levels,
                [value.activeLevelId]: { sql },
            },
        });
    };

    if (!alarmLevels.length) {
        return (
            <section className="arc-sql-section">
                <h4 className="arc-form-section-title">SQL语句</h4>
                <p className="arc-condition-empty-tip">请先在告警等级管理中配置告警等级</p>
            </section>
        );
    }

    return (
        <>
            <section className="arc-sql-section">
                <h4 className="arc-form-section-title">SQL语句</h4>
                <div className="arc-sql-panel">
                    <div className="arc-sql-panel__head">
                        <div className="arc-level-tabs arc-sql-level-tabs" role="tablist" aria-label="告警级别">
                            {alarmLevels.map((level) => (
                                <button
                                    key={level.id}
                                    type="button"
                                    role="tab"
                                    aria-selected={value.activeLevelId === level.id}
                                    className={`arc-level-tab ${value.activeLevelId === level.id ? 'is-active' : ''}`}
                                    onClick={() => setActiveLevelId(level.id)}
                                >
                                    {level.name}
                                </button>
                            ))}
                        </div>
                        <button
                            type="button"
                            className="arc-sql-debug-link"
                            onClick={() => setDebugOpen(true)}
                        >
                            调试
                        </button>
                    </div>
                    <SqlCodeEditor
                        value={activeConfig.sql}
                        onChange={updateSql}
                    />
                </div>
            </section>

            <AlarmRuleSqlDebugDialog
                open={debugOpen}
                onClose={() => setDebugOpen(false)}
            />
        </>
    );
}
