import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CirclePlus } from 'lucide-react';
import TreeToggleIcon from '../components/TreeToggleIcon';
import AppShell from '../components/AppShell';
import Breadcrumb from '../components/Breadcrumb';
import MessageCenterSidebar, { type MessageCenterPageId } from '../components/MessageCenterSidebar';
import IotToast, { type IotToastData, type IotToastType, triggerIotToast } from '../components/IotToast';
import {
    MESSAGE_TEMPLATE_TREE,
    buildVariablePlaceholder,
    findTemplateIdByTreeNode,
    type MessageTemplateId,
    type MessageTemplateRecord,
    type MessageTemplateTreeNode,
} from '../data/messageTemplates';
import '../device-access.css';
import '../product-management.css';
import '../message-template.css';

type MessageTemplatePageProps = {
    templates: MessageTemplateRecord[];
    onUpdateTemplates: React.Dispatch<React.SetStateAction<MessageTemplateRecord[]>>;
    onNavigateHome: () => void;
    onNavigateDeviceAccess: () => void;
    onNavigate: (pageId: MessageCenterPageId) => void;
};

function TemplateTreeNodes({
    nodes,
    depth,
    expanded,
    activeNodeId,
    onToggle,
    onSelect,
}: {
    nodes: MessageTemplateTreeNode[];
    depth: number;
    expanded: Record<string, boolean>;
    activeNodeId: string;
    onToggle: (id: string) => void;
    onSelect: (node: MessageTemplateTreeNode) => void;
}) {
    return (
        <ul className={`mt-tree ${depth > 0 ? 'mt-tree--nested' : ''}`}>
            {nodes.map((node) => {
                const hasChildren = Boolean(node.children?.length);
                const isExpanded = expanded[node.id] ?? true;
                const isActive = activeNodeId === node.id;

                return (
                    <li key={node.id} className="mt-tree-node">
                        <div
                            className={`mt-tree-row ${isActive ? 'is-active' : ''}`}
                            style={{ paddingLeft: `${8 + depth * 18}px` }}
                        >
                            {hasChildren ? (
                                <button
                                    type="button"
                                    className="mt-tree-toggle"
                                    aria-label={isExpanded ? '收起' : '展开'}
                                    onClick={() => onToggle(node.id)}
                                >
                                    <TreeToggleIcon expanded={isExpanded} />
                                </button>
                            ) : (
                                <span className="mt-tree-spacer" />
                            )}
                            <button
                                type="button"
                                className="mt-tree-label"
                                onClick={() => onSelect(node)}
                            >
                                {node.label}
                            </button>
                        </div>
                        {hasChildren && isExpanded && (
                            <TemplateTreeNodes
                                nodes={node.children ?? []}
                                depth={depth + 1}
                                expanded={expanded}
                                activeNodeId={activeNodeId}
                                onToggle={onToggle}
                                onSelect={onSelect}
                            />
                        )}
                    </li>
                );
            })}
        </ul>
    );
}

export default function MessageTemplatePage({
    templates,
    onUpdateTemplates,
    onNavigateHome,
    onNavigateDeviceAccess,
    onNavigate,
}: MessageTemplatePageProps) {
    const [activeNodeId, setActiveNodeId] = useState('device-alarm');
    const [expanded, setExpanded] = useState<Record<string, boolean>>({
        'alarm-group': true,
        'subscribe-group': true,
    });
    const [draftContent, setDraftContent] = useState('');
    const [toast, setToast] = useState<IotToastData | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const activeTemplateId = useMemo(
        () => findTemplateIdByTreeNode(activeNodeId),
        [activeNodeId],
    );

    const activeTemplate = useMemo(
        () => templates.find((item) => item.id === activeTemplateId) ?? null,
        [templates, activeTemplateId],
    );

    useEffect(() => {
        setDraftContent(activeTemplate?.content ?? '');
    }, [activeTemplateId, activeTemplate?.content]);

    const showToast = (message: string, type: IotToastType = 'warning') => {
        triggerIotToast(setToast, message, type);
    };

    const handleSelectNode = (node: MessageTemplateTreeNode) => {
        setActiveNodeId(node.id);
    };

    const handleToggle = (id: string) => {
        setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const insertVariable = (key: string) => {
        const textarea = textareaRef.current;
        const placeholder = buildVariablePlaceholder(key);
        if (!textarea) {
            setDraftContent((prev) => prev + placeholder);
            return;
        }

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const nextValue = `${draftContent.slice(0, start)}${placeholder}${draftContent.slice(end)}`;
        if (activeTemplate && nextValue.length > activeTemplate.maxLength) {
            showToast(`推送内容不能超过 ${activeTemplate.maxLength} 字`);
            return;
        }

        setDraftContent(nextValue);
        requestAnimationFrame(() => {
            const cursor = start + placeholder.length;
            textarea.focus();
            textarea.setSelectionRange(cursor, cursor);
        });
    };

    const handleSave = () => {
        if (!activeTemplateId || !activeTemplate) {
            showToast('请选择需要配置的消息模版');
            return;
        }

        const content = draftContent.trim();
        if (!content) {
            showToast('请输入推送内容');
            return;
        }

        if (content.length > activeTemplate.maxLength) {
            showToast(`推送内容不能超过 ${activeTemplate.maxLength} 字`);
            return;
        }

        onUpdateTemplates((prev) => prev.map((item) => (
            item.id === activeTemplateId ? { ...item, content } : item
        )));
        showToast('消息模版保存成功', 'success');
    };

    const sidebar = <MessageCenterSidebar pageId="msg-template" onNavigate={onNavigate} />;

    return (
        <AppShell
            activeTopTab="消息中心"
            sidebar={sidebar}
            onTopTabChange={(tab) => {
                if (tab === '设备接入') onNavigateDeviceAccess();
            }}
        >
            <div className="mt-page">
                <Breadcrumb items={[
                                    { label: '消息中心', pageId: 'msg-subscribe' },
                                    { label: '消息模版' },
                                ]} onNavigate={(id) => onNavigate(id as MessageCenterPageId)} />

                <section className="panel mt-list-panel">
                    <div className="mt-layout">
                        <h3 className="mt-left-col__title">模版列表</h3>

                        <aside className="mt-tree-panel">
                            <TemplateTreeNodes
                                nodes={MESSAGE_TEMPLATE_TREE}
                                depth={0}
                                expanded={expanded}
                                activeNodeId={activeNodeId}
                                onToggle={handleToggle}
                                onSelect={handleSelectNode}
                            />
                        </aside>

                        {!activeTemplate ? (
                            <div className="mt-editor-empty">请在左侧选择具体消息类型进行配置</div>
                        ) : (
                            <>
                                <div className="mt-editor-main">
                                    <span className="mt-field__label mt-field__label-required mt-push-label">推送内容：</span>
                                    <div className="mt-textarea-wrap">
                                        <textarea
                                            ref={textareaRef}
                                            className="mt-textarea"
                                            value={draftContent}
                                            maxLength={activeTemplate.maxLength}
                                            onChange={(event) => setDraftContent(event.target.value)}
                                            placeholder="请输入推送内容，可使用变量占位符"
                                        />
                                        <span className={`mt-char-count ${draftContent.length >= activeTemplate.maxLength ? 'is-over' : ''}`}>
                                            {draftContent.length}/{activeTemplate.maxLength}
                                        </span>
                                    </div>

                                    <div className="mt-var-section">
                                        <span className="mt-var-section__label">变量列表：</span>
                                        <div className="mt-var-table-wrap">
                                            <table className="mt-var-table">
                                                <thead>
                                                    <tr>
                                                        <th style={{ width: '56px' }}>序号</th>
                                                        <th style={{ width: '22%' }}>变量</th>
                                                        <th style={{ width: '22%' }}>名称</th>
                                                        <th style={{ width: '18%' }}>字段类型</th>
                                                        <th style={{ width: '56px' }}>添加</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {activeTemplate.variables.map((variable, index) => (
                                                        <tr key={variable.id}>
                                                            <td>{index + 1}</td>
                                                            <td>{variable.key}</td>
                                                            <td>{variable.name}</td>
                                                            <td>{variable.fieldType}</td>
                                                            <td>
                                                                <button
                                                                    type="button"
                                                                    className="mt-var-add-btn"
                                                                    aria-label={`添加变量 ${variable.key}`}
                                                                    onClick={() => insertVariable(variable.key)}
                                                                >
                                                                    <CirclePlus size={16} strokeWidth={1.75} />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-save-bar">
                                    <button type="button" className="pm-btn pm-btn-primary" onClick={handleSave}>
                                        保存
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </section>
            </div>

            <IotToast toast={toast} />
        </AppShell>
    );
}
