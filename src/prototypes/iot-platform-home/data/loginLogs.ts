export type LoginLogStatus = '成功' | '失败';

export type LoginLogRecord = {
    id: string;
    username: string;
    address: string;
    status: LoginLogStatus;
    operatingSystem: string;
    accessTime: string;
    browser?: string;
    message?: string;
};

export const LOGIN_LOG_STATUS_OPTIONS = ['全部', '成功', '失败'] as const;

export function createInitialLoginLogs(): LoginLogRecord[] {
    return [
        {
            id: '1776062265026',
            username: 'admin',
            address: '10.0.98.54',
            status: '成功',
            operatingSystem: 'Windows 10 or Windows Server 2016',
            accessTime: '2026-04-13 14:37:45',
            browser: 'Chrome 122',
        },
        {
            id: '1776062181042',
            username: 'admin',
            address: '10.0.98.54',
            status: '成功',
            operatingSystem: 'Windows 10 or Windows Server 2016',
            accessTime: '2026-04-13 14:36:21',
            browser: 'Chrome 122',
        },
        {
            id: '1776059923188',
            username: 'operator',
            address: '10.6.126.198',
            status: '成功',
            operatingSystem: 'OSX',
            accessTime: '2026-04-13 13:58:43',
            browser: 'Safari 17',
        },
        {
            id: '1776058800451',
            username: 'zhangsan',
            address: '192.168.1.24',
            status: '失败',
            operatingSystem: 'Windows 11',
            accessTime: '2026-04-13 13:40:00',
            browser: 'Edge 121',
            message: '密码错误',
        },
        {
            id: '1776051022764',
            username: 'admin',
            address: '10.0.98.54',
            status: '成功',
            operatingSystem: 'Windows 10 or Windows Server 2016',
            accessTime: '2026-04-13 11:30:22',
            browser: 'Chrome 122',
        },
        {
            id: '1776047164089',
            username: 'lisi',
            address: '10.6.126.198',
            status: '成功',
            operatingSystem: 'Linux',
            accessTime: '2026-04-13 10:26:04',
            browser: 'Firefox 124',
        },
        {
            id: '1776041029831',
            username: 'wangwu',
            address: '172.16.0.8',
            status: '失败',
            operatingSystem: 'Android',
            accessTime: '2026-04-13 08:43:49',
            browser: 'Mobile Chrome',
            message: '账号已锁定',
        },
        {
            id: '1776038841205',
            username: 'admin',
            address: '10.0.98.54',
            status: '成功',
            operatingSystem: 'Windows 10 or Windows Server 2016',
            accessTime: '2026-04-13 08:07:21',
            browser: 'Chrome 122',
        },
    ];
}
