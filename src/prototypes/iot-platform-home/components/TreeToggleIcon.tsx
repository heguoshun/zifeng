import React from 'react';

type TreeToggleIconProps = {
    expanded: boolean;
    className?: string;
};

export default function TreeToggleIcon({ expanded, className }: TreeToggleIconProps) {
    return (
        <span
            className={`iot-tree-toggle-icon ${expanded ? 'is-expanded' : ''} ${className ?? ''}`.trim()}
            aria-hidden="true"
        />
    );
}
