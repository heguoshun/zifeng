export type SystemDepartmentRecord = {
    id: string;
    tenantId: string;
    parentId: string | null;
    name: string;
    code: string;
    type: 'company' | 'department';
    head: string;
    phone: string;
    notes: string;
};

// Flat storage; tree structure is derived from parentId.
export const SYSTEM_DEPARTMENTS: SystemDepartmentRecord[] = [
    {
        id: 'dept-jiahuan-root',
        tenantId: 'tenant-jiahuan',
        parentId: null,
        name: '嘉环科技',
        code: '28484992',
        type: 'company',
        head: '张赫',
        phone: '18929301839',
        notes: '嘉环科技有限公司',
    },
    { id: 'dept-jiahuan-1', tenantId: 'tenant-jiahuan', parentId: 'dept-jiahuan-root', name: '总经办', code: '28484992-01', type: 'department', head: '李四', phone: '13800010001', notes: '' },
    { id: 'dept-jiahuan-1-1', tenantId: 'tenant-jiahuan', parentId: 'dept-jiahuan-1', name: '行政管理组', code: '28484992-01-01', type: 'department', head: '', phone: '', notes: '' },
    { id: 'dept-jiahuan-1-2', tenantId: 'tenant-jiahuan', parentId: 'dept-jiahuan-1', name: '法务合规组', code: '28484992-01-02', type: 'department', head: '', phone: '', notes: '' },
    { id: 'dept-jiahuan-1-3', tenantId: 'tenant-jiahuan', parentId: 'dept-jiahuan-1', name: '品牌公关组', code: '28484992-01-03', type: 'department', head: '', phone: '', notes: '' },
    { id: 'dept-jiahuan-2', tenantId: 'tenant-jiahuan', parentId: 'dept-jiahuan-root', name: '技术研发中心', code: '28484992-02', type: 'department', head: '', phone: '', notes: '' },
    { id: 'dept-jiahuan-3', tenantId: 'tenant-jiahuan', parentId: 'dept-jiahuan-root', name: '产品与解决方案部', code: '28484992-03', type: 'department', head: '', phone: '', notes: '' },
    { id: 'dept-jiahuan-4', tenantId: 'tenant-jiahuan', parentId: 'dept-jiahuan-root', name: '市场拓展部', code: '28484992-04', type: 'department', head: '', phone: '', notes: '' },
    { id: 'dept-jiahuan-5', tenantId: 'tenant-jiahuan', parentId: 'dept-jiahuan-root', name: '运维服务中心', code: '28484992-05', type: 'department', head: '', phone: '', notes: '' },
    { id: 'dept-jiahuan-6', tenantId: 'tenant-jiahuan', parentId: 'dept-jiahuan-root', name: '质量管理部', code: '28484992-06', type: 'department', head: '', phone: '', notes: '' },

    {
        id: 'dept-shuiwu-root',
        tenantId: 'tenant-suzhou',
        parentId: null,
        name: '水务集团',
        code: '38492001',
        type: 'company',
        head: '王明',
        phone: '13900020001',
        notes: '水务集团有限公司',
    },
    { id: 'dept-shuiwu-1', tenantId: 'tenant-suzhou', parentId: 'dept-shuiwu-root', name: '供水调度中心', code: '38492001-01', type: 'department', head: '', phone: '', notes: '' },
    { id: 'dept-shuiwu-2', tenantId: 'tenant-suzhou', parentId: 'dept-shuiwu-root', name: '管网运维部', code: '38492001-02', type: 'department', head: '', phone: '', notes: '' },

    {
        id: 'dept-nanjing-root',
        tenantId: 'tenant-nanjing',
        parentId: null,
        name: '南京分公司',
        code: '18493002',
        type: 'company',
        head: '赵六',
        phone: '13700030001',
        notes: '嘉环南京分公司',
    },
];

export function createInitialDepartments(): SystemDepartmentRecord[] {
    return SYSTEM_DEPARTMENTS.map((d) => ({ ...d }));
}

export function getDepartmentsByTenant(tenantId: string): SystemDepartmentRecord[] {
    if (!tenantId) return [];
    return SYSTEM_DEPARTMENTS.filter((item) => item.tenantId === tenantId);
}

export function getDepartmentLabel(departmentId: string): string {
    return SYSTEM_DEPARTMENTS.find((item) => item.id === departmentId)?.name ?? '—';
}

export function generateDeptCode(): string {
    return String(Math.floor(10000000 + Math.random() * 90000000));
}

export function generateDeptId(): string {
    return `dept-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}
