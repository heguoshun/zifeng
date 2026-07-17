import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, MoreHorizontal } from 'lucide-react';
import TreeToggleIcon from '../components/TreeToggleIcon';
import AppShell from '../components/AppShell';
import Breadcrumb from '../components/Breadcrumb';
import AddSubSpaceDrawer, { type AddSubSpaceFormValue } from '../components/AddSubSpaceDrawer';
import EditSpaceDrawer, { type EditSpaceFormValue } from '../components/EditSpaceDrawer';
import TechMapMarker from '../components/TechMapMarker';
import DeviceAccessSidebar, { type DeviceAccessPageId } from '../components/DeviceAccessSidebar';
import IotToast, { type IotToastData, triggerIotToast } from '../components/IotToast';
import { DEPARTMENT_TREE } from '../data/orgHierarchy';
import {
    SPACE_CONFIG_DEFAULT_EXPANDED,
    SPACE_CONFIG_ROOT,
    SPACE_TYPE_LABEL,
    addChildToSpaceTree,
    createSpaceId,
    findSpaceConfigNode,
    findSpaceConfigPath,
    getBuildingFloors,
    getCampusBuildings,
    canAddChildSpace,
    getChildSpaceTypeOptions,
    getFloorRooms,
    getFloorViewNode,
    getMapLevelForNode,
    getParentNode,
    getSpacePathLabel,
    updateSpaceNode,
    type MapLevel,
    type SpaceConfigNode,
    type SpaceNodeType,
} from '../data/spaceConfig';
import campusMapBg from '../assets/space-campus-map.png';
import buildingMapBg from '../assets/space-building-map.png';
import floorMapBg from '../assets/space-floor-map.png';
import '../device-access.css';
import '../product-create.css';
import '../space-config.css';

const MAP_BACKGROUNDS: Record<MapLevel, string> = {
    campus: campusMapBg,
    building: buildingMapBg,
    floor: floorMapBg,
};

type SpaceConfigPageProps = {
    onNavigateHome: () => void;
    onNavigate: (pageId: DeviceAccessPageId) => void;
};

type ContextMenuState = {
    nodeId: string;
    x: number;
    y: number;
} | null;

type DraftPinState = {
    parentId: string;
    parentLabel: string;
    parentType: SpaceNodeType;
    x: number;
    y: number;
};

const CONTEXT_MENU_ITEMS = [
    { id: 'edit', label: '编辑' },
    { id: 'add-child', label: '添加子空间' },
    { id: 'move', label: '位置修改' },
    { id: 'delete', label: '删除' },
] as const;

function flattenDepartmentOptions(
    nodes: typeof DEPARTMENT_TREE,
    prefix = '',
): { label: string; value: string }[] {
    return nodes.flatMap((node) => {
        const label = prefix ? `${prefix} / ${node.label}` : node.label;
        const current = { label, value: node.id };
        const children = node.children
            ? flattenDepartmentOptions(node.children, label)
            : [];
        return [current, ...children];
    });
}

const DEPARTMENT_OPTIONS = flattenDepartmentOptions(DEPARTMENT_TREE);

function clampPercent(value: number) {
    return Math.min(96, Math.max(4, value));
}

function SpaceConfigTree({
    nodes,
    expanded,
    activeId,
    depth = 0,
    onToggle,
    onSelect,
    onOpenMenu,
}: {
    nodes: SpaceConfigNode[];
    expanded: Record<string, boolean>;
    activeId: string;
    depth?: number;
    onToggle: (id: string) => void;
    onSelect: (id: string) => void;
    onOpenMenu: (nodeId: string, event: React.MouseEvent<HTMLButtonElement>) => void;
}) {
    return (
        <ul className={`sc-tree ${depth > 0 ? 'sc-tree--nested' : ''}`}>
            {nodes.map((node) => {
                const hasChildren = Boolean(node.children?.length);
                const isExpanded = expanded[node.id];
                const isActive = activeId === node.id;

                return (
                    <li key={node.id} className="sc-tree-node">
                        <div
                            className={`sc-tree-item ${isActive ? 'is-active' : ''}`}
                            style={{ paddingLeft: `${8 + depth * 18}px` }}
                        >
                            {hasChildren ? (
                                <button
                                    type="button"
                                    className="sc-tree-toggle"
                                    aria-label={isExpanded ? '收起' : '展开'}
                                    onClick={() => onToggle(node.id)}
                                >
                                    <TreeToggleIcon expanded={isExpanded} />
                                </button>
                            ) : (
                                <span className="sc-tree-spacer" />
                            )}
                            <button
                                type="button"
                                className="sc-tree-label-btn"
                                onClick={() => onSelect(node.id)}
                            >
                                {node.label}
                            </button>
                            <button
                                type="button"
                                className="sc-tree-menu-btn"
                                aria-label="更多操作"
                                onClick={(event) => onOpenMenu(node.id, event)}
                            >
                                <MoreHorizontal size={14} />
                            </button>
                        </div>
                        {hasChildren && isExpanded && (
                            <SpaceConfigTree
                                nodes={node.children ?? []}
                                expanded={expanded}
                                activeId={activeId}
                                depth={depth + 1}
                                onToggle={onToggle}
                                onSelect={onSelect}
                                onOpenMenu={onOpenMenu}
                            />
                        )}
                    </li>
                );
            })}
        </ul>
    );
}

function FloorSelector({
    floors,
    activeId,
    onSelect,
}: {
    floors: SpaceConfigNode[];
    activeId: string;
    onSelect: (id: string) => void;
}) {
    return (
        <div className="sc-floor-selector">
            {floors.map((floor) => (
                <button
                    key={floor.id}
                    type="button"
                    className={`sc-floor-chip ${activeId === floor.id ? 'is-active' : ''}`}
                    onClick={() => onSelect(floor.id)}
                >
                    {floor.label}
                </button>
            ))}
        </div>
    );
}

export default function SpaceConfigPage({ onNavigateHome, onNavigate }: SpaceConfigPageProps) {
    const [spaceTree, setSpaceTree] = useState(SPACE_CONFIG_ROOT);
    const [activeId, setActiveId] = useState(SPACE_CONFIG_ROOT.id);
    const [expanded, setExpanded] = useState(SPACE_CONFIG_DEFAULT_EXPANDED);
    const [contextMenu, setContextMenu] = useState<ContextMenuState>(null);
    const [draftPin, setDraftPin] = useState<DraftPinState | null>(null);
    const [addDrawerOpen, setAddDrawerOpen] = useState(false);
    const [editTargetId, setEditTargetId] = useState<string | null>(null);
    const [isDraggingPin, setIsDraggingPin] = useState(false);
    const [toast, setToast] = useState<IotToastData | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<HTMLDivElement>(null);

    const activeNode = findSpaceConfigNode(spaceTree, activeId) ?? spaceTree;
    const activePath = findSpaceConfigPath(spaceTree, activeId) ?? [spaceTree];
    const mapLevel = getMapLevelForNode(activeNode.type === 'room'
        ? (activePath.find((item) => item.type === 'floor') ?? activeNode)
        : activeNode);
    const parentNode = getParentNode(spaceTree, activeId);
    const canGoBack = Boolean(parentNode);

    const sidebar = (
        <DeviceAccessSidebar pageId="space-config" onNavigate={onNavigate} />
    );

    useEffect(() => {
        const path = findSpaceConfigPath(spaceTree, activeId);
        if (!path) return;
        setExpanded((prev) => {
            const next = { ...prev };
            path.forEach((node) => {
                next[node.id] = true;
            });
            return next;
        });
    }, [activeId, spaceTree]);

    useEffect(() => {
        if (!contextMenu) return;

        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setContextMenu(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [contextMenu]);

    useEffect(() => {
        if (!isDraggingPin) return;

        const handlePointerMove = (event: PointerEvent) => {
            const rect = mapRef.current?.getBoundingClientRect();
            if (!rect) return;

            const x = clampPercent(((event.clientX - rect.left) / rect.width) * 100);
            const y = clampPercent(((event.clientY - rect.top) / rect.height) * 100);
            setDraftPin((prev) => (prev ? { ...prev, x, y } : null));
        };

        const handlePointerUp = () => {
            setIsDraggingPin(false);
            setAddDrawerOpen(true);
        };

        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);
        return () => {
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
        };
    }, [isDraggingPin]);

    const handleSelect = (id: string) => {
        setActiveId(id);
    };

    const handleBack = () => {
        if (parentNode) {
            setActiveId(parentNode.id);
        }
    };

    const resetAddFlow = () => {
        setDraftPin(null);
        setAddDrawerOpen(false);
        setIsDraggingPin(false);
    };

    const closeEditDrawer = () => {
        setEditTargetId(null);
    };

    const startEdit = (nodeId: string) => {
        resetAddFlow();
        setActiveId(nodeId);
        setEditTargetId(nodeId);
        setContextMenu(null);
    };

    const startAddChild = (nodeId: string) => {
        const node = findSpaceConfigNode(spaceTree, nodeId);
        if (!node) return;

        if (!canAddChildSpace(node.type)) {
            triggerIotToast(setToast, '房间下不支持新增子空间', 'warning');
            setContextMenu(null);
            return;
        }

        closeEditDrawer();
        const basePosition = node.mapPosition ?? { x: 50, y: 50 };
        setActiveId(nodeId);
        setDraftPin({
            parentId: nodeId,
            parentLabel: getSpacePathLabel(spaceTree, nodeId),
            parentType: node.type,
            x: clampPercent(basePosition.x + 4),
            y: clampPercent(basePosition.y + 4),
        });
        setAddDrawerOpen(false);
        setIsDraggingPin(false);
        setContextMenu(null);
    };

    const handleContextAction = (actionId: string, nodeId: string) => {
        if (actionId === 'add-child') {
            startAddChild(nodeId);
            return;
        }

        if (actionId === 'edit') {
            startEdit(nodeId);
            return;
        }

        const node = findSpaceConfigNode(spaceTree, nodeId);
        const label = node?.label ?? '';
        const messages: Record<string, string> = {
            move: `修改「${label}」位置`,
            delete: `删除空间「${label}」`,
        };
        triggerIotToast(setToast, messages[actionId] ?? '操作已触发', 'success');
        setContextMenu(null);
    };

    const handleDraftPinPointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDraggingPin(true);
        setAddDrawerOpen(false);
    };

    const handleAddConfirm = (value: AddSubSpaceFormValue) => {
        if (!draftPin) return;

        const childId = createSpaceId(value.spaceType);
        const childNode: SpaceConfigNode = {
            id: childId,
            label: value.name,
            type: value.spaceType,
            mapPosition: { x: draftPin.x, y: draftPin.y },
            departmentId: value.department,
            description: value.description,
            imageUrl: value.imageUrl || undefined,
            children: value.spaceType === 'room' ? undefined : [],
        };

        setSpaceTree((prev) => addChildToSpaceTree(prev, draftPin.parentId, childNode));
        setExpanded((prev) => ({ ...prev, [draftPin.parentId]: true }));
        setActiveId(childId);
        triggerIotToast(setToast, `已添加子空间「${value.name}」`, 'success');
        resetAddFlow();
    };

    const handleEditConfirm = (value: EditSpaceFormValue) => {
        if (!editTargetId) return;

        setSpaceTree((prev) => updateSpaceNode(prev, editTargetId, {
            label: value.name,
            departmentId: value.department,
            description: value.description,
            imageUrl: value.imageUrl || undefined,
        }));
        triggerIotToast(setToast, `已更新空间「${value.name}」`, 'success');
        closeEditDrawer();
    };

    const editTargetNode = editTargetId
        ? findSpaceConfigNode(spaceTree, editTargetId)
        : null;
    const editParentNode = editTargetId ? getParentNode(spaceTree, editTargetId) : null;
    const editInitialValue = useMemo<EditSpaceFormValue>(() => ({
        name: editTargetNode?.label ?? '',
        department: editTargetNode?.departmentId ?? '',
        description: editTargetNode?.description ?? '',
        imageUrl: editTargetNode?.imageUrl ?? '',
    }), [editTargetNode]);

    const renderMapMarkers = () => {
        if (mapLevel === 'campus') {
            const buildings = getCampusBuildings(spaceTree);
            return buildings.map((building) => (
                <button
                    key={building.id}
                    type="button"
                    className={`sc-map-marker sc-map-marker--building ${activeId === building.id ? 'is-active' : ''}`}
                    style={{
                        left: `${building.mapPosition?.x ?? 50}%`,
                        top: `${building.mapPosition?.y ?? 50}%`,
                    }}
                    onClick={() => handleSelect(building.id)}
                >
                    <TechMapMarker label={building.label} size="lg" active={activeId === building.id} />
                </button>
            ));
        }

        if (mapLevel === 'building') {
            const building = activeNode.type === 'building'
                ? activeNode
                : activePath.find((item) => item.type === 'building');
            if (!building) return null;

            const floors = getBuildingFloors(building);
            const activeFloorId = activeNode.type === 'floor' || activeNode.type === 'room'
                ? (getFloorViewNode(activeNode, spaceTree).id)
                : floors[0]?.id;

            return (
                <>
                    {floors.map((floor, index) => (
                        <button
                            key={floor.id}
                            type="button"
                            className={`sc-map-marker sc-map-marker--floor-dot ${activeFloorId === floor.id ? 'is-active' : ''}`}
                            style={{
                                left: `${28 + index * 8}%`,
                                top: `${36 + index * 6}%`,
                            }}
                            onClick={() => handleSelect(floor.id)}
                        >
                            <span className="sc-map-marker__dot" />
                        </button>
                    ))}
                    <FloorSelector
                        floors={floors}
                        activeId={activeFloorId ?? ''}
                        onSelect={handleSelect}
                    />
                </>
            );
        }

        const floorNode = getFloorViewNode(activeNode, spaceTree);
        const rooms = getFloorRooms(floorNode);
        return rooms.map((room) => (
            <button
                key={room.id}
                type="button"
                className={`sc-map-marker sc-map-marker--room ${activeId === room.id ? 'is-active' : ''}`}
                style={{
                    left: `${room.mapPosition?.x ?? 50}%`,
                    top: `${room.mapPosition?.y ?? 50}%`,
                }}
                onClick={() => handleSelect(room.id)}
            >
                <TechMapMarker label={room.label} size="sm" active={activeId === room.id} />
            </button>
        ));
    };

    const draftSpaceTypeOptions = draftPin ? getChildSpaceTypeOptions(draftPin.parentType) : [];
    const contextMenuNode = contextMenu
        ? findSpaceConfigNode(spaceTree, contextMenu.nodeId)
        : null;
    const visibleContextMenuItems = CONTEXT_MENU_ITEMS.filter((item) => (
        item.id !== 'add-child'
        || (contextMenuNode && canAddChildSpace(contextMenuNode.type))
    ));

    return (
        <AppShell
            activeTopTab="设备接入"
            sidebar={sidebar}
            onTopTabChange={(tab) => {
                if (tab === '设备接入') onNavigate('home');
            }}
        >
            <div className="sc-page">
                <Breadcrumb items={[
                                    { label: '设备接入', pageId: 'home' },
                                    { label: '空间配置' },
                                ]} onNavigate={(id) => onNavigate(id as DeviceAccessPageId)} />

                <div className="sc-layout">
                    <aside className="sc-tree-panel panel">
                        <h3 className="sc-tree-panel__title">空间管理</h3>
                        <SpaceConfigTree
                            nodes={[spaceTree]}
                            expanded={expanded}
                            activeId={activeId}
                            onToggle={(id) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))}
                            onSelect={handleSelect}
                            onOpenMenu={(nodeId, event) => {
                                const rect = event.currentTarget.getBoundingClientRect();
                                setContextMenu({
                                    nodeId,
                                    x: rect.right + 4,
                                    y: rect.top,
                                });
                            }}
                        />
                    </aside>

                    <section className="sc-map-panel panel">
                        {canGoBack && (
                            <button type="button" className="sc-back-btn" onClick={handleBack}>
                                <ArrowLeft size={14} />
                                返回上一层
                            </button>
                        )}
                        <div className="sc-map-shell">
                            <div
                                ref={mapRef}
                                className={`sc-map ${draftPin ? 'is-placing' : ''}`}
                            >
                                <img
                                    key={mapLevel}
                                    className="sc-map__bg"
                                    src={MAP_BACKGROUNDS[mapLevel]}
                                    alt=""
                                    draggable={false}
                                />
                                {renderMapMarkers()}
                                {draftPin && (
                                    <button
                                        type="button"
                                        className={`sc-draft-pin ${isDraggingPin ? 'is-dragging' : ''}`}
                                        style={{ left: `${draftPin.x}%`, top: `${draftPin.y}%` }}
                                        onPointerDown={handleDraftPinPointerDown}
                                        aria-label="拖动定位新子空间"
                                    >
                                        <TechMapMarker size="draft" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </section>
                </div>
            </div>

            {contextMenu && (
                <div
                    ref={menuRef}
                    className="sc-context-menu"
                    style={{ left: contextMenu.x, top: contextMenu.y }}
                >
                    {visibleContextMenuItems.map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            className={`sc-context-menu__item ${item.id === 'delete' ? 'is-danger' : ''}`}
                            onClick={() => handleContextAction(item.id, contextMenu.nodeId)}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
            )}

            {draftPin && draftSpaceTypeOptions.length > 0 && (
                <AddSubSpaceDrawer
                    open={addDrawerOpen}
                    parentLabel={draftPin.parentLabel}
                    spaceTypeOptions={draftSpaceTypeOptions}
                    departmentOptions={DEPARTMENT_OPTIONS}
                    onClose={resetAddFlow}
                    onConfirm={handleAddConfirm}
                />
            )}

            {editTargetNode && (
                <EditSpaceDrawer
                    open={Boolean(editTargetId)}
                    parentLabel={editParentNode
                        ? getSpacePathLabel(spaceTree, editParentNode.id)
                        : '无'}
                    spaceTypeLabel={SPACE_TYPE_LABEL[editTargetNode.type]}
                    initialValue={editInitialValue}
                    departmentOptions={DEPARTMENT_OPTIONS}
                    onClose={closeEditDrawer}
                    onConfirm={handleEditConfirm}
                />
            )}

            <IotToast toast={toast} onClose={() => setToast(null)} />
        </AppShell>
    );
}
