import { useEffect, useRef, type RefObject } from 'react';

const OPEN_GUARD_MS = 120;

export function useDismissOnOutsideMouseDown(
    active: boolean,
    containerRef: RefObject<HTMLElement | null>,
    onDismiss: () => void,
    shouldIgnoreTarget?: (target: HTMLElement) => boolean,
) {
    const openedAtRef = useRef(0);

    useEffect(() => {
        if (active) {
            openedAtRef.current = performance.now();
        }
    }, [active]);

    useEffect(() => {
        if (!active) return undefined;

        const handlePointerDown = (event: MouseEvent) => {
            if (performance.now() - openedAtRef.current < OPEN_GUARD_MS) {
                return;
            }

            const target = event.target as HTMLElement;
            if (containerRef.current?.contains(target)) return;
            if (shouldIgnoreTarget?.(target)) return;
            onDismiss();
        };

        let raf2 = 0;
        const raf1 = requestAnimationFrame(() => {
            raf2 = requestAnimationFrame(() => {
                document.addEventListener('mousedown', handlePointerDown);
            });
        });

        return () => {
            cancelAnimationFrame(raf1);
            cancelAnimationFrame(raf2);
            document.removeEventListener('mousedown', handlePointerDown);
        };
    }, [active, containerRef, onDismiss, shouldIgnoreTarget]);
}
