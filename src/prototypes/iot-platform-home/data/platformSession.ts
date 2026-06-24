/**
 * 原型演示用：当前登录用户与物模型库等平台的权限判断。
 * 登录后根据角色 authorizedPermissionIds 控制菜单与页面访问。
 */

import { resolveRolePermissionIds, type AlarmRuleCategoryScope } from './systemRoles';
import type { SystemRoleRecord } from './systemRoles';
import type { SystemUserRecord } from './systemUsers';

export type PlatformSessionUser = {
    account: string;
    displayName: string;
    isSuperAdmin: boolean;
    userId: string;
    tenantId: string;
    roleId: string;
    roleName: string;
    isTenantAdmin: boolean;
    permissionIds: string[];
    alarmRuleCategoryScopes?: AlarmRuleCategoryScope[];
};

export const PLATFORM_SUPER_ADMIN_ACCOUNT = 'superadmin';

export const PLATFORM_SUPER_ADMIN_SESSION: PlatformSessionUser = {
    account: PLATFORM_SUPER_ADMIN_ACCOUNT,
    displayName: '超管',
    isSuperAdmin: true,
    userId: 'user-superadmin',
    tenantId: 'tenant-jiahuan',
    roleId: 'role-jiahuan-admin',
    roleName: '企业管理员',
    isTenantAdmin: true,
    permissionIds: [],
};

export const PLATFORM_TENANT_SESSION: PlatformSessionUser = {
    account: 'test',
    displayName: '测试测试',
    isSuperAdmin: false,
    userId: 'user-test-1',
    tenantId: 'tenant-jiahuan',
    roleId: 'role-jiahuan-iot',
    roleName: '物联网角色',
    isTenantAdmin: false,
    permissionIds: [],
};

export const DEFAULT_USER_INIT_PASSWORD = '12345678';

const SESSION_STORAGE_KEY = 'iot-platform-session';
const REMEMBER_STORAGE_KEY = 'iot-platform-session-remember';

export type LoginFailureReason = 'account_empty' | 'password_empty' | 'invalid_credentials' | 'account_frozen';

export type LoginResult =
    | { ok: true; user: PlatformSessionUser }
    | { ok: false; reason: LoginFailureReason };

export function isPlatformSuperAdmin(account: string): boolean {
    return account === PLATFORM_SUPER_ADMIN_ACCOUNT;
}

export function buildSessionFromUser(
    user: SystemUserRecord,
    roles: SystemRoleRecord[],
): PlatformSessionUser {
    const role = roles.find((item) => item.id === user.roleId);
    const permissionIds = role ? resolveRolePermissionIds(role) : [];
    return {
        account: user.account,
        displayName: user.displayName,
        isSuperAdmin: isPlatformSuperAdmin(user.account),
        userId: user.id,
        tenantId: user.tenantId,
        roleId: user.roleId,
        roleName: role?.name ?? '未分配角色',
        isTenantAdmin: Boolean(role?.isTenantAdmin),
        permissionIds,
        alarmRuleCategoryScopes: role?.alarmRuleCategoryScopes,
    };
}

export function toPlatformSessionUser(
    user: SystemUserRecord,
    roles: SystemRoleRecord[] = [],
): PlatformSessionUser {
    if (roles.length) {
        return buildSessionFromUser(user, roles);
    }
    return {
        account: user.account,
        displayName: user.displayName,
        isSuperAdmin: isPlatformSuperAdmin(user.account),
        userId: user.id,
        tenantId: user.tenantId,
        roleId: user.roleId,
        roleName: '',
        isTenantAdmin: false,
        permissionIds: [],
    };
}

export function rehydrateSessionUser(
    session: PlatformSessionUser,
    users: SystemUserRecord[],
    roles: SystemRoleRecord[],
): PlatformSessionUser {
    const matchedUser = users.find((item) => item.id === session.userId || item.account === session.account);
    if (!matchedUser) {
        return session;
    }
    return buildSessionFromUser(matchedUser, roles);
}

export function resolveUserPassword(user: SystemUserRecord): string {
    return user.password?.trim() || DEFAULT_USER_INIT_PASSWORD;
}

export function authenticateCredentials(
    account: string,
    password: string,
    users: SystemUserRecord[],
): LoginResult {
    const normalizedAccount = account.trim();
    const normalizedPassword = password;

    if (!normalizedAccount) {
        return { ok: false, reason: 'account_empty' };
    }
    if (!normalizedPassword) {
        return { ok: false, reason: 'password_empty' };
    }

    const matchedUser = users.find((item) => item.account === normalizedAccount);
    if (!matchedUser) {
        return { ok: false, reason: 'invalid_credentials' };
    }
    if (matchedUser.status === '冻结') {
        return { ok: false, reason: 'account_frozen' };
    }
    if (resolveUserPassword(matchedUser) !== normalizedPassword) {
        return { ok: false, reason: 'invalid_credentials' };
    }

    return { ok: true, user: toPlatformSessionUser(matchedUser) };
}

function parseStoredSession(raw: string | null): PlatformSessionUser | null {
    if (!raw) return null;
    try {
        const parsed = JSON.parse(raw) as Partial<PlatformSessionUser>;
        if (
            typeof parsed.account === 'string'
            && parsed.account.trim()
            && typeof parsed.displayName === 'string'
            && typeof parsed.isSuperAdmin === 'boolean'
        ) {
            return {
                account: parsed.account.trim(),
                displayName: parsed.displayName,
                isSuperAdmin: parsed.isSuperAdmin,
            };
        }
    } catch {
        return null;
    }
    return null;
}

export function loadPersistedSession(): PlatformSessionUser | null {
    if (typeof window === 'undefined') {
        return null;
    }
    return parseStoredSession(localStorage.getItem(REMEMBER_STORAGE_KEY))
        ?? parseStoredSession(sessionStorage.getItem(SESSION_STORAGE_KEY));
}

export function loadRememberedAccount(): string {
    if (typeof window === 'undefined') {
        return '';
    }
    return localStorage.getItem('iot-platform-remember-account') ?? '';
}

export function persistSession(user: PlatformSessionUser, remember = false): void {
    if (typeof window === 'undefined') {
        return;
    }
    const payload = JSON.stringify(user);
    if (remember) {
        localStorage.setItem(REMEMBER_STORAGE_KEY, payload);
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
        return;
    }
    sessionStorage.setItem(SESSION_STORAGE_KEY, payload);
    localStorage.removeItem(REMEMBER_STORAGE_KEY);
}

export function persistRememberedAccount(account: string, remember: boolean): void {
    if (typeof window === 'undefined') {
        return;
    }
    if (remember && account.trim()) {
        localStorage.setItem('iot-platform-remember-account', account.trim());
        return;
    }
    localStorage.removeItem('iot-platform-remember-account');
}

export function clearPersistedSession(): void {
    if (typeof window === 'undefined') {
        return;
    }
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    localStorage.removeItem(REMEMBER_STORAGE_KEY);
}

/** 读取当前会话用户；优先使用登录态，其次兼容地址栏 ?as=tenant */
export function getPlatformSessionUser(): PlatformSessionUser {
    const stored = loadPersistedSession();
    if (stored) {
        return stored;
    }
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

export function getLoginErrorMessage(reason: LoginFailureReason): string {
    switch (reason) {
        case 'account_empty':
            return '请输入账号';
        case 'password_empty':
            return '请输入密码';
        case 'account_frozen':
            return '账号已冻结，请联系管理员';
        case 'invalid_credentials':
        default:
            return '账号或密码错误';
    }
}
