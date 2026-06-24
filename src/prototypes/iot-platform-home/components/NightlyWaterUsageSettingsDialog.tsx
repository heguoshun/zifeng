import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import ElSelect from './ElSelect';
import {
    DEFAULT_NIGHTLY_FIELDS,
    DEFAULT_NIGHTLY_PERIOD,
    NIGHTLY_FIELD_OPTIONS,
    NIGHTLY_HOUR_OPTIONS,
    type NightlyFieldKey,
    type NightlyPeriod,
    type NightlyWaterUsageConfig,
    validateNightlyWaterUsageConfig,
} from '../data/nightlyWaterUsageConfig';
import '../product-create.css';
import '../water-usage-analysis.css';

type NightlyWaterUsageSettingsDialogProps = {
    open: boolean;
    config: NightlyWaterUsageConfig;
    onClose: () => void;
    onConfirm: (config: NightlyWaterUsageConfig) => void;
};

export default function NightlyWaterUsageSettingsDialog({
    open,
    config,
    onClose,
    onConfirm,
}: NightlyWaterUsageSettingsDialogProps) {
    const [draftPeriod, setDraftPeriod] = useState<NightlyPeriod>(config.period);
    const [draftFields, setDraftFields] = useState<NightlyFieldKey[]>(config.fields);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!open) return undefined;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [open]);

    useEffect(() => {
        if (!open) return;
        setDraftPeriod(config.period);
        setDraftFields(config.fields);
        setError(null);
    }, [open, config]);

    if (!open) return null;

    const toggleField = (field: NightlyFieldKey) => {
        setDraftFields((prev) => (
            prev.includes(field)
                ? prev.filter((item) => item !== field)
                : [...prev, field]
        ));
        setError(null);
    };

    const handleConfirm = () => {
        const nextConfig = { period: draftPeriod, fields: draftFields };
        const validationError = validateNightlyWaterUsageConfig(nextConfig);
        if (validationError) {
            setError(validationError);
            return;
        }
        onConfirm(nextConfig);
    };

    const handleReset = () => {
        setDraftPeriod({ ...DEFAULT_NIGHTLY_PERIOD });
        setDraftFields([...DEFAULT_NIGHTLY_FIELDS]);
        setError(null);
    };

    const handleMaskMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
        if (event.target === event.currentTarget) {
            onClose();
        }
    };

    return createPortal(
        <div
            className="pcp-drawer-mask wua-nightly-dialog-mask"
            role="presentation"
            onMouseDown={handleMaskMouseDown}
        >
            <aside
                className="pcp-drawer pcp-drawer--form wua-nightly-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="wua-nightly-dialog-title"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <div className="pcp-drawer__head">
                    <div>
                        <h3 id="wua-nightly-dialog-title">夜间用水统一配置</h3>
                        <p className="wua-nightly-dialog__subtitle">适用于大表中心全部设备的夜间用水统计与展示</p>
                    </div>
                    <button type="button" className="pcp-drawer__close" onClick={onClose} aria-label="关闭">×</button>
                </div>
                <div className="pcp-drawer__body pcp-drawer__body--form">
                    <div className="wua-nightly-settings wua-nightly-settings--dialog" aria-label="夜间用水监测设置">
                        <div className="wua-nightly-settings__group wua-nightly-settings__group--period">
                            <div className="wua-nightly-settings__heading">
                                <span className="wua-nightly-settings__label">夜间时段</span>
                                <small>用于统计夜间用水和峰谷值</small>
                            </div>
                            <div className="wua-nightly-settings__period">
                                <ElSelect
                                    className="el-select--medium"
                                    size="medium"
                                    value={draftPeriod.start}
                                    options={NIGHTLY_HOUR_OPTIONS}
                                    onChange={(value) => {
                                        setDraftPeriod((prev) => ({ ...prev, start: value }));
                                        setError(null);
                                    }}
                                />
                                <span>至</span>
                                <ElSelect
                                    className="el-select--medium"
                                    size="medium"
                                    value={draftPeriod.end}
                                    options={NIGHTLY_HOUR_OPTIONS}
                                    onChange={(value) => {
                                        setDraftPeriod((prev) => ({ ...prev, end: value }));
                                        setError(null);
                                    }}
                                />
                            </div>
                        </div>
                        <div className="wua-nightly-settings__group wua-nightly-settings__group--fields">
                            <div className="wua-nightly-settings__heading">
                                <span className="wua-nightly-settings__label">监测字段</span>
                                <small>控制趋势图图例和明细列</small>
                            </div>
                            <div className="wua-nightly-settings__fields">
                                {NIGHTLY_FIELD_OPTIONS.map((field) => (
                                    <label
                                        key={field.key}
                                        className={`wua-nightly-settings__field${draftFields.includes(field.key) ? ' is-checked' : ''}`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={draftFields.includes(field.key)}
                                            onChange={() => toggleField(field.key)}
                                        />
                                        <span>{field.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                    {error ? <p className="wua-nightly-dialog__error">{error}</p> : null}
                </div>
                <div className="pcp-drawer__foot">
                    <button type="button" className="pm-btn pm-btn-ghost" onClick={handleReset}>恢复默认</button>
                    <button type="button" className="pm-btn pm-btn-ghost" onClick={onClose}>取消</button>
                    <button type="button" className="pm-btn pm-btn-primary" onClick={handleConfirm}>保存配置</button>
                </div>
            </aside>
        </div>,
        document.body,
    );
}
