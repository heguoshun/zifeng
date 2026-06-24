import React, { useEffect, useRef, useState } from 'react';
import {
    AlignCenter,
    AlignJustify,
    AlignLeft,
    AlignRight,
    Bold,
    Eraser,
    Image,
    IndentDecrease,
    IndentIncrease,
    Italic,
    Link,
    Link2Off,
    List,
    ListOrdered,
    Maximize2,
    Minimize2,
    Redo2,
    Table,
    Undo2,
    Video,
} from 'lucide-react';
import '../notice-announcement.css';

type RichTextEditorProps = {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
};

type ToolbarButton = {
    key: string;
    label: string;
    icon: React.ReactNode;
    command?: string;
    action?: () => void;
};

function stripHtml(html: string): string {
    return html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
}

export default function RichTextEditor({
    value,
    onChange,
    placeholder = '请输入内容',
}: RichTextEditorProps) {
    const editorRef = useRef<HTMLDivElement>(null);
    const [fullscreen, setFullscreen] = useState(false);
    const [charCount, setCharCount] = useState(0);

    useEffect(() => {
        const editor = editorRef.current;
        if (!editor) return;
        if (editor.innerHTML !== value) {
            editor.innerHTML = value || '';
        }
        setCharCount(stripHtml(editor.innerHTML).length);
    }, [value]);

    const exec = (command: string, commandValue?: string) => {
        editorRef.current?.focus();
        document.execCommand(command, false, commandValue);
        const html = editorRef.current?.innerHTML ?? '';
        onChange(html);
        setCharCount(stripHtml(html).length);
    };

    const handleFormatChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const tag = event.target.value;
        if (tag === 'p') {
            exec('formatBlock', 'p');
            return;
        }
        exec('formatBlock', tag);
    };

    const handleInput = () => {
        const html = editorRef.current?.innerHTML ?? '';
        onChange(html);
        setCharCount(stripHtml(html).length);
    };

    const toolbarGroups: ToolbarButton[][] = [
        [
            { key: 'undo', label: '撤销', icon: <Undo2 size={14} />, command: 'undo' },
            { key: 'redo', label: '重做', icon: <Redo2 size={14} />, command: 'redo' },
        ],
        [
            { key: 'bold', label: '加粗', icon: <Bold size={14} />, command: 'bold' },
            { key: 'italic', label: '斜体', icon: <Italic size={14} />, command: 'italic' },
        ],
        [
            { key: 'align-left', label: '左对齐', icon: <AlignLeft size={14} />, command: 'justifyLeft' },
            { key: 'align-center', label: '居中', icon: <AlignCenter size={14} />, command: 'justifyCenter' },
            { key: 'align-right', label: '右对齐', icon: <AlignRight size={14} />, command: 'justifyRight' },
            { key: 'align-justify', label: '两端对齐', icon: <AlignJustify size={14} />, command: 'justifyFull' },
        ],
        [
            { key: 'list', label: '无序列表', icon: <List size={14} />, command: 'insertUnorderedList' },
            { key: 'ordered-list', label: '有序列表', icon: <ListOrdered size={14} />, command: 'insertOrderedList' },
            { key: 'indent', label: '增加缩进', icon: <IndentIncrease size={14} />, command: 'indent' },
            { key: 'outdent', label: '减少缩进', icon: <IndentDecrease size={14} />, command: 'outdent' },
        ],
        [
            { key: 'link', label: '插入链接', icon: <Link size={14} />, action: () => {
                const url = window.prompt('请输入链接地址');
                if (url) exec('createLink', url);
            } },
            { key: 'unlink', label: '移除链接', icon: <Link2Off size={14} />, command: 'unlink' },
            { key: 'image', label: '插入图片', icon: <Image size={14} />, action: () => {
                const url = window.prompt('请输入图片地址');
                if (url) exec('insertImage', url);
            } },
            { key: 'video', label: '插入视频', icon: <Video size={14} />, action: () => {
                const url = window.prompt('请输入视频地址');
                if (url) exec('insertHTML', `<video src="${url}" controls style="max-width:100%"></video>`);
            } },
            { key: 'table', label: '插入表格', icon: <Table size={14} />, action: () => {
                exec('insertHTML', '<table border="1" cellpadding="6" cellspacing="0"><tr><td></td><td></td></tr><tr><td></td><td></td></tr></table>');
            } },
        ],
        [
            { key: 'clear', label: '清除格式', icon: <Eraser size={14} />, command: 'removeFormat' },
            {
                key: 'fullscreen',
                label: fullscreen ? '退出全屏' : '全屏',
                icon: fullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />,
                action: () => setFullscreen((prev) => !prev),
            },
        ],
    ];

    return (
        <div className={`na-rich-editor ${fullscreen ? 'is-fullscreen' : ''}`}>
            <div className="na-rich-editor__toolbar">
                <select
                    className="na-rich-editor__format"
                    defaultValue="p"
                    aria-label="段落格式"
                    onChange={handleFormatChange}
                >
                    <option value="p">段落</option>
                    <option value="h1">标题 1</option>
                    <option value="h2">标题 2</option>
                    <option value="h3">标题 3</option>
                </select>
                <span className="na-rich-editor__divider" />
                {toolbarGroups.map((group, groupIndex) => (
                    <React.Fragment key={group.map((item) => item.key).join('-')}>
                        {groupIndex > 0 ? <span className="na-rich-editor__divider" /> : null}
                        {group.map((item) => (
                            <button
                                key={item.key}
                                type="button"
                                className="na-rich-editor__btn"
                                title={item.label}
                                aria-label={item.label}
                                onMouseDown={(event) => event.preventDefault()}
                                onClick={() => {
                                    if (item.action) {
                                        item.action();
                                        return;
                                    }
                                    if (item.command) {
                                        exec(item.command);
                                    }
                                }}
                            >
                                {item.icon}
                            </button>
                        ))}
                    </React.Fragment>
                ))}
            </div>
            <div
                ref={editorRef}
                className="na-rich-editor__content"
                contentEditable
                role="textbox"
                aria-multiline="true"
                data-placeholder={placeholder}
                onInput={handleInput}
                suppressContentEditableWarning
            />
            <div className="na-rich-editor__status">
                <span>p</span>
                <span>{charCount} 字</span>
            </div>
        </div>
    );
}
