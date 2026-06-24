import React, { createContext, useContext } from 'react';
import type { PlatformSessionUser } from '../data/platformSession';

type PlatformAuthContextValue = {
    user: PlatformSessionUser;
    logout: () => void;
};

const PlatformAuthContext = createContext<PlatformAuthContextValue | null>(null);

export function PlatformAuthProvider({
    user,
    onLogout,
    children,
}: {
    user: PlatformSessionUser;
    onLogout: () => void;
    children: React.ReactNode;
}) {
    return (
        <PlatformAuthContext.Provider value={{ user, logout: onLogout }}>
            {children}
        </PlatformAuthContext.Provider>
    );
}

export function usePlatformAuth(): PlatformAuthContextValue {
    const context = useContext(PlatformAuthContext);
    if (!context) {
        throw new Error('usePlatformAuth must be used within PlatformAuthProvider');
    }
    return context;
}

export function useOptionalPlatformAuth(): PlatformAuthContextValue | null {
    return useContext(PlatformAuthContext);
}
