import React from 'react';
import { ChevronLeft } from 'lucide-react';

export type NavBarProps = {
    title: string;
    subtitle?: string;
    showBack?: boolean;
    onBack?: () => void;
    rightSlot?: React.ReactNode;
    large?: boolean;
};

export default function NavBar({ title, subtitle, showBack, onBack, rightSlot, large }: NavBarProps) {
    if (large) {
        return (
            <header className="dma-navbar dma-navbar-large">
                <div className="dma-navbar-large-body">
                    <h1>{title}</h1>
                    {subtitle ? <p>{subtitle}</p> : null}
                </div>
            </header>
        );
    }

    return (
        <header className="dma-navbar">
            <div className="dma-navbar-side">
                {showBack ? (
                    <button type="button" className="dma-navbar-back" onClick={onBack} aria-label="返回">
                        <ChevronLeft size={22} strokeWidth={2.2} />
                        <span>返回</span>
                    </button>
                ) : (
                    <span className="dma-navbar-placeholder" aria-hidden="true" />
                )}
            </div>
            <div className="dma-navbar-center">
                <h1>{title}</h1>
            </div>
            <div className="dma-navbar-side dma-navbar-side-right">
                {rightSlot || <span className="dma-navbar-placeholder" aria-hidden="true" />}
            </div>
        </header>
    );
}
