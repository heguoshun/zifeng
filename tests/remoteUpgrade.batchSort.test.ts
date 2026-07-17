import { describe, expect, it } from 'vitest';
import {
    isApprovedUpgradeTask,
    isUpgradeScheduleReached,
    mergePackageBatches,
    resolveBatchStatusFromTask,
    resolveDeviceStatusForBatch,
    sortBatchesByAuditApproval,
    upgradeTaskToBatch,
    type UpgradeTaskBatchRecord,
    type UpgradeTaskRecord,
} from '../src/prototypes/iot-platform-home/data/remoteUpgrade';

function createBatch(id: string, upgradeTime: string): UpgradeTaskBatchRecord {
    return {
        id,
        batchNo: id,
        packageKind: 'firmware',
        packageId: 'fw-001',
        status: '进行中',
        versionBefore: 'V1.0',
        versionAfter: 'V2.0',
        deviceCount: 10,
        scheduleType: '立即升级',
        upgradeTime,
    };
}

function createTask(
    id: string,
    overrides: Partial<UpgradeTaskRecord> = {},
): UpgradeTaskRecord {
    return {
        id,
        packageKind: 'firmware',
        packageId: 'fw-001',
        packageName: '测试固件',
        targetVersion: 'V2.0',
        scope: '全部设备',
        deviceIds: [],
        scheduleType: '定时升级',
        scheduledAt: '2026-07-15 12:00:00',
        retryStrategy: '不重试',
        timeout: '30 分钟',
        status: '执行中',
        createdAt: '2026-07-15 10:00:00',
        ...overrides,
    };
}

describe('sortBatchesByAuditApproval', () => {
    it('sorts approved batches by audit time ascending', () => {
        const batches = [
            createBatch('task-3', '2026-07-15 13:00:00'),
            createBatch('task-1', '2026-07-15 11:00:00'),
            createBatch('task-2', '2026-07-15 12:00:00'),
        ];
        const tasks = [
            createTask('task-1', { auditTime: '2026-07-15 11:10:00' }),
            createTask('task-2', { auditTime: '2026-07-15 12:10:00' }),
            createTask('task-3', { auditTime: '2026-07-15 13:10:00' }),
        ];

        const sorted = sortBatchesByAuditApproval(batches, tasks);
        expect(sorted.map((item) => item.id)).toEqual(['task-1', 'task-2', 'task-3']);
    });

    it('places pending audit batches after approved batches', () => {
        const batches = [
            createBatch('task-pending', '2026-07-15 09:00:00'),
            createBatch('task-approved', '2026-07-15 14:00:00'),
        ];
        const tasks = [
            createTask('task-pending', { status: '待审核', createdAt: '2026-07-15 09:00:00' }),
            createTask('task-approved', {
                status: '待执行',
                auditTime: '2026-07-15 14:05:00',
                createdAt: '2026-07-15 14:00:00',
            }),
        ];

        const sorted = sortBatchesByAuditApproval(batches, tasks);
        expect(sorted.map((item) => item.id)).toEqual(['task-approved', 'task-pending']);
    });
});

describe('upgrade batch lifecycle', () => {
    it('excludes pending and rejected tasks from merged batch list', () => {
        const tasks = [
            createTask('task-pending', { status: '待审核' }),
            createTask('task-rejected', { status: '审核驳回', auditTime: '2026-07-15 10:00:00' }),
            createTask('task-approved', {
                status: '待执行',
                auditTime: '2026-07-15 11:00:00',
                scheduledAt: '2026-07-20 09:00:00',
            }),
        ];

        const batches = mergePackageBatches('fw-001', 'firmware', 'V2.0', tasks, []);
        const taskBatchIds = batches
            .map((item) => item.id)
            .filter((id) => id.startsWith('task-'));

        expect(taskBatchIds).toEqual(['task-approved']);
        expect(isApprovedUpgradeTask(tasks[0])).toBe(false);
        expect(isApprovedUpgradeTask(tasks[2])).toBe(true);
    });

    it('maps approved pending tasks to 未开始 before scheduled upgrade time', () => {
        const now = new Date('2026-07-15 10:00:00').getTime();
        const task = createTask('task-approved', {
            status: '待执行',
            auditTime: '2026-07-15 09:30:00',
            scheduledAt: '2026-07-20 09:00:00',
        });

        expect(resolveBatchStatusFromTask(task, now)).toBe('未开始');
        expect(upgradeTaskToBatch(task, 'V2.0', now).status).toBe('未开始');
        expect(upgradeTaskToBatch(task, 'V2.0', now).upgradeTime).toBe('2026-07-20 09:00:00');
    });

    it('maps approved pending tasks to 进行中 after scheduled upgrade time', () => {
        const now = new Date('2026-07-20 10:00:00').getTime();
        const task = createTask('task-approved', {
            status: '待执行',
            auditTime: '2026-07-15 09:30:00',
            scheduledAt: '2026-07-20 09:00:00',
        });

        expect(isUpgradeScheduleReached(task.scheduledAt, now)).toBe(true);
        expect(resolveBatchStatusFromTask(task, now)).toBe('进行中');
    });

    it('prefers task-derived batch status over stale extraBatches entries', () => {
        const now = new Date('2026-07-15 10:00:00').getTime();
        const task = createTask('task-approved', {
            status: '待执行',
            auditTime: '2026-07-15 09:30:00',
            scheduledAt: '2026-07-20 09:00:00',
        });
        const staleBatch = {
            ...upgradeTaskToBatch(task, 'V2.0', now),
            status: '进行中' as const,
        };

        const batches = mergePackageBatches('fw-001', 'firmware', 'V2.0', [task], [staleBatch], now);
        const approvedBatch = batches.find((item) => item.id === 'task-approved');

        expect(approvedBatch?.status).toBe('未开始');
    });

    it('hides demo mock batches when approved tasks exist', () => {
        const task = createTask('task-approved', {
            status: '待执行',
            auditTime: '2026-07-15 09:30:00',
            scheduledAt: '2026-07-20 09:00:00',
        });

        const batches = mergePackageBatches('fw-001', 'firmware', 'V2.0', [task], []);
        expect(batches.some((item) => item.id.startsWith('batch-fw-001-'))).toBe(false);
        expect(batches.some((item) => item.id === 'task-approved')).toBe(true);
    });
});

describe('resolveDeviceStatusForBatch', () => {
    it('returns 待升级 for batches that have not started', () => {
        const batch = createBatch('task-1', '2026-07-20 09:00:00');
        batch.status = '未开始';

        const devices = Array.from({ length: 5 }, (_, index) => resolveDeviceStatusForBatch(batch, index));
        expect(new Set(devices)).toEqual(new Set(['待升级']));
    });

    it('returns 取消升级 only when batch is cancelled', () => {
        const batch = createBatch('task-1', '2026-07-20 09:00:00');
        batch.status = '未开始';

        expect(resolveDeviceStatusForBatch(batch, 0, true)).toBe('取消升级');
        expect(resolveDeviceStatusForBatch(batch, 0, false)).toBe('待升级');
    });
});
