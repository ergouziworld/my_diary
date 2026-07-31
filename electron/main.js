const { app, BrowserWindow, shell, Menu } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const http = require('http');

const PORT = 3000;
const APP_URL = `http://localhost:${PORT}`;

let win = null;
let serverProc = null;

// 检测端口是否已经有服务在跑（比如用户已经开着 next dev）
function isServerRunning(url) {
  return new Promise((resolve) => {
    http.get(url, () => resolve(true)).on('error', () => resolve(false));
  });
}

// 轮询等待 Next.js 服务器就绪
function waitForServer(url, timeout = 90_000) {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + timeout;
    const check = () => {
      http.get(url, () => resolve())
        .on('error', () => {
          if (Date.now() > deadline) return reject(new Error('Next.js 启动超时（90s）'));
          setTimeout(check, 600);
        });
    };
    check();
  });
}

function startNextServer() {
  const root = path.join(__dirname, '..');

  // Windows 下 npm/npx 需要 shell:true 才能找到命令
  serverProc = spawn('npm', ['run', 'dev'], {
    cwd: root,
    shell: true,
    env: {
      ...process.env,
      // Electron 里运行时强制指向本地，覆盖 .env.local 里可能有的线上地址
      NEXTAUTH_URL: APP_URL,
      PORT: String(PORT),
    },
    stdio: 'pipe',
  });

  serverProc.stdout.on('data', d => process.stdout.write(d));
  serverProc.stderr.on('data', d => process.stderr.write(d));
  serverProc.on('exit', (code, signal) => {
    if (code !== 0 && signal !== 'SIGTERM') {
      console.error(`[electron] Next.js 进程异常退出 code=${code}`);
    }
  });
}

async function createWindow() {
  win = new BrowserWindow({
    width: 1340,
    height: 880,
    minWidth: 900,
    minHeight: 600,
    title: 'My Diary',
    backgroundColor: '#0f172a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // 外部链接在系统浏览器打开，不在 Electron 窗口里跳转
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (!url.startsWith(APP_URL)) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  win.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith(APP_URL)) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  win.on('closed', () => { win = null; });

  // 先显示加载页，等 Next.js 好了再切换
  await win.loadFile(path.join(__dirname, 'loading.html'));
  await waitForServer(APP_URL);
  await win.loadURL(APP_URL);
}

// 去掉默认菜单栏（可按需保留）
Menu.setApplicationMenu(null);

app.whenReady().then(async () => {
  // 如果已经有 Next.js 在跑（例如用户自己开了 npm run dev），就不重复启动
  const alreadyRunning = await isServerRunning(APP_URL);
  if (!alreadyRunning) {
    startNextServer();
  } else {
    console.log('[electron] 检测到 Next.js 已在运行，直接连接');
  }

  try {
    await createWindow();
  } catch (err) {
    console.error('[electron] 启动失败:', err.message);
    app.quit();
  }

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// 退出时一并关掉 Next.js 子进程
app.on('before-quit', () => {
  if (serverProc) {
    serverProc.kill('SIGTERM');
    serverProc = null;
  }
});
