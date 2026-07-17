import { describe, expect, it, vi } from 'vitest';

import { singleProjectRuntimePortPlugin } from './singleProjectRuntimePortPlugin';
import * as portOccupancy from './utils/portOccupancy';

describe('single project runtime port plugin', () => {
  it('releases the fixed runtime port before Vite starts listening', () => {
    const releasePort = vi
      .spyOn(portOccupancy, 'releaseListeningProcessesOnPort')
      .mockReturnValue([123, 456]);
    const plugin = singleProjectRuntimePortPlugin(51720);

    expect(plugin.enforce).toBe('pre');
    expect(typeof plugin.configureServer).toBe('function');
    (plugin.configureServer as () => void)();

    expect(releasePort).toHaveBeenCalledOnce();
    expect(releasePort).toHaveBeenCalledWith(51720);
    releasePort.mockRestore();
  });
});
