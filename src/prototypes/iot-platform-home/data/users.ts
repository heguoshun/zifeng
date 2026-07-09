export type AssigneeRecord = {
    id: string;
    name: string;
    phone: string;
    role: string;
    departmentId: string;
};

export const MOCK_ASSIGNEES: AssigneeRecord[] = [
    { id: 'u1', name: '张赫', phone: '19242499281', role: '运维人员', departmentId: 'dept-jiahuan-1-2' },
    { id: 'u2', name: '张三', phone: '13800138001', role: '运维人员', departmentId: 'dept-jiahuan-1-1' },
    { id: 'u3', name: '李四', phone: '13800138002', role: '管理人员', departmentId: 'dept-jiahuan-1-2' },
    { id: 'u4', name: '王五', phone: '13800138003', role: '技术人员', departmentId: 'dept-jiahuan-1-3' },
    { id: 'u5', name: '赵六', phone: '13800138004', role: '运维人员', departmentId: 'dept-jiahuan-2' },
    { id: 'u6', name: '陈七', phone: '13800138005', role: '管理人员', departmentId: 'dept-jiahuan-1-1' },
    { id: 'u7', name: '周八', phone: '13800138006', role: '技术人员', departmentId: 'dept-jiahuan-1-2' },
    { id: 'u8', name: '吴九', phone: '13800138007', role: '运维人员', departmentId: 'dept-jiahuan-1-3' },
    { id: 'u9', name: '郑十', phone: '13800138008', role: '管理人员', departmentId: 'dept-jiahuan-1' },
    { id: 'u10', name: '孙十一', phone: '13800138009', role: '技术人员', departmentId: 'dept-jiahuan-1-1' },
    { id: 'u11', name: '钱十二', phone: '13800138010', role: '运维人员', departmentId: 'dept-jiahuan-1-2' },
    { id: 'u12', name: '冯十三', phone: '13800138011', role: '管理人员', departmentId: 'dept-jiahuan-1-3' },
];
