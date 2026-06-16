import type { DeviceRecord } from './devices';

export type DeviceGroupTypeItem = {
    id: string;
    label: string;
    tagPrefix: string;
};

export type DeviceGroupRecord = {
    id: string;
    name: string;
    code: string;
    type: string;
    createdAt: string;
};

export function createInitialGroupTypes(): DeviceGroupTypeItem[] {
    return [
        { id: 'type', label: '设备类型', tagPrefix: '类型' },
        { id: 'area', label: '所属区域', tagPrefix: '区域' },
        { id: 'pipeline', label: '管网层级', tagPrefix: '管网' },
    ];
}

export function buildGroupTypeOptions(groupTypes: DeviceGroupTypeItem[]) {
    return groupTypes.map((item) => ({
        label: item.label,
        value: item.id,
    }));
}

export function getGroupTypeLabel(groupTypes: DeviceGroupTypeItem[], typeId: string) {
    return groupTypes.find((item) => item.id === typeId)?.label ?? '—';
}

export function getGroupTag(
    groupTypes: DeviceGroupTypeItem[],
    group: Pick<DeviceGroupRecord, 'type' | 'name'>,
) {
    const typeItem = groupTypes.find((item) => item.id === group.type);
    const prefix = typeItem?.tagPrefix ?? typeItem?.label ?? '';
    return `${prefix}:${group.name}`;
}

export function deviceMatchesGroup(
    device: DeviceRecord,
    groupTypes: DeviceGroupTypeItem[],
    group: Pick<DeviceGroupRecord, 'type' | 'name'>,
) {
    const tag = getGroupTag(groupTypes, group);
    if (device.tags.includes(tag)) {
        return true;
    }

    return device.tags.some((item) => {
        const [, name = ''] = item.split(':');
        return name === group.name;
    }) || device.groups.includes(group.name);
}

export function countDevicesInGroup(
    devices: DeviceRecord[],
    groupTypes: DeviceGroupTypeItem[],
    group: Pick<DeviceGroupRecord, 'type' | 'name'>,
) {
    return devices.filter((device) => deviceMatchesGroup(device, groupTypes, group)).length;
}

export function removeDeviceFromGroup(
    device: DeviceRecord,
    groupTypes: DeviceGroupTypeItem[],
    group: Pick<DeviceGroupRecord, 'type' | 'name'>,
): DeviceRecord {
    const tag = getGroupTag(groupTypes, group);
    return {
        ...device,
        tags: device.tags.filter((item) => item !== tag),
        groups: device.groups.filter((item) => item !== group.name),
    };
}

export function addDeviceToGroup(
    device: DeviceRecord,
    groupTypes: DeviceGroupTypeItem[],
    group: Pick<DeviceGroupRecord, 'type' | 'name'>,
): DeviceRecord {
    const tag = getGroupTag(groupTypes, group);
    return {
        ...device,
        tags: device.tags.includes(tag) ? device.tags : [...device.tags, tag],
        groups: device.groups.includes(group.name) ? device.groups : [...device.groups, group.name],
    };
}

export function generateGroupCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let code = '';
    for (let index = 0; index < 5; index += 1) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
}

export function generateGroupTypeId() {
    return `type-${Date.now()}`;
}

export function formatGroupCreatedAt(date = new Date()) {
    const pad = (value: number) => String(value).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export function createInitialDeviceGroups(): DeviceGroupRecord[] {
    return [
        { id: 'group-type-dabiao', name: '大表', code: 'S2yT6', type: 'type', createdAt: '2026-02-28 17:00:42' },
        { id: 'group-type-hubiao', name: '户表', code: 'K8mP2', type: 'type', createdAt: '2026-02-28 16:58:11' },
        { id: 'group-type-yaliji', name: '压力计', code: '9zQ5D', type: 'type', createdAt: '2026-02-28 17:00:23' },
        { id: 'group-type-shuizhiyi', name: '水质仪', code: 'R3vN8', type: 'type', createdAt: '2026-02-27 15:42:18' },
        { id: 'group-type-zhihuishuizhan', name: '智慧水站', code: 'H7cW1', type: 'type', createdAt: '2026-02-27 14:20:05' },
        { id: 'group-area-east', name: '城东', code: 'T5bL4', type: 'area', createdAt: '2026-02-26 11:08:33' },
        { id: 'group-area-west', name: '城西', code: 'M2xQ9', type: 'area', createdAt: '2026-02-25 09:15:47' },
        { id: 'group-area-south', name: '城南', code: 'a2uL7', type: 'area', createdAt: '2026-02-28 17:00:09' },
        { id: 'group-area-north', name: '城北', code: 'P6nK3', type: 'area', createdAt: '2026-02-27 13:55:22' },
        { id: 'group-pipeline-main', name: '主管网', code: 'Z4jH8', type: 'pipeline', createdAt: '2026-02-26 10:40:16' },
        { id: 'group-pipeline-dist', name: '配水管', code: 'N4dK9', type: 'pipeline', createdAt: '2026-02-27 17:00:02' },
        { id: 'group-pipeline-branch', name: '支管网', code: 'V8sF2', type: 'pipeline', createdAt: '2026-02-26 16:22:41' },
    ];
}

export function findDeviceGroup(groups: DeviceGroupRecord[], groupId: string | null) {
    if (!groupId) return null;
    return groups.find((item) => item.id === groupId) ?? null;
}
