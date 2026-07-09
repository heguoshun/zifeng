import { useEffect, useState } from 'react';
import { parseHashParams } from '../utils/hashParams';

export function useHashQueryParams(): URLSearchParams {
    const [params, setParams] = useState(() => {
        if (typeof window === 'undefined') return new URLSearchParams();
        return parseHashParams(window.location.hash);
    });

    useEffect(() => {
        if (typeof window === 'undefined') return undefined;

        const sync = () => setParams(parseHashParams(window.location.hash));
        window.addEventListener('hashchange', sync);
        return () => window.removeEventListener('hashchange', sync);
    }, []);

    return params;
}
