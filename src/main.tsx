import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

// Register PWA Service Worker for production caching and offline support
const updateSW = registerSW({
  onNeedRefresh() {
    // Automatically update service worker when new version is deployed
    updateSW(true);
  },
  onOfflineReady() {
    console.log('Phàm Trần Tiên Lộ – PWA Service Worker ready.');
  },
});

createRoot(document.getElementById('root')!).render(<App />);
