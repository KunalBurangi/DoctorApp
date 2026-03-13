import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { registerSW } from 'virtual:pwa-register';
import './index.css';
import App from './App.tsx';

// Register service worker for offline support
registerSW({
  onOfflineReady() {
    console.log('[PWA] App is ready to work offline');
  },
  onRegistered(registration) {
    console.log('[PWA] Service worker registered', registration);
  },
  onRegisterError(error) {
    console.error('[PWA] Service worker registration error', error);
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
);
