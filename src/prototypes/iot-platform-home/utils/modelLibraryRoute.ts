export type ThingModelFormMode = 'create' | 'edit';
export type ThingModelLibraryTab = 'standard' | 'manufacturer';

export type ThingModelFormRoute = {
    mode: ThingModelFormMode;
    tab: ThingModelLibraryTab;
    modelId: string | null;
    sectionId: string | null;
    categoryId: string | null;
};

export function parseThingModelFormRoute(hash: string): ThingModelFormRoute | null {
    const params = new URLSearchParams(hash.replace(/^#/, ''));
    if (params.get('page') !== 'model-library-create') return null;

    const tab: ThingModelLibraryTab = params.get('tab') === 'manufacturer' ? 'manufacturer' : 'standard';
    const modeParam = params.get('mode');
    const mode: ThingModelFormMode = modeParam === 'edit' ? 'edit' : 'create';

    return {
        mode,
        tab,
        modelId: params.get('id'),
        sectionId: params.get('sectionId'),
        categoryId: params.get('categoryId'),
    };
}

export function navigateThingModelForm(options: {
    mode?: ThingModelFormMode;
    tab: ThingModelLibraryTab;
    sectionId?: string;
    categoryId?: string;
    modelId?: string;
}) {
    const params = new URLSearchParams({
        page: 'model-library-create',
        tab: options.tab,
    });
    if (options.mode && options.mode !== 'create') {
        params.set('mode', options.mode);
    }
    if (options.sectionId) {
        params.set('sectionId', options.sectionId);
    }
    if (options.categoryId) {
        params.set('categoryId', options.categoryId);
    }
    if (options.modelId) {
        params.set('id', options.modelId);
    }
    window.location.hash = params.toString();
}
