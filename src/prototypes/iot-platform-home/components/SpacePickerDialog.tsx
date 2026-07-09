import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MapPin } from 'lucide-react';
import SpaceCascadeSelect from './SpaceCascadeSelect';
import {
    SPACE_MAP_BUILDINGS,
    SPACE_MAP_ROOT,
    findSpacePath,
    formatSpacePath,
    type SpaceMapNode,
} from '../data/spaceMapHierarchy';
import spaceMapBg from '../assets/space-map-bg.png';
import '../device-create.css';
import ClearableInput from './ClearableInput';

export type SpacePickerValue = {
    spaceX: string;
    spaceY: string;
    spaceName: string;
};

type SpacePickerDialogProps = {
    open: boolean;
    initialValue?: Partial<SpacePickerValue>;
    onClose: () => void;
    onConfirm: (value: SpacePickerValue) => void;
};

function formatCoord(value: number) {
    return value.toFixed(1);
}

function parsePathFromName(name: string): SpaceMapNode[] {
    if (!name.trim()) return [];

    const labels = name.split('/').map((part) => part.trim()).filter(Boolean);
    if (!labels.length) return [];

    let currentLevel = SPACE_MAP_ROOT;
    const path: SpaceMapNode[] = [];

    for (const label of labels) {
        const matched = currentLevel.find((node) => node.label === label);
        if (!matched) break;
        path.push(matched);
        currentLevel = matched.children ?? [];
    }

    return path;
}

export default function SpacePickerDialog({
    open,
    initialValue,
    onClose,
    onConfirm,
}: SpacePickerDialogProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const [spacePath, setSpacePath] = useState<SpaceMapNode[]>([]);
    const [draftX, setDraftX] = useState('');
    const [draftY, setDraftY] = useState('');
    const [activeBuildingId, setActiveBuildingId] = useState<string | null>(null);

    useEffect(() => {
        if (!open) return;

        const initialPath = parsePathFromName(initialValue?.spaceName ?? '');
        setSpacePath(initialPath);
        setDraftX(initialValue?.spaceX ?? '');
        setDraftY(initialValue?.spaceY ?? '');
        setActiveBuildingId(initialPath[1]?.id ?? null);
    }, [open, initialValue?.spaceName, initialValue?.spaceX, initialValue?.spaceY]);

    if (!open) return null;

    const applyPath = (path: SpaceMapNode[]) => {
        setSpacePath(path);
        const leaf = path[path.length - 1];
        if (leaf?.x != null && leaf?.y != null) {
            setDraftX(formatCoord(leaf.x));
            setDraftY(formatCoord(leaf.y));
        }
        if (path[1]) {
            setActiveBuildingId(path[1].id);
        }
    };

    const handleBuildingSelect = (buildingId: string, label: string, x: number, y: number) => {
        setActiveBuildingId(buildingId);

        const buildingNode = findSpacePath(SPACE_MAP_ROOT, buildingId);
        if (buildingNode) {
            applyPath(buildingNode);
            return;
        }

        setSpacePath([
            SPACE_MAP_ROOT[0],
            { id: buildingId, label, x, y },
        ]);
        setDraftX(formatCoord(x));
        setDraftY(formatCoord(y));
    };

    const handleMapClick = (event: React.MouseEvent<HTMLDivElement>) => {
        const rect = mapRef.current?.getBoundingClientRect();
        if (!rect) return;

        const x = ((event.clientX - rect.left) / rect.width) * 100;
        const y = ((event.clientY - rect.top) / rect.height) * 100;
        setDraftX(formatCoord(x));
        setDraftY(formatCoord(y));
    };

    const handleConfirm = () => {
        const spaceName = spacePath.length
            ? formatSpacePath(spacePath)
            : (initialValue?.spaceName ?? '');

        onConfirm({
            spaceX: draftX.trim(),
            spaceY: draftY.trim(),
            spaceName,
        });
        onClose();
    };

    const handleMaskMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
        if (event.target === event.currentTarget) {
            onClose();
        }
    };

    return createPortal(
        <div
            className="iot-dialog-mask dcp-space-mask"
            role="presentation"
            onMouseDown={handleMaskMouseDown}
        >
            <div
                className="dcp-space-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="dcp-space-dialog-title"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <div className="iot-dialog__head">
                    <h4 id="dcp-space-dialog-title">空间地图选点</h4>
                    <button type="button" className="iot-dialog__close" onClick={onClose} aria-label="关闭">×</button>
                </div>

                <div className="dcp-space-dialog__toolbar">
                    <SpaceCascadeSelect
                        options={SPACE_MAP_ROOT}
                        valuePath={spacePath}
                        onChange={applyPath}
                    />
                    <label className="dcp-space-dialog__coord">
                        <span>x坐标</span>
                        <ClearableInput
                            type="text"
                            className="dcp-space-dialog__coord-input"
                            value={draftX}
                            onChange={(event) => setDraftX(event.target.value)}
                        />
                    </label>
                    <label className="dcp-space-dialog__coord">
                        <span>y坐标</span>
                        <ClearableInput
                            type="text"
                            className="dcp-space-dialog__coord-input"
                            value={draftY}
                            onChange={(event) => setDraftY(event.target.value)}
                        />
                    </label>
                    <button type="button" className="pm-btn pm-btn-primary dcp-space-dialog__edit-btn">
                        编辑地图
                    </button>
                </div>

                <div className="dcp-space-dialog__body">
                    <div
                        ref={mapRef}
                        className="dcp-space-map"
                        role="presentation"
                        style={{ backgroundImage: `url(${spaceMapBg})` }}
                        onClick={handleMapClick}
                    >
                        {SPACE_MAP_BUILDINGS.map((building) => (
                            <button
                                key={building.id}
                                type="button"
                                className={`dcp-space-map__pin ${activeBuildingId === building.id ? 'is-active' : ''}`.trim()}
                                style={{ left: `${building.x}%`, top: `${building.y}%` }}
                                onClick={(event) => {
                                    event.stopPropagation();
                                    handleBuildingSelect(building.id, building.label, building.x, building.y);
                                }}
                            >
                                <span className="dcp-space-map__pin-label">{building.label}</span>
                                <MapPin size={18} className="dcp-space-map__pin-icon" aria-hidden />
                            </button>
                        ))}
                    </div>
                </div>

                <div className="iot-dialog__foot">
                    <button type="button" className="pm-btn pm-btn-ghost" onClick={onClose}>取消</button>
                    <button
                        type="button"
                        className="pm-btn pm-btn-primary"
                        onClick={handleConfirm}
                        disabled={!draftX.trim() || !draftY.trim()}
                    >
                        确定
                    </button>
                </div>
            </div>
        </div>,
        document.body,
    );
}
