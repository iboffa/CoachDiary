import { contextBridge, ipcRenderer } from 'electron';

const ALLOWED_CHANNELS = [
  'players:list', 'players:get', 'players:save', 'players:delete',
  'player-notes:list', 'player-notes:save', 'player-notes:delete',
  'plays:list', 'plays:get', 'plays:save', 'plays:delete',
  'training:list', 'training:get', 'training:save', 'training:delete',
  'season:list', 'season:get', 'season:save', 'season:delete',
  'game-notes:list', 'game-notes:save', 'game-notes:delete',
];

contextBridge.exposeInMainWorld('electronAPI', {
  invoke: (channel: string, ...args: unknown[]): Promise<unknown> => {
    if (!ALLOWED_CHANNELS.includes(channel)) {
      return Promise.reject(new Error(`Channel not allowed: ${channel}`));
    }
    return ipcRenderer.invoke(channel, ...args);
  },
});
