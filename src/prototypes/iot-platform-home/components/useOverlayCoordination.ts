import { useCallback, useEffect, useId, useRef } from 'react';
import {
    claimOverlay,
    createOverlayId,
    releaseOverlay,
    subscribeOverlayCoordination,
    type OverlayKind,
} from './overlayCoordination';

export function useOverlayCoordination(
    kind: OverlayKind,
    active: boolean,
    onDeactivate: () => void,
    idPrefix = kind,
) {
    const reactId = useId();
    const overlayIdRef = useRef(createOverlayId(`${idPrefix}-${reactId}`));
    const activeRef = useRef(active);
    activeRef.current = active;

    const deactivate = useCallback(() => {
        if (activeRef.current) {
            onDeactivate();
        }
    }, [onDeactivate]);

    useEffect(() => {
        return subscribeOverlayCoordination((owner) => {
            if (!owner || owner.id === overlayIdRef.current) {
                return;
            }
            deactivate();
        });
    }, [deactivate]);

    useEffect(() => {
        if (!active) {
            releaseOverlay(overlayIdRef.current);
        }
    }, [active]);

    useEffect(() => () => releaseOverlay(overlayIdRef.current), []);

    const claim = useCallback(() => {
        claimOverlay(overlayIdRef.current, kind);
    }, [kind]);

    const release = useCallback(() => {
        releaseOverlay(overlayIdRef.current);
    }, []);

    return { claim, release };
}
