import React from 'react';
import defaultCardImage from '../assets/entity-card-default.png';

type EntityCardPlaceholderProps = {
    size?: 'card' | 'thumb';
    className?: string;
};

export default function EntityCardPlaceholder({
    size = 'card',
    className,
}: EntityCardPlaceholderProps) {
    return (
        <img
            src={defaultCardImage}
            alt=""
            className={`entity-card-placeholder entity-card-placeholder--${size} ${className ?? ''}`.trim()}
        />
    );
}
