import icon from '../../../resources/icon.png?asset';
import { electronApp, is, optimizer } from '@electron-toolkit/utils';
import { app, BrowserWindow, shell } from 'electron';
import { join } from 'path';

export default class CreateMainWindow {
    private _mainWindow: BrowserWindow | null = null;

    constructor() {
        app.whenReady().then(() => {
            this._createWindow();
            electronApp.setAppUserModelId('com.schemaSparkle');
            this._listeners();
            this._handleFileLoad();
            this._handleAppListeners();
        });
    }

    private _createWindow() {
        this._mainWindow = new BrowserWindow({
            minWidth: 900,
            minHeight: 670,
            show: false,
            autoHideMenuBar: true,
            titleBarStyle: 'hidden',
            title: 'SchemaSparkle',
            icon: icon,
            titleBarOverlay: {
                color: '#0f172a',
                symbolColor: '#64748b',
                height: 40,
            },
            ...(process.platform === 'linux' ? { icon } : {}),
            webPreferences: {
                preload: join(__dirname, '../preload/index.js'),
                sandbox: false,
            },
        });
    }

    private _handleAppListeners() {
        // Default open or close DevTools by F12 in development
        // and ignore CommandOrControl + R in production.
        // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
        app.on('browser-window-created', (_, window) => {
            optimizer.watchWindowShortcuts(window);
        });

        app.on('activate', () => {
            // On macOS it's common to re-create a window in the app when the
            // dock icon is clicked and there are no other windows open.
            if (BrowserWindow.getAllWindows().length === 0)
                this._createWindow();
        });

        // Method called when all windows are closed.
        //It quits the application if the platform is not darwin (macOS)
        app.on('window-all-closed', () => {
            if (process.platform !== 'darwin') {
                app.quit();
            }
        });
    }

    /**
     * Initializes the listeners for the main window.
     *
     * @private
     * @return {void} This function does not return a value.
     */
    private _listeners() {
        if (this._mainWindow === null) return;

        // Create the browser window.
        this._mainWindow.webContents.openDevTools({
            mode: 'bottom',
        });
        this._mainWindow.on('ready-to-show', () => {
            if (this._mainWindow === null) return;
            this._mainWindow.maximize();
            this._mainWindow.show();
        });
        this._mainWindow.webContents.setWindowOpenHandler((details) => {
            shell.openExternal(details.url);
            return { action: 'deny' };
        });
    }

    /**
     * @desc HMR for renderer base on electron-vite cli. Load the remote URL for development or the local html file for production.
     */
    private _handleFileLoad() {
        if (this._mainWindow === null) return;

        if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
            this._mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
        } else {
            this._mainWindow.loadFile(
                join(__dirname, '../renderer/index.html'),
            );
        }
    }
}
