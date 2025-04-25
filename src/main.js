const { app, BrowserWindow, ipcMain, globalShortcut, Tray, Menu, clipboard } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const Store = require('electron-store');

// Create a store for settings
const store = new Store();

// Global variables
let mainWindow;
let tray;
let isQuitting = false;

function createWindow() {
  // Get saved position or use default values
  const savedPosition = store.get('windowPosition', [undefined, undefined]);
  
  // Create the main window
  mainWindow = new BrowserWindow({
    width: 400,
    height: 600,
    frame: false,
    transparent: true,
    alwaysOnTop: store.get('alwaysOnTop', true),
    resizable: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    icon: path.join(__dirname, '../assets/icon.ico'),
    // Set position if saved
    ...(savedPosition[0] !== undefined && savedPosition[1] !== undefined 
        ? { x: savedPosition[0], y: savedPosition[1] } 
        : {})
  });

  // Load the HTML file
  mainWindow.loadURL(isDev
    ? 'http://localhost:8080'
    : `file://${path.join(__dirname, '../dist/index.html')}`
  );

  // Save position when window is moved
  mainWindow.on('moved', () => {
    const position = mainWindow.getPosition();
    store.set('windowPosition', position);
  });

  // Don't actually close the app when the window is closed
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
      return false;
    }
  });

  // Create tray icon
  createTray();

  // Register global shortcuts
  globalShortcut.register('Alt+Space', () => {
    if (!mainWindow.isVisible()) {
      mainWindow.show();
    }
    mainWindow.webContents.send('toggle-recording');
  });

  // Open DevTools in development mode
  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }
}

function createTray() {
  tray = new Tray(path.join(__dirname, '../assets/microphone.png'));
  const contextMenu = Menu.buildFromTemplate([
    { 
      label: 'Show/Hide Window', 
      click: () => {
        if (mainWindow.isVisible()) {
          mainWindow.hide();
        } else {
          mainWindow.show();
        }
      } 
    },
    { 
      label: 'Toggle Recording (Alt+Space)', 
      click: () => {
        mainWindow.webContents.send('toggle-recording');
      } 
    },
    { type: 'separator' },
    { 
      label: 'Always on Top', 
      type: 'checkbox',
      checked: store.get('alwaysOnTop', true),
      click: (menuItem) => {
        const alwaysOnTop = menuItem.checked;
        store.set('alwaysOnTop', alwaysOnTop);
        mainWindow.setAlwaysOnTop(alwaysOnTop);
      }
    },
    { type: 'separator' },
    { 
      label: 'Exit', 
      click: () => {
        isQuitting = true;
        app.quit();
      } 
    }
  ]);
  
  tray.setToolTip('Speech to Text App');
  tray.setContextMenu(contextMenu);
  
  tray.on('click', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
    }
  });
}

// Set up IPC handlers
function setupIPC() {
  // Handle paste text request
  ipcMain.on('paste-text', (_, text) => {
    // Save text to clipboard
    clipboard.writeText(text);
    
    // Send notification back to the renderer
    mainWindow.webContents.send('text-copied', text);
  });
  
  // Hide window
  ipcMain.on('minimize-app', () => {
    mainWindow.hide();
  });
  
  // Save transcripts
  ipcMain.on('save-transcripts', (_, transcripts) => {
    store.set('savedTranscripts', transcripts);
  });
  
  // Get saved transcripts
  ipcMain.handle('get-saved-transcripts', () => {
    return store.get('savedTranscripts', []);
  });
  
  // Toggle minimized mode
  ipcMain.on('toggle-minimized-mode', (_, isMinimized) => {
    store.set('minimizedMode', isMinimized);
  });
  
  // Toggle always on top
  ipcMain.on('toggle-always-on-top', (_, alwaysOnTop) => {
    mainWindow.setAlwaysOnTop(alwaysOnTop);
    store.set('alwaysOnTop', alwaysOnTop);
  });
}

// App ready event
app.whenReady().then(() => {
  createWindow();
  setupIPC();
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Clean up before quitting
app.on('before-quit', () => {
  isQuitting = true;
});

// Unregister shortcuts when quitting
app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});