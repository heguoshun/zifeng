import { networkInterfaces } from 'node:os';

export function getLocalIP(): string {
  try {
    const interfaces = networkInterfaces();

    for (const nets of Object.values(interfaces)) {
      for (const net of nets || []) {
        if (net.family === 'IPv4' && !net.internal) {
          return net.address;
        }
      }
    }
  } catch {
    // networkInterfaces() may fail in restricted environments
  }

  return 'localhost';
}
