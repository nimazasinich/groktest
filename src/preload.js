const { contextBridge, ipcRenderer } = require('electron');

// Define the API for renderer process
contextBridge.exposeInMainWorld('speechToText', {
  // Toggle recording event listener from main process
  onToggleRecording: (callback) => {
    ipcRenderer.on('toggle-recording', callback);
    return () => ipcRenderer.removeListener('toggle-recording', callback);
  },
  
  // Insert text (copy to clipboard)
  pasteText: (text) => {
    ipcRenderer.send('paste-text', text);
  },
  
  // Notification when text is copied to clipboard
  onTextCopied: (callback) => {
    ipcRenderer.on('text-copied', (_, text) => callback(text));
    return () => ipcRenderer.removeListener('text-copied', callback);
  },
  
  // Hide the app window
  minimizeApp: () => {
    ipcRenderer.send('minimize-app');
  },
  
  // Save transcripts to persistent storage
  saveTranscripts: (transcripts) => {
    ipcRenderer.send('save-transcripts', transcripts);
  },
  
  // Get saved transcripts from persistent storage
  getSavedTranscripts: async () => {
    return await ipcRenderer.invoke('get-saved-transcripts');
  },
  
  // Toggle minimized mode
  toggleMinimizedMode: (isMinimized) => {
    ipcRenderer.send('toggle-minimized-mode', isMinimized);
  },
  
  // Toggle always on top
  toggleAlwaysOnTop: (alwaysOnTop) => {
    ipcRenderer.send('toggle-always-on-top', alwaysOnTop);
  }
});

// Expose WebSpeech API availability
contextBridge.exposeInMainWorld('webSpeechSupported', 'webkitSpeechRecognition' in window);