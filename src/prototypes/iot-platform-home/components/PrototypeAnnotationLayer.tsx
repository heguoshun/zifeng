import React, { useMemo } from 'react';
import {
    AnnotationViewer,
    type AnnotationDirectoryRouteNode,
    type AnnotationSourceDocument,
    type AnnotationViewerOptions,
} from '@axhub/annotation';
import annotationSourceDocument from '../annotation-source.json';

type PrototypeAnnotationLayerProps = {
    currentPageId: string;
    onNavigatePage?: (pageId: string) => void;
};

export default function PrototypeAnnotationLayer({
    currentPageId,
    onNavigatePage,
}: PrototypeAnnotationLayerProps) {
    const options = useMemo<AnnotationViewerOptions>(() => ({
        showToolbar: true,
        showThemeToggle: true,
        showColorFilter: true,
        // 仅有 directory（PRD 文档）而无页面 marker 时，也需要启动标注面板
        emptyWhenNoData: true,
        toolbarAutoHide: false,
        toolbarEdge: 'right',
        zIndex: 10050,
        currentPageId,
        onDirectoryRoute: (node: AnnotationDirectoryRouteNode) => {
            if (typeof node.route !== 'string') {
                return;
            }
            if (onNavigatePage) {
                onNavigatePage(node.route);
                return;
            }
            window.location.hash = `page=${node.route}`;
        },
    }), [currentPageId, onNavigatePage]);

    return (
        <AnnotationViewer
            source={annotationSourceDocument as AnnotationSourceDocument}
            options={options}
        />
    );
}
