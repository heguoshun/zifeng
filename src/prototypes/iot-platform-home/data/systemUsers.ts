import { generateTenantPassword } from './tenants';
import { assignListSampleAvatars } from './userAvatars';

export type SystemUserStatus = '正常' | '冻结';
export type SystemUserGender = '男' | '女';

export type SystemUserRecord = {
    id: string;
    tenantId: string;
    displayName: string;
    account: string;
    password?: string;
    phone: string;
    roleId: string;
    departmentId: string;
    avatar?: string;
    gender: SystemUserGender;
    birthday: string;
    email?: string;
    status: SystemUserStatus;
    createdAt: string;
};

export const SYSTEM_USER_STATUS_OPTIONS = ['全部', '正常', '冻结'] as const;
export const SYSTEM_USER_GENDER_OPTIONS: SystemUserGender[] = ['男', '女'];

export function generateSystemUserId(): string {
    return `user-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

export function generateSystemUserPassword(): string {
    return generateTenantPassword();
}

export function formatSystemUserNow(): string {
    const now = new Date();
    const pad = (value: number) => String(value).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} `
        + `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

export function createInitialSystemUsers(): SystemUserRecord[] {
    const users: SystemUserRecord[] = [
        {
            id: 'user-test-1',
            tenantId: 'tenant-jiahuan',
            displayName: '测试测试',
            account: 'test',
            phone: '19242499281',
            roleId: 'role-jiahuan-iot',
            departmentId: 'dept-jiahuan-root',
            gender: '女',
            birthday: '1995-06-18',
            email: 'test@example.com',
            status: '正常',
            createdAt: '2025-06-12 09:20:15',
        },
        {
            id: 'user-zhanghe',
            tenantId: 'tenant-jiahuan',
            displayName: '张赫',
            account: 'zhanghe',
            phone: '19242499281',
            roleId: 'role-jiahuan-iot',
            departmentId: 'dept-jiahuan-root',
            gender: '男',
            birthday: '1990-03-08',
            email: 'zhanghe@jiahuan.com',
            status: '正常',
            createdAt: '2025-05-20 14:32:10',
        },
        {
            id: 'user-superadmin',
            tenantId: 'tenant-jiahuan',
            displayName: '超管',
            account: 'superadmin',
            phone: '18947728990',
            roleId: 'role-jiahuan-admin',
            departmentId: 'dept-jiahuan-root',
            gender: '男',
            birthday: '1988-01-01',
            status: '正常',
            createdAt: '2025-01-01 10:00:00',
        },
        {
            id: 'user-lisi',
            tenantId: 'tenant-nanjing',
            displayName: '李四',
            account: 'lisi',
            phone: '13812345678',
            roleId: 'role-nanjing-iot',
            departmentId: 'dept-nanjing-root',
            gender: '男',
            birthday: '1992-11-22',
            status: '正常',
            createdAt: '2025-07-02 11:05:36',
        },
        {
            id: 'user-wangwu',
            tenantId: 'tenant-jiahuan',
            displayName: '王五',
            account: 'wangwu',
            phone: '13987654321',
            roleId: 'role-jiahuan-ops',
            departmentId: 'dept-jiahuan-2',
            gender: '男',
            birthday: '1993-08-15',
            status: '冻结',
            createdAt: '2025-07-03 16:18:42',
        },
        {
            id: 'user-liruili',
            tenantId: 'tenant-jiahuan',
            displayName: '李瑞瑞',
            account: 'liruili',
            phone: '19242499282',
            roleId: 'role-jiahuan-ops',
            departmentId: 'dept-jiahuan-1-2',
            gender: '女',
            birthday: '1996-02-14',
            status: '正常',
            createdAt: '2025-07-05 10:22:18',
        },
        {
            id: 'user-zhanglinlin',
            tenantId: 'tenant-jiahuan',
            displayName: '张琳琳',
            account: 'zhanglinlin',
            phone: '19242499283',
            roleId: 'role-jiahuan-iot',
            departmentId: 'dept-jiahuan-2',
            gender: '女',
            birthday: '1994-09-30',
            status: '正常',
            createdAt: '2025-06-18 08:45:33',
        },
        {
            id: 'user-wujun',
            tenantId: 'tenant-jiahuan',
            displayName: '武俊',
            account: 'wujun',
            phone: '19242499284',
            roleId: 'role-jiahuan-ops',
            departmentId: 'dept-jiahuan-1',
            gender: '男',
            birthday: '1991-12-05',
            status: '正常',
            createdAt: '2025-07-01 13:10:50',
        },
        {
            id: 'user-zhaomin',
            tenantId: 'tenant-jiahuan',
            displayName: '赵敏',
            account: 'zhaomin',
            phone: '19242499285',
            roleId: 'role-jiahuan-iot',
            departmentId: 'dept-jiahuan-3',
            gender: '女',
            birthday: '1997-04-20',
            status: '正常',
            createdAt: '2025-06-24 11:38:09',
        },
        {
            id: 'user-sunqiang',
            tenantId: 'tenant-jiahuan',
            displayName: '孙强',
            account: 'sunqiang',
            phone: '19242499286',
            roleId: 'role-jiahuan-ops',
            departmentId: 'dept-jiahuan-4',
            gender: '男',
            birthday: '1989-07-12',
            status: '正常',
            createdAt: '2025-06-10 15:55:27',
        },
        {
            id: 'user-zhoujie',
            tenantId: 'tenant-jiahuan',
            displayName: '周洁',
            account: 'zhoujie',
            phone: '19242499287',
            roleId: 'role-jiahuan-iot',
            departmentId: 'dept-jiahuan-5',
            gender: '女',
            birthday: '1993-01-28',
            status: '正常',
            createdAt: '2025-07-08 09:12:44',
        },
        {
            id: 'user-maliu',
            tenantId: 'tenant-jiahuan',
            displayName: '马柳',
            account: 'maliu',
            phone: '19242499288',
            roleId: 'role-jiahuan-ops',
            departmentId: 'dept-jiahuan-6',
            gender: '男',
            birthday: '1992-06-06',
            status: '正常',
            createdAt: '2025-05-30 17:04:22',
        },
        {
            id: 'user-liuqian',
            tenantId: 'tenant-jiahuan',
            displayName: '刘倩',
            account: 'liuqian',
            phone: '19242499289',
            roleId: 'role-jiahuan-iot',
            departmentId: 'dept-jiahuan-1-1',
            gender: '女',
            birthday: '1998-10-16',
            status: '正常',
            createdAt: '2025-06-15 14:28:51',
        },
        {
            id: 'user-chenwei',
            tenantId: 'tenant-jiahuan',
            displayName: '陈伟',
            account: 'chenwei',
            phone: '19242499290',
            roleId: 'role-jiahuan-admin',
            departmentId: 'dept-jiahuan-root',
            gender: '男',
            birthday: '1985-03-25',
            status: '正常',
            createdAt: '2025-04-22 08:55:12',
        },
        {
            id: 'user-huangli',
            tenantId: 'tenant-jiahuan',
            displayName: '黄丽',
            account: 'huangli',
            phone: '19242499291',
            roleId: 'role-jiahuan-ops',
            departmentId: 'dept-jiahuan-2',
            gender: '女',
            birthday: '1995-11-08',
            status: '正常',
            createdAt: '2025-07-12 10:33:40',
        },
        {
            id: 'user-linfei',
            tenantId: 'tenant-jiahuan',
            displayName: '林飞',
            account: 'linfei',
            phone: '19242499292',
            roleId: 'role-jiahuan-iot',
            departmentId: 'dept-jiahuan-3',
            gender: '男',
            birthday: '1990-08-19',
            status: '冻结',
            createdAt: '2025-06-28 16:19:07',
        },
    ];

    return assignListSampleAvatars(users);
}
