import React from 'react';

const MAX_VISIBLE_GROUPS = 3;

type DeviceGroupTagsProps = {
    groups: string[];
    variant?: 'table' | 'card';
};

export default function DeviceGroupTags({ groups, variant = 'table' }: DeviceGroupTagsProps) {
    const visibleGroups = groups.slice(0, MAX_VISIBLE_GROUPS);
    const hiddenCount = groups.length - visibleGroups.length;
    const wrapperClassName = variant === 'card' ? 'dm-device-card__tags' : 'dm-group-tags';
    const tagClassName = variant === 'card' ? 'dm-card-tag' : 'dm-group-tag';

    return (
        <div className={wrapperClassName}>
            {visibleGroups.map((group) => (
                <span key={group} className={tagClassName}>{group}</span>
            ))}
            {hiddenCount > 0 && (
                <span
                    className={`${tagClassName} dm-group-tag--more`.trim()}
                    title={groups.slice(MAX_VISIBLE_GROUPS).join('、')}
                >
                    +{hiddenCount}
                </span>
            )}
        </div>
    );
}
