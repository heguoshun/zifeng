import React, { useEffect, useMemo, useRef } from 'react';

function escapeHtml(text: string) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function highlightSql(code: string) {
    const escaped = escapeHtml(code);
    return escaped
        .replace(/(^|\n)(\s*--[^\n]*)/g, '$1<span class="arc-sql-comment">$2</span>')
        .replace(
            /\b(DELETE|FROM|WHERE|NOT|EXISTS|SELECT|AND|OR|INSERT|UPDATE|INTO|JOIN|ON|AS|IN|IS|NULL|LIMIT|ORDER|BY|GROUP|HAVING|CREATE|TABLE|ALTER|DROP|SET|VALUES)\b/gi,
            '<span class="arc-sql-keyword">$1</span>',
        );
}

type SqlCodeEditorProps = {
    value: string;
    onChange: (value: string) => void;
    rows?: number;
};

export default function SqlCodeEditor({
    value,
    onChange,
    rows = 8,
}: SqlCodeEditorProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const highlightRef = useRef<HTMLPreElement>(null);
    const lineCount = Math.max(value.split('\n').length, rows);
    const lineNumbers = useMemo(
        () => Array.from({ length: lineCount }, (_, index) => index + 1),
        [lineCount],
    );
    const highlighted = useMemo(() => highlightSql(value.endsWith('\n') ? `${value} ` : value), [value]);

    useEffect(() => {
        if (!textareaRef.current || !highlightRef.current) return;
        highlightRef.current.scrollTop = textareaRef.current.scrollTop;
        highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }, [value]);

    const syncScroll = () => {
        if (!textareaRef.current || !highlightRef.current) return;
        highlightRef.current.scrollTop = textareaRef.current.scrollTop;
        highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
    };

    return (
        <div className="arc-sql-editor">
            <div className="arc-sql-editor__gutter" aria-hidden="true">
                {lineNumbers.map((line) => (
                    <span key={line}>{line}</span>
                ))}
            </div>
            <div className="arc-sql-editor__code">
                <pre
                    ref={highlightRef}
                    className="arc-sql-editor__highlight"
                    aria-hidden="true"
                    dangerouslySetInnerHTML={{ __html: `${highlighted}\n` }}
                />
                <textarea
                    ref={textareaRef}
                    className="arc-sql-editor__textarea"
                    value={value}
                    spellCheck={false}
                    onChange={(event) => onChange(event.target.value)}
                    onScroll={syncScroll}
                />
            </div>
        </div>
    );
}
