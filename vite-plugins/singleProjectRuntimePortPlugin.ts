import type { Plugin } from 'vite';

import { releaseListeningProcessesOnPort } from './utils/portOccupancy';

export function singleProjectRuntimePortPlugin(port: number): Plugin {
  return {
    name: 'single-project-runtime-port',
    enforce: 'pre',
    configureServer() {
      const releasedPids = releaseListeningProcessesOnPort(port);
      if (releasedPids.length > 0) {
        console.log(
          `🔄 Released runtime port ${port} from previous project process${releasedPids.length > 1 ? 'es' : ''}: ${releasedPids.join(', ')}`,
        );
      }
    },
  };
}
