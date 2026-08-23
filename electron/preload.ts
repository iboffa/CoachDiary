import { contextBridge, ipcRenderer } from 'electron';

const ALLOWED_CHANNELS = ['shell:openExternal'];

contextBridge.exposeInMainWorld('electronAPI', {
  invoke: (channel: string, ...args: unknown[]): Promise<unknown> => {
    if (!ALLOWED_CHANNELS.includes(channel)) {
      return Promise.reject(new Error(`Channel not allowed: ${channel}`));
    }
    return ipcRenderer.invoke(channel, ...args);
  },
  onAuthCallback: (callback: (url: string) => void): void => {
    ipcRenderer.on('auth:callback', (_event, url: string) => callback(url));
  },
});
