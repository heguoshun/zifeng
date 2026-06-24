export type OverlayKind = 'select' | 'input';

type OverlayOwner = {
    id: string;
    kind: OverlayKind;
};

let activeOwner: OverlayOwner | null = null;
const subscribers = new Set<(active: OverlayOwner | null) => void>();

function notify() {
    subscribers.forEach((listener) => listener(activeOwner));
}

function blurStandaloneInputs() {
    const active = document.activeElement;
    if (!(active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement)) {
        return;
    }
    if (active.closest('.el-select')) {
        return;
    }
    active.blur();
}

export function createOverlayId(prefix: string): string {
    return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export function claimOverlay(id: string, kind: OverlayKind) {
    if (activeOwner?.id === id && activeOwner.kind === kind) {
        return;
    }
    if (kind === 'select') {
        blurStandaloneInputs();
    }
    activeOwner = { id, kind };
    notify();
}

export function releaseOverlay(id: string) {
    if (activeOwner?.id !== id) {
        return;
    }
    activeOwner = null;
    notify();
}

export function subscribeOverlayCoordination(
    listener: (active: OverlayOwner | null) => void,
) {
    subscribers.add(listener);
    return () => {
        subscribers.delete(listener);
    };
}
