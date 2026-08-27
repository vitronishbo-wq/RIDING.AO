import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// -----------------------------------------------------------------------------
// ZERO-INCONSISTENCY DEPLOY RECOVERY: Handles dynamic import failures when a
// new deployment replaces previous hashed chunks.
// -----------------------------------------------------------------------------
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    const errorMsg = event?.message || '';
    const isChunkLoadFailed =
      errorMsg.includes('Failed to fetch dynamically imported module') ||
      errorMsg.includes('Loading chunk') ||
      errorMsg.includes('Importing a module script failed');

    if (isChunkLoadFailed) {
      const storageKey = 'riding_chunk_reload_attempt';
      const lastAttempt = sessionStorage.getItem(storageKey);
      const now = Date.now();

      // Prevent infinite reload loops (only reload once every 15 seconds)
      if (!lastAttempt || now - Number(lastAttempt) > 15000) {
        sessionStorage.setItem(storageKey, String(now));
        console.warn('[RIDING Deploy Sync] Detected stale chunk asset after new deployment. Performing atomic cache refresh...');
        window.location.reload();
      }
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

