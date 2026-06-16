const AVATAR_COLORS = ['#1890ff', '#52c41a', '#faad14', '#eb2f96', '#722ed1', '#13c2c2'] as const;

export function buildAvatarDataUri(label: string, colorIndex = 0): string {
    const initial = label.trim().charAt(0) || '?';
    const bg = AVATAR_COLORS[colorIndex % AVATAR_COLORS.length];
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><circle cx="32" cy="32" r="32" fill="${bg}"/><text x="32" y="40" text-anchor="middle" fill="#ffffff" font-size="26" font-family="Arial,sans-serif" font-weight="600">${initial}</text></svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

/** 表单新增用户时的默认头像 */
export const DEFAULT_USER_AVATAR = buildAvatarDataUri('用', 0);

/** 为列表 mock 用户间隔分配不同头像 */
export function assignListSampleAvatars<T extends { displayName: string; avatar?: string }>(
    users: T[],
): T[] {
    return users.map((user, index) => {
        if (index % 3 !== 0) return user;
        return {
            ...user,
            avatar: buildAvatarDataUri(user.displayName, index),
        };
    });
}
