// ── System Parameter Management Data Module ──

export type SystemParamRecord = {
    id: number;
    name: string;
    key: string;
    value: string;
    isSystemBuiltIn: boolean;
    remark: string;
    createdAt: string;
};

export function generateParamId(existingIds: number[]): number {
    const maxId = existingIds.length > 0 ? Math.max(...existingIds) : 0;
    return maxId + 1;
}

export function createInitialParams(): SystemParamRecord[] {
    return [
        {
            id: 1,
            name: '主框架页-默认皮肤样式名称',
            key: 'sys.index.skinName',
            value: 'skin-red',
            isSystemBuiltIn: true,
            remark: '蓝色 skin-red、绿色 skin-green、紫色 skin-purple',
            createdAt: '2023-05-09 16:56:22',
        },
        {
            id: 2,
            name: '用户管理-账号初始密码',
            key: 'sys.user.initPassword',
            value: '12345678',
            isSystemBuiltIn: true,
            remark: '初始化密码 12345678',
            createdAt: '2023-05-09 16:56:22',
        },
        {
            id: 3,
            name: '主框架页-侧边栏主题',
            key: 'sys.index.sideTheme',
            value: 'theme-dark',
            isSystemBuiltIn: true,
            remark: '深色主题theme-dark，浅色主题theme-light',
            createdAt: '2023-05-09 16:56:22',
        },
        {
            id: 4,
            name: '账号自助-验证码开关',
            key: 'sys.account.captchaEnabled',
            value: 'true',
            isSystemBuiltIn: true,
            remark: '是否开启验证码功能（true:开启, false:关闭）',
            createdAt: '2023-05-09 16:56:22',
        },
        {
            id: 5,
            name: '账号自助-是否开启用户注册',
            key: 'sys.account.registerUser',
            value: 'false',
            isSystemBuiltIn: true,
            remark: '是否开启注册用户功能（true:开启, false:关闭）',
            createdAt: '2023-05-09 16:56:22',
        },
        {
            id: 6,
            name: 'OSS预览列表资源开关',
            key: 'sys.oss.previewListResource',
            value: 'true',
            isSystemBuiltIn: true,
            remark: 'true:开启, false:关闭',
            createdAt: '2023-05-09 16:56:22',
        },
        {
            id: 7,
            name: '主框架页-是否开启动态标题',
            key: 'sys.index.enableDynamicTitle',
            value: 'false',
            isSystemBuiltIn: true,
            remark: 'true:开启, false:关闭',
            createdAt: '2023-05-09 16:56:22',
        },
        {
            id: 8,
            name: '用户管理-密码最大错误次数',
            key: 'sys.user.maxRetryCount',
            value: '5',
            isSystemBuiltIn: true,
            remark: '密码最大错误次数，超过后锁定账号',
            createdAt: '2023-05-09 16:56:22',
        },
        {
            id: 9,
            name: '用户管理-账号锁定时长(分钟)',
            key: 'sys.user.lockDuration',
            value: '10',
            isSystemBuiltIn: true,
            remark: '账号锁定时长，单位：分钟',
            createdAt: '2023-05-09 16:56:22',
        },
        {
            id: 10,
            name: '系统监控-数据刷新间隔(秒)',
            key: 'sys.monitor.refreshInterval',
            value: '30',
            isSystemBuiltIn: false,
            remark: '数据自动刷新间隔，单位：秒',
            createdAt: '2023-05-09 16:56:22',
        },
        {
            id: 11,
            name: '文件上传-最大文件大小(MB)',
            key: 'sys.file.maxSize',
            value: '50',
            isSystemBuiltIn: false,
            remark: '文件上传最大大小限制，单位：MB',
            createdAt: '2023-05-09 16:56:22',
        },
    ];
}
