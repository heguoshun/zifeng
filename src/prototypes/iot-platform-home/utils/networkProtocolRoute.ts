export type NetworkProtocolFormRoute = {
    mode: 'create' | 'edit';
    networkProtocolId: string | null;
};

export function parseNetworkProtocolFormRoute(hash: string): NetworkProtocolFormRoute {
    const normalized = hash.replace(/^#/, '');
    const params = new URLSearchParams(normalized);
    const page = params.get('page');

    if (page === 'network-protocol-edit') {
        return {
            mode: 'edit',
            networkProtocolId: params.get('id'),
        };
    }

    if (page === 'network-protocol-create') {
        return {
            mode: 'create',
            networkProtocolId: null,
        };
    }

    return {
        mode: 'create',
        networkProtocolId: null,
    };
}

export function navigateNetworkProtocolForm(mode: 'create' | 'edit', networkProtocolId?: string) {
    const params = new URLSearchParams({
        page: mode === 'create' ? 'network-protocol-create' : 'network-protocol-edit',
    });
    if (mode === 'edit' && networkProtocolId) {
        params.set('id', networkProtocolId);
    }
    window.location.hash = params.toString();
}
