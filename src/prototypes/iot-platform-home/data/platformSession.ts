/**
 * 原型演示用：当前登录用户与物模型库等平台的权限判断。
 * 超级管理员可维护物模型库；租户用户仅可查看超管创建的内容。
 */

export type PlatformSessionUser = {
    account: string;
    displayName: string;
    isSuperAdmin: boolean;
};

export const PLATFORM_SUPER_ADMIN_ACCOUNT = 'superadmin';

export const PLATFORM_SUPER_ADMIN_SESSION: PlatformSessionUser = {
    account: PLATFORM_SUPER_ADMIN_ACCOUNT,
    displayName: '超管',
    isSuperAdmin: true,
};

export const PLATFORM_TENANT_SESSION: PlatformSessionUser = {
    account: 'test',
    displayName: '测试测试',
    isSuperAdmin: false,
};

export function isPlatformSuperAdmin(account: string): boolean {
    return account === PLATFORM_SUPER_ADMIN_ACCOUNT;
}

/** 读取当前会话用户；可通过地址栏 ?as=tenant 切换为租户只读视角 */
export function getPlatformSessionUser(): PlatformSessionUser {
    if (typeof window !== 'undefined') {
        const as = new URLSearchParams(window.location.search).get('as');
        if (as === 'tenant') {
            return PLATFORM_TENANT_SESSION;
        }
    }
    return PLATFORM_SUPER_ADMIN_SESSION;
}

export function canManageModelLibrary(user: PlatformSessionUser = getPlatformSessionUser()): boolean {
    return user.isSuperAdmin;
}
