import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import SpeechToTextUIWithTranslation from './SpeechToTextUIWithTranslation';
import './index.css';

// Function to show notifications
const showNotification = (message, duration = 3000) => {
  const notification = document.getElementById('notification');
  notification.textContent = message;
  notification.classList.add('show');

  setTimeout(() => {
    notification.classList.remove('show');
  }, duration);
};

// Main App component
const App = () => {
  // Set up notifications for clipboard actions
  useEffect(() => {
    if (window.speechToText?.onTextCopied) {
      const unsubscribe = window.speechToText.onTextCopied(() => {
        showNotification('Text copied to clipboard. Press Ctrl+V to paste.');
      });
      
      return () => {
        unsubscribe();
      };
    }
  }, []);

  return (
    <div className="app-container">
      <SpeechToTextUIWithTranslation />
    </div>
  );
};

// Render the app
const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);