import React from 'react';

type TechMapMarkerProps = {
    label?: string;
    size?: 'lg' | 'sm' | 'draft';
    active?: boolean;
};

export default function TechMapMarker({ label, size = 'lg', active }: TechMapMarkerProps) {
    return (
        <span className={`sc-tech-marker sc-tech-marker--${size} ${active ? 'is-active' : ''}`}>
            {label ? <span className="sc-tech-marker__label">{label}</span> : null}
            <span className="sc-tech-marker__pin" aria-hidden>
                <span className="sc-tech-marker__crystal" />
                <span className="sc-tech-marker__ripple" />
            </span>
        </span>
    );
}
