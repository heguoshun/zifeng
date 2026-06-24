import React, { useMemo, useState } from 'react';
import { Edit3, RefreshCw } from 'lucide-react';
import type { DeviceRecord } from '../data/devices';
import {
    formatShadowJson,
    getDeviceShadow,
    refreshDeviceShadow,
    updateDeviceShadowFullDesired,
    type DeviceShadowData,
} from '../data/deviceShadow';
import type { IotToastType } from './IotToast';

type DeviceShadowPanelProps = {
    device: DeviceRecord | null;
    productId: string;
    deviceKey: string;
    readonly: boolean;
    onShowToast: (message: string, type?: IotToastType) => void;
};

/* ── JSON 语法高亮 ── */

const JSON_KEY_RE = /("(?:[^"\\]|\\.)*")\s*:/g;
const JSON_STRING_RE = /:\s*("(?:[^"\\]|\\.)*")/g;
const JSON_NUMBER_RE = /:\s*(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g;

function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function highlightJson(json: string): React.ReactNode[] {
    let escaped = json
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    const keyPlaceholder = '\x00KEY\x00';
    const stringPlaceholder = '\x00STR\x00';
    const numberPlaceholder = '\x00NUM\x00';

    const keyMatches: string[] = [];
    let keyIdx = 0;
    escaped = escaped.replace(JSON_KEY_RE, (match) => {
        keyMatches.push(match);
        return `${keyPlaceholder}${keyIdx++}${keyPlaceholder}`;
    });

    const stringMatches: string[] = [];
    let strIdx = 0;
    escaped = escaped.replace(JSON_STRING_RE, (match) => {
        stringMatches.push(match);
        return `: ${stringPlaceholder}${strIdx++}${stringPlaceholder}`;
    });

    const numberMatches: string[] = [];
    let numIdx = 0;
    escaped = escaped.replace(JSON_NUMBER_RE, (match) => {
        numberMatches.push(match);
        return `: ${numberPlaceholder}${numIdx++}${numberPlaceholder}`;
    });

    const result: React.ReactNode[] = [];
    const tokenRe = new RegExp(
        `(${escapeRegex(keyPlaceholder)}\\d+${escapeRegex(keyPlaceholder)})|(${escapeRegex(stringPlaceholder)}\\d+${escapeRegex(stringPlaceholder)})|(${escapeRegex(numberPlaceholder)}\\d+${escapeRegex(numberPlaceholder)})`,
        'g',
    );

    let lastIdx = 0;
    let match: RegExpExecArray | null;
    tokenRe.lastIndex = 0;

    while ((match = tokenRe.exec(escaped)) !== null) {
        if (match.index > lastIdx) {
            result.push(escaped.slice(lastIdx, match.index));
        }

        const token = match[0];
        if (match[1]) {
            const ki = Number(token.replace(new RegExp(escapeRegex(keyPlaceholder), 'g'), ''));
            result.push(
                <span key={`k-${match.index}`} className="dcs-json-key">
                    {keyMatches[ki]}
                </span>,
            );
        } else if (match[2]) {
            const si = Number(token.replace(new RegExp(escapeRegex(stringPlaceholder), 'g'), ''));
            result.push(
                <span key={`s-${match.index}`} className="dcs-json-string">
                    {`: ${stringMatches[si].slice(2)}`}
                </span>,
            );
        } else if (match[3]) {
            const ni = Number(token.replace(new RegExp(escapeRegex(numberPlaceholder), 'g'), ''));
            result.push(
                <span key={`n-${match.index}`} className="dcs-json-number">
                    {numberMatches[ni]}
                </span>,
            );
        }

        lastIdx = tokenRe.lastIndex;
    }

    if (lastIdx < escaped.length) {
        result.push(escaped.slice(lastIdx));
    }

    return result;
}

/* ── 行号 + JSON 渲染组件 ── */

function JsonWithLineNumbers({ json }: { json: string }) {
    const lines = json.split('\n');

    return (
        <div className="dcs-edit-compare__code">
            <div className="dcs-edit-compare__lines">
                {lines.map((_, i) => (
                    <span key={i}>{i + 1}</span>
                ))}
            </div>
            <pre className="dcs-edit-compare__json">
                <code>{highlightJson(json)}</code>
            </pre>
        </div>
    );
}

/* ── 主组件 ── */

export default function DeviceShadowPanel({
    device,
    productId,
    deviceKey,
    readonly,
    onShowToast,
}: DeviceShadowPanelProps) {
    const deviceName = device?.name ?? '';
    const effectiveDeviceKey = deviceKey || productId || 'unknown';

    const [shadowData, setShadowData] = useState<DeviceShadowData>(() =>
        getDeviceShadow(effectiveDeviceKey, productId || '', deviceName),
    );
    const [refreshing, setRefreshing] = useState(false);
    const [updatedAt, setUpdatedAt] = useState(() =>
        formatDateTime(new Date()),
    );

    /* 编辑弹窗 */
    const [editOpen, setEditOpen] = useState(false);
    const [editDesiredText, setEditDesiredText] = useState('');
    const [editError, setEditError] = useState('');

    const shadowJson = useMemo(() => formatShadowJson(shadowData), [shadowData]);
    const highlightedJson = useMemo(() => highlightJson(shadowJson), [shadowJson]);

    /* 生成只展示 reported / desired 的对比 JSON */
    const reportedJson = useMemo(() => {
        return JSON.stringify(shadowData.properties.reported, null, 2);
    }, [shadowData]);

    const desiredJson = useMemo(() => {
        return JSON.stringify(shadowData.properties.desired, null, 2);
    }, [shadowData]);

    const handleRefresh = () => {
        setRefreshing(true);
        window.setTimeout(() => {
            const updated = refreshDeviceShadow(effectiveDeviceKey, productId || '', deviceName);
            setShadowData(updated);
            setRefreshing(false);
            setUpdatedAt(formatDateTime(new Date()));
            onShowToast('设备影子已刷新', 'success');
        }, 600);
    };

    const openEdit = () => {
        setEditDesiredText(JSON.stringify(shadowData.properties.desired, null, 2));
        setEditError('');
        setEditOpen(true);
    };

    const handleSaveDesired = () => {
        let parsed: Record<string, unknown>;
        try {
            parsed = JSON.parse(editDesiredText);
        } catch {
            setEditError('JSON 格式无效，请检查语法');
            return;
        }

        if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
            setEditError('desired 必须是一个 JSON 对象');
            return;
        }

        const desired: Record<string, number> = {};
        for (const [key, value] of Object.entries(parsed)) {
            if (typeof value !== 'number') {
                setEditError(`字段「${key}」的值必须是数字`);
                return;
            }
            desired[key] = value;
        }

        const updated = updateDeviceShadowFullDesired(
            effectiveDeviceKey,
            productId || '',
            deviceName,
            desired,
        );
        setShadowData(updated);
        setEditOpen(false);
        setUpdatedAt(formatDateTime(new Date()));
        onShowToast('设备影子已更新', 'success');
    };

    return (
        <section className="panel dcs-panel dcp-shadow-panel">
            {/* 工具栏 */}
            <div className="dcp-shadow-toolbar">
                <span className="dcp-shadow-updated">
                    更新时间：{updatedAt}
                </span>
                <div className="dcp-shadow-actions">
                    <button
                        type="button"
                        className={`pm-btn pm-btn-ghost dcp-shadow-btn ${refreshing ? 'is-refreshing' : ''}`.trim()}
                        disabled={refreshing}
                        onClick={handleRefresh}
                    >
                        <RefreshCw size={14} />
                        刷新影子
                    </button>
                    {!readonly && (
                        <button
                            type="button"
                            className="pm-btn pm-btn-primary dcp-shadow-btn"
                            onClick={openEdit}
                        >
                            <Edit3 size={14} />
                            编辑影子
                        </button>
                    )}
                </div>
            </div>

            {/* 完整的 JSON 查看器 */}
            <div className="dcp-shadow-json-wrap">
                <pre className="dcp-shadow-json">
                    <code>{highlightedJson}</code>
                </pre>
            </div>

            {/* 编辑抽屉：左右对比 */}
            {editOpen && (
                <>
                    <div className="pcp-drawer-mask" onClick={() => setEditOpen(false)} />
                    <aside className="pcp-drawer pcp-drawer--form dcs-edit-drawer" style={{ position: 'fixed', zIndex: 120 }}>
                        <div className="pcp-drawer__head">
                            <h3>编辑影子</h3>
                            <button
                                type="button"
                                className="pcp-drawer__close"
                                onClick={() => setEditOpen(false)}
                            >
                                ×
                            </button>
                        </div>

                        <div className="pcp-drawer__body pcp-drawer__body--form dcs-edit-drawer__body">
                            <div className="dcs-edit-compare">
                                {/* 左：reported */}
                                <div className="dcs-edit-compare__col">
                                    <div className="dcs-edit-compare__label">reported:</div>
                                    <JsonWithLineNumbers json={reportedJson} />
                                </div>

                                {/* 右：desired（可编辑） */}
                                <div className="dcs-edit-compare__col">
                                    <div className="dcs-edit-compare__label">desired:</div>
                                    <div className="dcs-edit-compare__code">
                                        <div className="dcs-edit-compare__lines">
                                            {editDesiredText.split('\n').map((_, i) => (
                                                <span key={i}>{i + 1}</span>
                                            ))}
                                        </div>
                                        <textarea
                                            className="dcs-edit-compare__textarea"
                                            value={editDesiredText}
                                            onChange={(e) => {
                                                setEditDesiredText(e.target.value);
                                                setEditError('');
                                            }}
                                            spellCheck={false}
                                        />
                                    </div>
                                    {editError && (
                                        <p className="dcs-edit-compare__error">{editError}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="pcp-drawer__foot">
                            <button
                                type="button"
                                className="pm-btn pm-btn-ghost"
                                onClick={() => setEditOpen(false)}
                            >
                                取消
                            </button>
                            <button
                                type="button"
                                className="pm-btn pm-btn-primary"
                                onClick={handleSaveDesired}
                            >
                                确定
                            </button>
                        </div>
                    </aside>
                </>
            )}
        </section>
    );
}

function formatDateTime(date: Date): string {
    return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    });
}
