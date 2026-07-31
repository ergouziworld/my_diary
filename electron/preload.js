const { contextBridge } = require('electron');

// 只暴露最小必要的信息，保持安全隔离
// Next.js 应用的所有逻辑通过自身的 API Routes 处理，不需要 IPC
contextBridge.exposeInMainWorld('__electron__', {
  platform: process.platform,
});
