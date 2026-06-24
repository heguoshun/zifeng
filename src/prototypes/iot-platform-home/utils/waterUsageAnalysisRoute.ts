export type WaterUsageAnalysisRoute = {
    meterId: string | null;
};

let pendingMeterId: string | null = null;

export function parseWaterUsageAnalysisRoute(hash: string): WaterUsageAnalysisRoute {
    const params = new URLSearchParams(hash.replace(/^#/, ''));
    const meterId = params.get('meterId') ?? params.get('id');
    return { meterId: meterId?.trim() || null };
}

export function navigateWaterUsageAnalysis(meterId: string) {
    pendingMeterId = meterId;
    const params = new URLSearchParams({
        page: 'water-usage-analysis',
        meterId,
    });
    window.location.hash = params.toString();
}

export function consumePendingWaterUsageMeterId(): string | null {
    const meterId = pendingMeterId;
    pendingMeterId = null;
    return meterId;
}

export function mergeWaterUsageAnalysisRoute(
    previous: WaterUsageAnalysisRoute,
    hash: string,
): WaterUsageAnalysisRoute {
    const pending = consumePendingWaterUsageMeterId();
    const parsed = parseWaterUsageAnalysisRoute(hash);
    return {
        meterId: pending ?? parsed.meterId ?? previous.meterId,
    };
}
