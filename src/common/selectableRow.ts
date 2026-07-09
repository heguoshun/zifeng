import type { MouseEvent } from 'react';

const INTERACTIVE_ROW_TARGET_SELECTOR = [
    'button',
    'a',
    'input',
    'select',
    'textarea',
    'label',
    '.pm-link-btn',
    '.pm-table-actions',
    '[data-row-click-ignore]',
].join(', ');

export function shouldIgnoreSelectableRowClick(target: EventTarget | null) {
    return Boolean((target as HTMLElement | null)?.closest(INTERACTIVE_ROW_TARGET_SELECTOR));
}

export function handleSelectableRowClick(
    event: MouseEvent<HTMLTableRowElement>,
    toggle: () => void,
) {
    if (shouldIgnoreSelectableRowClick(event.target)) {
        return;
    }
    toggle();
}
