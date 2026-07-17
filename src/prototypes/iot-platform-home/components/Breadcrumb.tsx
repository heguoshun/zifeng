import React from 'react';

export type BreadcrumbItem = {
    label: string;
    pageId?: string;
};

type BreadcrumbProps = {
    items: BreadcrumbItem[];
    onNavigate?: (pageId: string) => void;
};

export default function Breadcrumb({ items, onNavigate }: BreadcrumbProps) {
    return (
        <div className="crumb">
            {items.map((item, index) => {
                const isLast = index === items.length - 1;
                const clickable = !isLast && item.pageId && onNavigate;
                return (
                    <React.Fragment key={index}>
                        {index > 0 && <span className="crumb-sep"> / </span>}
                        {clickable ? (
                            <button
                                type="button"
                                className="crumb-link"
                                onClick={() => onNavigate(item.pageId!)}
                            >
                                {item.label}
                            </button>
                        ) : (
                            <span className={isLast ? 'crumb-current' : undefined}>{item.label}</span>
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
}
