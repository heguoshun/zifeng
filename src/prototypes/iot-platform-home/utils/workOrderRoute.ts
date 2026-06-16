export function parseWorkOrderDetailRoute(hash: string): { workOrderId: string | null } {
    const params = new URLSearchParams(hash.replace(/^#/, ''));
    const workOrderId = params.get('id');
    return { workOrderId };
}

export function navigateWorkOrderDetail(workOrderId: string) {
    const params = new URLSearchParams({ page: 'work-order-detail', id: workOrderId });
    window.location.hash = params.toString();
}

export function navigateWorkOrderCreate() {
    window.location.hash = 'page=work-order-create';
}
