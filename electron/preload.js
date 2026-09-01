const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('mostrador', {
  getConfig:       ()    => ipcRenderer.invoke('get-config'),
  saveConfig:      (cfg) => ipcRenderer.invoke('save-config', cfg),
  testApiKey:      (key) => ipcRenderer.invoke('test-api-key', key),
  mostradorBuscar: (q)   => ipcRenderer.invoke('mostrador-buscar', q),
  mostradorGp:     (cn)  => ipcRenderer.invoke('mostrador-gp', cn),
});
