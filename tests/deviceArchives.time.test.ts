import { describe, expect, it } from 'vitest';
import { createInitialProducts } from '../src/prototypes/iot-platform-home/data/products';
import { createInitialDevices, seedInitialLargeMeterAreaBindings } from '../src/prototypes/iot-platform-home/data/devices';
import { createInitialAreas } from '../src/prototypes/iot-platform-home/data/largeMeters';
import { createInitialDeviceArchiveRecords } from '../src/prototypes/iot-platform-home/data/deviceArchives';

describe('device archive lifecycle time', () => {
    it('uses distinct chronological timestamps for lifecycle records', () => {
        const products = createInitialProducts();
        const devices = seedInitialLargeMeterAreaBindings(
            createInitialDevices(products, new Date('2026-07-15T21:22:00')),
            products,
            createInitialAreas(),
        );
        const records = createInitialDeviceArchiveRecords(devices, products);
        const targetDeviceId = records.find((record) => record.type === 'accessory')?.deviceId;
        const lifecycle = records.filter((record) => record.deviceId === targetDeviceId);
        const byType = Object.fromEntries(lifecycle.map((record) => [record.type, record.occurredAt]));
        expect(new Set(lifecycle.map((record) => record.type))).toEqual(new Set([
            'access',
            'installation',
            'accessory',
            'user-change',
            'location-change',
            'maintenance',
            'calibration',
            'status-change',
            'other',
        ]));
        expect(new Set(lifecycle.map((record) => record.occurredAt)).size).toBe(lifecycle.length);
        expect(lifecycle.find((record) => record.type === 'calibration')?.afterValue).toContain('合格');
        expect(byType.access < byType.installation).toBe(true);
        lifecycle
            .filter((record) => record.type !== 'access' && record.type !== 'installation')
            .forEach((record) => expect(byType.installation < record.occurredAt).toBe(true));
    });
});
